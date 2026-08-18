<script setup>
import { computed } from 'vue';
import { character, saveCharacter, currentPackage } from '../../store.js';

const fields = [
  { key: 'app', label: '形象描述', ph: '调查员的外貌特征…' },
  { key: 'belief', label: '思想与信念', ph: '信仰、理念、政治立场…' },
  { key: 'importantPerson', label: '重要之人', ph: '对你重要的人及其原因…' },
  { key: 'place', label: '意义非凡之地', ph: '对你意义非凡的地方…' },
  { key: 'item', label: '宝贵之物', ph: '你最珍视的东西…' },
  { key: 'trait', label: '特质', ph: '性格特质…' },
  { key: 'scar', label: '伤口与疤痕', ph: '身体上的伤口与疤痕…' },
  { key: 'mad', label: '精神症状', ph: '恐惧症、躁狂症等…' },
  { key: 'desc', label: '个人介绍', ph: '调查员的完整背景故事…' },
];

const required = computed(() => currentPackage.value?.requiredBackgrounds || []);
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>背景故事</h2><span class="sub">Backstory</span></div>
      <div class="card-body">
        <div class="grid-2">
          <div v-for="f in fields" :key="f.key" :class="{ 'span-2': f.key === 'desc' }">
            <label class="lbl"><b>{{ f.label }}</b></label>
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
.req-box { background: var(--danger-bg); border: 1px solid var(--danger); border-radius: var(--radius); padding: 12px 16px; }
.req-list { margin: 6px 0 0; padding-left: 20px; }
@media (max-width: 640px) { .span-2 { grid-column: span 1; } }
</style>
