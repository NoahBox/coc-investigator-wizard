<script setup>
import { computed } from 'vue';
import { character, saveCharacter, creditRatingValue, livingStandard, cashInfo, currency, creditRange, eraCredit } from '../../store.js';
import { creditBracket, getEra } from '../../data/eras.js';
import { t, dataName, flavorText } from '../../i18n.js';

function addRow(list) { list.push({ name: '' }); saveCharacter(); }
function removeRow(list, i) { list.splice(i, 1); saveCharacter(); }

// 时代信用评级特殊定义（有定义的时代替换原本的现金/消费水平展示）
const creditDef = computed(() => eraCredit.value);
const crVal = computed(() => creditRatingValue.value);
const bracket = computed(() => creditBracket(creditDef.value, crVal.value));
const eraLabel = computed(() => {
  if (character.era === '1920s') return '1920s';
  if (character.era === 'modern') return dataName('现代');
  const e = getEra(character.era);
  return e ? dataName(e.label) : character.era;
});

// 表内字段可能是函数（按信用评级动态计算）或静态文本
function fmtVal(v) {
  if (v == null) return '';
  return typeof v === 'function' ? v(crVal.value) : v;
}
// 现金/资产真实值：函数返回数值 → 加英镑符号；静态文本（如 5先令/没有）原样返回
function fmtCash(v) {
  if (v == null) return '';
  const r = typeof v === 'function' ? v(crVal.value) : v;
  return typeof r === 'number' ? '£' + r : r;
}
// 参考表单元格：真实值 +（公式），如 £300（CR×10）
function tableCell(v, expr) {
  const val = fmtCash(v);
  return expr ? `${val}（${flavorText(expr)}）` : val;
}
// 参考表首列：信用评级范围 / 地位值
function rangeLabel(b) {
  if (b.min === b.max) return String(b.min);
  if (b.min === -Infinity) return `≤${b.max}`;
  return `${b.min}–${b.max}`;
}
</script>

