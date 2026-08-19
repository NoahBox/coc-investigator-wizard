<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter } from '../store.js';
import { isEraEra } from '../data/eras.js';
import BasicStep from './steps/BasicStep.vue';
import PackageStep from './steps/PackageStep.vue';
import EraStep from './steps/EraStep.vue';
import AttributesStep from './steps/AttributesStep.vue';
import LuckStep from './steps/LuckStep.vue';
import DerivedStep from './steps/DerivedStep.vue';
import SkillStep from './steps/SkillStep.vue';
import SkillOverviewStep from './steps/SkillOverviewStep.vue';
import WeaponStep from './steps/WeaponStep.vue';
import BackgroundStep from './steps/BackgroundStep.vue';
import ItemsStep from './steps/ItemsStep.vue';
import MythosStep from './steps/MythosStep.vue';
import RelationsStep from './steps/RelationsStep.vue';
import ScenariosStep from './steps/ScenariosStep.vue';
import OverallStep from './steps/OverallStep.vue';
import GrowthStep from './steps/GrowthStep.vue';

// 创建流程：经验包 / 时代特性位于「幸运与年龄」之后；选择扩展时代时再插入「时代特性」步骤
const createSteps = computed(() => {
  const base = [
    { id: 'basic', label: '基本信息' },
    { id: 'attributes', label: '属性' },
    { id: 'luck', label: '幸运与年龄' },
    { id: 'package', label: '经验包' },
    { id: 'derived', label: '当前数据' },
    { id: 'proskills', label: '职业技能' },
    { id: 'interestskills', label: '业余技能' },
    { id: 'skilloverview', label: '技能总览' },
    { id: 'weapons', label: '武器' },
    { id: 'background', label: '背景故事' },
    { id: 'items', label: '物品与资产' },
    { id: 'mythos', label: '克苏鲁神话' },
    { id: 'relations', label: '人物关系' },
    { id: 'scenarios', label: '经历过的剧本' },
    { id: 'overall', label: '总览' },
  ];
  if (isEraEra(character.era)) {
    base.splice(4, 0, { id: 'era', label: '时代特性' });
  }
  return base;
});

const importSteps = [
  { id: 'basic', label: '基本信息' },
  { id: 'growth', label: '幕间成长' },
  { id: 'derived', label: '属性与衍生' },
  { id: 'proskills', label: '职业技能' },
  { id: 'interestskills', label: '业余技能' },
  { id: 'background', label: '背景故事' },
  { id: 'weapons', label: '武器' },
  { id: 'items', label: '物品与资产' },
  { id: 'mythos', label: '克苏鲁神话' },
  { id: 'relations', label: '人物关系' },
  { id: 'scenarios', label: '经历过的剧本' },
  { id: 'overall', label: '总览' },
];

const components = {
  basic: BasicStep,
  package: PackageStep,
  era: EraStep,
  attributes: AttributesStep,
  luck: LuckStep,
  derived: DerivedStep,
  proskills: SkillStep,
  interestskills: SkillStep,
  skilloverview: SkillOverviewStep,
  weapons: WeaponStep,
  background: BackgroundStep,
  items: ItemsStep,
  mythos: MythosStep,
  relations: RelationsStep,
  scenarios: ScenariosStep,
  overall: OverallStep,
  growth: GrowthStep,
};

const steps = computed(() => (character.imported ? importSteps : createSteps.value));
const current = ref(0);

function go(i) { current.value = i; saveCharacter(); }
function next() { if (current.value < steps.value.length - 1) current.value++; }
function prev() { if (current.value > 0) current.value--; }

const activeStep = computed(() => steps.value[current.value]);

const stepProps = computed(() => {
  if (activeStep.value.id === 'proskills') return { mode: 'pro' };
  if (activeStep.value.id === 'interestskills') return { mode: 'interest' };
  return {};
});
</script>

<template>
  <div class="wizard">
    <!-- 侧栏进度追踪器 -->
    <aside class="sidebar">
      <div class="sidebar-head small faint serif">创建进度</div>
      <nav class="steps">
        <div
          v-for="(s, i) in steps"
          :key="s.id"
          class="step-link"
          :class="{ active: i === current, done: i < current }"
          @click="go(i)"
        >
          <span class="step-num">{{ i + 1 }}</span>
          <span>{{ s.label }}</span>
        </div>
      </nav>
    </aside>

    <!-- 内容区 -->
    <section class="content">
      <component :is="components[activeStep.id]" :key="activeStep.id" v-bind="stepProps" />
      <div class="nav-buttons">
        <button class="btn" :disabled="current === 0" @click="prev">← 上一步</button>
        <div class="spacer"></div>
        <button v-if="current < steps.length - 1" class="btn primary" @click="next">下一步 →</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wizard { display: flex; max-width: 1200px; margin: 0 auto; min-height: calc(100vh - 120px); }
.sidebar {
  width: 220px; flex: none;
  padding: 20px 12px;
  border-right: 1px solid var(--border);
  background: var(--surface);
  position: sticky; top: 61px; height: calc(100vh - 61px); overflow-y: auto;
}
.sidebar-head { text-transform: uppercase; letter-spacing: 0.16em; padding: 0 12px 8px; }
.steps { display: flex; flex-direction: column; gap: 2px; }
.content { flex: 1; padding: 24px 28px 40px; min-width: 0; }
.nav-buttons { display: flex; gap: 12px; margin-top: 28px; }
@media (max-width: 760px) {
  .wizard { flex-direction: column; }
  .sidebar { width: 100%; position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
  .steps { flex-direction: row; flex-wrap: wrap; gap: 4px; }
}
</style>
