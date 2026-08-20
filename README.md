# 调查员之书 · COC 7版 调查员角色卡交互式创建工具

克苏鲁的呼唤（Call of Cthulhu）TRPG 第七版调查员角色卡交互式创建网页。

使用 Vue 3 + Vite 构建。

#### 调查员创建 & 管理

- 交互式调查员创建
    - 属性分配
        - 支持购点 & 随机生成 & 快速开始
        - 年龄调整
    - 快速填入
        - 职业
        - 武器
    - 技能分配
        - 区分职业/业余技能
        - 允许严格/通俗模式
        - 包含扩展包的技能
    - 调查员背景
        - 规则书中的随机表
- 交互式调查员成长
    - 幕间成长
    - 属性值调整
- 调查员花名册
    - 存储调查员角色卡数据
    - 批量导入/导出调查员角色卡数据

### 导入 & 导出

- 调查员角色卡导出，支持：
    - 本工具支持的 Json 格式
    - 适用于印刷的 PDF 及图片
    - 兼容“TRPG 赛高 COC 调查员车卡工具”的 Base64 串
    - 骰娘属性设置字符串
    - FVTT COC7th 系统可用的 Json 格式
    - 角色卡分享链接
- 调查员角色卡导入，支持：
    - 本工具支持的 Json 格式
    - 来自“TRPG 赛高 COC 调查员车卡工具”的 Base64 串
    - 角色卡分享链接

### 扩展

- 调查员经历包
- 中国/日本调查员的资产自动换算
- 扩展职业
    - 日本 COC 扩展职业（新克苏鲁神话2026, 新克苏鲁神话2020, 克苏鲁神话2015, 克苏鲁神话2010，TRPG-JAPAN）
    - 纸浆克苏鲁扩展职业

### 其他功能

- 检定 & 掷骰
- i18n 支持
    - 简体中文
    - 日语
    - 英语

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


## 开发计划

- [x] 使用 LocalStorage 对角色卡进行持久化保存 v1.0.3
- [x] 调查员背景的随机生成表 v1.0.5
- [x] 《克苏鲁时空穿梭（Cthulhu Through the Ages）》扩展中的职业和时代特性 v1.0.5
- [x] 导出到 FVTT COC7th 系统可用的格式 v1.0.6
- [x] 本地化: 英语、日语 v1.0.6
- [ ] 调整角色卡更新模式的功能
