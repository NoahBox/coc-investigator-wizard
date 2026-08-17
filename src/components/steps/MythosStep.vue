<script setup>
import { character, saveCharacter } from '../../store.js';

function addRow(list) { list.push({ name: '' }); saveCharacter(); }
function removeRow(list, i) { list.splice(i, 1); saveCharacter(); }

const sections = [
  { title: '魔法物品与典籍', sub: 'Tomes & Artifacts', list: () => character.mythosItems, ph: '魔法物品/典籍名称' },
  { title: '法术', sub: 'Spells', list: () => character.spells, ph: '法术名称' },
  { title: '第三类接触', sub: 'Encounters', list: () => character.contacts, ph: '接触的怪异存在' },
];
</script>

<template>
  <div class="step fade-in">
    <div v-for="s in sections" :key="s.title" class="card" :class="{ 'mt-16': s !== sections[0] }">
      <div class="card-title">
        <h2>{{ s.title }}</h2><span class="sub">{{ s.sub }}</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow(s.list())">+ 添加行</button>
      </div>
      <div class="card-body">
        <table class="grid">
          <thead><tr><th>内容</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in s.list()" :key="i">
              <td><input v-model="row.name" @input="saveCharacter" :placeholder="s.ph" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(s.list(), i)">×</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
