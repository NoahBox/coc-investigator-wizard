<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter, attributesComplete } from '../../store.js';
import { ATTR_KEYS, ATTR_LABELS, ATTR_EN, generateRandomAttributes, QUICK_START_VALUES, POINT_BUY_DEFAULT, ATTR_MIN, ATTR_MAX } from '../../data/rules.js';

import { t } from '../../i18n.js';
const methods = [
  { v: 'pointbuy', label: () => t('attrs.pointbuy') },
  { v: 'random', label: () => t('attrs.random') },
  { v: 'quickstart', label: () => t('attrs.quickstart') },
];

// 待分配池（随机/快速开始模式，持久化在 character.attrPool）
const drag = ref(null); // { value, source: 'pool' | attrKey }
const selected = ref(null); // 点击选中的池值

function setMethod(m) {
  character.attrMethod = m;
  character.attrPool = [];
  ATTR_KEYS.forEach(k => (character.attributes[k] = null));
  // 快速开始：切换到该模式时自动生成固定数值卡片到待分配栏
  if (m === 'quickstart') {
    character.attrPool = [...QUICK_START_VALUES];
  }
  saveCharacter();
}

function initRandom() {
  const a = generateRandomAttributes();
  ATTR_KEYS.forEach(k => (character.attributes[k] = null));
  character.attrPool = ATTR_KEYS.map(k => a[k]);
  saveCharacter();
}

function assign(attrKey, value) {
  // 若该属性已有值，退回池中
  if (character.attributes[attrKey] != null) character.attrPool.push(character.attributes[attrKey]);
  character.attributes[attrKey] = value;
  removeFromPool(value); // 仅移除一个该数值
  selected.value = null;
  drag.value = null;
  saveCharacter();
}

function unassign(attrKey) {
  if (character.attributes[attrKey] != null) character.attrPool.push(character.attributes[attrKey]);
  character.attributes[attrKey] = null;
  saveCharacter();
}

function removeFromPool(value) {
  const idx = character.attrPool.indexOf(value);
  if (idx >= 0) character.attrPool.splice(idx, 1);
}

// 拖拽（drag 记录来源，避免同值卡片误删）
function onDragStartPool(value) { drag.value = { value, source: 'pool' }; }
function onDragStartSlot(attrKey) {
  const v = character.attributes[attrKey];
  if (v != null) drag.value = { value: v, source: attrKey };
}
function onDropAttr(attrKey) {
  if (!drag.value) return;
  const { value, source } = drag.value;
  drag.value = null;
  if (source === attrKey) return;
  if (source === 'pool') {
    assign(attrKey, value);
  } else {
    // 槽 → 槽：交换两槽数值
    const dst = character.attributes[attrKey];
    character.attributes[source] = dst;
    character.attributes[attrKey] = value;
    saveCharacter();
  }
}
function onDropPool() {
  if (!drag.value) return;
  const { source } = drag.value;
  drag.value = null;
  if (source !== 'pool' && character.attributes[source] != null) {
    character.attrPool.push(character.attributes[source]);
    character.attributes[source] = null;
    saveCharacter();
  }
}
function onDragEnd() { drag.value = null; }

// 点击选中池值
function clickPool(value) {
  selected.value = selected.value === value ? null : value;
}
function clickAttr(attrKey) {
  if (selected.value != null) {
    assign(attrKey, selected.value);
  } else if (character.attributes[attrKey] != null) {
    unassign(attrKey);
  }
}

// 购点模式
const pointBuyUsed = computed(() => ATTR_KEYS.reduce((s, k) => s + (character.attributes[k] || 0), 0));
const pointBuyRemaining = computed(() => (character.pointTotal || POINT_BUY_DEFAULT) - pointBuyUsed.value);

// 是否无视点数上限（老卡模式）
const freeMode = computed(() => !!character.legacyMode);

function clampAttr(n) {
  return Math.max(0, Math.min(ATTR_MAX, n));
}

function adjustAttr(k, delta) {
  const cur = character.attributes[k] || 0;
  let next = cur + delta;
  if (!freeMode.value && delta > 0 && pointBuyRemaining.value < delta) return;
  character.attributes[k] = clampAttr(next);
  saveCharacter();
}

function setAttrValue(k, v) {
  // 空输入 → 清空该属性
  if (v === '' || v == null) {
    character.attributes[k] = null;
    saveCharacter();
    return;
  }
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return;
  let next = Math.max(0, n);
  if (!freeMode.value) {
    const cur = character.attributes[k] || 0;
    const max = cur + pointBuyRemaining.value;
    next = Math.min(next, max);
  }
  character.attributes[k] = clampAttr(next);
  saveCharacter();
}

