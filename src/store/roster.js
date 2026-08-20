// ============================================================
// store 领域模块 · 花名册：多调查员持久化、列表/切换/删除/导入导出
// 与 character.js 存在循环依赖（loadCharacter/flushSave 互调），
// 但所有跨模块引用均发生在函数运行时，模块求值阶段安全。
// ============================================================
import LZString from 'lz-string';
import { ATTR_KEYS } from '../data/rules.js';
import { character, createEmptyCharacter, flushSave, genId, normalize } from './character.js';

const LS_KEY = 'coc-wizard-character';      // 旧版单卡（迁移后移除）
const ROSTER_KEY = 'coc-wizard-roster';      // 多卡花名册 { currentId, cards: { [id]: card } }

// ---- 花名册读写（localStorage 多卡，lz-string 压缩以存更多调查员） ----
export function readRoster() {
  const raw = localStorage.getItem(ROSTER_KEY);
  if (!raw) return { currentId: null, cards: {} };
  // 旧格式为纯 JSON（以 '{' 开头）；压缩格式一般不会以 '{' 开头
  if (raw.trimStart().charAt(0) === '{') {
    try {
      const r = JSON.parse(raw);
      if (r && typeof r === 'object' && r.cards) {
        writeRoster(r); // 顺手迁移为压缩格式
        return r;
      }
    } catch (e) { /* ignore */ }
    return { currentId: null, cards: {} };
  }
  // 新格式：lz-string 压缩；失败再兜底按纯 JSON 试一次
  try {
    const json = LZString.decompressFromUTF16(raw);
    if (json) {
      const r = JSON.parse(json);
      if (r && typeof r === 'object' && r.cards) return r;
    }
  } catch (e) { /* ignore */ }
  try {
    const r2 = JSON.parse(raw);
    if (r2 && typeof r2 === 'object' && r2.cards) return r2;
  } catch (e) { /* ignore */ }
  return { currentId: null, cards: {} };
}
export function writeRoster(roster) {
  try { localStorage.setItem(ROSTER_KEY, LZString.compressToUTF16(JSON.stringify(roster))); } catch (e) { /* ignore (quota / 隐私模式) */ }
}

