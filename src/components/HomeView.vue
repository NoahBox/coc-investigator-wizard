<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { importSaikoBase64 } from '../saiko.js';
import { fromDhole, isDholeData } from '../dhole.js';
import { listInvestigators, deleteInvestigator, duplicateInvestigator, setInvestigatorImported, buildRosterExport, parseRosterExport, importInvestigators } from '../store.js';
import { downloadRosterBackup } from '../export.js';
import { getEra } from '../data/eras.js';
import { dataName, t } from '../i18n.js';

const emit = defineEmits(['new', 'import', 'load']);
const fileInput = ref(null);
const importSourceOpen = ref(false);
const importFormat = ref('json'); // 'json' | 'saiko'
const jsonText = ref('');
const saikoText = ref('');
const importError = ref('');
// 文本框自动调整高度：内容多则增高，内容少则压缩（不出现多余空白）
const jsonTa = ref(null);
const saikoTa = ref(null);
function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  const max = 320;
  el.style.height = Math.min(el.scrollHeight, max) + 'px';
}
watch(importFormat, () => nextTick(() => autoResize(importFormat.value === 'json' ? jsonTa.value : saikoTa.value)));
watch(importSourceOpen, (v) => { if (v) nextTick(() => autoResize(importFormat.value === 'json' ? jsonTa.value : saikoTa.value)); });
const roster = ref([]);

// ---- 关于弹窗 ----
const aboutOpen = ref(false);
const aboutTab = ref('info'); // 'info' | 'history'

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
    importFormat.value = 'json';
    jsonText.value = reader.result || ''; // 文件内容填入文本框，由用户点「导入」时解析
    nextTick(() => autoResize(jsonTa.value));
  };
  reader.readAsText(file);
  e.target.value = '';
}

