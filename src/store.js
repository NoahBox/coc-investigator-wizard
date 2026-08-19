// ============================================================
// 全局状态 & localStorage 持久化
// ============================================================
import { reactive, computed, watch } from 'vue';
import LZString from 'lz-string';
import { skills, getSkill, getEraSkill, groupedSkillNames } from './data/skills.js';
import { getJob, EXP_BOOKS } from './data/jobs.js';
import { eraDiceTables, eraSkillBaseAdjust, eraCreditDefs } from './data/eras.js';
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
  // 时代技能动态基础值（神秘冰岛/幻梦境）
  if (name === '本地知识') return Math.floor((attributes.int || 0) / 2);
  if (name === '造梦') return Math.floor((attributes.pow || 0) / 5);
  // 时代技能初始值调整（如 煤气灯电气维修01%、伊卡洛斯计算机使用被取代、冰岛神秘学20%）
  // 按当前时代生效，切换时代即自动清除
  const eraAdj = eraSkillBaseAdjust[character.era]?.[name];
  if (eraAdj != null) return eraAdj;
  const sk = getSkill(name) || getEraSkill(name);
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
    country: '美国', countryOther: '', hometown: '', residence: '', era: 'modern',
    jobType: 'preset', jobName: '', customJobName: '',
    customSkills: [], customPointAttr1: 'edu', customPointAttr2: 'edu', customWealth: [9, 30],
    ageModifier: true,
    packageEnabled: false, packageId: null,
    packageSkillPoints: {}, packageRolls: {}, believer: false, packageAttrBonus: {},
    attrMethod: 'pointbuy', pointTotal: 460,
    attributes: emptyAttributes(),
    attrPool: [],
    ageAdjusted: false, ageSummary: [], preAgeAttributes: null,
    luckAttrBonus: {}, ageAutoBonus: {},
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
    // 扩展时代（克苏鲁时空穿梭）：时代特性步骤选择的防具与盾牌
    eraArmor: '', eraShield: '',
    // 时代派系（克苏鲁伊卡洛斯船员派系）
    eraFaction: '',
    // 时代掷骰表结果：{ [eraId]: { dice, entry } } —— 当前时代的出生预兆/大事记修正
    eraEffects: {},
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

// ---- 派生计算 ----
// 有效属性值 = 基础(购点/随机) + 年龄自动修正 + 年龄手动身体削弱 + 经验包加成 + 时代掷骰修正
export function effectiveAttr(k) {
  return (character.attributes?.[k] || 0)
    + (character.ageAutoBonus?.[k] || 0)
    + (character.luckAttrBonus?.[k] || 0)
    + (character.packageAttrBonus?.[k] || 0)
    + (character.eraEffects?.[character.era]?.attr?.[k] || 0);
}
export const effectiveAttributes = computed(() => {
  const a = {};
  [...ATTR_KEYS, 'luc'].forEach(k => { a[k] = effectiveAttr(k); });
  return a;
});

// 技能基础值（基于有效属性：母语=有效教育、闪避=有效敏捷/2）
export function skillBaseOf(key) {
  const { name } = splitSkillKey(key);
  // 幻梦境：梦境学问基础值 = 克苏鲁神话的一半
  if (name === '梦境学问') return Math.floor(skillValue('克苏鲁神话') / 2);
  // 克苏鲁不败：战术为本职技能时初始值25%，否则1%
  if (name === '战术') return isOccupationSkill('战术') ? 25 : 1;
  return skillBase(key, effectiveAttributes.value);
}

export const derived = computed(() => {
  const a = effectiveAttributes.value;
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
  // 神秘冰岛：无职业模板，全部调查员获得 教育×4+智力×2 分配到任意技能
  if (character.era === 'iceland') {
    return effectiveAttr('edu') * 4 + effectiveAttr('int') * 2;
  }
  if (character.jobType === 'preset' && currentJob.value) {
    return computeProSkillPoints(currentJob.value, effectiveAttributes.value);
  }
  // 自定义职业：两个属性各 ×2 相加
  const a1 = character.customPointAttr1 || 'edu';
  const a2 = character.customPointAttr2 || 'edu';
  return effectiveAttr(a1) * 2 + effectiveAttr(a2) * 2;
});
export const totalInterestPoints = computed(() => {
  // 神秘冰岛：业余技能点禁用（全部点数已并入职业技能的自由分配 EDU×4+INT×2）
  if (character.era === 'iceland') return 0;
  return computeInterestSkillPoints(effectiveAttributes.value);
});

// ---- 时代信息摘要（派系 + 随机表结果），供背景/总览只读展示 ----
export const eraInfo = computed(() => {
  const parts = [];
  const table = eraDiceTables[character.era];
  const roll = character.eraEffects?.[character.era];
  if (table && roll && roll.dice) {
    const entry = table.entries[roll.dice - 1];
    if (entry) parts.push(`${table.title}（1D10=${roll.dice}）：${entry.text}（${entry.note}）`);
  }
  if (character.eraFaction) parts.push(`派系：${character.eraFaction}`);
  return parts;
});

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
// 用 groupedOrder 里用户实际填写的子技能替换，避免回到 job 定义里的默认子技能。
// 注意：若职业明确指定了子技能（如 格斗(斗殴)），只保留该子技能，
// 不得扩散成 groupedOrder 里的全部子技能——否则职业定义中多个格斗条目会重复展开导致列表出现重复行。
export function expandSkillKey(key) {
  const { name, child } = splitSkillKey(key);
  const sk = getSkill(name);
  if (!sk || !sk.group || !sk.group.skills.length) return [key];
  if (child) return [makeSkillKey(name, child)];
  const children = (character.groupedOrder[name] || []).filter((c) => c);
  if (children.length) return children.map((c) => makeSkillKey(name, c));
  return [key];
}

