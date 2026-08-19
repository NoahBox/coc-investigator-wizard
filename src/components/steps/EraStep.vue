<script setup>
import { computed } from 'vue';
import { character, saveCharacter } from '../../store.js';
import { getEra, eraArmor, eraShields, eraFeatures, eraDiceTables, eraSkillBaseAdjust, eraFactions, shieldWeaponNames, ARMOR_ERAS } from '../../data/eras.js';
import { getWeapon } from '../../data/weapons.js';
import { ATTR_LABELS } from '../../data/rules.js';

const era = computed(() => getEra(character.era));
// 古代设定（不败 / 黑暗 / 冰岛）可选择防具与盾牌
const hasArmor = computed(() => ARMOR_ERAS.includes(character.era));
const features = computed(() => eraFeatures[character.era] || []);

// 当前时代可选的派系（伊卡洛斯船员派系）
const factions = computed(() => eraFactions[character.era] || []);
function selectFaction(name) {
  character.eraFaction = name;
  saveCharacter();
}

// 当前时代的技能初始值调整（已自动应用并随时代切换清除）
const baseAdjust = computed(() => eraSkillBaseAdjust[character.era] || {});
const hasBaseAdjust = computed(() => Object.keys(baseAdjust.value).length > 0);

// 当前时代的掷骰表（出生预兆 / 大事记）；仅 不败 / 黑暗 拥有
const diceTable = computed(() => eraDiceTables[character.era] || null);
// 当前时代已掷出的结果
const currentRoll = computed(() => {
  const eff = character.eraEffects?.[character.era];
  if (!eff || !eff.dice) return null;
  const entry = diceTable.value?.entries?.[eff.dice - 1] || null;
  return { dice: eff.dice, entry };
});

// 修正摘要（如 +10「战术」-10「话术」）
function effectSummary(entry) {
  if (!entry) return '';
  const parts = [];
  Object.entries(entry.attr || {}).forEach(([k, v]) => parts.push(`${v > 0 ? '+' : ''}${v} ${ATTR_LABELS[k] || k}`));
  Object.entries(entry.skill || {}).forEach(([k, v]) => parts.push(`${v > 0 ? '+' : ''}${v}「${k}」`));
  return parts.join('，');
}

// 掷 1D10 并应用/存储该条目的数值修正（覆盖旧结果）
function rollEraDice() {
  const table = diceTable.value;
  if (!table || !table.entries.length) return;
  const dice = Math.floor(Math.random() * table.entries.length) + 1;
  const entry = table.entries[dice - 1];
  character.eraEffects[character.era] = {
    dice,
    attr: entry.attr || {},
    skill: entry.skill || {},
  };
  saveCharacter();
}

// 清除当前时代的掷骰修正
function clearEraDice() {
  if (!character.eraEffects) character.eraEffects = {};
  delete character.eraEffects[character.era];
  saveCharacter();
}

// 盾牌武器名由 eras.js 的 shieldWeaponNames 提供（切换时代时用于移除武器列表中的盾牌）

function selectArmor(name) {
  character.eraArmor = name;
  saveCharacter();
}

function selectShield(name) {
  // 切换盾牌时，先移除旧盾牌武器，再加入新盾牌武器
  character.weapons = character.weapons.filter(w => !shieldWeaponNames.includes(w.name));
  if (name) {
    const w = getWeapon(name);
    if (w) character.weapons.push({ ...w });
  }
  character.eraShield = name;
  saveCharacter();
}

