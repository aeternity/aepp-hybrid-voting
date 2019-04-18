import Web3 from 'web3'
import contract from 'truffle-contract'
import artifacts from './SimpleVote.json'

const SimpleVote = contract(artifacts)

// HELPER

const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
  STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5

const ethereum = {
  address: null,
  height: null,
  stakeAtHeight: null,
  vote: {
    id: null,
    stakeHeight: null,
    endHeight: null,
    options: null
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
      console.warn('Using web3 detected from external source. If you find that your accounts don\'t appear or you have 0 Fluyd, ensure you\'ve configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask')
      // Use Mist/MetaMask's provider
      ethereum.web3 = new Web3(window.web3.currentProvider)
    }

    SimpleVote.setProvider(ethereum.web3.currentProvider)

    const accs = await ethereum.web3.eth.getAccounts()
    ethereum.height = (await ethereum.web3.eth.getBlock('latest')).number
    ethereum.vote = vote

    if (accs.length === 0) {
      console.warn('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.')
      return false
    }

    ethereum.address = accs[0]
    await ethereum.updateEthBalance(ethereum.address)
    await ethereum.getTokenbalanceAtHeight()
    const { address } = await SimpleVote.deployed()
    ethereum.voteReceiverAddress = address

    return true
  } catch (e) {
    console.warn(e)
    console.warn('There was an error fetching your accounts. Do you have Metamask, Mist installed or an Ethereum node running? If not, you might want to look into that')
    return false
  }
}

ethereum.getCurrentStatus = async () => {
  const instance = await SimpleVote.deployed()
  const response = await instance.getVote(ethereum.address)
  const activeOption = {
    id: response.toNumber()
  }


  if (!activeOption.id) {
    if (ethereum.height > ethereum.vote.endHeight) {
      console.log("CLOSED")
      ethereum.status = STATUS_VOTE_CLOSED
    } else {
      ethereum.status = STATUS_INITIAL
    }
  } else {
    ethereum.status = STATUS_VOTE_SUCCESS
  }

  return {
    status: ethereum.status,
    activeOption: activeOption
  }
}

ethereum.sendVote = async (id) => {
  try {
    const instance = await SimpleVote.deployed()
    await instance.vote(id, { from: ethereum.address })
    return true
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
  ethereum.stakeAtHeight = Number(result / Math.pow(10, 18))
}

ethereum.updateEthBalance = async (acc) => {
  const balance = await ethereum.web3.eth.getBalance(acc)
  // TODO: Check for minimal value a user should have to successfully make a transaction, maybe take gas price into account.
  if (balance === 0) {
    ethereum.balance = '0'
    throw Error('Your account does not have any Ether, ask a friend ?')
  }
  ethereum.balance = (balance / Math.pow(10, 18)).toString()
}

export default ethereum
