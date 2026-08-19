// ============================================================
// 导出工具：JSON / 骰娘 .st 字符串 / 图片 / PDF
// ============================================================
import { character, skillValue, getAllocation, effectiveAttributes } from './store.js';
import { skills, skillNameAlias, getEraSkillList } from './data/skills.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ---- JSON ----
export function exportJSON() {
  return JSON.stringify(JSON.parse(JSON.stringify(character)), null, 2);
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJSON() {
  downloadText(`${character.name || 'investigator'}.json`, exportJSON(), 'application/json');
}

// ---- 花名册备份（lz-string 压缩后的 JSON） ----
export function downloadRosterBackup(text) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  downloadText(`调查员备份_${stamp}.coc.json`, text, 'application/json');
}

// ---- 骰娘 .st 字符串 ----
function displayName(name) {
  return name.replace(/Ω/g, '');
}

export function buildStString() {
  const a = effectiveAttributes.value;
  const str = (k) => a[k] != null ? a[k] : 0;
  const parts = [`.st`];

  // 属性
  const attrSeg = [
    ['str', '力量', 'str'], ['dex', '敏捷', 'dex'], ['con', '体质', 'con'], ['app', '外貌', 'app'],
    ['int', '智力', 'int'], ['pow', '意志', 'pow'], ['siz', '体型', 'siz'], ['edu', '教育', 'edu'],
    ['luc', '幸运', 'luck'],
  ];
  attrSeg.forEach(([k, cn, en]) => {
    const v = str(k);
    parts.push(`${cn}${v} ${en}${v} `);
    if (k === 'int') parts.push(`灵感${v} `);
    if (k === 'luc') parts.push(`运气${v} `);
  });

  // 衍生
  const hp = character.derivedOverrides?.hp ?? Math.floor(((a.con || 0) + (a.siz || 0)) / 10);
  const mp = character.derivedOverrides?.mp ?? Math.floor((a.pow || 0) / 5);
  const san = character.derivedOverrides?.san ?? (a.pow || 0);
  parts.push(`hp${hp} 体力${hp} mp${mp} 魔法${mp} san${san} 理智${san} 理智值${san} san值${san}`);

  // 技能
  const emitted = new Set();
  const emit = (name, val) => {
    const dn = displayName(name);
    parts.push(`${dn}${val}`);
    const aliases = skillNameAlias[name];
    if (aliases) aliases.forEach(al => parts.push(`${al}${val}`));
    emitted.add(name);
  };

  skills.forEach((sk) => {
    const name = sk.name;
    if (!name) return; // 自定义技能占位
    if (sk.group && (sk.group.skills.length || name === '自定义')) {
      // 分组技能：输出每个子技能
      const children = character.groupedOrder[name] || [];
      children.forEach((childName) => {
        const key = `${name}(${childName})`;
        const val = skillValue(key);
        const alloc = getAllocation(key);
        const hasPoint = (alloc.pro || 0) + (alloc.interest || 0) + (alloc.growth || 0) + (alloc.package || 0) > 0;
        if (childName && (hasPoint || sk.group.show.includes(childName) || name === '母语')) {
          emit(childName, val);
          if (name === '母语') emit('母语', val);
        }
      });
    } else {
      // 所有标准技能：无论是否分配点数，均输出当前值（含初始值，如 信用评级0 / 克苏鲁神话0）
      emit(name, skillValue(name));
    }
  });

  // 时代技能（当前时代的扩展技能，如 战术/造梦/拾荒 等）：
  // 无论是否分配点数，均输出当前值（含初始值，如 预言0 / 梦境学问0）
  getEraSkillList(character.era).forEach((sk) => {
    const name = sk.name;
    if (!name || emitted.has(name)) return;
    emit(name, skillValue(name));
  });

  return parts.join(' ');
}

export function downloadSt() {
  const st = buildStString();
  // 复制到剪贴板 + 下载
  if (navigator.clipboard) navigator.clipboard.writeText(st).catch(() => {});
  downloadText(`${character.name || 'investigator'}.st.txt`, st);
}

export function copySt() {
  const st = buildStString();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(st).then(() => {
      return true;
    }).catch(() => {});
  }
  return st;
}

// ---- 图片 / PDF ----
export async function exportImage(el, name) {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#161d18',
  });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name || 'investigator'}.png`;
  a.click();
}

export async function exportPDF(el, name) {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(`${name || 'investigator'}.pdf`);
}

// 导出多张纸：每张纸一页 PDF（正反面）
export async function exportPDFPages(elements, name) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < elements.length; i++) {
    if (!elements[i]) continue;
    const canvas = await html2canvas(elements[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    // 纸张比例即 A4，直接铺满一页
    const ratio = pageW / canvas.width;
    const imgH = canvas.height * ratio;
    if (imgH <= pageH + 1) {
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
    } else {
      // 兜底：若超出，按高度适配
      const r2 = pageH / canvas.height;
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * r2, pageH);
    }
    if (i < elements.length - 1) pdf.addPage();
  }
  pdf.save(`${name || 'investigator'}.pdf`);
}

// 导出多张图片（每张纸一张 PNG）
export async function exportImages(elements, name) {
  for (let i = 0; i < elements.length; i++) {
    if (!elements[i]) continue;
    const canvas = await html2canvas(elements[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const url = canvas.toDataURL('image/png');
    const suffix = elements.length > 1 ? `-${i + 1}` : '';
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'investigator'}${suffix}.png`;
    a.click();
    await new Promise((r) => setTimeout(r, 150));
  }
}
