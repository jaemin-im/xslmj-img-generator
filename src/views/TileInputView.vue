<template>
  <div class="tile-input-container">
    <h1>마작패 이미지 생성기</h1>

    <p>Powered by 엑솔마장</p>
    
    <!-- 입력 폼 개수 조절 섹션 -->
    <div class="form-count-section">
      <label>입력 폼 개수:</label>
      <div class="form-count-controls">
        <button @click="decreaseFormCount" class="count-btn" :disabled="inputForms.length <= 1">−</button>
        <span class="form-count-display">{{ inputForms.length }}</span>
        <button @click="increaseFormCount" class="count-btn" :disabled="inputForms.length >= 10">+</button>
      </div>
    </div>
    
    <!-- 여러 개의 마작패 입력 폼 -->
    <div class="input-forms">
      <div v-for="(form, index) in inputForms" :key="index" class="input-form">
        <span class="form-number">#{{ index + 1 }}</span>
        <input
          v-model="form.code"
          type="text"
          placeholder="123m35678p12399s, o (뒷면), 띄어쓰기 등"
          class="form-input"
        />
      </div>
    </div>
    
    <!-- 생성 버튼 섹션 -->
    <div class="batch-section">
      <button @click="generateAllImages" class="batch-btn" :disabled="inputForms.every(f => !f.code.trim())">
        이미지 생성
      </button>
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

    <!-- 생성된 이미지 표시 -->
    <div v-if="generatedImages.length > 0" class="images-display">
      <h2>생성된 이미지:</h2>
      <div class="images-grid">
        <div v-for="(image, index) in generatedImages" :key="index" class="image-item">
          <div class="image-header">
            <span class="image-number">#{{ index + 1 }}</span>
            <span class="image-code">{{ image.code }}</span>
          </div>
          <div class="image-preview-wrapper">
            <img :src="image.dataUrl" :alt="`Generated image ${index + 1}`" class="image-preview" />
          </div>
          <div class="image-actions">
            <button @click="copyImageToClipboard(index)" class="copy-btn" title="클립보드에 복사">📋 복사</button>
            <button @click="saveSingleImage(index)" class="save-btn" title="이미지 저장">💾 저장</button>
          </div>
        </div>
      </div>
      <div class="batch-download-section">
        <button @click="downloadAllImages" class="download-all-btn">모든 이미지 일괄 다운로드</button>
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
import { ref } from 'vue'
import MahjongTile from '../components/MahjongTile.vue'
import { parseTileString, type ParsedResult } from '../utils/tileUtils'

interface InputForm {
  code: string
}

interface GeneratedImage {
  code: string
  dataUrl: string
  tiles: string[]
  text: string | null
}

const inputForms = ref<InputForm[]>([{ code: '' }])
const generatedImages = ref<GeneratedImage[]>([])
const errorMessage = ref('')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const hasBackground = ref(false)

// 토스트 알림 관련
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimer: ReturnType<typeof setTimeout> | null = null

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

/**
 * 입력 폼 개수 증가
 */
const increaseFormCount = () => {
  if (inputForms.value.length < 10) {
    inputForms.value.push({ code: '' })
  }
}

/**
 * 입력 폼 개수 감소
 */
const decreaseFormCount = () => {
  if (inputForms.value.length > 1) {
    inputForms.value.pop()
  }
}


/**
 * 모든 이미지 일괄 생성
 */
