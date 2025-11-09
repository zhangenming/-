<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import NextCas from '@nextcas/sdk'
import type { ReplayEvent } from '@nextcas/sdk'
import { createAccessToken } from './token'

const container = ref<HTMLDivElement | null>(null)

let cas: NextCas | null = null

const progress = ref<number>(0)
const inited = ref(false)
const inputValue = ref('')

async function getToken() {
  return { data: '' }
}

const chatHistory = ref<{ source: 'nexthuman' | 'guest'; content: string }[]>([
  {
    source: 'nexthuman',
    content: '你好，请问有什么可以帮您',
  },
])

onMounted(async () => {
  const token = await createAccessToken()

  cas = new NextCas(container.value!, {
    avatarId: 'avatar_257',
    actorId: '641811add41a3f2f91247af5',
    token,
    templateName: 'introduce',
    // src:"http://127.0.0.1:5173/demo"
  })

  cas.on('initProgress', cent => {
    progress.value = cent
  })

  cas.on('ready', () => {
    inited.value = true
    setTimeout(() => {
      cas?.speak('你好，请问有什么可以帮您')
    })
  })
})

onBeforeUnmount(() => {
  if (cas) {
    cas.destroy()
  }
})

const reload = async () => {
  if (cas) {
    inited.value = false
    progress.value = 0
    const token = await getToken()
    cas.reload(token.data)
  }
}

const setTemplate = (templateName: 'base' | 'introduce') => {
  inited.value = false
  cas?.setTemplate(templateName)
}

const speak = () => {
  chatHistory.value.push({
    source: 'nexthuman',
    content: inputValue.value,
  })
  cas?.speak(inputValue.value)
}

const ask = async () => {
  chatHistory.value.push({
    source: 'guest',
    content: inputValue.value,
  })
  if (!cas) return
  const askId = await cas.ask(inputValue.value)

  const index = chatHistory.value.length
  function reply(data: ReplayEvent) {
    if (data.id === askId) {
      if (!chatHistory.value[index]) {
        chatHistory.value.push({
          source: 'nexthuman',
          content: data.data.content,
        })
      } else {
        chatHistory.value[index].content += data.data.content
      }

      if (data.data.last) {
        cas?.off('reply', reply)
      }
    }
  }
  cas.on('reply', reply)
}

const speackStream = () => {
  const stream = cas?.createSpeackStream()
  if (!stream) return
  stream.next('你好')
  setTimeout(() => {
    stream.next('我是小唯')
    stream.last('很高兴见到你')
  }, 1000)
}

const stopAct = () => {
  cas?.call('stopAct')
}

async function setAvatar(avatarId: string, actorId: string) {
  await cas?.setAvatar(avatarId)
  await cas?.setActor(actorId)
}
</script>

<template>
  <div style="display: flex">
    <div style="width: 375px; height: 800px; border: red 1px solid; flex-shrink: 0" ref="container" />

    <div class="apis">
      <div class="api-box">
        <div class="api-title">初始化状态：</div>
        {{ inited ? '初始化完成' : '正在加载' + progress + '%' }}
      </div>

      <div class="api-box">
        <div class="api-title">角色切换：</div>
        <button
          @click="
            () => {
              setAvatar('avatar_257', '641811add41a3f2f91247af5')
            }
          "
        >
          女
        </button>
        <button
          @click="
            () => {
              setAvatar('avatar_1078', 'actor_100230')
            }
          "
        >
          男
        </button>
      </div>

      <div class="api-box">
        <div class="api-title">模板切换：</div>
        <button
          @click="
            () => {
              setTemplate('introduce')
            }
          "
        >
          setTemplate("introduce")
        </button>
        <button
          @click="
            () => {
              setTemplate('base')
            }
          "
        >
          setTemplate("base")
        </button>
      </div>

      <div class="api-box">
        <div class="api-title">重新加载：</div>
        <button @click="reload">reload</button>
      </div>

      <div class="api-box">
        <div class="api-title">视角切换：</div>
        <button
          @click="
            () => {
              cas?.changeCamera({ x: 0, y: 1.65, z: 0.58 }, { x: 0, y: 1.61, z: -0.45 }, 500)
            }
          "
        >
          脸部视角
        </button>

        <button
          @click="
            () => {
              cas?.changeCamera({ x: 0, y: 1.65, z: 2.42 }, { x: 0, y: 1.34, z: 1.5 }, 500)
            }
          "
        >
          全身视角
        </button>
      </div>

      <div class="api-box">
        <div class="api-title">装扮切换：</div>
        <button
          @click="
            ;async () => {
              await cas?.addBundle('hair_1001')
              console.log('switch success!!')
            }
          "
        >
          头发
        </button>
      </div>

      <div class="api-box">
        <div class="api-title">AI对话：</div>
        <textarea v-model="inputValue" />
        <button @click="ask">ask</button>
        <button @click="speak">speak</button>
        <button @click="stopAct">打断演讲</button>
        <button @click="speackStream">流式演讲</button>
      </div>

      <div v-if="!!inited" class="chat-history">
        <div class="chat-item" v-for="(chat, i) in chatHistory" :key="i">
          <div class="chat-item-avatar">{{ chat.source }}：</div>
          <div class="chat-item-content">{{ chat.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apis {
  padding: 20px;
  max-width: 500px;
}
.api-box {
  display: flex;
  margin-top: 6px;
}
.api-title {
  font-size: 18px;
  font-weight: bold;
}
.chat-history {
  margin-top: 24px;
  max-height: 400px;
  overflow-y: overlay;
}
.chat-item {
  display: flex;
}
.chat-item-content {
  text-align: center;
}
.chat-item-avatar {
  font-weight: bold;
  font-size: 18px;
}
button {
  margin: 0 12px;
}
</style>