// 经验包对属性的调整值（当前经验包不影响基础属性，保留机制）
function attrAdjustment(k) { return 0; }
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>{{ $t('attrs.title') }}</h2><span class="sub">{{ $t('attrs.sub') }}</span></div>
      <div class="card-body">
        <label class="lbl">{{ $t('attrs.method') }}</label>
        <div class="seg mb-16">
          <span v-for="m in methods" :key="m.v" class="seg-item" :class="{ active: character.attrMethod === m.v }" @click="setMethod(m.v)">{{ m.label() }}</span>
        </div>

        <!-- 购点 -->
        <template v-if="character.attrMethod === 'pointbuy'">
          <div class="row mb-16">
            <label class="lbl grow" style="margin:0">{{ $t('attrs.pointPool') }}</label>
            <input class="inp" style="width:100px" type="number" v-model.number="character.pointTotal" @input="saveCharacter" />
            <span v-if="freeMode" class="small accent">{{ $t('attrs.legacy') }}</span>
            <span v-else class="small dim">{{ $t('attrs.remaining', { n: pointBuyRemaining }) }}</span>
          </div>
          <div class="attr-grid">
            <div v-for="k in ATTR_KEYS" :key="k" class="attr-pb card pad">
              <div class="attr-name serif">{{ $dn(ATTR_LABELS[k]) }} <span class="faint">{{ ATTR_EN[k] }}</span></div>
              <div class="row mt-8">
                <button class="btn sm" @click="adjustAttr(k, -5)">−5</button>
                <input class="attr-inp" type="number" :value="character.attributes[k] ?? ''" placeholder="—" @input="setAttrValue(k, $event.target.value)" />
                <button class="btn sm" @click="adjustAttr(k, 5)">+5</button>
              </div>
            </div>
          </div>
        </template>

        <!-- 随机 / 快速开始 -->
        <template v-else>
          <div class="row mb-16">
            <button v-if="character.attrMethod === 'random'" class="btn primary" @click="initRandom()">{{ $t('attrs.randomize') }}</button>
            <span class="hint">{{ $t('attrs.hint') }}</span>
          </div>

          <div class="drag-layout">
            <!-- 待分配栏 -->
            <div class="pool card pad" :class="{ 'drop-target': true }" @dragover.prevent @drop="onDropPool">
              <div class="lbl">{{ $t('attrs.pool') }} <span class="faint">{{ $t('attrs.poolHint') }}</span></div>
              <div v-if="character.attrPool.length === 0" class="empty">{{ $t('attrs.empty') }}</div>
              <div class="pool-cards">
                <div
                  v-for="(v, i) in character.attrPool"
                  :key="v + '-' + i"
                  class="val-card"
                  :class="{ selected: selected === v, dragging: drag && drag.source === 'pool' && drag.value === v }"
                  draggable="true"
                  @dragstart="onDragStartPool(v)"
                  @dragend="onDragEnd"
                  @click="clickPool(v)"
                >{{ v }}</div>
              </div>
            </div>

            <!-- 属性槽 -->
            <div class="attr-grid drag-attr">
              <div
                v-for="k in ATTR_KEYS"
                :key="k"
                class="attr-slot card pad"
                :class="{ filled: character.attributes[k] != null, 'drop-target': true }"
                @dragover.prevent
                @drop="onDropAttr(k)"
                @click="clickAttr(k)"
              >
                <div class="attr-name serif">{{ $dn(ATTR_LABELS[k]) }} <span class="faint">{{ ATTR_EN[k] }}</span></div>
                <div class="slot-val" :class="{ dragging: drag && drag.source === k }"
                  :draggable="character.attributes[k] != null"
                  @dragstart="onDragStartSlot(k)"
                  @dragend="onDragEnd"
                >
                  <span v-if="character.attributes[k] != null">{{ character.attributes[k] }}</span>
                  <span v-else class="faint">{{ $t('attrs.drop') }}</span>
                  <span v-if="character.attributes[k] != null && attrAdjustment(k)" class="adj">({{ attrAdjustment(k) >= 0 ? '+' : '' }}{{ attrAdjustment(k) }})</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自适应：先挤压卡片宽度，挤到最小值后再重排行/列（auto-fit + minmax）。
   最小列宽取 176px，使内容在 .wizard 最大宽度(1200px)下最多排 4 列。 */
.attr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.attr-pb, .attr-slot { text-align: center; }
.attr-val { font-size: 1.5rem; font-family: Georgia, serif; min-width: 52px; }
.attr-inp {
  width: 100%; max-width: 60px; min-width: 0; text-align: center; background: var(--surface-2); color: var(--text);
  border: 1px solid var(--border); border-radius: 4px; padding: 5px;
  font: inherit; font-size: 1.2rem; font-family: Georgia, serif;
}
.attr-inp:focus { border-color: var(--accent); outline: none; }
.attr-pb .row { justify-content: center; gap: 6px; flex-wrap: nowrap; }
.drag-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; align-items: start; }
.pool-cards { display: flex; flex-wrap: wrap; gap: 8px; }
.val-card {
  width: 52px; height: 52px; display: inline-flex; align-items: center; justify-content: center;
  background: var(--surface-3); border: 1px solid var(--border-strong); border-radius: 8px;
  font-size: 1.1rem; font-family: Georgia, serif; cursor: grab; user-select: none; transition: all 0.12s;
}
.val-card:hover { border-color: var(--accent); }
.val-card.selected { border-color: var(--accent); background: var(--accent-dim); box-shadow: 0 0 0 3px var(--accent-dim); }
.val-card.dragging, .slot-val.dragging { opacity: 0.4; }
.attr-slot { cursor: pointer; min-height: 110px; }
.attr-slot:hover { border-color: var(--border-strong); }
.attr-slot.drag-over { outline: 2px dashed var(--accent); outline-offset: -2px; background: var(--accent-dim); }
.slot-val { font-size: 1.5rem; font-family: Georgia, serif; margin-top: 8px; }
@media (max-width: 860px) { .drag-layout { grid-template-columns: 1fr; } }
</style>
