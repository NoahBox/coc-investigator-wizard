// ============================================================
// TRPG Saiko 车卡工具 兼容的 Base64 串 转换器
// 格式：LZString.compressToEncodedURIComponent(JSON.stringify({ pc, viewData }))
// ============================================================
import LZString from 'lz-string';
import { createEmptyCharacter, character, occupationSkills, totalProPoints, totalInterestPoints, packageAdjust, packageSanReduction, effectiveAttributes } from './store.js';
import { getJob } from './data/jobs.js';
import { computeDerived } from './data/rules.js';

// 技能名 Ω 后缀映射（TRPG 用「计算机使用Ω」「电子学Ω」，本项目的名字去掉了 Ω）
const MINE_TO_SAIKO = { 计算机使用: '计算机使用Ω', 电子学: '电子学Ω' };
const SAIKO_TO_MINE = { '计算机使用Ω': '计算机使用', '电子学Ω': '电子学' };
const toSaikoName = (n) => MINE_TO_SAIKO[n] || n;
const toMineName = (n) => SAIKO_TO_MINE[n] || n.replace(/Ω/g, '');

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
function str(v) { return v == null || v === '' ? '' : String(v); }

// 文本 ↔ 行数组
function textToRows(text) {
  const rows = (text || '').split('\n').filter((l) => l.trim()).map((l) => ({ name: l.trim() }));
  while (rows.length < 3) rows.push({ name: '' });
  return rows;
}
function rowsToText(rows) {
  return (rows || []).filter((r) => r && r.name).map((r) => r.name).join('\n');
}

// TRPG 技能键 → 本项目技能键
function saikoSkillKeyToMine(skill, viewData) {
  if (Array.isArray(skill)) {
    const [name, , position] = skill;
    const childName = viewData?.showingChildSkills?.[name]?.[position];
    const mineName = toMineName(name);
    return childName ? `${mineName}(${childName})` : mineName;
  }
  return toMineName(skill);
}
// 本项目技能键 → TRPG 技能键
function mineSkillKeyToSaiko(key, groupedOrder) {
  const idx = key.indexOf('(');
  if (idx === -1) return toSaikoName(key);
  const name = key.slice(0, idx);
  const child = key.slice(idx + 1, -1);
  const saikoName = toSaikoName(name);
  const children = (groupedOrder && groupedOrder[name]) || [];
  const position = children.indexOf(child);
  return [saikoName, child, position >= 0 ? position : 0];
}

// ---- TRPG Saiko 数据 → 本项目 character ----
export function fromSaiko(data) {
  const pc = data?.pc || {};
  const viewData = data?.viewData || {};
  const char = createEmptyCharacter();

  // 基本信息
  char.name = pc.name || '';
  char.player = pc.playerName || '';
  char.age = pc.age != null && pc.age !== '' ? String(pc.age) : '';
  char.gender = pc.gender || '男';
  if (char.gender && !['男', '女', '其他'].includes(char.gender)) {
    char.genderOther = pc.gender;
    char.gender = '其他';
  }
  char.hometown = pc.hometown || '';
  char.residence = pc.location || '';
  char.era = pc.time === '1920s' ? '1920s' : 'modern';
  char.avatar = pc.avatar || '';

  // 职业
  if (pc.job && getJob(pc.job)) {
    char.jobType = 'preset';
    char.jobName = pc.job;
  } else if (pc.job) {
    char.jobType = 'custom';
    char.customJobName = pc.job;
  }

  // 属性
  const attrs = pc.attributes || {};
  ['str', 'con', 'dex', 'app', 'pow', 'siz', 'int', 'edu', 'luc'].forEach((k) => {
    char.attributes[k] = num(attrs[k]);
  });

  // 衍生
  const d = pc.deriveAttributes || {};
  char.derivedOverrides.hp = num(d.hp?.now);
  char.derivedOverrides.hpMax = num(d.hp?.start);
  char.derivedOverrides.mp = num(d.mp?.now);
  char.derivedOverrides.mpMax = num(d.mp?.start);
  char.derivedOverrides.san = num(d.sanity?.now);
  // sanMax 不设置（null），由「99 − 克苏鲁神话」自动计算

  // 子技能（showingChildSkills → groupedOrder）
  char.groupedOrder = {};
  Object.keys(viewData.showingChildSkills || {}).forEach((name) => {
    char.groupedOrder[toMineName(name)] = [...viewData.showingChildSkills[name]];
  });

  // 技能点数
  char.allocations = {};
  (pc.skillPoints || []).forEach(([skill, point]) => {
    const key = saikoSkillKeyToMine(skill, viewData);
    if (!key) return;
    char.allocations[key] = {
      pro: point?.p || 0,
      interest: point?.i || 0,
      growth: point?.g || 0,
      package: 0,
    };
  });

  // 本职技能（仅自定义职业时，用于还原本职技能列表）
  if (char.jobType === 'custom') {
    char.customSkills = (pc.proSkills || []).map((s) => saikoSkillKeyToMine(s, viewData)).filter(Boolean);
  }

  // 武器
  char.weapons = (pc.weapons || []).map((w) => ({ ...w }));

  // 背景
  const st = pc.stories || {};
  char.background = {
    app: st.app || '', belief: st.belief || '', importantPerson: st.IPerson || '',
    place: st.IPlace || '', item: st.IItem || '', trait: st.trait || '',
    scar: st.scar || '', mad: st.mad || '', desc: st.desc || '',
  };

  // 资产/物品/神话
  const as = pc.assets || {};
  char.items = textToRows(as.items);
  char.assetsRows = textToRows(as.assets);
  char.mythosItems = textToRows(as.magicItems);
  char.spells = textToRows(as.magics);
  char.contacts = textToRows(as.touches);

  // 关系/模组
  char.relations = (pc.friends || '').split('\n').filter((l) => l.trim()).map((l) => ({ character: '', player: '', job: '', relation: l.trim() }));
  while (char.relations.length < 3) char.relations.push({ character: '', player: '', job: '', relation: '' });
  char.scenarios = (pc.experiencedModules || '').split('\n').filter((l) => l.trim()).map((l) => ({ name: l.trim(), time: '' }));
  while (char.scenarios.length < 3) char.scenarios.push({ name: '', time: '' });

  char.imported = true;
  return char;
}

