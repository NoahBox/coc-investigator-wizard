// ============================================================
// Foundry VTT「克苏鲁的呼唤 7版 (CoC7)」角色导出
// 将本工具生成的调查员转换为可被 CoC7 系统直接导入的 actor JSON
//
// 数据结构依据 CoC7 官方 compendium / 数据模型（develop 分支）：
//   - system.characteristics: 8 项属性，每项 { value }
//   - system.attribs: hp / mp / lck / san（含 value / max）
//   - 技能为顶层 items 中 type:'skill' 的条目，最终值 = adjustments 各项之和
//   - 分组/专业化技能命名遵循 "子技能 (父技能)"，如 斗殴 (格斗)
// ============================================================
import {
  character, derived, effectiveAttr, skillValue, skillBaseOf,
  getAllocation, eraAdjust, splitSkillKey, makeSkillKey,
} from './store.js';
import { getSkill, getEraSkillGroups, getEraGroupOrder, getEraSkillList } from './data/skills.js';

const CHAR_KEYS = ['str', 'con', 'dex', 'app', 'int', 'pow', 'siz', 'edu'];

// 生成 16 位十六进制 id（避免与已有文档冲突）
function rid() {
  let s = '';
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

// 本项目的技能键 → CoC7 物品显示名
//   基础技能：侦查 → 侦查
//   分组技能：格斗(斗殴) → 斗殴 (格斗)；母语(英语) → 英语 (母语)
//   自定义技能：自定义(书法) → 书法
function coc7SkillName(key) {
  const { name, child } = splitSkillKey(key);
  if (!child) return name;
  if (name === '自定义') return child;
  return `${child} (${name})`;
}

// 是否为不可"推动(push)"的战斗技能
function isCombatSkill(parentName) {
  return parentName === '格斗' || parentName === '射击';
}

// 构建技能 item
function buildSkillItem(key) {
  const { name, child } = splitSkillKey(key);
  const base = Number(skillBaseOf(key)) || 0;
  const alloc = getAllocation(key);
  const era = eraAdjust(key);
  const pro = alloc.pro || 0;
  const interest = alloc.interest || 0;
  // 成长 + 经历包加成 + 时代掷骰修正，合并计入经验调整
  const growth = (alloc.growth || 0) + (alloc.package || 0) + era;

  const grouped = !!child && name !== '自定义';
  const displayName = coc7SkillName(key);

  return {
    _id: rid(),
    name: displayName,
    type: 'skill',
    img: 'systems/CoC7/assets/icons/skills.svg',
    system: {
      description: { value: '' },
      // skillName/specialization 在导入时会被系统依据 name 重新解析，这里显式给出保持一致
      skillName: grouped ? name : displayName,
      specialization: grouped ? child : '',
      base: String(base),
      adjustments: {
        base,
        personal: interest,
        occupation: pro,
        archetype: 0,
        experiencePackage: 0,
        experience: growth,
      },
      properties: { push: !isCombatSkill(grouped ? name : '') },
    },
  };
}

// 构建武器 item（尽力映射本项目武器字段）
function buildWeaponItem(w) {
  if (!w || !w.name) return null;
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    _id: rid(),
    name: w.name,
    type: 'weapon',
    img: 'icons/svg/sword.svg',
    system: {
      description: { value: '' },
      skill: { main: { name: w.skill || '', id: '' }, alternativ: { name: '', id: '' } },
      range: {
        normal: { value: w.range || '', damage: w.dam || '' },
        long: { value: '', damage: '' },
        extreme: { value: '', damage: '' },
      },
      usesPerRound: { normal: num(w.round), max: num(w.num), burst: 0 },
      bullets: num(w.num),
      ammo: num(w.num),
      malfunction: w.err || '',
      blastRadius: '',
    },
  };
}

// 主转换函数：返回完整 actor 对象
export function toFVTT() {
  const characteristics = {};
  CHAR_KEYS.forEach((k) => { characteristics[k] = { value: effectiveAttr(k) || 0 }; });

  const d = derived.value;
  const attribs = {
    hp: { value: d.hp, max: d.hpMax },
    mp: { value: d.mp, max: d.mpMax },
    lck: { value: effectiveAttr('luc') },
    san: { value: d.san, max: d.sanMax },
  };

  // ---- 技能 items ----
  const skillItems = [];
  const emitted = new Set();
  const collect = (key) => {
    if (!key || emitted.has(key)) return;
    const val = skillValue(key);
    const alloc = getAllocation(key);
    const hasPoint = (alloc.pro || 0) + (alloc.interest || 0) + (alloc.growth || 0) + (alloc.package || 0) > 0;
    if (val > 0 || hasPoint) {
      skillItems.push(buildSkillItem(key));
      emitted.add(key);
    }
  };

  // 标准技能 + 时代技能组（按分类展开分组子技能）
  const groups = getEraSkillGroups(character.era);
  const order = getEraGroupOrder(character.era);
  order.forEach((groupName) => {
    (groups[groupName] || []).forEach((name) => {
      if (name === '自定义') {
        (character.groupedOrder['自定义'] || []).filter(Boolean)
          .forEach((child) => collect(makeSkillKey('自定义', child)));
        return;
      }
      const sk = getSkill(name);
      if (sk && sk.group && sk.group.skills.length) {
        const children = (character.groupedOrder[name] || []).filter(Boolean);
        if (children.length) children.forEach((child) => collect(makeSkillKey(name, child)));
        else collect(name); // 未选子技能时，仅当该占位技能本身有值才导出（一般会被跳过）
      } else {
        collect(name);
      }
    });
  });

  // 时代扩展技能
  getEraSkillList(character.era).forEach((sk) => {
    if (sk && sk.name && !emitted.has(sk.name)) collect(sk.name);
  });

  // ---- 武器 items ----
  const weaponItems = (character.weapons || [])
    .map(buildWeaponItem)
    .filter(Boolean);

  return {
    name: character.name || '未命名调查员',
    type: 'character',
    img: 'icons/svg/mystery-man.svg',
    system: {
      characteristics,
      attribs,
      infos: {
        age: (character.age != null && character.age !== '') ? String(character.age) : '',
      },
    },
    items: [...skillItems, ...weaponItems],
    prototypeToken: {
      actorLink: true,
      disposition: 1,
      sight: { enabled: true },
    },
  };
}

// 导出为格式化的 JSON 字符串
export function exportFVTT() {
  return JSON.stringify(toFVTT(), null, 2);
}
