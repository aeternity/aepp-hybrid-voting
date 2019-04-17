<template>
  <div class="flex flex-col mx-4">
    <h1 class="text-2xl text-center mt-8 font-bold">
      Question Question Question Question Question?
    </h1>
    <p class="text-xl mt-4 mb-6">
      Explanation Explanation Explanation Explanation Explanation Explanation.
    </p>

    <transition>
      <div v-if="showOptions">
        <div class="text-2xl font-bold text-green-500 text-center mb-4">
          Your stake at height {{votingStakeHeight}} is {{stakeAtHeight}}
        </div>

        <div v-for="voteOption in voteOptions">
          <AeButton extend class="my-4" fill="primary" face="round" @click="vote(voteOption.id)" :key="voteOption.name">
            {{voteOption.name}}
          </AeButton>
        </div>
      </div>
      <div class="" v-if="isLoading">
        <BiggerLoader></BiggerLoader>
      </div>
      <div v-if="isSuccessful">
        <div class="text-2xl font-bold text-green-500 text-center mb-4">
          ✔️ You voted for {{activeOption ? activeOption.name : '&nbsp;'}}
        </div>
        <div class="text-2xl font-bold text-green-500 text-center mb-4">
          ✔️ Your stake at height {{votingStakeHeight}} is {{stakeAtHeight}}
        </div>
        <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
          Change Vote
        </AeButton>
      </div>
      <div v-if="votingClosed">
        <div class="text-2xl font-bold text-500 text-center mb-4">
          Voting closed at height {{votingEndingHeight}}
        </div>
      </div>
      <div v-if="hasError">
        <div class="text-2xl font-bold text-red-500 text-center mb-4">
          ❌️ Your vote failed
        </div>
        <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
          Try again
        </AeButton>
      </div>
    </transition>

    <ae-backdrop class="p-6" v-show="hasActiveVote" @click.self.native.capture="removeVote">
      <ae-card @click.stop.prevent>
        <div class="w-full text-gray-900">
          <h1 class="text-2xl text-red text-center pt-4">Are you sure?</h1>
          <div class="text-base pt-4 text-center">
            You are voting for:
          </div>
          <div class="font-mono text-xl py-2 text-center">
            {{activeOption ? activeOption.name : '&nbsp;'}}
          </div>
          <div class="flex justify-center mt-6">
            <ae-button-group>
              <ae-button fill="secondary" face="round" @click="removeVote">Cancel</ae-button>
              <ae-button fill="primary" face="round" @click="sendVote">Confirm Vote</ae-button>
            </ae-button-group>
          </div>
        </div>
      </ae-card>
    </ae-backdrop>
  </div>
</template>

<script>
  import { AeBackdrop, AeButton, AeCard, AeButtonGroup } from '@aeternity/aepp-components/'
  import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'
  import BiggerLoader from '../components/BiggerLoader'
  import axios from 'axios'
  import BigNumber from 'bignumber.js'

  const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
    STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5

  export default {
    name: 'Home',
    components: { BiggerLoader, AeButtonGroup, AeBackdrop, AeButton, AeCard },
    data () {
      return {
        client: null,
        voteId: 1,
        height: 0,
        stakeAtHeight: 0,
        votingStakeHeight: 67000,
        votingEndingHeight: 80000,
        activeOption: null,
        status: STATUS_LOADING,
        voteOptions: [
          {
            id: 1,
            name: 'Option 1',
            address: 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB'
          },
          {
            id: 2,
            name: 'Option 2',
            address: 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB'
          },
          {
            id: 3,
            name: 'Option 3',
            address: 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB'
          }
        ]
      }
    },
    computed: {
      hasActiveVote () {
        return this.status === STATUS_VOTE_SELECTED
      },
      showOptions () {
        return this.status === STATUS_VOTE_SELECTED || this.status === STATUS_INITIAL
      },
      isLoading () {
        return this.status === STATUS_LOADING
      },
      isSuccessful () {
        return this.status === STATUS_VOTE_SUCCESS
      },
      hasError () {
        return this.status === STATUS_VOTE_FAIL
      },
      votingClosed () {
        return this.status === STATUS_VOTE_CLOSED
      }
    },
    methods: {
      vote (optionID) {
        this.activeOption = this.voteOptions.find(voteOption => voteOption.id === optionID)
        this.status = STATUS_VOTE_SELECTED
      },
      removeVote () {
        this.activeOption = null
        if (this.height > this.votingEndingHeight) {
          this.status = STATUS_VOTE_CLOSED
        } else {
          this.status = STATUS_INITIAL
        }
      },
      async sendVote () {
        const vote = {
          vote: {
            id: this.voteId,
            option: this.activeOption.id
          }
        }

        this.status = STATUS_LOADING
        try {
          await this.client.spend(0, this.activeOption.address, { payload: JSON.stringify(vote) })
          this.status = STATUS_VOTE_SUCCESS
        } catch (e) {
          this.status = STATUS_VOTE_FAIL
        }
      }
    },
    async created () {
      this.client = await Aepp()
      this.address = await this.client.address()
      this.height = await this.client.height()

      const atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(new BigNumber(1000000000000000000)).toFormat(4)
      this.stakeAtHeight = await this.client.balance(this.address, { height: this.votingStakeHeight })
        .then(balance => `${atomsToAe(balance)} AE`)
        .catch(() => '0 AE')

      const voteReceiver = 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB'

      const middlewareUrl = 'https://testnet.mdw.aepps.com/'
      const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${this.address}/to/${voteReceiver}`).catch(console.error).then(res => res.data.transactions)
      const filteredVotingTxs = votingAccTxs
        .filter(tx => tx.tx.type === 'SpendTx')
        .filter(tx => tx.tx.payload !== '')
        .filter(tx => tx.tx.sender_id === this.address)
        .filter(tx => {
          try {
            const payload = JSON.parse(tx.tx.payload)
            return payload.vote && payload.vote.id && payload.vote.option && payload.vote.id === this.voteId
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
        .filter(tx => tx.height <= this.votingEndingHeight)
        .sort((tx1, tx2) => tx2.nonce - tx1.nonce)

      if (filteredVotingTxs.length === 0) {
        if (this.height > this.votingEndingHeight) {
          this.status = STATUS_VOTE_CLOSED
        } else {
          this.status = STATUS_INITIAL
        }
      } else {
        this.status = STATUS_VOTE_SUCCESS
        this.activeOption = this.voteOptions.find(voteOption => voteOption.id === filteredVotingTxs[0].voteOption)
      }
    }
  }
</script>

<style scoped>

</style>
