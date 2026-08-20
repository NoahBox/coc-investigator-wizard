<script setup>
import { computed } from 'vue';
import { character, derived, currentJob, totalProPoints, totalInterestPoints, packageSanReduction, saveCharacter, effectiveAttr } from '../../store.js';
import { ATTR_KEYS, ATTR_LABELS, ATTR_EN } from '../../data/rules.js';
import { t, dataNameWithTag } from '../../i18n.js';

const sanAdj = computed(() => packageSanReduction());

const jobDisplay = computed(() => {
  if (character.jobType === 'preset') return character.jobName ? dataNameWithTag(character.jobName) : t('derived.notSelected');
  return character.customJobName || t('derived.customJob');
});

const attrList = [...ATTR_KEYS, 'luc'];

// ---- 数值编辑（空字符串 → null）----
function toNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : Math.max(0, Math.round(n));
}
function setAttr(k, v) {
  character.attributes[k] = toNum(v);
  saveCharacter();
}
function bumpAttr(k, delta) {
  const cur = character.attributes[k] || 0;
  setAttr(k, cur + delta);
}
function setOverride(key, v) {
  character.derivedOverrides[key] = toNum(v);
  saveCharacter();
}
function bumpOverride(key, delta) {
  const cur = character.derivedOverrides[key] ?? derived.value[key] ?? 0;
  setOverride(key, cur + delta);
}
</script>

<template>
  <div class="step fade-in">
    <!-- ============ 导入编辑模式：可调整基础属性与衍生 ============ -->
    <template v-if="character.imported">
      <div class="card">
        <div class="card-title"><h2>{{ $t('derived.titleImport') }}</h2><span class="sub">{{ $t('derived.subImport') }}</span></div>
        <div class="card-body">
          <h3 class="mb-8">{{ $t('derived.baseAttr') }}</h3>
          <div class="num-grid">
            <div v-for="k in attrList" :key="k" class="num-field">
              <div class="num-label serif">{{ $dn(ATTR_LABELS[k]) }} <span class="faint">{{ ATTR_EN[k] }}</span></div>
              <div class="num-row">
                <button class="btn sm" @click="bumpAttr(k, -1)">−</button>
                <input class="mini" type="number" :value="character.attributes[k] ?? ''" @input="setAttr(k, $event.target.value)" />
                <button class="btn sm" @click="bumpAttr(k, 1)">+</button>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <h3 class="mb-8">{{ $t('derived.hpMpSan') }}</h3>
          <div class="num-grid">
            <div class="num-field">
              <div class="num-label">{{ $t('derived.curHp') }}</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('hp', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.hp ?? derived.hp" @input="setOverride('hp', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('hp', 1)">+</button>
              </div>
            </div>
            <div class="num-field">
              <div class="num-label">{{ $t('derived.curMp') }}</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('mp', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.mp ?? derived.mp" @input="setOverride('mp', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('mp', 1)">+</button>
              </div>
            </div>
            <div class="num-field">
              <div class="num-label">{{ $t('derived.curSan') }}</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('san', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.san ?? derived.san" @input="setOverride('san', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('san', 1)">+</button>
              </div>
            </div>
            <div class="num-field">
              <div class="num-label">{{ $t('derived.sanMax') }}</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('sanMax', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.sanMax ?? derived.sanMax" @input="setOverride('sanMax', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('sanMax', 1)">+</button>
              </div>
            </div>
          </div>

          <div class="derived-readonly">
            <div class="ro-item"><span class="ro-label">{{ $t('derived.hpMax') }}</span><span class="ro-val serif">{{ derived.hpMax }}</span></div>
            <div class="ro-item"><span class="ro-label">{{ $t('derived.mpMax') }}</span><span class="ro-val serif">{{ derived.mpMax }}</span></div>
            <div class="ro-item"><span class="ro-label">{{ $t('derived.build') }}</span><span class="ro-val serif">{{ derived.build }}</span></div>
            <div class="ro-item"><span class="ro-label">{{ $t('derived.db') }}</span><span class="ro-val serif">{{ derived.db }}</span></div>
            <div class="ro-item"><span class="ro-label">{{ $t('derived.mov') }}</span><span class="ro-val serif">{{ derived.mov }}</span></div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 创建模式：只读展示 ============ -->
    <template v-else>
      <div class="card">
        <div class="card-title"><h2>{{ $t('derived.titleView') }}</h2><span class="sub">{{ $t('derived.subView') }}</span></div>
        <div class="card-body">
          <div class="grid-2">
            <div>
              <h3 class="mb-8">{{ $t('derived.attrs') }}</h3>
              <table class="grid">
                <tbody>
                  <tr v-for="k in attrList" :key="k">
                    <td class="serif">{{ $dn(ATTR_LABELS[k]) }} <span class="faint small">{{ ATTR_EN[k] }}</span></td>
                    <td class="right">{{ effectiveAttr(k) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 class="mb-8">{{ $t('derived.derivedAttr') }}</h3>
              <table class="grid">
                <tbody>
                  <tr><td class="serif">{{ $t('derived.san') }}</td><td class="right">{{ derived.san }}</td></tr>
                  <tr><td class="serif">{{ $t('derived.sanMaxR') }}</td><td class="right">{{ derived.sanMax }}</td></tr>
                  <tr><td class="serif">{{ $t('derived.hp') }}</td><td class="right">{{ derived.hp }}</td></tr>
                  <tr><td class="serif">{{ $t('derived.mp') }}</td><td class="right">{{ derived.mp }}</td></tr>
                  <tr><td class="serif">{{ $t('derived.build') }}</td><td class="right">{{ derived.build }}</td></tr>
                  <tr><td class="serif">{{ $t('derived.db') }}</td><td class="right">{{ derived.db }}</td></tr>
                  <tr><td class="serif">{{ $t('derived.mov') }}</td><td class="right">{{ derived.mov }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="divider"></div>

          <div class="grid-3">
            <div class="stat-card">
              <div class="stat-label faint small">{{ $t('derived.job') }}</div>
              <div class="stat-val serif">{{ jobDisplay }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label faint small">{{ $t('derived.proPoints') }}</div>
              <div class="stat-val serif accent">{{ totalProPoints }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label faint small">{{ $t('derived.interestPoints') }}</div>
              <div class="stat-val serif accent">{{ totalInterestPoints }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.right { text-align: right; font-family: Georgia, serif; }
.stat-card { background: var(--surface-2); border-radius: var(--radius); padding: 14px 16px; text-align: center; }
.stat-val { font-size: 1.4rem; margin-top: 4px; }
.num-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.num-field { background: var(--surface-2); border-radius: var(--radius); padding: 10px 12px; text-align: center; }
.num-label { font-size: 0.85rem; margin-bottom: 8px; }
.num-row { display: flex; align-items: center; justify-content: center; gap: 6px; }
.mini { width: 60px; text-align: center; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 4px; padding: 5px; font: inherit; font-size: 1.05rem; }
.mini:focus { border-color: var(--accent); outline: none; }
.derived-readonly { display: flex; flex-wrap: wrap; gap: 10px; }
.ro-item { flex: 1; min-width: 110px; background: var(--surface-2); border-radius: var(--radius); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
.ro-label { color: var(--text-dim); font-size: 0.85rem; }
.ro-val { font-size: 1.2rem; }
@media (max-width: 860px) { .num-grid { grid-template-columns: repeat(2, 1fr); } }
.derived-readonly { padding-top: 12px; }
</style>
