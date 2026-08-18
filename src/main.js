import { createApp } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCopy, faTrash, faFileExport, faFileImport, faDice, faPlus, 
    faFilePdf, faFileImage, faFileLines, faFileZipper, faArrowUpFromBracket,
    faPersonCirclePlus, faLeftRight } from '@fortawesome/free-solid-svg-icons';
import App from './App.vue';
import './theme.css';

// Font Awesome：把用到的图标加入 library，并全局注册 <font-awesome-icon> 组件
library.add(faCopy, faTrash, faFileExport, faFileImport, faDice, faPlus, 
    faFilePdf, faFileImage, faFileLines, faFileZipper, faArrowUpFromBracket,
    faPersonCirclePlus, faLeftRight);

createApp(App).component('font-awesome-icon', FontAwesomeIcon).mount('#app');
