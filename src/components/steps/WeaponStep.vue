<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter, currentPackage } from '../../store.js';
import { weapons, weaponGroups, weaponGroupOrder, getWeapon } from '../../data/weapons.js';

const selected = ref('');
const search = ref('');
const customName = ref('');

// 过滤武器（按搜索词）
const filteredGroups = computed(() => {
  const q = search.value.trim();
  const result = [];
  weaponGroupOrder.forEach((g) => {
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
  const name = customName.value.trim() || '自定义武器';
  character.weapons.push({ name, skill: '', dam: '', range: '', round: '', num: '', err: '', price: '', time: '', tho: 0, custom: true });
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
      <div class="card-title"><h2>武器</h2><span class="sub">Weapons</span></div>
      <div class="card-body">
        <div class="row wrap mb-16">
          <input class="inp" style="max-width:220px" v-model="search" placeholder="搜索武器名称…" />
          <select class="inp grow" v-model="selected">
            <option value="" disabled>选择武器…</option>
            <optgroup v-for="[g, names] in filteredGroups" :key="g" :label="g">
              <option v-for="n in names" :key="n" :value="n">{{ n }}</option>
            </optgroup>
          </select>
          <button class="btn primary" :disabled="!selected" @click="addWeapon(selected); selected=''">+ 添加</button>
        </div>

        <div class="row wrap mb-16">
          <input class="inp grow" style="max-width:320px" v-model="customName" placeholder="自定义武器名称…" @keyup.enter="addCustomWeapon" />
          <button class="btn" @click="addCustomWeapon">+ 添加自定义武器</button>
          <span class="hint small">自定义武器添加后可直接在表格中编辑各项数值。</span>
        </div>

        <table class="grid" v-if="character.weapons.length">
          <thead>
            <tr><th>武器</th><th>技能</th><th>伤害</th><th>射程</th><th>贯穿</th><th>次数</th><th>弹药</th><th>故障</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="(w, i) in character.weapons" :key="i">
              <td>
                <input v-if="w.custom" class="inp wep-inp" v-model="w.name" @input="saveCharacter" placeholder="武器名" />
                <template v-else>{{ w.name }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.skill" @input="saveCharacter" placeholder="使用技能" />
                <template v-else>{{ w.skill }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.dam" @input="saveCharacter" placeholder="伤害" />
                <template v-else>{{ w.dam }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.range" @input="saveCharacter" placeholder="射程" />
                <template v-else>{{ w.range }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" type="number" min="0" v-model.number="w.tho" @input="saveCharacter" title="贯穿（0=否，1=是）" />
                <template v-else>{{ w.tho ? '是' : '' }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.round" @input="saveCharacter" placeholder="次数" />
                <template v-else>{{ w.round }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.num" @input="saveCharacter" placeholder="弹药" />
                <template v-else>{{ w.num }}</template>
              </td>
              <td class="small">
                <input v-if="w.custom" class="inp wep-inp" v-model="w.err" @input="saveCharacter" placeholder="故障" />
                <template v-else>{{ w.err }}</template>
              </td>
              <td><button class="btn sm ghost danger" @click="removeWeapon(i)">移除</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">尚未添加武器</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wep-inp { width: 100%; min-width: 56px; padding: 4px 6px; }
</style>
