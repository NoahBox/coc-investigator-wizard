// ============================================================
// i18n 本地化框架
// - t(key)：界面文案（zh/en/ja 三语字典，嵌套 key，逐级回退到中文）
// - dataName(name)：游戏数据名（技能/职业/武器/时代等）按当前语言显示，
//   内部主键始终是中文（保存/导入/FVTT 导出/分享链接依赖），字典未覆盖时回退原文
// - dataNameWithTag(name)：处理「基础名【扩展书】」格式的职业名
// - skillLabel(key)：技能键（含分组子技能）的本地化显示
// - setLocale / locale：语言状态，持久化到 localStorage
// ============================================================
import { reactive } from 'vue';
import uiZh from './locales/ui-zh.js';
import uiEn from './locales/ui-en.js';
import uiJa from './locales/ui-ja.js';
import { DATA_EN, DATA_JA } from './locales/data.js';
import { INTRO_EN, INTRO_JA } from './locales/intro.js';
import { STORY_EN, STORY_JA } from './locales/story.js';
import { FLAVOR_EN, FLAVOR_JA } from './locales/flavor.js';

const UI = { zh: uiZh, en: uiEn, ja: uiJa };
// 数据名：zh 回退即原文（内部主键），en/ja 为显示翻译
const DATA = { zh: null, en: DATA_EN, ja: DATA_JA };
// 技能提示 / 随机表：zh 回退即中文原文
const INTRO = { zh: null, en: INTRO_EN, ja: INTRO_JA };
const STORY = { zh: null, en: STORY_EN, ja: STORY_JA };
const FLAVOR = { zh: null, en: FLAVOR_EN, ja: FLAVOR_JA };
const LOCALE_KEY = 'coc-wizard-locale';
const SUPPORTED = ['zh', 'en', 'ja'];

const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : null);
export const locale = reactive({ code: SUPPORTED.includes(stored) ? stored : 'zh' });

export function setLocale(code) {
  if (!SUPPORTED.includes(code)) return;
  locale.code = code;
  try { localStorage.setItem(LOCALE_KEY, code); } catch (e) { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = code;
}

// 界面文案：当前语言 → 中文 → 原 key；支持 {param} 插值
export function t(key, params) {
  const chain = key.split('.');
  let v = UI[locale.code];
  for (const p of chain) v = v && v[p];
  if (v == null || v === '') {
    let z = UI.zh;
    for (const p of chain) z = z && z[p];
    v = (z != null && z !== '') ? z : key;
  }
  if (typeof v === 'string' && params) {
    return v.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? params[k] : m));
  }
  return v;
}

// 游戏数据名本地化（未翻译回退中文原文）
export function dataName(name) {
  if (!name || typeof name !== 'string') return name;
  const dict = DATA[locale.code];
  if (!dict) return name;
  return dict[name] || name;
}

// 带扩展书标记的名称：'作家【克苏鲁神话2010】' → 基础名 + 书签 分别本地化
// 书签优先按带括号键查（书签词典，如 【克苏鲁神话2010】），
// 查不到再按裸键查（如时代名 克苏鲁不败），避免回退原文时外层重复加括号
export function dataNameWithTag(name) {
  if (!name) return name;
  const m = name.match(/^(.*?)【([^】]+)】(.*)$/);
  if (!m) return dataName(name);
  const [, pre, tag, post] = m;
  const preL = dataName(pre);
  let tagL = dataName('【' + tag + '】');
  if (tagL === '【' + tag + '】') tagL = dataName(tag);
  return `${preL}【${tagL}】${post || ''}`;
}

// 技能键本地化显示：'格斗(斗殴)' → 父技能 + 子技能 分别翻译
export function skillLabel(key) {
  if (!key) return key;
  const idx = key.indexOf('(');
  if (idx === -1) return dataName(key);
  const name = key.slice(0, idx);
  const child = key.slice(idx + 1, -1);
  return `${dataName(name)}(${dataName(child)})`;
}

// 技能提示（intro）：按技能名取词，未翻译回退 null（调用方回退中文原文）
export function skillIntroByKey(name) {
  const dict = INTRO[locale.code];
  if (!dict) return null;
  return dict[name] || null;
}

// 随机表条目：按中文条目原文取词，未翻译回退原文（生成背景文本用）
export function storyText(zh) {
  if (!zh) return zh;
  const dict = STORY[locale.code];
  if (!dict) return zh;
  return dict[zh] || zh;
}

// 长风味文本（时代规则/掷骰表描述/派系/时代信用/经验包等）：未翻译回退中文
export function flavorText(zh) {
  if (!zh || typeof zh !== 'string') return zh;
  const dict = FLAVOR[locale.code];
  if (!dict) return zh;
  return dict[zh] || zh;
}
