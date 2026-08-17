<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  character, saveCharacter, getAllocation, setAllocation, skillValue, skillBase,
  totalProPoints, totalInterestPoints, usedProPoints, usedInterestPoints,
  occupationSkills, occupationGroupNames, isOccupationSkill, packageAdjust, splitSkillKey, makeSkillKey,
  jobGroupHints,
} from '../../store.js';
import { skills, skillGroups, skillGroupOrder, getSkill, groupedSkillNames } from '../../data/skills.js';

const props = defineProps({ mode: { type: String, default: 'pro' } });
const isPro = computed(() => props.mode === 'pro');
const interestTab = ref('探索');
const pickerTab = ref('探索');

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

function getChildren(groupName) {
  return character.groupedOrder[groupName] || [];
}
function addChild(groupName) {
  if (!character.groupedOrder[groupName]) character.groupedOrder[groupName] = [];
  character.groupedOrder[groupName].push('');
  saveCharacter();
}
function setChildName(groupName, idx, name) {
  character.groupedOrder[groupName][idx] = name;
  saveCharacter();
}
function removeChild(groupName, idx) {
  character.groupedOrder[groupName].splice(idx, 1);
  saveCharacter();
}

// 点数操作（带剩余点约束）
function valOf(key) {
  return getAllocation(key)[allocField.value] || 0;
}
function setVal(key, v) {
  const cur = valOf(key);
  const max = Math.max(0, totalPoints.value - usedPoints.value + cur);
  const final = Math.max(0, Math.min(Math.round(v || 0), max));
  setAllocation(key, { [allocField.value]: final });
}
function bump(key, delta) { setVal(key, valOf(key) + delta); }

// 技能是否可分配（本职/业余）
function allocatable(key) {
  if (key === '信用评级') return isPro.value; // 信用评级只能职业点
  if (isPro.value) return isOccupationSkill(key);
  // 业余：不可分配信用评级；严格模式也不可分配本职技能
  if (character.skillMode === 'strict') return !isOccupationSkill(key);
  return true;
}

// 展示技能名
function showName(name) { return name.replace(/Ω/g, ''); }

