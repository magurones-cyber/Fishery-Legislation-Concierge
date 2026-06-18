"use client";

import { useState } from "react";
import { Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { questionLogAccessReasons } from "@/lib/question-log-analytics";

type Props = {
  logId: string;
};

type LogDetail = {
  question: string;
  aiAnswer: string;
  sources: Array<{ title: string; article: string; page: number; quote: string }>;
  confidence: string;
  missingSources: string[];
  feedback: string;
  user: string;
  organization: string;
  createdAt: string;
};

export function QuestionLogAccessForm({ logId }: Props) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [log, setLog] = useState<LogDetail | null>(null);
  const requiresDetail = reason === "その他";
  const canOpen = reason && (!requiresDetail || detail.trim().length > 0);

  async function openLog() {
    if (!canOpen) return;
    setMessage("閲覧理由を監査ログへ記録しています。");
    try {
      const response = await fetch("/api/admin/question-logs/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ logId, reason, detail })
      });
      if (!response.ok) throw new Error("audit failed");
      const payload = await response.json();
      setLog(payload.log ?? null);
      setIsOpen(true);
      setMessage("閲覧理由を記録しました。");
    } catch {
      setMessage("監査ログを保存できないため、個別ログを表示できません。");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-secondary/70 bg-secondary/15 p-3 text-sm leading-relaxed">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            個別ログには個人情報又は機密情報が含まれる可能性があります。利用目的の範囲内で閲覧し、閲覧理由は監査ログに保存されます。
          </p>
        </div>
      </div>

      {!isOpen ? (
        <div className="space-y-3 rounded-md border bg-card p-4">
          <label className="block space-y-1 text-sm font-medium">
            閲覧理由
            <select
              className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            >
              <option value="">選択してください</option>
              {questionLogAccessReasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium">
            補足理由
            <Textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="その他を選んだ場合、又は補足が必要な場合に入力" />
          </label>
          <Button type="button" className="w-full" disabled={!canOpen} onClick={openLog}>
            <Eye className="h-4 w-4" aria-hidden />
            理由を記録して個別ログを開く
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      ) : (
        <>
          {message ? <p className="rounded-md border bg-muted p-3 text-sm">{message}</p> : null}
          {log ? <QuestionLogDetail log={log} /> : <p className="rounded-md border bg-muted p-3 text-sm">個別ログを取得できませんでした。</p>}
        </>
      )}
    </div>
  );
}

function QuestionLogDetail({ log }: { log: LogDetail }) {
  return (
    <div className="space-y-4">
      <section className="rounded-md border bg-card p-4">
        <h2 className="text-base font-semibold">質問本文</h2>
        <p className="mt-1 text-sm text-muted-foreground">利用者: {log.user} / 所属: {log.organization} / {log.createdAt}</p>
        <p className="mt-3 rounded-md border bg-background p-3 text-sm leading-relaxed">{log.question}</p>
        <dl className="mt-3 grid gap-2 text-sm">
          {[
            ["回答信頼度", log.confidence],
            ["不足資料", log.missingSources.join("、") || "なし"],
            ["回答評価", log.feedback]
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6rem_1fr] gap-2 rounded-md bg-muted p-2">
              <dt className="font-medium">{label}</dt>
              <dd className="min-w-0 break-words text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-md border bg-card p-4">
        <h2 className="text-base font-semibold">AI回答</h2>
        <p className="mt-3 rounded-md border bg-background p-3 text-sm leading-relaxed">{log.aiAnswer}</p>
      </section>

      <section className="rounded-md border bg-card p-4">
        <h2 className="text-base font-semibold">根拠資料</h2>
        <div className="mt-3 space-y-3">
          {log.sources.map((source) => (
            <div key={`${source.title}-${source.page}`} className="rounded-md border bg-background p-3 text-sm">
              <p className="font-semibold">{source.title}</p>
              <p className="mt-1 text-muted-foreground">条文・見出し: {source.article} / ページ: {source.page}</p>
              <p className="mt-2 leading-relaxed">{source.quote}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