// 判断一张卡是否为"空白"（任何字段都无数值）——用于在主页不展示并清理
export function isBlankCard(c) {
  if (!c || typeof c !== 'object') return true;
  if ((c.name || '').trim()) return false;
  if ((c.player || '').trim()) return false;
  if (c.age) return false;
  const hasAttr = [...ATTR_KEYS, 'luc'].some(k => c.attributes && c.attributes[k] != null);
  if (hasAttr) return false;
  if (c.jobType === 'preset' ? (c.jobName || '') : (c.customJobName || '')) return false;
  if (c.allocations && Object.values(c.allocations).some(a => (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + (a.package || 0) > 0)) return false;
  if ((c.avatar || '').trim()) return false;
  if (c.background && Object.values(c.background).some(v => (v || '').trim())) return false;
  const anyRow = (arr) => Array.isArray(arr) && arr.some(r => r && Object.values(r).some(v => (v || '').trim()));
  if (anyRow(c.weapons) || anyRow(c.items) || anyRow(c.assetsRows) || anyRow(c.mythosItems) || anyRow(c.spells) || anyRow(c.contacts) || anyRow(c.relations) || anyRow(c.scenarios)) return false;
  return true;
}

// 清除所有空白卡（任何字段都无数值的调查员），并修正 currentId
function purgeBlankCards(roster) {
  let changed = false;
  Object.keys(roster.cards).forEach((id) => {
    if (isBlankCard(roster.cards[id])) {
      delete roster.cards[id];
      changed = true;
    }
  });
  if (changed) {
    if (!roster.cards[roster.currentId]) roster.currentId = Object.keys(roster.cards)[0] || null;
    writeRoster(roster);
  }
}

export function loadCharacter() {
  let roster = readRoster();
  purgeBlankCards(roster); // 启动即清理历史遗留的空白卡
  // 迁移旧版单卡（coc-wizard-character）到花名册
  if (!Object.keys(roster.cards).length) {
    try {
      const old = localStorage.getItem(LS_KEY);
      if (old) {
        const data = JSON.parse(old);
        const id = data.id || genId();
        data.id = id;
        data.updatedAt = data.updatedAt || Date.now();
        roster.cards[id] = data;
        roster.currentId = id;
        writeRoster(roster);
        localStorage.removeItem(LS_KEY);
      }
    } catch (e) { /* ignore */ }
  }
  const id = (roster.currentId && roster.cards[roster.currentId])
    ? roster.currentId
    : Object.keys(roster.cards)[0];
  if (id && roster.cards[id]) {
    roster.currentId = id;
    writeRoster(roster);
    return normalize(roster.cards[id]);
  }
  return null;
}

export function listInvestigators() {
  const roster = readRoster();
  purgeBlankCards(roster);
  return Object.keys(roster.cards)
    .map((id) => {
      const c = roster.cards[id];
      return {
        id,
        name: c.name || '未命名调查员',
        jobName: c.jobType === 'preset' ? (c.jobName || '未知职业') : (c.customJobName || '自定义职业'),
        age: c.age,
        era: c.era || 'modern',
        avatar: c.avatar || '',
        updatedAt: c.updatedAt || 0,
        imported: !!c.imported,
        current: id === roster.currentId,
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadInvestigator(id) {
  const roster = readRoster();
  const entry = roster.cards[id];
  if (!entry) return;
  flushSave(); // 先把当前卡的待保存内容固化
  const merged = normalize(entry);
  Object.keys(character).forEach(k => { delete character[k]; });
  Object.assign(character, merged);
  roster.currentId = id;
  writeRoster(roster);
}

export function deleteInvestigator(id) {
  flushSave();
  const roster = readRoster();
  delete roster.cards[id];
  if (roster.currentId === id) {
    const remaining = Object.keys(roster.cards);
    if (remaining.length) {
      const next = remaining[0];
      roster.currentId = next;
      writeRoster(roster);
      const merged = normalize(roster.cards[next]);
      Object.keys(character).forEach(k => { delete character[k]; });
      Object.assign(character, merged);
    } else {
      roster.currentId = null;
      writeRoster(roster);
      const fresh = createEmptyCharacter();
      Object.keys(fresh).forEach(k => { character[k] = fresh[k]; });
    }
  } else {
    writeRoster(roster);
  }
}

export function duplicateInvestigator(id) {
  const roster = readRoster();
  const src = roster.cards[id];
  if (!src) return null;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = genId();
  copy.updatedAt = Date.now();
  copy.name = (copy.name || '调查员') + ' 副本';
  delete copy.imported;
  roster.cards[copy.id] = copy;
  roster.currentId = copy.id;
  writeRoster(roster);
  return copy.id;
}

// 切换调查员状态：创建模式(imported=false → 新调查员流程) / 创建完成(imported=true → 导入调查员流程)
export function setInvestigatorImported(id, imported) {
  flushSave(); // 先固化当前卡的待保存内容，避免被异步写回覆盖
  const roster = readRoster();
  const c = roster.cards[id];
  if (!c) return;
  c.imported = !!imported;
  writeRoster(roster);
}

// ---- 花名册导入/导出（lz-string 压缩 JSON） ----
export function getInvestigators(ids) {
  const roster = readRoster();
  if (ids && ids.length) return ids.map(id => roster.cards[id]).filter(Boolean);
  return Object.values(roster.cards);
}

export function buildRosterExport(ids) {
  const cards = getInvestigators(ids);
  const payload = { version: 1, type: 'coc-investigator-roster', exportedAt: Date.now(), cards };
  return LZString.compressToBase64(JSON.stringify(payload));
}

export function parseRosterExport(text) {
  if (!text) return null;
  let json = null;
  try { json = LZString.decompressFromBase64(text.trim()); } catch (e) { /* ignore */ }
  if (!json) {
    try { json = text.trim(); } catch (e) { /* ignore (兼容未压缩 JSON) */ }
  }
  if (json) {
    try {
      const data = JSON.parse(json);
      if (data && Array.isArray(data.cards)) return data;
    } catch (e) { /* ignore */ }
  }
  return null;
}

// 导入若干张卡：重新生成 id，名称与已有调查员重名时自动追加 (n) 编号
export function importInvestigators(cards) {
  const roster = readRoster();
  const taken = new Set(Object.values(roster.cards).map(c => ((c.name || '').trim() || '未命名调查员')));
  let added = 0;
  cards.forEach((src) => {
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = genId();
    copy.updatedAt = Date.now();
    delete copy.imported;
    let base = (copy.name || '').trim() || '未命名调查员';
    let name = base;
    let n = 2;
    while (taken.has(name)) { name = `${base} (${n})`; n++; }
    copy.name = name;
    taken.add(name);
    roster.cards[copy.id] = copy;
    added++;
  });
  if (!roster.currentId || !roster.cards[roster.currentId]) {
    roster.currentId = Object.keys(roster.cards)[0] || null;
  }
  writeRoster(roster);
  return added;
}
