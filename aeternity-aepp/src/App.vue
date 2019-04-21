<template>
  <div id="app" class="min-h-screen">
    <div class="min-h-screen">
      <!--
      <div class="bg-white w-full shadow h-12 p-1 relative">
        <div class="flex h-full">

          <div class="p-2 flex">
            <img src="./assets/logo-small.png" class="h-full">
          </div>

          <div class="border-l border-gray-400">

          </div>
        </div>
      </div>
      -->
      <ae-main class="flex justify-center">
        <div class="mobile-container">
          <router-view></router-view>
        </div>
      </ae-main>
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
    background: #f7fafc;
  }

  .mobile-container {
    max-width: 500px
  }
</style>
