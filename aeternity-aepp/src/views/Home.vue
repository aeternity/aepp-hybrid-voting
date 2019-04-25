<template>
  <div>
    <div v-if="hasGeneralError" class=" mx-4 mt-4 bg-white rounded-lg p-4 shadow">
      <div class="font-bold text-red-500 mb-4">
        <h2 class="text-2xl">Error</h2>
        <div>
          {{error}}
        </div>
      </div>
    </div>
    <!-- NORMAL HEADER -->
    <div class="flex flex-col mx-4 mt-4" v-if="provider">
      <div class="bg-white rounded-t-lg p-4 shadow">
        <div>
          <div class="label mb-2">
            Account
          </div>
          <ae-identity-light
            :balance="Number(provider.balance)"
            :currency="provider.network === 'aeternity' ? 'AE' : 'ETH'"
            :address="provider.address" :active="true"
          />
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
        <a href="https://forum.aeternity.com/" target="_blank" class="label text-sm">NEED ASSISTANCE?</a>
      </div>
    </div>
    <!-- NO ACCOUNT FOUND HEADER -->
    <div class="flex flex-col mx-4 mt-4" v-if="initFailed">
      <div class="bg-white border-l-4 rounded-tr-lg p-4 mt-4 shadow" style="border-color: #ff0d6a">
        <div>
          <div class="label mb-2">
            Account Key
          </div>
          <div class="flex">
            <div class="opacity-25 flex items-center">
              <ae-identicon address=""></ae-identicon>
            </div>
            <div class="flex flex-col ml-2">
              <div class="-mb-1">No Account found</div>
              <div class="text-sm text-gray-500">Could not connect to your wallet</div>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-gray-300 rounded-b-lg flex flex-col justify-center ">
        <div class="helpRow" @click="activeHelp = activeHelp === 1 ? null : 1">
          <span>How to vote with ERC20 Token on Etherum?</span>
          <span class="text-3xl ae-text-color" v-if="activeHelp !== 1">+</span>
          <span class="text-3xl ae-text-color" v-if="activeHelp === 1">&times;</span>
        </div>
        <div class="text-gray-700 transition" :class="{transitionVisible: activeHelp === 1}">
          <div class="p-4 pt-0">
            EXTENDED CONTENT
          </div>
        </div>
        <div class="helpRow" @click="activeHelp = activeHelp === 2 ? null : 2">
          <span>How to vote with AE on æternity?</span>
          <span class="text-3xl ae-text-color" v-if="activeHelp !== 2">+</span>
          <span class="text-3xl ae-text-color" v-if="activeHelp === 2">&times;</span>
        </div>
        <div class="text-gray-700 transition" :class="{transitionVisible: activeHelp === 2}">
          <div class="p-4 pt-0">
            EXTENDED CONTENT
          </div>
        </div>
        <div class="helpRow" @click="activeHelp = activeHelp === 3 ? null : 3">
          <span>How to vote with token in migration phase?</span>
          <span class="text-3xl ae-text-color" v-if="activeHelp !== 3">+</span>
          <span class="text-3xl ae-text-color" v-if="activeHelp === 3">&times;</span>
        </div>
        <div class="text-gray-700 transition" :class="{transitionVisible: activeHelp === 3}">
          <div class="p-4 pt-0">
            EXTENDED CONTENT
          </div>
        </div>
        <div class="p-4 border-t border-gray-400 flex justify-center">
          <a href="https://forum.aeternity.com/" class="label text-sm">NEED ASSISTANCE?</a>
        </div>
      </div>
    </div>
    <!-- LOADER -->
    <div v-if="!provider && !initFailed" class="my-10">
      <BiggerLoader></BiggerLoader>
    </div>
    <!-- DIVIDER -->
    <div class="m-4">
      <div class="relative flex justify-center">
        <hr class="w-full absolute left-0 z-0 border-t" style="top: .5rem">
        <div class="label z-10 p-2" style="background-color: #F1F4F7">
          OPEN POLLS
        </div>
      </div>
    </div>
    <!-- POLL -->
    <div class="flex flex-col mx-4">
      <div class="rounded-t-lg p-4 shadow" style="background-color: #001833">
        <h1 class="text-xl text-white">
          Question Question Question Question Question?
        </h1>
        <p class="text-gray-400 mt-2 mb-2">
          Explanation Explanation Explanation Explanation Explanation Explanation.
        </p>
        <hr class="border-t border-gray-800" v-if="provider"/>
        <div class="w-full flex justify-center" v-if="provider">
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
              Foundation Reward: {{activeOption}} %
            </div>
            <div class="text-gray-700">
              Explanation Explanation Explanation Explanation Explanation Explanation.
            </div>
          </div>
        </div>
        <div v-if="showOptions" class="p-4">
          <!--
          <div v-for="(voteOption, index) in voteOptions">
            <div class="flex flex-row items-start p-4">
              <ae-check v-model="selectedId" :value="voteOption.id" :disabled="!provider" type="radio">
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
          -->
          <div class="my-3">
            <div class="flex justify-between">
              <div style="color: #76818c;">0%</div>
              <div>
                Select Foundation Reward
              </div>
              <div style="color: #76818c;">15%</div>
            </div>

            <div class="mt-1 mb-2">
              <AeRange steps="1" min="0" max="15" v-model="selectedId"></AeRange>
            </div>
            <div class="flex justify-center">
              <div class="text-center mt-2" style="width: 190px">
                <div class="text-xl">
                  Your Vote
                </div>
                <div class="flex justify-between">
                  <div>Mining Reward:</div>
                  <div class="font-bold">{{100-selectedId}}%</div>
                </div>
                <div class="flex justify-between">
                  <div>Foundation Reward:</div>
                  <div class="font-bold">{{selectedId}}%</div>
                </div>

              </div>
            </div>

          </div>

        </div>

        <div class="flex w-full h-full justify-center items-center py-6" v-if="isLoading">
          <BiggerLoader></BiggerLoader>
        </div>

        <div v-if="hasVotingError">
          <div class="text-2xl font-bold text-red-500 text-center my-8">
            &times; Voting transaction failed.
          </div>
        </div>

        <div v-if="hasVotingTimeout">
          <div class="text-5xl font-bold text-red-500 text-center my-8">
            <div style="line-height: 2rem;">
              &times;
            </div>
            <div class="text-xl">
              Voting transaction timeout. Please check your wallet provider to sign the transaction.
            </div>
          </div>
        </div>
        <div v-if="votingClosed">
          <div class="text-2xl font-bold text-center my-8">
            Voting closed at height {{provider.vote.endHeight}}
          </div>
        </div>
      </div>
      <!-- BUTTONS -->
      <div class="mt-2">
        <div v-if="isSuccessful" class="w-full flex justify-center">
          <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
            Change your vote
          </AeButton>
        </div>
        <div v-if="showOptions" class="w-full flex justify-center">
          <AeButton extend :disabled="!provider" class="my-4" fill="primary" face="round" @click="sendVote">
            Confirm
          </AeButton>
        </div>

        <div v-if="hasVotingError" class="w-full flex justify-center">
          <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
            Try again
          </AeButton>
        </div>

      </div>

    </div>
  </div>
