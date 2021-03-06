<template>
  <div>
    <!-- error -->
    <div class="flex justify-center fixed items-start bottom-0 left-0 top-0 right-0 z-50"
         style="background-color: rgba(255, 255, 255, 0.8);" v-if="statusError">
      <div class="bg-white rounded-lg p-8 shadow-lg mx-4" style="margin-top: 10%; max-width: 500px;">
        <div class="text-xl">
          {{error.headline}}
        </div>
        <div class="text-red-500 mb-6" v-html="error.text">
        </div>
        <AeButton fill="secondary" extend face="round" @click="error.cb">
          {{error.cta}}
        </AeButton>
      </div>
    </div>
    <!-- initial overlay -->
    <div class="flex justify-center fixed items-start bottom-0 left-0 top-0 right-0 z-50"
         style="background-color: rgba(255, 255, 255, 0.8);" v-if="(isLoading || isInitial) && !provider">
      <div class="bg-white rounded-lg p-8 shadow-lg mx-4" style="margin-top: 10%; max-width: 500px;">
        <div v-if="isInitial">
          <div v-if="!isMobile()">
            <div class="text-xl">
              Lets get started!
            </div>
            <div>
              What wallet would you like to connect?
            </div>
            <div class="flex flex-col mt-6 h-48 justify-between">
              <ae-check type="radio" value="ledger" v-model="selectedClient">
                <div class="ml-3">
                  <strong>Ledger</strong><br/>
                  for aeternity Mainnet Tokens
                </div>
              </ae-check>
              <ae-check type="radio" value="baseaepp" v-model="selectedClient">
                <div class="ml-3">
                  <strong>Base aepp (incl. AirGap Vault)</strong><br/>
                  for aeternity Mainnet Tokens
                </div>
              </ae-check>
              <ae-check type="radio" value="metamask" v-model="selectedClient">
                <div class="ml-3">
                  <strong>MetaMask (e.g. using Ledger)</strong><br/>
                  for aeternity ERC-20 Tokens
                </div>
              </ae-check>
            </div>
            <div class="mt-6">
              <AeButton :disabled="!selectedClient" fill="primary" extend face="round" @click="connectWallet">
                Connect
              </AeButton>
            </div>
          </div>
          <!-- MOBILE -->
          <div v-else>
            <div class="text-xl">
              Voting with the aeternity Base aepp
            </div>
            <div class="mt-4">
              On mobile devices only the aeternity Base aepp is supported. Please visit
              <a class="text-blue-600 clearfix w-full text-center block my-4" target="_blank"
                 href="https://base.aepps.com">https://base.aepps.com</a>
              or open this page on a desktop browser.
            </div>
            <div class="mt-6">
              <AeButton fill="primary" extend face="round" @click="openBaseAepp">
                Open Base aepp
              </AeButton>
            </div>
          </div>
        </div>
        <div v-if="isLoading">
          <BiggerLoader></BiggerLoader>
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
            :collapsed="provider && selectedClient === 'baseaepp'"
            :balance="Number(provider.balance)"
            :currency="provider.network === 'aeternity' ? 'AE' : 'ETH'"
            :address="provider.address" :active="true"
          />
          <hr class="border-t border-gray-200"/>
          <div class="label mb-2">
            <template v-if="!votingClosed">
              Estimated voting power at block {{provider.vote.stakeHeight}}
            </template>
            <template v-else>
              Voting power at block {{provider.vote.stakeHeight}}
            </template>
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
              <div class="text-sm text-gray-500">Connect to your wallet below.</div>
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
          <span>How to vote with AE on aeternity?</span>
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
    <!-- DIVIDER -->
    <div class="m-4">
      <div class="relative flex justify-center">
        <hr class="w-full absolute left-0 z-0 border-t" style="top: .5rem">
        <div class="label z-10 p-2" style="background-color: #F1F4F7">
          OPEN POLLS
        </div>
      </div>
    </div>
    <!-- POLLHEADER -->
    <div class="flex flex-col mx-4">
      <div class="rounded-t-lg p-4 shadow" style="background-color: #001833">
        <h1 class="text-xl text-white">
          Block Reward Initiative (BRI)
        </h1>
        <p class="text-gray-400 mt-2 mb-2">
          To transform aeternity into a self-sustaining platform, we propose the Block Reward Initiative (BRI), through
          which <span class="no-wrap">0 to 20%</span> of miner rewards will be allocated to development.
        </p>
        <p class="text-gray-400 font-bold mt-2 mb-2">
          Further Information:
        </p>
        <div class="text-gray-400 information-links mt-2 mb-2">
          <a target="_blank"
             href="https://blog.aeternity.com/aeternity-first-on-chain-governance-vote-decentralization-2-0-5e0c8a01891a">
            Detailed Explanation in Blog Post</a>
        </div>
        <div class="text-gray-400 information-links mt-2 mb-2">
          <a target="_blank"
             href="https://forum.aeternity.com/t/discussion-block-reward-initiative-and-first-on-chain-governance-vote/3278/47">
            Community Discussion in Forum</a>
        </div>
        <hr class="border-t border-gray-800" v-if="provider"/>
        <div class="w-full flex justify-center" v-if="provider">
          <div class="label" v-if="!votingClosed">
            ~{{Math.round((1557871200000 - Date.now()) / 1000 / 60 / 60 / 24)}} Days left, ends
            {{new Date(1557871200000).toDateString()}} at {{new Date(1557871200000).toLocaleTimeString()}}
          </div>
          <div v-else class="label">
            Vote closed on {{new Date(1557871200000).toDateString()}} at {{new Date(1557871200000).toLocaleTimeString()}}
          </div>
        </div>
      </div>
      <!-- POLLBODY -->
      <div class="bg-white rounded-b-lg shadow">
        <div v-if="isSuccessful || (activeOption !== null && votingClosed)" class="p-4">
          <div class="px-4 pt-2">
            <div class="label">
              Your Vote
            </div>
            <div class="mt-2">
              Development Reward: <span class="font-bold">{{activeOption}}%</span>
            </div>
            <div v-if="activeOption === 0">
              You did vote <span class="font-bold">AGAINST</span> sharing mining reward.
            </div>
            <div v-else>
              You did vote <span class="font-bold">FOR</span> sharing {{activeOption}}% of mining reward.
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
                Block Reward Share
              </div>
              <div style="color: #76818c;">20%</div>
            </div>

            <div class="mt-1 mb-2">
              <AeRange steps="1" min="0" max="20" v-model="selectedId"></AeRange>
            </div>
            <div class="flex justify-center">
              <div class="text-center mt-2" style="width: 220px">
                <div class="text-xl">
                  Your Vote
                </div>
                <div class="flex justify-between">
                  <div>Miner Reward:</div>
                  <div class="font-bold">{{100-selectedId}}%</div>
                </div>
                <div class="flex justify-between mb-2">
                  <div>Development Reward:</div>
                  <div class="font-bold">{{selectedId}}%</div>
                </div>
                <div class="flex align-left">
                  <div v-if="selectedId === 0">
                    You will vote <span class="font-bold">AGAINST</span><br/>
                    sharing mining reward.
                  </div>
                  <div v-else>
                    You will vote <span class="font-bold">FOR</span><br/>
                    sharing mining reward.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- LOADER AND ERRORS IN POLL BODY -->
        <div class="flex w-full h-full justify-center items-center py-6" v-if="isLoading && provider">
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
        <div v-if="activeOption === null && votingClosed">
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
            CONFIRM YOUR VOTE
          </AeButton>
        </div>

        <div v-if="hasVotingError || hasVotingTimeout" class="w-full flex justify-center">
          <AeButton extend class="my-4" fill="primary" face="round" @click="removeVote">
            Try again
          </AeButton>
        </div>

        <div v-if="votingClosed" class="w-full flex justify-center">
          <AeButton extend :disabled="true" class="my-4" fill="primary" face="round" @click="sendVote">
            Voting closed
          </AeButton>
        </div>

      </div>

    </div>
  </div>
