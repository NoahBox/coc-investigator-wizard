<script setup>
import { ref, computed } from 'vue';
import {
  character, derived, getAllocation, skillValue, skillBaseOf, effectiveAttr, makeSkillKey, packageAdjust,
  creditRatingValue, livingStandard, cashInfo, currency, isOccupationSkill, eraInfo,
} from '../../store.js';
import { ATTR_KEYS, ATTR_LABELS, ATTR_EN } from '../../data/rules.js';
import { skillGroups, skillGroupOrder, getSkill, getEraSkillGroups, getEraGroupOrder } from '../../data/skills.js';
import { getEra } from '../../data/eras.js';
import { downloadJSON, copySt, downloadSt, exportImages, exportPDFPages, downloadText } from '../../export.js';
import { exportSaikoBase64 } from '../../saiko.js';
import { exportFVTT } from '../../fvtt.js';
import { t, dataName, dataNameWithTag, skillLabel, flavorText, locale } from '../../i18n.js';
import { eraDiceTables } from '../../data/eras.js';
import { exportShareLink } from '../../share.js';

const frontRef = ref(null);
const backRef = ref(null);
const busy = ref('');

const jobDisplay = computed(() => character.jobType === 'preset' ? (character.jobName ? dataNameWithTag(character.jobName) : '') : (character.customJobName || t('overall.customJob')));
const genderDisplay = computed(() => character.gender === '其他' ? (character.genderOther || t('overall.genderOther')) : dataName(character.gender));
const countryDisplay = computed(() => character.country === '其他' ? (character.countryOther || t('overall.countryOther')) : dataName(character.country));
const attrSum = computed(() => ATTR_KEYS.reduce((s, k) => s + effectiveAttr(k), 0));

// 时代显示：扩展时代显示全称（如 克苏鲁不败），否则 1920s / 现代
const eraLabel = computed(() => {
  if (character.era === '1920s') return '1920s';
  if (character.era === 'modern') return dataName('现代');
  const e = getEra(character.era);
  return e ? dataName(e.label) : character.era;
});

// 防具 / 盾牌（时代特性步骤选择）
const armorText = computed(() => [character.eraArmor, character.eraShield].filter(Boolean).join(' / '));

// 时代信息（派系 / 随机表结果）：只读展示于反面背景故事区（本地化重建）
const eraInfoText = computed(() => {
  const parts = [];
  const table = eraDiceTables[character.era];
  const roll = character.eraEffects?.[character.era];
  if (table && roll && roll.dice) {
    const entry = table.entries[roll.dice - 1];
    if (entry) parts.push(`${dataName(table.title)}（1D10=${roll.dice}）：${dataName(entry.text)}（${flavorText(entry.note)}）`);
  }
  if (character.eraFaction) parts.push(`${t('bg.eraInfo')}：${dataName(character.eraFaction)}`);
  return parts.join('\n');
});

