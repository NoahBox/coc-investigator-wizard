<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps({ src: { type: String, required: true } });
const emit = defineEmits(['confirm', 'cancel']);

const imgRef = ref(null);
let cropper = null;

onMounted(() => {
  if (!imgRef.value) return;
  cropper = new Cropper(imgRef.value, {
    aspectRatio: 1,
    viewMode: 1,
    autoCropArea: 1,
    dragMode: 'move',
    background: false,
    responsive: true,
  });
});

onBeforeUnmount(() => {
  if (cropper) { cropper.destroy(); cropper = null; }
});

function zoom(v) { cropper?.zoom(v); }
function rotate(v) { cropper?.rotate(v); }
function reset() { cropper?.reset(); }

function onConfirm() {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas({ width: 320, height: 320 });
  if (!canvas) return;
  emit('confirm', canvas.toDataURL('image/jpeg', 0.85));
}
</script>

<template>
  <div class="cropper-overlay" @click.self="emit('cancel')">
    <div class="cropper-modal card">
      <div class="cropper-head">
        <h3>{{ $t('cropper.title') }}</h3>
        <span class="spacer"></span>
        <button class="btn ghost sm" @click="emit('cancel')">✕</button>
      </div>
      <div class="cropper-body">
        <div class="cropper-stage">
          <img ref="imgRef" :src="src" :alt="$t('cropper.alt')" />
        </div>
        <div class="cropper-tools row wrap">
          <button class="btn sm" @click="zoom(0.1)">＋</button>
          <button class="btn sm" @click="zoom(-0.1)">－</button>
          <button class="btn sm" @click="rotate(-90)" :title="$t('cropper.rotateCCW')">⟲</button>
          <button class="btn sm" @click="rotate(90)" :title="$t('cropper.rotateCW')">⟳</button>
          <button class="btn sm" @click="reset" :title="$t('cropper.reset')">{{ $t('cropper.reset') }}</button>
          <span class="hint small">{{ $t('cropper.hint') }}</span>
        </div>
      </div>
      <div class="cropper-foot row">
        <button class="btn" @click="emit('cancel')">{{ $t('cropper.cancel') }}</button>
        <span class="spacer"></span>
        <button class="btn primary" @click="onConfirm">{{ $t('cropper.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cropper-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0, 0, 0, 1);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.cropper-modal { width: 560px; max-width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.cropper-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
.cropper-body { padding: 16px 18px; }
.cropper-stage { height: 340px; background: var(--surface-2); border-radius: var(--radius-sm); overflow: hidden; }
.cropper-stage img { max-width: 100%; }
.cropper-tools { margin-top: 12px; gap: 8px; align-items: center; }
.cropper-foot { padding: 12px 18px; border-top: 1px solid var(--border); gap: 10px; }
</style>
