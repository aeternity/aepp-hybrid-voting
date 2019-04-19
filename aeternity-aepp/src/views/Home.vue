<template>
  <div>
    <div class="flex flex-col mx-4">
      <div class="bg-white rounded-t-lg p-4 mt-4 shadow" v-if="provider">
        <div>
          <div class="label mb-2">
            Account Key
          </div>
          <ae-identity-light :balance="provider.network === 'aeternity' ? Number(provider.balance) : Number(provider.stakeAtHeight)"
                             :address="provider.address" :active="true"/>
          <hr class="border-t border-gray-200"/>
          <div class="label mb-2">
            Voting power at block {{provider.vote.stakeHeight}}
          </div>
          <ae-text face="mono-base">
            {{provider.stakeAtHeight}} AE
          </ae-text>
        </div>
      </div>
      <div class="bg-gray-300 rounded-b-lg p-3 cursor-pointer flex justify-center">
        <a href="https://forum.aeternity.com/" class="label text-sm">NEED ASSISTANCE?</a>
      </div>
    </div>
    <!-- DIVIDER -->
    <div class="m-4">
      <div class="relative flex justify-center">
        <hr class="w-full absolute left-0 z-0 border-t" style="top: .5rem">
        <div class="label z-10 p-2" style="background-color: #f7fafc">
          OPEN POLLS
        </div>
      </div>
    </div>
    <!-- POLL -->
    <div class="flex flex-col mx-4">
      <div class="rounded-t-lg p-4 shadow" v-if="provider" style="background-color: #001833">
        <h1 class="text-xl text-white">
          Question Question Question Question Question?
        </h1>
        <p class="text-gray-400 mt-2 mb-2">
          Explanation Explanation Explanation Explanation Explanation Explanation.
        </p>
        <hr class="border-t border-gray-800"/>
        <div class="w-full flex justify-center">
          <div class="label" v-if="provider && provider.network === 'ethereum'">
            {{provider.vote.endHeight - provider.height}} Blocks and
            ~{{Math.round((provider.vote.endHeight - provider.height) * 13 / 60 / 60 / 24)}} Days left
          </div>
          <div class="label" v-if="provider && provider.network === 'aeternity'">
            {{provider.vote.endHeight - provider.height}} Blocks and
            ~{{Math.round((provider.vote.endHeight - provider.height) * 3 / 60 / 24)}} Days left
          </div>
        </div>
      </div>
      <div class="bg-white rounded-b-lg shadow">
        <div v-if="isSuccessful" class="p-4">
          <div class="px-4 pt-2">
            <div class="label">
              Your vote
            </div>
            <div class="mt-2">
              {{activeOption ? activeOption.name : '&nbsp;'}}
            </div>
            <div class="text-gray-700">
              Explanation Explanation Explanation Explanation Explanation Explanation.
            </div>
          </div>
        </div>
        <div v-if="showOptions" class="py-4">
          <div v-for="(voteOption, index) in voteOptions">
            <div class="flex flex-row items-start p-4">
              <ae-check v-model="selectedId" :value="voteOption.id" type="radio">
                <div class="ml-2">
                  <div>
                    {{voteOption.name}}
                  </div>
                  <div class="text-gray-700" style="font-size: 15px">
                    Explanation Explanation Explanation Explanation Explanation Explanation.
                  </div>
                </div>
              </ae-check>
            </div>
            <hr v-if="index !== voteOptions.length - 1" class="border-t border-gray-400"/>
          </div>
        </div>

        <div class="flex w-full h-full justify-center items-center my-8" v-if="isLoading">
          <BiggerLoader></BiggerLoader>
        </div>

      </div>
      <!-- BUTTONS -->

      <div v-if="isSuccessful" class="w-full flex justify-center">
        <AeButton class="my-4" fill="primary" face="round" @click="removeVote">
          Change your vote
        </AeButton>
      </div>
      <div v-if="showOptions" class="w-full flex justify-center">
        <AeButton class="my-4" fill="primary" face="round" @click="sendVote">
          Confirm
        </AeButton>
      </div>

      <transition>

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
    </div>
  </div>
</template>

<script>
  import { AeBackdrop, AeButton, AeCard, AeButtonGroup } from '@aeternity/aepp-components/'
  import BiggerLoader from '../components/BiggerLoader'
  import aeternity from '../networkController/aeternity'
  import ethereum from '../networkController/ethereum'
  import AeLoader from '@aeternity/aepp-components/src/components/aeLoader/aeLoader'
  import AeText from '@aeternity/aepp-components/src/components/ae-text/ae-text'
  import AeIdentityLight from '@aeternity/aepp-components/src/components/aeIdentityLight/aeIdentityLight'
  import AeCheck from '@aeternity/aepp-components/src/components/ae-check/ae-check'

  const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
    STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5, STATUS_ERROR = 6

  export default {
    name: 'Home',
    components: {
      AeCheck,
      AeIdentityLight,
      AeText,
      AeLoader,
      BiggerLoader,
      AeButtonGroup,
      AeBackdrop,
      AeButton,
      AeCard
    },
    data () {
      return {
        client: null,
        error: null,
        voteId: 1,
        height: 0,
        activeOption: null,
        status: STATUS_LOADING,
        provider: null,
        selectedId: null,
        voteOptions: [
          {
            id: 1,
            name: 'Option 1',
          },
          {
            id: 2,
            name: 'Option 2',
          },
          {
            id: 3,
            name: 'Option 3',
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
      removeVote () {
        this.activeOption = null
        this.status = STATUS_INITIAL
      },
      async sendVote () {
        this.status = STATUS_LOADING
        try {
          const result = await this.provider.sendVote(this.selectedId)
          if (result) {
            console.log(result)
            this.status = STATUS_VOTE_SUCCESS
            this.activeOption = result.activeOption
          }
          else this.status = STATUS_VOTE_FAIL
        } catch (e) {
          this.status = STATUS_VOTE_FAIL
        }
      }
    },
    async created () {

      if (window.parent !== window) {
        const success = await aeternity.init({
          id: this.voteId,
          stakeHeight: 67000,
          endHeight: 80000,
          options: this.voteOptions
        })
        if (success) this.provider = aeternity
        else console.warn('Could not init aeternity')
      }

      if (!this.provider) {
        const success = await ethereum.init({
          id: this.voteId,
          stakeHeight: 10754080,
          endHeight: 11769152,
          options: this.voteOptions
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
  .label {
    font-size: 13px;
    line-height: 1.23;
    color: #76818c;
  }
</style>