function selectNoShield() {
  selectShield('');
}
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title">
        <h2>时代特性</h2>
        <span class="sub">Era Features</span>
        <span class="spacer"></span>
        <span v-if="era" class="serif accent">{{ era.label }}</span>
      </div>
      <div class="card-body">
        <!-- 防具与盾牌（克苏鲁不败 / 黑暗时代 / 神秘冰岛） -->
        <template v-if="hasArmor">
          <div class="grid-2 mt-16">
            <div>
              <label class="lbl">防具</label>
              <div class="pick-list">
                <div
                  class="pick-item"
                  :class="{ active: character.eraArmor === a.name }"
                  v-for="a in eraArmor"
                  :key="a.name"
                  @click="selectArmor(a.name)"
                >
                  <span class="grow">{{ a.name }}</span>
                  <span class="small dim">护甲 {{ a.armor }}</span>
                </div>
                <div
                  class="pick-item"
                  :class="{ active: !character.eraArmor }"
                  @click="selectArmor('')"
                >
                  <span class="grow">无（普通衣物）</span>
                  <span class="small dim">护甲 0</span>
                </div>
              </div>
              <p class="hint mt-8">每次成功攻击时按所列骰值投掷可变护甲。</p>
            </div>

            <div>
              <label class="lbl">盾牌</label>
              <div class="pick-list">
                <div
                  class="pick-item"
                  :class="{ active: !character.eraShield }"
                  @click="selectNoShield"
                >
                  <span class="grow">不使用盾牌</span>
                </div>
                <div
                  class="pick-item"
                  :class="{ active: character.eraShield === s.name }"
                  v-for="s in eraShields"
                  :key="s.name"
                  @click="selectShield(s.name)"
                >
                  <span class="grow">{{ s.name }}</span>
                  <span class="small dim">护甲 {{ s.armor }} · 伤害 {{ s.dam }}<template v-if="s.str !== '-'"> · {{ s.str }}/{{ s.dex }}</template></span>
                </div>
              </div>
              <p class="hint mt-8">选择盾牌后会自动添加进「武器」列表（使用「格斗（盾）」技能）；战斗中可用「格斗（盾）」代替闪避，失败也能获得盾牌护甲。</p>
            </div>
          </div>
        </template>

        <!-- 出生预兆 / 大事记 掷骰表（克苏鲁不败 / 黑暗时代） -->
        <div v-if="diceTable" class="dice-panel mt-16">
          <div class="dice-head">
            <span class="serif">{{ diceTable.title }}（1D10）</span>
            <button class="btn primary" @click="rollEraDice"><font-awesome-icon icon="fa-solid fa-dice" />掷骰 1D10</button>
          </div>
          <p class="hint">{{ diceTable.desc }}</p>

          <div v-if="currentRoll" class="dice-result">
            <span>
              结果 <b class="accent">{{ currentRoll.dice }}</b> — {{ currentRoll.entry.text }}
              <span class="small dim">（已应用 {{ effectSummary(currentRoll.entry) }}）</span>
            </span>
            <button class="btn sm ghost danger" @click="clearEraDice">清除修正</button>
          </div>
          <p v-else class="small dim mt-8">尚未掷骰 —— 点击上方按钮随机抽取一项并自动应用数值变化。</p>

          <ul class="dice-list">
            <li v-for="(e, i) in diceTable.entries" :key="i" :class="{ active: currentRoll && currentRoll.dice === i + 1 }">
              <span class="dice-num">{{ i + 1 }}</span>
              <span>{{ e.text }}</span>
              <span class="dim">{{ e.note }}</span>
            </li>
          </ul>
        </div>

        <!-- 派系选择（克苏鲁伊卡洛斯：船员派系） -->
        <div v-if="factions.length" class="mt-16">
          <label class="lbl">船员派系</label>
          <div class="pick-list">
            <div
              class="pick-item"
              :class="{ active: !character.eraFaction }"
              @click="selectFaction('')"
            >
              <span class="grow">未指定</span>
            </div>
            <div
              class="pick-item"
              :class="{ active: character.eraFaction === f.name }"
              v-for="f in factions"
              :key="f.name"
              @click="selectFaction(f.name)"
            >
              <span class="grow">{{ f.name }}</span>
              <span class="small dim">{{ f.desc }}</span>
            </div>
          </div>
        </div>

        <!-- 技能初始值调整（已自动应用，切换时代即清除） -->
        <div v-if="hasBaseAdjust" class="mt-16">
          <label class="lbl">技能初始值调整</label>
          <ul class="feat-list">
            <li v-for="(v, name) in baseAdjust" :key="name">
              「{{ name }}」基础值 → <b>{{ v }}%</b>
            </li>
          </ul>
        </div>

        <!-- 时代专属规则说明 -->
        <div v-if="features.length" class="mt-16">
          <label class="lbl">时代规则</label>
          <ul class="feat-list">
            <li v-for="(f, i) in features" :key="i">{{ f }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pick-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.pick-item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm, 8px);
  background: var(--surface-2); cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.pick-item:hover { border-color: var(--border-strong); }
.pick-item.active { border-color: var(--accent); background: var(--accent-dim); }
.feat-list { margin: 8px 0 0; padding-left: 20px; line-height: 1.7; }
.feat-list li { margin: 4px 0; }

/* 掷骰表（出生预兆 / 大事记） */
.dice-panel { border: 1px dashed var(--border-strong); border-radius: var(--radius, 10px); padding: 14px 16px; }
.dice-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.dice-head .serif { font-size: 1.05rem; color: var(--text); }
.dice-result {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  margin-top: 10px; padding: 9px 12px; border: 1px solid var(--accent); border-radius: 8px;
  background: var(--accent-dim); color: var(--text);
}
.dice-list { margin: 12px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
.dice-list li {
  display: flex; align-items: baseline; gap: 10px; padding: 4px 8px;
  border-radius: 6px; border: 1px solid transparent; color: var(--text-dim);
}
.dice-list li.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-strong); font-weight: 600; }
.dice-num { flex: none; font-family: Georgia, serif; color: var(--text-faint); font-size: 0.85rem; }
</style>
