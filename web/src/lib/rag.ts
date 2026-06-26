import { cosineSimilarity } from "./utils";

// ===================================================
// 玄言生物科技 — 尽调知识库（模拟数据）
// ===================================================
// 数据来源：公司BP、行研报告、临床文献、FDA数据库、
//          国家企业信用信息公示系统、天眼查
// ===================================================
const docs = [
  // ---- 公司概览 ----
  {
    id: "company-overview",
    title: "公司概览",
    content: `玄言生物科技（Xuanyan Bio）成立于2021年，总部位于上海浦东张江。
公司专注于AI驱动的多组学液体活检和免疫治疗靶点发现平台。
法定代表人：曹玄烨。

核心定位：不是普通检测公司，而是"数据+AI+生物学"三位一体的精准医疗平台型企业。

核心业务线：
1. 甲转探®（ThyroExplore®）—— 基于DNA甲基化的甲状腺结节良恶性鉴别诊断产品
2. XY-C01（CD14/CD3双特异性抗体）—— 针对CD14+肿瘤相关巨噬细胞的免疫治疗药物
3. XY-I01（CD14-IL15融合蛋白）—— 肿瘤免疫治疗管线
4. PanCancer-1 —— 基于cfDNA甲基化的多癌种早期检测

融资情况：已完成B轮融资，累计融资额超3亿元人民币，投资方包括红杉中国、启明创投、浦东科创投。
团队规模：约120人，研发占比70%，博士学历占比35%。

知识产权：已授权中国专利4项，申请中8项，PCT国际申请3项，美国申请2项。`,
  },

  // ---- 团队背景 ----
  {
    id: "team",
    title: "团队背景",
    content: `法定代表人 & 董事长：曹玄烨

【董事会】
- 曹玄烨 — 董事长
- 白敏 — 董事
- 俞佳妮 — 董事
- 葛建成 — 董事

【监事会】
- 林伟杰 — 监事

【财务负责人】
- 白静 — 财务负责人

【核心团队】
- CEO：曹玄烨（法定代表人，持股49.5%）
- CSO：李明远博士（前罗氏资深科学家）
- CTO：王思远博士（前阿里云AI首席架构师）
- CMO：陈慧琳博士（前FDA审评员）

科学顾问委员会：
- 复旦大学附属中山医院 刘教授（肿瘤学）
- 上海瑞金医院 王教授（血液病学）
- 美国MD Anderson癌症中心 J. Smith教授（免疫治疗）`
  },

  // ---- 管线地图 ----
  {
    id: "pipeline",
    title: "管线地图",
    content: `玄言生物科技管线一览：

【诊断管线】
1. 甲转探®（ThyroExplore®）—— DNA甲基化甲状腺结节良恶性鉴别诊断
   - 阶段：已获NMPA三类医疗器械注册证（2025年3月），FDA 510(k) 注册中
   - 外部验证807例：敏感性97.3%，特异性94.1%，AUC 0.986
   - 对比超声（TI-RADS）：敏感性提升25.4个百分点（97.3% vs 71.9%）

2. PanCancer-1 多癌种早筛 —— 基于cfDNA甲基化的多癌种早期检测
   - 阶段：临床研究阶段，已完成3000例前瞻性队列入组
   - 覆盖癌种：肺癌、结直肠癌、胃癌、肝癌、食管癌、胰腺癌
   - 预计2025年12月完成临床研究，2026年Q1提交NMPA注册

【治疗管线】
3. XY-C01（CD14/CD3双特异性抗体）—— 针对CD14+肿瘤相关巨噬细胞
   - 阶段：IND enabling（毒理研究中）
   - 适应症：非小细胞肺癌、三阴性乳腺癌、结直肠癌
   - 机制：招募T细胞至肿瘤微环境，重编程TAM从M2向M1极化

4. XY-I01（CD14-IL15融合蛋白）—— 靶向CD14+免疫抑制性髓系细胞
   - 阶段：先导化合物优化（lead optimization）
   - 适应症：急性髓系白血病（AML）、骨髓增生异常综合征（MDS）`,
  },

  // ---- 数据资产 ----
  {
    id: "data-assets",
    title: "数据资产",
    content: `玄言生物科技核心数据资产：

1. 甲基化数据库：超过5万例中国人群组织/血液甲基化数据，覆盖20+癌种和30+良性病变
2. 多组学数据库：整合基因组、转录组、蛋白质组、甲基化组的10万+样本多维度数据
3. 真实世界数据（RWE）：与复旦附属中山医院、瑞金医院、上海胸科医院等12家三甲医院建立数据共享合作，累计获取50万+例脱敏诊疗记录
4. 免疫微环境数据库：单细胞测序数据3000+例，空间转录组数据500+例
5. AI模型库：自主研发的DeepMeth®甲基化分析模型、ImmunoNet®免疫微环境预测模型、DrugSyn®药物协同预测模型

数据壁垒评估：中国人群特有甲基化数据具有排他性，医院合作关系建立后竞争对手难以复制。每年新增数据增量约1.5万例。`,
  },

  // ---- 甲转探临床验证 ----
  {
    id: "clinical-thyroexplore",
    title: "甲转探®临床验证",
    content: `甲转探®（ThyroExplore®）临床验证数据：

【回顾性验证（2023）】
- 样本量：807例（恶性342例，良性465例）
- 敏感性：97.3%（95%CI: 95.1%-98.7%）
- 特异性：94.1%（95%CI: 91.8%-95.9%）
- AUC：0.986（95%CI: 0.975-0.994）

【前瞻性验证（2024-2025）】
- 样本量：1200例（多中心，4家三甲医院）
- 敏感性：96.5%（95%CI: 94.6%-97.9%）
- 特异性：93.8%（95%CI: 91.9%-95.3%）
- 阳性预测值（PPV）：88.2%
- 阴性预测值（NPV）：98.4%

【与超声对比（前瞻性队列）】
| 指标 | 甲转探® | TI-RADS 4类及以上 | 差异 |
|------|---------|-------------------|------|
| 敏感性 | 96.5% | 71.9% | +24.6% |
| 特异性 | 93.8% | 90.5% | +3.3% |
| AUC | 0.982 | 0.812 | +0.170 |
| 不必要穿刺减少 | - | - | 47.3% |`,
  },

  // ---- FDA/注册路径 ----
  {
    id: "fda-regulatory",
    title: "FDA 注册路径",
    content: `玄言生物科技FDA/注册路径：

【甲转探® FDA 510(k)】
- 提交时间：2025年Q3
- 预计获批：2026年Q2-Q3
- 对照器械：Affirma Gene Expression Classifier (GEC)
- 关键优势：相比GEC需要FNA样本，甲转探仅需外周血（液体活检），无创
- 已与FDA进行Q-submission预沟通，FDA认可临床数据

【FDA最大风险】
1. 临床数据完整性：FDA可能要求在美国人群补充验证（约200-300例）。风险等级：中等。
   解决方案：已与美国克利夫兰诊所达成初步合作意向。
2. 液体活检门槛：FDA对液体活检产品监管日趋严格。风险等级：中低。
   解决方案：聘请前FDA审评员陈慧琳博士为CMO，全程负责注册。
3. 生产质量控制。风险等级：低。
   解决方案：已与CDMO签订质量协议，可按FDA 21 CFR 820合规生产。

【中国NMPA注册进度】
- 甲转探®：已获三类医疗器械注册证（2025年3月）
- PanCancer-1 多癌种早筛：2026年Q1提交NMPA注册`,
  },

  // ---- 商业化模型 ----
  {
    id: "commercial-model",
    title: "商业化模型",
    content: `玄言生物科技商业化模型：

【甲转探®定价策略】
- 终端定价：人民币3,800元/次检测
- 医保覆盖：已进入上海市"沪惠保"报销目录（自付30%）
- 目标市场：全国每年新增甲状腺结节患者约2000万例，活检阳性率约5-10%

【销售渠道】
1. 直销团队：覆盖长三角地区50家三甲医院（已签约32家）
2. 经销商网络：覆盖全国23个省份，已签约87家经销商
3. IVD平台合作：与华大基因、金域医学就渠道合作进行谈判

【出海战略】
1. FDA 510(k)获批后进入美国市场，定价$2,500/次
2. 与Quest Diagnostics或LabCorp合作进行美国商业化
3. 东南亚市场（与新加坡国立大学医院合作中）

【收入预测】
| 年份 | 总计 |
|------|------|
| 2025 | 3,300万 |
| 2026 | 10,000万 |
| 2027 | 2.8亿 |
| 2028 | 6.2亿 |`,
  },

  // ---- 竞品对标 ----
  {
    id: "competitive-landscape",
    title: "竞品对标分析",
    content: `玄言生物科技竞品对标分析：

【液体活检领域】
| 公司 | 核心技术 | 主要产品 | 估值 | 差异点 |
|------|---------|---------|------|-------|
| 玄言生物 | DNA甲基化+AI | 甲转探®/多癌种早筛 | B轮3亿RMB | 中国人群数据+AI平台+治疗管线 |
| Grail | cfDNA甲基化 | Galleri® | ~$20亿 | 美国为主，无中国人群数据 |
| Exact Sciences | DNA甲基化 | Cologuard® | ~$100亿 | 单癌种，FDA已验证 |
| 燃石医学 | ctDNA突变+甲基化 | 多癌种早筛 | 退市 | 烧钱模式，数据积累不及玄言 |

【玄言差异化优势】
1. 中国人群特有甲基化数据（5万+例），具有排他性
2. AI平台整合多组学数据，不仅仅是单一标志物检测
3. "诊断+治疗"双轮驱动模式

【为什么玄言不是普通检测公司】
玄言的本质是"数据飞轮公司"：诊断产品产生临床数据和现金流 → 数据训练AI平台 → AI平台发现新靶点 → 靶点转化为治疗管线 → 管线临床试验产生更多数据 → 反哺AI平台。这个闭环是纯检测公司无法复制的。`,
  },

  // ---- 财务预测 ----
  {
    id: "financial-projections",
    title: "财务预测",
    content: `玄言生物科技财务预测（基于管理层预测，未经审计）：

【损益表关键数据】（单位：人民币万元）
| 项目 | 2024 | 2025E | 2026E | 2027E | 2028E |
|------|------|-------|-------|-------|-------|
| 营业收入 | 520 | 3,300 | 10,000 | 28,000 | 62,000 |
| 营业成本 | (210) | (990) | (2,800) | (7,000) | (14,000) |
| 毛利 | 310 | 2,310 | 7,200 | 21,000 | 48,000 |
| 毛利率 | 59.6% | 70.0% | 72.0% | 75.0% | 77.4% |
| 研发费用 | (2,800) | (3,500) | (4,500) | (6,000) | (8,000) |
| 净利润 | (3,240) | (3,190) | (1,500) | 6,200 | 25,500 |

【现金流】
- 现有现金及理财约1.2亿元（B轮后）
- 预计可支撑至2027年实现盈亏平衡
- 2027年计划启动C轮融资，目标融资额2-3亿元

【估值参考】
- B轮估值：12亿元（2024年）
- 预计C轮估值：25-30亿元`,
  },

  // ---- 风险与应对 ----
  {
    id: "risks",
    title: "风险与应对",
    content: `玄言生物科技主要风险与应对：

【技术风险】
1. 甲转探临床对比超声优势是否可持续？
   → 前瞻性多中心验证显示敏感性持续优于超声（96.5% vs 71.9%），p<0.001
2. CD14/CD3毒理问题是否解决？
   → 第二代分子XY-C02已降低CRS风险，食蟹猴毒理20mg/kg安全

【监管风险】
3. FDA审批不确定性
   → 已聘请前FDA审评员为CMO，已完成Q-submission准备
4. NMPA集采风险
   → 甲转探为三类创新医疗器械，享有独立定价权

【商业风险】
5. 产品商业化不及预期
   → 已签约32家三甲医院和87家经销商
6. 竞争加剧
   → 中国人群特异性数据库+AI平台+治疗管线构成多层次壁垒

【财务风险】
7. 现金流不足以支撑到盈亏平衡
   → 现有资金1.2亿，年消耗约3,500万，可支撑至2027年
8. 收入预测过于乐观
   → 基于甲转探渗透率从0.1%逐步提升至1.5%，相对保守`,
  },

  // ---- 合作医院 ----
  {
    id: "hospital-partnerships",
    title: "医院合作",
    content: `玄言生物科技医院合作网络：

【战略合作医院（联合实验室/临床研究）】
1. 复旦大学附属中山医院 — 甲状腺结节/肺癌液体活检合作（2022年签约）
2. 上海交通大学附属瑞金医院 — 血液肿瘤合作（2023年签约）
3. 上海市胸科医院 — 肺癌早筛合作（2023年签约）
4. 复旦大学附属肿瘤医院 — 甲状腺癌合作（2024年签约）
5. 上海长海医院 — 消化系统肿瘤合作（2024年签约）

【产品入驻医院】
- 32家三甲医院已完成甲转探®入院签约
- 以上海、浙江、江苏为核心区域
- 2025年目标扩展至80家三甲医院

【国际合作】
1. 美国克利夫兰诊所 — FDA验证研究合作意向书（2025年）
2. 新加坡国立大学医院 — 东南亚市场合作意向（2025年）
3. MD Anderson癌症中心 — 科学顾问委员会合作`,
  },

  // ---- 专利与知识产权 ----
  {
    id: "patents",
    title: "专利与论文",
    content: `玄言生物科技知识产权：

【已授权专利】（中国）
1. CN114XXXXXX — 基于DNA甲基化的甲状腺结节鉴别诊断方法（2023年）
2. CN115XXXXXX — 多癌种甲基化标志物组合（2024年）
3. CN116XXXXXX — CD14/CD3双特异性抗体结构（2025年）
4. CN116XXXXXX — CD14-IL15融合蛋白（2025年）

【申请中】
- 中国：8项（其中4项已公开）
- PCT国际申请：3项
- 美国：2项

【核心论文】
1. Zhang X, et al. "DNA methylation classifier for thyroid nodule diagnosis: a multicenter study." Nature Communications, 2024.
2. Li M, et al. "CD14-targeted bispecific T-cell engager for tumor-associated macrophage reprogramming." Cancer Cell, 2025.
3. Wang S, et al. "DeepMeth: A deep learning framework for methylation pattern analysis." Nature Machine Intelligence, 2024.`,
  },
];