// ---- 本项目 character → TRPG Saiko 数据 ----
export function toSaiko() {
  const char = character;
  const attrs = effectiveAttributes.value;
  const over = char.derivedOverrides || {};
  const derived = computeDerived(attrs, char.age);

  const showingChildSkills = {};
  Object.keys(char.groupedOrder || {}).forEach((name) => {
    showingChildSkills[toSaikoName(name)] = [...char.groupedOrder[name]];
  });

  const skillPoints = [];
  Object.keys(char.allocations || {}).forEach((key) => {
    const a = char.allocations[key];
    const point = {};
    if (a.pro) point.p = a.pro;
    if (a.interest) point.i = a.interest;
    const growth = (a.growth || 0) + packageAdjust(key); // 幕间成长 + 经历包加成，合并为成长点
    if (growth) point.g = growth;
    if (Object.keys(point).length) {
      skillPoints.push([mineSkillKeyToSaiko(key, char.groupedOrder), point]);
    }
  });

  const proSkills = occupationSkills.value.map((key) => mineSkillKeyToSaiko(key, char.groupedOrder));

  const hpMax = over.hpMax ?? Math.floor(((attrs.con || 0) + (attrs.siz || 0)) / 10);
  const mpMax = over.mpMax ?? Math.floor((attrs.pow || 0) / 5);
  const sanNow = over.san ?? Math.max(0, (attrs.pow || 0) - packageSanReduction());

  const pc = {
    name: char.name || '',
    playerName: char.player || '',
    time: char.era === '1920s' ? '1920s' : '现代',
    job: char.jobType === 'preset' ? char.jobName : (char.customJobName || ''),
    age: char.age != null ? String(char.age) : '',
    gender: char.gender === '其他' ? (char.genderOther || '其他') : char.gender,
    location: char.residence || '',
    hometown: char.hometown || '',
    ...(char.avatar ? { avatar: char.avatar } : {}),
    attributes: { ...attrs },
    deriveAttributes: {
      sanity: { now: str(sanNow), start: str(attrs.pow) },
      hp: { now: str(over.hp ?? hpMax), start: str(hpMax) },
      mp: { now: str(over.mp ?? mpMax), start: str(mpMax) },
    },
    battleAttributes: {
      db: derived.db, size: String(derived.build), armor: '', mov: String(derived.mov),
    },
    pointValues: { pro: str(totalProPoints.value), interest: str(totalInterestPoints.value) },
    proSkills,
    skillPoints,
    weapons: (char.weapons || []).map((w) => ({ ...w })),
    stories: {
      app: char.background?.app || '', belief: char.background?.belief || '',
      IPerson: char.background?.importantPerson || '', IPlace: char.background?.place || '',
      IItem: char.background?.item || '', trait: char.background?.trait || '',
      scar: char.background?.scar || '', mad: char.background?.mad || '',
      desc: char.background?.desc || '',
    },
    assets: {
      cash: '', consumption: '',
      assets: rowsToText(char.assetsRows),
      items: rowsToText(char.items),
      magicItems: rowsToText(char.mythosItems),
      magics: rowsToText(char.spells),
      touches: rowsToText(char.contacts),
    },
    experiencedModules: (char.scenarios || []).filter((r) => r.name).map((r) => `${r.name}${r.time ? '（' + r.time + '）' : ''}`).join('\n'),
    friends: (char.relations || []).filter((r) => r.character || r.relation).map((r) => `${r.character} ${r.player} ${r.job} ${r.relation}`.trim()).join('\n'),
  };

  const viewData = {
    showingChildSkills,
    skillLimits: { pro: 0, interest: 0 },
  };

  return { pc, viewData };
}

// ---- Base64 串 ----
export function exportSaikoBase64() {
  const json = JSON.stringify(toSaiko());
  return LZString.compressToEncodedURIComponent(json);
}

export function importSaikoBase64(str) {
  const json = LZString.decompressFromEncodedURIComponent((str || '').trim());
  if (!json) throw new Error('无法解压 Base64 串');
  const data = JSON.parse(json);
  return fromSaiko(data);
}
