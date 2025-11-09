<script setup lang="ts">
import NextCas from '@nextcas/sdk'
import { onMounted, ref } from 'vue'
import { createAccessToken } from './token'
import { simulateClick } from './utils'

const showBegin = ref(false)
onMounted(async () => {
  const cas = new NextCas(document.getElementById('container')!, {
    token: await createAccessToken(),
    templateName: 'base',
    avatarId: 'avatar_482790',
    actorId: 'actor_118544',
  })

  cas.on('ready', () => {
    // cas.ask('明亮模式')

    cas.speak('hi~我是抱抱，芳香教室专属助理，请问您是来体验课程、日常巡检还是进行聊天？', {
      onStart: () => {
        console.log('start')

        simulateClick()
        showBegin.value = true
      },
      onEnd: () => {
        console.log('end')
      },
    })

    // const stream = cas?.createSpeackStream()
    // simulateClick()
    // stream.next('你好')
    // setTimeout(() => {
    //   stream.next('我是小唯')
    //   stream.last('很高兴见到你')
    // }, 1000)
  })
})
</script>

<template>
  <div id="container"></div>
  <div v-if="showBegin">hi~我是抱抱，芳香教室专属助理，请问您是来体验课程、日常巡检还是进行聊天？</div>
</template>

<style scoped>
#container {
  width: 500px;
  height: 500px;
}
</style>