// 文档向量缓存
let cachedVectors: Map<string, number[]> | null = null;

const EMBEDDING_URL = "http://127.0.0.1:2620/v1/embeddings";
const EMBEDDING_API_KEY = "llama_8f3b0c9a4e2d7f1c6a9b2e8d0f4c1a7b9e3d5f6a8c2b1d0e4f7a9c3b6d8e1f2a";

async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch(EMBEDDING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${EMBEDDING_API_KEY}` },
      body: JSON.stringify({ model: "qwen2.5-7b", input: text }),
    });
    const data = await res.json();
    return data.data?.[0]?.embedding || new Array(1024).fill(0);
  } catch {
    // fallback: simple hash-based vector
    const dummy = new Array(256).fill(0);
    for (let i = 0; i < text.length && i < 256; i++) {
      dummy[i] = text.charCodeAt(i) / 128;
    }
    return dummy;
  }
}

async function ensureVectors(): Promise<Map<string, number[]>> {
  if (cachedVectors) return cachedVectors;
  cachedVectors = new Map();
  for (const doc of docs) {
    cachedVectors.set(doc.id, await getEmbedding(doc.title + " " + doc.content));
  }
  return cachedVectors;
}

export async function searchKnowledge(query: string, topK = 3): Promise<string> {
  try {
    const qVec = await getEmbedding(query);
    const vectors = await ensureVectors();

    const scored = docs.map((doc) => ({
      doc,
      score: cosineSimilarity(qVec, vectors.get(doc.id) || []),
    }));

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK);

    return top
      .map(
        ({ doc, score }) =>
          `【${doc.title}】(相关度 ${(score * 100).toFixed(1)}%)\n${doc.content}`
      )
      .join("\n\n———\n\n");
  } catch (e: any) {
    return `知识库检索失败: ${e.message}`;
  }
}
