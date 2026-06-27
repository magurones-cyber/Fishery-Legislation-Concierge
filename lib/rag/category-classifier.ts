import { categoryOptions } from "@/lib/rag/categories";

const categoryRules: Array<{ code: string; keywords: string[] }> = [
  { code: "12", keywords: ["遊漁船", "釣り船", "釣船", "瀬渡し", "渡船", "海洋レジャー", "業務主任者", "小型船舶", "利用者名簿"] },
  { code: "03", keywords: ["漁港", "漁場", "漁港施設", "用地", "占用", "目的外使用", "行政財産", "海業"] },
  { code: "04", keywords: ["漁協", "水産業協同組合", "組合員", "員外利用", "総会", "理事会", "定款"] },
  { code: "05", keywords: ["漁船", "無線", "安全操業", "機関換装", "船舶", "魚探"] },
  { code: "06", keywords: ["融資", "共済", "沿岸漁業改善資金", "経営改善", "貸付"] },
  { code: "07", keywords: ["養殖", "防疫", "排水", "取水", "薬品", "水質", "疾病"] },
  { code: "08", keywords: ["市場", "流通", "食品衛生", "衛生管理", "卸売", "加工"] },
  { code: "09", keywords: ["補助金", "交付", "対象経費", "実績報告", "消費税", "財産処分", "公有財産", "財務"] },
  { code: "10", keywords: ["浜プラン", "地域振興", "観光", "六次産業", "海業"] },
  { code: "02", keywords: ["漁業法", "漁業権", "採捕", "許可漁業", "資源管理", "漁獲", "漁業調整"] },
  { code: "01", keywords: ["水産基本法", "水産政策", "基本計画", "基本法"] },
  { code: "11", keywords: ["相談事例", "運用メモ", "過去相談", "対応記録", "指導記録"] }
];

export function classifyCategoryCode(input: string, fallbackCode = "99") {
  const normalized = input.toLowerCase();
  let best = { code: fallbackCode, score: 0 };

  for (const rule of categoryRules) {
    const score = rule.keywords.reduce((total, keyword) => total + (normalized.includes(keyword.toLowerCase()) ? 1 : 0), 0);
    if (score > best.score) {
      best = { code: rule.code, score };
    }
  }

  return categoryOptions.some((option) => option.code === best.code) ? best.code : fallbackCode;
}
