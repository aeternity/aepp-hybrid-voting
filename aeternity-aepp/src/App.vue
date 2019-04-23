<template>
  <div id="app" class="min-h-screen">
    <div class="min-h-screen">
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
  }

  .mobile-container {
    max-width: 500px
  }
</style>
