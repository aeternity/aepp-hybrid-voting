import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'
import axios from 'axios'
import BigNumber from 'bignumber.js'

// HELPER
const atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(new BigNumber(1000000000000000000)).toFormat(4)

const aeternity = {
  network: 'aeternity',
  client: null,
  address: null,
  height: null,
  stakeAtHeight: null,
  vote: {
    id: null,
    stakeHeight: null,
    endHeight: null
  },
  status: null,
  activeOption: null,
  voteReceiverAddress: 'ak_11111111111111111111111111111111273Yts'
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
  iframe.src = 'https://base.aepps.com/' // https://stage-identity.aepps.com/
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
    aeternity.vote = vote
    aeternity.address = await aeternity.client.address()
    aeternity.height = await aeternity.client.height()
    aeternity.balance = await aeternity.client.balance(aeternity.address)
      .then(balance => `${atomsToAe(balance)}`.replace(',', ''))
      .catch(() => '0')
    const requestedHeight = Math.min(aeternity.height, aeternity.vote.stakeHeight);
    aeternity.stakeAtHeight = await aeternity.client.balance(aeternity.address, { height: requestedHeight })
      .then(balance => `${atomsToAe(balance)}`)
      .catch(() => '0')

    return true
  } catch (e) {
    console.warn(e)
    return false
  }
}

aeternity.getActiveVote = async () => {
  let filteredVotingTxs = []
  try {
    const middlewareUrl = 'https://mainnet.mdw.aepps.com'
    const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${aeternity.address}/to/${aeternity.voteReceiverAddress}`).then(res => res.data.transactions)
    filteredVotingTxs = votingAccTxs
      .filter(tx => tx.tx.type === 'SpendTx')
      .filter(tx => tx.tx.payload !== '')
      .filter(tx => tx.tx.sender_id === aeternity.address)
      .filter(tx => {
        try {
          const payload = JSON.parse(tx.tx.payload)
          return payload.vote && payload.vote.id && payload.vote.option !== undefined && payload.vote.id === aeternity.vote.id
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

  } catch (e) {
    return false
  }

  if (filteredVotingTxs.length === 0) {
    return false
  } else {
    return filteredVotingTxs[0].voteOption
  }
}

aeternity.isVoteOpen = () => {
  return aeternity.height < aeternity.vote.endHeight
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
    return id
  } catch (e) {
    console.warn(e)
    return false
  }
}

aeternity.verifyAddress = async () => {
  const currAddress = await aeternity.client.address()
  return currAddress !== aeternity.address
}

export default aeternity
