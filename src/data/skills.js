// ============================================================
// 技能数据（移植自 TRPG Saiko COC 7版人物卡，含子技能分组）
// ============================================================

export const skills = [
  { name: '信用评级', init: 0, intro: '衡量了调查员表现出来的富裕程度以及经济上的自信度。可被用来取代外貌APP来评估第一印象。' },
  { name: '克苏鲁神话', init: 0, intro: '对宇宙真实一面的了解。此技能不可作为本职技能分配职业点数。' },
  { name: '侦查', init: 25, intro: '发现密门、隐藏的闯入者、并不明显的线索等。' },
  { name: '聆听', init: 20, intro: '理解声音的能力，包括偷听到的对话、门后的轻声嘀咕。' },
  { name: '取悦', init: 15, intro: '通过肉体魅力、诱惑、奉承或人格魅力影响他人。' },
  { name: '话术', init: 5, intro: '言语上的哄骗、欺骗与误导，效果总是暂时性的。' },
  { name: '恐吓', init: 15, intro: '武力威慑、心理操控与威胁。' },
  { name: '说服', init: 10, intro: '通过论述、争辩与讨论让目标相信某个想法。' },
  { name: '心理学', init: 10, intro: '研究个人并形成对其动机和人格的了解。' },
  {
    name: '母语', init: 0, initPlaceholder: '教育',
    intro: '婴儿期或童年早期掌握的语言。必须明确具体语言。',
    group: { show: [''], skills: ['汉语', '英语', '日语', '法语', '俄语', '德语', '韩语', '粤语', '拉丁语', '荷兰语', '挪威语', '丹麦语', '印度语', '西班牙语', '葡萄牙语', '阿拉伯语'].map(n => ({ name: n })) },
  },
  {
    name: '外语', init: 1,
    intro: '了解、说、读、写一门非母语语言的可能性。',
    group: { show: ['', ''], skills: ['汉语', '英语', '日语', '法语', '俄语', '德语', '韩语', '粤语', '拉丁语', '荷兰语', '挪威语', '丹麦语', '印度语', '西班牙语', '葡萄牙语', '阿拉伯语'].map(n => ({ name: n })) },
  },
  { name: '估价', init: 5, intro: '估计物品价值，包括质量、材料与工艺。' },
  { name: '乔装', init: 5, intro: '改变态度、习惯与声音以扮演他人。' },
  { name: '潜行', init: 20, intro: '安静地移动或躲藏，不惊扰他人。' },
  { name: '追踪', init: 10, intro: '凭借脚印与痕迹追踪人或动物。' },
  { name: '读唇', init: 1, intro: '不需要听到声音即知晓对话内容。' },
  { name: '人类学', init: 1, intro: '通过观察辨认和理解一个人的生活方式。' },
  { name: '图书馆使用', init: 20, intro: '在图书馆找到特定书籍、新闻或资料。' },
  {
    name: '生存', init: 5,
    intro: '在极端环境下生存的知识与技巧，可专业化为具体环境。',
    group: { show: ['', '', ''], skills: [{ name: '沙漠' }, { name: '森林' }, { name: '荒岛' }, { name: '高山' }, { name: '海上' }, { name: '城镇', init: 10 }] },
  },
  { name: '攀爬', init: 20, intro: '借助或不借助工具爬树、墙及垂直表面。' },
  { name: '跳跃', init: 20, intro: '垂直或水平方向跳起、跳下、跳出。' },
  { name: '游泳', init: 20, intro: '在水或其他液体中漂浮与移动。' },
  { name: '潜水', init: 1, intro: '深海游泳、维持潜水设备、水下导航。' },
  {
    name: '技艺', init: 5,
    intro: '制作、修理物品或制造复制品/赝品。可专业化为具体技艺。',
    group: {
      show: ['', '', ''],
      skills: ['表演', '音乐', '绘画', '艺术', '摄影', '写作', '书法', '打字', '速记', '伪造', '烹饪', '裁缝', '理发', '技术制图', '耕作', '木工', '铁匠', '焊接', '管道工', '药剂', '制革', '演说', '诗歌', '占卜'].map(n => ({ name: n })),
    },
  },
  { name: '妙手', init: 10, intro: '视觉上遮住、藏匿或掩盖物体。' },
  { name: '锁匠', init: 1, intro: '打开车门、撬开窗子、解决机关箱等。' },
  { name: '电气维修', init: 10, intro: '修理或改装电气设备。' },
  { name: '机械维修', init: 10, intro: '修理破损的机器或制造新的。' },
  { name: '导航', init: 10, intro: '认清自己的路，测量并绘图。' },
  { name: '骑术', init: 5, intro: '驾驭马、驴或骡子及基础照料知识。' },
  { name: '操作重型机械', init: 1, intro: '驾驶与操纵坦克、挖土机等巨型机械。' },
  { name: '汽车驾驶', init: 20, intro: '驾驶汽车或轻型卡车。' },
  {
    name: '驾驶', init: 1,
    intro: '操控飞行器、船只等其他载具。',
    group: { show: [''], skills: [{ name: '船' }, { name: '马车' }, { name: '飞行器' }, { name: '伊卡洛斯' }] },
  },
  { name: '驯兽', init: 5, intro: '命令、训练动物进行简单任务。' },
  { name: '计算机使用', init: 5, intro: '编程、恢复数据、解除保护系统。仅在现代可用。', hidden: '计算机使用Ω' },
  {
    name: '格斗', init: 0,
    intro: '近距离战斗的技能，可专业化为具体武器。',
    group: {
      show: ['斗殴', '', ''],
      skills: [{ name: '斗殴', init: 25 }, { name: '刀剑', init: 20 }, { name: '矛', init: 20 }, { name: '斧', init: 15 }, { name: '绞索', init: 15 }, { name: '链锯', init: 10 }, { name: '链枷', init: 10 }, { name: '鞭', init: 5 }, { name: '盾', init: 15 }, { name: '长武器', init: 15 }],
    },
  },
  {
    name: '射击', init: 0,
    intro: '各种形式的火器，也包括弓箭和弩。',
    group: {
      show: ['手枪', '步/霰', ''],
      skills: [{ name: '手枪', init: 20 }, { name: '步/霰', init: 25 }, { name: '冲锋枪', init: 15 }, { name: '弓弩', init: 15 }, { name: '机枪', init: 10 }, { name: '重武器', init: 10 }, { name: '投石索', init: 15 }, { name: '能量武器', init: 25 }],
    },
  },
  { name: '闪避', init: 0, initPlaceholder: '1/2敏捷', intro: '本能地闪避攻击与投掷物。' },
  { name: '投掷', init: 20, intro: '用物体击中目标或用正确部分击中目标。' },
  { name: '爆破', init: 1, intro: '安全地设置/拆除爆破装置。' },
  { name: '炮术', init: 1, intro: '操作战地武器，通常需要工作队支援。' },
  { name: '急救', init: 30, intro: '提供紧急医疗处理，唤醒昏迷者。' },
  { name: '医学', init: 1, intro: '诊断并治疗事故创伤、疾病、毒药。' },
  { name: '精神分析', init: 1, intro: '广泛的情感治疗，可恢复理智。' },
  { name: '催眠', init: 1, intro: '引出出神状态，可能回忆起忘却的记忆。' },
  { name: '会计', init: 5, intro: '理解会计工作流程，检查账簿。' },
  { name: '法律', init: 5, intro: '对法律、早期事件、法庭辩术的了解。' },
  { name: '历史', init: 5, intro: '记住国家、城市、区域或个人及其重要情报。' },
  { name: '考古学', init: 1, intro: '辨别鉴定古董，建立开掘遗址。' },
  { name: '博物学', init: 10, intro: '对自然环境中的植物和动物生命的研究。' },
  { name: '神秘学', init: 5, intro: '识别神秘学道具、用语与概念。' },
  { name: '电子学', init: 1, intro: '发现并维修电子设备故障。仅在现代可用。', hidden: '电子学Ω' },
  {
    name: '科学', init: 1,
    intro: '科学专业上的理论与实践能力，可专业化为具体学科。',
    group: {
      show: ['', '', ''],
      skills: [{ name: '数学', init: 10 }, { name: '物理' }, { name: '化学' }, { name: '药学' }, { name: '地质学' }, { name: '生物学' }, { name: '动物学' }, { name: '植物学' }, { name: '天文学' }, { name: '密码学' }, { name: '气象学' }, { name: '工程学' }, { name: '鉴证' }, { name: '制药' }],
    },
  },
  { name: '自定义', init: 0, intro: '自定义技能', group: { show: ['', '', ''], skills: [] } },
];

