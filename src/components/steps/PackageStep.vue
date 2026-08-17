<script setup>
import { computed } from 'vue';
import { character, saveCharacter, currentPackage, usedPackagePoints, makeSkillKey } from '../../store.js';
import { experiencePackages } from '../../data/packages.js';
import { rollStr } from '../../data/rules.js';

function selectPackage(p) {
  character.packageId = p.id;
  character.packageSkillPoints = {};
  character.packageRolls = {};
  if (p.mythos) {
    const mythos = rollStr(p.mythosDice);
    character.packageRolls.mythos = mythos;
    character.packageSkillPoints['克苏鲁神话'] = mythos;
  } else if (p.sanLoss) {
    character.packageRolls.sanLoss = rollStr(p.sanLoss);
  }
  saveCharacter();
}

function addPoint(sk) {
  const key = makeSkillKey(sk.name, sk.child || null);
  const total = currentPackage.value.skillPoints;
  if (usedPackagePoints() >= total) return;
  character.packageSkillPoints[key] = (character.packageSkillPoints[key] || 0) + 5;
  saveCharacter();
}
function subPoint(sk) {
  const key = makeSkillKey(sk.name, sk.child || null);
  const v = character.packageSkillPoints[key] || 0;
  if (v <= 0) return;
  character.packageSkillPoints[key] = Math.max(0, v - 5);
  saveCharacter();
}
function pointOf(sk) {
  return character.packageSkillPoints[makeSkillKey(sk.name, sk.child || null)] || 0;
}

const remaining = computed(() => {
  const p = currentPackage.value;
  if (!p) return 0;
  return p.skillPoints - usedPackagePoints();
});

const ageWarn = computed(() => {
  const p = currentPackage.value;
  if (!p || !p.minAge) return null;
  const age = parseInt(character.age, 10);
  if (isNaN(age)) return p.minAgeNote;
  return age < p.minAge ? `${p.minAgeNote}（当前年龄 ${age} 不满足）` : null;
});

const skillPointsFor = (name, child) => {
  const key = makeSkillKey(name, child || null);
  return character.packageSkillPoints[key] || 0;
};
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>是否开启经验包</h2><span class="sub">Experienced Investigator</span></div>
      <div class="card-body">
        <label class="switch">
          <input type="checkbox" v-model="character.packageEnabled" @change="saveCharacter" />
          <span class="track"></span>
          <span>开启经验包（可选规则：有故事的调查员）</span>
        </label>
        <p class="hint mt-8">经验包来自《调查员手册》，可赋予调查员特定的人生经历、技能、理智损失与背景要求。每个玩家只能选择一个。</p>
      </div>
    </div>

    <template v-if="character.packageEnabled">
      <div class="card mt-16">
        <div class="card-title"><h2>选择经验包</h2></div>
        <div class="card-body">
          <div class="pkg-list">
            <div
              v-for="p in experiencePackages"
              :key="p.id"
              class="pkg-card"
              :class="{ active: character.packageId === p.id }"
              @click="selectPackage(p)"
            >
              <div class="pkg-head">
                <span class="pkg-icon">{{ p.icon }}</span>
                <span class="pkg-name serif">{{ p.name }}</span>
              </div>
              <p class="pkg-desc small dim">{{ p.desc }}</p>
              <p v-if="p.minAgeNote" class="small warn-text">{{ p.minAgeNote }}</p>
            </div>
          </div>

          <p v-if="ageWarn" class="warn-text mt-16">⚠ {{ ageWarn }}</p>
        </div>
      </div>

      <div v-if="currentPackage" class="card mt-16">
        <div class="card-title">
          <h2>{{ currentPackage.name }} · 效果</h2>
        </div>
        <div class="card-body">
          <ul class="effects">
            <li v-if="currentPackage.sanLoss">
              SAN 减少 <b class="danger">{{ character.packageRolls.sanLoss }}</b>（{{ currentPackage.sanLoss }}）
            </li>
            <li v-if="currentPackage.mythos">
              克苏鲁神话技能 <b class="danger">+{{ character.packageRolls.mythos }}</b>（{{ currentPackage.mythosDice }}），最大理智值相应减少
            </li>
            <li v-if="currentPackage.skillsNote">技能增长 {{ currentPackage.skillPoints }} 点：{{ currentPackage.skillsNote }}</li>
            <li>背景增加：<span class="danger">{{ currentPackage.requiredBackgrounds.join('；') }}</span></li>
            <li v-if="currentPackage.immunity" class="dim">{{ currentPackage.immunity }}</li>
          </ul>

          <div v-if="currentPackage.skillPoints > 0" class="mt-16">
            <div class="row">
              <h3>分配经验包技能点</h3>
              <span class="spacer"></span>
              <span class="small">剩余 <b class="accent">{{ remaining }}</b> / {{ currentPackage.skillPoints }}</span>
            </div>
            <div class="pkg-skills">
              <div v-for="(sk, i) in currentPackage.skills" :key="i" class="pkg-skill row">
                <span class="grow">{{ sk.name }}{{ sk.child ? `（${sk.child}）` : '' }}</span>
                <button class="btn sm" @click="subPoint(sk)">−</button>
                <span class="pkg-pts">{{ pointOf(sk) }}</span>
                <button class="btn sm" @click="addPoint(sk)">+</button>
              </div>
            </div>
          </div>

          <div v-if="currentPackage.mythos" class="mt-16">
            <label class="switch">
              <input type="checkbox" v-model="character.believer" @change="saveCharacter" />
              <span class="track"></span>
              <span>「相信者」——当前理智值同样减少神话技能数值</span>
            </label>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pkg-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pkg-card { border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; cursor: pointer; background: var(--surface-2); transition: border-color 0.15s, background 0.15s; }
.pkg-card:hover { border-color: var(--border-strong); }
.pkg-card.active { border-color: var(--accent); background: var(--accent-dim); }
.pkg-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.pkg-icon { font-size: 1.3rem; color: var(--gold); }
.pkg-name { font-size: 1.05rem; color: var(--text); }
.pkg-desc { line-height: 1.5; }
.effects { margin: 0; padding-left: 20px; }
.effects li { margin: 5px 0; }
.pkg-skills { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.pkg-skill { padding: 6px 10px; background: var(--surface-2); border-radius: 8px; }
.pkg-pts { min-width: 40px; text-align: center; font-weight: 600; color: var(--danger); }
@media (max-width: 640px) { .pkg-list { grid-template-columns: 1fr; } }
</style>
