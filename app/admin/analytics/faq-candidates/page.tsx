import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { faqCandidates } from "@/lib/phase4-data";

export default function AdminFaqCandidatesPage() {
  return (
    <AppShell title="FAQ候補">
      <div className="space-y-4">
        <div className="rounded-md border border-secondary bg-secondary/10 p-3 text-sm">
          FAQ候補は利用実績から作成しますが、自動公開は禁止です。管理者が根拠資料と未解決事項を確認してから公開します。
        </div>
        {faqCandidates.map((candidate) => (
          <Card key={candidate.id}>
            <CardHeader>
              <CardTitle>{candidate.question}</CardTitle>
              <p className="text-sm text-muted-foreground">{candidate.category} / {candidate.status}</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted p-3">質問頻度: {candidate.frequency}</div>
                <div className="rounded-md bg-muted p-3">類似質問: {candidate.similarQuestions}</div>
              </div>
              <p>回答評価: {candidate.ratingSummary}</p>
              <p>根拠資料: {candidate.sources.join("、")}</p>
              <p>未解決事項: {candidate.unresolved}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  FAQ化
                </Button>
                <Button type="button" variant="outline">
                  <XCircle className="h-4 w-4" aria-hidden />
                  差し戻し
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
