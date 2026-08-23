// ============================================================
// Dhole's House（dholeshouse.org）兼容的角色导出
// 生成可被 CoC7 系统「Dhole's House 导入器」(CoC7DholeHouseActorImporter，
// 即下载的 dholehouse-importer.js) 读取的 JSON。
//
// 数据结构依据该导入脚本：
//   Investigator.PersonalDetails / Characteristics / Backstory
//   Investigator.Skills.Skill[] / Possessions.item[] / Weapons.weapon[]
//
// 关键约定（来自导入脚本）：
//   - 技能名使用 CoC7 英文标准名（与导入器 guessItems 匹配）。
//   - 技能以 { name, subskill, value, occupation } 表示；
//     subskill 为空串 '' 表示「无专精」的基础技能，
//     导入器会跳过 subskill === 'None' 的条目（那是父级占位技能），
//     因此分组技能以外一律用空串，不能写 'None'。
//   - 分组/专业化技能：name 为父技能（如 Firearms），subskill 为专精（如 Handgun），
//     导入器最终生成 "Firearms (Handgun)"。
//   - 背景故事的「伤痕」字段在导入器里的键是拼错的 injurues，必须保持一致。
//   - 导入器仅接受裸 base64 的 png 头像；导出时若头像是 jpg/jpeg/webp 等常见
//     光栅格式，则通过 <canvas> 在浏览器内实时转码为 png（见 convertAvatarToPng）。
// ============================================================
import {
  character, derived, effectiveAttr, skillValue, getAllocation,
  splitSkillKey, makeSkillKey, isOccupationSkill,
} from './store.js';
import { getSkill, getEraSkillGroups, getEraGroupOrder, getEraSkillList } from './data/skills.js';

// ---- 头像 data URL 处理 ----
// 导入器仅接受裸 base64 的 png。当角色卡头像是 jpg/jpeg/webp 等常见光栅格式时，
// 在导出时通过 <canvas> 转码为 png，避免导入失败。
const PNG_PREFIX = 'data:image/png;base64,';

// 拆分 data URL：{ mime, b64 }；非 data URL（如远程 http(s) 链接）返回 null
function splitDataUrl(url) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(url || '');
  if (!m) return null;
  return { mime: m[1].toLowerCase(), b64: m[2] };
}

// 将头像（仅本地 data URL 的光栅图像）转为 png 裸 base64；不支持/失败时返回 ''
async function convertAvatarToPng(avatar) {
  const parts = splitDataUrl(avatar);
  if (!parts) return '';                          // 非 data URL（远程链接会污染 canvas），不转换
  if (parts.mime === 'image/png') return parts.b64; // png 直出
  // 先支持的几种常见格式：jpg/jpeg/webp（顺带 gif/bmp，canvas 同路径解码）
  const supported = ['image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];
  if (!supported.includes(parts.mime)) return '';
  // 仅浏览器环境具备 Image / canvas
  if (typeof Image === 'undefined' || typeof document === 'undefined') return '';
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) { resolve(''); return; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const png = canvas.toDataURL('image/png');
        const p = splitDataUrl(png);
        resolve(p ? p.b64 : '');
      } catch (e) {
        resolve(''); // 跨域污染或解码异常
      }
    };
    img.onerror = () => resolve('');
    img.src = avatar;
  });
}

const CHAR_KEYS = ['str', 'con', 'dex', 'app', 'int', 'pow', 'siz', 'edu'];

