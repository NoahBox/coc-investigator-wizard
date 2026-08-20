<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter, currentPackage } from '../../store.js';
import { weapons, weaponGroups, weaponGroupOrder, weaponGroupEra, getWeapon } from '../../data/weapons.js';
import { t } from '../../i18n.js';

const selected = ref('');
const search = ref('');
const customName = ref('');

// 分组是否在当前时代可见（标准分组始终可见；时代分组仅对应时代可见）
function groupVisible(g) {
  const era = weaponGroupEra[g];
  if (!era) return true;
  return Array.isArray(era) ? era.includes(character.era) : era === character.era;
}

// 过滤武器（按搜索词 + 时代）
const filteredGroups = computed(() => {
  const q = search.value.trim();
  const result = [];
  weaponGroupOrder.forEach((g) => {
    if (!groupVisible(g)) return;
    const names = weaponGroups[g].filter(n => !q || n.includes(q));
    if (names.length) result.push([g, names]);
  });
  return result;
});

function addWeapon(name) {
  const w = getWeapon(name);
  if (!w) return;
  character.weapons.push({ ...w });
  saveCharacter();
}
function addCustomWeapon() {
    character.weapons.push({ name: t('weapon.customName'), skill: '', dam: '', range: '', round: '', num: '', err: '', price: '', time: '', tho: '', custom: true });
  customName.value = '';
  saveCharacter();
}
function removeWeapon(i) {
  character.weapons.splice(i, 1);
  saveCharacter();
}

// 经验包自动添加武器
const autoWeapons = computed(() => currentPackage.value?.autoWeapons || []);
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>{{ $t('weapon.title') }}</h2><span class="sub">{{ $t('weapon.sub') }}</span></div>
      <div class="card-body">
        <div class="row wrap mb-16">
          <input class="inp" style="max-width:220px" v-model="search" :placeholder="$t('weapon.searchPh')" />
          <select class="inp grow" v-model="selected">
            <option value="" disabled>{{ $t('weapon.select') }}</option>
            <optgroup v-for="[g, names] in filteredGroups" :key="g" :label="g">
              <option v-for="n in names" :key="n" :value="n">{{ n }}</option>
            </optgroup>
          </select>
          <button class="btn primary" :disabled="!selected" @click="addWeapon(selected); selected=''"><font-awesome-icon icon="fa-solid fa-plus" />{{ $t('weapon.add') }}</button>
          <button class="btn" @click="addCustomWeapon"><font-awesome-icon icon="fa-solid fa-plus" />{{ $t('weapon.custom') }}</button>
        </div>

        <table class="grid" v-if="character.weapons.length">
          <thead>
            <tr><th>{{ $t('weapon.name') }}</th><th>{{ $t('weapon.skill') }}</th><th>{{ $t('weapon.dam') }}</th><th>{{ $t('weapon.range') }}</th><th>{{ $t('weapon.tho') }}</th><th>{{ $t('weapon.round') }}</th><th>{{ $t('weapon.ammo') }}</th><th>{{ $t('weapon.err') }}</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="(w, i) in character.weapons" :key="i">
              <td>
                <input v-if="w.custom" class="inp wep-inp" v-model="w.name" @input="saveCharacter" :placeholder="$t('weapon.phName')" />
                <template v-else>{{ w.name }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.skill" @input="saveCharacter" :placeholder="$t('weapon.phSkill')" />
                <template v-else>{{ w.skill }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.dam" @input="saveCharacter" :placeholder="$t('weapon.phDam')" />
                <template v-else>{{ w.dam }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.range" @input="saveCharacter" :placeholder="$t('weapon.phRange')" />
                <template v-else>{{ w.range }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.tho" @input="saveCharacter" :placeholder="$t('weapon.phTho')" />
                <template v-else>{{ w.tho ? $t('weapon.yes') : 0 }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.round" @input="saveCharacter" :placeholder="$t('weapon.phRound')" />
                <template v-else>{{ w.round }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.num" @input="saveCharacter" :placeholder="$t('weapon.phAmmo')" />
                <template v-else>{{ w.num }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.err" @input="saveCharacter" :placeholder="$t('weapon.phErr')" />
                <template v-else>{{ w.err }}</template>
              </td>
              <td><button class="btn sm ghost danger" @click="removeWeapon(i)">⨉</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">{{ $t('weapon.empty') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wep-inp { width: 100%; min-width: 56px; padding: 4px 6px; }
</style>
