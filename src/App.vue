<script setup>
import { ref, onMounted } from 'vue';
import { version } from '../package.json';
import { theme, toggleTheme, applyTheme, newCharacter, importCharacter, loadInvestigator } from './store.js';
import { parseShareFromHash } from './share.js';
import { locale, setLocale } from './i18n.js';
import HomeView from './components/HomeView.vue';
import WizardView from './components/WizardView.vue';
import DiceRoller from './components/DiceRoller.vue';

const view = ref('home');
const diceOpen = ref(false);
// 分享链接导入提示：{ name, at, data }
const sharePrompt = ref(null);

onMounted(() => {
  applyTheme();
  checkShareHash();
});

// 检测 URL hash 中携带的分享角色卡（#share=...）
function checkShareHash() {
  const payload = parseShareFromHash(location.hash);
  if (!payload) return;
  sharePrompt.value = payload;
}

// 导入并清除 hash，避免刷新后重复提示
function acceptShare() {
  const payload = sharePrompt.value;
  if (payload) importCharacter(payload.data);
  clearShareHash();
  view.value = 'wizard';
}
function dismissShare() {
  clearShareHash();
}
function clearShareHash() {
  sharePrompt.value = null;
  if (typeof history !== 'undefined' && history.replaceState) {
    history.replaceState(null, '', location.href.split('#')[0]);
  }
}
function shareTimeLabel(at) {
  if (!at) return '';
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

function startNew() {
  newCharacter();
  view.value = 'wizard';
}

function handleImport(data) {
  importCharacter(data);
  view.value = 'wizard';
}

function handleLoad(id) {
  loadInvestigator(id);
  view.value = 'wizard';
}

function goHome() {
  view.value = 'home';
}
</script>

<template>
  <div class="app-root">
    <header class="topbar">
      <button class="btn ghost" v-if="view === 'wizard'" @click="goHome" :title="$t('app.home')">☾ {{ $t('app.home') }}</button>
      <div class="brand" :class="{ 'has-back': view === 'wizard' }">
        <span class="brand-icon">☾</span>
        <div class="brand-text">
          <span class="brand-title">{{ $t('app.brand') }}</span>
          <span class="brand-sub">{{ $t('app.brandSub') }}</span>
        </div>
      </div>
      <div class="spacer"></div>
      <span class="version-badge" :title="$t('app.version')">v{{ version }}</span>
      <select class="lang-select" :value="locale.code" @change="setLocale($event.target.value)" title="语言 / Language / 言語">
        <option value="zh">中文</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
      <button class="btn ghost sm dice-btn" @click="diceOpen = true" :title="$t('app.dice')">
        <font-awesome-icon icon="fa-solid fa-dice" />
      </button>
      <label class="switch" :title="$t('app.theme')">
        <input type="checkbox" :checked="theme.dark" @change="toggleTheme" />
        <span class="track"></span>
        <span class="small dim">{{ theme.dark ? $t('app.themeDark') : $t('app.themeLight') }}</span>
      </label>
    </header>

    <main>
      <HomeView v-if="view === 'home'" @new="startNew" @import="handleImport" @load="handleLoad" />
      <WizardView v-else />
    </main>

    <DiceRoller v-if="diceOpen" @close="diceOpen = false" />

    <!-- 分享链接导入提示 -->
    <div v-if="sharePrompt" class="overlay" @click.self="dismissShare">
      <div class="panel card">
        <div class="p-head">
          <h3><font-awesome-icon icon="fa-solid fa-share-nodes" /> {{ $t('share.title') }}</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="dismissShare">✕</button>
        </div>
        <div class="p-body">
          <p class="share-name">{{ $t('share.name', { name: sharePrompt.name }) }}</p>
          <p v-if="shareTimeLabel(sharePrompt.at)" class="small dim">{{ $t('share.time', { time: shareTimeLabel(sharePrompt.at) }) }}</p>
          <p class="small dim">{{ $t('share.note') }}</p>
          <div class="share-actions">
            <button class="btn primary" @click="acceptShare">{{ $t('share.importView') }}</button>
            <button class="btn ghost" @click="dismissShare">{{ $t('share.ignore') }}</button>
          </div>
        </div>
      </div>
    </div>
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
.lang-select {
  flex: none;
  background: var(--surface-2); color: var(--text); border: 1px solid var(--border);
  border-radius: 999px; padding: 3px 8px; font-size: 0.78rem; cursor: pointer;
}
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
.dice-btn { color: var(--text-dim); }
.dice-btn:hover { color: var(--gold); border-color: var(--border-strong); }

/* 分享链接导入提示 */
.overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.panel { width: 420px; max-width: 100%; display: flex; flex-direction: column; overflow: hidden; }
.p-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
.p-head h3 { font-size: 1.05rem; color: var(--text); display: flex; align-items: center; gap: 8px; }
.p-head h3 :deep(svg) { color: var(--gold); }
.p-body { padding: 16px 18px; }
.share-name { font-size: 1.1rem; margin: 0 0 6px; color: var(--text); }
.share-name b { color: var(--gold); }
.share-actions { display: flex; gap: 10px; margin-top: 16px; }
</style>