// 技能表数据（按分类，展开分组子技能；含时代技能组）
const skillTable = computed(() => {
  const result = [];
  const groups = getEraSkillGroups(character.era);
  const order = getEraGroupOrder(character.era);
  order.forEach((groupName) => {
    const rows = [];
    (groups[groupName] || []).forEach((name) => {
      if (name === '自定义') {
        // 自定义技能：显示用户填写的自定义技能名
        const customChildren = (character.groupedOrder['自定义'] || []).filter((c) => c);
        customChildren.forEach((child) => rows.push({ label: dataName(child), key: makeSkillKey('自定义', child) }));
        return;
      }
      const sk = getSkill(name);
      if (sk && sk.group && sk.group.skills.length) {
        const children = (character.groupedOrder[name] || []).filter((c) => c);
        if (children.length) {
          children.forEach((child) => rows.push({ label: skillLabel(makeSkillKey(name, child)), key: makeSkillKey(name, child) }));
        } else {
          rows.push({ label: dataName(name), key: name });
        }
      } else {
        rows.push({ label: dataName(name.replace(/Ω/g, '')), key: name });
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
  // 信用评级 / 克苏鲁神话：基础值默认为 0，应显示 0 而非空白
  const zeroShow = key === '信用评级' || key === '克苏鲁神话';
  return {
    base,
    pro: a.pro || 0,
    interest: a.interest || 0,
    growth: (a.growth || 0) + packageAdjust(key),
    total,
    zeroShow,
    showTotal: zeroShow || (total > 0 && (total !== base || !!a.pro)),
  };
}

// 基础值显示：信用评级/克苏鲁神话显示 0，其余为 0 时留空
function baseDisplay(key) {
  const r = skillRow(key);
  if (r.zeroShow) return r.base;
  return r.base || '';
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
  busy.value = t('overall.busyImage');
  try { await exportImages([frontRef.value, backRef.value], character.name || 'investigator'); } finally { busy.value = ''; }
}
async function doPDF() {
  busy.value = t('overall.busyPdf');
  try { await exportPDFPages([frontRef.value, backRef.value], character.name || 'investigator'); } finally { busy.value = ''; }
}
function doJSON() { downloadJSON(); }
function doSt() { copySt(); downloadSt(); }
async function doSaikoBase64() {
  const b64 = exportSaikoBase64();
  try { await navigator.clipboard.writeText(b64); } catch (e) { /* ignore */ }
  downloadText(`${character.name || 'investigator'}.saiko.txt`, b64);
  busy.value = t('overall.copiedSaiko');
  setTimeout(() => { if (busy.value === t('overall.copiedSaiko')) busy.value = ''; }, 2000);
}
async function doFVTT() {
  const json = exportFVTT();
  try { await navigator.clipboard.writeText(json); } catch (e) { /* ignore */ }
  downloadText(`${character.name || 'investigator'}.coc7.json`, json);
  busy.value = t('overall.copiedFvtt');
  setTimeout(() => { if (busy.value === t('overall.copiedFvtt')) busy.value = ''; }, 2000);
}
async function doShare() {
  const link = exportShareLink();
  try { await navigator.clipboard.writeText(link); } catch (e) { /* ignore */ }
  busy.value = t('overall.copiedShare');
  setTimeout(() => { if (busy.value === t('overall.copiedShare')) busy.value = ''; }, 2500);
}
</script>

<template>
  <div class="step fade-in">
    <!-- 导出工具栏 -->
    <div class="card toolbar">
      <div class="card-body row wrap">
        <h3 class="mr">{{ $t('overall.exportAs') }}</h3>
        <button class="btn primary" @click="doImage"><font-awesome-icon icon="fa-solid fa-file-image" />{{ $t('overall.image') }}</button>
        <button class="btn primary" @click="doPDF"><font-awesome-icon icon="fa-solid fa-file-pdf" />{{ $t('overall.pdf') }}</button>
        <button class="btn" @click="doJSON"><font-awesome-icon icon="fa-solid fa-file-lines" />{{ $t('overall.json') }}</button>
        <button class="btn" @click="doSt"><font-awesome-icon icon="fa-solid fa-dice" />{{ $t('overall.st') }}</button>
        <button class="btn" @click="doSaikoBase64"><font-awesome-icon icon="fa-solid fa-file-zipper" />{{ $t('overall.saiko') }}</button>
        <button class="btn" @click="doFVTT"><font-awesome-icon icon="fa-solid fa-dragon" />{{ $t('overall.fvtt') }}</button>
        <button class="btn" @click="doShare" :title="$t('overall.shareTitle')"><font-awesome-icon icon="fa-solid fa-share-nodes" />{{ $t('overall.share') }}</button>
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
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.inv') }}</span><span class="subtitle">{{ $t('overall.invSub') }}</span></h1></div>
            <div class="body info-body">
              <div class="writable-row"><span class="lbl">{{ $t('overall.name') }}</span><span class="line grow">{{ character.name }}</span></div>
              <div class="writable-row"><span class="lbl">{{ $t('overall.player') }}</span><span class="line grow">{{ character.player }}</span></div>
              <div class="writable-row"><span class="lbl">{{ $t('overall.era') }}</span><span class="line grow">{{ eraLabel }}</span></div>
              <div class="writable-row" v-if="character.eraFaction"><span class="lbl">{{ $t('overall.faction') }}</span><span class="line grow">{{ $dn(character.eraFaction) }}</span></div>
              <div class="info-row">
                <div class="writable-row grow"><span class="lbl">{{ $t('overall.job') }}</span><span class="line grow">{{ jobDisplay }}</span></div>
                <div class="writable-row grow"><span class="lbl">{{ $t('overall.gender') }}</span><span class="line grow">{{ genderDisplay }}</span></div>
              </div>
              <div class="info-row">
                <div class="writable-row grow"><span class="lbl">{{ $t('overall.age') }}</span><span class="line grow">{{ character.age }}</span></div>
                <div class="writable-row grow"><span class="lbl">{{ $t('overall.country') }}</span><span class="line grow">{{ countryDisplay }}</span></div>
              </div>
              <div class="info-row">
                <div class="writable-row grow"><span class="lbl">{{ $t('overall.residence') }}</span><span class="line grow">{{ character.residence }}</span></div>
                <div class="writable-row grow"><span class="lbl">{{ $t('overall.hometown') }}</span><span class="line grow">{{ character.hometown }}</span></div>
              </div>
            </div>
          </section>

          <!-- 属性 -->
          <section class="paper-section attributes">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.attrs') }}</span><span class="subtitle">{{ $t('overall.attrsSub') }}</span></h1></div>
            <div class="body attr-body">
              <div class="attr-group">
                <div v-for="k in ['str','con','dex','app']" :key="k" class="writable-row">
                  <span class="lbl">{{ $dn(ATTR_LABELS[k]) }}<span class="hint-text">{{ ATTR_EN[k] }}</span></span>
                  <span class="line grow center">{{ effectiveAttr(k) }}</span>
                </div>
              </div>
              <div class="divider"></div>
              <div class="attr-group">
                <div v-for="k in ['pow','siz','edu','int']" :key="k" class="writable-row">
                  <span class="lbl">{{ $dn(ATTR_LABELS[k]) }}<span class="hint-text">{{ ATTR_EN[k] }}</span></span>
                  <span class="line grow center">{{ effectiveAttr(k) }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 幸运（上方带头像） -->
          <section class="paper-section luck">
            <div class="avatar-box">
              <img v-if="character.avatar" :src="character.avatar" :alt="$t('basic.avatarAlt')" />
              <span v-else class="avatar-empty">{{ $t('overall.noAvatar') }}</span>
            </div>
            <div class="header luck-header"><h1 class="heading"><span class="title">{{ $t('overall.luck') }}</span><span class="subtitle">{{ $t('overall.luckSub') }}</span></h1></div>
            <div class="body luck-body">
              <div class="writable-row"><span class="lbl">{{ $t('overall.luck') }}</span><span class="line grow center">{{ effectiveAttr('luc') }}</span></div>
            </div>
          </section>
        </div>

        <!-- 衍生属性 -->
        <div class="derive-sections">
          <section class="paper-section sanity">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.sanity') }}</span><span class="subtitle">{{ $t('overall.sanitySub') }}</span></h1></div>
            <div class="body units">
              <div class="unit"><span class="u-label">{{ $t('overall.curMax') }}</span><span class="u-val">{{ derived.san }}<span class="u-slash">/</span>{{ derived.sanMax }}</span></div>
            </div>
          </section>
          <section class="paper-section hp">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.hp') }}</span><span class="subtitle">{{ $t('overall.hpSub') }}</span></h1></div>
            <div class="body units">
              <div class="unit"><span class="u-label">{{ $t('overall.curMax') }}</span><span class="u-val">{{ derived.hp }}<span class="u-slash">/</span>{{ derived.hpMax }}</span></div>
            </div>
          </section>
          <section class="paper-section mp">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.mp') }}</span><span class="subtitle">{{ $t('overall.mpSub') }}</span></h1></div>
            <div class="body units">
              <div class="unit"><span class="u-label">{{ $t('overall.curMax') }}</span><span class="u-val">{{ derived.mp }}<span class="u-slash">/</span>{{ derived.mpMax }}</span></div>
            </div>
          </section>
          <section class="paper-section body-status">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.body') }}</span></h1></div>
            <div class="body status-grid">
              <div class="status"><span class="cb"></span><span>{{ $t('overall.severe') }}</span></div>
              <div class="status"><span class="cb"></span><span>{{ $t('overall.unconscious') }}</span></div>
              <div class="status"><span class="cb"></span><span>{{ $t('overall.dying') }}</span></div>
              <div class="status"><span class="cb"></span><span>{{ $t('overall.dead') }}</span></div>
            </div>
          </section>
          <section class="paper-section mental-status">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.mental') }}</span></h1></div>
            <div class="body status-grid">
              <div class="status"><span class="cb"></span><span>{{ $t('overall.tempMad') }}</span></div>
              <div class="status"><span class="cb"></span><span>{{ $t('overall.permMad') }}</span></div>
              <div class="status"><span class="cb"></span><span>{{ $t('overall.indefMad') }}</span></div>
            </div>
          </section>
        </div>

        <!-- 技能表 -->
        <section class="paper-section skill-section">
          <div class="header">
            <h1 class="heading"><span class="title">{{ $t('overall.skillTitle') }}</span><span class="subtitle">{{ $t('overall.skillSub') }}</span></h1>
          </div>
          <div class="body skill-body">
            <div class="skill-col">
              <table class="skill-table">
                <thead><tr><th class="th-deep th-grp"></th><th class="th-deep th-name">{{ $t('overall.skillName') }}</th><th class="th-light">{{ $t('overall.base') }}</th><th class="th-deep">{{ $t('overall.pro') }}</th><th class="th-light">{{ $t('overall.interest') }}</th><th class="th-deep">{{ $t('overall.growth') }}</th><th class="th-light">{{ $t('overall.rate') }}</th></tr></thead>
                <tbody>
                  <template v-for="(sec, si) in skillLeft" :key="sec.groupName">
                    <tr v-for="(row, ri) in sec.rows" :key="row.key">
                      <td v-if="ri === 0" :rowspan="sec.rows.length" class="td-grp" :class="{ vertical: locale.code === 'en' }">{{ $dn(sec.groupName) }}</td>
                      <td class="td-name" :class="{ odd: si % 2 === 0 }">{{ row.label }}<span v-if="isOccupationSkill(row.key)" class="occ-mark">※</span></td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ baseDisplay(row.key) }}</td>
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
                <thead><tr><th class="th-deep th-grp"></th><th class="th-deep th-name">{{ $t('overall.skillName') }}</th><th class="th-light">{{ $t('overall.base') }}</th><th class="th-deep">{{ $t('overall.pro') }}</th><th class="th-light">{{ $t('overall.interest') }}</th><th class="th-deep">{{ $t('overall.growth') }}</th><th class="th-light">{{ $t('overall.rate') }}</th></tr></thead>
                <tbody>
                  <template v-for="(sec, si) in skillRight" :key="sec.groupName">
                    <tr v-for="(row, ri) in sec.rows" :key="row.key">
                      <td v-if="ri === 0" :rowspan="sec.rows.length" class="td-grp" :class="{ vertical: locale.code === 'en' }">{{ $dn(sec.groupName) }}</td>
                      <td class="td-name" :class="{ odd: si % 2 === 0 }">{{ row.label }}<span v-if="isOccupationSkill(row.key)" class="occ-mark">※</span></td>
                      <td class="td-num" :class="{ odd: si % 2 === 0 }">{{ baseDisplay(row.key) }}</td>
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
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.weapons') }}</span><span class="subtitle">{{ $t('overall.weaponsSub') }}</span></h1></div>
            <div class="body weapon-body">
              <div class="weapon-row wp-head">
                <span class="th-deep">{{ $t('overall.wpName') }}</span><span class="th-light">{{ $t('overall.wpSkill') }}</span><span class="th-deep">{{ $t('overall.wpPct') }}</span><span class="th-light">{{ $t('overall.wpDam') }}</span><span class="th-deep">{{ $t('overall.wpRange') }}</span><span class="th-light">{{ $t('overall.wpTho') }}</span><span class="th-deep">{{ $t('overall.wpRound') }}</span><span class="th-light">{{ $t('overall.wpNum') }}</span><span class="th-deep">{{ $t('overall.wpErr') }}</span>
              </div>
              <div v-for="i in 5" :key="i" class="weapon-row">
                <template v-if="character.weapons[i - 1]">
                  <span>{{ $dn(character.weapons[i - 1].name) }}</span>
                  <span>{{ $sl(character.weapons[i - 1].skill) }}</span>
                  <span></span>
                  <span>{{ character.weapons[i - 1].dam }}</span>
                  <span>{{ character.weapons[i - 1].range }}</span>
                  <span>{{ character.weapons[i - 1].tho ? $t('weapon.yes') : '' }}</span>
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
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.combat') }}</span><span class="subtitle">{{ $t('overall.combatSub') }}</span></h1></div>
            <div class="body battle-body">
              <div class="writable-row"><span class="lbl">{{ $t('overall.db') }}</span><span class="line grow center">{{ derived.db }}</span></div>
              <div class="writable-row"><span class="lbl">{{ $t('overall.build') }}</span><span class="line grow center">{{ derived.build }}</span></div>
              <div class="writable-row"><span class="lbl">{{ $t('overall.armor') }}</span><span class="line grow center">{{ armorText }}</span></div>
              <div class="writable-row"><span class="lbl">{{ $t('overall.mov') }}</span><span class="line grow center">{{ derived.mov }}</span></div>
            </div>
          </section>
        </div>

        <div class="copyright">{{ $t('overall.copyright') }}</div>
      </div>
    </div>

    <!-- ================= 反面 ================= -->
    <div class="paper" ref="backRef">
      <div class="paper-content">
        <!-- 背景故事 -->
        <section class="paper-section story">
          <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.story') }}</span><span class="subtitle">{{ $t('overall.storySub') }}</span></h1></div>
          <div class="body story-body">
            <div class="story-col col-2">
              <div v-if="eraInfoText" class="area">
                <span class="area-label">{{ $t('overall.eraFeature') }}</span>
                <div class="area-text">{{ eraInfoText }}</div>
              </div>
              <div v-for="f in ['app','belief','importantPerson','place','item','trait','scar','mad']" :key="f" class="area">
                <span class="area-label">{{ $t('overall.storyFields.' + f) }}</span>
                <div class="area-text">{{ bg[f] }}</div>
              </div>
            </div>
            <div class="story-col col-3">
              <div class="area tall">
                <span class="area-label">{{ $t('overall.storyFields.desc') }}</span>
                <div class="area-text">{{ bg.desc }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 物品 | 资产 | 神话 -->
        <div class="section-row">
          <section class="paper-section item">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.possessions') }}</span><span class="subtitle">{{ $t('overall.possessionsSub') }}</span></h1></div>
            <div class="body area pad"><div class="area-text">{{ itemText }}</div></div>
          </section>
          <section class="paper-section assets">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.assets') }}</span><span class="subtitle">{{ $t('overall.assetsSub2') }}</span></h1></div>
            <div class="body pad">
              <div class="writable-row"><span class="lbl">{{ $t('overall.credit') }}</span><span class="line grow center">{{ creditRatingValue }}</span></div>
              <div class="writable-row"><span class="lbl">{{ $t('overall.cash') }}</span><span class="line grow center">{{ currency.symbol }}{{ cashInfo.amount }}</span></div>
              <div class="writable-row"><span class="lbl">{{ $t('overall.spending') }}</span><span class="line grow center">{{ $dn(livingStandard.name) }}</span></div>
              <div class="area"><span class="area-label">{{ $t('overall.assets') }}</span><div class="area-text">{{ assetText }}</div></div>
            </div>
          </section>
          <section class="paper-section mythos">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.mythos') }}</span><span class="subtitle">{{ $t('overall.mythosSub') }}</span></h1></div>
            <div class="body pad">
              <div class="area"><span class="area-label">{{ $t('overall.tomes') }}</span><div class="area-text">{{ mythosItemText }}</div></div>
              <div class="area"><span class="area-label">{{ $t('overall.spells') }}</span><div class="area-text">{{ spellText }}</div></div>
              <div class="area"><span class="area-label">{{ $t('overall.encounters') }}</span><div class="area-text">{{ contactText }}</div></div>
            </div>
          </section>
        </div>

        <!-- 人物关系 | 经历 -->
        <div class="section-row">
          <section class="paper-section friend">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.relations') }}</span><span class="subtitle">{{ $t('overall.relationsSub') }}</span></h1></div>
            <div class="body area pad tall"><div class="area-text">{{ relationText }}</div></div>
          </section>
          <section class="paper-section experience">
            <div class="header"><h1 class="heading"><span class="title">{{ $t('overall.scenarios') }}</span><span class="subtitle">{{ $t('overall.scenariosSub') }}</span></h1></div>
            <div class="body area pad tall"><div class="area-text">{{ scenarioText }}</div></div>
          </section>
        </div>

        <div class="copyright">{{ $t('overall.copyright2') }}</div>
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
.writable-row { display: flex; align-items: flex-end; gap: 0.4em; line-height: 1; padding: 0em 0; }
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
.luck-body { padding: 0.2em 0.4em 0.2em; justify-content: center; }

/* 衍生属性 */
.derive-sections { display: flex; gap: 0.8em; align-items: stretch; }
.derive-sections .paper-section { flex: 1 1 0; }
/* 理智/生命/魔法三栏收窄，让出的宽度加到「精神状态」栏 */
.derive-sections .sanity,
.derive-sections .hp,
.derive-sections .mp { flex: 0.9 1 0; }
.derive-sections .mental-status { flex: 1.3 1 0; }
.paper-section .units { flex-direction: row; align-items: center; justify-content: space-around; padding: 0.4em 0.6em; }
.unit { display: flex; flex-direction: column; align-items: center; gap: 0.2em; line-height: 1; }
.u-label { font-size: 0.8em; color: #555; }
.u-val { font-size: 1em; font-weight: bold; }
.u-slash { color: #999; margin: 0 0.15em; }
.u-divider { border-right: 1px solid #c2c2c2; align-self: stretch; }
.paper-section .status-grid { display: grid; grid-template-columns: 1fr 1fr; }
.status { display: flex; gap: 0.4em; align-items: center; padding: 0.35em; line-height: 1; }
.status .cb { width: 1em; height: 1em; border: 1px solid var(--p-black); background: var(--p-white); flex: none; }
.mental-status .status-grid { grid-template-rows: 1fr 1fr; grid-auto-flow: column; }
/* 身体状态（重伤/昏迷/濒死/死亡）行间距收紧 */
.body-status .status-grid { row-gap: 0; }
.body-status .status { padding: 0.15em 0.35em; }

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
/* 英文下技能分类名竖排（横排放不下） */
.skill-table .td-grp.vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 0.06em;
  padding: 0.35em 0.1em;
  font-size: 0.7em;
  white-space: nowrap;
}
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
.battle-body { padding: 0.6em 0.6em 1em 0.2em; justify-content: space-between; gap: 0em; }
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
