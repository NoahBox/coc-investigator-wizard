<script setup>
import { ref, computed, onMounted } from 'vue';
import { importSaikoBase64 } from '../saiko.js';
import { listInvestigators, deleteInvestigator, duplicateInvestigator, setInvestigatorImported, buildRosterExport, parseRosterExport, importInvestigators } from '../store.js';
import { downloadRosterBackup } from '../export.js';
import { getEra } from '../data/eras.js';
import { dataName, t } from '../i18n.js';

const emit = defineEmits(['new', 'import', 'load']);
const fileInput = ref(null);
const saikoOpen = ref(false);
const saikoText = ref('');
const saikoError = ref('');
const roster = ref([]);

// ---- 花名册 搜索 / 时代筛选 / 视图切换 ----
const VIEW_KEY = 'coc-wizard-roster-view';
const query = ref('');
const eraFilter = ref('all');
const viewMode = ref(localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list');

function eraLabel(era) {
  if (era === '1920s') return '1920s';
  if (era === 'modern') return dataName('现代');
  const e = getEra(era);
  return e ? dataName(e.label) : era;
}
const eraOptions = computed(() => {
  const set = new Set(roster.value.map(c => c.era));
  const ids = ['all', ...[...set].sort((a, b) => a.localeCompare(b, 'zh'))];
  return ids.map(id => ({ id, label: id === 'all' ? t('home.eraAll') : eraLabel(id) }));
});
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return roster.value.filter(c => {
    const okQ = !q || c.name.toLowerCase().includes(q) || c.jobName.toLowerCase().includes(q);
    const okE = eraFilter.value === 'all' || c.era === eraFilter.value;
    return okQ && okE;
  });
});
function toggleView() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  localStorage.setItem(VIEW_KEY, viewMode.value);
}

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
      alert(t$t('home.jsonError'));
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
    saikoError.value = t$t('home.saikoError');
  }
}

