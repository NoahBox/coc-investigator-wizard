// ============================================================
// 长风味文本翻译词典（时代规则 / 掷骰表描述与注释 / 派系 / 时代信用 / 经验包）
// 键 = 中文原文；值 = 对应语言翻译；未覆盖回退中文
// ============================================================

export const FLAVOR_EN = {
  // ---- 时代规则说明（eraFeatures）----
  '掷1D10并查阅出生预兆表，影响属性/技能/幸运的初始值。': 'Roll 1D10 and consult the Omens of Birth table; it affects starting characteristics, skills, and luck.',
  '可用「格斗（盾）」代替闪避，盾牌提供额外护甲。': 'Fighting (Shield) may be used in place of Dodge; shields grant additional armor.',
  '掷1D10并查阅大事记表，影响属性/技能/幸运的初始值。': 'Roll 1D10 and consult the Chronicle table; it affects starting characteristics, skills, and luck.',
  '无职业模板：本时代所有调查员不受职业限制，可直接获得 教育×4+智力×2 技能点分配到任意技能上。': 'No occupation templates: investigators are unrestricted and directly gain EDU×4+INT×2 skill points to spend on any skills.',
  '技能调整：电气维修 01%；操作重型机械 01%；驾驶〔热气球/船舶〕。': 'Skill adjustments: Electrical Repair 01%; Operate Heavy Machinery 01%; Pilot (balloon/ship).',
  '技能调整：造梦 1/5意志%；梦境学问 1/2克苏鲁神话%。': 'Skill adjustments: Dreaming = 1/5 POW%; Dreamlands Lore = 1/2 Cthulhu Mythos%.',
  '船员派系：每名船员分属一个派系（宰丹星科 / 欧洲航天 / 迪特尔-穆勒基金 / 国家势力），派系影响任务与角色关系。': 'Crew factions: every crew member belongs to a faction (Zaidan Star Corp / European Space / Dieter-Mueller Foundation / National Powers), affecting missions and relationships.',
  '技能调整：计算机维护取代计算机使用；图书馆使用涵盖飞船电脑中的电子档案检索。': 'Skill adjustments: Computer Maintenance replaces Computer Use; Library Use covers electronic archives on ship computers.',
  '战斗调整：零重力环境下近身格斗使用「零重力」取代「格斗（斗殴）」。': 'Combat adjustment: in zero-g, close combat uses Zero-G instead of Fighting (Brawl).',
  '强韧的理智：理智损失减半，无视目击人类与动物尸体的理智损失；对神话怪物产生永久免疫后不再损失理智。': 'Hardened sanity: sanity loss is halved, and seeing human or animal corpses costs no sanity; permanent immunity to a mythos creature ends sanity loss from it.',
  '可选规则：所有幸存者开局拥有1D10点克苏鲁神话（当前理智相应减少）。': 'Optional rule: all survivors start with 1D10 Cthulhu Mythos points (current sanity reduced accordingly).',

  // ---- 掷骰表描述（eraDiceTables desc）----
  '罗马人颇为迷信——掷1D10并查阅下表，出生时发生的事件将影响你的一生。': 'The Romans were deeply superstitious — roll 1D10 and consult the table; the events of your birth shape your life.',
  '掷1D10并查阅下表，大事记为区分各个调查员提供了新的途径，也为背景增色。': 'Roll 1D10 and consult the table; the chronicle distinguishes investigators and enriches their backstory.',

  // ---- 掷骰表条目注释（note）----
  '-10 幸运': '-10 Luck', '-5 体质': '-5 CON', '+5 力量': '+5 STR',
  '+10「战术」-10「话术」': '+10 Tactics / -10 Fast Talk', '+10 幸运': '+10 Luck',
  '+10「取悦」-10「聆听」': '+10 Charm / -10 Listen', '+5 智力': '+5 INT',
  '+5 体质': '+5 CON', '-5 力量': '-5 STR', '-5 智力': '-5 INT',
  '+10「察言观色」-10「说服」': '+10 Read Person / -10 Persuade',
  '+10「话术」-10「察言观色」': '+10 Fast Talk / -10 Read Person',
  '+10「说服」-10「聆听」': '+10 Persuade / -10 Listen',
  '+10「技艺」-10「话术」': '+10 Art/Craft / -10 Fast Talk',
  '-5 外貌': '-5 APP', '+5 意志': '+5 POW', '-5 体形': '-5 SIZ',

  // ---- 派系介绍（eraFactions desc）----
  '空天技术商界领导者，代达罗斯基金会创始机构——"每个船舱的铆钉上都会有宰丹星科的标志"。': 'The aerospace industry leader and founding body of the Daedalus Foundation — "every rivet of every cabin bears the Zaidan Star mark."',
  '12个欧洲国家的军民航天工程整合而来，是代达罗斯任务的智囊支持。': 'Born from the integration of civil and military space programs of 12 European nations; the intellectual backbone of the Daedalus mission.',
  '由两个古怪隐士的资产发展而来，追求已知与未知一切领域的知识。': 'Grown from the fortunes of two eccentric recluses, pursuing knowledge in all known and unknown fields.',
  '世界列强（具体由 KP 与 PC 设定），想尽办法在船员中安插自己的成员以博取威望。': 'The world powers (as defined by Keeper and players), planting their people among the crew to gain prestige.',

  // ---- 时代信用说明（eraCreditDefs note / currency）----
  '地位在“克苏鲁不败”当中相当于信用评级。没有地位的人无足轻重，或被主流社会视作罪犯、出身低贱的奴隶。该时代以物易物为主，赛斯特斯是罗马货币（《克苏鲁不败》的基本货币单位），范例武器价格以赛斯特斯（SE）计。':
    'Status acts as Credit Rating in Cthulhu Invictus. Those without status are nobodies, seen as criminals or low-born slaves. The era runs on barter; the sestertius is the Roman currency (the base unit of Cthulhu Invictus), and sample weapons are priced in sesterces (SE).',
  '地位在“克苏鲁黑暗时代”当中相当于信用评级。黑暗时代大多数时候不会使用货币交易，而是以物易物；德尼厄尔是《克苏鲁黑暗时代》的货币单位（法国等地的银币）。':
    'Status acts as Credit Rating in Dark Ages Cthulhu. Trade is mostly barter rather than coin; the denier is the era\'s currency (a silver coin of France and elsewhere).',
  '地位在“神秘冰岛”当中相当于信用评级。冰岛人不使用银币等货币，而是用牲畜、乳品等实物交易；最重要的交易品是简朴的羊毛衫“瓦德麦尔”，交易的基本单位是“厄尔”。':
    'Status acts as Credit Rating in Mysterious Iceland. Icelanders trade in goods — livestock, dairy — rather than coin; the prized trade good is the simple wool cloak "vaðmál," and the basic unit is the "ell."',
  '在煤气灯时代，1 英镑等于 5 美元。英制货币单位包括镑（￡）、先令和便士：12 便士 = 1 先令；20 先令 = 1 镑。':
    'In the Gaslight era, £1 equals $5. British currency uses pounds (£), shillings, and pence: 12 pence = 1 shilling; 20 shillings = 1 pound.',
  '在末日世界钱变得毫无用处，信用评级代表的是更加抽象的资产——有价值的物品（比如优质的服装、正常工作的设备和有用道具：有电的电池、汽油等等）。':
    'In the End Times money is worthless; Credit Rating represents more abstract assets — valuable goods (fine clothing, working equipment, useful gear: charged batteries, gasoline, and so on).',
  '赛斯特斯（SE）': 'Sestertius (SE)', '德尼厄尔（银币）': 'Denier (silver)', '厄尔（瓦德麦尔）': 'Ell (vaðmál)',
  '没有——只有身上的衣服和手里的家伙。': 'None — just the clothes on your back and what you carry.',
  '几套衣服，1D4 件低价值道具（小刀、半满的电池等等）。': 'A few sets of clothes and 1D4 low-value items (a knife, half-charged batteries, etc.).',
  '像样的手提包，1D3 件近战武器，1 件子弹有限的射击武器，1D6+2 件低中价值道具（满电的电池、汽车电池、食品罐头等等）。':
    'A decent pack, 1D3 melee weapons, 1 firearm with limited ammo, and 1D6+2 low-to-mid value items (charged batteries, car batteries, canned food, etc.).',
  '资产的掩蔽所，1D6 件近战武器，1D4 件射击武器并有较多子弹，1D10+10 件价值不等的道具（少量汽油、机动车、高级服饰、步话机等等）。':
    'A fortified shelter, 1D6 melee weapons, 1D4 firearms with plenty of ammo, and 1D10+10 items of varying value (some gasoline, a motor vehicle, fine clothing, walkie-talkies, etc.).',
  '多处掩蔽所，1D10+10 件近战武器，1D10+10 件射击武器，3D10+30 件道具（多辆机动车、成桶的汽油、奢侈品、能工作的计算机）。':
    'Multiple shelters, 1D10+10 melee weapons, 1D10+10 firearms, and 3D10+30 items (several vehicles, barrels of gasoline, luxuries, working computers).',
  '想要什么就有什么（军火库、汽车、加油站、高科技武器、坦克等等）。': 'Anything you could want (arsenals, cars, gas stations, high-tech weapons, tanks, etc.).',
  '固定 5 先令': 'Fixed 5 shillings', '无': 'None', 'CR×1': 'CR×1', 'CR×10': 'CR×10',
  'CR×12': 'CR×12', 'CR×50': 'CR×50', '固定 £150000': 'Fixed £150,000', '固定 £300000+': 'Fixed £300,000+',

  // ---- 生活水平描述（livingStandard desc）----
  '连贫穷都够不上的人才能叫做身无分文。': 'Only those beneath even poverty are penniless.',
  '刚好买得起最廉价的屋顶，每天能吃上一餐廉价食物。': 'Can just afford the cheapest roof and one cheap meal a day.',
  '舒适的生活水平，一日三餐，偶尔下馆子。': 'Comfortable living, three meals a day, occasional dining out.',
  '小康级别已可享受奢侈品的舒适。': 'Well-off enough to enjoy the comfort of luxuries.',
  '富裕级别就是享受超级奢侈品的时候了。': 'Wealthy means enjoying super-luxuries.',
  '与富裕差不多，但钱已经只是一个代号了。': 'Much like wealthy, but money is merely a number.',

  // ---- 经验包（packages）----
  '调查员曾在战争中作为士兵出生入死（1920年代最可能是1914~1918年的一战）。战争增长了经验，也带来了伤疤。':
    'The investigator served as a soldier in a war (for the 1920s, most likely WWI, 1914–1918). War brought experience — and scars.',
  '调查员在警察队伍中工作过数年，或者已经不干这行了。': 'The investigator spent years in the police force — or has since left it.',
  '调查员的一辈子或大半辈子都在犯罪组织里沉浮。': 'The investigator spent a lifetime, or most of one, in a criminal organization.',
  '调查员是资深的医生、护士或者法医。': 'The investigator is a seasoned doctor, nurse, or medical examiner.',
  '调查员通过学术研究抑或是实际经验，拥有了克苏鲁神话知识（读书获得还是真实体验？请写入背景）。':
    'Through study or hard experience, the investigator has gained Cthulhu Mythos knowledge (from books, or firsthand? Write it into your backstory).',
  '根据战争年份与模组年份调整年龄': 'Adjust age per the war year and the scenario year',
  '初始年龄不能低于25岁': 'Starting age cannot be under 25',
  '初始年龄不能低于20岁': 'Starting age cannot be under 20',
  '初始年龄不能低于30岁': 'Starting age cannot be under 30',
  '普通士兵可选上述大部分；军官含导航、社交（魅惑/说服/恐吓）一项。': 'Most of the above for enlisted soldiers; officers add Navigation and one social skill (Charm/Persuade/Intimidate).',
  '含两项社交技能（魅惑、话术、说服、恐吓中任选）。': 'Includes two social skills (any of Charm, Fast Talk, Persuade, Intimidate).',
  '含格斗(任一)、射击(任一)、一项社交技能。': 'Includes Fighting (any), Firearms (any), and one social skill.',
  '含科学(任二)。': 'Includes Science (any two).',
  '克苏鲁神话技能增加（推荐1D10+5），最大理智值相应减少。': 'Cthulhu Mythos increases (1D10+5 recommended) and maximum sanity decreases accordingly.',
  '战争相关的伤疤/疤痕或恐惧症/躁狂症': 'War-related scars or phobia/mania',
  '警察工作相关的伤疤/疤痕或恐惧症/躁狂症': 'Police-work-related scars or phobia/mania',
  '犯罪历史相关的伤疤/疤痕或恐惧症/躁狂症': 'Criminal-history-related scars or phobia/mania',
  '个人背景相关的伤疤/疤痕或恐惧症/躁狂症': 'Personal-background-related scars or phobia/mania',
  '与神话经历相关的伤疤/疤痕、恐惧症/躁狂症、遭遇的怪异存在（任二项）': 'Mythos-related scars, phobia/mania, or strange entities encountered (any two)',
  '对目击尸体和重伤员造成的理智损失免疫。': 'Immune to sanity loss from seeing corpses and the badly wounded.',
  '对目击尸体造成的理智损失免疫。': 'Immune to sanity loss from seeing corpses.',
  '对目击尸体、目击或亲自谋杀、目击对人类的暴力残害造成的理智损失免疫。': 'Immune to sanity loss from seeing corpses, witnessing or committing murder, and witnessing violence against humans.',
  '经KP同意，"相信者"可以习得法术。': 'With Keeper approval, "believers" may learn spells.',
};

