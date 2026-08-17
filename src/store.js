// ============================================================
// 全局状态 & localStorage 持久化
// ============================================================
import { reactive, computed } from 'vue';
import { skills, getSkill, groupedSkillNames } from './data/skills.js';
import { getJob } from './data/jobs.js';
import {
  ATTR_KEYS, generateRandomAttributes, modifyAttributesByAge,
  computeDerived, computeProSkillPoints, computeInterestSkillPoints,
  getLivingStandard, getCash, getCurrency,
} from './data/rules.js';
import { getPackage } from './data/packages.js';

const LS_KEY = 'coc-wizard-character';
const THEME_KEY = 'coc-wizard-theme';

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
    name: '', player: '', age: '', gender: '男', genderOther: '',
    avatar: '',
    country: '美国', hometown: '', residence: '', era: 'modern',
    jobType: 'preset', jobName: '', customJobName: '',
    customSkills: [], customPointFormula: 'edu4', customWealth: [9, 30],
    ageModifier: true,
    packageEnabled: false, packageId: null,
    packageSkillPoints: {}, packageRolls: {},
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
  return merged;
}

function loadCharacter() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return normalize(data);
    }
  } catch (e) { /* ignore */ }
  return null;
}

export const character = reactive(loadCharacter() || createEmptyCharacter());

let saveTimer = null;
export function saveCharacter() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(character)); } catch (e) { /* ignore */ }
  }, 300);
}

export function newCharacter() {
  const fresh = createEmptyCharacter();
  Object.keys(fresh).forEach(k => { character[k] = fresh[k]; });
  saveCharacter();
}

export function importCharacter(data) {
  const merged = normalize(data);
  Object.keys(character).forEach(k => { delete character[k]; });
  Object.assign(character, merged);
  character.imported = true;
  saveCharacter();
}

// ---- 派生计算 ----
export const derived = computed(() => {
  const a = character.attributes;
  const base = computeDerived(a, character.age);
  const over = character.derivedOverrides || {};
  const mythos = skillValue('克苏鲁神话');
  const sanMax = over.sanMax != null ? over.sanMax : Math.max(0, 99 - mythos);
  return {
    ...base,
    hpMax: over.hpMax != null ? over.hpMax : base.hp,
    mpMax: over.mpMax != null ? over.mpMax : base.mp,
    sanMax,
    hp: over.hp != null ? over.hp : base.hp,
    mp: over.mp != null ? over.mp : base.mp,
    san: over.san != null ? over.san : base.san,
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
  return base + (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + (a.package || 0);
}
export function skillValueText(key) {
  const base = skillBase(key, character.attributes);
  const a = getAllocation(key);
  const total = base + (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + (a.package || 0);
  return { base, total, ...a };
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

// 生活水平/现金
export const creditRatingValue = computed(() => {
  // 优先取「信用评级」技能的实际值（基础值 0 + 已分配的职业点）
  const cr = skillValue('信用评级');
  if (cr > 0) return cr;
  if (character.creditRating != null) return character.creditRating;
  // 未分配时回退到信用范围中间值
  const [min, max] = creditRange.value;
  return Math.round((min + max) / 2);
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
