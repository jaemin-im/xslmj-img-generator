<template>
  <div class="tile-input-container">
    <h1>마작패 이미지 생성기</h1>
    
    <div class="input-section">
      <label for="tileCode">마작패 코드 입력 (예: 123m35678p12399s):</label>
      <input
        id="tileCode"
        v-model="inputCode"
        type="text"
        placeholder="123m35678p12399s 등"
        @keyup.enter="addTiles"
      />
      <button @click="addTiles">추가</button>
      <button @click="clearAllTiles" class="clear-btn">초기화</button>
    </div>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-if="tileRows.length > 0" class="tiles-display">
      <h2>입력된 마작패:</h2>
      <div v-for="(row, rowIndex) in tileRows" :key="rowIndex" class="tile-row">
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
import { ref } from 'vue'
import MahjongTile from '../components/MahjongTile.vue'
import { parseTileString } from '../utils/tileUtils'

interface TileRow {
  tiles: string[]
}

const inputCode = ref('')
const tileRows = ref<TileRow[]>([])
const errorMessage = ref('')
const canvasRef = ref<HTMLCanvasElement | null>(null)

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
 * 타일 행을 캔버스에 렌더링
 */
const renderTilesToCanvas = (tiles: string[]): HTMLCanvasElement => {
  const canvas = canvasRef.value || document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.')

  // 캔버스 크기 설정
  const tileWidth = 30
  const tileHeight = 44
  canvas.width = tiles.length * tileWidth
  canvas.height = tileHeight

  // tiles.svg 이미지 로드 및 렌더링
  const img = new Image()
  img.src = '/tiles.svg'
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]
        const match = tile.match(/^(\d+)([mpsz])$/)
        
        if (!match) {
          reject(new Error(`Invalid tile: ${tile}`))
          return
        }

        const number = parseInt(match[1])
        const suit = match[2]

        // 배경 위치 계산
        let y = 0
        switch (suit) {
          case 'm': y = 0; break
          case 'p': y = -44; break
          case 's': y = -88; break
          case 'z': y = -132; break
        }
        const x = -(number - 1) * 30

        // 캔버스에 이미지 영역 그리기
        ctx.drawImage(
          img,
          -x, // 소스 x
          -y, // 소스 y
          canvas.width, // 소스 너비
          tileHeight, // 소스 높이
          i * tileWidth, // 대상 x
          0, // 대상 y
          tileWidth, // 대상 너비
          tileHeight // 대상 높이
        )
      }
      resolve(canvas)
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
    const canvas = canvasRef.value || document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.')

    const tileWidth = 30
    const tileHeight = 44
    canvas.width = tiles.length * tileWidth
    canvas.height = tileHeight

    const img = new Image()
    img.src = '/tiles.svg'

    await new Promise((resolve, reject) => {
      img.onload = () => {
        for (let i = 0; i < tiles.length; i++) {
          const tile = tiles[i]
          const match = tile.match(/^(\d+)([mpsz])$/)
          
          if (!match) {
            reject(new Error(`Invalid tile: ${tile}`))
            return
          }

          const number = parseInt(match[1])
          const suit = match[2]

          let y = 0
          switch (suit) {
            case 'm': y = 0; break
            case 'p': y = -44; break
            case 's': y = -88; break
            case 'z': y = -132; break
          }
          const x = -(number - 1) * 30

          ctx.drawImage(
            img,
            -x,
            -y,
            canvas.width,
            tileHeight,
            i * tileWidth,
            0,
            tileWidth,
            tileHeight
          )
        }
        resolve(null)
      }
      img.onerror = () => reject(new Error('tiles.svg 로드 실패'))
    })

    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Blob 생성 실패')
      
      const data = [new ClipboardItem({ 'image/png': blob })]
      await navigator.clipboard.write(data)
      errorMessage.value = ''
      alert('이미지가 클립보드에 복사되었습니다!')
    })
  } catch (error) {
    errorMessage.value = `복사 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
  }
}

/**
 * 이미지 저장
 */
const saveTileImage = (rowIndex: number) => {
  try {
    const tiles = tileRows.value[rowIndex].tiles
    const canvas = canvasRef.value || document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.')

    const tileWidth = 30
    const tileHeight = 44
    canvas.width = tiles.length * tileWidth
    canvas.height = tileHeight

    const img = new Image()
    img.src = '/tiles.svg'

    img.onload = () => {
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]
        const match = tile.match(/^(\d+)([mpsz])$/)
        
        if (!match) {
          errorMessage.value = `Invalid tile: ${tile}`
          return
        }

        const number = parseInt(match[1])
        const suit = match[2]

        let y = 0
        switch (suit) {
          case 'm': y = 0; break
          case 'p': y = -44; break
          case 's': y = -88; break
          case 'z': y = -132; break
        }
        const x = -(number - 1) * 30

        ctx.drawImage(
          img,
          -x,
          -y,
          canvas.width,
          tileHeight,
          i * tileWidth,
          0,
          tileWidth,
          tileHeight
        )
      }

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `mahjong-${tiles.join('')}-${Date.now()}.png`
      link.click()
      errorMessage.value = ''
    }

    img.onerror = () => {
      errorMessage.value = 'tiles.svg 로드 실패'
    }
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
</style>
