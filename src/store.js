// ============================================================
// store 聚合入口：按领域拆分后的统一 re-export
// 拆分：
//   store/character.js — 角色状态、新建/导入/保存、主题
//   store/roster.js    — 花名册（多卡持久化、切换/删除/导入导出）
//   store/skills.js    — 技能与职业（键、基础值、分配、本职技能、点数、信用同步）
//   store/derived.js   — 派生（有效属性、衍生值、经验包、信用/现金、时代信息、年龄修正）
//
// ⚠ 求值顺序约束：skills.js 必须「先于」derived.js 在此处导出。
//   skills 与 derived 互为循环依赖（skillValue ↔ effectiveAttributes），
//   而 skills 模块求值期间会立即执行「信用评级自动同步」watch 并访问
//   derived 的计算属性（totalProPoints → effectiveAttributes）。
//   只有保证 derived 先完成求值，该立即回调才不会触发 TDZ。
// ============================================================

// 角色领域
export {
  theme, toggleTheme, applyTheme,
  character, saveCharacter, newCharacter, importCharacter,
  createEmptyCharacter,
} from './store/character.js';

// 花名册领域
export {
  listInvestigators, loadInvestigator, deleteInvestigator, duplicateInvestigator,
  setInvestigatorImported, getInvestigators, buildRosterExport, parseRosterExport,
  importInvestigators,
} from './store/roster.js';

// 技能与职业领域（先于 derived.js 求值，见文件头注释）
export {
  splitSkillKey, makeSkillKey, skillBase,
  getAllocation, eraAdjust, skillValue, skillValueText, setAllocation,
  usedProPoints, usedInterestPoints, usedPackagePoints,
  currentJob, creditRange, totalProPoints, totalInterestPoints,
  resolveJobSkills, expandSkillKey, occupationSkills, occupationGroupNames,
  jobGroupHints, isOccupationSkill,
  getGroupChildren, ensureGroupChild,
} from './store/skills.js';

// 派生领域（最后求值）
export {
  effectiveAttr, effectiveAttributes, skillBaseOf, derived,
  currentPackage, packageAdjust, packageSanLoss, packageSanReduction,
  creditRatingValue, livingStandard, cashInfo, currency, eraCredit,
  dynamicBase, attributesComplete, eraInfo, applyAgeAdjustment,
} from './store/derived.js';
