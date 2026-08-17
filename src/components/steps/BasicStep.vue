<script setup>
import { ref, computed } from 'vue';
import { character, saveCharacter, currentJob, splitSkillKey } from '../../store.js';
import { jobGroups } from '../../data/jobs.js';
import { ATTR_LABELS } from '../../data/rules.js';
import AvatarCropper from '../AvatarCropper.vue';

const countries = ['美国', '中国', '日本'];
const eras = [
  { v: 'modern', label: '现代' },
  { v: '1920s', label: '1920s' },
];
const customCountry = ref('');

function onCountry(c) {
  if (countries.includes(c)) character.country = c;
  else character.country = customCountry.value;
  saveCharacter();
}

function showName(name) { return (name || '').replace(/Ω/g, ''); }

// 格式化本职技能列表
function formatSkills(job) {
  if (!job || !job.skills) return '';
  return job.skills.map((sk) => {
    if (typeof sk === 'string') return showName(sk);
    if (Array.isArray(sk)) {
      const opts = sk.map((o) => {
        if (typeof o === 'string') return showName(o);
        const key = Object.keys(o)[0];
        const child = o[key];
        return child ? `${showName(key)}（${showName(child)}）` : showName(key);
      });
      return opts.join(' / ') + '（任选其一）';
    }
    const key = Object.keys(sk)[0];
    const child = sk[key];
    const { name, child: keyChild } = splitSkillKey(key);
    if (child) return `${showName(name)}（${showName(child)}）`;
    if (keyChild) return `${showName(name)}（${showName(keyChild)}）`;
    return showName(name);
  }).join('、');
}

