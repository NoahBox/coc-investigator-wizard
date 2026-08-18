<script setup>
import { ref, computed, onMounted } from 'vue';
import { importSaikoBase64 } from '../saiko.js';
import { listInvestigators, deleteInvestigator, duplicateInvestigator, buildRosterExport, parseRosterExport, importInvestigators } from '../store.js';
import { downloadRosterBackup } from '../export.js';

const emit = defineEmits(['new', 'import', 'load']);
const fileInput = ref(null);
const saikoOpen = ref(false);
const saikoText = ref('');
const saikoError = ref('');
const roster = ref([]);

function refresh() { roster.value = listInvestigators(); }
onMounted(refresh);

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

function openCard(id) { emit('load', id); }
function dupCard(id) { duplicateInvestigator(id); refresh(); }
function delCard(id) {
  const c = roster.value.find(x => x.id === id);
  if (!confirm(`确定删除调查员「${c ? c.name : ''}」吗？此操作不可撤销。`)) return;
  deleteInvestigator(id);
  refresh();
}
function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ---- 花名册导出 / 导入 ----
const rosterFile = ref(null);
const exportOpen = ref(false);
const exportList = ref([]);
const importOpen = ref(false);
const importList = ref([]);

const exportCheckedCount = computed(() => exportList.value.filter(c => c.checked).length);
const importCheckedCount = computed(() => importList.value.filter(c => c.checked).length);

