// ============================================================
// 骰子检定逻辑（COC 7版 成功等级判定）
// 纯函数，便于单元测试与 UI 复用
// ============================================================
import { roll, rollStr } from './rules.js';

// 1~100 的检定掷骰
export function rollD100() {
  return roll(100);
}

// 成功等级配色与文案
const TIERS = {
  critical: { label: '大成功', color: '#c9a24b' },
  extreme: { label: '极难成功', color: '#8be0b4' },
  hard: { label: '困难成功', color: '#6fc79a' },
  success: { label: '成功', color: '#5DCAA5' },
  fail: { label: '失败', color: '#d98a7b' },
  fumble: { label: '大失败', color: '#ff6b5e' },
};

// COC 7e 判定规则（target = 技能/属性当前值，r = 掷骰结果 1~100）
// - 掷出 1 恒为「大成功」
// - 掷出 100 恒为「大失败」
// - 技能 < 50% 时，掷出 96~100 为「大失败」
// - 技能 > 100% 时：掷出 ≤ (技能值−100) 为「极难成功」，其余（非大失败）均「成功」
// - 其余按 极难(≤1/5) / 困难(≤1/2) / 常规(≤目标) 分级
export function evaluateCheck(target, r) {
  const t = Math.max(0, Number(target) || 0);
  const rollVal = Math.max(1, Math.min(100, Math.round(Number(r) || 0)));

  let tier;
  if (rollVal === 1) tier = 'critical';
  else if (rollVal === 100) tier = 'fumble';
  else if (t < 50 && rollVal >= 96) tier = 'fumble';
  else if (t > 100) {
    tier = rollVal <= (t - 100) ? 'extreme' : 'success';
  } else if (rollVal <= Math.floor(t / 5)) tier = 'extreme';
  else if (rollVal <= Math.floor(t / 2)) tier = 'hard';
  else if (rollVal <= t) tier = 'success';
  else tier = 'fail';

  const thresholds = {
    extreme: t > 100 ? Math.max(0, t - 100) : Math.floor(t / 5),
    hard: t > 100 ? null : Math.floor(t / 2),
    regular: Math.min(100, t),
  };

  return { ...TIERS[tier], tier, thresholds };
}

// 自由掷骰（伤害/自定义表达式，如 "2d6+5"），复用 rules.rollStr
export function rollExpression(expr) {
  return rollStr(expr || '');
}
