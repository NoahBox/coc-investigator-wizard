<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  character, saveCharacter, getAllocation, setAllocation, skillValue, skillBaseOf,
  totalProPoints, totalInterestPoints, usedProPoints, usedInterestPoints,
  occupationSkills, occupationGroupNames, isOccupationSkill, packageAdjust, splitSkillKey, makeSkillKey,
  jobGroupHints, creditRange,
} from '../../store.js';
import { skills, skillGroups, skillGroupOrder, getSkill, getEraSkill, groupedSkillNames, getEraSkillGroups, getEraGroupOrder } from '../../data/skills.js';
import { t, dataName, skillLabel, skillIntroByKey } from '../../i18n.js';

const props = defineProps({ mode: { type: String, default: 'pro' } });
const isPro = computed(() => props.mode === 'pro');
const interestTab = ref('探索');
const pickerTab = ref('探索');

// 神秘冰岛：无职业模板，职业技能点可分配到任意技能（自由分配模式）
const isIcelandFree = computed(() => character.era === 'iceland');
// 神秘冰岛：业余技能点禁用（0 点）
const icelandNoInterest = computed(() => !isPro.value && character.era === 'iceland');

// 技能分组（含当前时代的「时代技能」组）
const groups = computed(() => getEraSkillGroups(character.era));
const groupOrder = computed(() => getEraGroupOrder(character.era));

const allocField = computed(() => (isPro.value ? 'pro' : 'interest'));
const totalPoints = computed(() => (isPro.value ? totalProPoints.value : totalInterestPoints.value));
const usedPoints = computed(() => (isPro.value ? usedProPoints() : usedInterestPoints()));
const remaining = computed(() => totalPoints.value - usedPoints.value);

// 分组技能默认子技能
const GROUP_DEFAULTS = {
  母语: [''],
  外语: ['', ''],
  格斗: ['斗殴', '', ''],
  射击: ['手枪', '步/霰', ''],
  科学: ['', '', ''],
  技艺: ['', '', ''],
  生存: ['', '', ''],
  驾驶: [''],
  自定义: ['', '', ''],
};

onMounted(() => {
  Object.entries(GROUP_DEFAULTS).forEach(([g, def]) => {
    if (!character.groupedOrder[g]) character.groupedOrder[g] = [...def];
  });
});

// 子技能建议列表
function childSuggestions(groupName) {
  const sk = getSkill(groupName);
  return sk?.group?.skills?.map(s => s.name) || [];
}
// 子技能输入框占位文字
function childPlaceholder(groupName) {
  if (groupName === '自定义') return t('skill.customChildPh');
  return groupName + t('skill.childPh');
}

function getChildren(groupName) {
  return character.groupedOrder[groupName] || [];
}
function addChild(groupName) {
  if (!character.groupedOrder[groupName]) character.groupedOrder[groupName] = [];
  character.groupedOrder[groupName].push('');
  saveCharacter();
}
function setChildName(groupName, idx, name) {
  // 去除首尾空格：避免「盾」与「盾 」这类近重复子技能导致列表中重复行
  character.groupedOrder[groupName][idx] = name.trim();
  saveCharacter();
}
function removeChild(groupName, idx) {
  character.groupedOrder[groupName].splice(idx, 1);
  saveCharacter();
}

// 点数操作（带剩余点约束，老卡模式无视上限）
function valOf(key) {
  return getAllocation(key)[allocField.value] || 0;
}
const freeMode = computed(() => !!character.legacyMode);
function setVal(key, v) {
  let final = Math.round(Number(v) || 0);
  if (final < 0) final = 0;
  if (!freeMode.value) {
    const cur = valOf(key);
    const max = Math.max(0, totalPoints.value - usedPoints.value + cur);
    final = Math.min(final, max);
  }
  // 严格模式：信用评级不可超过职业信用评级上限（仅在有职业时生效）
  if (isPro.value && key === '信用评级' && character.skillMode === 'strict') {
    const hasJob = character.jobType === 'custom' || (character.jobType === 'preset' && character.jobName);
    if (hasJob) {
      const cap = creditRange.value ? creditRange.value[1] : null;
      if (cap != null) final = Math.min(final, cap);
    }
  }
  setAllocation(key, { [allocField.value]: final });
}
function bump(key, delta) { setVal(key, valOf(key) + delta); }

