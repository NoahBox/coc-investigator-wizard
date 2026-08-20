<script setup>
import { character, saveCharacter } from '../../store.js';

function addRow() { character.relations.push({ character: '', player: '', job: '', relation: '' }); saveCharacter(); }
function removeRow(i) { character.relations.splice(i, 1); saveCharacter(); }
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title">
        <h2>{{ $t('relations.title') }}</h2><span class="sub">{{ $t('relations.sub') }}</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow"><font-awesome-icon icon="fa-solid fa-plus" /></button>
      </div>
      <div class="card-body">
        <table class="grid">
          <thead><tr><th>{{ $t('relations.char') }}</th><th>{{ $t('relations.player') }}</th><th>{{ $t('relations.job') }}</th><th style="width:40%">{{ $t('relations.relation') }}</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in character.relations" :key="i">
              <td><input v-model="row.character" @input="saveCharacter" :placeholder="$t('relations.phChar')" /></td>
              <td><input v-model="row.player" @input="saveCharacter" :placeholder="$t('relations.phPlayer')" /></td>
              <td><input v-model="row.job" @input="saveCharacter" :placeholder="$t('relations.phJob')" /></td>
              <td><input v-model="row.relation" @input="saveCharacter" :placeholder="$t('relations.phRelation')" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(i)"><font-awesome-icon icon="fa-solid fa-trash" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
