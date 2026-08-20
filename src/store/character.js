// ============================================================
// store 领域模块 · 角色：当前调查员状态、新建/导入/保存、主题
// ============================================================
import { reactive } from 'vue';
import { ATTR_KEYS } from '../data/rules.js';
import { EXP_BOOKS } from '../data/jobs.js';
import { loadCharacter, isBlankCard, readRoster, writeRoster } from './roster.js';

// ---- 工具：生成卡 id ----
export function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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

// 归一化：补齐缺失字段（兼容旧存档 / 外部导入数据）
export function normalize(data) {
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

// ---- 主题 ----
const THEME_KEY = 'coc-wizard-theme';
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
export const character = reactive(loadCharacter() || createEmptyCharacter());

let saveTimer = null;
// 立即把当前角色写入花名册（供切换/新建/导入前刷新待保存内容，避免竞态丢失）
export function flushSave() {
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
