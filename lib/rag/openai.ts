import type { SearchResult } from "@/lib/rag/types";

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536;

export const FISHERIES_RAG_SYSTEM_PROMPT = `あなたは、水産行政、水産業協同組合、漁港管理、漁業制度、養殖、補助金、漁業者支援に精通した実務支援AIです。

登録済み資料を根拠として、自治体職員、漁協職員、漁業者へ正確で理解しやすい回答を提供してください。

必ず以下を守ってください。

1. 登録済み資料の記載を根拠として回答する。
2. 根拠がない事項を推測で断定しない。
3. 法律、政令、省令、条例、規則、告示、通知、ガイドライン、内部資料、過去事例を区別する。
4. 上位法令と下位資料の関係を意識する。
5. 一般論と個別案件の判断を分ける。
6. 個別許可、行政財産使用、補助金交付、漁業権行使、採捕規制については、所管部署への確認が必要な場合を明示する。
7. 根拠資料名、条文番号、ページ番号を可能な限り示す。
8. 不足資料がある場合は、不足資料名を示す。
9. 判断できない場合は、判断できないと明示する。
10. 漁業者向け回答では、専門用語を補足する。
11. 自治体職員向け回答では、根拠、手続、留意事項、行政リスクを示す。
12. 漁協職員向け回答では、定款、理事会、総会、組合員資格、員外利用、会計処理、説明責任を意識する。
13. 補助金案件では、対象経費、証憑、按分、消費税、財産処分、実績報告、返還リスクを確認する。
14. 漁港利用案件では、漁港区域、施設区分、用地利用計画、目的外使用、占用、行為許可、財産管理、排水、建築、民間利用を確認する。
15. 養殖案件では、魚種、飼育方式、施設、取水、排水、防疫、薬品、漁業権、漁港用地、補助制度、採算性を確認する。
16. 遊漁船業に関する質問では、遊漁船業の適正化に関する法律、同施行令、同施行規則、都道府県の登録手続、業務主任者、業務規程、損害賠償保険、利用者安全管理、事故報告、漁場利用調整を確認する。
17. 漁業者が遊漁船業を兼業する相談では、漁業法上の漁業権・採捕規制、遊漁船業法上の登録、安全管理、漁協の定款・利用調整、漁港管理上の出航場所・係留・施設利用、浜プラン又は海業としての地域振興上の位置付けを分けて整理する。
18. 体験漁業、観光漁業、遊漁船業、単なる漁船同乗は混同しない。利用者から料金を受けて水産動植物の採捕を伴う遊漁を案内する場合には、遊漁船業法の適用可能性を確認する。
19. 遊漁船業務主任者、損害賠償保険、業務規程、利用者名簿、出航判断、気象・海象、安全説明、事故時対応について、必要な確認事項を明示する。
20. 登録済み資料に遊漁船業法、施行令、施行規則、都道府県手続資料がない場合は、回答信頼度を「低」又は「要確認」とし、不足資料として明示する。
21. 海業に関する質問では、漁港施設・用地の許認可に関する論点はカテゴリ03、地域振興・所得向上・浜プランに関する論点はカテゴリ10、遊漁船業の登録・安全管理に関する論点はカテゴリ12として整理する。
22. 遊漁船業に関する回答では、利用者保護と安全管理を軽視しない。制度上の登録可否だけでなく、事故防止、出航判断、保険、主任者、利用者説明、漁場利用調整を必ず確認する。`;

export async function createEmbedding(input: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: getEmbeddingModel(),
      dimensions: getEmbeddingDimensions(),
      input
    })
  });

  if (!response.ok) {
    throw new Error("Embedding API request failed.");
  }

  const data = (await response.json()) as { data?: Array<{ embedding: number[] }> };
  return data.data?.[0]?.embedding ?? null;
}

export function getEmbeddingModel() {
  return process.env.EMBEDDING_MODEL ?? process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
}

export function getEmbeddingDimensions() {
  const rawValue = process.env.EMBEDDING_DIMENSIONS ?? process.env.OPENAI_EMBEDDING_DIMENSIONS;
  const parsedValue = Number(rawValue ?? DEFAULT_EMBEDDING_DIMENSIONS);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_EMBEDDING_DIMENSIONS;
}

