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
        <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
          Change Vote
        </AeButton>
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
  import axios from 'axios';

  const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
    STATUS_VOTE_FAIL = 4

  export default {
    name: 'Home',
    components: {BiggerLoader, AeButtonGroup, AeBackdrop, AeButton, AeCard},
    data () {
      return {
        client: null,
        pollID: 1,
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
      }
    },
    methods: {
      vote (optionID) {
        this.activeOption = this.voteOptions.find(voteOption => voteOption.id === optionID)
        this.status = STATUS_VOTE_SELECTED
      },
      removeVote () {
        this.activeOption = null
        this.status = STATUS_INITIAL
      },
      async sendVote () {
        const vote = {
          vote: {
            id: this.pollID,
            option: this.activeOption.id
          }
        }

        this.status = STATUS_LOADING
        try {
          await this.client.spend(0, this.activeOption.address, {payload: JSON.stringify(vote)})
          this.status = STATUS_VOTE_SUCCESS
        } catch (e) {
          this.status = STATUS_VOTE_FAIL
        }
      }
    },
    async created () {
      this.client = await Aepp()
      this.address = await this.client.address();

      const voteReceiver = 'ak_2V5w6BVQYzP66VCtxQUfM9QJP2dN6bBENJXNsQTpqFcc5CDTNB';
      const middlewareUrl = "https://testnet.mdw.aepps.com/";
      const votingAccTxs = await axios.get(`${middlewareUrl}/middleware/transactions/account/${voteReceiver}`).catch(console.error).then(res => res.data.transactions);
      const filteredVotingTxs = votingAccTxs
        .filter(tx => tx.tx.type === 'SpendTx')
        .filter(tx => tx.tx.payload !== '')
        .filter(tx => tx.tx.sender_id === this.address)
        .filter(tx => {
          try {
            const payload = JSON.parse(tx.tx.payload);
            return payload.vote && payload.vote.id && payload.vote.option;
          } catch {
            return false;
          }
        })
        .map(tx => {
          const payload = JSON.parse(tx.tx.payload);
          return {
            account: tx.tx.sender_id,
            vote: payload.vote,
            tx: tx
          }
        })
        .sort((tx1, tx2) => tx1.block_height - tx2.block_height)

      if (filteredVotingTxs.length === 0) {
        this.status = STATUS_INITIAL
      } else {
        this.status = STATUS_VOTE_SUCCESS
        this.activeOption = this.voteOptions.find(voteOption => voteOption.id === filteredVotingTxs[0].vote.option)
      }
    }
  }
</script>

<style scoped>

</style>