<template>
  <div class="step fade-in">
    <!-- 物品与装备 -->
    <div class="card">
      <div class="card-title">
        <h2>{{ $t('items.title') }}</h2><span class="sub">{{ $t('items.sub') }}</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow(character.items)"><font-awesome-icon icon="fa-solid fa-plus" /></button>
      </div>
      <div class="card-body">
        <table class="grid">
          <tbody>
            <tr v-for="(row, i) in character.items" :key="i">
              <td><input v-model="row.name" @input="saveCharacter" :placeholder="$t('items.ph')" /></td>
              <td style="width:60px"><button class="btn sm ghost danger" @click="removeRow(character.items, i)"><font-awesome-icon icon="fa-solid fa-trash" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 资产 -->
    <div class="card mt-16">
      <div class="card-title">
        <h2>{{ $t('items.assetsTitle') }}</h2><span class="sub">{{ $t('items.assetsSub') }}</span>
        <span class="spacer"></span>
        <button class="btn sm" @click="addRow(character.assetsRows)"><font-awesome-icon icon="fa-solid fa-plus" /></button>
      </div>
      <div class="card-body">
        <div class="grid-3 mb-16">
          <!-- 信用评级 / 地位（时代特殊定义） -->
          <div class="stat-card">
            <div class="stat-label faint small">{{ creditDef ? $dn(creditDef.label) : $t('items.credit') }}</div>
            <div class="stat-val serif">{{ creditRatingValue }}</div>
            <div class="small dim">{{ eraLabel }}</div>
          </div>

          <!-- 现金 / 时代特殊内容 -->
          <template v-if="creditDef">
            <!-- 以物易物（不败 / 黑暗 / 冰岛）：无现金 -->
            <div v-if="creditDef.kind === 'barter' || creditDef.kind === 'status-table'" class="stat-card">
              <div class="stat-label faint small">{{ $t('items.econ') }}</div>
              <div class="stat-val serif">{{ $t('items.barter') }}</div>
              <div class="small dim">{{ $ft(creditDef.currency) }}</div>
            </div>
            <!-- 煤气灯：现金（收入）按英镑表，显示真实计算值 -->
            <div v-else-if="creditDef.kind === 'cash-table'" class="stat-card">
              <div class="stat-label faint small">{{ $t('items.cashPound') }}</div>
              <div class="stat-val serif gold">{{ fmtCash(bracket && bracket.cash) }}</div>
              <div class="small dim">{{ bracket ? $dn(bracket.name) + (bracket.cashExpr ? ' · ' + bracket.cashExpr : '') : '' }}</div>
            </div>
            <!-- 末日：交换资产 -->
            <div v-else class="stat-card">
              <div class="stat-label faint small">{{ $t('items.barterAssets') }}</div>
              <div class="stat-val serif">{{ bracket ? bracket.name : '' }}</div>
            </div>
          </template>
          <!-- 标准时代：现金 -->
          <div v-else class="stat-card">
            <div class="stat-label faint small">{{ $t('items.cash', { cur: $dn(currency.name) }) }}</div>
            <div class="stat-val serif gold">{{ currency.symbol }} {{ cashInfo.amount }}</div>
          </div>

          <!-- 消费水平 / 时代特殊内容 -->
          <template v-if="creditDef">
            <!-- 不败 / 黑暗：无消费水平 -->
            <div v-if="creditDef.kind === 'barter'" class="stat-card">
              <div class="stat-label faint small">{{ $t('items.spending') }}</div>
              <div class="stat-val serif" style="font-size:1.1rem">{{ $t('items.noSpending') }}</div>
              <div class="small dim">{{ $t('items.spendingNote', { label: $dn(creditDef.label) }) }}</div>
            </div>
            <!-- 冰岛：社会地位表 -->
            <div v-else-if="creditDef.kind === 'status-table'" class="stat-card">
              <div class="stat-label faint small">{{ $t('items.status') }}</div>
              <div class="stat-val serif" style="font-size:1.2rem">{{ bracket ? bracket.label : '' }}</div>
              <div class="small dim">{{ $t('items.statusVal', { v: crVal }) }}</div>
            </div>
            <!-- 煤气灯：消费水平（每天） -->
            <div v-else-if="creditDef.kind === 'cash-table'" class="stat-card">
              <div class="stat-label faint small">{{ $t('items.spendingDay') }}</div>
              <div class="stat-val serif">{{ fmtVal(bracket && bracket.spending) }}</div>
              <div class="small dim">{{ bracket ? bracket.name : '' }}</div>
            </div>
            <!-- 末日：信用评级含义 -->
            <div v-else class="stat-card">
              <div class="stat-label faint small">{{ $t('items.meaning') }}</div>
              <div class="stat-val serif" style="font-size:1rem">{{ $t('items.valuableItems') }}</div>
              <div class="small dim">{{ $t('items.creditAbstract') }}</div>
            </div>
          </template>
          <!-- 标准时代：消费水平 -->
          <div v-else class="stat-card">
            <div class="stat-label faint small">{{ $t('items.spending') }}</div>
            <div class="stat-val serif">{{ $dn(livingStandard.name) }}</div>
            <div class="small dim">{{ $ft(livingStandard.desc) }}</div>
          </div>
        </div>

        <!-- 时代信用评级特殊定义：说明 + 参考表 -->
        <div v-if="creditDef" class="era-credit-box">
          <p class="era-credit-note">{{ $ft(creditDef.note) }}</p>
          <table v-if="creditDef.table" class="era-credit-table">
            <thead>
              <tr>
                <th>{{ creditDef.kind === 'status-table' ? $t('items.thStatusVal') : $t('items.thCredit') }}</th>
                <th v-if="creditDef.kind === 'cash-table'">{{ $t('items.thCash') }}</th>
                <th v-if="creditDef.kind === 'cash-table'">{{ $t('items.thAssets') }}</th>
                <th v-if="creditDef.kind === 'cash-table'">{{ $t('items.thSpending') }}</th>
                <th v-if="creditDef.kind === 'barter-assets'">{{ $t('items.thBarterAssets') }}</th>
                <th v-if="creditDef.kind === 'status-table'">{{ $t('items.thStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, i) in creditDef.table" :key="i" :class="{ cur: bracket === b }">
                <td>{{ creditDef.kind === 'status-table' ? rangeLabel(b) : $dn(b.name) }}</td>
                <td v-if="creditDef.kind === 'cash-table'">{{ tableCell(b.cash, b.cashExpr) }}</td>
                <td v-if="creditDef.kind === 'cash-table'">{{ tableCell(b.assets, b.assetsExpr) }}</td>
                <td v-if="creditDef.kind === 'cash-table'">{{ b.spending }}</td>
                <td v-if="creditDef.kind === 'barter-assets'">{{ $ft(b.assets) }}</td>
                <td v-if="creditDef.kind === 'status-table'">{{ $dn(b.label) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <table class="grid">
          <thead><tr><th>{{ $t('items.assets') }}</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in character.assetsRows" :key="i">
              <td><input v-model="row.name" @input="saveCharacter" :placeholder="$t('items.assetsPh')" /></td>
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
.era-credit-box {
  border: 1px solid var(--border); border-radius: var(--radius-sm, 8px);
  background: var(--surface-1); padding: 12px 16px; margin-bottom: 16px;
}
.era-credit-note { margin: 0 0 8px; font-size: 0.82rem; line-height: 1.7; color: var(--text-dim); }
.era-credit-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.era-credit-table th, .era-credit-table td {
  border: 1px solid var(--border); padding: 4px 8px; text-align: left; vertical-align: top;
}
.era-credit-table th { background: var(--surface-2); font-weight: 600; white-space: nowrap; }
.era-credit-table td { color: var(--text-dim); }
.era-credit-table tr.cur td {
  border-color: var(--accent); background: var(--accent-dim); color: var(--text); font-weight: 600;
}
</style>