const generateAllImages = async () => {
  // 유효한 입력값만 필터링
  const validForms = inputForms.value.filter(f => f && f.code.trim())
  
  if (validForms.length === 0) {
    errorMessage.value = '최소 1개의 마작패 코드를 입력하세요.'
    showToastMessage(errorMessage.value, 'error')
    return
  }

  generatedImages.value = []
  errorMessage.value = ''

  try {
    const newImages: GeneratedImage[] = []
    
    for (let i = 0; i < validForms.length; i++) {
      const form = validForms[i]
      if (!form) continue
      
      const code = form.code.toLowerCase().trim()
      const { tiles: parsedTiles, text } = parseTileString(code)
      const canvas = await renderTilesToCanvas(parsedTiles, text)
      const dataUrl = canvas.toDataURL('image/png')
      
      newImages.push({
        code,
        dataUrl,
        tiles: parsedTiles,
        text
      })
    }
    
    generatedImages.value = newImages
    showToastMessage(`${newImages.length}개의 이미지 생성 완료`, 'success')
  } catch (error) {
    errorMessage.value = `생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    showToastMessage(errorMessage.value, 'error')
  }
}

/**
 * 각 타일이 필요로 하는 너비 계산
 */
const calculateTileWidth = (tile: string, ctx: CanvasRenderingContext2D): number => {
  const tileWidth = 120
  const spaceWidth = 64

  if (tile === '_space_') {
    return spaceWidth
  }

  if (tile === '_rotate90_') {
    return 0
  }

  // 어노테이션 텍스트
  const annotationMap: Record<string, string> = {
    'd': '도라',
    '_tsumoannotation_': '쯔모',
    '_ronannotation_': '론',
    '_discardannotation_': '打'
  }

  if (annotationMap[tile]) {
    const text = annotationMap[tile]
    const fontSize = 32
    ctx.font = `bold ${fontSize}px Arial`
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width
    const padding = 24
    return Math.max(80, textWidth + padding)
  }

  // 일반 타일
  return tileWidth
}

/**
 * 캔버스에 타일을 렌더링하는 헬퍼 함수
 */
const renderTileOnCanvas = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, tile: string, posX: number, tileWidth: number, tileHeight: number, posY: number = 0, rotated: boolean = false) => {
  // 공간 처리
  if (tile === '_space_') {
    ctx.fillStyle = 'transparent'
    ctx.fillRect(posX, posY, tileWidth, tileHeight)
    return
  }

  // 90도 회전 마크 처리
  if (tile === '_rotate90_') {
    ctx.fillStyle = 'transparent'
    ctx.fillRect(posX, posY, tileWidth, tileHeight)
    return
  }

  // 어노테이션 처리 (d, _tsumoannotation_, _ronannotation_, _discardannotation_)
  const annotationMap: Record<string, string> = {
    'd': '도라',
    '_tsumoannotation_': '쯔모',
    '_ronannotation_': '론',
    '_discardannotation_': '打'
  }

  if (annotationMap[tile]) {
    // 어노테이션 색상 맵 (도라: 회색, 쯔모: 노랑, 론: 빨강, 타패: 파랑)
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      'd': { bg: '#f5f5f5', border: '#9e9e9e', text: '#616161' },
      '_tsumoannotation_': { bg: '#fff8e1', border: '#fbc02d', text: '#8d6e63' },
      '_ronannotation_': { bg: '#ffebee', border: '#e53935', text: '#c62828' },
      '_discardannotation_': { bg: '#e3f2fd', border: '#1e88e5', text: '#1565c0' }
    }
    const colors = colorMap[tile] ?? { bg: '#eeeeee', border: '#9e9e9e', text: '#616161' }

    // 어노테이션 박스의 높이를 텍스트 크기에 맞춰서 동적 계산
    const fontSize = 32
    ctx.font = `bold ${fontSize}px Arial`
    const padding = 12
    const annotationHeight = fontSize + padding * 2
    
    // 박스를 수직 중앙에 배치
    const boxPosY = posY + (tileHeight - annotationHeight) / 2

    // 배경 그리기
    ctx.fillStyle = colors.bg
    ctx.fillRect(posX, boxPosY, tileWidth, annotationHeight)
    
    // 테두리 그리기
    ctx.strokeStyle = colors.border
    ctx.lineWidth = Math.max(1, Math.floor(annotationHeight * 0.1))
    ctx.strokeRect(posX, boxPosY, tileWidth, annotationHeight)
    
    // 텍스트 그리기
    ctx.fillStyle = colors.text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(annotationMap[tile], posX + tileWidth / 2, boxPosY + annotationHeight / 2)
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
  } else if (match && match[1] && match[2]) {
    number = parseInt(match[1], 10)
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
  // 적도라(0)은 1~9 다음 열(우측 끝 = index 9)에 위치
  const xIndex = suit !== 'z' && number === 0 ? 9 : (number - 1)
  const x = -xIndex * 30

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

  // 회전 적용
  if (rotated) {
    ctx.save()
    ctx.translate(posX + tileWidth / 2, posY + tileHeight / 2)
    ctx.rotate((90 * Math.PI) / 180)
    ctx.drawImage(tempCanvas, -tileWidth / 2, -tileHeight / 2)
    ctx.restore()
  } else {
    // 메인 캔버스에 그리기
    ctx.drawImage(tempCanvas, posX, posY)
  }
}

/**
 * 캔버스에 타일들을 렌더링
 */
const renderTilesToCanvas = async (tiles: string[], text: string | null): Promise<HTMLCanvasElement> => {
  const canvas = canvasRef.value || document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.')

  // 캔버스 크기 계산
  const tileHeight = 176 // 44 * 4
  const padding = 20     // 배경 패딩
  const fontSize = 48 // 32 * 1.5
  const textHeight = text ? fontSize + 24 : 0 // 텍스트가 있을 경우 추가 높이 (폰트 크기 + 패딩)
  
  // 첫 번째 패스: 각 타일의 너비 계산
  const tileWidths: number[] = []
  let totalWidth = 0
  const annotationTiles = ['d', '_tsumoannotation_', '_ronannotation_', '_discardannotation_']
  const annotationMargin = 12
  
  for (const tile of tiles) {
    if (tile === '_rotate90_') {
      tileWidths.push(0)
    } else {
      const width = calculateTileWidth(tile, ctx)
      tileWidths.push(width)
      const rightMargin = annotationTiles.includes(tile) ? annotationMargin : 0
      totalWidth += width + rightMargin
    }
  }

  // 항상 패딩 적용
  const finalWidth = totalWidth + padding * 2
  const finalHeight = tileHeight + padding * 2 + textHeight

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
  
  const contentOffsetY = padding

  // 텍스트 그리기
  if (text) {
    ctx.fillStyle = hasBackground.value ? 'white' : 'black'
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(text, contentOffsetY, contentOffsetY)
  }

  // tiles.svg 이미지 로드
  const img = new Image()
  img.src = '/tiles.svg'

  return new Promise((resolve, reject) => {
    img.onload = () => {
      let currentX = padding
      const posY = contentOffsetY + textHeight
      try {
        let nextTileRotated = false
        
        for (let i = 0; i < tiles.length; i++) {
          const tile = tiles[i]
          if (!tile) continue
          
          const currentRotated = nextTileRotated
          nextTileRotated = false
          
          if (tile === '_rotate90_') {
            // 다음 타일을 회전 표시
            nextTileRotated = true
            continue
          }
          
          const width = tileWidths[i]
          if (width === undefined) continue
          
          const rightMargin = annotationTiles.includes(tile) ? annotationMargin : 0
          
          if (tile === '_space_') {
            if (!hasBackground.value) {
              ctx.fillStyle = 'transparent'
              ctx.fillRect(currentX, posY, width, tileHeight)
            }
            currentX += width
          } else {
            renderTileOnCanvas(ctx, img, tile, currentX, width, tileHeight, posY, currentRotated)
            currentX += width + rightMargin
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
const copyImageToClipboard = async (imageIndex: number) => {
  try {
    const image = generatedImages.value[imageIndex]
    if (!image) throw new Error('이미지를 찾을 수 없습니다.')
    
    const blob = await (await fetch(image.dataUrl)).blob()
    
    const data = [new ClipboardItem({ 'image/png': blob })]
    await navigator.clipboard.write(data)
    errorMessage.value = ''
    showToastMessage('이미지가 클립보드에 복사되었습니다!', 'success')
  } catch (error) {
    const errorMsg = `복사 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    errorMessage.value = errorMsg
    showToastMessage(errorMsg, 'error')
  }
}

