import { createApp } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCopy, faTrash, faFileExport, faFileImport, faDice, faPlus,
    faFilePdf, faFileImage, faFileLines, faFileZipper, faArrowUpFromBracket,
    faPersonCirclePlus, faLeftRight, faDragon, faShareNodes, faList,
    faTableCellsLarge, faUser } from '@fortawesome/free-solid-svg-icons';
import App from './App.vue';
import './theme.css';
import { t, dataName, dataNameWithTag, skillLabel, flavorText, setLocale } from './i18n.js';

// Font Awesome：把用到的图标加入 library，并全局注册 <font-awesome-icon> 组件
library.add(faCopy, faTrash, faFileExport, faFileImport, faDice, faPlus, 
    faFilePdf, faFileImage, faFileLines, faFileZipper, faArrowUpFromBracket,
    faPersonCirclePlus, faLeftRight, faDragon, faShareNodes, faList,
    faTableCellsLarge, faUser);

const app = createApp(App);
// i18n 全局助手（模板中直接使用 $t / $dn / $dnt / $sl）
app.config.globalProperties.$t = t;
app.config.globalProperties.$dn = dataName;
app.config.globalProperties.$dnt = dataNameWithTag;
app.config.globalProperties.$sl = skillLabel;
app.config.globalProperties.$ft = flavorText;
app.component('font-awesome-icon', FontAwesomeIcon);
app.mount('#app');
setLocale(localStorage.getItem('coc-wizard-locale') || 'zh');
