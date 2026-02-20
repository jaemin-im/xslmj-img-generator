<template>
  <div class="tile-input-container">
    <h1>마작패 이미지 생성기</h1>
    
    <div class="input-section">
      <label for="tileCode">마작패 코드 입력 (예: 123m35678p12399s o 5p):</label>
      <input
        id="tileCode"
        v-model="inputCode"
        type="text"
        placeholder="123m35678p12399s, o (뒷면), 띄어쓰기 등"
        @keyup.enter="addTiles"
      />
      <button @click="addTiles">추가</button>
      <button @click="clearAllTiles" class="clear-btn">초기화</button>
    </div>

    <div class="background-option">
      <label for="backgroundToggle">
        <input
          id="backgroundToggle"
          v-model="hasBackground"
          type="checkbox"
        />
        배경 포함
      </label>
    </div>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <!-- 토스트 알림 -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="`toast-${toastType}`">
        {{ toastMessage }}
      </div>
    </transition>

    <div v-if="tileRows.length > 0" class="tiles-display">
      <h2>입력된 마작패:</h2>
      <div v-for="(row, rowIndex) in tileRows" :key="rowIndex" class="tile-row" :style="tileRowStyle">
        <div class="tiles-wrapper">
          <MahjongTile v-for="(tile, tileIndex) in row.tiles" :key="`${rowIndex}-${tileIndex}`" :code="tile" />
        </div>
        <div class="row-actions">
          <button @click="copyToClipboard(rowIndex)" class="copy-btn" title="클립보드에 복사">📋</button>
          <button @click="saveTileImage(rowIndex)" class="save-btn" title="이미지 저장">💾</button>
          <button @click="deleteRow(rowIndex)" class="delete-row-btn" title="행 삭제">×</button>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h3>마작패 코드 목록</h3>
      <div class="tile-list">
        <div class="suit-group">
          <h4>만(m): 1m~9m</h4>
          <div class="tiles-preview">
            <MahjongTile v-for="i in 9" :key="`m${i}`" :code="`${i}m`" />
          </div>
        </div>
        <div class="suit-group">
          <h4>통(p): 1p~9p</h4>
          <div class="tiles-preview">
            <MahjongTile v-for="i in 9" :key="`p${i}`" :code="`${i}p`" />
          </div>
        </div>
        <div class="suit-group">
          <h4>삭(s): 1s~9s</h4>
          <div class="tiles-preview">
            <MahjongTile v-for="i in 9" :key="`s${i}`" :code="`${i}s`" />
          </div>
        </div>
        <div class="suit-group">
          <h4>자(z): 1z~7z</h4>
          <div class="tiles-preview">
            <MahjongTile v-for="i in 7" :key="`z${i}`" :code="`${i}z`" />
          </div>
        </div>
      </div>
    </div>

    <!-- 숨겨진 캔버스: 이미지 렌더링용 -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MahjongTile from '../components/MahjongTile.vue'
import { parseTileString, isTileBack } from '../utils/tileUtils'

interface TileRow {
  tiles: string[]
}

const inputCode = ref('')
const tileRows = ref<TileRow[]>([])
const errorMessage = ref('')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const hasBackground = ref(false)

// 토스트 알림 관련
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimer: NodeJS.Timeout | null = null

const showToastMessage = (message: string, type: 'success' | 'error' = 'success', duration: number = 2000) => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  // 이전 타이머 제거
  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  // 지정된 시간 후 토스트 숨김
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, duration)
}

const tileRowStyle = computed(() => {
  if (!hasBackground.value) {
    return {}
  }
  return {
    backgroundColor: '#588E58',
    padding: '20px',
    borderRadius: '4px'
  }
})

const addTiles = () => {
  const code = inputCode.value.toLowerCase().trim()
  
  if (!code) {
    errorMessage.value = '마작패 코드를 입력하세요.'
    return
  }

  try {
    const parsedTiles = parseTileString(code)
    tileRows.value.push({ tiles: parsedTiles })
    inputCode.value = ''
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `입력 오류: ${error instanceof Error ? error.message : '올바른 형식이 아닙니다.'}`
  }
}

const deleteRow = (rowIndex: number) => {
  tileRows.value.splice(rowIndex, 1)
}

const clearAllTiles = () => {
  tileRows.value = []
  errorMessage.value = ''
  inputCode.value = ''
}

/**
 * 캔버스에 타일을 렌더링하는 헬퍼 함수
 */
const renderTileOnCanvas = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, tile: string, posX: number, tileWidth: number, tileHeight: number, posY: number = 0) => {
  // 공간 처리
  if (tile === '_space_') {
    ctx.fillStyle = 'transparent'
    ctx.fillRect(posX, posY, tileWidth, tileHeight)
    return
  }

  // 일반 타일 또는 뒷면 처리
  const match = tile.match(/^(\d+)([mpsz])$/)
  let number: number
  let suit: string
  let isBack = false

  if (tile === 'o') {
    // 뒷면
    isBack = true
    number = 5
    suit = 'z'
  } else if (match) {
    number = parseInt(match[1])
    suit = match[2]
  } else {
    throw new Error(`Invalid tile: ${tile}`)
  }

  // 배경 위치 계산
  let y = 0
  switch (suit) {
    case 'm': y = 0; break
    case 'p': y = -44; break
    case 's': y = -88; break
    case 'z': y = -132; break
  }
  const x = -(number - 1) * 30

  // 임시 캔버스에 타일 그리기
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = tileWidth
  tempCanvas.height = tileHeight
  const tempCtx = tempCanvas.getContext('2d')!

  // 소스 이미지에서 정확한 타일 영역 추출
  const srcX = Math.abs(x)
  const srcY = Math.abs(y)
  
  tempCtx.drawImage(
    img,
    srcX,        // 소스 x 좌표
    srcY,        // 소스 y 좌표
    30,          // 소스에서 가져올 너비 (원본 30px)
    44,          // 소스에서 가져올 높이 (원본 44px)
    0,           // 대상 x 좌표
    0,           // 대상 y 좌표
    tileWidth,   // 대상 너비 (확대된 크기)
    tileHeight   // 대상 높이 (확대된 크기)
  )

  // 뒷면인 경우 주황색 필터 적용
  if (isBack) {
    // 주황색 오버레이 (더 진한 주황색)
    tempCtx.fillStyle = 'rgba(255, 140, 0, 0.55)'
    tempCtx.fillRect(0, 0, tileWidth, tileHeight)
    // 밝기 감소
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    tempCtx.fillRect(0, 0, tileWidth, tileHeight)
  }

  // 메인 캔버스에 그리기
  ctx.drawImage(tempCanvas, posX, posY)
}