// ---- 中文技能名 → CoC7 英文技能名 ----
const SKILL_EN = {
  信用评级: 'Credit Rating',
  克苏鲁神话: 'Cthulhu Mythos',
  侦查: 'Spot Hidden',
  聆听: 'Listen',
  取悦: 'Charm',
  话术: 'Fast Talk',
  恐吓: 'Intimidate',
  说服: 'Persuade',
  心理学: 'Psychology',
  估价: 'Appraise',
  乔装: 'Disguise',
  潜行: 'Stealth',
  追踪: 'Track',
  读唇: 'Read Lips',
  人类学: 'Anthropology',
  图书馆使用: 'Library Use',
  生存: 'Survival',
  攀爬: 'Climb',
  跳跃: 'Jump',
  游泳: 'Swim',
  潜水: 'Dive',
  技艺: 'Art and Craft',
  妙手: 'Sleight of Hand',
  锁匠: 'Locksmith',
  电气维修: 'Electrical Repair',
  机械维修: 'Mechanical Repair',
  导航: 'Navigate',
  骑术: 'Ride',
  操作重型机械: 'Operate Heavy Machine',
  汽车驾驶: 'Drive Auto',
  驯兽: 'Animal Training',
  计算机使用: 'Computer Use',
  格斗: 'Fighting',
  射击: 'Firearms',
  闪避: 'Dodge',
  投掷: 'Throw',
  爆破: 'Demolitions',
  炮术: 'Artillery',
  急救: 'First Aid',
  医学: 'Medicine',
  精神分析: 'Psychoanalysis',
  催眠: 'Hypnosis',
  会计: 'Accounting',
  法律: 'Law',
  历史: 'History',
  考古学: 'Archaeology',
  博物学: 'Natural World',
  神秘学: 'Occult',
  电子学: 'Electronics',
  科学: 'Science',
  母语: 'Language (Own)',
  外语: 'Language (Other)',
};

// ---- 子技能与子技能中文名 → 英文专精度 ----
const CHILD_EN = {
  // 格斗
  斗殴: 'Brawl', 刀剑: 'Sword', 矛: 'Spear', 斧: 'Axe', 绞索: 'Lasso',
  链锯: 'Chainsaw', 链枷: 'Flail', 鞭: 'Whip', 盾: 'Shield', 长武器: 'Large Weapon',
  // 射击
  手枪: 'Handgun', '步/霰': 'Rifle/Shotgun', 冲锋枪: 'Submachine Gun', 弓弩: 'Bow',
  机枪: 'Machine Gun', 重武器: 'Heavy Weapons', 投石索: 'Sling', 能量武器: 'Energy Weapons',
  // 驾驶
  船: 'Boat', 马车: 'Cart', 飞行器: 'Aircraft', 伊卡洛斯: 'Icarus',
  // 生存
  沙漠: 'Desert', 森林: 'Forest', 荒岛: 'Island', 高山: 'Mountain', 海上: 'Sea', 城镇: 'Urban',
  // 科学
  数学: 'Mathematics', 物理: 'Physics', 化学: 'Chemistry', 药学: 'Pharmacy', 地质学: 'Geology',
  生物学: 'Biology', 动物学: 'Zoology', 植物学: 'Botany', 天文学: 'Astronomy', 密码学: 'Cryptography',
  气象学: 'Meteorology', 工程学: 'Engineering', 鉴证: 'Forensics', 制药: 'Pharmacy',
  // 技艺（Art and Craft）
  表演: 'Acting', 音乐: 'Music', 绘画: 'Painting', 艺术: 'Art', 摄影: 'Photography',
  写作: 'Writing', 书法: 'Calligraphy', 打字: 'Typewriter', 速记: 'Stenography', 伪造: 'Forgery',
  烹饪: 'Cooking', 裁缝: 'Tailor', 理发: 'Barber', 技术制图: 'Technical Drawing', 耕作: 'Farming',
  木工: 'Carpentry', 铁匠: 'Blacksmith', 焊接: 'Welding', 管道工: 'Plumber', 药剂: 'Pharmaceuticals',
  制革: 'Leatherworking', 演说: 'Oratory', 诗歌: 'Poetry', 占卜: 'Divination',
  // 语言 → 英文语言名
  汉语: 'Chinese', 英语: 'English', 日语: 'Japanese', 法语: 'French', 俄语: 'Russian',
  德语: 'German', 韩语: 'Korean', 粤语: 'Cantonese', 拉丁语: 'Latin', 荷兰语: 'Dutch',
  挪威语: 'Norwegian', 丹麦语: 'Danish', 印度语: 'Hindi', 西班牙语: 'Spanish', 葡萄牙语: 'Portuguese',
  阿拉伯语: 'Arabic',
};

