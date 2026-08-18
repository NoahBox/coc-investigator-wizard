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
- 调查员花名册，支持多选导入、导出调查员花名册


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

- [x] 使用 localStorage 对角色卡进行持久化保存
- [ ] 调查员背景的随机生成表
- [ ] 导出到 FVTT COC7th 系统可用的格式
- [ ] 《克苏鲁时空穿梭（Cthulhu Through the Ages）》中的扩展职业和时代特性


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