// 格式化职业技能点数计算方式
function formatPointFormula(job) {
  if (!job || !job.point) return '';
  return job.point.map((unitGroup) => {
    if (unitGroup.length === 1) {
      const [attrKey, mult] = unitGroup[0];
      return `${ATTR_LABELS[attrKey]}×${mult}`;
    }
    const opts = unitGroup.map(([attrKey, mult]) => `${ATTR_LABELS[attrKey]}×${mult}`);
    return `（${opts.join(' 或 ')}）`;
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
      <div class="card-title"><h2>调查员基本信息</h2><span class="sub">Investigator Basics</span></div>
      <div class="card-body">
        <!-- 头像 -->
        <div class="avatar-row">
          <div class="avatar-preview" @click="pickAvatar" title="点击上传头像">
            <img v-if="character.avatar" :src="character.avatar" alt="头像" />
            <span v-else class="avatar-placeholder">☽<br /><small>点击上传</small></span>
          </div>
          <button v-if="character.avatar" class="btn sm ghost danger" @click="removeAvatar">移除头像</button>
        </div>
        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
        <AvatarCropper v-if="cropperOpen" :src="cropSrc" @confirm="onCropConfirm" @cancel="cropperOpen = false; cropSrc = ''" />

        <div class="grid-2">
          <div>
            <label class="lbl">姓名</label>
            <input class="inp" v-model="character.name" @input="saveCharacter" placeholder="调查员的姓名" />
          </div>
          <div>
            <label class="lbl">玩家</label>
            <input class="inp" v-model="character.player" @input="saveCharacter" placeholder="玩家名" />
          </div>
        </div>

        <div class="grid-3">
          <div>
            <label class="lbl">年龄</label>
            <input class="inp" type="number" min="1" max="120" v-model="character.age" @input="saveCharacter" placeholder="年龄" />
          </div>
          <div>
            <label class="lbl">启用年龄修正</label>
            <label class="switch" style="margin-top:9px">
              <input type="checkbox" v-model="character.ageModifier" @change="saveCharacter" />
              <span class="track"></span>
              <span class="small dim">{{ character.ageModifier ? '已启用' : '未启用' }}</span>
            </label>
          </div>
          <div>
            <label class="lbl">性别</label>
            <div class="seg" style="margin-top:2px">
              <span class="seg-item" :class="{ active: character.gender === '男' }" @click="character.gender = '男'; saveCharacter()">男</span>
              <span class="seg-item" :class="{ active: character.gender === '女' }" @click="character.gender = '女'; saveCharacter()">女</span>
              <span class="seg-item" :class="{ active: character.gender === '其他' }" @click="character.gender = '其他'; saveCharacter()">其他</span>
            </div>
            <input v-if="character.gender === '其他'" class="inp mt-8" v-model="character.genderOther" @input="saveCharacter" placeholder="请填写" />
          </div>
        </div>

        <div class="grid-3">
          <div>
            <label class="lbl">国家</label>
            <select class="inp" v-model="character.country" @change="saveCharacter">
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
              <option value="其他">其他（填写）</option>
            </select>
            <input v-if="character.country === '其他'" class="inp mt-8" v-model="customCountry" @input="onCountry('其他')" placeholder="填写国家" />
          </div>
          <div>
            <label class="lbl">故乡</label>
            <input class="inp" v-model="character.hometown" @input="saveCharacter" placeholder="故乡" />
          </div>
          <div>
            <label class="lbl">住地</label>
            <input class="inp" v-model="character.residence" @input="saveCharacter" placeholder="现居地" />
          </div>
        </div>

        <div>
          <label class="lbl">时代</label>
          <div class="seg">
            <span v-for="e in eras" :key="e.v" class="seg-item" :class="{ active: character.era === e.v }" @click="character.era = e.v; saveCharacter()">{{ e.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-16">
      <div class="card-title"><h2>职业</h2><span class="sub">Occupation</span></div>
      <div class="card-body">
        <div class="seg mb-16">
          <span class="seg-item" :class="{ active: character.jobType === 'preset' }" @click="character.jobType = 'preset'; saveCharacter()">选择职业</span>
          <span class="seg-item" :class="{ active: character.jobType === 'custom' }" @click="character.jobType = 'custom'; saveCharacter()">自定义职业</span>
        </div>

        <template v-if="character.jobType === 'preset'">
          <label class="lbl">职业（按大类分组）</label>
          <select class="inp" v-model="character.jobName" @change="saveCharacter">
            <option value="" disabled>请选择职业…</option>
            <optgroup v-for="[group, list] in jobGroups" :key="group" :label="group">
              <option v-for="j in list" :key="j" :value="j">{{ j }}</option>
            </optgroup>
          </select>
          <template v-if="currentJob">
            <div class="job-info mt-8">
              <div class="job-info-row"><span class="job-info-label">本职技能</span><span class="job-info-val">{{ formatSkills(currentJob) }}</span></div>
              <div class="job-info-row"><span class="job-info-label">技能点数</span><span class="job-info-val">{{ formatPointFormula(currentJob) }}</span></div>
              <div class="job-info-row"><span class="job-info-label">信用评级</span><span class="job-info-val">{{ currentJob.wealth[0] }} – {{ currentJob.wealth[1] }}</span></div>
            </div>
          </template>
          <p v-else class="hint mt-8">职业决定本职技能、信用评级范围与职业技能点数。</p>
        </template>

        <template v-else>
          <div class="grid-2">
            <div>
              <label class="lbl">自定义职业名称</label>
              <input class="inp" v-model="character.customJobName" @input="saveCharacter" placeholder="例如：记者" />
            </div>
            <div>
              <label class="lbl">职业技能点数公式</label>
              <select class="inp" v-model="character.customPointFormula" @change="saveCharacter">
                <option value="edu4">教育 × 4</option>
                <option value="edu2">教育 × 2 + 自选属性 × 2</option>
              </select>
            </div>
          </div>
          <div class="grid-2 mt-8">
            <div>
              <label class="lbl">信用评级下限</label>
              <input class="inp" type="number" v-model.number="character.customWealth[0]" @input="saveCharacter" />
            </div>
            <div>
              <label class="lbl">信用评级上限</label>
              <input class="inp" type="number" v-model.number="character.customWealth[1]" @input="saveCharacter" />
            </div>
          </div>
          <p class="hint mt-8">本职技能将在「职业技能」步骤中选择。</p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.avatar-preview {
  width: 84px; height: 84px; border-radius: 12px; overflow: hidden; flex: none;
  border: 1px solid var(--border); background: var(--surface-2);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: border-color 0.15s;
}
.avatar-preview:hover { border-color: var(--accent); }
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { text-align: center; color: var(--text-faint); font-size: 1.2rem; line-height: 1.2; }
.avatar-placeholder small { font-size: 0.7rem; }
.job-info { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; background: var(--surface-2); }
.job-info-row { display: flex; gap: 10px; padding: 3px 0; }
.job-info-label { flex: none; width: 72px; color: var(--text-faint); font-size: 0.85rem; }
.job-info-val { line-height: 1.5; }
</style>