// ---- 时代扩展技能（非标准 CoC7，尽力英文化，未收录回退中文原文） ----
const ERA_SKILL_EN = {
  公民: 'Citizen', 帝国知识: 'Imperial Lore', 察言观色: 'Read Person', 外邦知识: 'Foreign Lore',
  修造: 'Build/Repair', 读写: 'Read/Write', 战术: 'Tactics', 本国知识: 'Homeland Lore',
  宗教: 'Religion', 手语: 'Sign Language', 本地知识: 'Local Lore', 预言: 'Augury',
  灵视力: 'Second Sight', 滑雪: 'Ski', 造梦: 'Dreaming', 梦境学问: 'Dream Lore',
  计算机维护: 'Computer Maintenance', 系统操作: 'Systems Operation', 技术维修: 'Technical Repair',
  零重力: 'Zero-G', 拾荒: 'Scavenging',
};

// ---- 武器裸技能名（无父技能括号）→ 完整 CoC7 名 ----
const BARE_WEAPON = {
  手枪: 'Firearms (Handgun)', '步/霰': 'Firearms (Rifle/Shotgun)', 冲锋枪: 'Firearms (Submachine Gun)',
  弓弩: 'Firearms (Bow)', 机枪: 'Firearms (Machine Gun)', 重武器: 'Firearms (Heavy Weapons)',
  投石索: 'Firearms (Sling)', 能量武器: 'Firearms (Energy Weapons)',
  斗殴: 'Fighting (Brawl)', 刀剑: 'Fighting (Sword)', 矛: 'Fighting (Spear)', 斧: 'Fighting (Axe)',
  绞索: 'Fighting (Lasso)', 链锯: 'Fighting (Chainsaw)', 链枷: 'Fighting (Flail)', 鞭: 'Fighting (Whip)',
  盾: 'Fighting (Shield)', 长武器: 'Fighting (Large Weapon)',
};

// 把本项目技能键转为 Dhole 的 { name, subskill }（均为英文）
function dholeSkillName(key) {
  const { name, child } = splitSkillKey(key);
  if (!child) {
    return { name: SKILL_EN[name] || ERA_SKILL_EN[name] || name, subskill: '' };
  }
  // 自定义技能：子名即技能名，无专精
  if (name === '自定义') {
    return { name: child, subskill: '' };
  }
  const baseEn = SKILL_EN[name] || ERA_SKILL_EN[name] || name;
  const childEn = CHILD_EN[child] || child;
  return { name: baseEn, subskill: childEn };
}

// 武器技能名 → CoC7 显示名（用于导入器按 skillName 关联武器技能）
function weaponSkillName(skill) {
  if (!skill) return '';
  const { name, child } = splitSkillKey(skill);
  if (child) {
    const r = dholeSkillName(skill);
    return `${r.name} (${r.subskill})`;
  }
  if (BARE_WEAPON[skill]) return BARE_WEAPON[skill];
  return SKILL_EN[skill] || ERA_SKILL_EN[skill] || skill;
}

// 构建单个技能条目
function buildSkill(key) {
  const { name, subskill } = dholeSkillName(key);
  return {
    name,
    // 空串 = 无专精（基础技能）。注意不能是 'None'，导入器会跳过 'None'。
    subskill: subskill || '',
    value: String(skillValue(key) || 0),
    occupation: !!isOccupationSkill(key),
  };
}

function listText(arr) {
  return (arr || []).filter((r) => r && r.name).map((r) => r.name).join(', ');
}

