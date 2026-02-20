<template>
  <div class="tile" :style="tileStyle" :class="tileClass">
    <!-- 텍스트 어노테이션 -->
    <span v-if="isAnnotation" class="annotation-text" :style="annotationTextStyle">{{ annotationText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getTileBackgroundPosition, isTileBack } from '../utils/tileUtils'

interface Props {
  code: string
  rotated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  code: '1m',
  rotated: false
})

const isAnnotation = computed(() => {
  return [
    '_tsumoannotation_',
    '_ronannotation_',
    '_discardannotation_',
    'd'
  ].includes(props.code)
})

const annotationText = computed(() => {
  switch (props.code) {
    case '_tsumoannotation_':
      return '쯔모'
    case '_ronannotation_':
      return '론'
    case '_discardannotation_':
      return '打'
    case 'd':
      return '도라'
    default:
      return ''
  }
})

// 어노테이션 색상 맵
const annotationColors = computed(() => {
  // 기본(도라 회색, 쯔모 노랑, 론 빨강, 타패 파랑)
  const map: Record<string, { bg: string; border: string; text: string }> = {
    d: { bg: '#f5f5f5', border: '#9e9e9e', text: '#616161' },
    _tsumoannotation_: { bg: '#fff8e1', border: '#fbc02d', text: '#8d6e63' },
    _ronannotation_: { bg: '#ffebee', border: '#e53935', text: '#c62828' },
    _discardannotation_: { bg: '#e3f2fd', border: '#1e88e5', text: '#1565c0' }
  }
  const key = props.code as keyof typeof map
  return map[key] ?? { bg: '#eeeeee', border: '#9e9e9e', text: '#616161' }
})

const tileClass = computed(() => {
  if (props.code === '_space_') {
    return 'space'
  }
  if (isTileBack(props.code)) {
    return 'back'
  }
  if (isAnnotation.value) {
    return 'annotation'
  }
  if (props.code === '_rotate90_') {
    return 'rotate90-marker'
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

  // 90도 회전 마크 처리
  if (props.code === '_rotate90_') {
    return {
      width: '30px',
      height: '44px',
      display: 'inline-block',
      margin: '0',
      padding: '0',
      backgroundColor: 'transparent'
    }
  }

  // 어노테이션 처리
  if (isAnnotation.value) {
    return {
      width: '30px',
      height: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 4px 0 0',
      padding: '0',
      backgroundColor: annotationColors.value.bg,
      border: `0.5px solid ${annotationColors.value.border}`,
      borderRadius: '2px',
      fontSize: '10px',
      fontWeight: 'bold',
      color: annotationColors.value.text,
      transform: props.rotated ? 'rotate(90deg)' : 'none'
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
      filter: isBack ? 'invert(0.3) sepia(1) hue-rotate(15deg) saturate(5) brightness(0.95)' : 'none',
      transform: props.rotated ? 'rotate(90deg)' : 'none'
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

const annotationTextStyle = computed(() => {
  if (!isAnnotation.value) return {}
  return {
    color: annotationColors.value.text
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

.annotation {
  /* 색상은 인라인 스타일로 제어 */
}

.rotate90-marker {
  background-color: transparent;
}
</style>
