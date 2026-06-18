const category12Keywords = [
  "遊漁船",
  "遊漁船業",
  "釣り船",
  "釣船",
  "瀬渡し",
  "渡船",
  "船釣り",
  "体験漁業",
  "観光漁業",
  "海洋レジャー",
  "業務主任者",
  "遊漁船業務主任者",
  "業務規程",
  "利用者名簿",
  "損害賠償保険",
  "出航判断",
  "遊漁船登録",
  "登録更新",
  "変更届出",
  "廃業届出",
  "事故報告",
  "特定操縦免許"
];

const crossCategoryRules = [
  { code: "03", keywords: ["漁港から出航", "係留", "岸壁使用", "漁港施設利用", "駐車場利用", "漁港", "岸壁"] },
  { code: "10", keywords: ["浜プラン", "海業", "観光", "所得向上", "地域振興", "体験漁業"] },
  { code: "05", keywords: ["船舶免許", "船舶検査", "安全設備", "無線", "小型船舶操縦士", "特定操縦免許"] },
  { code: "02", keywords: ["漁業権", "採捕", "漁場利用", "資源管理", "漁場トラブル"] },
  { code: "04", keywords: ["漁協所属", "組合員", "漁協事業", "定款", "員外利用", "漁協施設利用", "漁協"] },
  { code: "06", keywords: ["融資", "兼業支援", "経営改善"] },
  { code: "09", keywords: ["補助金"] }
];

export function classifyCategoryCodes(query: string) {
  const codes: string[] = [];
  if (category12Keywords.some((keyword) => query.includes(keyword))) {
    codes.push("12");
  }

  for (const rule of crossCategoryRules) {
    if (rule.keywords.some((keyword) => query.includes(keyword)) && !codes.includes(rule.code)) {
      codes.push(rule.code);
    }
  }

  return codes;
}