function openCard(id) { emit('load', id); }
function dupCard(id) { duplicateInvestigator(id); refresh(); }
function toggleMode(c) {
  setInvestigatorImported(c.id, !c.imported);
  refresh();
}
function delCard(id) {
  const c = roster.value.find(x => x.id === id);
  const msg = t$t('home.confirmDelete', { name: c ? c.name : '' });
  if (!confirm(msg)) return;
  deleteInvestigator(id);
  refresh();
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
      alert(t$t('home.rosterError'));
      return;
    }
    importList.value = parsed.cards.map(card => ({
      id: card.id,
      card,
      name: card.name || t('common.unnamed'),
      jobName: card.jobType === 'preset' ? (card.jobName || '') : (card.customJobName || ''),
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
  alert(t$t('home.importSuccess', { n }));
}
</script>

<template>
  <div class="home fade-in">
    <div class="hero">
      <div class="sigil sigil-wide">☾ ✦ ☾</div>
      <h1 class="hero-title">{{ $t('home.heroTitle') }}</h1>
      <p class="hero-sub serif">{{ $t('home.heroSub') }}</p>
      <p class="hero-desc dim">
        {{ $t('home.heroDesc1') }}<br>
        {{ $t('home.heroDesc2') }}<br>
        {{ $t('home.heroDesc3') }}<a href="https://github.com/masquevil/trpg-saikou" target="_blank"><strong>trpg-saiko</strong></a>
      </p>
    </div>

    <div class="options">
      <button class="opt-card card" @click="emit('new')">
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-person-circle-plus" /></span>
        <span class="opt-title">{{ $t('home.newTitle') }}</span>
        <span class="opt-desc dim small">{{ $t('home.newDesc') }}</span>
      </button>
      <button class="opt-card card" @click="onPickFile">
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-arrow-up-from-bracket" /></span>
        <span class="opt-title">{{ $t('home.importTitle') }}</span>
        <span class="opt-desc dim small">{{ $t('home.importDesc') }}</span>
      </button>
      <button class="opt-card card" @click="openSaiko">
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-left-right" /></span>
        <span class="opt-title">{{ $t('home.saikoTitle') }}</span>
        <span class="opt-desc dim small">{{ $t('home.saikoDesc') }}</span>
      </button>
    </div>

    <input ref="fileInput" type="file" accept="application/json,.json" style="display:none" @change="onFileChange" />

    <!-- 我的调查员（花名册） -->
    <section class="roster">
      <h2 class="section-title"><span class="sigil">☾</span> {{ $t('home.rosterTitle') }}</h2>
      <div class="roster-toolbar">
        <input
          class="inp roster-search"
          type="search"
          v-model="query"
          :placeholder="$t('home.searchPh')"
          aria-label="search"
        />
        <select class="inp roster-era" v-model="eraFilter" aria-label="era">
          <option v-for="e in eraOptions" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
        <button
          class="btn ghost sm"
          @click="toggleView"
          :title="viewMode === 'grid' ? $t('home.viewGrid') : $t('home.viewList')"
        >
          <font-awesome-icon :icon="viewMode === 'grid' ? 'fa-solid fa-list' : 'fa-solid fa-table-cells-large'" />
        </button>
        <span class="dim small count">{{ filtered.length }}/{{ roster.length }}</span>
        <span class="spacer"></span>
        <button class="btn ghost sm" :disabled="roster.length === 0" :title="$t('home.exportBtn')" @click="openExport">
          <font-awesome-icon icon="fa-solid fa-file-export" />
        </button>
        <button class="btn ghost sm" :title="$t('home.importBtn')" @click="onPickRosterFile">
          <font-awesome-icon icon="fa-solid fa-file-import" />
        </button>
      </div>
      <input ref="rosterFile" type="file" accept="application/json,.json,.coc.json" style="display:none" @change="onRosterFileChange" />

      <!-- 列表视图 -->
      <ul v-if="filtered.length && viewMode === 'list'" class="roster-list">
        <li
          v-for="c in filtered"
          :key="c.id"
          class="roster-item card"
          :class="{ active: c.current }"
          @click="openCard(c.id)"
        >
          <div class="ri-main">
            <span class="ri-name">{{ c.name }}</span>
            <span class="ri-meta dim small">{{ eraLabel(c.era) }}</span>
            <span class="ri-meta dim small">{{ $dnt(c.jobName) }}</span>
          </div>
          <div class="ri-actions" @click.stop>
            <button
              class="btn ghost sm mode-toggle"
              :class="{ done: c.imported }"
              @click="toggleMode(c)"
              :title="c.imported ? $t('home.modeDoneTitle') : $t('home.modeCreatingTitle')"
            >{{ c.imported ? $t('home.done') : $t('home.creating') }}</button>
            <button class="btn ghost sm" @click="dupCard(c.id)">
              <font-awesome-icon icon="fa-solid fa-copy" />
            </button>
            <button class="btn ghost sm danger" @click="delCard(c.id)">
              <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
          </div>
        </li>
      </ul>

      <!-- 卡片视图（头像缩略图 + 姓名） -->
      <ul v-if="filtered.length && viewMode === 'grid'" class="roster-grid">
        <li
          v-for="c in filtered"
          :key="c.id"
          class="roster-card card"
          :class="{ active: c.current }"
          @click="openCard(c.id)"
        >
          <span class="rc-avatar" :class="{ empty: !c.avatar }">
            <img v-if="c.avatar" :src="c.avatar" alt="" />
            <font-awesome-icon v-else icon="fa-solid fa-user" />
          </span>
          <span class="rc-name">{{ c.name }}</span>
          <span class="rc-meta dim small">{{ eraLabel(c.era) }}</span>
          <span class="rc-meta dim small">{{ $dnt(c.jobName) }}</span>
          <div class="rc-actions" @click.stop>
            <button
              class="btn ghost sm mode-toggle"
              :class="{ done: c.imported }"
              @click="toggleMode(c)"
              :title="c.imported ? $t('home.modeDoneTitle') : $t('home.modeCreatingTitle')"
            >{{ c.imported ? $t('home.done') : $t('home.creating') }}</button>
            <button class="btn ghost sm" @click="dupCard(c.id)">
              <font-awesome-icon icon="fa-solid fa-copy" />
            </button>
            <button class="btn ghost sm danger" @click="delCard(c.id)">
              <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
          </div>
        </li>
      </ul>

      <p v-if="roster.length && !filtered.length" class="roster-empty dim small">{{ $t('home.emptyFiltered') }}</p>
      <p v-else-if="!roster.length" class="roster-empty dim small">{{ $t('home.emptyRoster') }}</p>
    </section>

    <!-- 导出调查员 -->
    <div v-if="exportOpen" class="overlay" @click.self="exportOpen = false">
      <div class="modal card">
        <div class="modal-head">
          <h3>{{ $t('home.exportModal') }}</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="exportOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <button class="btn ghost sm mb-8" @click="toggleAllExport">{{ $t('home.selectAll') }}</button>
          <ul class="pick-list">
            <li v-for="c in exportList" :key="c.id" class="pick-item">
              <label>
                <input type="checkbox" v-model="c.checked" />
                <span class="pi-name">{{ c.name }}</span>
                <span class="pi-meta dim small">{{ $dnt(c.jobName) }}</span>
              </label>
            </li>
          </ul>
        </div>
        <div class="modal-foot row">
          <button class="btn" @click="exportOpen = false">{{ $t('common.cancel') }}</button>
          <span class="spacer"></span>
          <button class="btn primary" :disabled="exportCheckedCount === 0" @click="doExport">{{ $t('home.exportSelected', { n: exportCheckedCount }) }}</button>
        </div>
      </div>
    </div>

    <!-- 导入调查员 -->
    <div v-if="importOpen" class="overlay" @click.self="importOpen = false">
      <div class="modal card">
        <div class="modal-head">
          <h3>{{ $t('home.importModal') }}</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="importOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <button class="btn ghost sm mb-8" @click="toggleAllImport">{{ $t('home.selectAll') }}</button>
          <ul class="pick-list">
            <li v-for="c in importList" :key="c.id" class="pick-item">
              <label>
                <input type="checkbox" v-model="c.checked" />
                <span class="pi-name">{{ c.name }}</span>
                <span class="pi-meta dim small">{{ $dnt(c.jobName) }}</span>
              </label>
            </li>
          </ul>
        </div>
        <div class="modal-foot row">
          <button class="btn" @click="importOpen = false">{{ $t('common.cancel') }}</button>
          <span class="spacer"></span>
          <button class="btn primary" :disabled="importCheckedCount === 0" @click="doImport">{{ $t('home.importSelected', { n: importCheckedCount }) }}</button>
        </div>
      </div>
    </div>

    <!-- Saiko Base64 导入对话框 -->
    <div v-if="saikoOpen" class="overlay" @click.self="saikoOpen = false">
      <div class="modal card">
        <div class="modal-head">
          <h3>{{ $t('home.saikoModal') }}</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="saikoOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="hint mb-8">{{ $t('home.saikoHint') }}</p>
          <textarea class="inp" rows="10" v-model="saikoText" :placeholder="$t('home.saikoPh')"></textarea>
          <p v-if="saikoError" class="warn-text mt-8">{{ saikoError }}</p>
        </div>
        <div class="modal-foot row">
          <button class="btn" @click="saikoOpen = false">{{ $t('common.cancel') }}</button>
          <span class="spacer"></span>
          <button class="btn primary" :disabled="!saikoText.trim()" @click="applySaiko">{{ $t('home.import') }}</button>
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
@media (max-width: 640px) { .options { grid-template-columns: 1fr; } .roster-list { grid-template-columns: 1fr; } .roster-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .roster-toolbar { flex-wrap: wrap; } .roster-search { max-width: none; } }

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
.ri-actions { display: flex; gap: 8px; flex: none; margin-left: auto; align-items: center; }
.mode-toggle { min-width: 58px; justify-content: center; color: var(--text-dim); border-color: var(--border); }
.mode-toggle.done { color: var(--accent-strong); border-color: var(--accent); background: var(--accent-dim); }
.btn.ghost.sm { color: var(--accent); border-color: var(--border);}
.btn.ghost.sm.danger { color: #d98a7b; border-color: rgba(217,138,123,0.4); }
.btn.ghost.sm.danger:hover { border-color: #d98a7b; color: #e89c8e; }
.roster-empty { padding: 18px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; }
.roster-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.roster-toolbar .spacer { flex: 1; }
.roster-toolbar .count { flex: none; min-width: 3.2em; text-align: right; }
.roster-search { flex: 1; min-width: 120px; max-width: 260px; }
.roster-era { flex: none; width: auto; max-width: 170px; }

/* 卡片视图：头像缩略图 + 姓名 */
.roster-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.roster-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 14px 14px; cursor: pointer; text-align: center;
  min-width: 0; width: 100%; box-sizing: border-box;
  border: 1px solid var(--border); transition: transform 0.12s, border-color 0.2s, box-shadow 0.2s;
}
.roster-card:hover { transform: translateY(-2px); border-color: var(--accent); box-shadow: var(--shadow-lg); }
.roster-card.active { border-color: var(--gold); }
.rc-avatar {
  width: 72px; height: 72px; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--border); background: var(--surface-2); color: var(--text-faint);
  font-size: 1.6rem;
}
.rc-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rc-name { font-family: Georgia, serif; font-size: 1.15rem; color: var(--text); letter-spacing: 0.04em; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rc-meta { line-height: 1.4; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rc-actions { display: flex; gap: 8px; margin-top: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }

/* 列表视图：时代 / 职业 各占一行，超出裁切 */
.ri-meta { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 导出/导入选择列表 */
.pick-list { list-style: none; margin: 0; padding: 0; max-height: 52vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.pick-item { padding: 9px 11px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface-2); }
.pick-item label { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.pi-name { font-family: Georgia, serif; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pi-meta { margin-left: auto; flex: none; }
</style>