// 技能分类（标签页）
export const skillGroups = {
  特殊: ['信用评级', '克苏鲁神话'],
  探索: ['侦查', '聆听', '图书馆使用', '计算机使用', '潜行', '追踪', '导航'],
  社交: ['话术', '说服', '取悦', '恐吓', '心理学', '母语', '外语'],
  战斗: ['闪避', '格斗', '射击', '投掷'],
  医疗: ['急救', '医学', '精神分析'],
  运动: ['攀爬', '跳跃', '游泳'],
  知识: ['博物学', '神秘学', '考古学', '人类学', '估价', '会计', '法律', '历史', '电子学', '科学'],
  技术: ['乔装', '妙手', '锁匠', '机械维修', '电气维修', '驯兽', '技艺', '生存'],
  操纵: ['汽车驾驶', '骑术', '驾驶', '操作重型机械'],
  其它: ['自定义'],
};

export const skillGroupOrder = ['特殊', '探索', '社交', '战斗', '医疗', '运动', '知识', '技术', '操纵', '其它'];

// 技能名 → 骰娘别名
export const skillNameAlias = {
  信用评级: ['信用', '信誉'],
  克苏鲁神话: ['克苏鲁'],
  取悦: ['魅惑'],
  汽车驾驶: ['汽车'],
  图书馆使用: ['图书馆'],
  '步/霰': ['步枪', '霰弹枪'],
  锁匠: ['开锁', '撬锁'],
  博物学: ['自然学'],
  导航: ['领航'],
  操作重型机械: ['重型机械'],
};

