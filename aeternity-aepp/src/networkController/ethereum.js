import Web3 from 'web3'
import contract from 'truffle-contract'
import artifacts from './SimpleVote.json'

const SimpleVote = contract(artifacts)

// HELPER

const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
  STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5

const ethereum = {
  network: "ethereum",
  address: null,
  height: null,
  stakeAtHeight: null,
  vote: {
    id: null,
    stakeHeight: null,
    endHeight: null
  },
  web3: null,
  status: null,
  activeOption: null,
  contractAddress: null,
  voteReceiverAddress: null,
  tokenContractAddress: '0x35d8830ea35e6Df033eEdb6d5045334A4e34f9f9' // TODO: This is Ethereum Kovan Network now, change to Ethereum main net.
}

ethereum.init = async (vote) => {
  try {
    if (window.ethereum) {
      await window.ethereum.enable();

      ethereum.web3 = new Web3(window.ethereum)
    } else if (typeof window.web3 !== 'undefined') {
      // Use Mist/MetaMask's provider
      ethereum.web3 = new Web3(window.web3.currentProvider)
    } else {
      return {
        success: false,
        message: 'Could not find any Ethereum client! Make you have your client configured correctly.'
      }
    }

    SimpleVote.setProvider(ethereum.web3.currentProvider)
    ethereum.vote = vote
    const accs = await ethereum.web3.eth.getAccounts()
    ethereum.height = (await ethereum.web3.eth.getBlock('latest')).number


    if (accs.length === 0) {
      return {
        success: false,
        message: 'Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.'
      }
    }

    ethereum.address = accs[0]
    await ethereum.updateEthBalance(ethereum.address)
    await ethereum.getTokenbalanceAtHeight()
    const { address } = await SimpleVote.deployed()
    ethereum.voteReceiverAddress = address

    return {
      success: true,
      message: ''
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      message: 'An error occurred. Make sure Metamask is configured correctly.'
    }
  }
}

ethereum.getCurrentStatus = async () => {
  const instance = await SimpleVote.deployed()
  const response = await instance.getVote(ethereum.address)
  const id = response.toNumber();

  if (typeof id !== 'number') {
    if (ethereum.height > ethereum.vote.endHeight) {
      ethereum.status = STATUS_VOTE_CLOSED
    } else {
      ethereum.status = STATUS_INITIAL
    }
  } else {
    ethereum.status = STATUS_VOTE_SUCCESS
    ethereum.activeOption = id
  }

  return {
    status: ethereum.status,
    activeOption: ethereum.activeOption
  }
}

ethereum.sendVote = async (id) => {
  try {
    const instance = await SimpleVote.deployed()
    await instance.vote(id, { from: ethereum.address })
    return {
      status: STATUS_VOTE_SUCCESS,
      activeOption: id
    }
  } catch (e) {
    console.warn(e)
    return false
  }
}

ethereum.getTokenbalanceAtHeight = async () => {
  const result = await ethereum.web3.eth.call({
    to: ethereum.tokenContractAddress,
    data: '0x70a08231000000000000000000000000' + ethereum.address.substring(2)
  })
  ethereum.stakeAtHeight = String(Number(result / Math.pow(10, 18)))
}

ethereum.updateEthBalance = async (acc) => {
  const balance = await ethereum.web3.eth.getBalance(acc)
  if (balance === 0) {
    ethereum.balance = '0'
  }
  ethereum.balance = (balance / Math.pow(10, 18)).toString()
}

export default ethereum
