# 调查员之书 · COC 7版 调查员角色卡交互式创建工具

克苏鲁的呼唤（Call of Cthulhu）TRPG 第七版调查员角色卡交互式创建网页。

使用 Vue 3 + Vite 构建。

## 已支持的功能

### 基础功能

- 交互式调查员角色卡创建
- 调查员角色卡导出，支持：
    - 本工具支持的 Json 格式
    - 适用于印刷的 PDF 及图片
    - 兼容“TRPG SAIKO 调查员车卡工具”的 Base64 串
    - 骰娘属性设置字符串（.st）
    - Foundry VTT CoC7th 系统可直接导入的调查员 JSON
    - 角色卡分享链接（角色数据压缩进 URL hash，对方打开后一键导入）
- 调查员角色卡导入，支持：
    - 本工具支持的 Json 格式
    - 来自“TRPG SAIKO 调查员车卡工具”的 Base64 串
- 属性分配模式
    - 购点
    - 随机生成
    - 快速开始（《COC 7th 快速开始规则》）
- 规则书中的数据
    - 职业
    - 武器
- 调查员花名册：支持多选导入、导出花名册备份，以及搜索（姓名/职业）、按时代筛选、列表/头像卡片两种视图切换
- 多语言界面（i18n）：中文 / English / 日本語，顶栏一键切换并记忆偏好；界面文案与技能/职业/时代/武器等数据名均本地化（内部数据主键保持中文，未翻译词条自动回退中文）
- 骰子检定模拟器：对属性 / 技能直接掷 D100 检定，自动按 COC 7版判定大成功 / 极难 / 困难 / 成功 / 失败 / 大失败，并支持自由掷骰（如 `2d6+5`）与本次会话记录


### 扩展功能

- 调查员经历包
- 中国/日本调查员的资产自动换算
- 扩展职业
    - 日本 COC 扩展职业（新克苏鲁神话2026, 新克苏鲁神话2020, 克苏鲁神话2015, 克苏鲁神话2010，TRPG-JAPAN）
    - 纸浆克苏鲁扩展职业

## 注意事项

该项目的本地存储依赖于浏览器的 LocalStorage，更改 html 文件名称、移动 html 文件位置、使用不同的浏览器打开 html 文件、清除页面缓存等行为均会导致调查员花名册存储数据的丢失。建议在进行上述操作前导出调查员花名册。

由于浏览器 LocalStorage 大小限制，大约可存储 100 张调查员角色卡。若使用高分辨率的调查员头像，实际存储数量可能会小于该数值。


## 开发计划

- [x] 使用 LocalStorage 对角色卡进行持久化保存
- [x] 调查员背景的随机生成表
- [x] 《克苏鲁时空穿梭（Cthulhu Through the Ages）》中的扩展职业和时代特性
- [ ] 调整角色卡更新模式的功能
- [x] 导出到 FVTT COC7th 系统可用的格式
- [x] 本地化: 英语、日语

## 快速开始

为对手机端进行优化，推荐电脑端使用。

### 在线使用

在线使用：[https://noahbox.github.io/tools/coc-investigator-wizard.html](https://noahbox.github.io/tools/coc-investigator-wizard.html)

或者从最新的 Release 下载 `coc-investigator-wizard.html`。

### 自行构建

```bash
git clone https://github.com/NoahBox/coc-investigator-wizard
cd coc-investigator-wizard
npm install

npm run build    # 构建单文件 HTML → dist/index.html
```

构建产物 `dist/index.html` 可直接用浏览器打开，无需服务器。