</template>

<script>
  import { AeButton, AeIdenticon, AeText } from '@aeternity/aepp-components/'
  import BiggerLoader from '../components/BiggerLoader'
  import aeternity from '../networkController/aeternity'
  import ethereum from '../networkController/ethereum'
  import AeIdentityLight from '../components/AeIdentityLight'
  import AeRange from '../components/AeRange'

  const STATUS_INITIAL = 0, STATUS_VOTE_SELECTED = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
    STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5, STATUS_ERROR = 6, STATUS_INIT_FAILED = 7, STATUS_VOTE_TIMEOUT = 8

  export default {
    name: 'Home',
    components: {
      AeRange,
      AeIdenticon,
      AeIdentityLight,
      AeText,
      BiggerLoader,
      AeButton
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
        activeHelp: null,
        selectedId: 0
      }
    },
    computed: {
      showOptions () {
        return this.status === STATUS_VOTE_SELECTED || this.status === STATUS_INITIAL || this.status === STATUS_INIT_FAILED
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
      hasVotingTimeout () {
        return this.status === STATUS_VOTE_TIMEOUT
      },
      hasGeneralError () {
        return this.status === STATUS_ERROR
      },
      votingClosed () {
        return this.status === STATUS_VOTE_CLOSED
      },
      initFailed () {
        return this.status === STATUS_INIT_FAILED
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
          // TIMEOUT
          const result = await Promise.race([
            this.provider.sendVote(this.selectedId),
            new Promise(resolve => {
              setTimeout(() => {
                resolve('TIMEOUT')
              }, 60000)
            })
          ])

          if (result === 'TIMEOUT') {
            this.status = STATUS_VOTE_TIMEOUT
          } else if (result) {
            this.status = STATUS_VOTE_SUCCESS
            this.activeOption = result.activeOption
            this.selectedId = this.activeOption
          } else {
            this.status = STATUS_VOTE_FAIL
          }
        } catch (e) {
          this.status = STATUS_VOTE_FAIL
        }
      }
    },
    async mounted () {

      if (window.parent !== window) {
        const success = await aeternity.initBase({
          id: this.voteId,
          stakeHeight: 67000,
          endHeight: 80000
        })
        if (success) {
          this.provider = aeternity
        } else {
          console.warn('Could not init aeternity base')
        }
      }

      if ((window.ethereum || window.web3) && !this.provider) {
        const success = await ethereum.init({
          id: this.voteId,
          stakeHeight: 10754080,
          endHeight: 11769152
        })
        if (success) this.provider = ethereum
        else {
          console.warn('Could not init ethereum')
        }
      }

      if (!this.provider) {
        // Try Ledger
        const success = await aeternity.initLedger({
          id: this.voteId,
          stakeHeight: 67000,
          endHeight: 80000
        })

        if (success) this.provider = aeternity
        else {
          this.status = STATUS_INIT_FAILED
          return console.warn('Could not init aeternity ledger')
        }
      }

      const result = await this.provider.getCurrentStatus()
      this.activeOption = result.activeOption
      this.selectedId = this.activeOption ? this.activeOption : this.selectedId

      if (String(this.provider.balance) === '0') {
        this.status = STATUS_ERROR
        this.error = `Your balance is 0 ${this.provider.network === 'aeternity' ? 'AE' : 'ETH'}, please add tokens to your account`
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

  .helpRow {
    @apply cursor-pointer border-t border-gray-400 p-4 py-2 flex justify-between items-center text-gray-700
  }

  .ae-text-color {
    color: #ff0d6a;
  }
</style>
