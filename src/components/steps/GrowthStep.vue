<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter, occupationSkills, getAllocation, skillValue, skillBaseOf, setAllocation, splitSkillKey } from '../../store.js';
import { roll } from '../../data/rules.js';
import { skillLabel } from '../../i18n.js';

const selected = ref({});
const results = ref([]);

const growableSkills = computed(() => {
  return occupationSkills.value.filter((key) => {
    const name = splitSkillKey(key).name;
    return name !== '克苏鲁神话' && name !== '信用评级';
  });
});

// 技能键本地化显示（父(子) 分别翻译，如 格斗(斗殴) → Fighting(Brawl)）
function fmtKey(key) { return skillLabel(key); }

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
    results.value.push({ key, cur, r1, gain });
  });
  saveCharacter();
}
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>{{ $t('growth.title') }}</h2><span class="sub">{{ $t('growth.sub') }}</span></div>
      <div class="card-body">
        <p class="hint mb-16">
          {{ $t('growth.hint') }}
        </p>

        <div v-if="growableSkills.length === 0" class="empty">{{ $t('growth.noGrowable') }}</div>

        <table class="grid" v-else>
          <thead><tr><th></th><th>{{ $t('growth.name') }}</th><th>{{ $t('growth.init') }}</th><th>{{ $t('growth.allocated') }}</th><th>{{ $t('growth.actual') }}</th></tr></thead>
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
          <button class="btn primary" @click="doGrowth"><font-awesome-icon icon="fa-solid fa-dice" />{{ $t('growth.grow') }}</button>
        </div>

        <div v-if="results.length" class="mt-16">
          <h3 class="mb-8">{{ $t('growth.resultTitle') }}</h3>
          <table class="grid">
            <thead><tr><th>{{ $t('growth.name') }}</th><th>{{ $t('growth.orig') }}</th><th>{{ $t('growth.d100') }}</th><th>{{ $t('growth.gain') }}</th></tr></thead>
            <tbody>
              <tr v-for="r in results" :key="r.key">
                <td>{{ fmtKey(r.key) }}</td>
                <td>{{ r.cur }}</td>
                <td>{{ r.r1 }}</td>
                <td :class="{ accent: r.gain > 0, faint: r.gain === 0 }">{{ r.gain > 0 ? '+' + r.gain : $t('growth.noGain') }}</td>
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
