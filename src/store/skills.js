// ============================================================
// store 领域模块 · 技能与职业：技能键、基础值、分配、技能值、
// 本职技能解析、职业点数、信用评级自动分配
// ============================================================
import { computed, watch } from 'vue';
import { character, saveCharacter } from './character.js';
import { effectiveAttr, effectiveAttributes, packageAdjust } from './derived.js';
import { getSkill, getEraSkill } from '../data/skills.js';
import { getJob } from '../data/jobs.js';
import { computeProSkillPoints, computeInterestSkillPoints } from '../data/rules.js';
import { eraSkillBaseAdjust } from '../data/eras.js';

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

// ---- 当前职业 ----
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

// 注意：本模块与 derived.js 存在循环依赖（skillValue ↔ effectiveAttributes），
// 主 store.js 必须保证「先求值 skills.js、后求值 derived.js」，
// 使此处立即执行的 watch 在访问 derived 的计算属性时其已初始化。
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
