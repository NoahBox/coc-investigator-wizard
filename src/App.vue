<script setup>
import { ref, onMounted } from 'vue';
import { version } from '../package.json';
import { theme, toggleTheme, applyTheme, newCharacter, importCharacter } from './store.js';
import HomeView from './components/HomeView.vue';
import WizardView from './components/WizardView.vue';

const view = ref('home');

onMounted(() => applyTheme());

function startNew() {
  newCharacter();
  view.value = 'wizard';
}

function handleImport(data) {
  importCharacter(data);
  view.value = 'wizard';
}

function goHome() {
  view.value = 'home';
}
</script>

<template>
  <div class="app-root">
    <header class="topbar">
      <button class="btn ghost" v-if="view === 'wizard'" @click="goHome" title="返回首页">☾ 首页</button>
      <div class="brand" :class="{ 'has-back': view === 'wizard' }">
        <span class="brand-icon">☾</span>
        <div class="brand-text">
          <span class="brand-title">调查员之书</span>
          <span class="brand-sub">THE INVESTIGATOR'S TOME · COC 7E</span>
        </div>
      </div>
      <div class="spacer"></div>
      <span class="version-badge" title="当前版本">v{{ version }}</span>
      <label class="switch" title="深色 / 浅色模式">
        <input type="checkbox" :checked="theme.dark" @change="toggleTheme" />
        <span class="track"></span>
        <span class="small dim">{{ theme.dark ? '深色' : '浅色' }}</span>
      </label>
    </header>

    <main>
      <HomeView v-if="view === 'home'" @new="startNew" @import="handleImport" />
      <WizardView v-else />
    </main>
  </div>
</template>

<style scoped>
.app-root { display: flex; flex-direction: column; min-height: 100vh; }
.topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 6px rgba(0,0,0,0.25);
  position: sticky; top: 0; z-index: 50;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-icon { font-size: 1.6rem; color: var(--gold); }
.brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.brand-title { font-family: Georgia, serif; font-size: 1.15rem; color: var(--text); letter-spacing: 0.08em; }
.brand-sub { font-size: 0.62rem; color: var(--text-faint); letter-spacing: 0.18em; }
.spacer { flex: 1; }
.version-badge {
  flex: none;
  font-family: Georgia, serif;
  font-size: 0.78rem;
  color: var(--text-dim);
  padding: 3px 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  white-space: nowrap;
}
main { flex: 1; }
</style>
