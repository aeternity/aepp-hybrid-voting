import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'
import axios from 'axios'
import BigNumber from 'bignumber.js'

// HELPER
const atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(new BigNumber(1000000000000000000)).toFormat(4)
const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
  STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5

const aeternity = {
  network: "aeternity",
  client: null,
  address: null,
  height: null,
  stakeAtHeight: null,
  vote: {
    id: null,
    stakeHeight: null,
    endHeight: null,
    options: null
  },
  status: null,
  activeOption: null,
  voteReceiverAddress: 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB'
}

aeternity.initBase = async (vote) => {
  try {
    aeternity.client = await Aepp()
    return aeternity.initProvider(vote)
  } catch (e) {
    console.warn(e)
    return false
  }
}

aeternity.getWalletWindow = async () => {
  const iframe = document.createElement('iframe')
  iframe.src = prompt('DEBUG: Enter wallet URL', 'https://stage-identity.aepps.com/')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  await new Promise(resolve => {
    const handler = ({ data }) => {
      if (data.method !== 'ready') return
      window.removeEventListener('message', handler)
      resolve()
    }
    window.addEventListener('message', handler)
  })
  return iframe.contentWindow
}

aeternity.initLedger = async (vote) => {
  try {

    aeternity.client = await Aepp({
      parent: await aeternity.getWalletWindow()
    })
    return aeternity.initProvider(vote)
  } catch (e) {
    console.warn(e)
    return false
  }
}

aeternity.initProvider = async (vote) => {
  try {
    aeternity.address = await aeternity.client.address()
    aeternity.height = await aeternity.client.height()
    aeternity.stakeAtHeight = await aeternity.client.balance(aeternity.address, { height: aeternity.vote.stakeHeight })
      .then(balance => `${atomsToAe(balance)}`)
      .catch(() => '0')
    aeternity.balance = await aeternity.client.balance(aeternity.address)
      .then(balance => `${atomsToAe(balance)}`.replace(',',''))
      .catch(() => '0')
    aeternity.vote = vote
    return true
  } catch (e) {
    console.warn(e)
    return false
  }
}

aeternity.getCurrentStatus = async () => {
  const middlewareUrl = 'https://testnet.mdw.aepps.com/'
  const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${aeternity.address}/to/${aeternity.voteReceiverAddress}`).then(res => res.data.transactions)
  const filteredVotingTxs = votingAccTxs
    .filter(tx => tx.tx.type === 'SpendTx')
    .filter(tx => tx.tx.payload !== '')
    .filter(tx => tx.tx.sender_id === aeternity.address)
    .filter(tx => {
      try {
        const payload = JSON.parse(tx.tx.payload)
        return payload.vote && payload.vote.id && payload.vote.option && payload.vote.id === aeternity.vote.id
      } catch {
        return false
      }
    })
    .map(tx => {
      const payload = JSON.parse(tx.tx.payload)
      return {
        height: tx.block_height,
        nonce: tx.tx.nonce,
        txHash: tx.hash,
        account: tx.tx.sender_id,
        voteOption: payload.vote.option
      }
    })
    .filter(tx => tx.height <= aeternity.vote.endHeight)
    .sort((tx1, tx2) => tx2.nonce - tx1.nonce)

  if (filteredVotingTxs.length === 0) {
    if (aeternity.height > aeternity.vote.endHeight) {
      aeternity.status = STATUS_VOTE_CLOSED
    } else {
      aeternity.status = STATUS_INITIAL
    }
  } else {
    aeternity.status = STATUS_VOTE_SUCCESS
    aeternity.activeOption = aeternity.vote.options.find(voteOption => voteOption.id === filteredVotingTxs[0].voteOption)
  }

  return {
    status: aeternity.status,
    activeOption: aeternity.activeOption
  }
}

aeternity.sendVote = async (id) => {
  const vote = {
    vote: {
      id: aeternity.vote.id,
      option: id
    }
  }

  try {
    await aeternity.client.spend(0, aeternity.voteReceiverAddress, { payload: JSON.stringify(vote) })
    return {
      status: STATUS_VOTE_SUCCESS,
      activeOption: aeternity.vote.options.find(voteOption => voteOption.id === id)
    }
  } catch (e) {
    console.warn(e)
    return false
  }
}

export default aeternity