// 通俗模式：业余分配时显示该技能已分配的职业技能点
const isPulp = computed(() => character.skillMode === 'pulp');
function proValOf(key) { return getAllocation(key).pro || 0; }

// 经验包启用时，显示「成长」列（经验包对技能值的影响）
const showGrowth = computed(() => character.packageEnabled);
function growthOf(key) { return packageAdjust(key); }

// 技能是否可分配（本职/业余）
function allocatable(key) {
  if (key === '信用评级') return isPro.value; // 信用评级只能职业点
  if (isPro.value) return isOccupationSkill(key);
  // 业余：不可分配信用评级；严格模式也不可分配本职技能
  if (character.skillMode === 'strict') return !isOccupationSkill(key);
  return true;
}

// 展示技能名
function showName(name) { return dataName(name.replace(/Ω/g, '')); }

// 技能说明（悬浮提示）：先查标准技能，再查当前可用的时代技能
function skillIntro(name) {
  return skillIntroByKey(name) || getSkill(name)?.intro || getEraSkill(name)?.intro || '';
}

// ---- 自定义职业：选择本职技能 ----
const customPickerOpen = computed(() => isPro.value && character.jobType === 'custom');
function isCustomSkillSelected(key) {
  return character.customSkills.includes(key);
}
function toggleCustomSkill(key) {
  if (key === '信用评级') return; // 默认锁定
  if (key === '克苏鲁神话') return; // 不可选
  const idx = character.customSkills.indexOf(key);
  if (idx >= 0) {
    character.customSkills.splice(idx, 1);
  } else {
    if (character.customSkills.length >= 8) return;
    character.customSkills.push(key);
  }
  saveCharacter();
}
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title">
        <h2>{{ isPro ? $t('skill.titlePro') : $t('skill.titleInterest') }}</h2>
        <span class="sub">{{ isPro ? $t('skill.subPro') : $t('skill.subInterest') }}</span>
        <span class="spacer"></span>
        <span v-if="freeMode" class="small accent">{{ $t('skill.legacy') }}</span>
        <span v-else class="small">{{ $t('skill.remaining', { n: remaining }) }} / {{ totalPoints }}</span>
      </div>
      <div class="card-body">
        <!-- 分配模式（仅职业） -->
        <template v-if="isPro && !isIcelandFree">
          <label class="lbl">{{ $t('skill.mode') }}</label>
          <div class="seg mb-16">
            <span class="seg-item" :class="{ active: character.skillMode === 'strict' }" @click="character.skillMode = 'strict'; saveCharacter()">{{ $t('skill.strict') }}</span>
            <span class="seg-item" :class="{ active: character.skillMode === 'pulp' }" @click="character.skillMode = 'pulp'; saveCharacter()">{{ $t('skill.pulp') }}</span>
          </div>
          <p class="hint mb-16">
            {{ $t('skill.modeHint') }}
          </p>
        </template>

        <!-- 自定义职业：选择本职技能 -->
        <div v-if="customPickerOpen" class="custom-picker card mt-8">
          <div class="card-body">
            <h3 class="mb-8">{{ $t('skill.customPicker') }}</h3>
            <div class="row wrap mb-8">
              <span class="small dim">{{ $t('skill.selectedN', { n: character.customSkills.length }) }}</span>
            </div>
            <div class="tabs">
              <span v-for="g in groupOrder" :key="g" class="tab" :class="{ active: pickerTab === g }" @click="pickerTab = g">{{ $dn(g) }}</span>
            </div>
            <div class="picker-list">
              <template v-for="name in groups[pickerTab]" :key="name">
                <label v-if="name !== '自定义'" class="checkbox picker-item">
                  <input
                    type="checkbox"
                    :checked="name === '信用评级' || isCustomSkillSelected(name)"
                    :disabled="name === '信用评级' || name === '克苏鲁神话'"
                    @change="toggleCustomSkill(name)"
                  />
                  <span class="box">✓</span>
                  <span :class="{ faint: name === '克苏鲁神话' }" :title="skillIntro(name)">{{ showName(name) }}</span>
                  <span v-if="name === '克苏鲁神话'" class="small faint">{{ $t('skill.noSelect') }}</span>
                </label>
              </template>
            </div>
          </div>
        </div>

        <!-- 职业技能：本职技能 + 信用评级列表（神秘冰岛无职业模板，走下方自由分配界面） -->
        <div v-if="isPro && !isIcelandFree">
          <div class="skill-row header small dim" :class="{ growth: showGrowth }">
            <span class="s-name">{{ $t('skill.name') }}</span><span class="s-base">{{ $t('skill.base') }}</span><span v-if="showGrowth" class="s-growth">{{ $t('skill.growth') }}</span><span class="s-alloc">{{ $t('skill.alloc') }}</span><span class="s-total">{{ $t('skill.total') }}</span>
          </div>
          <!-- 信用评级 -->
          <div class="skill-row" :class="{ growth: showGrowth }">
            <span class="s-name" :title="skillIntro('信用评级')">{{ $dn('信用评级') }}</span>
            <span class="s-base faint">—</span>
            <span v-if="showGrowth" class="s-growth faint">{{ growthOf('信用评级') || '—' }}</span>
            <span class="s-alloc">
              <button class="btn sm" @click="bump('信用评级', -5)">−</button>
              <input class="mini" type="number" :value="valOf('信用评级')" @input="setVal('信用评级', $event.target.value)" />
              <button class="btn sm" @click="bump('信用评级', 5)">+</button>
            </span>
            <span class="s-total">{{ valOf('信用评级') }}</span>
          </div>

          <!-- 本职技能 -->
          <template v-for="key in occupationSkills" :key="key">
            <div v-if="!getSkill(splitSkillKey(key).name)?.group" class="skill-row" :class="{ growth: showGrowth }">
              <span class="s-name" :title="skillIntro(splitSkillKey(key).name)">{{ showName(splitSkillKey(key).name) }}</span>
              <span class="s-base faint">{{ skillBaseOf(key) }}</span>
              <span v-if="showGrowth" class="s-growth faint">{{ growthOf(key) || '—' }}</span>
              <span class="s-alloc">
                <button class="btn sm" @click="bump(key, -5)">−</button>
                <input class="mini" type="number" :value="valOf(key)" @input="setVal(key, $event.target.value)" />
                <button class="btn sm" @click="bump(key, 5)">+</button>
              </span>
              <span class="s-total">{{ skillValue(key) }}</span>
            </div>
          </template>
        </div>

        <!-- 业余技能 / 神秘冰岛职业技能自由分配：分类标签页 -->
        <div v-else-if="!isPro || isIcelandFree">
          <p v-if="icelandNoInterest" class="warn-text mb-8">{{ $t('skill.icelandNoInterest') }}</p>
          <div class="tabs">
            <span v-for="g in groupOrder" :key="g" class="tab" :class="{ active: interestTab === g }" @click="interestTab = g">{{ $dn(g) }}</span>
          </div>
          <div class="skill-row header small dim mt-8" :class="{ pulp: isPulp, growth: showGrowth }">
            <span class="s-name">{{ $t('skill.name') }}</span><span class="s-base">{{ $t('skill.base') }}</span><span v-if="isPulp" class="s-pro">{{ $t('skill.pro') }}</span><span v-if="showGrowth" class="s-growth">{{ $t('skill.growth') }}</span><span class="s-alloc">{{ $t('skill.alloc') }}</span><span class="s-total">{{ $t('skill.total') }}</span>
          </div>
          <template v-for="name in groups[interestTab]" :key="name">
            <!-- 普通技能 -->
            <div v-if="!groupedSkillNames.includes(name)" class="skill-row" :class="{ pulp: isPulp, growth: showGrowth }">
              <span class="s-name" :class="{ faint: !allocatable(name) }" :title="skillIntro(name)">{{ showName(name) }}</span>
              <span class="s-base faint">{{ skillBaseOf(name) }}</span>
              <span v-if="isPulp" class="s-pro faint">{{ proValOf(name) }}</span>
              <span v-if="showGrowth" class="s-growth faint">{{ growthOf(name) || '—' }}</span>
              <span class="s-alloc">
                <template v-if="allocatable(name)">
                  <button class="btn sm" @click="bump(name, -5)">−</button>
                  <input class="mini" type="number" :value="valOf(name)" @input="setVal(name, $event.target.value)" />
                  <button class="btn sm" @click="bump(name, 5)">+</button>
                </template>
                <span v-else class="small faint">{{ $t('skill.notAllocatable') }}</span>
              </span>
              <span class="s-total">{{ skillValue(name) }}</span>
            </div>
            <!-- 分组技能 -->
            <div v-else class="group-block">
              <div class="group-head">
                <span class="serif" :title="skillIntro(name)">{{ showName(name) }}</span>
                <span class="faint small">{{ $t('skill.base') }} {{ skillBaseOf(name) }}</span>
                <button class="btn sm ghost" @click="addChild(name)">{{ $t('skill.addCategory') }}</button>
              </div>
              <div v-for="(child, ci) in getChildren(name)" :key="ci" class="skill-row group-child" :class="{ pulp: isPulp, growth: showGrowth }">
                <span class="s-name">
                  <input class="inp child-inp" :list="'ch-' + name" :value="child" :placeholder="childPlaceholder(name)" @input="setChildName(name, ci, $event.target.value)" />
                  <datalist :id="'ch-' + name">
                    <option v-for="s in childSuggestions(name)" :key="s" :value="s">{{ $dn(s) }}</option>
                  </datalist>
                  <button v-if="ci > 0" class="btn sm ghost rem" @click="removeChild(name, ci)" :title="$t('skill.removeCategory')">
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </button>
                </span>
                <span class="s-base faint">{{ skillBaseOf(makeSkillKey(name, child)) }}</span>
                <span v-if="isPulp" class="s-pro faint">{{ proValOf(makeSkillKey(name, child)) }}</span>
                <span v-if="showGrowth" class="s-growth faint">{{ growthOf(makeSkillKey(name, child)) || '—' }}</span>
                <span class="s-alloc">
                  <template v-if="allocatable(makeSkillKey(name, child))">
                    <button class="btn sm" @click="bump(makeSkillKey(name, child), -5)">−</button>
                    <input class="mini" type="number" :value="valOf(makeSkillKey(name, child))" @input="setVal(makeSkillKey(name, child), $event.target.value)" />
                    <button class="btn sm" @click="bump(makeSkillKey(name, child), 5)">+</button>
                  </template>
                  <span v-else class="small faint">{{ $t('skill.notAllocatable') }}</span>
                </span>
                <span class="s-total">{{ skillValue(makeSkillKey(name, child)) }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 分组技能也需在本职技能中处理（有子技能的），按分组名去重渲染 -->
        <template v-if="isPro && !isIcelandFree">
          <template v-for="groupName in occupationGroupNames" :key="groupName">
            <div class="group-block">
              <div class="group-head">
                <span class="serif" :title="skillIntro(groupName)">{{ showName(groupName) }}</span>
                <span class="faint small">{{ $t('skill.base') }} {{ skillBaseOf(groupName) }}</span>
                <span v-if="jobGroupHints[groupName]" class="hint-chip">{{ $t('skill.recommend', { h: $dn(jobGroupHints[groupName]) }) }}</span>
                <button class="btn sm ghost" @click="addChild(groupName)">{{ $t('skill.addCategory') }}</button>
              </div>
              <div v-for="(child, ci) in getChildren(groupName)" :key="ci" class="skill-row group-child" :class="{ growth: showGrowth }">
                <span class="s-name">
                  <input class="inp child-inp" :list="'chp-' + groupName" :value="child" :placeholder="jobGroupHints[groupName] && ci === 0 ? $t('skill.recommendPh', { h: $dn(jobGroupHints[groupName]) }) : groupName + $t('skill.childPh')" @input="setChildName(groupName, ci, $event.target.value)" />
                  <datalist :id="'chp-' + groupName">
                    <option v-for="s in childSuggestions(groupName)" :key="s" :value="s">{{ $dn(s) }}</option>
                  </datalist>
                  <button v-if="ci > 0" class="btn sm ghost rem" @click="removeChild(groupName, ci)" :title="$t('skill.removeCategory')">
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </button>
                </span>
                <span class="s-base faint">{{ skillBaseOf(makeSkillKey(groupName, child)) }}</span>
                <span v-if="showGrowth" class="s-growth faint">{{ growthOf(makeSkillKey(groupName, child)) || '—' }}</span>
                <span class="s-alloc">
                  <button class="btn sm" @click="bump(makeSkillKey(groupName, child), -5)">−</button>
                  <input class="mini" type="number" :value="valOf(makeSkillKey(groupName, child))" @input="setVal(makeSkillKey(groupName, child), $event.target.value)" />
                  <button class="btn sm" @click="bump(makeSkillKey(groupName, child), 5)">+</button>
                </span>
                <span class="s-total">{{ skillValue(makeSkillKey(groupName, child)) }}</span>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-row { display: grid; grid-template-columns: 1.6fr 0.6fr 1.6fr 0.6fr; gap: 8px; align-items: center; padding: 7px 4px; border-bottom: 1px solid var(--border); }
.skill-row.pulp { grid-template-columns: 1.6fr 0.6fr 0.7fr 1.6fr 0.6fr; }
.skill-row.growth { grid-template-columns: 1.6fr 0.6fr 0.6fr 1.6fr 0.6fr; }
.skill-row.pulp.growth { grid-template-columns: 1.6fr 0.6fr 0.7fr 0.6fr 1.6fr 0.6fr; }
.skill-row.header { color: var(--text-faint); font-size: 0.76rem; }
.s-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.s-base, .s-total, .s-pro, .s-growth { text-align: center; font-family: Georgia, serif; }
.s-alloc { display: flex; align-items: center; gap: 5px; justify-content: center; }
.mini { width: 44px; text-align: center; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); border-radius: 4px; padding: 3px; font: inherit; }
.mini:focus { border-color: var(--accent); outline: none; }
.group-block { margin: 8px 0; background: var(--surface-2); border-radius: 8px; padding: 8px 10px; }
.group-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap; }
.hint-chip { color: var(--accent); font-size: 0.76rem; border: 1px dashed var(--accent); border-radius: 4px; padding: 1px 6px; }
.group-child { border-bottom: none; grid-template-columns: 1.6fr 0.6fr 1.6fr 0.6fr; }
.group-child.pulp { grid-template-columns: 1.6fr 0.6fr 0.7fr 1.6fr 0.6fr; }
.group-child.growth { grid-template-columns: 1.6fr 0.6fr 0.6fr 1.6fr 0.6fr; }
.group-child.pulp.growth { grid-template-columns: 1.6fr 0.6fr 0.7fr 0.6fr 1.6fr 0.6fr; }
.group-child .s-name { overflow: visible; display: flex; align-items: center; gap: 6px; }
.group-child .s-name .child-inp { flex: 1 1 auto; min-width: 0; width: auto; }
.s-name .rem { margin-left: 0; }
.child-inp { padding: 4px 8px; }
.custom-picker { border: 1px dashed var(--border-strong); }
.picker-list { display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 10px 4px; }
.picker-item { min-width: 130px; }
@media (max-width: 640px) {
  .skill-row, .skill-row.pulp, .skill-row.growth, .skill-row.pulp.growth,
  .group-child, .group-child.pulp, .group-child.growth, .group-child.pulp.growth {
    grid-template-columns: 1.3fr 0.5fr 1.8fr;
  }
  .s-total, .s-pro, .s-growth { display: none; }
}
</style>
