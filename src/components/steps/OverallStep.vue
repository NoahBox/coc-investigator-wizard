<script setup>
import { ref, computed } from 'vue';
import {
  character, derived, getAllocation, skillValue, skillBaseOf, effectiveAttr, makeSkillKey, packageAdjust,
  creditRatingValue, livingStandard, cashInfo, currency, isOccupationSkill,
} from '../../store.js';
import { ATTR_KEYS, ATTR_LABELS, ATTR_EN } from '../../data/rules.js';
import { skillGroups, skillGroupOrder, getSkill } from '../../data/skills.js';
import { downloadJSON, copySt, downloadSt, exportImages, exportPDFPages, downloadText } from '../../export.js';
import { exportSaikoBase64 } from '../../saiko.js';

const frontRef = ref(null);
const backRef = ref(null);
const busy = ref('');

const jobDisplay = computed(() => character.jobType === 'preset' ? character.jobName : (character.customJobName || '自定义'));
const genderDisplay = computed(() => character.gender === '其他' ? (character.genderOther || '其他') : character.gender);
const attrSum = computed(() => ATTR_KEYS.reduce((s, k) => s + effectiveAttr(k), 0));

// 技能表数据（按分类，展开分组子技能）
const skillTable = computed(() => {
  const result = [];
  skillGroupOrder.forEach((groupName) => {
    const rows = [];
    (skillGroups[groupName] || []).forEach((name) => {
      if (name === '自定义') {
        // 自定义技能：显示用户填写的自定义技能名
        const customChildren = (character.groupedOrder['自定义'] || []).filter((c) => c);
        customChildren.forEach((child) => rows.push({ label: child, key: makeSkillKey('自定义', child) }));
        return;
      }
      const sk = getSkill(name);
      if (sk && sk.group && sk.group.skills.length) {
        const children = (character.groupedOrder[name] || []).filter((c) => c);
        if (children.length) {
          children.forEach((child) => rows.push({ label: `${name}:${child}`, key: makeSkillKey(name, child) }));
        } else {
          rows.push({ label: name, key: name });
        }
      } else {
        rows.push({ label: name.replace(/Ω/g, ''), key: name });
      }
    });
    if (rows.length) result.push({ groupName, rows });
  });
  return result;
});

const SKILL_SPLIT = 6;
const skillLeft = computed(() => skillTable.value.slice(0, SKILL_SPLIT));
const skillRight = computed(() => skillTable.value.slice(SKILL_SPLIT));

// 每行技能数据
function skillRow(key) {
  const a = getAllocation(key);
  const base = skillBaseOf(key);
  const total = skillValue(key);
  return {
    base,
    pro: a.pro || 0,
    interest: a.interest || 0,
    growth: (a.growth || 0) + packageAdjust(key),
    total,
    showTotal: total > 0 && (total !== base || !!a.pro),
  };
}

// 物品/资产/神话等纯文本
function joinNames(list) { return (list || []).filter(r => r.name).map(r => r.name).join('、'); }
const itemText = computed(() => joinNames(character.items));
const assetText = computed(() => joinNames(character.assetsRows));
const mythosItemText = computed(() => joinNames(character.mythosItems));
const spellText = computed(() => joinNames(character.spells));
const contactText = computed(() => joinNames(character.contacts));
const relationText = computed(() => (character.relations || []).filter(r => r.character || r.relation).map(r => `${r.character}${r.job ? `（${r.job}）` : ''}${r.relation ? `：${r.relation}` : ''}`).join('；'));
const scenarioText = computed(() => (character.scenarios || []).filter(r => r.name).map(r => `${r.name}${r.time ? `（${r.time}）` : ''}`).join('；'));

const bg = computed(() => character.background);

async function doImage() {
  busy.value = '正在生成图片…';
  try { await exportImages([frontRef.value, backRef.value], character.name || 'investigator'); } finally { busy.value = ''; }
}
async function doPDF() {
  busy.value = '正在生成 PDF…';
  try { await exportPDFPages([frontRef.value, backRef.value], character.name || 'investigator'); } finally { busy.value = ''; }
}
function doJSON() { downloadJSON(); }
function doSt() { copySt(); downloadSt(); }
async function doSaikoBase64() {
  const b64 = exportSaikoBase64();
  try { await navigator.clipboard.writeText(b64); } catch (e) { /* ignore */ }
  downloadText(`${character.name || 'investigator'}.saiko.txt`, b64);
  busy.value = '已复制 Saiko Base64 串';
  setTimeout(() => { if (busy.value === '已复制 Saiko Base64 串') busy.value = ''; }, 2000);
}
</script>

