<template>
  <div class="tile" :style="tileStyle"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getTileBackgroundPosition } from '../utils/tileUtils'

interface Props {
  code: string
}

const props = withDefaults(defineProps<Props>(), {
  code: '1m'
})

const tileStyle = computed(() => {
  try {
    const backgroundPosition = getTileBackgroundPosition(props.code)
    return {
      backgroundImage: 'url(/tiles.svg)',
      backgroundPosition: backgroundPosition,
      backgroundRepeat: 'no-repeat',
      width: '30px',
      height: '44px',
      display: 'inline-block'
    }
  } catch (error) {
    console.error(error)
    return {
      width: '30px',
      height: '44px',
      display: 'inline-block',
      backgroundColor: '#ccc'
    }
  }
})
</script>

<style scoped>
.tile {
  flex-shrink: 0;
}
</style>
