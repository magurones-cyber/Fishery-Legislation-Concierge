export type MaskingResult = {
  rawText: string;
  maskedText: string;
  containsPersonalData: boolean;
};

const maskingRules: Array<[RegExp, string]> = [
  [/(?:氏名|担当者|相談者|代表者|船長)\s*[:：]\s*[^\s、。]{2,12}/g, "[氏名]"],
  [/([一-龥ぁ-んァ-ヶ]{2,4})\s*(?:さん|氏|様)/g, "[氏名]"],
  [/([^\s、。\[\]]{2,20}(?:丸|号|艇|船))/g, "[船名]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[メールアドレス]"],
  [/(?:0\d{1,4}-\d{1,4}-\d{3,4}|0\d{9,10})/g, "[電話番号]"],
  [/\b\d{2,4}-\d{2,4}-\d{2,4}\b/g, "[登録番号等]"],
  [/(?:登録番号|許可番号|船舶番号)\s*[:：]?\s*[A-Za-z0-9一-龥第\-ー]{3,30}/g, "[登録番号等]"],
  [/([^\s、。]{2,30}(?:漁協|株式会社|有限会社|合同会社|協同組合))/g, "[団体名]"],
  [/(?:事業者名|申請者|法人名)\s*[:：]\s*[^\s、。]{2,30}/g, "[事業者名]"],
  [/(?:案件名|非公開案件)\s*[:：]\s*[^\s、。]{2,40}/g, "[非公開案件名]"],
  [/(?:沖縄県|北海道|東京都|大阪府|京都府|.{2,3}県).{0,40}(?:市|町|村|区).{0,40}/g, "[住所]"],
  [/(?:口座|振込先|銀行|支店|普通|当座)\s*[:：]?\s*[^\s、。]{3,40}/g, "[口座情報]"]
];

export function maskSensitiveText(rawText: string): MaskingResult {
  let maskedText = rawText;
  for (const [pattern, replacement] of maskingRules) {
    maskedText = maskedText.replace(pattern, replacement);
  }

  return {
    rawText,
    maskedText,
    containsPersonalData: maskedText !== rawText
  };
}
