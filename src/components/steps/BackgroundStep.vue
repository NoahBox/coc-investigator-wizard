<script setup>
import { computed } from 'vue';
import { character, saveCharacter, currentPackage, eraInfo } from '../../store.js';
import {
  APPEARANCE_DESCRIPTIONS,
  BELIEFS,
  IMPORTANT_PERSON_TYPES,
  IMPORTANT_PERSON_REASONS,
  MEANINGFUL_PLACES,
  PRECIOUS_ITEMS,
  TRAITS,
  ERA_BACKGROUNDS,
} from '../../data/story.js';

// 标记 random:true 的字段可在标签旁显示掷骰按钮，随机抽取文本填入
const fields = [
  { key: 'app', label: '形象描述', ph: '调查员的外貌特征…', random: true },
  { key: 'belief', label: '思想与信念', ph: '信仰、理念、政治立场…', random: true },
  { key: 'importantPerson', label: '重要之人', ph: '对你重要的人及其原因…', random: true },
  { key: 'place', label: '意义非凡之地', ph: '对你意义非凡的地方…', random: true },
  { key: 'item', label: '宝贵之物', ph: '你最珍视的东西…', random: true },
  { key: 'trait', label: '特质', ph: '性格特质…', random: true },
  { key: 'scar', label: '伤口与疤痕', ph: '身体上的伤口与疤痕…' },
  { key: 'mad', label: '精神症状', ph: '恐惧症、躁狂症等…' },
  { key: 'desc', label: '个人介绍', ph: '调查员的完整背景故事…' },
];

const required = computed(() => currentPackage.value?.requiredBackgrounds || []);

// 当前时代专属背景表（仅 不败/黑暗/冰岛 在书中有专属表，其余沿用标准表）
// 点击字段旁的骰子按钮时，从当前时代对应的随机表中抽取
const eraBg = computed(() => ERA_BACKGROUNDS[character.era] || {});

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 根据字段返回随机抽取的文本；重要之人需从两张表各取一项组合
// 注意：eraBg 是 computed，在 setup 函数体中必须用 .value 解包（模板中才会自动解包）
function randomText(key) {
  const bg = eraBg.value;
  switch (key) {
    case 'app': return pick(APPEARANCE_DESCRIPTIONS);
    case 'belief': return bg.belief ? pick(bg.belief) : pick(BELIEFS);
    case 'importantPerson':
      if (bg.importantPerson) return pick(bg.importantPerson);
      return `${pick(IMPORTANT_PERSON_TYPES)}\n${pick(IMPORTANT_PERSON_REASONS)}`;
    case 'place': return bg.place ? pick(bg.place) : pick(MEANINGFUL_PLACES);
    case 'item': return bg.item ? pick(bg.item) : pick(PRECIOUS_ITEMS);
    case 'trait': return pick(TRAITS);
    default: return '';
  }
}

function fillRandom(f) {
  if (!f.random) return;
  character.background[f.key] = randomText(f.key);
  saveCharacter();
}
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>背景故事</h2><span class="sub">Backstory</span></div>
      <div class="card-body">
        <!-- 时代信息（派系 / 随机表结果）：只读展示，不可在此修改 -->
        <div v-if="eraInfo.length" class="era-info-box">
          <span class="era-info-label">时代信息</span>
          <p v-for="(t, i) in eraInfo" :key="i">{{ t }}</p>
        </div>

        <div class="grid-2">
          <div v-for="f in fields" :key="f.key" :class="{ 'span-2': f.key === 'desc' }">
            <label class="lbl">
              <b>{{ f.label }}</b>
              <button v-if="f.random" class="rand-btn" type="button" :title="`随机生成${f.label}`" @click="fillRandom(f)">
                <font-awesome-icon icon="fa-solid fa-dice" />
              </button>
            </label>
            <textarea class="inp" v-model="character.background[f.key]" @input="saveCharacter" :placeholder="f.ph" :style="f.key === 'desc' ? 'min-height:120px' : ''"></textarea>
          </div>
        </div>

        <div v-if="required.length" class="req-box mt-16">
          <p class="warn-text">经验包要求补充以下背景项：</p>
          <ul class="req-list">
            <li v-for="(r, i) in required" :key="i" class="warn-text">{{ r }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.span-2 { grid-column: span 2; }
.lbl { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rand-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--border, #3a3f4b);
  border-radius: var(--radius, 8px);
  background: var(--surface-2, #2a2f3a);
  color: var(--accent, #6aa3ff);
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.rand-btn:hover { background: var(--accent, #6aa3ff); color: #fff; border-color: var(--accent, #6aa3ff); }
.rand-btn:active { transform: translateY(1px); }
.era-info-box {
  background: var(--surface-2); border: 1px solid var(--accent); border-radius: var(--radius);
  padding: 10px 14px; margin-bottom: 14px; line-height: 1.6;
}
.era-info-box p { margin: 3px 0; color: var(--text); }
.era-info-label { display: block; font-size: 0.78rem; color: var(--accent-strong); margin-bottom: 2px; letter-spacing: 0.02em; }
.req-box { background: var(--danger-bg); border: 1px solid var(--danger); border-radius: var(--radius); padding: 12px 16px; }
.req-list { margin: 6px 0 0; padding-left: 20px; }
@media (max-width: 640px) { .span-2 { grid-column: span 1; } }
</style>
