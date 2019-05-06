<template>
  <div id="app" class="min-h-screen">

    <div class="min-h-screen">
      <!--
      <div class="w-full h-16 flex justify-center items-center" style="background-color: red">
        <div class="text-base md:text-2xl"><strong>TEST VERSION</strong> RUNNING ON ETH KOVAN / AE <strong>TESTNET</strong></div>
      </div>
      -->
      <div class="bg-white w-full shadow h-12 p-1 relative hidden md:block mb-8">
        <div class="flex h-full">
          <div class="h-full">
            <img src="./assets/logo-small.png" class="h-full w-auto p-3 mx-3"/>
          </div>
          <div class="border-l border-gray-400">
            <div class="flex items-center h-full ml-6">
              <strong>æternity</strong>voting
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-center">
        <div class="mobile-container">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

  import { AeMain } from '@aeternity/aepp-components'
  import AeHeader from '@aeternity/aepp-components/src/components/aeHeader/aeHeader'

  export default {
    name: 'app',
    components: { AeHeader, AeMain },
  }
</script>

<style scoped>
  .min-h-screen {
    min-height: 100vh;
    padding-bottom: 0;
    background: #F1F4F7;
    max-height: 100vh;
    overflow-y: auto;
  }

  .mobile-container {
    max-width: 500px
  }
</style>