// 技能说明（悬浮提示）
function skillIntro(name) {
  return getSkill(name)?.intro || '';
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
        <h2>{{ isPro ? '职业技能分配' : '业余技能分配' }}</h2>
        <span class="sub">{{ isPro ? 'Occupation Skills' : 'Personal Interest Skills' }}</span>
        <span class="spacer"></span>
        <span class="small">剩余点数 <b class="accent">{{ remaining }}</b> / {{ totalPoints }}</span>
      </div>
      <div class="card-body">
        <!-- 分配模式（仅职业） -->
        <template v-if="isPro">
          <label class="lbl">分配模式</label>
          <div class="seg mb-16">
            <span class="seg-item" :class="{ active: character.skillMode === 'strict' }" @click="character.skillMode = 'strict'; saveCharacter()">严格模式</span>
            <span class="seg-item" :class="{ active: character.skillMode === 'pulp' }" @click="character.skillMode = 'pulp'; saveCharacter()">通俗模式</span>
          </div>
          <p class="hint mb-16">
            严格模式：职业技能与信用评级仅可分配职业技能点，业余技能仅可分配业余技能点。<br />
            通俗模式：职业技能既可分配职业技能点，也可分配业余技能点。
          </p>
        </template>

        <!-- 自定义职业：选择本职技能 -->
        <div v-if="customPickerOpen" class="custom-picker card mt-8">
          <div class="card-body">
            <h3 class="mb-8">选择本职技能（默认已含信用评级，不可选择克苏鲁神话）</h3>
            <div class="row wrap mb-8">
              <span class="small dim">已选 {{ character.customSkills.length }} / 8</span>
            </div>
            <div class="tabs">
              <span v-for="g in skillGroupOrder" :key="g" class="tab" :class="{ active: pickerTab === g }" @click="pickerTab = g">{{ g }}</span>
            </div>
            <div class="picker-list">
              <template v-for="name in skillGroups[pickerTab]" :key="name">
                <label v-if="name !== '自定义'" class="checkbox picker-item">
                  <input
                    type="checkbox"
                    :checked="name === '信用评级' || isCustomSkillSelected(name)"
                    :disabled="name === '信用评级' || name === '克苏鲁神话'"
                    @change="toggleCustomSkill(name)"
                  />
                  <span class="box">✓</span>
                  <span :class="{ faint: name === '克苏鲁神话' }">{{ showName(name) }}</span>
                  <span v-if="name === '克苏鲁神话'" class="small faint">（不可选）</span>
                </label>
              </template>
            </div>
          </div>
        </div>

        <!-- 职业技能：本职技能 + 信用评级列表 -->
        <div v-if="isPro">
          <div class="skill-row header small dim">
            <span class="s-name">技能</span><span class="s-base">基础</span><span class="s-alloc">分配</span><span class="s-total">总值</span><span class="s-adj"></span>
          </div>
          <!-- 信用评级 -->
          <div class="skill-row">
            <span class="s-name" :title="skillIntro('信用评级')">信用评级</span>
            <span class="s-base faint">—</span>
            <span class="s-alloc">
              <button class="btn sm" @click="bump('信用评级', -5)">−</button>
              <input class="mini" type="number" :value="valOf('信用评级')" @input="setVal('信用评级', $event.target.value)" />
              <button class="btn sm" @click="bump('信用评级', 5)">+</button>
            </span>
            <span class="s-total">{{ valOf('信用评级') }}</span>
            <span class="s-adj"></span>
          </div>

          <!-- 本职技能 -->
          <template v-for="key in occupationSkills" :key="key">
            <div v-if="!getSkill(splitSkillKey(key).name)?.group" class="skill-row">
              <span class="s-name" :title="skillIntro(splitSkillKey(key).name)">{{ showName(splitSkillKey(key).name) }}</span>
              <span class="s-base faint">{{ skillBase(key, character.attributes) }}</span>
              <span class="s-alloc">
                <button class="btn sm" @click="bump(key, -5)">−</button>
                <input class="mini" type="number" :value="valOf(key)" @input="setVal(key, $event.target.value)" />
                <button class="btn sm" @click="bump(key, 5)">+</button>
              </span>
              <span class="s-total">{{ skillValue(key) }}</span>
              <span class="s-adj"><span v-if="packageAdjust(key)" class="adj">(+{{ packageAdjust(key) }})</span></span>
            </div>
          </template>
        </div>

        <!-- 业余技能：分类标签页 -->
        <div v-else>
          <div class="tabs">
            <span v-for="g in skillGroupOrder" :key="g" class="tab" :class="{ active: interestTab === g }" @click="interestTab = g">{{ g }}</span>
          </div>
          <div class="skill-row header small dim mt-8">
            <span class="s-name">技能</span><span class="s-base">基础</span><span class="s-alloc">分配</span><span class="s-total">总值</span><span class="s-adj"></span>
          </div>
          <template v-for="name in skillGroups[interestTab]" :key="name">
            <!-- 普通技能 -->
            <div v-if="!groupedSkillNames.includes(name)" class="skill-row">
              <span class="s-name" :class="{ faint: !allocatable(name) }" :title="skillIntro(name)">{{ showName(name) }}</span>
              <span class="s-base faint">{{ skillBase(name, character.attributes) }}</span>
              <span class="s-alloc">
                <template v-if="allocatable(name)">
                  <button class="btn sm" @click="bump(name, -5)">−</button>
                  <input class="mini" type="number" :value="valOf(name)" @input="setVal(name, $event.target.value)" />
                  <button class="btn sm" @click="bump(name, 5)">+</button>
                </template>
                <span v-else class="small faint">不可分配</span>
              </span>
              <span class="s-total">{{ skillValue(name) }}</span>
              <span class="s-adj"><span v-if="packageAdjust(name)" class="adj">(+{{ packageAdjust(name) }})</span></span>
            </div>
            <!-- 分组技能 -->
            <div v-else class="group-block">
              <div class="group-head">
                <span class="serif" :title="skillIntro(name)">{{ showName(name) }}</span>
                <span class="faint small">基础 {{ skillBase(name, character.attributes) }}</span>
                <button class="btn sm ghost" @click="addChild(name)">+ 添加类别</button>
              </div>
              <div v-for="(child, ci) in getChildren(name)" :key="ci" class="skill-row group-child">
                <span class="s-name">
                  <input class="inp child-inp" :list="'ch-' + name" :value="child" :placeholder="name + '具体类别'" @input="setChildName(name, ci, $event.target.value)" />
                  <datalist :id="'ch-' + name">
                    <option v-for="s in childSuggestions(name)" :key="s" :value="s"></option>
                  </datalist>
                </span>
                <span class="s-base faint">{{ skillBase(makeSkillKey(name, child), character.attributes) }}</span>
                <span class="s-alloc">
                  <template v-if="allocatable(makeSkillKey(name, child))">
                    <button class="btn sm" @click="bump(makeSkillKey(name, child), -5)">−</button>
                    <input class="mini" type="number" :value="valOf(makeSkillKey(name, child))" @input="setVal(makeSkillKey(name, child), $event.target.value)" />
                    <button class="btn sm" @click="bump(makeSkillKey(name, child), 5)">+</button>
                  </template>
                  <span v-else class="small faint">不可分配</span>
                </span>
                <span class="s-total">{{ skillValue(makeSkillKey(name, child)) }}</span>
                <span class="s-adj">
                  <span v-if="packageAdjust(makeSkillKey(name, child))" class="adj">(+{{ packageAdjust(makeSkillKey(name, child)) }})</span>
                  <button v-if="ci > 0" class="btn sm ghost" @click="removeChild(name, ci)">×</button>
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- 分组技能也需在本职技能中处理（有子技能的），按分组名去重渲染 -->
        <template v-if="isPro">
          <template v-for="groupName in occupationGroupNames" :key="groupName">
            <div class="group-block">
              <div class="group-head">
                <span class="serif" :title="skillIntro(groupName)">{{ showName(groupName) }}</span>
                <span class="faint small">基础 {{ skillBase(groupName, character.attributes) }}</span>
                <span v-if="jobGroupHints[groupName]" class="hint-chip">推荐：{{ jobGroupHints[groupName] }}</span>
                <button class="btn sm ghost" @click="addChild(groupName)">+ 添加类别</button>
              </div>
              <div v-for="(child, ci) in getChildren(groupName)" :key="ci" class="skill-row group-child">
                <span class="s-name">
                  <input class="inp child-inp" :list="'chp-' + groupName" :value="child" :placeholder="jobGroupHints[groupName] && ci === 0 ? '推荐：' + jobGroupHints[groupName] : groupName + '具体类别'" @input="setChildName(groupName, ci, $event.target.value)" />
                  <datalist :id="'chp-' + groupName">
                    <option v-for="s in childSuggestions(groupName)" :key="s" :value="s"></option>
                  </datalist>
                </span>
                <span class="s-base faint">{{ skillBase(makeSkillKey(groupName, child), character.attributes) }}</span>
                <span class="s-alloc">
                  <button class="btn sm" @click="bump(makeSkillKey(groupName, child), -5)">−</button>
                  <input class="mini" type="number" :value="valOf(makeSkillKey(groupName, child))" @input="setVal(makeSkillKey(groupName, child), $event.target.value)" />
                  <button class="btn sm" @click="bump(makeSkillKey(groupName, child), 5)">+</button>
                </span>
                <span class="s-total">{{ skillValue(makeSkillKey(groupName, child)) }}</span>
                <span class="s-adj">
                  <span v-if="packageAdjust(makeSkillKey(groupName, child))" class="adj">(+{{ packageAdjust(makeSkillKey(groupName, child)) }})</span>
                  <button v-if="ci > 0" class="btn sm ghost" @click="removeChild(groupName, ci)">×</button>
                </span>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-row { display: grid; grid-template-columns: 1.6fr 0.6fr 1.6fr 0.6fr 1fr; gap: 8px; align-items: center; padding: 7px 4px; border-bottom: 1px solid var(--border); }
.skill-row.header { color: var(--text-faint); font-size: 0.76rem; }
.s-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.s-base, .s-total { text-align: center; font-family: Georgia, serif; }
.s-alloc { display: flex; align-items: center; gap: 5px; justify-content: center; }
.mini { width: 44px; text-align: center; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); border-radius: 4px; padding: 3px; font: inherit; }
.mini:focus { border-color: var(--accent); outline: none; }
.group-block { margin: 8px 0; background: var(--surface-2); border-radius: 8px; padding: 8px 10px; }
.group-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap; }
.hint-chip { color: var(--accent); font-size: 0.76rem; border: 1px dashed var(--accent); border-radius: 4px; padding: 1px 6px; }
.group-child { border-bottom: none; grid-template-columns: 1.6fr 0.6fr 1.6fr 0.6fr 1.2fr; }
.child-inp { padding: 4px 8px; }
.custom-picker { border: 1px dashed var(--border-strong); }
.picker-list { display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 10px 4px; }
.picker-item { min-width: 130px; }
@media (max-width: 640px) { .skill-row { grid-template-columns: 1.3fr 0.5fr 1.8fr; } .s-total, .s-adj { display: none; } }
</style>
