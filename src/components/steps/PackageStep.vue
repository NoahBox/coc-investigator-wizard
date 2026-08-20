<script setup>
import { computed } from 'vue';
import { character, saveCharacter, currentPackage, usedPackagePoints, makeSkillKey } from '../../store.js';
import { experiencePackages } from '../../data/packages.js';
import { rollStr } from '../../data/rules.js';
import { flavorText } from '../../i18n.js';

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
function setPoint(sk, v) {
  const key = makeSkillKey(sk.name, sk.child || null);
  if (v === '' || v == null) {
    character.packageSkillPoints[key] = 0;
    saveCharacter();
    return;
  }
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return;
  const cur = character.packageSkillPoints[key] || 0;
  const max = cur + (currentPackage.value.skillPoints - usedPackagePoints());
  character.packageSkillPoints[key] = Math.max(0, Math.min(max, n));
  saveCharacter();
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
  const note = flavorText(p.minAgeNote);
  if (isNaN(age)) return note;
  return age < p.minAge ? `${note}（当前年龄 ${age} 不满足）` : null;
});

const skillPointsFor = (name, child) => {
  const key = makeSkillKey(name, child || null);
  return character.packageSkillPoints[key] || 0;
};
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>{{ $t('package.title') }}</h2><span class="sub">{{ $t('package.sub') }}</span></div>
      <div class="card-body">
        <label class="switch">
          <input type="checkbox" v-model="character.packageEnabled" @change="saveCharacter" />
          <span class="track"></span>
          <span>{{ $t('package.toggle') }}</span>
        </label>
        <p class="hint mt-8">{{ $t('package.hint') }}</p>
      </div>
    </div>

    <template v-if="character.packageEnabled">
      <div class="card mt-16">
        <div class="card-title"><h2>{{ $t('package.select') }}</h2></div>
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
                <span class="pkg-name serif">{{ $dn(p.name) }}</span>
              </div>
              <p class="pkg-desc small dim">{{ $ft(p.desc) }}</p>
              <p v-if="p.minAgeNote" class="small warn-text">{{ $ft(p.minAgeNote) }}</p>
            </div>
          </div>

          <p v-if="ageWarn" class="warn-text mt-16">{{ $t('package.ageWarn', { msg: ageWarn }) }}</p>
        </div>
      </div>

      <div v-if="currentPackage" class="card mt-16">
        <div class="card-title">
          <h2>{{ $dn(currentPackage.name) }} {{ $t('package.effects') }}</h2>
        </div>
        <div class="card-body">
          <ul class="effects">
            <li v-if="currentPackage.sanLoss">
              {{ $t('package.sanLoss', { now: character.packageRolls.sanLoss, dice: currentPackage.sanLoss }) }}
            </li>
            <li v-if="currentPackage.mythos">
              {{ $t('package.mythos', { now: character.packageRolls.mythos, dice: currentPackage.mythosDice }) }}
            </li>
            <li v-if="currentPackage.skillsNote">{{ $t('package.skillGain', { n: currentPackage.skillPoints, note: $ft(currentPackage.skillsNote) }) }}</li>
            <li>{{ $t('package.backgroundAdd', { list: currentPackage.requiredBackgrounds.map(r => $ft(r)).join('；') }) }}</li>
            <li v-if="currentPackage.immunity" class="dim">{{ $ft(currentPackage.immunity) }}</li>
          </ul>

          <div v-if="currentPackage.skillPoints > 0" class="mt-16">
            <div class="row">
              <h3>{{ $t('package.distribute') }}</h3>
              <span class="spacer"></span>
              <span class="small">{{ $t('package.remaining', { n: remaining }) }} / {{ currentPackage.skillPoints }}</span>
            </div>
            <div class="pkg-skills">
              <div v-for="(sk, i) in currentPackage.skills" :key="i" class="pkg-skill row">
                <span class="grow">{{ $sl(makeSkillKey(sk.name, sk.child || null)) }}</span>
                <button class="btn sm" @click="subPoint(sk)">−</button>
                <input class="pkg-inp" type="number" min="0" :value="pointOf(sk) || ''" placeholder="0" @input="setPoint(sk, $event.target.value)" />
                <button class="btn sm" @click="addPoint(sk)">+</button>
              </div>
            </div>
          </div>

          <div v-if="currentPackage.mythos" class="mt-16">
            <label class="switch">
              <input type="checkbox" v-model="character.believer" @change="saveCharacter" />
              <span class="track"></span>
              <span>{{ $t('package.believer') }}</span>
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
.pkg-inp { width: 64px; text-align: center; background: var(--surface-3); color: var(--text); border: 1px solid var(--border); border-radius: 4px; padding: 4px 6px; font: inherit; font-size: 0.95rem; font-family: Georgia, serif; }
.pkg-inp:focus { border-color: var(--accent); outline: none; }
@media (max-width: 640px) { .pkg-list { grid-template-columns: 1fr; } }
</style>
