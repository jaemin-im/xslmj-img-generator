<template>
  <div class="tile" :style="tileStyle" :class="tileClass"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getTileBackgroundPosition, isTileBack } from '../utils/tileUtils'

interface Props {
  code: string
}

const props = withDefaults(defineProps<Props>(), {
  code: '1m'
})

const tileClass = computed(() => {
  if (props.code === '_space_') {
    return 'space'
  }
  if (isTileBack(props.code)) {
    return 'back'
  }
  return ''
})

const tileStyle = computed(() => {
  // 공간 처리
  if (props.code === '_space_') {
    return {
      width: '16px',
      height: '44px',
      display: 'inline-block',
      margin: '0',
      padding: '0',
      backgroundColor: 'transparent'
    }
  }

  try {
    const backgroundPosition = getTileBackgroundPosition(props.code)
    const isBack = isTileBack(props.code)
    
    return {
      backgroundImage: 'url(/tiles.svg)',
      backgroundPosition: backgroundPosition,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '270px 176px',
      width: '30px',
      height: '44px',
      display: 'inline-block',
      margin: '0',
      padding: '0',
      filter: isBack ? 'invert(0.1) sepia(0.8) hue-rotate(15deg) saturate(2) brightness(0.95)' : 'none'
    }
  } catch (error) {
    console.error(error)
    return {
      width: '30px',
      height: '44px',
      display: 'inline-block',
      backgroundColor: '#ccc',
      margin: '0',
      padding: '0'
    }
  }
})
</script>

<style scoped>
.tile {
  flex-shrink: 0;
}

.space {
  background-color: transparent;
}

.back {
  filter: invert(0.1) sepia(0.8) hue-rotate(15deg) saturate(2) brightness(0.95);
}
</style>
