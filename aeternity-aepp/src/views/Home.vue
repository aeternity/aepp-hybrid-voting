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
          Your stake at height {{provider.vote.stakeHeight}} is {{provider.stakeAtHeight}}
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
          ✔️ Your stake at height {{provider.vote.stakeHeight}} is {{provider.stakeAtHeight}}
        </div>
        <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
          Change Vote
        </AeButton>
      </div>
      <div v-if="votingClosed">
        <div class="text-2xl font-bold text-500 text-center mb-4">
          Voting closed at height {{provider.vote.endHeight}}
        </div>
      </div>
      <div v-if="hasVotingError">
        <div class="text-2xl font-bold text-red-500 text-center mb-4">
          ❌️ Your vote failed
        </div>
        <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
          Try again
        </AeButton>
      </div>
      <div v-if="hasGeneralError">
        <div class="text-2xl font-bold text-red-500 text-center mb-4">
          <h2>Error</h2>
          <div>
            {{error}}
          </div>
        </div>
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
  import BiggerLoader from '../components/BiggerLoader'
  import aeternity from '../networkController/aeternity'
  import ethereum from '../networkController/ethereum'

  const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
    STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5, STATUS_ERROR = 6

  export default {
    name: 'Home',
    components: { BiggerLoader, AeButtonGroup, AeBackdrop, AeButton, AeCard },
    data () {
      return {
        client: null,
        error: null,
        voteId: 1,
        height: 0,
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
      hasVotingError () {
        return this.status === STATUS_VOTE_FAIL
      },
      hasGeneralError () {
        return this.status === STATUS_ERROR
      },
      votingClosed () {
        return this.status === STATUS_VOTE_CLOSED
      }
    },
    methods: {
      vote (optionID) {
        this.activeOption = this.voteOptions.find(voteOption => voteOption.id === optionID)
        this.status = STATUS_VOTE_SELECTED
        this.sendVote()
      },
      removeVote () {
        this.activeOption = null
        this.status = STATUS_INITIAL
      },
      async sendVote () {
        this.status = STATUS_LOADING
        try {
          const result = await this.provider.sendVote(this.activeOption.id)
          if (result) this.status = STATUS_VOTE_SUCCESS
          else this.status = STATUS_VOTE_FAIL
        } catch (e) {
          this.status = STATUS_VOTE_FAIL
        }
      }
    },
    async created () {

      console.log('Trying')
      if (window.parent !== window) {
        const success = await aeternity.init({
          id: this.voteId,
          stakeHeight: 67000,
          endHeight: 80000
        })
        console.log('HERE ')
        if (success) this.provider = aeternity
        else console.warn('Could not init aeternity')
      }

      if (!this.provider) {
        console.log('Trying1')
        const success = await ethereum.init({
          id: this.voteId,
          stakeHeight: 10754080,
          endHeight: 11769152
        })
        if (success) this.provider = ethereum
        else console.warn('Could not init ethereum')
      }

      const result = await this.provider.getCurrentStatus()
      this.activeOption = result.activeOption

      console.log(String(this.provider.balance))
      if (String(this.provider.balance) === '0') {
        this.status = STATUS_ERROR
        this.error = 'Your balance is 0, please add tokens to your account'
      } else {
        this.status = result.status
      }

    }
  }
</script>

<style scoped>

</style>