// 主转换函数：返回完整 Dhole's House 角色对象
// portraitB64：可选的已转码 png 裸 base64（由 exportDhole 在导出时转换后传入）；
//   未传入时回退为「仅接受 png data URL」的旧行为，避免破坏同步调用方。
export function toDhole(portraitB64) {
  const d = derived.value;

  // 属性 + 衍生
  const characteristics = {
    STR: effectiveAttr('str') || 0,
    CON: effectiveAttr('con') || 0,
    SIZ: effectiveAttr('siz') || 0,
    DEX: effectiveAttr('dex') || 0,
    APP: effectiveAttr('app') || 0,
    INT: effectiveAttr('int') || 0,
    POW: effectiveAttr('pow') || 0,
    EDU: effectiveAttr('edu') || 0,
    Sanity: d.san,
    SanityMax: d.sanMax,
    HitPts: d.hp,
    HitPtsMax: d.hpMax,
    MagicPts: d.mp,
    MagicPtsMax: d.mpMax,
    Luck: effectiveAttr('luc'),
    Move: d.mov,
    DamageBonus: d.db != null ? String(d.db) : '0',
    Build: d.build,
  };

  // 个人资料
  let occupation = '';
  if (character.jobType === 'preset') occupation = character.jobName || '';
  else if (character.jobType === 'custom') occupation = character.customJobName || '';

  const personalDetails = {
    Name: character.name || '',
    Occupation: occupation,
    Age: (character.age != null && character.age !== '') ? String(character.age) : '',
    Gender: character.gender === '其他'
      ? (character.genderOther || 'Other')
      : (character.gender === '男' ? 'Male' : character.gender === '女' ? 'Female' : (character.gender || '')),
    Residence: character.residence || '',
    Birthplace: character.hometown || '',
    // 导入器仅接受裸 base64 的 png。portraitB64 已为转码后的 png 裸 base64；
    // 未传入时仅接受 png data URL，其余格式留空避免导入失败。
    Portrait: (typeof portraitB64 === 'string')
      ? portraitB64
      : (character.avatar && character.avatar.startsWith(PNG_PREFIX)
        ? character.avatar.slice(PNG_PREFIX.length)
        : ''),
  };

  // 背景故事（键名需匹配导入器的 getBackstory；伤痕键为 injurues 拼写）
  const bg = character.background || {};
  const backstory = {
    description: bg.desc || null,
    ideology: bg.belief || null,
    traits: bg.trait || null,
    injurues: bg.scar || null,
    people: bg.importantPerson || null,
    phobias: bg.mad || null,
    locations: bg.place || null,
    tomes: listText(character.mythosItems) || null,
    possessions: listText(character.items) || null,
    encounters: listText(character.contacts) || null,
  };

  // ---- 技能 ----
  const skillItems = [];
  const emitted = new Set();
  const collect = (key) => {
    if (!key || emitted.has(key)) return;
    const val = skillValue(key);
    const alloc = getAllocation(key);
    const hasPoint = (alloc.pro || 0) + (alloc.interest || 0) + (alloc.growth || 0) + (alloc.package || 0) > 0;
    if (val > 0 || hasPoint) {
      skillItems.push(buildSkill(key));
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
        else collect(name); // 未选子技能时，仅当该占位技能本身有值才导出
      } else {
        collect(name);
      }
    });
  });

  // 时代扩展技能
  getEraSkillList(character.era).forEach((sk) => {
    if (sk && sk.name && !emitted.has(sk.name)) collect(sk.name);
  });

  // ---- 物品 ----
  const possessionItems = [];
  const pushItems = (arr) => (arr || []).filter((r) => r && r.name)
    .forEach((r) => possessionItems.push({ description: r.name }));
  pushItems(character.items);
  pushItems(character.assetsRows);
  pushItems(character.mythosItems);

  // ---- 武器 ----
  const weapons = (character.weapons || [])
    .filter((w) => w && w.name)
    .map((w) => ({
      name: w.name,
      skillname: weaponSkillName(w.skill),
      damage: w.dam || '',
      ammo: (w.num != null && w.num !== '') ? String(w.num) : '0',
      malf: w.err || '0',
    }));

  return {
    Investigator: {
      PersonalDetails: personalDetails,
      Characteristics: characteristics,
      Backstory: backstory,
      Skills: { Skill: skillItems },
      Possessions: { item: possessionItems },
      Weapons: { weapon: weapons },
    },
  };
}

// 导出为格式化的 JSON 字符串（异步：必要时将头像转码为 png）
export async function exportDhole() {
  const portraitB64 = await convertAvatarToPng(character.avatar);
  return JSON.stringify(toDhole(portraitB64), null, 2);
}