// 构建技能索引
const skillMap = new Map();
skills.forEach(s => skillMap.set(s.name, s));
export function getSkill(name) { return skillMap.get(name); }

// 需要填写具体类别的技能（子技能分组）
// 「自定义」的分组 skills 为空，但同样按分组技能处理（用户自由填写自定义技能名）
export const groupedSkillNames = skills.filter(s => s.group && (s.group.skills.length || s.name === '自定义')).map(s => s.name);

// ============================================================
// 扩展时代专属技能（源自《克苏鲁时空穿梭》）
// 仅在选择对应时代时显示在技能列表中；现代 / 1920s 不显示。
// base 特殊取值：int/2、pow/5、mythos/2、occ(本职25%否则1%)
// spec: true 表示专门化技能（需按子类分别投入点数）
// ============================================================
export const eraSkillGroups = {
  // 克苏鲁不败（罗马时代）
  invictus: [
    { name: '公民', init: 10, intro: '对罗马法律与政府的了解：理清政治关系网、贿赂官员、判断行为合法与否。' },
    { name: '帝国知识', init: 25, intro: '对罗马帝国历史、传说、神话的了解，如近期宗教、角斗士冠军、城市由来等。' },
    { name: '察言观色', init: 5, intro: '打量他人，观察其行为并揣测目的；可对抗社交技能检定，识破乔装。' },
    { name: '外邦知识', init: 20, intro: '对帝国之外或边远地区人物、场所、传说的了解。专门化：每个国度和地区单独投入点数。', spec: true },
    { name: '修造', init: 20, intro: '修理/制造简单的设备、船只、屋顶等；可设置陷坑、圈套；不能维修盾牌和武器。' },
    { name: '读写', init: 1, intro: '阅读、书写某种文字的能力（如拉丁文）。', spec: true },
    { name: '战术', init: 1, intro: '对战术与运用的熟悉程度。若是本职技能则初始值25%，否则为1%。', occ: true },
  ],
  // 克苏鲁黑暗时代（10~11世纪欧洲）
  dark: [
    { name: '察言观色', init: 5, intro: '打量他人，观察其行为并揣测目的；可对抗社交技能检定，识破乔装。' },
    { name: '外邦知识', init: 20, intro: '对本国之外人物、场所、传说的了解。专门化：每个国度和地区单独投入点数。', spec: true },
    { name: '本国知识', init: 20, intro: '对本国人民、土地和传说的了解：地方名号、方言、领主与当地迷信。' },
    { name: '修造', init: 20, intro: '修理/制造简单的设备、船只、屋顶等；可设置陷坑、圈套；不能维修盾牌和武器。' },
    { name: '宗教', init: 20, intro: '对信仰宗教的了解：节日时令、圣人名号、教堂禁忌；识别异教符咒、仪式地点与土俗神。' },
    { name: '读写', init: 1, intro: '阅读、书写某种文字的能力（如拉丁文或本地语文）。', spec: true },
    { name: '手语', init: 1, intro: '修道院等环境中使用的手势语言（如僧侣间的手语）。' },
  ],
  // 神秘冰岛（930年冰岛萨迦时代）
  iceland: [
    { name: '察言观色', init: 5, intro: '打量他人，观察其行为并揣测目的；可对抗社交技能检定，识破乔装。' },
    { name: '读写', init: 1, intro: '阅读、书写某种文字的能力（如拉丁文与维京如尼文）。', spec: true },
    { name: '本地知识', init: 0, base: 'int/2', intro: '对本地人民和地理特征的了解：首领是谁、宗族领地边界、主要路线等。' },
    { name: '预言', init: 0, intro: '通过占卜看到未来的能力（分析内脏、如尼符文或观察自然）。只有意志80以上才能分配点数。' },
    { name: '灵视力', init: 1, intro: '看到另一个世界的天赋：与动物守护灵交流、看到魔法生物或灵魂。' },
    { name: '滑雪', init: 25, intro: '使用滑雪板在冰和雪上移动的方法；长距离滑雪还会用到滑雪杆。' },
  ],
  // 克苏鲁煤气灯：无新技能（电气维修降为01%、操作重型机械01%、驾驶〔热气球/船舶〕）
  gaslight: [],
  // 洛夫克拉夫特的幻梦境
  dreamlands: [
    { name: '造梦', init: 0, base: 'pow/5', intro: '梦想出改变幻梦境现实的事物（创造物品、改变物体、影响物理规律），需消耗魔法值。' },
    { name: '梦境学问', init: 0, base: 'mythos/2', intro: '对幻梦境的了解：历史、识别生物与重要人物、知晓路径。基础值等于克苏鲁神话的一半。' },
  ],
  // 克苏鲁伊卡洛斯（近未来星际）
  icarus: [
    { name: '计算机维护', init: 5, intro: '检测计算机系统和网络中的故障并维修，包括代码编写、覆写与排错；取代计算机使用。' },
    { name: '系统操作', init: 10, intro: '安全平稳地操作飞船和控制系统：理解、操作、设定、诊断、修理生命维护/发动机/安全系统。' },
    { name: '技术维修', init: 1, intro: '维护和修理机械维修、电气维修等力不能及的复杂机械：诊断硬件故障、制造维修脉冲枪与计算机。' },
    { name: '零重力', init: 5, intro: '零重力环境下的生存、移动和操作训练；零重力近身格斗取代「格斗（斗殴）」。' },
  ],
  // 克苏鲁末日之收割（旧日支配者苏醒后的废土）
  endtimes: [
    { name: '拾荒', init: 15, intro: '在文明残骸中发现道具和有价值物品的能力；专门搜寻时可代替侦查，判断有无可用道具时可代替幸运。' },
    { name: '技术维修', init: 1, intro: '维护和修理复杂机械：诊断硬件故障、制造和维修计算机与通讯工具（若有动力来源）。' },
  ],
};

// 时代技能组在技能标签页中显示的名称
export const ERA_SKILL_GROUP = '时代技能';

// 全部时代技能汇总索引
const eraSkillMap = new Map();
Object.values(eraSkillGroups).forEach(list => list.forEach(s => eraSkillMap.set(s.name, s)));
export function getEraSkill(name) { return eraSkillMap.get(name); }

// 当前时代的技能分组（标准分组 + 时代技能组）
export function getEraSkillGroups(eraId) {
  const list = eraSkillGroups[eraId] || [];
  if (!list.length) return { ...skillGroups };
  return { ...skillGroups, [ERA_SKILL_GROUP]: list.map(s => s.name) };
}

// 当前时代的技能标签页顺序（含「时代技能」）
export function getEraGroupOrder(eraId) {
  const list = eraSkillGroups[eraId] || [];
  if (!list.length) return [...skillGroupOrder];
  return [...skillGroupOrder, ERA_SKILL_GROUP];
}

// 当前时代技能定义列表
export function getEraSkillList(eraId) {
  return eraSkillGroups[eraId] || [];
}
