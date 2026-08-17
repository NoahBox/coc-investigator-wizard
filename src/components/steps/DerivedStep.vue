<script setup>
import { computed } from 'vue';
import { character, derived, currentJob, totalProPoints, totalInterestPoints, packageSanLoss, saveCharacter } from '../../store.js';
import { ATTR_KEYS, ATTR_LABELS, ATTR_EN } from '../../data/rules.js';

const sanAdj = computed(() => packageSanLoss());

const jobDisplay = computed(() => {
  if (character.jobType === 'preset') return character.jobName || '未选择';
  return character.customJobName || '自定义职业';
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
        <div class="card-title"><h2>属性与衍生</h2><span class="sub">Attributes & Derived</span></div>
        <div class="card-body">
          <h3 class="mb-8">基础属性</h3>
          <div class="num-grid">
            <div v-for="k in attrList" :key="k" class="num-field">
              <div class="num-label serif">{{ ATTR_LABELS[k] }} <span class="faint">{{ ATTR_EN[k] }}</span></div>
              <div class="num-row">
                <button class="btn sm" @click="bumpAttr(k, -1)">−</button>
                <input class="mini" type="number" :value="character.attributes[k] ?? ''" @input="setAttr(k, $event.target.value)" />
                <button class="btn sm" @click="bumpAttr(k, 1)">+</button>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <h3 class="mb-8">生命 / 魔法 / 理智</h3>
          <div class="num-grid">
            <div class="num-field">
              <div class="num-label">生命值 HP（当前）</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('hp', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.hp ?? derived.hp" @input="setOverride('hp', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('hp', 1)">+</button>
              </div>
            </div>
            <div class="num-field">
              <div class="num-label">魔法值 MP（当前）</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('mp', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.mp ?? derived.mp" @input="setOverride('mp', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('mp', 1)">+</button>
              </div>
            </div>
            <div class="num-field">
              <div class="num-label">理智值 SAN（当前）</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('san', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.san ?? derived.san" @input="setOverride('san', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('san', 1)">+</button>
              </div>
            </div>
            <div class="num-field">
              <div class="num-label">理智值上限</div>
              <div class="num-row">
                <button class="btn sm" @click="bumpOverride('sanMax', -1)">−</button>
                <input class="mini" type="number" :value="character.derivedOverrides.sanMax ?? derived.sanMax" @input="setOverride('sanMax', $event.target.value)" />
                <button class="btn sm" @click="bumpOverride('sanMax', 1)">+</button>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <h3 class="mb-8">自动计算（只读）</h3>
          <div class="derived-readonly">
            <div class="ro-item"><span class="ro-label">生命值上限</span><span class="ro-val serif">{{ derived.hpMax }}</span></div>
            <div class="ro-item"><span class="ro-label">魔法值上限</span><span class="ro-val serif">{{ derived.mpMax }}</span></div>
            <div class="ro-item"><span class="ro-label">体格</span><span class="ro-val serif">{{ derived.build }}</span></div>
            <div class="ro-item"><span class="ro-label">伤害加值</span><span class="ro-val serif">{{ derived.db }}</span></div>
            <div class="ro-item"><span class="ro-label">移动力</span><span class="ro-val serif">{{ derived.mov }}</span></div>
          </div>
          <p class="hint mt-8">基础属性与生命/魔法/理智可手动调整；体格、伤害加值、移动力由属性自动计算。</p>
        </div>
      </div>
    </template>

    <!-- ============ 创建模式：只读展示 ============ -->
    <template v-else>
      <div class="card">
        <div class="card-title"><h2>当前数据</h2><span class="sub">Derived Attributes</span></div>
        <div class="card-body">
          <div class="grid-2">
            <div>
              <h3 class="mb-8">属性</h3>
              <table class="grid">
                <tbody>
                  <tr v-for="k in attrList" :key="k">
                    <td class="serif">{{ ATTR_LABELS[k] }} <span class="faint small">{{ ATTR_EN[k] }}</span></td>
                    <td class="right">{{ character.attributes[k] ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 class="mb-8">衍生属性</h3>
              <table class="grid">
                <tbody>
                  <tr><td class="serif">理智 SAN</td><td class="right">{{ derived.san }}<span v-if="sanAdj" class="adj"> (−{{ sanAdj }})</span></td></tr>
                  <tr><td class="serif">理智值上限</td><td class="right">{{ derived.sanMax }}</td></tr>
                  <tr><td class="serif">生命值 HP</td><td class="right">{{ derived.hp }}</td></tr>
                  <tr><td class="serif">魔法值 MP</td><td class="right">{{ derived.mp }}</td></tr>
                  <tr><td class="serif">体格</td><td class="right">{{ derived.build }}</td></tr>
                  <tr><td class="serif">伤害加值</td><td class="right">{{ derived.db }}</td></tr>
                  <tr><td class="serif">移动力</td><td class="right">{{ derived.mov }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="divider"></div>

          <div class="grid-3">
            <div class="stat-card">
              <div class="stat-label faint small">职业</div>
              <div class="stat-val serif">{{ jobDisplay }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label faint small">职业技能点数</div>
              <div class="stat-val serif accent">{{ totalProPoints }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label faint small">业余技能点数</div>
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
</style>
