<script setup>
import { ref, computed, watch } from 'vue';
import { character, saveCharacter, currentJob, splitSkillKey } from '../../store.js';
import { jobGroups, EXP_BOOKS, getExpBooks, eraJobGroups } from '../../data/jobs.js';
import { ERAS, shieldWeaponNames } from '../../data/eras.js';
import { ATTR_LABELS, ATTR_KEYS } from '../../data/rules.js';
import { t, dataName, dataNameWithTag, skillLabel, locale } from '../../i18n.js';
import AvatarCropper from '../AvatarCropper.vue';

const countries = ['美国', '中国', '日本'];
const eras = [
  { v: 'modern', label: () => dataName('现代'), desc: '' },
  { v: '1920s', label: () => '1920s', desc: '' },
  ...ERAS.map(e => ({ v: e.id, label: () => dataName(e.short), desc: e.desc })),
];

// 按扩展书开关过滤职业列表：关闭某来源的开关后，该来源（及同时带有该标记）的职业不再出现在下拉框
const filteredJobGroups = computed(() => {
  const result = jobGroups
    .map(([group, list]) => [group, list.filter((j) => {
      const books = getExpBooks(j);
      if (!books.length) return true; // 基础职业始终显示
      return books.every((b) => character.expBooks[b] !== false);
    })])
    .filter(([, list]) => list.length > 0);
  // 选择了扩展时代：自动将该时代的范例职业组附加到列表末尾
  const eraGroup = eraJobGroups[character.era];
  if (eraGroup && eraGroup.jobs.length) result.push([eraGroup.label, eraGroup.jobs]);
  return result;
});

// 切换时代：清除先前时代保存的数据（掷骰修正/派系/防具/盾牌/盾牌武器），
// 若当前职业不属于新时代的可见列表则清空（避免残留其他时代的职业）
watch(() => character.era, () => {
  character.eraEffects = {};
  character.eraFaction = '';
  character.eraArmor = '';
  character.eraShield = '';
  character.weapons = (character.weapons || []).filter(w => !shieldWeaponNames.includes(w.name));
  if (!character.jobName) return;
  const visible = new Set();
  filteredJobGroups.value.forEach(([, list]) => list.forEach((j) => visible.add(j)));
  if (!visible.has(character.jobName)) character.jobName = '';
});

// 神秘冰岛：无职业模板（提示文案）
const isIcelandFree = computed(() => character.era === 'iceland');

function showName(name) { return (name || '').replace(/Ω/g, ''); }

// 格式化本职技能列表
function formatSkills(job) {
  if (!job || !job.skills) return '';
  const sep = locale.code === 'zh' ? '、' : '; ';
  return job.skills.map((sk) => {
    if (typeof sk === 'string') return dataName(sk);
    if (Array.isArray(sk)) {
      const opts = sk.map((o) => {
        if (typeof o === 'string') return dataName(o);
        const key = Object.keys(o)[0];
        const child = o[key];
        return child ? skillLabel(`${key}(${child})`) : dataName(key);
      });
      return opts.join(' / ') + '(' + t('basic.anyOne') + ')';
    }
    const key = Object.keys(sk)[0];
    const child = sk[key];
    const { name, child: keyChild } = splitSkillKey(key);
    if (child) return skillLabel(`${name}(${child})`);
    if (keyChild) return skillLabel(`${name}(${keyChild})`);
    return dataName(name);
  }).join(sep);
}

// 格式化职业技能点数计算方式
function formatPointFormula(job) {
  if (!job || !job.point) return '';
  return job.point.map((unitGroup) => {
    if (unitGroup.length === 1) {
      const [attrKey, mult] = unitGroup[0];
      return `${dataName(ATTR_LABELS[attrKey])}×${mult}`;
    }
    const opts = unitGroup.map(([attrKey, mult]) => `${dataName(ATTR_LABELS[attrKey])}×${mult}`);
    return `（${opts.join(' ' + t('basic.or') + ' ')}）`;
  }).join(' + ');
}