/**
 * 단일 이미지 저장
 */
const saveSingleImage = async (imageIndex: number) => {
  try {
    const image = generatedImages.value[imageIndex]
    if (!image) throw new Error('이미지를 찾을 수 없습니다.')
    
    const link = document.createElement('a')
    link.href = image.dataUrl
    link.download = `mahjong-${image.code}-${Date.now()}.png`
    link.click()
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    showToastMessage(errorMessage.value, 'error')
  }
}

/**
 * 모든 이미지 일괄 다운로드 (ZIP 형식)
 */
const downloadAllImages = async () => {
  if (generatedImages.value.length === 0) {
    showToastMessage('다운로드할 이미지가 없습니다.', 'error')
    return
  }

  try {
    // 간단한 방법: 각 이미지를 개별로 다운로드
    for (let i = 0; i < generatedImages.value.length; i++) {
      const image = generatedImages.value[i]
      if (!image) continue
      
      const link = document.createElement('a')
      link.href = image.dataUrl
      link.download = `mahjong-${image.code}-${i + 1}.png`
      
      // 약간의 딜레이를 두고 다운로드
      setTimeout(() => {
        link.click()
      }, i * 200)
    }
    
    showToastMessage(`${generatedImages.value.length}개의 이미지 다운로드 시작`, 'success')
  } catch (error) {
    const errorMsg = `다운로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    errorMessage.value = errorMsg
    showToastMessage(errorMsg, 'error')
  }
}

/**
 * 전체 초기화
 */
const clearAllTiles = () => {
  inputForms.value = [{ code: '' }]
  generatedImages.value = []
  errorMessage.value = ''
}
</script>

<style scoped>
.tile-input-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  /* color: #333; */
  margin-bottom: 30px;
}

/* 입력 폼 개수 조절 */
.form-count-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 6px;
}

.form-count-section label {
  font-weight: bold;
  color: #333;
}

.form-count-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-btn {
  padding: 6px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.3s;
  min-width: 40px;
}

.count-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.count-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.form-count-display {
  min-width: 30px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

/* 여러 입력 폼 */
.input-forms {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 6px;
}

.input-form {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-form:last-child {
  margin-bottom: 0;
}

.form-number {
  font-weight: bold;
  color: #666;
  min-width: 40px;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

/* 일괄 처리 섹션 */
.batch-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.batch-btn {
  padding: 12px 24px;
  background-color: #FF9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.batch-btn:hover:not(:disabled) {
  background-color: #e68900;
}

.batch-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.clear-btn {
  padding: 12px 24px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.clear-btn:hover {
  background-color: #da190b;
}

/* 배경 옵션 */
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

/* 에러 메시지 */
.error-message {
  padding: 12px;
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #f44336;
  margin-bottom: 20px;
  border-radius: 4px;
}

/* 생성된 이미지 표시 */
.images-display {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.images-display h2 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.image-item {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-header {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.image-number {
  font-weight: bold;
  color: #666;
  margin-right: 8px;
}

.image-code {
  font-family: monospace;
  color: #999;
  font-size: 12px;
}

.image-preview-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: #fafafa;
  overflow: auto;
}

.image-preview {
  max-width: 100%;
  max-height: 300px;
  display: block;
}

.image-actions {
  display: flex;
  gap: 5px;
  padding: 10px;
  border-top: 1px solid #eee;
}

.copy-btn,
.save-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.copy-btn {
  background-color: #2196F3;
  color: white;
}

.copy-btn:hover {
  background-color: #0b7dda;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
}

.save-btn:hover {
  background-color: #45a049;
}

/* 일괄 다운로드 버튼 */
.batch-download-section {
  text-align: center;
}

.download-all-btn {
  padding: 12px 24px;
  background-color: #9C27B0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.download-all-btn:hover {
  background-color: #7b1fa2;
}

/* 정보 섹션 */
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

/* 토스트 알림 */
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

/* 반응형 디자인 */
@media (max-width: 768px) {
  .form-count-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .input-form {
    flex-direction: column;
  }

  .form-input {
    width: 100%;
  }

  .batch-section {
    flex-direction: column;
  }

  .batch-btn,
  .clear-btn {
    width: 100%;
  }

  .images-grid {
    grid-template-columns: 1fr;
  }

  .tile-list {
    grid-template-columns: 1fr;
  }
}
</style>
