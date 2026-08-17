<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter, currentPackage } from '../../store.js';
import { weapons, weaponGroups, weaponGroupOrder, getWeapon } from '../../data/weapons.js';

const selected = ref('');
const search = ref('');

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

        <table class="grid" v-if="character.weapons.length">
          <thead>
            <tr><th>武器</th><th>技能</th><th>伤害</th><th>射程</th><th>次数</th><th>弹药</th><th>故障</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="(w, i) in character.weapons" :key="i">
              <td>{{ w.name }}</td>
              <td class="small">{{ w.skill }}</td>
              <td class="small">{{ w.dam }}</td>
              <td class="small">{{ w.range }}</td>
              <td class="small">{{ w.round }}</td>
              <td class="small">{{ w.num }}</td>
              <td class="small">{{ w.err }}</td>
              <td><button class="btn sm ghost danger" @click="removeWeapon(i)">移除</button></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">尚未添加武器</div>
      </div>
    </div>
  </div>
</template>
