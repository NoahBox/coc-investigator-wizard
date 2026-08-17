// ============================================================
// COC 7版 规则与计算
// ============================================================

// ---- 骰子 ----
export function roll(dice, times = 1, plus = 0) {
  let sum = plus;
  for (let i = 0; i < times; i++) sum += Math.floor(Math.random() * dice) + 1;
  return sum;
}
// 解析骰子字符串 "1d10+5" → 掷骰结果
export function rollStr(diceStr) {
  if (!diceStr) return 0;
  const m = diceStr.match(/(\d+)\s*d\s*(\d+)(?:\s*([+-])\s*(\d+))?/i);
  if (!m) return 0;
  const times = parseInt(m[1], 10), dice = parseInt(m[2], 10);
  const sign = m[3], plus = m[4] ? parseInt(m[4], 10) : 0;
  const base = roll(dice, times);
  return sign === '-' ? base - plus : base + plus;
}

// ---- 属性 ----
export const ATTR_KEYS = ['str', 'con', 'dex', 'app', 'pow', 'siz', 'int', 'edu'];
export const ATTR_LABELS = {
  str: '力量', con: '体质', dex: '敏捷', app: '外貌',
  pow: '意志', siz: '体型', int: '智力', edu: '教育', luc: '幸运',
};
export const ATTR_EN = {
  str: 'STR', con: 'CON', dex: 'DEX', app: 'APP',
  pow: 'POW', siz: 'SIZ', int: 'INT', edu: 'EDU', luc: 'LUC',
};

// 随机生成：STR/CON/DEX/APP/POW = 3d6×5；SIZ/INT/EDU = (2d6+6)×5；LUC = 3d6×5
export function generateRandomAttributes() {
  const a = {};
  ['str', 'con', 'dex', 'app', 'pow'].forEach(k => (a[k] = roll(6, 3) * 5));
  ['siz', 'int', 'edu'].forEach(k => (a[k] = roll(6, 2, 6) * 5));
  a.luc = roll(6, 3) * 5;
  return a;
}

// 快速开始规则：将这 8 个数值分配到任意属性
export const QUICK_START_VALUES = [40, 50, 50, 50, 60, 60, 70, 80];

// 购点默认
export const POINT_BUY_DEFAULT = 460;
export const ATTR_MIN = 15;
export const ATTR_MAX = 90;

// ---- 年龄修正 ----
export function growPoint(origin, times = 1) {
  if (times < 1) return { value: origin, improved: [] };
  let result = origin;
  const improved = [];
  for (let i = 0; i < times; i++) {
    const judge = roll(100);
    if (judge > result) {
      const gain = roll(10);
      result += gain;
      improved.push({ judge, gain });
    } else {
      improved.push({ judge, gain: 0 });
    }
  }
  return { value: Math.min(result, 99), improved };
}

function minusAttributes(attributes, keys, total) {
  const results = { ...attributes };
  const sum = keys.reduce((s, k) => s + (results[k] || 0), 0);
  if (sum < total + keys.length * 5) {
    keys.forEach(k => (results[k] = 5));
    return results;
  }
  let rest = total;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      if ((results[key] || 0) - rest < 5) return minusAttributes(results, keys, rest);
      results[key] -= rest;
    } else {
      let minus = roll(rest + 1) - 1;
      if ((results[key] || 0) - minus < 5) minus = (results[key] || 0) - 5;
      rest -= minus;
      results[key] -= minus;
    }
  });
  return results;
}

// 年龄修正，返回 { attributes, summary }
export function modifyAttributesByAge(attributes, age) {
  let results = { ...attributes };
  const summary = [];
  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 15) {
    summary.push('年龄低于15岁，不进行年龄修正');
    return { attributes: results, summary };
  }
  if (ageNum < 20) {
    results = minusAttributes(results, ['str', 'siz'], 5);
    const newLuc = roll(6, 3) * 5;
    results.luc = Math.max(results.luc || 0, newLuc);
    summary.push('15~19岁：力量、体型 -5，幸运重骰（取较高者）');
  } else if (ageNum < 40) {
    const g = growPoint(results.edu || 0, 1);
    results.edu = g.value;
    summary.push('20~39岁：教育进行一次成长检定' + (g.improved[0].gain ? `（+${g.improved[0].gain}）` : '（未成长）'));
  } else if (ageNum < 50) {
    results = minusAttributes(results, ['str', 'con', 'dex'], 5);
    results.app = Math.max((results.app || 0) - 5, 0);
    const g = growPoint(results.edu || 0, 2);
    results.edu = g.value;
    summary.push('40~49岁：力量、体质、敏捷共 -5，外貌 -5，教育成长检定×2');
  } else if (ageNum < 60) {
    results = minusAttributes(results, ['str', 'con', 'dex'], 10);
    results.app = Math.max((results.app || 0) - 10, 0);
    const g = growPoint(results.edu || 0, 3);
    results.edu = g.value;
    summary.push('50~59岁：力量、体质、敏捷共 -10，外貌 -10，教育成长检定×3');
  } else if (ageNum < 70) {
    results = minusAttributes(results, ['str', 'con', 'dex'], 20);
    results.app = Math.max((results.app || 0) - 15, 0);
    const g = growPoint(results.edu || 0, 4);
    results.edu = g.value;
    summary.push('60~69岁：力量、体质、敏捷共 -20，外貌 -15，教育成长检定×4');
  } else if (ageNum < 80) {
    results = minusAttributes(results, ['str', 'con', 'dex'], 40);
    results.app = Math.max((results.app || 0) - 20, 0);
    const g = growPoint(results.edu || 0, 4);
    results.edu = g.value;
    summary.push('70~79岁：力量、体质、敏捷共 -40，外貌 -20，教育成长检定×4');
  } else if (ageNum < 90) {
    results = minusAttributes(results, ['str', 'con', 'dex'], 80);
    results.app = Math.max((results.app || 0) - 25, 0);
    const g = growPoint(results.edu || 0, 4);
    results.edu = g.value;
    summary.push('80~89岁：力量、体质、敏捷共 -80，外貌 -25，教育成长检定×4');
  } else {
    summary.push('90岁以上：不再进行额外的属性修正');
  }
  results.app = Math.max(results.app, 5);
  results.edu = Math.min(results.edu, 99);
  return { attributes: results, summary };
}