export const FLAVOR_JA = {
  // ---- 時代ルール（eraFeatures）----
  '掷1D10并查阅出生预兆表，影响属性/技能/幸运的初始值。': '1D10を振って出生の前兆表を参照。能力値・技能・幸運の初期値に影響する。',
  '可用「格斗（盾）」代替闪避，盾牌提供额外护甲。': '「格闘（盾）」を回避の代わりに使用でき、盾は追加装甲を与える。',
  '掷1D10并查阅大事记表，影响属性/技能/幸运的初始值。': '1D10を振って大事件記表を参照。能力値・技能・幸運の初期値に影響する。',
  '无职业模板：本时代所有调查员不受职业限制，可直接获得 教育×4+智力×2 技能点分配到任意技能上。': '職業テンプレートなし：全探索者が制限なく 教育×4＋知性×2 の技能点を任意の技能に割り振れる。',
  '技能调整：电气维修 01%；操作重型机械 01%；驾驶〔热气球/船舶〕。': '技能調整：電気修理 01%、重機械操作 01%、操縦〔気球／船舶〕。',
  '技能调整：造梦 1/5意志%；梦境学问 1/2克苏鲁神话%。': '技能調整：夢見＝POWの1/5%、夢境知識＝クトゥルフ神話の1/2%。',
  '船员派系：每名船员分属一个派系（宰丹星科 / 欧洲航天 / 迪特尔-穆勒基金 / 国家势力），派系影响任务与角色关系。': '乗組員派閥：各乗組員は派閥（ザイダンスターコープ／欧州宇宙／ディーター・ミュラー財団／国家勢力）に属し、任務と人間関係に影響する。',
  '技能调整：计算机维护取代计算机使用；图书馆使用涵盖飞船电脑中的电子档案检索。': '技能調整：コンピューター整備がコンピューターに代わる。図書館は船内コンピューターの電子資料検索も扱う。',
  '战斗调整：零重力环境下近身格斗使用「零重力」取代「格斗（斗殴）」。': '戦闘調整：無重力環境では近接格闘に「無重力」を「格闘（組み付き）」の代わりに使用。',
  '强韧的理智：理智损失减半，无视目击人类与动物尸体的理智损失；对神话怪物产生永久免疫后不再损失理智。': '強靭な正気度：正気度喪失は半減し、人間や動物の死体を目撃しても喪失しない。神話生物への永続免疫を得た後は正気度を失わない。',
  '可选规则：所有幸存者开局拥有1D10点克苏鲁神话（当前理智相应减少）。': '任意ルール：全生存者は初期に1D10点のクトゥルフ神話を得る（現在の正気度も同値減少）。',

  // ---- ダイス表説明（desc）----
  '罗马人颇为迷信——掷1D10并查阅下表，出生时发生的事件将影响你的一生。': 'ローマ人は非常に迷信深い——1D10を振って下表を参照。誕生時の出来事が人生を左右する。',
  '掷1D10并查阅下表，大事记为区分各个调查员提供了新的途径，也为背景增色。': '1D10を振って下表を参照。大事件記は探索者を個性化し、背景を豊かにする。',

  // ---- ダイス表注記（note）----
  '-10 幸运': '-10 幸運', '-5 体质': '-5 体力', '+5 力量': '+5 筋力',
  '+10「战术」-10「话术」': '+10 戦術 / -10 言いくるめ', '+10 幸运': '+10 幸運',
  '+10「取悦」-10「聆听」': '+10 魅惑 / -10 聞き耳', '+5 智力': '+5 知性',
  '+5 体质': '+5 体力', '-5 力量': '-5 筋力', '-5 智力': '-5 知性',
  '+10「察言观色」-10「说服」': '+10 観察眼 / -10 説得',
  '+10「话术」-10「察言观色」': '+10 言いくるめ / -10 観察眼',
  '+10「说服」-10「聆听」': '+10 説得 / -10 聞き耳',
  '+10「技艺」-10「话术」': '+10 芸術／製作 / -10 言いくるめ',
  '-5 外貌': '-5 外見', '+5 意志': '+5 精神', '-5 体形': '-5 体格',

  // ---- 派閥紹介（desc）----
  '空天技术商界领导者，代达罗斯基金会创始机构——"每个船舱的铆钉上都会有宰丹星科的标志"。': '航空宇宙技術界のリーダーで、ダイダロス財団の創設母体——「どの船室のリベットにもザイダンスターの刻印がある」。',
  '12个欧洲国家的军民航天工程整合而来，是代达罗斯任务的智囊支持。': '欧州12カ国の軍民宇宙計画を統合して誕生。ダイダロス計画の頭脳的支え。',
  '由两个古怪隐士的资产发展而来，追求已知与未知一切领域的知识。': '二人の風変わりな隠者の資産から発展し、既知・未知すべての領域の知識を求める。',
  '世界列强（具体由 KP 与 PC 设定），想尽办法在船员中安插自己的成员以博取威望。': '世界の列強（詳細はKPとPCが設定）。威信のため自国の人間を乗組員に送り込む。',

  // ---- 時代信用説明（note / currency）----
  '地位在“克苏鲁不败”当中相当于信用评级。没有地位的人无足轻重，或被主流社会视作罪犯、出身低贱的奴隶。该时代以物易物为主，赛斯特斯是罗马货币（《克苏鲁不败》的基本货币单位），范例武器价格以赛斯特斯（SE）计。':
    '「クトゥルフ・インヴィクトゥス」では地位が信用レーティングに相当。地位のない者は取るに足らず、犯罪者や身分の低い奴隷と見なされる。時代は物々交換が主で、セステルティウスはローマの通貨（基本単位）、武器の例はセステルティウス（SE）で表示。',
  '地位在“克苏鲁黑暗时代”当中相当于信用评级。黑暗时代大多数时候不会使用货币交易，而是以物易物；德尼厄尔是《克苏鲁黑暗时代》的货币单位（法国等地的银币）。':
    '「暗黒時代のクトゥルフ」では地位が信用レーティングに相当。取引は貨幣より物々交換が主。ドゥニエは同時代の通貨単位（フランスなどの銀貨）。',
  '地位在“神秘冰岛”当中相当于信用评级。冰岛人不使用银币等货币，而是用牲畜、乳品等实物交易；最重要的交易品是简朴的羊毛衫“瓦德麦尔”，交易的基本单位是“厄尔”。':
    '「神秘のアイスランド」では地位が信用レーティングに相当。銀貨などは使わず家畜や乳製品で交易。最も重要な交易品は簡素な毛織物「ヴァーズマール」で、基本単位は「エル」。',
  '在煤气灯时代，1 英镑等于 5 美元。英制货币单位包括镑（￡）、先令和便士：12 便士 = 1 先令；20 先令 = 1 镑。':
    'ガス燈の時代、1ポンドは5ドル。英国通貨はポンド（￡）、シリング、ペニー：12ペニー＝1シリング、20シリング＝1ポンド。',
  '在末日世界钱变得毫无用处，信用评级代表的是更加抽象的资产——有价值的物品（比如优质的服装、正常工作的设备和有用道具：有电的电池、汽油等等）。':
    '終末世界では金は無価値。信用レーティングはより抽象的な資産——価値ある品物（上質な服、動く装備、有用な道具：充電済み電池、ガソリンなど）を表す。',
  '赛斯特斯（SE）': 'セステルティウス（SE）', '德尼厄尔（银币）': 'ドゥニエ（銀貨）', '厄尔（瓦德麦尔）': 'エル（ヴァーズマール）',
  '没有——只有身上的衣服和手里的家伙。': 'なし——着ている服と手元の物だけ。',
  '几套衣服，1D4 件低价值道具（小刀、半满的电池等等）。': '衣類数着、低価値の道具1D4個（ナイフ、半充電の電池など）。',
  '像样的手提包，1D3 件近战武器，1 件子弹有限的射击武器，1D6+2 件低中价值道具（满电的电池、汽车电池、食品罐头等等）。':
    'それなりのバッグ、近接武器1D3個、弾の限られた銃器1丁、低〜中価値の道具1D6+2個（満充電の電池、車用バッテリー、缶詰など）。',
  '资产的掩蔽所，1D6 件近战武器，1D4 件射击武器并有较多子弹，1D10+10 件价值不等的道具（少量汽油、机动车、高级服饰、步话机等等）。':
    '頑丈な隠れ家、近接武器1D6個、弾の豊富な銃器1D4丁、価値の異なる道具1D10+10個（少量のガソリン、自動車、高級衣類、トランシーバーなど）。',
  '多处掩蔽所，1D10+10 件近战武器，1D10+10 件射击武器，3D10+30 件道具（多辆机动车、成桶的汽油、奢侈品、能工作的计算机）。':
    '複数の隠れ家、近接武器1D10+10個、銃器1D10+10丁、道具3D10+30個（複数の車両、ガソリン数樽、奢侈品、動くコンピューター）。',
  '想要什么就有什么（军火库、汽车、加油站、高科技武器、坦克等等）。': '欲しいものは何でも（武器庫、自動車、給油所、ハイテク兵器、戦車など）。',
  '固定 5 先令': '固定5シリング', '无': 'なし', 'CR×1': 'CR×1', 'CR×10': 'CR×10',
  'CR×12': 'CR×12', 'CR×50': 'CR×50', '固定 £150000': '固定£150000', '固定 £300000+': '固定£300000以上',

  // ---- 生活水準説明（livingStandard desc）----
  '连贫穷都够不上的人才能叫做身无分文。': '貧乏にも満たない者だけが無一文と呼ばれる。',
  '刚好买得起最廉价的屋顶，每天能吃上一餐廉价食物。': '最安の屋根を借りられ、1日1食の粗食がやっと。',
  '舒适的生活水平，一日三餐，偶尔下馆子。': '快適な生活。1日3食、たまに外食もできる。',
  '小康级别已可享受奢侈品的舒适。': '余裕があれば贅沢品の快適さも楽しめる。',
  '富裕级别就是享受超级奢侈品的时候了。': '裕福なら超高級品を楽しむ時だ。',
  '与富裕差不多，但钱已经只是一个代号了。': '裕福とほぼ同じだが、金はもはや単なる数字。',

  // ---- 経験パック（packages）----
  '调查员曾在战争中作为士兵出生入死（1920年代最可能是1914~1918年的一战）。战争增长了经验，也带来了伤疤。':
    '探索者は戦争で兵士として戦った（1920年代ならおそらく1914〜1918年の世界大戦）。戦争は経験をもたらし、傷跡も残した。',
  '调查员在警察队伍中工作过数年，或者已经不干这行了。': '探索者は警察に数年いた（あるいはすでに辞めている）。',
  '调查员的一辈子或大半辈子都在犯罪组织里沉浮。': '探索者は一生、あるいは人生の大半を犯罪組織で過ごした。',
  '调查员是资深的医生、护士或者法医。': '探索者は熟練した医師、看護師、または法医。',
  '调查员通过学术研究抑或是实际经验，拥有了克苏鲁神话知识（读书获得还是真实体验？请写入背景）。':
    '探索者は学術研究か実体験でクトゥルフ神話の知識を得た（本で得たか、実際に経験したか？背景に書こう）。',
  '根据战争年份与模组年份调整年龄': '戦争の年とシナリオの年に合わせて年齢を調整',
  '初始年龄不能低于25岁': '初期年齢は25歳以上',
  '初始年龄不能低于20岁': '初期年齢は20歳以上',
  '初始年龄不能低于30岁': '初期年齢は30歳以上',
  '普通士兵可选上述大部分；军官含导航、社交（魅惑/说服/恐吓）一项。': '一般兵は上記の大半を選択可能。将校はナビゲートと社交（魅惑／説得／脅迫）1つを追加。',
  '含两项社交技能（魅惑、话术、说服、恐吓中任选）。': '社交技能2つ（魅惑、言いくるめ、説得、脅迫から任意）。',
  '含格斗(任一)、射击(任一)、一项社交技能。': '格闘（任意）、射撃（任意）、社交技能1つを含む。',
  '含科学(任二)。': '科学（任意2つ）を含む。',
  '克苏鲁神话技能增加（推荐1D10+5），最大理智值相应减少。': 'クトゥルフ神話が増加（推奨1D10+5）し、最大正気度も同値減少。',
  '战争相关的伤疤/疤痕或恐惧症/躁狂症': '戦争関連の傷跡、または恐怖症／躁症',
  '警察工作相关的伤疤/疤痕或恐惧症/躁狂症': '警察活動関連の傷跡、または恐怖症／躁症',
  '犯罪历史相关的伤疤/疤痕或恐惧症/躁狂症': '犯罪歴関連の傷跡、または恐怖症／躁症',
  '个人背景相关的伤疤/疤痕或恐惧症/躁狂症': '個人の背景関連の傷跡、または恐怖症／躁症',
  '与神话经历相关的伤疤/疤痕、恐惧症/躁狂症、遭遇的怪异存在（任二项）': '神話体験関連の傷跡、恐怖症／躁症、遭遇した異形（いずれか2つ）',
  '对目击尸体和重伤员造成的理智损失免疫。': '死体や重傷者の目撃による正気度喪失に免疫。',
  '对目击尸体造成的理智损失免疫。': '死体の目撃による正気度喪失に免疫。',
  '对目击尸体、目击或亲自谋杀、目击对人类的暴力残害造成的理智损失免疫。': '死体の目撃、殺人の目撃・実行、人間への暴力の目撃による正気度喪失に免疫。',
  '经KP同意，"相信者"可以习得法术。': 'KPの許可があれば「信者」は呪文を学べる。',
};