/**
 * 캔버스에 타일들을 렌더링
 */
const renderTilesToCanvas = async (tiles: string[]): Promise<HTMLCanvasElement> => {
  const canvas = canvasRef.value || document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.')

  // 캔버스 크기 계산 (4배)
  let totalWidth = 0
  const tileWidth = 120  // 30 * 4
  const tileHeight = 176 // 44 * 4
  const spaceWidth = 64  // 16 * 4
  const padding = 20     // 배경 패딩
  
  for (const tile of tiles) {
    if (tile === '_space_') {
      totalWidth += spaceWidth
    } else {
      totalWidth += tileWidth
    }
  }

  // 배경이 있으면 패딩 추가
  const finalWidth = hasBackground.value ? totalWidth + padding * 2 : totalWidth
  const finalHeight = hasBackground.value ? tileHeight + padding * 2 : tileHeight

  canvas.width = finalWidth
  canvas.height = finalHeight

  // 배경 그리기 (배경 있음 선택 시)
  if (hasBackground.value) {
    ctx.fillStyle = '#588E58'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    // 배경 투명하게 설정
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // tiles.svg 이미지 로드
  const img = new Image()
  img.src = '/tiles.svg'

  return new Promise((resolve, reject) => {
    img.onload = () => {
      let currentX = hasBackground.value ? padding : 0
      const posY = hasBackground.value ? padding : 0
      try {
        for (const tile of tiles) {
          if (tile === '_space_') {
            if (!hasBackground.value) {
              ctx.fillStyle = 'transparent'
              ctx.fillRect(currentX, posY, spaceWidth, tileHeight)
            }
            currentX += spaceWidth
          } else {
            renderTileOnCanvas(ctx, img, tile, currentX, tileWidth, tileHeight, posY)
            currentX += tileWidth
          }
        }
        resolve(canvas)
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = () => reject(new Error('tiles.svg 로드 실패'))
  }) as any
}

/**
 * 클립보드에 이미지 복사
 */
const copyToClipboard = async (rowIndex: number) => {
  try {
    const tiles = tileRows.value[rowIndex].tiles
    const canvas = await renderTilesToCanvas(tiles)

    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Blob 생성 실패')
      
      const data = [new ClipboardItem({ 'image/png': blob })]
      await navigator.clipboard.write(data)
      errorMessage.value = ''
      showToastMessage('이미지가 클립보드에 복사되었습니다!', 'success')
    })
  } catch (error) {
    const errorMsg = `복사 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    errorMessage.value = errorMsg
    showToastMessage(errorMsg, 'error')
  }
}

/**
 * 이미지 저장
 */
const saveTileImage = async (rowIndex: number) => {
  try {
    const tiles = tileRows.value[rowIndex].tiles
    const canvas = await renderTilesToCanvas(tiles)

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `mahjong-${tiles.join('')}-${Date.now()}.png`
    link.click()
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  }
}
</script>

<style scoped>
.tile-input-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

label {
  font-weight: bold;
  color: #555;
}

input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  flex: 0 0 150px;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

.clear-btn {
  background-color: #f44336;
}

.clear-btn:hover {
  background-color: #da190b;
}

.background-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.background-option label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-weight: 500;
  color: #555;
  cursor: pointer;
}

.background-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  padding: 12px;
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #f44336;
  margin-bottom: 20px;
  border-radius: 4px;
}

.tiles-display {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.tiles-display h2 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
}

.tile-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.tiles-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  flex: 1;
}

.row-actions {
  display: flex;
  gap: 5px;
}

.copy-btn,
.save-btn,
.delete-row-btn {
  padding: 6px 12px;
  font-size: 14px;
  min-width: 40px;
}

.copy-btn {
  background-color: #2196F3;
}

.copy-btn:hover {
  background-color: #0b7dda;
}

.save-btn {
  background-color: #FF9800;
}

.save-btn:hover {
  background-color: #e68900;
}

.delete-row-btn {
  background-color: #f44336;
  padding: 6px 10px;
}

.delete-row-btn:hover {
  background-color: #da190b;
}

.info-section {
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.info-section h3 {
  margin-top: 0;
  color: #333;
  font-size: 16px;
}

.tile-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .tile-list {
    grid-template-columns: 1fr;
  }

  .input-section {
    flex-direction: column;
  }

  input {
    flex: 1;
    min-width: 0;
  }

  .tile-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .row-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.suit-group h4 {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 14px;
}

.tiles-preview {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* 토스트 알림 스타일 */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 24px;
  background-color: #4CAF50;
  color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  z-index: 1000;
  max-width: 400px;
  word-break: break-word;
}

.toast-success {
  background-color: #4CAF50;
}

.toast-error {
  background-color: #f44336;
}

/* 토스트 애니메이션 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(400px);
  opacity: 0;
}
</style>
