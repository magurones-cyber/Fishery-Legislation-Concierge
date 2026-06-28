"use client";

import { useMemo, useState } from "react";
import { Copy, Download, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { buildGeneratedDocument, documentTemplates, type ConsultationCase } from "@/lib/phase2-data";

type GeneratedDocumentPanelProps = {
  record: ConsultationCase;
};

export function GeneratedDocumentPanel({ record }: GeneratedDocumentPanelProps) {
  const [template, setTemplate] = useState(documentTemplates[0]);
  const [content, setContent] = useState(() => buildGeneratedDocument(documentTemplates[0], record));

  const fileName = useMemo(() => `${record.caseNumber}_${template}.md`, [record.caseNumber, template]);

  function handleTemplateChange(nextTemplate: string) {
    setTemplate(nextTemplate);
    setContent(buildGeneratedDocument(nextTemplate, record));
  }

  async function copyContent() {
    await navigator.clipboard.writeText(content);
  }

  function downloadMarkdown() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-4 w-4" aria-hidden />
          実務向け文書生成
        </CardTitle>
        <p className="text-sm text-muted-foreground">AI回答と案件情報をもとに、編集可能な業務文書のたたき台を生成します。</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="space-y-1 text-sm font-medium">
          文書種別
          <select value={template} onChange={(event) => handleTemplateChange(event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
            {documentTemplates.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-80 font-mono text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={copyContent}>
            <Copy className="h-4 w-4" aria-hidden />
            コピー
          </Button>
          <Button type="button" variant="outline" onClick={downloadMarkdown}>
            <Download className="h-4 w-4" aria-hidden />
            Markdown
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            印刷/PDF
          </Button>
          <Button type="button" variant="outline" disabled title="Word出力は次Phaseで実装">
            <FileDown className="h-4 w-4" aria-hidden />
            Word
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">PDFはブラウザの印刷機能で出力します。Word形式が必要な場合はMarkdownをコピーして文書作成ソフトへ貼り付けてください。</p>
      </CardContent>
    </Card>
  );
}
