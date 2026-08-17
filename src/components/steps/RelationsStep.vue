<script setup>
import { character, saveCharacter } from '../../store.js';

function addRow() { character.relations.push({ character: '', player: '', job: '', relation: '' }); saveCharacter(); }
function removeRow(i) { character.relations.splice(i, 1); saveCharacter(); }
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title">
        <h2>人物关系</h2><span class="sub">Fellow Investigators & Connections</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow">+ 添加行</button>
      </div>
      <div class="card-body">
        <table class="grid">
          <thead><tr><th>角色</th><th>玩家</th><th>职业</th><th style="width:40%">关系</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in character.relations" :key="i">
              <td><input v-model="row.character" @input="saveCharacter" placeholder="角色名" /></td>
              <td><input v-model="row.player" @input="saveCharacter" placeholder="玩家" /></td>
              <td><input v-model="row.job" @input="saveCharacter" placeholder="职业" /></td>
              <td><input v-model="row.relation" @input="saveCharacter" placeholder="与你的关系" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(i)">×</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
