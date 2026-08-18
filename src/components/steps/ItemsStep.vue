<script setup>
import { computed } from 'vue';
import { character, saveCharacter, creditRatingValue, livingStandard, cashInfo, currency, creditRange } from '../../store.js';

function addRow(list) { list.push({ name: '' }); saveCharacter(); }
function removeRow(list, i) { list.splice(i, 1); saveCharacter(); }

const rangeText = computed(() => `信用评级范围 ${creditRange.value[0]}–${creditRange.value[1]}`);
</script>

<template>
  <div class="step fade-in">
    <!-- 物品与装备 -->
    <div class="card">
      <div class="card-title">
        <h2>物品与装备</h2><span class="sub">Possessions & Equipment</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow(character.items)"><font-awesome-icon icon="fa-solid fa-plus" /></button>
      </div>
      <div class="card-body">
        <table class="grid">
          <tbody>
            <tr v-for="(row, i) in character.items" :key="i">
              <td><input v-model="row.name" @input="saveCharacter" placeholder="物品名称" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(character.items, i)"><font-awesome-icon icon="fa-solid fa-trash" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 资产 -->
    <div class="card mt-16">
      <div class="card-title">
        <h2>资产</h2><span class="sub">Cash & Assets</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow(character.assetsRows)"><font-awesome-icon icon="fa-solid fa-plus" /></button>
      </div>
      <div class="card-body">
        <div class="grid-3 mb-16">
          <div class="stat-card">
            <div class="stat-label faint small">信用评级（{{ rangeText }}）</div>
            <div class="stat-val serif">{{ creditRatingValue }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label faint small">现金（{{ currency.name }}）</div>
            <div class="stat-val serif gold">{{ currency.symbol }} {{ cashInfo.amount }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label faint small">消费水平</div>
            <div class="stat-val serif">{{ livingStandard.name }}</div>
            <div class="small dim">{{ livingStandard.desc }}</div>
          </div>
        </div>

        <table class="grid">
          <thead><tr><th>资产</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in character.assetsRows" :key="i">
              <td><input v-model="row.name" @input="saveCharacter" placeholder="资产名称（如房产、车辆）" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(character.assetsRows, i)"><font-awesome-icon icon="fa-solid fa-trash" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card { background: var(--surface-2); border-radius: var(--radius); padding: 14px 16px; }
.stat-val { font-size: 1.5rem; margin: 4px 0; }
</style>
