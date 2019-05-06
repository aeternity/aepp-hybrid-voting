import Web3 from 'web3'
import SimpleVoteABI from './SimpleVote.json'
import AETokenABI from './AEToken.json'
import axios from 'axios'

let AEToken = null
let SimpleVote = null
// HELPER

const ethereum = {
  network: 'ethereum',
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
  votingContractAddress: '0x863d8e96B5D00d2342fc46c527B002326b9813c2', // MAINNET
  // votingContractAddress: '0xe91995f7766630f4d654a0c44ac562a60b61bacc', //TESTNET
  tokenContractAddress: '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d'  // MAINNET
  // tokenContractAddress: '0x35d8830ea35e6Df033eEdb6d5045334A4e34f9f9' // TESTNET
}

ethereum.init = async (vote) => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      await window.ethereum.enable()

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

    AEToken = new ethereum.web3.eth.Contract(AETokenABI, ethereum.tokenContractAddress)
    SimpleVote = new ethereum.web3.eth.Contract(SimpleVoteABI, ethereum.votingContractAddress)

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
    let tokenHeight = Math.min(ethereum.height, ethereum.vote.stakeHeight)
    const result = await AEToken.methods.balanceOf(ethereum.address).call(tokenHeight)

    let burnedTokens = 0
    // get burned tokens
    try {
      const result = await axios.get(`https://api.backendless.com/CBD0589C-4114-2D15-FF41-6FC7F3EE8800/39EBBD6D-5A94-0739-FF27-B17F3957B700/data/migrations?props=SUM(value)&where=from%20%3D%20%27${ethereum.address}%27%20%26%26%20deliveryPeriod%20%3D%20%272%27`)
      burnedTokens = result.data[0].sum !== null ? result.data[0].sum : 0
    } catch (e) {
      console.warn('Could not fetch burned token balance')
    }
    ethereum.stakeAtHeight = String(Number(result / Math.pow(10, 18)) + Number(burnedTokens / Math.pow(10, 18)))

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

ethereum.getActiveVote = async () => {
  try {
    const hasVoted = await SimpleVote.methods.hasVoted(ethereum.address).call()
    if (!hasVoted) {
      return null
    }

    const id = await SimpleVote.methods.getVote(ethereum.address).call()
    if (typeof id === 'undefined') {
      return null
    } else {
      return Number(id)
    }

  } catch (e) {
    console.error(e)
    return null
  }

}

ethereum.isVoteOpen = () => {
  return Date.now() < 1557871200000
}

ethereum.sendVote = async (id) => {
  try {
    const response = await SimpleVote.methods.vote(id).send({ from: ethereum.address }).catch(e => console.error(e))
    if (response) {
      return id
    } else {
      return false
    }
  } catch (e) {
    console.error(e)
    return false
  }
}

ethereum.updateEthBalance = async (acc) => {
  const balance = await ethereum.web3.eth.getBalance(acc)
  if (balance === 0) {
    ethereum.balance = '0'
  }
  ethereum.balance = (balance / Math.pow(10, 18)).toString()
}

ethereum.verifyAddress = async () => {
  const accs = await ethereum.web3.eth.getAccounts()
  return accs[0] !== ethereum.address
}

export default ethereum