</template>

<script>
  import {AeButton, AeIdenticon, AeText} from '@aeternity/aepp-components/'
  import BiggerLoader from '../components/BiggerLoader'
  import aeternity from '../networkController/aeternity'
  import ethereum from '../networkController/ethereum'
  import AeIdentityLight from '../components/AeIdentityLight'
  import AeRange from '../components/AeRange'
  import AeBackdrop from '@aeternity/aepp-components/src/components/ae-backdrop/ae-backdrop'
  import AeCheck from '@aeternity/aepp-components/src/components/ae-check/ae-check'
  import {detect} from 'detect-browser'

  const STATUS_INITIAL = 0, STATUS_SHOW_OPTIONS = 1, STATUS_LOADING = 2, STATUS_VOTE_SUCCESS = 3,
    STATUS_VOTE_FAIL = 4, STATUS_VOTE_CLOSED = 5, STATUS_ERROR = 6, STATUS_INIT_FAILED = 7, STATUS_VOTE_TIMEOUT = 8

  export default {
    name: 'Home',
    components: {
      AeCheck,
      AeBackdrop,
      AeRange,
      AeIdenticon,
      AeIdentityLight,
      AeText,
      BiggerLoader,
      AeButton
    },
    data() {
      return {
        selectedClient: null,
        error: null,
        voteId: 1,
        activeOption: null,
        status: STATUS_LOADING,
        provider: null,
        activeHelp: null,
        selectedId: 10,
        storeKey: 'selectedWallet',
        interval: null
      }
    },
    computed: {
      isInitial() {
        return this.status === STATUS_INITIAL
      },
      showOptions() {
        return this.status === STATUS_SHOW_OPTIONS || this.status === STATUS_INIT_FAILED
      },
      isLoading() {
        return this.status === STATUS_LOADING
      },
      isSuccessful() {
        return this.status === STATUS_VOTE_SUCCESS
      },
      hasVotingError() {
        return this.status === STATUS_VOTE_FAIL
      },
      hasVotingTimeout() {
        return this.status === STATUS_VOTE_TIMEOUT
      },
      votingClosed() {
        return this.status === STATUS_VOTE_CLOSED
      },
      initFailed() {
        return this.status === STATUS_INIT_FAILED
      },
      statusError() {
        return this.status === STATUS_ERROR
      }
    },
    methods: {
      removeError() {
        this.status = STATUS_INITIAL
        this.error = ''
      },
      removeVote() {
        this.activeOption = null
        this.status = STATUS_SHOW_OPTIONS
      },
      setError(body, callback = this.removeError, headline = 'Oh no...', cta = 'Ok') {
        this.error = {
          text: body,
          cb: callback,
          headline: headline,
          cta: cta
        }
        this.status = STATUS_ERROR
      },
      openBaseAepp() {
        window.open('https://base.aepps.com')
      },
      async connectWallet() {
        this.status = STATUS_LOADING
        if (this.selectedClient === 'baseaepp') {
          if (window.parent !== window) {
            const success = await aeternity.initBase({
              id: this.voteId,
              stakeHeight: 80541,
              endHeight: 80541
            })
            if (success) {
              this.provider = aeternity
            } else {
              this.setError('An error occured while connecting to the Base aepp. Please make sure your Base aepp is up to date.')
            }
          } else {
            this.setError(
              'For the best Base æpp voting experience please open the voting æpp inside the Base æpp on your mobile device.',
              this.removeError,
              'Voting with the aeternity Base æpp'
            )
          }
        }

        if (this.selectedClient === 'metamask') {
          if (window.ethereum || window.web3) {
            const {success, message} = await ethereum.init({
              id: this.voteId,
              stakeHeight: 11769152,  // 10754080,
              endHeight: 11769152
            })
            if (success) this.provider = ethereum
            else {
              this.setError(message)
            }
          } else {
            this.setError('We could not find MetaMask or Mist. Please make sure you have one of these extensions installed.')
          }
        }

        if (this.selectedClient === 'ledger') {

          const browser = detect()
          if (browser && browser.name.indexOf('chrome') === -1) {
            return this.setError('The ledger connection currently only works in google chrome or chromium.')
          }

          if (this.isMobile()) {
            return this.setError('The ledger connection currently only works on the desktop.')
          }

          // TODO allow for base-aepp url input

          // Try Ledger
          const success = await aeternity.initLedger({
            id: this.voteId,
            stakeHeight: 80541,
            endHeight: 80541
          })
          if (success) {
            this.provider = aeternity
          } else {
            this.setError('An error occured while connecting to your ledger or phone through the base-aepp. If you have the base-aepp open on your desktop, close it now and try again.')
          }
        }

        if (this.provider) {

          if (String(this.provider.balance) === '0') {
            this.setError(`Your balance is 0 ${this.provider.network === 'aeternity' ? 'AE' : 'ETH'}, please add tokens to your account ${this.provider.address.substr(0, 20)}...`, () => {window.location.reload()}, 'Oh no...', 'Reload')
            this.provider = null
          }

          if (!this.statusError) {
            this.activeOption = await this.provider.getActiveVote()
            this.selectedId = this.activeOption ? this.activeOption : this.selectedId

            if (typeof this.activeOption === 'number') {
              this.status = STATUS_VOTE_SUCCESS
            }

            const voteOpen = this.provider.isVoteOpen()
            if (!voteOpen) return this.status = STATUS_VOTE_CLOSED
          }

          if (this.isLoading) {
            this.status = STATUS_SHOW_OPTIONS
          }

        } else if (!this.statusError) {
          this.status = STATUS_INITIAL
        }
      },
      isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      },
      async sendVote() {
        this.status = STATUS_LOADING
        try {
          // TIMEOUT
          const result = await Promise.race([
            this.provider.sendVote(this.selectedId),
            new Promise(resolve => {
              setTimeout(() => {
                resolve('TIMEOUT')
              }, 120000)
            })
          ])

          if (result === 'TIMEOUT') {
            this.status = STATUS_VOTE_TIMEOUT
          } else if (result === this.selectedId) {
            this.status = STATUS_VOTE_SUCCESS
            this.activeOption = result
            this.selectedId = this.activeOption
          } else {
            this.status = STATUS_VOTE_FAIL
          }
        } catch (e) {
          this.status = STATUS_VOTE_FAIL
        }
      },
      async checkAndReloadProvider() {
        if (!this.provider) return

        const changesDetected = await this.provider.verifyAddress()
        if (changesDetected) {
          this.setError('Your account changed. Please reload this page.', () => {
            window.location.reload()
          }, 'Significant changes detected', 'Reload')
          clearInterval(this.interval)
        }
      }
    },
    async mounted() {
      console.log('is iframe', window.parent !== window)
      console.log('is mobile', this.isMobile(), navigator.userAgent)
      if (window.parent !== window && this.isMobile()) {
        this.selectedClient = 'baseaepp'
        await this.connectWallet()
        if (this.provider) return
      }
      if(!this.statusError) this.status = STATUS_INITIAL
      this.interval = setInterval(this.checkAndReloadProvider, 1000)
    },
    beforeDestroy() {
      clearInterval(this.interval)
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

  .no-wrap {
    white-space: nowrap;
  }

  .align-left {
    text-align: left;
  }

  .information-links a {
    text-decoration: underline;
  }
</style>
