<script setup>
import { ref } from 'vue';
import { importSaikoBase64 } from '../saiko.js';

const emit = defineEmits(['new', 'import']);
const fileInput = ref(null);
const saikoOpen = ref(false);
const saikoText = ref('');
const saikoError = ref('');

function onPickFile() {
  fileInput.value.click();
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      emit('import', data);
    } catch (err) {
      alert('JSON 文件解析失败，请确认是导出的调查员文件。');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function openSaiko() {
  saikoText.value = '';
  saikoError.value = '';
  saikoOpen.value = true;
}
function applySaiko() {
  try {
    const char = importSaikoBase64(saikoText.value);
    saikoOpen.value = false;
    emit('import', char);
  } catch (err) {
    saikoError.value = 'Base64 串解析失败，请确认是从 TRPG Saiko 车卡工具复制的内容。';
  }
}
</script>

<template>
  <div class="home fade-in">
    <div class="hero">
      <div class="sigil sigil-wide">☾ ✦ ☾</div>
      <h1 class="hero-title">调查员之书</h1>
      <p class="hero-sub serif">CALL OF CTHULHU · INVESTIGATOR CREATOR</p>
      <p class="hero-desc dim">
        在疯狂与理智的边缘，塑造你的调查员。<br>
        本工具将引导你完成 COC 第七版角色卡的完整创建流程。<br>
        部分灵感来源于<a href="https://github.com/masquevil/trpg-saikou" target="_blank"><strong>trpg-saiko</strong></a>
      </p>
    </div>

    <div class="options">
      <button class="opt-card card" @click="emit('new')">
        <span class="opt-icon">☽</span>
        <span class="opt-title">新调查员</span>
        <span class="opt-desc dim small">从零开始，一步步创建一名全新的调查员</span>
      </button>
      <button class="opt-card card" @click="onPickFile">
        <span class="opt-icon">⇪</span>
        <span class="opt-title">导入调查员</span>
        <span class="opt-desc dim small">导入 JSON 文件，继续编辑或进行幕间成长</span>
      </button>
      <button class="opt-card card" @click="openSaiko">
        <span class="opt-icon">⇄</span>
        <span class="opt-title">导入 Saiko Base64</span>
        <span class="opt-desc dim small">粘贴 TRPG Saiko 车卡工具导出的 Base64 串</span>
      </button>
    </div>

    <input ref="fileInput" type="file" accept="application/json,.json" style="display:none" @change="onFileChange" />

    <!-- Saiko Base64 导入对话框 -->
    <div v-if="saikoOpen" class="overlay" @click.self="saikoOpen = false">
      <div class="modal card">
        <div class="modal-head">
          <h3>导入 Saiko Base64</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="saikoOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="hint mb-8">将从 TRPG Saiko 车卡工具「导入/导出数据」复制的内容粘贴到下方：</p>
          <textarea class="inp" rows="10" v-model="saikoText" placeholder="粘贴 Base64 串…"></textarea>
          <p v-if="saikoError" class="warn-text mt-8">{{ saikoError }}</p>
        </div>
        <div class="modal-foot row">
          <button class="btn" @click="saikoOpen = false">取消</button>
          <span class="spacer"></span>
          <button class="btn primary" :disabled="!saikoText.trim()" @click="applySaiko">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home { max-width: 820px; margin: 0 auto; padding: 48px 20px 60px; }
.hero { text-align: center; margin-bottom: 44px; }
.sigil-wide { justify-content: center; font-size: 1.2rem; margin-bottom: 18px; }
.hero-title {
  font-size: 3rem; letter-spacing: 0.12em; color: var(--text);
  text-shadow: 0 0 24px var(--accent-dim);
}
.hero-sub { color: var(--gold); letter-spacing: 0.22em; font-size: 0.8rem; margin: 10px 0 22px; }
.hero-desc { max-width: 560px; margin: 0 auto; line-height: 1.8; }
.options { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
.opt-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 40px 24px; cursor: pointer; text-align: center;
  border: 1px solid var(--border); transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s;
  background: var(--surface);
}
.opt-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: var(--shadow-lg); }
.opt-icon { font-size: 2.4rem; color: var(--accent); }
.opt-title { font-family: Georgia, serif; font-size: 1.4rem; color: var(--text); letter-spacing: 0.06em; }
.opt-desc { line-height: 1.6; }

.overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { width: 600px; max-width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
.modal-body { padding: 16px 18px; }
.modal-foot { padding: 12px 18px; border-top: 1px solid var(--border); gap: 10px; }
.spacer { flex: 1; }
@media (max-width: 640px) { .options { grid-template-columns: 1fr; } }
</style>
