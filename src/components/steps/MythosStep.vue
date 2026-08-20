<script setup>
import { character, saveCharacter } from '../../store.js';

function addRow(list) { list.push({ name: '' }); saveCharacter(); }
function removeRow(list, i) { list.splice(i, 1); saveCharacter(); }

import { t } from '../../i18n.js';
const sections = [
  { title: () => t('mythos.s1'), sub: t('mythos.s1Sub'), list: () => character.mythosItems, ph: t('mythos.s1Ph') },
  { title: () => t('mythos.s2'), sub: t('mythos.s2Sub'), list: () => character.spells, ph: t('mythos.s2Ph') },
  { title: () => t('mythos.s3'), sub: t('mythos.s3Sub'), list: () => character.contacts, ph: t('mythos.s3Ph') },
];
</script>

<template>
  <div class="step fade-in">
    <div v-for="s in sections" :key="s.title" class="card" :class="{ 'mt-16': s !== sections[0] }">
      <div class="card-title">
        <h2>{{ s.title() }}</h2><span class="sub">{{ s.sub }}</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow(s.list())"><font-awesome-icon icon="fa-solid fa-plus" /></button>
      </div>
      <div class="card-body">
        <table class="grid">
          <tbody>
            <tr v-for="(row, i) in s.list()" :key="i">
              <td><input v-model="row.name" @input="saveCharacter" :placeholder="s.ph" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(s.list(), i)"><font-awesome-icon icon="fa-solid fa-trash" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