function openExport() {
  exportList.value = listInvestigators().map(c => ({ ...c, checked: true }));
  exportOpen.value = true;
}
function toggleAllExport() {
  const all = exportList.value.length > 0 && exportList.value.every(c => c.checked);
  exportList.value.forEach(c => { c.checked = !all; });
}
function doExport() {
  const ids = exportList.value.filter(c => c.checked).map(c => c.id);
  if (!ids.length) return;
  downloadRosterBackup(buildRosterExport(ids));
  exportOpen.value = false;
}
function onPickRosterFile() { if (rosterFile.value) rosterFile.value.click(); }
function onRosterFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseRosterExport(reader.result);
    if (!parsed || !parsed.cards.length) {
      alert('文件解析失败，请确认是导出的调查员备份（lz-string 压缩 JSON）。');
      return;
    }
    importList.value = parsed.cards.map(card => ({
      id: card.id,
      card,
      name: card.name || '未命名调查员',
      jobName: card.jobType === 'preset' ? (card.jobName || '未知职业') : (card.customJobName || '自定义职业'),
      age: card.age,
      checked: true,
    }));
    importOpen.value = true;
  };
  reader.readAsText(file);
  e.target.value = '';
}
function toggleAllImport() {
  const all = importList.value.length > 0 && importList.value.every(c => c.checked);
  importList.value.forEach(c => { c.checked = !all; });
}
function doImport() {
  const cards = importList.value.filter(c => c.checked).map(c => c.card);
  if (!cards.length) return;
  const n = importInvestigators(cards);
  importOpen.value = false;
  refresh();
  alert(`已导入 ${n} 名调查员。`);
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
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-person-circle-plus" /></span>
        <span class="opt-title">新调查员</span>
        <span class="opt-desc dim small">从零开始，一步步创建一名全新的调查员</span>
      </button>
      <button class="opt-card card" @click="onPickFile">
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-arrow-up-from-bracket" /></span>
        <span class="opt-title">导入调查员</span>
        <span class="opt-desc dim small">导入 JSON 文件，继续编辑或进行幕间成长</span>
      </button>
      <button class="opt-card card" @click="openSaiko">
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-left-right" /></span>
        <span class="opt-title">导入 Saiko Base64</span>
        <span class="opt-desc dim small">粘贴 TRPG Saiko 车卡工具导出的 Base64 串</span>
      </button>
    </div>

    <input ref="fileInput" type="file" accept="application/json,.json" style="display:none" @change="onFileChange" />

    <!-- 我的调查员（花名册） -->
    <section class="roster">
      <h2 class="section-title"><span class="sigil">☾</span> 我的调查员</h2>
      <div class="roster-toolbar">
        <span class="dim small">共 {{ roster.length }} 名</span>
        <span class="spacer"></span>
        <button class="btn ghost sm" :disabled="roster.length === 0" @click="openExport">
          <font-awesome-icon icon="fa-solid fa-file-export" />
        </button>
        <button class="btn ghost sm" @click="onPickRosterFile">
          <font-awesome-icon icon="fa-solid fa-file-import" />
        </button>
      </div>
      <input ref="rosterFile" type="file" accept="application/json,.json,.coc.json" style="display:none" @change="onRosterFileChange" />
      <ul v-if="roster.length" class="roster-list">
        <li
          v-for="c in roster"
          :key="c.id"
          class="roster-item card"
          :class="{ active: c.current }"
          @click="openCard(c.id)"
        >
          <div class="ri-main">
            <span class="ri-name">{{ c.name }}</span>
            <span class="ri-meta dim small">{{ c.jobName }}<template v-if="c.age"> · {{ c.age }}岁</template></span>
          </div>
          <span class="ri-time dim small">{{ fmt(c.updatedAt) }}</span>
          <div class="ri-actions" @click.stop>
            <button class="btn ghost sm" @click="dupCard(c.id)">
              <font-awesome-icon icon="fa-solid fa-copy" />
            </button>
            <button class="btn ghost sm danger" @click="delCard(c.id)">
              <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="roster-empty dim small">暂无已保存的调查员，新建或导入一张开始吧。</p>
    </section>

    <!-- 导出调查员 -->
    <div v-if="exportOpen" class="overlay" @click.self="exportOpen = false">
      <div class="modal card">
        <div class="modal-head">
          <h3>导出调查员</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="exportOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <button class="btn ghost sm mb-8" @click="toggleAllExport">全选 / 取消</button>
          <ul class="pick-list">
            <li v-for="c in exportList" :key="c.id" class="pick-item">
              <label>
                <input type="checkbox" v-model="c.checked" />
                <span class="pi-name">{{ c.name }}</span>
                <span class="pi-meta dim small">{{ c.jobName }}<template v-if="c.age"> · {{ c.age }}岁</template></span>
              </label>
            </li>
          </ul>
        </div>
        <div class="modal-foot row">
          <button class="btn" @click="exportOpen = false">取消</button>
          <span class="spacer"></span>
          <button class="btn primary" :disabled="exportCheckedCount === 0" @click="doExport">导出选中（{{ exportCheckedCount }}）</button>
        </div>
      </div>
    </div>

    <!-- 导入调查员 -->
    <div v-if="importOpen" class="overlay" @click.self="importOpen = false">
      <div class="modal card">
        <div class="modal-head">
          <h3>导入调查员</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="importOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <button class="btn ghost sm mb-8" @click="toggleAllImport">全选 / 取消</button>
          <ul class="pick-list">
            <li v-for="c in importList" :key="c.id" class="pick-item">
              <label>
                <input type="checkbox" v-model="c.checked" />
                <span class="pi-name">{{ c.name }}</span>
                <span class="pi-meta dim small">{{ c.jobName }}<template v-if="c.age"> · {{ c.age }}岁</template></span>
              </label>
            </li>
          </ul>
        </div>
        <div class="modal-foot row">
          <button class="btn" @click="importOpen = false">取消</button>
          <span class="spacer"></span>
          <button class="btn primary" :disabled="importCheckedCount === 0" @click="doImport">导入选中（{{ importCheckedCount }}）</button>
        </div>
      </div>
    </div>

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
.hero { text-align: center; margin-bottom: 10px; }
.sigil-wide { justify-content: center; font-size: 1.2rem; margin-bottom: 18px; }
.hero-title {
  font-size: 3rem; letter-spacing: 0.12em; color: var(--text);
  text-shadow: 0 0 24px var(--accent-dim);
}
.hero-sub { color: var(--gold); letter-spacing: 0.22em; font-size: 0.8rem; margin: 10px 0 10px; }
.hero-desc { max-width: 560px; margin: 0 auto; line-height: 1.8; }
.options { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
.opt-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 24px; cursor: pointer; text-align: center;
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
@media (max-width: 640px) { .options { grid-template-columns: 1fr; } .roster-list { grid-template-columns: 1fr; } }

/* 我的调查员 */
.roster { margin-top: 20px; }
.section-title {
  display: flex; align-items: center; gap: 10px;
  font-family: Georgia, serif; font-size: 1.25rem; color: var(--text);
  letter-spacing: 0.08em; margin-bottom: 18px;
}
.section-title .sigil { color: var(--gold); }
.roster-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.roster-item {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px 18px; cursor: pointer;
  border: 1px solid var(--border); transition: transform 0.12s, border-color 0.2s, box-shadow 0.2s;
}
.roster-item:hover { transform: translateY(-2px); border-color: var(--accent); box-shadow: var(--shadow-lg); }
.roster-item.active { border-color: var(--gold); }
.ri-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.ri-name { font-family: Georgia, serif; font-size: 1.15rem; color: var(--text); letter-spacing: 0.04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ri-time { flex: none; color: var(--text-faint); }
.ri-actions { display: flex; gap: 8px; flex: none; margin-left: auto; }
.btn.ghost.sm { color: var(--accent); border-color: var(--border);}
.btn.ghost.sm.danger { color: #d98a7b; border-color: rgba(217,138,123,0.4); }
.btn.ghost.sm.danger:hover { border-color: #d98a7b; color: #e89c8e; }
.roster-empty { padding: 18px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; }
.roster-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.roster-toolbar .spacer { flex: 1; }

/* 导出/导入选择列表 */
.pick-list { list-style: none; margin: 0; padding: 0; max-height: 52vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.pick-item { padding: 9px 11px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface-2); }
.pick-item label { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.pi-name { font-family: Georgia, serif; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pi-meta { margin-left: auto; flex: none; }
</style>
