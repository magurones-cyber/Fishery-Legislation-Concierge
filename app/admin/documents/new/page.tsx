import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadForm } from "@/components/rag/document-upload-form";

export default function AdminDocumentNewPage() {
  return (
    <AppShell title="資料登録">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>資料登録</CardTitle>
            <p className="text-sm text-muted-foreground">PDF、TXT、Markdown、XML、RTFを登録し、旧版を残したまま新しいバージョンとして処理します。</p>
          </CardHeader>
          <CardContent>
            <DocumentUploadForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>更新時の必須項目</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            {["資料名", "バージョン", "施行日", "最終改正日", "取得日", "取得元URL", "更新担当者", "更新理由", "影響範囲", "公開範囲", "状態"].map((item) => (
              <div key={item} className="rounded-md border bg-background p-3">{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
