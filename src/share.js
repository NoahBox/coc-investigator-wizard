// ============================================================
// 角色卡分享链接：把当前调查员压缩进 URL hash（#share=...）
// 接收方打开链接后，应用检测到 hash 并提示导入该调查员。
// 纯前端实现，不依赖服务器；为控制链接体积，分享数据不包含头像。
// ============================================================
import LZString from 'lz-string';
import { character } from './store.js';

const SHARE_TAG = 'coc-share';
const SHARE_VERSION = 1;

// 构建分享载荷：深拷贝当前角色并移除头像
export function buildSharePayload() {
  const data = JSON.parse(JSON.stringify(character));
  delete data.avatar;
  return {
    v: SHARE_VERSION,
    t: SHARE_TAG,
    name: data.name || '未命名调查员',
    at: Date.now(),
    data,
  };
}

export function encodeShare(payload) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

// 解码分享串；格式非法 / 标签不符时返回 null
export function decodeShare(encoded) {
  if (!encoded) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const payload = JSON.parse(json);
    if (!payload || payload.t !== SHARE_TAG || !payload.data) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// 生成完整分享链接（基于当前页面地址；兼容 http/https 与 file:// 打开方式）
export function exportShareLink() {
  const encoded = encodeShare(buildSharePayload());
  const base = (typeof location !== 'undefined' && location.href) ? location.href.split('#')[0] : '';
  return base + '#share=' + encoded;
}

// 从 location.hash 解析分享载荷（App 启动时调用；无有效分享时返回 null）
export function parseShareFromHash(hash) {
  if (!hash) return null;
  const marker = '#share=';
  const idx = hash.indexOf(marker);
  if (idx === -1) return null;
  return decodeShare(hash.slice(idx + marker.length));
}
