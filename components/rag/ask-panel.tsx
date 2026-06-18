"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInputButton } from "@/components/phase4/voice-input-button";
import { SourceCard } from "@/components/rag/source-card";
import { CURRENT_PRIVACY_POLICY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";
import { maskSensitiveText } from "@/lib/privacy/masking";
import { answerRatingOptions } from "@/lib/phase4-data";
import type { AudienceRole, SearchResult } from "@/lib/rag/types";

const examples = [
  "漁協が員外利用者へ氷を販売することは可能ですか。",
  "漁港用地で試験的な陸上養殖を実施できますか。",
  "漁船の機関換装は沿岸漁業改善資金の対象ですか。",
  "補助対象経費に消費税を含めてよいですか。"
];

export function AskPanel() {
  const [question, setQuestion] = useState("");
  const [role, setRole] = useState<AudienceRole>("public");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState("");
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("質問を入力してください。");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [maskConfirmed, setMaskConfirmed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackReason, setFeedbackReason] = useState("");

  const masking = useMemo(() => maskSensitiveText(question), [question]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agreed) {
      setMessage("質問機能の利用には、利用規約、プライバシーポリシー、質問ログ分析への同意が必要です。");
      return;
    }
    if (masking.containsPersonalData && !maskConfirmed) {
      setMessage("個人情報らしき内容を検知しました。マスキング前後を確認し、確認チェックを入れてください。");
      return;
    }
    setLoading(true);
    setMessage("登録済み資料を検索し、根拠付き回答を生成しています。");
    setAnswer("");
    setSources([]);

    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: masking.maskedText, role, consentAccepted: agreed })
    });
    const data = (await response.json()) as {
      answer?: string;
      confidence?: string;
      sources?: SearchResult[];
      noSourceWarning?: boolean;
      containsPersonalData?: boolean;
      error?: string;
    };
    setLoading(false);

    if (!response.ok || data.error) {
      setMessage(data.error ?? "回答生成に失敗しました。");
      return;
    }

    setAnswer(data.answer ?? "");
    setConfidence(data.confidence ?? "");
    setSources(data.sources ?? []);
    setMessage(
      data.containsPersonalData
        ? "個人情報らしき内容をマスキングして処理しました。"
        : data.noSourceWarning
          ? "根拠資料が不足しています。回答は断定できません。"
          : "根拠付き回答を生成しました。"
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>根拠資料から質問する</CardTitle>
          <p className="text-sm text-muted-foreground">登録済み資料を横断検索し、引用元カード付きで回答します。</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setMaskConfirmed(false);
              }}
              placeholder="相談内容を入力してください"
              required
            />
            <VoiceInputButton
              onTranscript={(text) => {
                setQuestion((current) => (current ? `${current}\n${text}` : text));
                setMaskConfirmed(false);
              }}
            />
            {masking.containsPersonalData ? (
              <div className="space-y-3 rounded-md border border-secondary bg-secondary/10 p-3 text-xs">
                <div>
                  <p className="mb-1 font-semibold">マスキング前</p>
                  <p className="whitespace-pre-wrap rounded-md bg-background p-2 text-muted-foreground">{question}</p>
                </div>
                <div>
                  <p className="mb-1 font-semibold">AIへ送信する内容</p>
                  <p className="whitespace-pre-wrap rounded-md bg-background p-2 text-muted-foreground">{masking.maskedText}</p>
                </div>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={maskConfirmed} onChange={(event) => setMaskConfirmed(event.target.checked)} />
                  <span>マスキング後の内容を確認しました。元データは権限を持つ利用者のみ閲覧できます。</span>
                </label>
              </div>
            ) : null}
            <p className="text-xs leading-relaxed text-muted-foreground">
              入力された質問、AI回答、参照資料、利用日時は、回答履歴の保存、業務改善、研修・FAQ作成、支援ニーズ分析のため、管理者が閲覧・分析する場合があります。個人情報や機密情報は必要最小限にしてください。
            </p>
            <label className="flex items-start gap-2 rounded-md border bg-background p-3 text-xs leading-relaxed">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              <span>
                利用規約（{CURRENT_TERMS_VERSION}）、プライバシーポリシー（{CURRENT_PRIVACY_POLICY_VERSION}）、質問ログが管理者により閲覧・分析されることに同意します。
              </span>
            </label>
            <select value={role} onChange={(event) => setRole(event.target.value as AudienceRole)} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
              <option value="public">公開</option>
              <option value="fisheries_coop_staff">漁協職員</option>
              <option value="municipality_staff">自治体職員</option>
              <option value="admin">管理者</option>
            </select>
            <Button className="w-full" disabled={loading}>
              <Send className="h-4 w-4" aria-hidden />
              {loading ? "回答生成中" : "質問する"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setQuestion(example);
              setMaskConfirmed(false);
            }}
            className="shrink-0 rounded-md border bg-card px-3 py-2 text-left text-xs"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-secondary/70 bg-secondary/15 p-3 text-sm">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{message}</p>
        </div>
      </div>

      {answer ? (
        <Card>
          <CardHeader>
            <CardTitle>回答</CardTitle>
            <p className="text-sm text-muted-foreground">回答信頼度: {confidence || "要確認"}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-secondary bg-secondary/10 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                安全確認
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>根拠資料リンクと引用箇所を確認してください。</li>
                <li>個別許可、現地条件、所管判断が必要な案件は所管確認が必要です。</li>
                <li>旧版資料、更新期限切れ資料、内部資料のみの回答には注意してください。</li>
              </ul>
            </div>
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-relaxed">{answer}</pre>
            <div className="grid grid-cols-2 gap-2">
              {answerRatingOptions.map((option) => (
                <Button key={option} type="button" variant="outline" onClick={() => setFeedbackMessage(`評価を記録しました: ${option}`)}>
                  {option === "役に立った" ? <ThumbsUp className="h-4 w-4" aria-hidden /> : <ThumbsDown className="h-4 w-4" aria-hidden />}
                  {option}
                </Button>
              ))}
            </div>
            <Textarea value={feedbackReason} onChange={(event) => setFeedbackReason(event.target.value)} placeholder="修正理由、引用誤り、追加資料などを自由記述" />
            {feedbackMessage ? (
              <p className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {feedbackMessage}{feedbackReason ? ` / 理由: ${feedbackReason}` : ""}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {sources.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">根拠カード</h2>
          {sources.map((source) => (
            <SourceCard key={source.chunk_id} source={source} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
