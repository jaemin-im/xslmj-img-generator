<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TileInputView from './views/TileInputView.vue'

const theme = ref('dark')

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.toggle('light-mode', theme.value === 'light')
  localStorage.setItem('theme', theme.value)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    theme.value = savedTheme
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode')
    }
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    theme.value = 'light'
    document.documentElement.classList.add('light-mode')
  }
})
</script>

<template>
  <div class="theme-toggle-container">
    <button @click="toggleTheme" class="theme-toggle-button">
      {{ theme === 'dark' ? '☀️' : '🌙' }}
    </button>
  </div>
  <TileInputView />
</template>

<style scoped>
.theme-toggle-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.theme-toggle-button {
  background-color: var(--button-bg-color);
  color: var(--text-color);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.6em 1.2em;
  cursor: pointer;
  font-size: 1.2rem;
}

.theme-toggle-button:hover {
  border-color: var(--button-hover-border-color);
}
</style>

