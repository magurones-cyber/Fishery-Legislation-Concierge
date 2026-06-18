import { FileText, MessageSquareText, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const favoriteTargets = ["法令", "条文", "通知", "FAQ", "案件", "AI回答", "チェックリスト", "生成文書"];

export default function FavoritesPage() {
  return (
    <AppShell title="お気に入り">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-secondary" aria-hidden />
              お気に入り
            </CardTitle>
            <p className="text-sm text-muted-foreground">資料だけでなく、案件対応で再利用する根拠、回答、チェックリスト、生成文書を保存します。</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {favoriteTargets.map((target) => (
              <div key={target} className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
                {target === "AI回答" || target === "FAQ" ? <MessageSquareText className="h-4 w-4" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
                {target}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">現在のデモデータでは保存済みのお気に入りはありません。実データ接続後、閲覧権限のある対象のみ表示します。</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
