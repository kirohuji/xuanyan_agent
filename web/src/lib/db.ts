// ===================================================
// 玄言生物科技 — DD 业务数据库（模拟数据）
// ===================================================
// 支持表: pipeline(管线) clinical(临床数据)
//         finance(财务) team(团队) patents(专利)
//         hospitals(合作医院) competitors(竞品)
//         company(公司信息)
// ===================================================

export const demoDB = {
  // 公司概览
  company: [
    { field: "公司名称", value: "玄言生物科技（Xuanyan Bio）" },
    { field: "法定代表人", value: "曹玄烨" },
    { field: "成立时间", value: "2021年" },
    { field: "总部", value: "上海浦东张江" },
    { field: "定位", value: "数据+AI+生物学三位一体的精准医疗平台型企业" },
    { field: "融资", value: "B轮，累计超3亿元人民币" },
    { field: "投资方", value: "红杉中国、启明创投、浦东科创投" },
    { field: "团队规模", value: "约120人，研发占比70%，博士占比35%" },
  ],

  // 管线
  pipeline: [
    { id: 1, product: "甲转探® ThyroExplore®", category: "诊断", indication: "甲状腺结节良恶性鉴别", phase: "已上市（NMPA 2025.03）", fda_status: "510(k) 审批中" },
    { id: 2, product: "PanCancer-1 多癌种早筛", category: "诊断", indication: "肺癌/结直肠癌/胃癌/肝癌/食管癌/胰腺癌", phase: "临床研究（3000例入组）", fda_status: "-" },
    { id: 3, product: "XY-C01 CD14/CD3 双抗", category: "治疗", indication: "非小细胞肺癌/三阴性乳腺癌/结直肠癌", phase: "IND enabling（毒理）", fda_status: "IND 2026" },
    { id: 4, product: "XY-I01 CD14-IL15 融合蛋白", category: "治疗", indication: "急性髓系白血病/MDS", phase: "先导化合物优化", fda_status: "-" },
  ],

  // 临床数据
  clinical: [
    { trial: "甲转探回顾性验证", phase: "回顾性", sample_size: 807, sensitivity: 97.3, specificity: 94.1, auc: 0.986, year: 2023 },
    { trial: "甲转探前瞻性验证", phase: "前瞻性多中心", sample_size: 1200, sensitivity: 96.5, specificity: 93.8, auc: 0.982, year: 2024 },
    { trial: "甲转探vs超声对比", phase: "前瞻性队列", sample_size: 1200, sensitivity: 96.5, vs_ultrasound: 71.9, unnecessary_biopsy_reduction: "47.3%", year: 2024 },
  ],

  // 财务
  finance: [
    { year: 2024, revenue_wan: 520, gross_margin: "59.6%", rd_wan: 2800, net_profit_wan: -3240 },
    { year: 2025, revenue_wan: 3300, gross_margin: "70.0%", rd_wan: 3500, net_profit_wan: -3190 },
    { year: 2026, revenue_wan: 10000, gross_margin: "72.0%", rd_wan: 4500, net_profit_wan: -1500 },
    { year: 2027, revenue_wan: 28000, gross_margin: "75.0%", rd_wan: 6000, net_profit_wan: 6200 },
    { year: 2028, revenue_wan: 62000, gross_margin: "77.4%", rd_wan: 8000, net_profit_wan: 25500 },
  ],

  // 团队
  team: [
    { name: "曹玄烨", title: "CEO/董事长", background: "法定代表人，持股49.5%", expertise: "公司整体战略" },
    { name: "李明远", title: "CSO", background: "前Roche资深科学家", expertise: "抗体药物开发" },
    { name: "王思远", title: "CTO", background: "前阿里云AI首席架构师", expertise: "医疗AI平台" },
    { name: "陈慧琳", title: "CMO", background: "前FDA审评员", expertise: "IVD/药物注册" },
  ],

  // 专利
  patents: [
    { id: "CN114XXXXXX", title: "基于DNA甲基化的甲状腺结节鉴别诊断方法", status: "已授权", year: 2023 },
    { id: "CN115XXXXXX", title: "多癌种甲基化标志物组合", status: "已授权", year: 2024 },
    { id: "CN116XXXXXX", title: "CD14/CD3双特异性抗体结构", status: "已授权", year: 2025 },
    { id: "CN116XXXXXX", title: "CD14-IL15融合蛋白", status: "已授权", year: 2025 },
  ],

  // 合作医院
  hospitals: [
    { name: "复旦大学附属中山医院", area: "甲状腺/肺癌", signed: "2022" },
    { name: "上海交通大学附属瑞金医院", area: "血液肿瘤", signed: "2023" },
    { name: "上海市胸科医院", area: "肺癌早筛", signed: "2023" },
    { name: "复旦大学附属肿瘤医院", area: "甲状腺癌", signed: "2024" },
    { name: "上海长海医院", area: "消化系统肿瘤", signed: "2024" },
  ],

  // 竞品
  competitors: [
    { name: "Grail", core_tech: "cfDNA甲基化", product: "Galleri®", valuation: "~$20亿", weakness: "无中国人群数据" },
    { name: "Exact Sciences", core_tech: "DNA甲基化", product: "Cologuard®", valuation: "~$100亿", weakness: "单癌种" },
    { name: "Tempus", core_tech: "多模态数据+AI", product: "Tempus Ecosystem", valuation: "~$60亿", weakness: "无治疗管线" },
    { name: "燃石医学", core_tech: "ctDNA突变+甲基化", product: "多癌种早筛", valuation: "退市", weakness: "数据积累不足" },
  ],
};

export function queryDB(sql: string): string {
  const s = sql.toLowerCase().trim();

  if (s.includes("company") || s.includes("公司") || s.includes("概览") || s.includes("overview")) {
    return JSON.stringify(demoDB.company, null, 2);
  }
  if (s.includes("pipeline") || s.includes("管线") || s.includes("product")) {
    return JSON.stringify(demoDB.pipeline, null, 2);
  }
  if (s.includes("clinical") || s.includes("临床") || s.includes("trial") || s.includes("验证")) {
    return JSON.stringify(demoDB.clinical, null, 2);
  }
  if (s.includes("finance") || s.includes("财务") || s.includes("收入") || s.includes("利润") || s.includes("revenue")) {
    return JSON.stringify(demoDB.finance, null, 2);
  }
  if (s.includes("team") || s.includes("团队") || s.includes("executive") || s.includes("创始人")) {
    return JSON.stringify(demoDB.team, null, 2);
  }
  if (s.includes("patent") || s.includes("专利") || s.includes("知识产权") || s.includes("ip")) {
    return JSON.stringify(demoDB.patents, null, 2);
  }
  if (s.includes("hospital") || s.includes("医院") || s.includes("partner") || s.includes("合作")) {
    return JSON.stringify(demoDB.hospitals, null, 2);
  }
  if (s.includes("competitor") || s.includes("竞品") || s.includes("对标") || s.includes("竞争")) {
    return JSON.stringify(demoDB.competitors, null, 2);
  }
  if (s.includes("all") || s.includes("全部") || s.includes("*")) {
    return JSON.stringify(demoDB, null, 2);
  }

  return `无法识别查询: ${sql}。支持: company(公司), pipeline(管线), clinical(临床), finance(财务), team(团队), patents(专利), hospitals(医院), competitors(竞品)`;
}