// 打开「导入方式」弹窗（合并原「导入 JSON」与「导入 Saiko Base64」）
function openImportSource() {
  importFormat.value = 'json';
  jsonText.value = '';
  saikoText.value = '';
  importError.value = '';
  importSourceOpen.value = true;
}
function applyImport() {
  importError.value = '';
  try {
    if (importFormat.value === 'saiko') {
      const char = importSaikoBase64(saikoText.value);
      importSourceOpen.value = false;
      emit('import', char);
    } else {
      const data = JSON.parse(jsonText.value.trim());
      // Dhole's House 角色卡：先逆转换为项目内部 character
      const char = isDholeData(data) ? fromDhole(data) : data;
      if (!char) { importError.value = t('home.jsonError'); return; }
      importSourceOpen.value = false;
      emit('import', char);
    }
  } catch (err) {
    importError.value = importFormat.value === 'saiko'
      ? t('home.saikoError')
      : t('home.jsonError');
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
  const msg = t('home.confirmDelete', { name: c ? c.name : '' });
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
      alert(t('home.rosterError'));
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
  alert(t('home.importSuccess', { n }));
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
      <button class="opt-card card" @click="openImportSource">
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-arrow-up-from-bracket" /></span>
        <span class="opt-title">{{ $t('home.importTitle') }}</span>
        <span class="opt-desc dim small">{{ $t('home.importDesc') }}</span>
      </button>
      <button class="opt-card card" @click="aboutOpen = true">
        <span class="opt-icon"><font-awesome-icon icon="fa-solid fa-circle-info" /></span>
        <span class="opt-title">{{ $t('home.about') }}</span>
        <span class="opt-desc dim small">{{ $t('home.aboutDesc') }}</span>
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
          <font-awesome-icon icon="fa-solid fa-file-export" /> {{ $t('home.export') }}
        </button>
        <button class="btn ghost sm" :title="$t('home.importBtn')" @click="onPickRosterFile">
          <font-awesome-icon icon="fa-solid fa-file-import" /> {{ $t('home.import') }}
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
    <Teleport to="body">
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
    </Teleport>

    <!-- 导入调查员 -->
    <Teleport to="body">
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
    </Teleport>

    <!-- 导入方式选择弹窗（合并 JSON 与 Saiko Base64 导入） -->
    <Teleport to="body">
    <div v-if="importSourceOpen" class="overlay" @click.self="importSourceOpen = false">
      <div class="modal card import-source-modal">
        <div class="modal-head">
          <h3>{{ $t('home.importSourceTitle') }}</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="importSourceOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <!-- 来源格式选择 -->
          <div class="fmt-row">
            <button class="fmt-btn" :class="{ active: importFormat === 'json' }" @click="importFormat = 'json'">
              <font-awesome-icon icon="fa-solid fa-file-lines" />
              <span>{{ $t('home.fmtJson') }}</span>
            </button>
            <button class="fmt-btn" :class="{ active: importFormat === 'saiko' }" @click="importFormat = 'saiko'">
              <font-awesome-icon icon="fa-solid fa-left-right" />
              <span>{{ $t('home.fmtSaiko') }}</span>
            </button>
          </div>

          <!-- JSON 导入：本地文件 或 粘贴文本 -->
          <div v-if="importFormat === 'json'" class="fmt-body">
            <button class="btn ghost sm mb-8" @click="onPickFile">
              <font-awesome-icon icon="fa-solid fa-folder-open" /> {{ $t('home.pickFile') }}
            </button>
            <p class="hint mb-8">{{ $t('home.orPaste') }}</p>
            <textarea ref="jsonTa" class="inp ta-auto" v-model="jsonText" :placeholder="$t('home.jsonPh')" @input="autoResize($event.target)"></textarea>
          </div>

          <!-- Saiko Base64 导入 -->
          <div v-else class="fmt-body">
            <p class="hint mb-8">{{ $t('home.saikoHint') }}</p>
            <textarea ref="saikoTa" class="inp ta-auto" v-model="saikoText" :placeholder="$t('home.saikoPh')" @input="autoResize($event.target)"></textarea>
          </div>

          <p v-if="importError" class="warn-text mt-8">{{ importError }}</p>
        </div>
        <div class="modal-foot row">
          <button class="btn" @click="importSourceOpen = false">{{ $t('common.cancel') }}</button>
          <span class="spacer"></span>
          <button
            class="btn primary"
            :disabled="importFormat === 'json' ? !jsonText.trim() : !saikoText.trim()"
            @click="applyImport"
          >{{ $t('home.import') }}</button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- 关于 -->
    <Teleport to="body">
    <div v-if="aboutOpen" class="overlay" @click.self="aboutOpen = false">
      <div class="modal card about-modal">
        <div class="modal-head">
          <h3>{{ $t('home.aboutTitle') }}</h3>
          <span class="spacer"></span>
          <button class="btn ghost sm" @click="aboutOpen = false">✕</button>
        </div>
        <div class="about-tabs">
          <button class="about-tab" :class="{ active: aboutTab === 'info' }" @click="aboutTab = 'info'">{{ $t('home.aboutTabInfo') }}</button>
          <button class="about-tab" :class="{ active: aboutTab === 'history' }" @click="aboutTab = 'history'">{{ $t('home.aboutTabHistory') }}</button>
        </div>
        <div class="modal-body about-body">
          <!-- 信息 -->
          <div v-show="aboutTab === 'info'" class="about-info">
            <div class="about-row">
              <span class="about-key">{{ $t('home.aboutAuthor') }}</span>
              <span class="about-val">Master Noah · <a href="https://noahbox.github.io" target="_blank" rel="noopener">https://noahbox.github.io</a></span>
            </div>
            <div class="about-row">
              <span class="about-key">{{ $t('home.aboutAck') }}</span>
              <span class="about-val">TRPG赛高、Dhole's House</span>
            </div>
            <div class="about-row">
              <span class="about-key">{{ $t('home.aboutCopyright') }}</span>
              <span class="about-val">Call of Cthulhu (c) Chaosium、Archlight</span>
            </div>
          </div>
          <!-- 更新历史 -->
          <div v-show="aboutTab === 'history'" class="about-history">
            <div class="changelog">
              <h4>v1.0.8 · 26-08-23</h4>
              <ul class="cl">
                <li><b>增加功能</b>：支持导入 Dhole's House 的角色卡 Json 文件</li>
                <li><b>Bug 修复</b>：修复“部分有显示条件的 html 格式标签没有正确渲染”的问题；修复“调查员背景页面随机事件错误绑定到整个标题行”的问题</li>
                <li><b>体验优化</b>：为调查员花名册的导入/导出按钮添加文字标识；修改了导入调查员的按钮和界面；修改了导出调查员角色卡时的逻辑（除“分享链接”和“骰娘设定”之外的所有导出只会下载文件，不会复制到剪贴板；“分享链接”和“骰娘设定”只会复制到剪贴板，不会下载文件）</li>
              </ul>
              <h4>v1.0.7 · 26-08-23</h4>
              <ul class="cl">
                <li><b>增加功能</b>：支持导出到 Dhole's House 兼容的角色卡 Json</li>
                <li><b>体验优化</b>：调整部分文字表述和 i18n</li>
              </ul>
              <h4>v1.0.6b · 26-08-21</h4>
              <ul class="cl">
                <li><b>Bug 修复</b>：修复“调查员花名册中，删除按钮无法正常工作”的问题</li>
              </ul>
              <h4>v1.0.6 · 26-08-20</h4>
              <ul class="cl">
                <li><b>增加功能</b>：支持导出到 FVTT COC7E 系统支持的角色卡 Json；支持分享调查员角色卡链接，快速导入角色卡；添加掷骰 &amp; 检定面板；添加对日语和英语的 i18n 支持</li>
                <li><b>体验优化</b>：为调查员花名册添加头像显示和表格视图并优化了信息显示；优化角色卡总览页面的布局</li>
              </ul>
              <h4>v1.0.5 · 26-08-19</h4>
              <ul class="cl">
                <li><b>增加功能</b>：支持《克苏鲁时空穿梭（Cthulhu Through the Ages）》扩展（示例职业、时代特殊技能及技能初始值调整、不同时代的背景随机表与特性、不同时代的资产描述）；添加背景故事中的随机表支持</li>
                <li><b>体验优化</b>：优化角色卡总览页面与属性分配页面的布局；优化信用评级技能；优化幕间成长页面的按钮样式；优化界面布局</li>
                <li><b>Bug 修复</b>：修复“信用评级和克苏鲁神话技能默认值为 null”的问题；修复“可自定义技能在幕间成长时重复出现”的问题；修复“购点模式下，属性卡片可能过窄”的问题；修复“基础信息中，自定义国家无法正常输入”的问题</li>
              </ul>
              <h4>v1.0.4 · 26-08-19</h4>
              <ul class="cl">
                <li><b>体验优化</b>：修改自定义职业时自定义本职技能点公式的编辑方式；优化有子类别的技能的添加和删除样式；优化布局对页面宽度的自适应；优化窄屏幕设备的布局展示；为调查员花名册添加角色卡创建模式和更新模式的切换按钮；优化界面布局</li>
                <li><b>Bug 修复</b>：修复“年龄调整时，属性点降低会导致购点的属性点返还”的问题；修复“年龄调整时，属性点降低的数值异常”的问题</li>
              </ul>
              <h4>v1.0.3 · 26-08-18</h4>
              <ul class="cl">
                <li><b>增加功能</b>：调查员花名册，支持存储、导入、导出调查员角色卡数据</li>
                <li><b>体验优化</b>：修改了部分图标元素，统一使用 FontAwesome Icon；使用 lz-string 压缩调查员角色卡数据，增加可存储的数据上限；优化界面布局</li>
              </ul>
              <h4>v1.0.2 · 26-08-18</h4>
              <ul class="cl">
                <li><b>增加功能</b>：COC 日本扩展和《纸浆克苏鲁》中的扩展职业</li>
                <li><b>体验优化</b>：在技能点分配界面将调查员经验包提供的技能调整显示在成长栏中；优化调查员头像编辑弹窗；优化界面布局</li>
                <li><b>Bug 修复</b>：修复“调查员经验包中的技能和属性调整无效”的问题</li>
              </ul>
              <h4>v1.0.1 · 26-08-17</h4>
              <ul class="cl">
                <li><b>增加功能</b>：老卡模式；自定义武器；自定义技能</li>
                <li><b>Bug 修复</b>：修复“开启经验包后，即使将其关闭，经验包的效果依然保留”的问题</li>
              </ul>
              <h4>v1.0.0 · 26-08-17</h4>
              <ul class="cl">
                <li><b>初版发布</b></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Teleport>
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
.options { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; max-width: 820px; margin: 0 auto; }
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

/* 导入方式弹窗：固定尺寸 + 视口正中 + 文本框自适应高度 */
.import-source-modal { width: 560px; max-width: 100%; height: 460px; max-height: 90vh; }
.import-source-modal .modal-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.import-source-modal .fmt-body { flex: 1; }
.ta-auto { resize: none; width: 100%; min-height: 0; }
.modal-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
.modal-body { padding: 16px 18px; }
.modal-foot { padding: 12px 18px; border-top: 1px solid var(--border); gap: 10px; }
.spacer { flex: 1; }
@media (max-width: 640px) { .options { grid-template-columns: 1fr; } .roster-list { grid-template-columns: 1fr; } .roster-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .roster-toolbar { flex-wrap: wrap; } .roster-search { max-width: none; } }

/* 关于弹窗：固定尺寸 + 视口正中（与导入弹窗一致） */
.about-modal { width: 600px; max-width: 100%; height: 560px; max-height: 90vh; }
.about-modal .modal-body { flex: 1; overflow-y: auto; }
.about-tabs { display: flex; gap: 4px; padding: 0 18px; border-bottom: 1px solid var(--border); }
.about-tab {
  background: transparent; border: none; cursor: pointer; padding: 12px 14px;
  font-family: Georgia, serif; font-size: 1.05rem; color: var(--text-dim);
  border-bottom: 2px solid transparent; transition: color 0.2s, border-color 0.2s;
}
.about-tab:hover { color: var(--text); }
.about-tab.active { color: var(--accent-strong); border-bottom-color: var(--accent); }
.about-info { display: flex; flex-direction: column; gap: 14px; }
.about-row { display: flex; gap: 12px; line-height: 1.7; }
.about-key { flex: none; width: 72px; color: var(--gold); font-weight: 600; }
.about-val { flex: 1; color: var(--text); word-break: break-word; }
.about-val a { color: var(--accent); }
.changelog h4 { font-family: Georgia, serif; color: var(--accent-strong); margin: 16px 0 8px; letter-spacing: 0.04em; }
.changelog h4:first-child { margin-top: 0; }
.changelog ul.cl { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
.changelog ul.cl li { line-height: 1.7; color: var(--text); }

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

/* 导入方式选择弹窗 */
.fmt-row { display: flex; gap: 12px; margin-bottom: 16px; }
.fmt-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px; cursor: pointer; text-align: center;
  border: 1px solid var(--border); border-radius: 8px; background: var(--surface);
  color: var(--text-dim); transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.fmt-btn svg { font-size: 1.7rem; }
.fmt-btn:hover { border-color: var(--accent); color: var(--text); }
.fmt-btn.active { border-color: var(--accent); color: var(--text); background: var(--accent-dim); }
.fmt-btn span { font-family: Georgia, serif; font-size: 1.05rem; letter-spacing: 0.04em; }
.fmt-body { display: flex; flex-direction: column; }
</style>
