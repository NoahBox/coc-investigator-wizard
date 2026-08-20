<script setup>
import { ref, computed } from 'vue';
import {
  character, effectiveAttr, skillValue, skillBaseOf,
} from '../store.js';
import { ATTR_KEYS, ATTR_LABELS } from '../data/rules.js';
import { skills, getEraSkillList } from '../data/skills.js';
import { rollD100, evaluateCheck, rollExpression } from '../data/dice.js';
import { t, dataName } from '../i18n.js';
function tierLabel(l) {
  const map = { 大成功: 'critical', 极难成功: 'extreme', 困难成功: 'hard', 成功: 'success', 失败: 'fail', 大失败: 'fumble' };
  return map[l] ? t('diceTiers.' + map[l]) : l;
}

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(['close']);
function close() { emit('close'); }

const selKind = ref('preset');            // 'preset' | 'custom'
const selectedKey = ref('s:侦查');        // 'a:str' | 's:侦查'
const customTarget = ref(70);
const expr = ref('');
const exprResult = ref(null);

const attrCandidates = computed(() =>
  ATTR_KEYS.concat(['luc']).map(k => ({ key: 'a:' + k, name: dataName(ATTR_LABELS[k]), value: effectiveAttr(k) }))
);
const skillCandidates = computed(() => {
  const list = [];
  list.push({ key: 's:信用评级', name: dataName('信用评级'), value: skillValue('信用评级') });
  list.push({ key: 's:克苏鲁神话', name: dataName('克苏鲁神话'), value: skillValue('克苏鲁神话') });
  skills.forEach(s => {
    if (!s.name) return;
    if (s.group) list.push({ key: 's:' + s.name, name: s.name, value: skillBaseOf(s.name) });
    else list.push({ key: 's:' + s.name, name: s.name, value: skillValue(s.name) });
  });
  getEraSkillList(character.era).forEach(s =>
    list.push({ key: 's:' + s.name, name: s.name, value: skillValue(s.name) })
  );
  return list;
});

const currentTarget = computed(() => {
  if (selKind.value === 'custom') return Number(customTarget.value) || 0;
  const key = selectedKey.value;
  if (key.startsWith('a:')) return effectiveAttr(key.slice(2));
  return skillValue(key.slice(2));
});

const lastResult = ref(null);
const history = ref([]);

function subjectName() {
  if (selKind.value === 'custom') return t('dice.custom') + ' ' + currentTarget.value;
  const key = selectedKey.value;
  if (key.startsWith('a:')) return dataName(ATTR_LABELS[key.slice(2)]);
  return key.slice(2);
}

function doCheck() {
  const target = currentTarget.value;
  const r = rollD100();
  const ev = evaluateCheck(target, r);
  lastResult.value = { ...ev, roll: r, target };
  history.value.unshift({ name: subjectName(), target, roll: r, label: ev.label, color: ev.color });
  if (history.value.length > 20) history.value.pop();
}

function doExpr() {
  const e = expr.value.trim();
  if (!e) return;
  exprResult.value = rollExpression(e);
}
</script>