export async function createGroundedAnswer(question: string, sources: SearchResult[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildNoApiKeyAnswer(question, sources);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        { role: "system", content: FISHERIES_RAG_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildAnswerPrompt(question, sources)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("Responses API request failed.");
  }

  const data = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  return data.output_text ?? data.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n") ?? "";
}

export function buildAnswerPrompt(question: string, sources: SearchResult[]) {
  return `質問:
${question}

検索された根拠候補:
${sources.map(formatSourceForPrompt).join("\n\n")}

回答は必ず次の構成にしてください。
## 結論

## 根拠
・資料名
・条文番号
・該当ページ
・引用箇所
・資料詳細へのリンク

## 実務上の確認事項

## 手続の流れ

## 遊漁船業に関する確認事項
遊漁船業に関係しない質問では「該当なし」と記載してください。関係する質問では、次を確認してください。
- 遊漁船業者登録の要否
- 営業所の所在地
- 使用する船舶
- 船舶検査・小型船舶操縦士免許
- 特定操縦免許の要否
- 遊漁船業務主任者の選任
- 業務主任者の乗船
- 業務規程
- 損害賠償保険
- 利用者名簿
- 安全説明
- 出航判断基準
- 事故時の連絡・報告
- 漁場利用調整
- 漁協又は漁業権者との調整
- 漁港から出航する場合の漁港管理上の確認

## 注意点

## 不足している資料

## 回答信頼度
高 / 中 / 低 / 要確認 のいずれかを示してください。`;
}

function formatSourceForPrompt(source: SearchResult, index: number) {
  return `[根拠${index + 1}]
資料名: ${source.title}
資料種別: ${source.source_type}
法令番号: ${source.document_number ?? "不明"}
所管: ${source.issuing_authority ?? "不明"}
条文番号: ${source.article_number ?? "該当なし"}
ページ: ${source.page_start ?? "不明"}
見出し: ${source.heading ?? "該当なし"}
最終改正日: ${source.last_amended_at ?? "不明"}
資料リンク: /documents/${source.document_id}?chunk=${source.chunk_id}
引用箇所: ${source.citation_text ?? source.content.slice(0, 500)}`;
}

function buildNoApiKeyAnswer(question: string, sources: SearchResult[]) {
  if (sources.length === 0) {
    return `## 結論
登録済み資料から根拠を確認できないため、判断できません。

## 根拠
該当する登録資料は見つかりませんでした。

## 実務上の確認事項
所管部署、該当法令、条例、通知、内部運用資料を確認してください。

## 手続の流れ
1. 相談内容を整理する。
2. 関係資料を追加登録する。
3. 再検索して根拠を確認する。

## 遊漁船業に関する確認事項
遊漁船業者登録の要否、営業所、使用船舶、船舶検査、小型船舶操縦士免許、特定操縦免許、遊漁船業務主任者、業務規程、損害賠償保険、利用者名簿、安全説明、出航判断、事故報告、漁場利用調整、漁港管理上の確認が必要です。

## 注意点
根拠資料がない状態で法的判断を断定しないでください。

## 不足している資料
質問「${question}」に対応する法令、通知、手引、内部運用資料。

## 回答信頼度
低`;
  }

  return `## 結論
OpenAI APIキーが未設定のためAI文章生成は実行していません。下記の検索根拠を確認して判断してください。

## 根拠
${sources.map((source) => `・${source.title} / ${source.article_number ?? "条文番号なし"} / p.${source.page_start ?? "不明"} / ${source.citation_text ?? source.content.slice(0, 120)} / /documents/${source.document_id}?chunk=${source.chunk_id}`).join("\n")}

## 実務上の確認事項
資料種別、法的効力、最終改正日、所管部署の判断が必要な事項を確認してください。

## 手続の流れ
1. 根拠資料を開く。
2. 条文番号と引用箇所を確認する。
3. 個別許可や財産管理に関わる場合は所管部署へ照会する。

## 遊漁船業に関する確認事項
遊漁船業に関係する相談では、登録の要否、営業所、使用船舶、船舶検査、小型船舶操縦士免許、特定操縦免許、遊漁船業務主任者、業務規程、損害賠償保険、利用者名簿、安全説明、出航判断、事故報告、漁場利用調整、漁協又は漁業権者との調整、漁港管理上の確認を分けて確認してください。

## 注意点
検索結果だけで個別案件の最終判断を断定しないでください。

## 不足している資料
該当自治体の条例、規則、要綱、内部運用資料が未登録の場合は追加してください。

## 回答信頼度
要確認`;
}
