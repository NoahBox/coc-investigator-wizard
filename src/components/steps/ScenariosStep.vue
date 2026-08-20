<script setup>
import { character, saveCharacter } from '../../store.js';

function addRow() { character.scenarios.push({ name: '', time: '' }); saveCharacter(); }
function removeRow(i) { character.scenarios.splice(i, 1); saveCharacter(); }
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title">
        <h2>{{ $t('scenarios.title') }}</h2><span class="sub">{{ $t('scenarios.sub') }}</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow"><font-awesome-icon icon="fa-solid fa-plus" /></button>
      </div>
      <div class="card-body">
        <table class="grid">
          <thead><tr><th>{{ $t('scenarios.name') }}</th><th>{{ $t('scenarios.time') }}</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in character.scenarios" :key="i">
              <td><input v-model="row.name" @input="saveCharacter" :placeholder="$t('scenarios.phName')" /></td>
              <td><input v-model="row.time" @input="saveCharacter" :placeholder="$t('scenarios.phTime')" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(i)"><font-awesome-icon icon="fa-solid fa-trash" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
