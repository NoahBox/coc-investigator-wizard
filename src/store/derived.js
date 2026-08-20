// ============================================================
// store 领域模块 · 派生：有效属性、衍生值、经验包加成、信用/现金、
// 时代信息、年龄修正
// 与 skills.js 存在循环依赖（effectiveAttributes ↔ skillValue），
// 所有跨模块引用均发生在函数/计算属性运行时，模块求值阶段安全。
// ============================================================
import { computed } from 'vue';
import { character, saveCharacter } from './character.js';
import { skillValue, skillBase, isOccupationSkill, splitSkillKey, getAllocation } from './skills.js';
import {
  ATTR_KEYS, computeDerived, modifyAttributesByAge,
  getLivingStandard, getCash, getCurrency,
} from '../data/rules.js';
import { eraDiceTables, eraCreditDefs } from '../data/eras.js';
import { getPackage } from '../data/packages.js';

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

// ---- 动态基础值展示 ----
// 母语默认 = 教育，闪避默认 = 1/2敏捷 的展示值
export const dynamicBase = computed(() => ({
  母语: effectiveAttr('edu'),
  闪避: Math.floor(effectiveAttr('dex') / 2),
}));

// 是否所有基础属性已填
export const attributesComplete = computed(() => ATTR_KEYS.every(k => character.attributes[k] != null && character.attributes[k] > 0));

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