// ---- 衍生属性 ----
// 伤害加值 / 体格 表（基于 STR+SIZ）
export function getDBBuild(str, siz) {
  const sum = (str || 0) + (siz || 0);
  if (sum <= 64) return { db: '-2', build: -2 };
  if (sum <= 84) return { db: '-1', build: -1 };
  if (sum <= 124) return { db: '0', build: 0 };
  if (sum <= 164) return { db: '+1D4', build: 1 };
  if (sum <= 204) return { db: '+1D6', build: 2 };
  if (sum <= 284) return { db: '+2D6', build: 3 };
  if (sum <= 364) return { db: '+3D6', build: 4 };
  if (sum <= 444) return { db: '+4D6', build: 5 };
  return { db: '+5D6', build: 6 };
}

// 移动力（基础 7/8/9，再按年龄扣减）
export function getMovement(str, siz, dex, age) {
  let mov = 8;
  if (str && siz && dex) {
    if (str < siz && dex < siz) mov = 7;
    else if (str >= siz && dex >= siz) mov = 9;
  }
  const a = parseInt(age, 10);
  if (a >= 40 && a < 50) mov -= 1;
  else if (a >= 50 && a < 60) mov -= 2;
  else if (a >= 60 && a < 70) mov -= 3;
  else if (a >= 70 && a < 80) mov -= 4;
  else if (a >= 80 && a < 90) mov -= 5;
  return Math.max(mov, 7);
}

// 计算全部衍生属性
export function computeDerived(attributes, age) {
  const { str, con, dex, pow, siz, int: _int, edu } = attributes;
  const hp = con && siz ? Math.floor((con + siz) / 10) : 0;
  const mp = pow ? Math.floor(pow / 5) : 0;
  const san = pow || 0;
  const { db, build } = getDBBuild(str, siz);
  const mov = getMovement(str, siz, dex, age);
  return { hp, mp, san, db, build, mov };
}

// 职业技能点数（依据职业 point 公式）
export function computeProSkillPoints(job, attributes) {
  if (!job) return 0;
  let total = 0;
  job.point.forEach((unitGroup) => {
    // unitGroup 是 [[]]，取第一个满足条件的 unit
    for (const unit of unitGroup) {
      const [attrKey, mult] = unit;
      const val = attributes[attrKey] || 0;
      if (val) { total += val * mult; break; }
    }
  });
  return total;
}

export function computeInterestSkillPoints(attributes) {
  return (attributes.int || 0) * 2;
}

// ---- 生活水平 / 现金 ----
export const LIVING_STANDARDS = [
  { min: 0, max: 0, name: '身无分文', desc: '连贫穷都够不上的人才能叫做身无分文。' },
  { min: 1, max: 9, name: '贫穷', desc: '刚好买得起最廉价的屋顶，每天能吃上一餐廉价食物。' },
  { min: 10, max: 49, name: '标准', desc: '舒适的生活水平，一日三餐，偶尔下馆子。' },
  { min: 50, max: 89, name: '小康', desc: '小康级别已可享受奢侈品的舒适。' },
  { min: 90, max: 98, name: '富裕', desc: '富裕级别就是享受超级奢侈品的时候了。' },
  { min: 99, max: 99, name: '豪富', desc: '与富裕差不多，但钱已经只是一个代号了。' },
];

export function getLivingStandard(cr) {
  return LIVING_STANDARDS.find(s => cr >= s.min && cr <= s.max) || LIVING_STANDARDS[0];
}

// 货币体系
export const CURRENCIES = {
  USD: { symbol: '$', name: '美元', rate: 1 },
  CNY: { symbol: '¥', name: '人民币', rate: 7.2 },
  JPY: { symbol: '¥', name: '日元', rate: 150 },
  SILVER: { symbol: '银元', name: '银元/大洋', rate: 1 },
};

// 根据国家和时代确定货币
export function getCurrency(country, era) {
  if (country === '中国') {
    return era === '1920s' ? CURRENCIES.SILVER : CURRENCIES.CNY;
  }
  if (country === '日本') {
    return CURRENCIES.JPY;
  }
  return CURRENCIES.USD;
}

// 现金 = 信用评级 × 10（基础币种），再换算
export function getCash(creditRating, country, era) {
  const cur = getCurrency(country, era);
  const base = (creditRating || 0) * 10;
  return { amount: Math.round(base * cur.rate), currency: cur };
}

// 资产总额（近似）= 信用评级 × 50
export function getAssets(creditRating, country, era) {
  const cur = getCurrency(country, era);
  const base = (creditRating || 0) * 50;
  return { amount: Math.round(base * cur.rate), currency: cur };
}
