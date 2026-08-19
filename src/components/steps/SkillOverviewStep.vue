<script setup>
import { computed } from 'vue';
import { character, getAllocation, skillValue, skillBaseOf, isOccupationSkill, packageAdjust } from '../../store.js';
import { skills, getSkill, getEraSkillList } from '../../data/skills.js';

function fmtKey(key) {
  return key.replace('(', '（').replace(')', '）').replace(/Ω/g, '');
}

// 展示名：自定义技能直接显示技能名，其余显示完整键（父（子））
function displayName(e) {
  if (e.group === '自定义') return e.name;
  return fmtKey(e.key);
}

// 收集所有已分配技能
const entries = computed(() => {
  const list = [];
  skills.forEach((sk) => {
    if (!sk.name) return;
    if (sk.group && (sk.group.skills.length || sk.name === '自定义')) {
      (character.groupedOrder[sk.name] || []).forEach((child) => {
        const key = `${sk.name}(${child})`;
        const a = getAllocation(key);
        const total = (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + (a.package || 0);
        if (total > 0) list.push({ key, name: child || sk.name, group: sk.name });
      });
    } else {
      const a = getAllocation(sk.name);
      const total = (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + (a.package || 0);
      if (total > 0) list.push({ key: sk.name, name: sk.name });
    }
  });
  // 扩展时代专属技能（如 帝国知识、拾荒、零重力 等）
  getEraSkillList(character.era).forEach((sk) => {
    const a = getAllocation(sk.name);
    const total = (a.pro || 0) + (a.interest || 0) + (a.growth || 0) + (a.package || 0);
    if (total > 0) list.push({ key: sk.name, name: sk.name });
  });
  return list;
});

const proList = computed(() => entries.value.filter(e => (getAllocation(e.key).pro || 0) > 0));
const interestList = computed(() => entries.value.filter(e => (getAllocation(e.key).interest || 0) > 0));
const otherList = computed(() => entries.value.filter(e => (getAllocation(e.key).pro || 0) === 0 && (getAllocation(e.key).interest || 0) === 0));
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>技能总览</h2><span class="sub">Skill Summary</span></div>
      <div class="card-body">
        <div class="grid-2">
          <div>
            <h3 class="mb-8 accent">职业技能</h3>
            <table class="grid">
              <thead><tr><th>技能</th><th>基础</th><th>职业</th><th>总值</th></tr></thead>
              <tbody>
                <tr v-for="e in proList" :key="e.key">
                  <td>{{ displayName(e) }}<span v-if="packageAdjust(e.key)" class="adj"> (+{{ packageAdjust(e.key) }})</span></td>
                  <td>{{ skillBaseOf(e.key) }}</td>
                  <td>{{ getAllocation(e.key).pro || 0 }}</td>
                  <td>{{ skillValue(e.key) }}</td>
                </tr>
                <tr v-if="proList.length === 0"><td colspan="4" class="empty">尚未分配职业技能点</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 class="mb-8 accent">业余技能</h3>
            <table class="grid">
              <thead><tr><th>技能</th><th>基础</th><th>业余</th><th>总值</th></tr></thead>
              <tbody>
                <tr v-for="e in interestList" :key="e.key">
                  <td>{{ displayName(e) }}<span v-if="packageAdjust(e.key)" class="adj"> (+{{ packageAdjust(e.key) }})</span></td>
                  <td>{{ skillBaseOf(e.key) }}</td>
                  <td>{{ getAllocation(e.key).interest || 0 }}</td>
                  <td>{{ skillValue(e.key) }}</td>
                </tr>
                <tr v-if="interestList.length === 0"><td colspan="4" class="empty">尚未分配业余技能点</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="otherList.length" class="mt-16">
          <h3 class="mb-8">经验包 / 成长加成</h3>
          <table class="grid">
            <thead><tr><th>技能</th><th>基础</th><th>经验包</th><th>成长</th><th>总值</th></tr></thead>
            <tbody>
              <tr v-for="e in otherList" :key="e.key">
                <td>{{ displayName(e) }}</td>
                <td>{{ skillBaseOf(e.key) }}</td>
                <td class="danger">{{ getAllocation(e.key).package || 0 }}</td>
                <td>{{ getAllocation(e.key).growth || 0 }}</td>
                <td>{{ skillValue(e.key) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.right { text-align: right; font-family: Georgia, serif; }
</style>