<template>
  <div class="overlay" @click.self="close">
    <div class="panel card">
      <div class="p-head">
        <h3><font-awesome-icon icon="fa-solid fa-dice" /> {{ $t('dice.title') }}</h3>
        <span class="spacer"></span>
        <button class="btn ghost sm" @click="close">✕</button>
      </div>

      <div class="p-body">
        <!-- 检定对象 -->
        <label class="lbl">{{ $t('dice.targetKind') }}</label>
        <select class="inp" v-model="selKind">
          <option value="preset">{{ $t('dice.preset') }}</option>
          <option value="custom">{{ $t('dice.custom') }}</option>
        </select>

        <template v-if="selKind === 'preset'">
          <select class="inp mt-8" v-model="selectedKey">
            <optgroup :label="$t('dice.attrGroup')">
              <option v-for="a in attrCandidates" :key="a.key" :value="a.key">
                {{ a.name }}（{{ a.value }}）
              </option>
            </optgroup>
            <optgroup :label="$t('dice.skillGroup')">
              <option v-for="s in skillCandidates" :key="s.key" :value="s.key">
                {{ s.name }}（{{ s.value }}）
              </option>
            </optgroup>
          </select>
          <p class="hint mt-8">{{ $t('dice.currentVal', { val: currentTarget }) }}</p>
        </template>
        <template v-else>
          <input class="inp mt-8" type="number" v-model.number="customTarget" :placeholder="$t('dice.customPh')" />
        </template>

        <button class="btn primary big block mt-16" @click="doCheck">{{ $t('dice.roll') }}</button>

        <!-- 结果 -->
        <div v-if="lastResult" class="result" :style="{ borderColor: lastResult.color }">
          <div class="roll-num" :style="{ color: lastResult.color }">{{ lastResult.roll }}</div>
          <div class="verdict" :style="{ color: lastResult.color }">{{ tierLabel(lastResult.label) }}</div>
          <div class="thresholds small dim" v-if="lastResult.thresholds">
            {{ $t('dice.extreme') }} ≤ {{ lastResult.thresholds.extreme }}
            <template v-if="lastResult.thresholds.hard != null"> · {{ $t('dice.hard') }} ≤ {{ lastResult.thresholds.hard }}</template>
            · {{ $t('dice.regular') }} ≤ {{ lastResult.thresholds.regular }}
          </div>
        </div>

        <!-- 自由掷骰 -->
        <div class="divider"></div>
        <label class="lbl">{{ $t('dice.freeRoll') }}</label>
        <div class="row">
          <input class="inp grow" v-model="expr" placeholder="1d10+5" @keyup.enter="doExpr" />
          <button class="btn" @click="doExpr">{{ $t('dice.rollExpr') }}</button>
        </div>
        <p v-if="exprResult != null" class="hint mt-8">{{ $t('dice.exprResult', { expr: expr, val: exprResult }) }}</p>

        <!-- 记录 -->
        <div v-if="history.length" class="divider"></div>
        <div v-if="history.length">
          <div class="small dim mb-8">{{ $t('dice.history') }}</div>
          <ul class="hist-list">
            <li v-for="(h, i) in history" :key="i" class="hist-item">
              <span class="h-name">{{ h.name }}</span>
              <span class="h-target dim">{{ $t('dice.historyTarget', { t: h.target }) }}</span>
              <span class="spacer"></span>
              <span class="h-roll" :style="{ color: h.color }">{{ h.roll }}</span>
              <span class="h-label" :style="{ color: h.color }">{{ tierLabel(h.label) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.panel { width: 440px; max-width: 100%; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; }
.p-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
.p-head h3 { font-size: 1.1rem; color: var(--text); display: flex; align-items: center; gap: 8px; }
.p-head h3 :deep(svg) { color: var(--gold); }
.p-body { padding: 16px 18px; overflow-y: auto; }
.mb-8 { margin-bottom: 8px; }
.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }

.btn.big.block { width: 100%; }

.result {
  margin-top: 16px; padding: 16px; border: 1px solid var(--border); border-left-width: 4px;
  border-radius: var(--radius-sm); background: var(--surface-2); text-align: center;
}
.roll-num { font-family: Georgia, serif; font-size: 2.6rem; line-height: 1; font-weight: 700; }
.verdict { font-size: 1.1rem; margin-top: 4px; font-weight: 500; letter-spacing: 0.06em; }
.thresholds { margin-top: 6px; }

.hist-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.hist-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  border: 1px solid var(--border); border-radius: 6px; background: var(--surface-2); font-size: 0.86rem;
}
.h-name { color: var(--text); }
.h-target { font-size: 0.78rem; }
.h-roll { font-family: Georgia, serif; font-weight: 700; min-width: 28px; text-align: right; }
.h-label { min-width: 56px; text-align: right; font-weight: 500; }
</style>
