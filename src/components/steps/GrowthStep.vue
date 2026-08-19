<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter, occupationSkills, getAllocation, skillValue, skillBaseOf, setAllocation, splitSkillKey } from '../../store.js';
import { roll } from '../../data/rules.js';

const selected = ref({});
const results = ref([]);

const growableSkills = computed(() => {
  return occupationSkills.value.filter((key) => {
    const name = splitSkillKey(key).name;
    return name !== '克苏鲁神话' && name !== '信用评级';
  });
});

function fmtKey(key) { return key.replace('(', '（').replace(')', '）').replace(/Ω/g, ''); }

// 已分配点数（职业+业余+成长+经验包）
function allocPoints(key) {
  const a = getAllocation(key);
  return (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + (a.package || 0);
}

function doGrowth() {
  results.value = [];
  growableSkills.value.forEach((key) => {
    if (!selected.value[key]) return;
    const cur = skillValue(key);
    const r1 = roll(100);
    let gain = 0;
    if (r1 > cur || r1 > 95) {
      gain = roll(10);
      const a = getAllocation(key);
      setAllocation(key, { growth: (a.growth || 0) + gain });
    }
    results.value.push({ key: fmtKey(key), cur, r1, gain });
  });
  saveCharacter();
}
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>幕间成长</h2><span class="sub">Improvement Phase</span></div>
      <div class="card-body">
        <p class="hint mb-16">
          勾选需要成长的技能，点击「成长」。每个技能掷 1D100，若结果大于当前技能值或大于 95，则再掷 1D10 并提升该数值。
        </p>

        <div v-if="growableSkills.length === 0" class="empty">没有可成长的本职技能</div>

        <table class="grid" v-else>
          <thead><tr><th></th><th>技能</th><th>初始值</th><th>已分配</th><th>实际值</th></tr></thead>
          <tbody>
            <tr v-for="key in growableSkills" :key="key">
              <td style="width:32px">
                <label class="checkbox">
                  <input type="checkbox" v-model="selected[key]" />
                  <span class="box">✓</span>
                </label>
              </td>
              <td>{{ fmtKey(key) }}</td>
              <td class="dim">{{ skillBaseOf(key) }}</td>
              <td class="dim">{{ allocPoints(key) }}</td>
              <td class="val serif">{{ skillValue(key) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="row mt-16">
          <button class="btn primary" @click="doGrowth"><font-awesome-icon icon="fa-solid fa-dice" />成长</button>
        </div>

        <div v-if="results.length" class="mt-16">
          <h3 class="mb-8">成长结果</h3>
          <table class="grid">
            <thead><tr><th>技能</th><th>原值</th><th>D100</th><th>提升</th></tr></thead>
            <tbody>
              <tr v-for="r in results" :key="r.key">
                <td>{{ r.key }}</td>
                <td>{{ r.cur }}</td>
                <td>{{ r.r1 }}</td>
                <td :class="{ accent: r.gain > 0, faint: r.gain === 0 }">{{ r.gain > 0 ? '+' + r.gain : '未成长' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.val { font-weight: 600; color: var(--accent); }
</style>
