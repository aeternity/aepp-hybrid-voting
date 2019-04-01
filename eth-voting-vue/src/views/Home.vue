<template>
  <div class="home">
    <SimpleVote/>
  </div>
</template>

<script>
// @ is an alias to /src
import SimpleVote from '@/components/SimpleVote.vue'

export default {
  name: 'home',
  components: {
    SimpleVote
  }
}
</script>