// 头像上传与裁剪
const fileInput = ref(null);
const cropSrc = ref('');
const cropperOpen = ref(false);

function pickAvatar() { fileInput.value?.click(); }
function onFileChange(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { cropSrc.value = reader.result; cropperOpen.value = true; };
  reader.readAsDataURL(file);
}
function onCropConfirm(dataUrl) {
  character.avatar = dataUrl;
  cropperOpen.value = false;
  cropSrc.value = '';
  saveCharacter();
}
function removeAvatar() {
  character.avatar = '';
  saveCharacter();
}
</script>

<template>
  <div class="step fade-in">
    <div class="card">
      <div class="card-title"><h2>{{ $t('basic.title') }}</h2><span class="sub">{{ $t('basic.sub') }}</span></div>
      <div class="card-body">
        <!-- 头像 + 基本信息（头像在 grid-2 / grid-3 左侧） -->
        <div class="basic-top">
          <div class="avatar-col">
            <div class="avatar-preview" @click="pickAvatar" :title="$t('basic.avatarClick')">
              <img v-if="character.avatar" :src="character.avatar" :alt="$t('basic.avatarAlt')" />
              <span v-else class="avatar-placeholder">☽<br /><small>{{ $t('basic.avatarUpload').split('\n')[1] || $t('basic.avatarClick') }}</small></span>
            </div>
          </div>
          <div class="basic-main">
            <div class="grid-2">
              <div>
                <label class="lbl">{{ $t('basic.name') }}</label>
                <input class="inp" v-model="character.name" @input="saveCharacter" :placeholder="$t('basic.namePh')" />
              </div>
              <div>
                <label class="lbl">{{ $t('basic.player') }}</label>
                <input class="inp" v-model="character.player" @input="saveCharacter" :placeholder="$t('basic.playerPh')" />
              </div>
            </div>

            <div class="grid-3">
              <div>
                <label class="lbl">{{ $t('basic.age') }}</label>
                <input class="inp" type="number" min="1" max="120" v-model="character.age" @input="saveCharacter" :placeholder="$t('basic.agePh')" />
              </div>
              <div>
                <label class="lbl">{{ $t('basic.ageModifier') }}</label>
                <label class="switch" style="margin-top:9px">
                  <input type="checkbox" v-model="character.ageModifier" @change="saveCharacter" />
                  <span class="track"></span>
                  <span class="small dim">{{ character.ageModifier ? $t('basic.enabled') : $t('basic.disabled') }}</span>
                </label>
              </div>
              <div>
                <label class="lbl">{{ $t('basic.gender') }}</label>
                <div class="seg" style="margin-top:2px">
                  <span class="seg-item" :class="{ active: character.gender === '男' }" @click="character.gender = '男'; saveCharacter()">{{ $t('basic.male') }}</span>
                  <span class="seg-item" :class="{ active: character.gender === '女' }" @click="character.gender = '女'; saveCharacter()">{{ $t('basic.female') }}</span>
                  <span class="seg-item" :class="{ active: character.gender === '其他' }" @click="character.gender = '其他'; saveCharacter()">{{ $t('basic.other') }}</span>
                </div>
                <input v-if="character.gender === '其他'" class="inp mt-8" v-model="character.genderOther" @input="saveCharacter" :placeholder="$t('basic.otherPh')" />
              </div>
            </div>
          </div>
        </div>
        <button v-if="character.avatar" class="btn sm ghost danger mt-8" @click="removeAvatar">{{ $t('basic.removeAvatar') }}</button>
        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
        <AvatarCropper v-if="cropperOpen" :src="cropSrc" @confirm="onCropConfirm" @cancel="cropperOpen = false; cropSrc = ''" />

        <div class="grid-3">
          <div>
            <label class="lbl">{{ $t('basic.country') }}</label>
            <select class="inp" v-model="character.country" @change="saveCharacter">
              <option v-for="c in countries" :key="c" :value="c">{{ $dn(c) }}</option>
              <option value="其他">{{ $t('basic.countryOther') }}</option>
            </select>
            <input v-if="character.country === '其他'" class="inp mt-8" v-model="character.countryOther" @input="saveCharacter" :placeholder="$t('basic.countryOtherPh')" />
          </div>
          <div>
            <label class="lbl">{{ $t('basic.hometown') }}</label>
            <input class="inp" v-model="character.hometown" @input="saveCharacter" :placeholder="$t('basic.hometownPh')" />
          </div>
          <div>
            <label class="lbl">{{ $t('basic.residence') }}</label>
            <input class="inp" v-model="character.residence" @input="saveCharacter" :placeholder="$t('basic.residencePh')" />
          </div>
        </div>

        <div class="grid-4">
          <div class="era-col">
            <label class="lbl era">{{ $t('basic.era') }}</label>
            <div class="seg era-seg">
              <span v-for="e in eras" :key="e.v" class="seg-item" :class="{ active: character.era === e.v }" :title="e.desc" @click="character.era = e.v; saveCharacter()">{{ e.label() }}</span>
            </div>
          </div>
          <div>
            <label class="lbl veteran">{{ $t('basic.legacyMode') }}</label>
            <label class="switch" style="margin-top:9px">
              <input type="checkbox" v-model="character.legacyMode" @change="saveCharacter" />
              <span class="track"></span>
              <span class="small dim">{{ character.legacyMode ? $t('basic.legacyOn') : $t('basic.legacyOff') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-16">
      <div class="card-title"><h2>{{ $t('basic.occupation') }}</h2><span class="sub">{{ $t('basic.occupationSub') }}</span></div>
      <div class="card-body">
        <div v-if="isIcelandFree" class="hint mt-8">
          {{ $t('basic.icelandFree') }}
        </div>
        <template v-else>
        <div class="job-head">
          <div class="seg">
            <span class="seg-item" :class="{ active: character.jobType === 'preset' }" @click="character.jobType = 'preset'; saveCharacter()">{{ $t('basic.chooseJob') }}</span>
            <span class="seg-item" :class="{ active: character.jobType === 'custom' }" @click="character.jobType = 'custom'; saveCharacter()">{{ $t('basic.customJob') }}</span>
          </div>
          <div class="book-filters" v-if="character.jobType === 'preset'">
            <span
              v-for="b in EXP_BOOKS"
              :key="b"
              class="seg-item book-toggle"
              :class="{ active: character.expBooks[b] }"
              :title="$t('basic.bookTitle', { b: $dn(b) })"
              @click="character.expBooks[b] = !character.expBooks[b]; saveCharacter()"
            >{{ $dn(b) }}</span>
          </div>
        </div>

        <template v-if="character.jobType === 'preset'">
          <label class="lbl">{{ $t('basic.job') }}</label>
          <select class="inp" v-model="character.jobName" @change="saveCharacter">
            <option value="" disabled>{{ $t('basic.jobSelectPh') }}</option>
            <optgroup v-for="[group, list] in filteredJobGroups" :key="group" :label="$dn(group)">
              <option v-for="j in list" :key="j" :value="j">{{ $dnt(j) }}</option>
            </optgroup>
          </select>
          <template v-if="currentJob">
            <div class="job-info mt-8">
              <div class="job-info-row"><span class="job-info-label">{{ $t('basic.occSkills') }}</span><span class="job-info-val">{{ formatSkills(currentJob) }}</span></div>
              <div class="job-info-row"><span class="job-info-label">{{ $t('basic.pointFormula') }}</span><span class="job-info-val">{{ formatPointFormula(currentJob) }}</span></div>
              <div class="job-info-row"><span class="job-info-label">{{ $t('basic.creditRange') }}</span><span class="job-info-val">{{ currentJob.wealth[0] }} – {{ currentJob.wealth[1] }}</span></div>
            </div>
          </template>
          <p v-else class="hint mt-8">{{ $t('basic.jobHint') }}</p>
        </template>

        <template v-else>
          <div class="grid-2">
            <div>
              <label class="lbl">{{ $t('basic.customJobName') }}</label>
              <input class="inp" v-model="character.customJobName" @input="saveCharacter" :placeholder="$t('basic.customJobNamePh')" />
            </div>
            <div>
              <label class="lbl">{{ $t('basic.pointFormulaLabel') }}</label>
              <div class="point-formula">
                <select class="inp" v-model="character.customPointAttr1" @change="saveCharacter">
                  <option v-for="k in ATTR_KEYS" :key="k" :value="k">{{ $dn(ATTR_LABELS[k]) }}</option>
                </select>
                <span class="pf-op">× 2</span>
                <span class="pf-plus">+</span>
                <select class="inp" v-model="character.customPointAttr2" @change="saveCharacter">
                  <option v-for="k in ATTR_KEYS" :key="k" :value="k">{{ $dn(ATTR_LABELS[k]) }}</option>
                </select>
                <span class="pf-op">× 2</span>
              </div>
            </div>
          </div>
          <div class="grid-2 mt-8">
            <div>
              <label class="lbl">{{ $t('basic.creditMin') }}</label>
              <input class="inp" type="number" v-model.number="character.customWealth[0]" @input="saveCharacter" />
            </div>
            <div>
              <label class="lbl">{{ $t('basic.creditMax') }}</label>
              <input class="inp" type="number" v-model.number="character.customWealth[1]" @input="saveCharacter" />
            </div>
          </div>
          <p class="hint mt-8">{{ $t('basic.customSkillHint') }}</p>
        </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 时代选择：占满整行（grid-4 为 2 列），允许格子收缩；按钮自动适配宽度、空间不足自动换行 */
.era-col { grid-column: 1 / -1; min-width: 0; }
.era-seg { display: flex; width: 100%; flex-wrap: wrap; }
.era-seg .seg-item { flex: 1 1 auto; min-width: 56px; text-align: center; white-space: nowrap; }
.basic-top { display: flex; align-items: stretch; gap: 20px; }
.avatar-col { display: flex; flex-direction: column; width: 160px; }
.avatar-preview {
  width: 160px; flex: 1 1 auto; min-height: 84px; border-radius: 12px; overflow: hidden;
  border: 1px solid var(--border); background: var(--surface-2);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: border-color 0.15s;
}
.basic-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0; }
.avatar-preview:hover { border-color: var(--accent); }
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { text-align: center; color: var(--text-faint); font-size: 1.2rem; line-height: 1.2; }
.avatar-placeholder small { font-size: 0.7rem; }
.job-info { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; background: var(--surface-2); }
.point-formula { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.point-formula .inp { flex: 1 1 110px; min-width: 0; }
.pf-op { color: var(--text-faint); font-variant-numeric: tabular-nums; }
.pf-plus { color: var(--text-faint); }
.job-info-row { display: flex; gap: 10px; padding: 3px 0; }
.job-info-label { flex: none; width: 72px; color: var(--text-faint); font-size: 0.85rem; }
.job-info-val { line-height: 1.5; }
.job-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.book-filters { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; justify-content: flex-end; flex: 1; min-width: 240px; }
.book-filters .seg-item { cursor: pointer; font-size: 0.76rem; padding: 4px 10px; opacity: 0.5; }
.book-filters .seg-item.active { opacity: 1; }
@media (max-width: 860px) {
  .basic-top { flex-direction: column; align-items: stretch; }
  .avatar-col { flex-direction: row; gap: 12px; width: auto; }
  .avatar-preview { flex: none; width: 160px; height: 84px; min-height: 0; }
}
.lbl.veteran { width: fit-content; }
</style>
