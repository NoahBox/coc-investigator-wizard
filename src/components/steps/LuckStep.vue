<script setup>
import { computed } from 'vue';
import { character, saveCharacter, applyAgeAdjustment, effectiveAttr } from '../../store.js';
import { roll } from '../../data/rules.js';
import { ATTR_KEYS, ATTR_LABELS, ATTR_EN, ATTR_MIN, ageAdjustmentInfo } from '../../data/rules.js';

function rollLuck() {
  character.attributes.luc = roll(6, 3) * 5;
  character.ageAdjusted = false;
  // 重新掷幸运后，清空年龄修正的自动差值（含幸运重骰），避免陈旧差值叠加
  character.ageAutoBonus = {};
  character.preAgeAttributes = null;
  character.ageSummary = [];
  saveCharacter();
}

// 老卡模式：幸运值直接输入
function setLuck(v) {
  if (v === '' || v == null) {
    character.attributes.luc = null;
    saveCharacter();
    return;
  }
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return;
  character.attributes.luc = Math.max(0, Math.min(99, n));
  saveCharacter();
}

const canAge = computed(() => ATTR_KEYS.every(k => character.attributes[k] != null && character.attributes[k] > 0) && character.age);

// 年龄档信息（决定自动修正与需手动分配的身体削弱）
const ageInfo = computed(() => ageAdjustmentInfo(character.age));
const ageBracket = computed(() => ageInfo.value.bracket);
const physAllowed = computed(() => ageInfo.value.physAllowed);
const physTotal = computed(() => ageInfo.value.physTotal);

// 手动调整（加成层，上限 = 原始/基础属性值，即年龄修正后的 base）
// 身体削弱共 physTotal 点，可在允许的 physAllowed 属性间自由分配；+ 仅复原、不高于原始值
function luckBonus(k) { return character.luckAttrBonus[k] || 0; }
const totalPhysReduced = computed(() =>
  physAllowed.value.reduce((s, k) => s + Math.max(0, -luckBonus(k)), 0)
);
const physRemaining = computed(() => physTotal.value - totalPhysReduced.value);

function reduceLuckAttr(k) {
  if (physRemaining.value <= 0) return; // 已达年龄档需减少的总量
  const base = character.attributes[k] || 0; // 年龄修正后的基础值 = 该层“原始值”
  const cur = luckBonus(k);
  if (base + cur - 1 < ATTR_MIN) return; // 不低于属性下限
  character.luckAttrBonus[k] = cur - 1;
  saveCharacter();
}
function restoreLuckAttr(k) {
  const cur = luckBonus(k);
  if (cur >= 0) return; // 已复原到原始值，不可再增
  character.luckAttrBonus[k] = cur + 1;
  saveCharacter();
}
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>幸运 & 年龄调整</h2><span class="sub">Luck & Age</span></div>
      <div class="card-body">
        <div class="grid-2">
          <div>
            <label class="lbl">幸运值（3D6 × 5）</label>
            <div class="row">
              <input v-if="character.legacyMode" class="inp luck-inp" type="number" :value="character.attributes.luc ?? ''" placeholder="—" @input="setLuck($event.target.value)" />
              <span v-else class="big-val">{{ effectiveAttr('luc') ?? '—' }}</span>
              <button class="btn primary" @click="rollLuck"><font-awesome-icon icon="fa-solid fa-dice" />随机生成幸运</button>
            </div>
          </div>
          <div>
            <label class="lbl">年龄修正</label>
            <template v-if="character.ageModifier">
              <p class="hint" v-if="ageBracket === 'none'">年龄低于 15 岁，不进行年龄修正。</p>
              <template v-else>
                <p class="hint" v-if="ageBracket === 'young'">15~19 岁：教育 −5，幸运掷骰两次取较高；并需从「力量 / 体型」共减少 5 点（下方手动分配）。</p>
                <p class="hint" v-else-if="ageBracket === 'mid'">20~39 岁：教育进行一次成长检定。</p>
                <p class="hint" v-else>40 岁以上：外貌按年龄档减点，教育进行成长检定；并需从「力量 / 体质 / 敏捷」共减少 {{ physTotal }} 点（下方手动分配）。</p>
                <button class="btn mt-8" :disabled="!canAge" @click="applyAgeAdjustment()"><font-awesome-icon icon="fa-solid fa-dice" />年龄修正</button>
              </template>
              <p class="hint mt-8" v-if="!canAge">请先完成属性分配并填写年龄。</p>
            </template>
            <p v-else class="hint">未启用年龄修正。</p>
          </div>
        </div>

        <div v-if="character.ageSummary.length" class="mt-16">
          <h3 class="mb-8">年龄修正结果</h3>
          <ul class="summary">
            <li v-for="(s, i) in character.ageSummary" :key="i">{{ s }}</li>
          </ul>
        </div>

        <div v-if="physAllowed.length" class="mt-16">
          <div class="row mb-8">
            <h3>身体削弱（手动分配）</h3>
            <span class="spacer"></span>
            <span class="small">需共减少 <b class="accent">{{ physTotal }}</b> 点 · 剩余 <b class="accent">{{ physRemaining }}</b></span>
          </div>
          <div class="pkg-attrs">
            <div v-for="k in physAllowed" :key="k" class="pkg-attr row">
              <span class="grow">{{ ATTR_LABELS[k] }} <span class="faint">{{ ATTR_EN[k] }}</span></span>
              <button class="btn sm" @click="reduceLuckAttr(k)" :disabled="physRemaining <= 0 || effectiveAttr(k) <= ATTR_MIN">−</button>
              <span class="pkg-attr-val">{{ effectiveAttr(k) }}<small v-if="luckBonus(k)" class="dim"> (−{{ -luckBonus(k) }})</small></span>
              <button class="btn sm" @click="restoreLuckAttr(k)" :disabled="luckBonus(k) >= 0">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.big-val { font-size: 2.4rem; font-family: Georgia, serif; color: var(--gold); min-width: 90px; text-align: center; }
.luck-inp { width: 100px; text-align: center; font-size: 1.6rem; font-family: Georgia, serif; }
.summary { margin: 0; padding-left: 20px; }
.summary li { margin: 4px 0; }
.attr-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.attr-mini-item { display: flex; justify-content: space-between; padding: 8px 12px; background: var(--surface-2); border-radius: 8px; }
.attr-mini-item .val { font-family: Georgia, serif; font-size: 1.1rem; }
.pkg-attrs { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.pkg-attr { padding: 6px 10px; background: var(--surface-2); border-radius: 8px; }
.pkg-attr-val { min-width: 64px; text-align: center; font-weight: 600; font-family: Georgia, serif; }
</style>
