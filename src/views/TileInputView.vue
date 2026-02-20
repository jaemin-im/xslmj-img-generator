<template>
  <div class="tile-input-container">
    <h1>마작패 이미지 생성기</h1>
    
    <div class="input-section">
      <label for="tileCode">마작패 코드 입력 (예: 1m, 5p, 3s, 7z):</label>
      <input
        id="tileCode"
        v-model="inputCode"
        type="text"
        placeholder="1m, 2p, 3s, 4z 등"
        @keyup.enter="addTile"
        maxlength="3"
      />
      <button @click="addTile">추가</button>
      <button @click="clearTiles" class="clear-btn">초기화</button>
    </div>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div v-if="tiles.length > 0" class="tiles-display">
      <h2>입력된 마작패:</h2>
      <div class="tiles-wrapper">
        <div v-for="(tile, index) in tiles" :key="index" class="tile-item">
          <MahjongTile :code="tile" />
          <button @click="removeTile(index)" class="remove-btn">×</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MahjongTile from '../components/MahjongTile.vue'
import { getTilePosition } from '../utils/tileUtils'

const inputCode = ref('')
const tiles = ref<string[]>([])
const errorMessage = ref('')

const addTile = () => {
  const code = inputCode.value.toLowerCase().trim()
  
  if (!code) {
    errorMessage.value = '마작패 코드를 입력하세요.'
    return
  }

  try {
    // 유효성 검사 - getTilePosition 함수를 사용해 유효한 코드인지 확인
    getTilePosition(code)
    tiles.value.push(code)
    inputCode.value = ''
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `유효하지 않은 코드입니다: ${code} (형식: 1m~9m, 1p~9p, 1s~9s, 1z~7z)`
  }
}

const removeTile = (index: number) => {
  tiles.value.splice(index, 1)
}

const clearTiles = () => {
  tiles.value = []
  errorMessage.value = ''
  inputCode.value = ''
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

.tiles-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tile-item {
  position: relative;
  display: inline-block;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  padding: 0;
  background-color: #f44336;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
}

.remove-btn:hover {
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