// 最终本职技能键列表（展开分组技能后的完整列表，按键去重）
export const occupationSkills = computed(() => {
  // 神秘冰岛：无职业模板，全部技能可按职业技能点自由分配（SkillStep 以自由模式渲染）
  if (character.era === 'iceland') return [];
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
  // 去重：职业定义可能多次出现同一分组技能（固定项与任选项、多个条目），
  // 展开后会产生相同键（如 格斗(斗殴)），避免技能列表/幕间成长出现重复行
  return [...new Set(keys.flatMap(expandSkillKey))];
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
  // 神秘冰岛：无职业模板，任意技能（克苏鲁神话除外）均可投入职业技能点
  if (character.era === 'iceland') return name !== '克苏鲁神话';
  return occupationSkills.value.some(k => splitSkillKey(k).name === name);
}

// ---- 技能值计算 ----
export function getAllocation(key) {
  return character.allocations[key] || { pro: 0, interest: 0, growth: 0, package: 0 };
}
// 时代掷骰表技能修正（出生预兆/大事记，如 +10「战术」-10「话术」）
export function eraAdjust(key) {
  return character.eraEffects?.[character.era]?.skill?.[key] || 0;
}
export function skillValue(key) {
  const base = skillBase(key, effectiveAttributes.value);
  const a = getAllocation(key);
  return base + (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + packageAdjust(key) + eraAdjust(key);
}
export function skillValueText(key) {
  const base = skillBase(key, effectiveAttributes.value);
  const a = getAllocation(key);
  const pkg = packageAdjust(key);
  const era = eraAdjust(key);
  const total = base + (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + pkg + era;
  return { base, total, ...a, package: pkg, era };
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

// ---- 信用评级自动分配 ----
// 选择职业后，自动在本职技能中投入「职业最低信用评级」的职业技能点（正常消耗点数）；
// 严格模式下信用评级不可超过职业信用评级上限（切换为严格模式时也会自动收敛）。
function syncCreditRatingAuto() {
  // 神秘冰岛无职业模板（地位自由分配），不自动分配
  if (character.era === 'iceland') return;
  let min, max;
  if (character.jobType === 'preset') {
    if (!currentJob.value) return; // 尚未选择职业
    [min, max] = currentJob.value.wealth;
  } else {
    [min, max] = character.customWealth || [9, 30]; // 自定义职业使用用户填写的信用范围
  }
  if (min == null || min <= 0) return;
  const key = '信用评级';
  const alloc = { ...getAllocation(key) };
  let target = alloc.pro || 0;
  // 至少投入最低信用点（不超过剩余职业技能点，正常消耗）
  const remaining = Math.max(0, totalProPoints.value - usedProPoints() + target);
  target = Math.max(target, Math.min(min, remaining));
  // 严格模式：不可超过职业信用评级上限
  if (character.skillMode === 'strict') target = Math.min(target, max != null ? max : 99);
  if (target !== (alloc.pro || 0)) {
    alloc.pro = target;
    character.allocations[key] = alloc;
    saveCharacter();
  }
}
watch(
  () => [character.jobType, character.jobName, character.customWealth?.[0], character.customWealth?.[1], character.skillMode, totalProPoints.value],
  () => syncCreditRatingAuto(),
  { immediate: true }
);
// 严格模式兜底：信用评级分配值实时不可超过职业上限
// （覆盖导入 JSON/Saiko、直接修改等不经过 UI setVal 的路径；仅向下收敛，不影响调低）
watch(
  () => character.allocations['信用评级']?.pro || 0,
  (val) => {
    if (!val || character.skillMode !== 'strict' || character.era === 'iceland') return;
    let max = null;
    if (character.jobType === 'preset') {
      if (!currentJob.value) return;
      max = currentJob.value.wealth?.[1];
    } else {
      max = (character.customWealth || [9, 30])[1];
    }
    if (max == null) return;
    if (val > max) {
      character.allocations['信用评级'] = { ...getAllocation('信用评级'), pro: max };
      saveCharacter();
    }
  }
);

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

// 当前时代的信用评级特殊定义（无特殊定义的时代返回 null，沿用标准规则）
// 有定义的时代在「物品与装备」步骤替换原本的现金/消费水平展示
export const eraCredit = computed(() => eraCreditDefs[character.era] || null);

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
  母语: effectiveAttr('edu'),
  闪避: Math.floor(effectiveAttr('dex') / 2),
}));

// 是否所有基础属性已填
export const attributesComplete = computed(() => ATTR_KEYS.every(k => character.attributes[k] != null && character.attributes[k] > 0));

// 应用年龄自动修正（从首次应用的「年龄前快照」推导，可重复重骰且幂等）
// 结果写入 ageAutoBonus（差值层），不改动基础属性，避免影响购点剩余点数。
export function applyAgeAdjustment() {
  if (!character.preAgeAttributes) character.preAgeAttributes = { ...character.attributes };
  const base = { ...character.preAgeAttributes };
  const { attributes, summary } = modifyAttributesByAge(base, character.age);
  const auto = {};
  [...ATTR_KEYS, 'luc'].forEach(k => {
    auto[k] = (attributes[k] || 0) - (base[k] || 0);
  });
  character.ageAutoBonus = auto;
  character.ageSummary = summary;
  character.ageAdjusted = true;
  saveCharacter();
}
