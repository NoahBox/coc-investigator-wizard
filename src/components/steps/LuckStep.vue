<script setup>
import { computed } from 'vue';
import { character, saveCharacter, applyAgeAdjustment, packageSanReduction } from '../../store.js';
import { roll } from '../../data/rules.js';
import { ATTR_KEYS, ATTR_LABELS, ATTR_EN } from '../../data/rules.js';

function rollLuck() {
  character.attributes.luc = roll(6, 3) * 5;
  character.ageAdjusted = false;
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

const sanAdj = computed(() => packageSanReduction());
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
              <span v-else class="big-val">{{ character.attributes.luc ?? '—' }}</span>
              <button class="btn primary" @click="rollLuck"><font-awesome-icon icon="fa-solid fa-dice" />随机生成幸运</button>
            </div>
          </div>
          <div>
            <label class="lbl">年龄修正</label>
            <template v-if="character.ageModifier">
              <button class="btn" :disabled="!canAge" @click="applyAgeAdjustment"><font-awesome-icon icon="fa-solid fa-dice" />掷骰进行年龄修正</button>
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

        <div v-if="sanAdj" class="mt-16">
          <p class="warn-text">⚠ 经验包影响：当前理智值 SAN 减少 <span class="adj">−{{ sanAdj }}</span>（已计入最终理智值）</p>
        </div>

        <div class="mt-16">
          <h3 class="mb-8">当前属性</h3>
          <div class="attr-mini">
            <div v-for="k in [...ATTR_KEYS, 'luc']" :key="k" class="attr-mini-item">
              <span class="serif">{{ ATTR_LABELS[k] }}</span>
              <span class="val">{{ character.attributes[k] ?? '—' }}</span>
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
</style>