<template>
  <div class="step fade-in">
    <!-- 导出工具栏 -->
    <div class="card toolbar">
      <div class="card-body row wrap">
        <h3 class="mr">导出</h3>
        <button class="btn primary" @click="doImage"><font-awesome-icon icon="fa-solid fa-file-image" />导出图片</button>
        <button class="btn primary" @click="doPDF"><font-awesome-icon icon="fa-solid fa-file-pdf" />导出PDF</button>
        <button class="btn" @click="doJSON"><font-awesome-icon icon="fa-solid fa-file-lines" />导出 JSON</button>
        <button class="btn" @click="doSt"><font-awesome-icon icon="fa-solid fa-dice" />导出骰娘设定</button>
        <button class="btn" @click="doSaikoBase64"><font-awesome-icon icon="fa-solid fa-file-zipper" />导出Saiko Base64</button>
        <span v-if="busy" class="small accent pulse">{{ busy }}</span>
      </div>
    </div>

    <!-- ================= 正面 ================= -->
    <div class="paper" ref="frontRef">
      <div class="paper-content">
        <!-- 顶部：调查员 | 属性 | 幸运 -->
        <div class="section-row">
          <!-- 调查员 -->
          <section class="paper-section investigator">
            <div class="header"><h1 class="heading"><span class="title">调查员</span><span class="subtitle">Investigator</span></h1></div>
            <div class="body info-body">
              <div class="writable-row"><span class="lbl">姓名</span><span class="line grow">{{ character.name }}</span></div>
              <div class="writable-row"><span class="lbl">玩家</span><span class="line grow">{{ character.player }}</span></div>
              <div class="writable-row"><span class="lbl">时代</span><span class="line grow">{{ character.era === '1920s' ? '1920s' : '现代' }}</span></div>
              <div class="info-row">
                <div class="writable-row grow"><span class="lbl">职业</span><span class="line grow">{{ jobDisplay }}</span></div>
                <div class="writable-row grow"><span class="lbl">性别</span><span class="line grow">{{ genderDisplay }}</span></div>
              </div>
              <div class="info-row">
                <div class="writable-row grow"><span class="lbl">年龄</span><span class="line grow">{{ character.age }}</span></div>
                <div class="writable-row grow"><span class="lbl">国家</span><span class="line grow">{{ character.country }}</span></div>
              </div>
              <div class="info-row">
                <div class="writable-row grow"><span class="lbl">住地</span><span class="line grow">{{ character.residence }}</span></div>
                <div class="writable-row grow"><span class="lbl">故乡</span><span class="line grow">{{ character.hometown }}</span></div>
              </div>
            </div>
          </section>

          <!-- 属性 -->
          <section class="paper-section attributes">
            <div class="header"><h1 class="heading"><span class="title">属性</span><span class="subtitle">Characteristics</span></h1></div>
            <div class="body attr-body">
              <div class="attr-group">
                <div v-for="k in ['str','con','dex','app']" :key="k" class="writable-row">
                  <span class="lbl">{{ ATTR_LABELS[k] }}<span class="hint-text">{{ ATTR_EN[k] }}</span></span>
                  <span class="line grow center">{{ effectiveAttr(k) }}</span>
                </div>
              </div>
              <div class="divider"></div>
              <div class="attr-group">
                <div v-for="k in ['pow','siz','edu','int']" :key="k" class="writable-row">
                  <span class="lbl">{{ ATTR_LABELS[k] }}<span class="hint-text">{{ ATTR_EN[k] }}</span></span>
                  <span class="line grow center">{{ effectiveAttr(k) }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 幸运（上方带头像） -->
          <section class="paper-section luck">
            <div class="avatar-box">
              <img v-if="character.avatar" :src="character.avatar" alt="头像" />
              <span v-else class="avatar-empty">无头像</span>
            </div>
            <div class="header luck-header"><h1 class="heading"><span class="title">幸运</span><span class="subtitle">Luck</span></h1></div>
            <div class="body luck-body">
              <div class="writable-row"><span class="lbl">幸运</span><span class="line grow center big">{{ effectiveAttr('luc') }}</span></div>
            </div>
          </section>
        </div>

        <!-- 衍生属性 -->
        <div class="derive-sections">
          <section class="paper-section sanity">
            <div class="header"><h1 class="heading"><span class="title">理智值</span><span class="subtitle">Sanity</span></h1></div>
            <div class="body units">
              <div class="unit"><span class="u-label">当前 / 最大</span><span class="u-val">{{ derived.san }}<span class="u-slash">/</span>{{ derived.sanMax }}</span></div>
            </div>
          </section>
          <section class="paper-section hp">
            <div class="header"><h1 class="heading"><span class="title">生命值</span><span class="subtitle">HP</span></h1></div>
            <div class="body units">
              <div class="unit"><span class="u-label">当前 / 最大</span><span class="u-val">{{ derived.hp }}<span class="u-slash">/</span>{{ derived.hpMax }}</span></div>
            </div>
          </section>
          <section class="paper-section mp">
            <div class="header"><h1 class="heading"><span class="title">魔法值</span><span class="subtitle">MP</span></h1></div>
            <div class="body units">
              <div class="unit"><span class="u-label">当前 / 最大</span><span class="u-val">{{ derived.mp }}<span class="u-slash">/</span>{{ derived.mpMax }}</span></div>
            </div>
          </section>
          <section class="paper-section body-status">
            <div class="header"><h1 class="heading"><span class="title">身体状态</span></h1></div>
            <div class="body status-grid">
              <div class="status"><span class="cb"></span><span>重伤</span></div>
              <div class="status"><span class="cb"></span><span>昏迷</span></div>
              <div class="status"><span class="cb"></span><span>濒死</span></div>
              <div class="status"><span class="cb"></span><span>死亡</span></div>
            </div>
          </section>
          <section class="paper-section mental-status">
            <div class="header"><h1 class="heading"><span class="title">精神状态</span></h1></div>
            <div class="body status-grid">
              <div class="status"><span class="cb"></span><span>临时疯狂</span></div>
              <div class="status"><span class="cb"></span><span>永久疯狂</span></div>
              <div class="status"><span class="cb"></span><span>不定期疯狂</span></div>
            </div>
          </section>
        </div>

        <!-- 技能表 -->
        <section class="paper-section skill-section">
          <div class="header">
            <h1 class="heading"><span class="title">技能表</span><span class="subtitle">Skill</span></h1>
          </div>
          <div class="body skill-body">
            <div class="skill-col">
              <table class="skill-table">
                <thead><tr><th class="th-deep th-grp"></th><th class="th-deep th-name">技能</th><th class="th-light">基础%</th><th class="th-deep">职业%</th><th class="th-light">兴趣%</th><th class="th-deep">成长%</th><th class="th-light">成功率%</th></tr></thead>
                <tbody>
                  <template v-for="(sec, si) in skillLeft" :key="sec.groupName">
                    <tr v-for="(row, ri) in sec.rows" :key="row.key">
                      <td v-if="ri === 0" :rowspan="sec.rows.length" class="td-grp">{{ sec.groupName }}</td>
                      <td class="td-name" :class="{ odd: si % 2 === 0 }">{{ row.label }}<span v-if="isOccupationSkill(row.key)" class="occ-mark">※</span></td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).base || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).pro || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).interest || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).growth || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).showTotal ? skillRow(row.key).total : '' }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div class="skill-divider"></div>
            <div class="skill-col">
              <table class="skill-table">
                <thead><tr><th class="th-deep th-grp"></th><th class="th-deep th-name">技能</th><th class="th-light">基础%</th><th class="th-deep">职业%</th><th class="th-light">兴趣%</th><th class="th-deep">成长%</th><th class="th-light">成功率%</th></tr></thead>
                <tbody>
                  <template v-for="(sec, si) in skillRight" :key="sec.groupName">
                    <tr v-for="(row, ri) in sec.rows" :key="row.key">
                      <td v-if="ri === 0" :rowspan="sec.rows.length" class="td-grp">{{ sec.groupName }}</td>
                      <td class="td-name" :class="{ odd: si % 2 === 0 }">{{ row.label }}<span v-if="isOccupationSkill(row.key)" class="occ-mark">※</span></td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).base || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).pro || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).interest || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).growth || '' }}</td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ skillRow(row.key).showTotal ? skillRow(row.key).total : '' }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- 武器 | 战斗 -->
        <div class="section-row">
          <section class="paper-section weapon">
            <div class="header"><h1 class="heading"><span class="title">武器</span><span class="subtitle">Weapons</span></h1></div>
            <div class="body weapon-body">
              <div class="weapon-row wp-head">
                <span class="th-deep">武器名称</span><span class="th-light">使用技能</span><span class="th-deep">%</span><span class="th-light">伤害</span><span class="th-deep">射程</span><span class="th-light">贯穿</span><span class="th-deep">次数</span><span class="th-light">装弹量</span><span class="th-deep">故障</span>
              </div>
              <div v-for="i in 5" :key="i" class="weapon-row">
                <template v-if="character.weapons[i - 1]">
                  <span>{{ character.weapons[i - 1].name }}</span>
                  <span>{{ character.weapons[i - 1].skill }}</span>
                  <span></span>
                  <span>{{ character.weapons[i - 1].dam }}</span>
                  <span>{{ character.weapons[i - 1].range }}</span>
                  <span>{{ character.weapons[i - 1].tho ? '是' : '' }}</span>
                  <span>{{ character.weapons[i - 1].round }}</span>
                  <span>{{ character.weapons[i - 1].num }}</span>
                  <span>{{ character.weapons[i - 1].err }}</span>
                </template>
                <template v-else>
                  <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                </template>
              </div>
            </div>
          </section>
          <section class="paper-section battle">
            <div class="header"><h1 class="heading"><span class="title">战斗</span><span class="subtitle">Combat</span></h1></div>
            <div class="body battle-body">
              <div class="writable-row"><span class="lbl">伤害加值<span class="hint-text">DB</span></span><span class="line grow center">{{ derived.db }}</span></div>
              <div class="writable-row"><span class="lbl">体格</span><span class="line grow center">{{ derived.build }}</span></div>
              <div class="writable-row"><span class="lbl">护甲</span><span class="line grow center"></span></div>
              <div class="writable-row"><span class="lbl">移动力</span><span class="line grow center">{{ derived.mov }}</span></div>
            </div>
          </section>
        </div>

        <div class="copyright">©「克苏鲁的呼唤」7版人物卡</div>
      </div>
    </div>

    <!-- ================= 反面 ================= -->
    <div class="paper" ref="backRef">
      <div class="paper-content">
        <!-- 背景故事 -->
        <section class="paper-section story">
          <div class="header"><h1 class="heading"><span class="title">背景故事</span><span class="subtitle">Story</span></h1></div>
          <div class="body story-body">
            <div class="story-col col-2">
              <div v-for="f in [['app','形象描述'],['belief','思想与信念'],['importantPerson','重要之人'],['place','意义非凡之地'],['item','宝贵之物'],['trait','特质'],['scar','伤口与疤痕'],['mad','精神症状']]" :key="f[0]" class="area">
                <span class="area-label">{{ f[1] }}</span>
                <div class="area-text">{{ bg[f[0]] }}</div>
              </div>
            </div>
            <div class="story-col col-3">
              <div class="area tall">
                <span class="area-label">个人介绍</span>
                <div class="area-text">{{ bg.desc }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 物品 | 资产 | 神话 -->
        <div class="section-row">
          <section class="paper-section item">
            <div class="header"><h1 class="heading"><span class="title">物品与装备</span><span class="subtitle">Possessions</span></h1></div>
            <div class="body area pad"><div class="area-text">{{ itemText }}</div></div>
          </section>
          <section class="paper-section assets">
            <div class="header"><h1 class="heading"><span class="title">资产</span><span class="subtitle">Cash & Assets</span></h1></div>
            <div class="body pad">
              <div class="writable-row"><span class="lbl">信用评级</span><span class="line grow center">{{ creditRatingValue }}</span></div>
              <div class="writable-row"><span class="lbl">现金</span><span class="line grow center">{{ currency.symbol }}{{ cashInfo.amount }}</span></div>
              <div class="writable-row"><span class="lbl">消费水平</span><span class="line grow center">{{ livingStandard.name }}</span></div>
              <div class="area"><span class="area-label">资产</span><div class="area-text">{{ assetText }}</div></div>
            </div>
          </section>
          <section class="paper-section mythos">
            <div class="header"><h1 class="heading"><span class="title">克苏鲁神话</span><span class="subtitle">Cthulhu Mythos</span></h1></div>
            <div class="body pad">
              <div class="area"><span class="area-label">魔法物品与典籍</span><div class="area-text">{{ mythosItemText }}</div></div>
              <div class="area"><span class="area-label">法术</span><div class="area-text">{{ spellText }}</div></div>
              <div class="area"><span class="area-label">第三类接触</span><div class="area-text">{{ contactText }}</div></div>
            </div>
          </section>
        </div>

        <!-- 人物关系 | 经历 -->
        <div class="section-row">
          <section class="paper-section friend">
            <div class="header"><h1 class="heading"><span class="title">人物关系</span><span class="subtitle">Relationships</span></h1></div>
            <div class="body area pad tall"><div class="area-text">{{ relationText }}</div></div>
          </section>
          <section class="paper-section experience">
            <div class="header"><h1 class="heading"><span class="title">经历过的模组</span><span class="subtitle">Scenarios</span></h1></div>
            <div class="body area pad tall"><div class="area-text">{{ scenarioText }}</div></div>
          </section>
        </div>

        <div class="copyright">©2010-2026 Arclight, Inc. ©2020 Chaosium Inc.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mr { margin-right: 8px; }
.toolbar { max-width: 1000px; margin: 0 auto 20px; }

/* ============ 纸张 ============ */
.paper {
  --p-black: #2e2e2e;
  --p-white: #fff;
  --p-line: #b2b2b2;
  font-size: 15px;
  width: 65.625em; /* 210mm / 3.2mm */
  height: 92.8125em; /* 297mm / 3.2mm */
  margin: 0 auto 24px;
  background: var(--p-white);
  color: var(--p-black);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Microsoft Yahei", "Segoe UI", sans-serif;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}
.paper-content {
  box-sizing: border-box;
  padding: 1.5em 1.8em;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6em;
  align-items: stretch;
}
.section-row { display: flex; gap: 0.8em; align-items: stretch; }
.grow { flex: 1 1 auto; }
.col-2 { flex: 2 0 0; }
.col-3 { flex: 3 0 0; }
.center { text-align: center; }

/* 区块 */
.paper-section { display: flex; flex-direction: column; outline: 1px solid var(--p-black); }
.paper-section .header {
  display: flex; justify-content: center; align-items: center;
  color: #fff; background-color: var(--p-black); flex: none;
}
.paper-section .heading { padding: 0.4em 0.8em; font-size: 1em; line-height: 1; display: flex; gap: 0.4em; align-items: baseline; }
.paper-section .title { font-size: 1.15em; }
.paper-section .subtitle { font-size: 0.9em; opacity: 0.85; }
.paper-section .body { flex: 1; display: flex; flex-direction: column; }

/* 填写行（标签 + 下划线） */
.writable-row { display: flex; align-items: flex-end; gap: 0.4em; line-height: 1; padding: 0.15em 0; }
.writable-row .lbl { display: flex; flex-direction: column; align-items: center; flex: none; line-height: 1; }
.writable-row .hint-text { font-size: 0.6em; color: #777; transform: scale(0.9); }
.writable-row .line {
  flex: 1 1 auto; border-bottom: 1px solid var(--p-line); padding: 0.2em;
  min-height: 1.2em; line-height: 1.2em; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; font-size: 1em;
}
.writable-row .line.big { font-size: 1.6em; text-align: center; }

/* 调查员 */
.investigator { flex: 1.6 1 0; }
.info-body { padding: 0.4em 0.6em 0.6em; gap: 0.2em; }
.info-row { display: flex; gap: 1em; }
.info-row .writable-row { flex: 1; }

/* 属性 */
.attributes { flex: 1.4 1 0; }
.paper-section .attr-body { flex-direction: row; padding: 0.4em 0.6em 0.6em; gap: 0.8em; }
.attr-group { flex: 1; display: flex; flex-direction: column; gap: 0.2em; }
.attr-body .divider { border-right: 1px solid var(--p-black); }
.attr-sum { text-align: center; opacity: 0.8; margin-top: 0.2em; }
.attributes .writable-row .lbl { width: 3.2em; align-items: flex-start; }

/* 幸运（含头像） */
.luck { flex: 0.8 1 0; }
.avatar-box {
  margin: 0.4em 0.4em 0.7em; padding-bottom: 0;
  border: 1px solid var(--p-black); background: var(--p-white);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; aspect-ratio: 1 / 1;
}
.avatar-box img { width: 100%; height: 100%; object-fit: cover; }
.avatar-box .avatar-empty { color: #bbb; font-size: 0.8em; }
.luck-body { padding: 0.4em 0.6em 0.6em; justify-content: center; }

/* 衍生属性 */
.derive-sections { display: flex; gap: 0.8em; align-items: stretch; }
.derive-sections .paper-section { flex: 1 1 0; }
.paper-section .units { flex-direction: row; align-items: center; justify-content: space-around; padding: 0.4em 0.6em; }
.unit { display: flex; flex-direction: column; align-items: center; gap: 0.2em; line-height: 1; }
.u-label { font-size: 0.8em; color: #555; }
.u-val { font-size: 1.3em; font-weight: bold; }
.u-slash { color: #999; margin: 0 0.15em; }
.u-divider { border-right: 1px solid #c2c2c2; align-self: stretch; }
.paper-section .status-grid { display: grid; grid-template-columns: 1fr 1fr; }
.status { display: flex; gap: 0.4em; align-items: center; padding: 0.35em; line-height: 1; }
.status .cb { width: 1em; height: 1em; border: 1px solid var(--p-black); background: var(--p-white); flex: none; }
.mental-status .status-grid { grid-template-rows: 1fr 1fr; grid-auto-flow: column; }

/* 技能表 */
.skill-section { flex: 1; }
.paper-section .skill-body { flex-direction: row; flex: 1; }
.skill-col { flex: 1; min-width: 0; }
.skill-divider { border-left: 1px solid var(--p-black); }
.skill-table { width: 100%; border-collapse: collapse; color: var(--p-black); }
.skill-table th, .skill-table td { line-height: 1.62em; text-align: center; padding: 0 0.2em; }
.th-deep { background-color: hsl(0, 0%, 79%); }
.th-light { background-color: hsl(0, 0%, 86%); }
.th-grp { width: 1.4em; }
.th-name { width: 8em; text-align: left; }
.skill-table .td-grp { border: 1px solid var(--p-black); border-left: none; border-bottom: none; font-size: 0.85em; }
.skill-table .td-name { text-align: left; }
.skill-table .td-num { background-color: hsl(0, 0%, 93%); }
.skill-table .td-num.odd { background-color: #fff; }
.skill-table tbody tr:nth-child(odd) .td-name { background: #f3f3f3; }
.occ-mark { color: var(--p-black); font-weight: bold; margin-left: 0.2em; }

/* 武器 */
.weapon { flex: 4 1 0; }
.weapon-body { color: var(--p-black); }
.weapon-row {
  display: grid; grid-template-columns: 13fr 6fr 2fr 8fr 3.8fr 3.8fr 3.8fr 3.8fr 3.8fr;
  text-align: center; line-height: 1.7em;
}
.weapon-row > span { border-right: 1px solid #ddd; padding: 0 0.2em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9em; }
.weapon-row > span:last-child { border-right: none; }
.wp-head span { font-size: 0.82em; padding: 0.35em 0; }
.wp-head .th-deep { background-color: hsl(0, 0%, 79%); }
.wp-head .th-light { background-color: hsl(0, 0%, 86%); }

/* 战斗 */
.battle { flex: 0.7 1 0; }
.battle-body { padding: 0.6em 0.6em 1em 0.2em; justify-content: space-between; gap: 0.3em; }
.battle .writable-row .lbl { width: 4.4em; align-items: flex-start; }

.copyright { margin-top: auto; align-self: flex-end; color: #4b4e53; font-size: 0.72em; text-align: right; transform: scale(0.9); transform-origin: right bottom; flex: none; }

/* 反面 */
.paper-section .story-body { flex-direction: row; padding: 0.4em 0.6em 0.6em; gap: 1em; flex: 1; }
.story-col { display: flex; flex-direction: column; gap: 0.3em; }
.area { position: relative; }
.area-label { font-weight: 900; color: var(--p-black); display: block; line-height: 1.66em; }
.area-text { white-space: pre-wrap; word-break: break-all; line-height: 1.66em; min-height: 1.66em; color: #333; }
.area.tall { flex: 1; }
.pad { padding: 0.4em 0.6em 0.6em; }
.item, .assets, .mythos { flex: 1 1 0; }
.friend { flex: 2 1 0; }
.experience { flex: 1 1 0; }

@media (max-width: 760px) {
  .paper { width: 100%; height: auto; font-size: 11px; }
  .section-row, .derive-sections { flex-wrap: wrap; }
}
</style>
