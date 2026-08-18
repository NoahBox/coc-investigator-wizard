// ============================================================
// 全局状态 & localStorage 持久化
// ============================================================
import { reactive, computed } from 'vue';
import LZString from 'lz-string';
import { skills, getSkill, groupedSkillNames } from './data/skills.js';
import { getJob, EXP_BOOKS } from './data/jobs.js';
import {
  ATTR_KEYS, generateRandomAttributes, modifyAttributesByAge,
  computeDerived, computeProSkillPoints, computeInterestSkillPoints,
  getLivingStandard, getCash, getCurrency,
} from './data/rules.js';
import { getPackage } from './data/packages.js';

const LS_KEY = 'coc-wizard-character';      // 旧版单卡（迁移后移除）
const ROSTER_KEY = 'coc-wizard-roster';      // 多卡花名册 { currentId, cards: { [id]: card } }
const THEME_KEY = 'coc-wizard-theme';

// ---- 工具：生成卡 id ----
function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- 花名册读写（localStorage 多卡，lz-string 压缩以存更多调查员） ----
function readRoster() {
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
function writeRoster(roster) {
  try { localStorage.setItem(ROSTER_KEY, LZString.compressToUTF16(JSON.stringify(roster))); } catch (e) { /* ignore (quota / 隐私模式) */ }
}

// 判断一张卡是否为"空白"（任何字段都无数值）——用于在主页不展示并清理
function isBlankCard(c) {
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

// ---- 技能键工具 ----
export function splitSkillKey(key) {
  const idx = key.indexOf('(');
  if (idx === -1) return { name: key, child: null };
  return { name: key.slice(0, idx), child: key.slice(idx + 1, -1) };
}
export function makeSkillKey(name, child) {
  return child ? `${name}(${child})` : name;
}

// 技能基础值
export function skillBase(key, attributes) {
  const { name, child } = splitSkillKey(key);
  if (name === '母语') return attributes.edu || 0;
  if (name === '闪避') return Math.floor((attributes.dex || 0) / 2);
  const sk = getSkill(name);
  if (!sk) return 0;
  if (child && sk.group) {
    const c = sk.group.skills.find(s => s.name === child);
    return c && c.init != null ? c.init : sk.init;
  }
  return sk.init || 0;
}

function emptyAttributes() {
  const a = {};
  [...ATTR_KEYS, 'luc'].forEach(k => (a[k] = null));
  return a;
}

export function createEmptyCharacter() {
  return {
    version: 1,
    id: genId(),
    updatedAt: Date.now(),
    name: '', player: '', age: '', gender: '男', genderOther: '',
    avatar: '',
    country: '美国', hometown: '', residence: '', era: 'modern',
    jobType: 'preset', jobName: '', customJobName: '',
    customSkills: [], customPointFormula: 'edu4', customWealth: [9, 30],
    ageModifier: true,
    packageEnabled: false, packageId: null,
    packageSkillPoints: {}, packageRolls: {}, believer: false,
    attrMethod: 'pointbuy', pointTotal: 460,
    attributes: emptyAttributes(),
    attrPool: [],
    ageAdjusted: false, ageSummary: [],
    // 技能分配 { key: { pro, interest, growth, package } }
    allocations: {},
    // 分组技能的子技能顺序 { 母语: ['英语'], 外语: [...], ... }
    groupedOrder: {},
    // 本职技能解析后的选择结果 { 任选槽位 index: 选中的技能key }
    jobChoice: {},
    skillMode: 'strict',
    legacyMode: false,
    // 扩展书职业显示开关：键为 EXP_BOOKS，值为是否显示该来源职业（默认全部显示）
    expBooks: Object.fromEntries(EXP_BOOKS.map(b => [b, false])),
    proSkillPoints: 0, interestSkillPoints: 0,
    creditRating: null,
    weapons: [],
    background: { app: '', belief: '', importantPerson: '', place: '', item: '', trait: '', scar: '', mad: '', desc: '' },
    items: [{ name: '' }, { name: '' }, { name: '' }],
    assetsRows: [{ name: '' }, { name: '' }, { name: '' }],
    mythosItems: [{ name: '' }, { name: '' }, { name: '' }],
    spells: [{ name: '' }, { name: '' }, { name: '' }],
    contacts: [{ name: '' }, { name: '' }, { name: '' }],
    relations: [{ character: '', player: '', job: '', relation: '' }, { character: '', player: '', job: '', relation: '' }, { character: '', player: '', job: '', relation: '' }],
    scenarios: [{ name: '', time: '' }, { name: '', time: '' }, { name: '', time: '' }],
    // 导入编辑模式
    imported: false,
    derivedOverrides: { hp: null, hpMax: null, mp: null, mpMax: null, san: null, sanMax: null, luc: null },
  };
}

// ---- 主题 ----
export const theme = reactive({
  dark: localStorage.getItem(THEME_KEY) !== 'light',
});
export function toggleTheme() {
  theme.dark = !theme.dark;
  localStorage.setItem(THEME_KEY, theme.dark ? 'dark' : 'light');
  document.documentElement.classList.toggle('light', !theme.dark);
}
export function applyTheme() {
  document.documentElement.classList.toggle('light', !theme.dark);
}

// ---- 角色状态 ----
function normalize(data) {
  const fresh = createEmptyCharacter();
  const merged = { ...fresh, ...data };
  merged.background = { ...fresh.background, ...(data?.background || {}) };
  merged.derivedOverrides = { ...fresh.derivedOverrides, ...(data?.derivedOverrides || {}) };
  merged.attributes = { ...fresh.attributes, ...(data?.attributes || {}) };
  merged.allocations = data?.allocations || {};
  merged.groupedOrder = data?.groupedOrder || {};
  merged.packageSkillPoints = data?.packageSkillPoints || {};
  merged.customSkills = data?.customSkills || [];
  merged.weapons = data?.weapons || [];
  merged.items = data?.items || [];
  merged.assetsRows = data?.assetsRows || [];
  merged.mythosItems = data?.mythosItems || [];
  merged.spells = data?.spells || [];
  merged.contacts = data?.contacts || [];
  merged.relations = data?.relations || [];
  merged.scenarios = data?.scenarios || [];
  // 扩展书职业显示开关：确保全部键存在，缺省视为显示（true）
  const books = data?.expBooks || {};
  merged.expBooks = Object.fromEntries(EXP_BOOKS.map(b => [b, books[b] === true]));
  return merged;
}

function loadCharacter() {
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

export const character = reactive(loadCharacter() || createEmptyCharacter());

let saveTimer = null;
// 立即把当前角色写入花名册（供切换/新建/导入前刷新待保存内容，避免竞态丢失）
function flushSave() {
  clearTimeout(saveTimer);
  const roster = readRoster();
  if (isBlankCard(character)) {
    // 空白卡不入花名册；若此前曾写入过则移除占位（防止"填了又清空"的卡残留）
    if (character.id && roster.cards[character.id]) {
      delete roster.cards[character.id];
      if (roster.currentId === character.id) roster.currentId = Object.keys(roster.cards)[0] || null;
      writeRoster(roster);
    }
    return;
  }
  try {
    character.updatedAt = Date.now();
    roster.cards[character.id] = JSON.parse(JSON.stringify(character));
    roster.currentId = character.id;
    writeRoster(roster);
  } catch (e) { /* ignore */ }
}
export function saveCharacter() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 300);
}

export function newCharacter() {
  flushSave(); // 先固化当前卡
  const fresh = createEmptyCharacter();
  Object.keys(fresh).forEach(k => { character[k] = fresh[k]; });
  saveCharacter();
}

export function importCharacter(data) {
  flushSave(); // 先固化当前卡
  const merged = normalize(data);
  merged.id = genId();
  merged.updatedAt = Date.now();
  merged.imported = true;
  Object.keys(character).forEach(k => { delete character[k]; });
  Object.assign(character, merged);
  saveCharacter();
}

// ---- 花名册（多个调查员） ----
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
        updatedAt: c.updatedAt || 0,
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

// ---- 派生计算 ----
export const derived = computed(() => {
  const a = character.attributes;
  const base = computeDerived(a, character.age);
  const over = character.derivedOverrides || {};
  const mythos = skillValue('克苏鲁神话');
  const sanMax = over.sanMax != null ? over.sanMax : Math.max(0, 99 - mythos);
  const sanReduce = packageSanReduction();
  return {
    ...base,
    hpMax: over.hpMax != null ? over.hpMax : base.hp,
    mpMax: over.mpMax != null ? over.mpMax : base.mp,
    sanMax,
    hp: over.hp != null ? over.hp : base.hp,
    mp: over.mp != null ? over.mp : base.mp,
    san: over.san != null ? over.san : Math.max(0, base.san - sanReduce),
    luc: over.luc != null ? over.luc : a.luc,
  };
});

// 当前职业
export const currentJob = computed(() => {
  if (character.jobType === 'preset') return getJob(character.jobName) || null;
  return null;
});

// 信用评级范围
export const creditRange = computed(() => {
  if (character.jobType === 'preset' && currentJob.value) return currentJob.value.wealth;
  return character.customWealth || [9, 30];
});

// 职业技能点数
export const totalProPoints = computed(() => {
  if (character.jobType === 'preset' && currentJob.value) {
    return computeProSkillPoints(currentJob.value, character.attributes);
  }
  // 自定义职业：默认 教育×4
  const edu = character.attributes.edu || 0;
  return edu * 4;
});
export const totalInterestPoints = computed(() => computeInterestSkillPoints(character.attributes));

// 解析本职技能（固定 + 任选槽）
export function resolveJobSkills(job) {
  const fixed = [];
  const choices = [];
  (job?.skills || []).forEach((sk) => {
    if (typeof sk === 'string') {
      fixed.push(makeSkillKey(sk, null));
    } else if (Array.isArray(sk)) {
      const options = sk.map(o => (typeof o === 'string' ? makeSkillKey(o, null) : makeSkillKey(Object.keys(o)[0], o[Object.keys(o)[0]] || null)));
      choices.push(options);
    } else {
      const key = Object.keys(sk)[0];
      const child = sk[key];
      const { name, child: keyChild } = splitSkillKey(key);
      // key 可能带括号描述（如 '技艺(木工、焊接、管道工等)'）：
      // 括号内若是该分组的真实技能名则作为子技能，否则视为推荐提示、仅保留分组名
      if (keyChild) {
        const gsk = getSkill(name);
        const isReal = gsk?.group?.skills.some(s => s.name === keyChild);
        fixed.push(makeSkillKey(name, isReal ? keyChild : (child || null)));
      } else {
        fixed.push(makeSkillKey(name, child || null));
      }
    }
  });
  return { fixed, choices };
}

// 展开分组技能：本职技能若为分组技能（技艺/格斗/外语/科学/生存/驾驶/母语等），
// 用 groupedOrder 里用户实际填写的子技能替换，避免回到 job 定义里的默认子技能
export function expandSkillKey(key) {
  const { name, child } = splitSkillKey(key);
  const sk = getSkill(name);
  if (!sk || !sk.group || !sk.group.skills.length) return [key];
  const children = (character.groupedOrder[name] || []).filter((c) => c);
  if (children.length) return children.map((c) => makeSkillKey(name, c));
  if (child) return [makeSkillKey(name, child)];
  return [key];
}

// 最终本职技能键列表（展开分组技能后的完整列表）
export const occupationSkills = computed(() => {
  let keys;
  if (character.jobType === 'preset' && currentJob.value) {
    const { fixed, choices } = resolveJobSkills(currentJob.value);
    const chosen = choices.map((options, i) => {
      const pick = character.jobChoice[i];
      return pick && options.includes(pick) ? pick : options[0];
    });
    keys = [...fixed, ...chosen];
  } else {
    // 自定义职业
    keys = character.customSkills || [];
  }
  return keys.flatMap(expandSkillKey);
});

// 去重后的本职技能分组名（用于技能分配时按分组渲染）
export const occupationGroupNames = computed(() => {
  const set = new Set();
  occupationSkills.value.forEach((key) => {
    const name = splitSkillKey(key).name;
    if (getSkill(name)?.group) set.add(name);
  });
  return [...set];
});

// 从职业定义中提取分组技能的"推荐类别提示"（如 技艺 → "木工、焊接、管道工等"）
// 仅当职业表以 key 带括号描述（如 '技艺(木工、焊接、管道工等)'）且括号内容非真实技能名时记录
export const jobGroupHints = computed(() => {
  const hints = {};
  if (character.jobType !== 'preset' || !currentJob.value) return hints;
  (currentJob.value.skills || []).forEach((sk) => {
    if (typeof sk !== 'object' || Array.isArray(sk)) return;
    const key = Object.keys(sk)[0];
    const { name, child } = splitSkillKey(key);
    if (!child) return;
    const gsk = getSkill(name);
    if (!gsk?.group) return;
    if (!gsk.group.skills.some(s => s.name === child)) hints[name] = child;
  });
  return hints;
});

// 判断某技能是否为本职技能
export function isOccupationSkill(key) {
  const name = splitSkillKey(key).name;
  if (name === '信用评级') return true;
  return occupationSkills.value.some(k => splitSkillKey(k).name === name);
}

// ---- 技能值计算 ----
export function getAllocation(key) {
  return character.allocations[key] || { pro: 0, interest: 0, growth: 0, package: 0 };
}
export function skillValue(key) {
  const base = skillBase(key, character.attributes);
  const a = getAllocation(key);
  return base + (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + packageAdjust(key);
}
export function skillValueText(key) {
  const base = skillBase(key, character.attributes);
  const a = getAllocation(key);
  const pkg = packageAdjust(key);
  const total = base + (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + pkg;
  return { base, total, ...a, package: pkg };
}
export function setAllocation(key, patch) {
  const cur = { ...getAllocation(key), ...patch };
  character.allocations[key] = cur;
  saveCharacter();
}

// 已分配的职业技能点 / 业余技能点（用于剩余统计）
export function usedProPoints() {
  let sum = 0;
  Object.values(character.allocations).forEach(a => { sum += a.pro || 0; });
  return sum;
}
export function usedInterestPoints() {
  let sum = 0;
  Object.values(character.allocations).forEach(a => { sum += a.interest || 0; });
  return sum;
}
export function usedPackagePoints() {
  let sum = 0;
  Object.values(character.packageSkillPoints).forEach(v => { sum += v || 0; });
  return sum;
}

// 经验包对象（关闭开关后视为未启用）
export const currentPackage = computed(() => {
  if (!character.packageEnabled) return null;
  return getPackage(character.packageId);
});

// 经验包技能点影响
export function packageAdjust(key) {
  if (!character.packageEnabled) return 0;
  return character.packageSkillPoints[key] || 0;
}

// 属性相关的经验包调整（理智值）
export function packageSanLoss() {
  if (!character.packageEnabled || !currentPackage.value) return 0;
  if (currentPackage.value.mythos) return 0;
  const r = character.packageRolls.sanLoss;
  return r != null ? r : 0;
}

// 经验包对「当前理智值(SAN)」的总减少量（计入最终数值）
// - 非神话包：减少 sanLoss 骰值
// - 神话包且「相信者」：减少神话技能数值
export function packageSanReduction() {
  if (!character.packageEnabled || !currentPackage.value) return 0;
  const p = currentPackage.value;
  if (!p.mythos) {
    const r = character.packageRolls.sanLoss;
    return r != null ? r : 0;
  }
  if (character.believer) {
    const m = character.packageRolls.mythos;
    return m != null ? m : 0;
  }
  return 0;
}

// 生活水平/现金
export const creditRatingValue = computed(() => {
  // 优先取「信用评级」技能的实际值（基础值 0 + 已分配的职业点）
  const cr = skillValue('信用评级');
  if (cr > 0) return cr;
  if (character.creditRating != null) return character.creditRating;
  // 未分配时回退到0
  return 0;
});
export const livingStandard = computed(() => getLivingStandard(creditRatingValue.value));
export const cashInfo = computed(() => getCash(creditRatingValue.value, character.country, character.era));
export const currency = computed(() => getCurrency(character.country, character.era));

// ---- 分组技能工具 ----
export function getGroupChildren(groupName) {
  return character.groupedOrder[groupName] || [];
}
export function ensureGroupChild(groupName, childName) {
  if (!character.groupedOrder[groupName]) character.groupedOrder[groupName] = [];
  if (childName && !character.groupedOrder[groupName].includes(childName)) {
    character.groupedOrder[groupName].push(childName);
  }
}

// 母语默认 = 教育，闪避默认 = 1/2敏捷 的展示值
export const dynamicBase = computed(() => ({
  母语: character.attributes.edu || 0,
  闪避: Math.floor((character.attributes.dex || 0) / 2),
}));

// 是否所有基础属性已填
export const attributesComplete = computed(() => ATTR_KEYS.every(k => character.attributes[k] != null && character.attributes[k] > 0));

// 应用年龄修正
export function applyAgeAdjustment() {
  const { attributes, summary } = modifyAttributesByAge({ ...character.attributes }, character.age);
  Object.keys(attributes).forEach(k => { character.attributes[k] = attributes[k]; });
  character.ageSummary = summary;
  character.ageAdjusted = true;
  saveCharacter();
}
