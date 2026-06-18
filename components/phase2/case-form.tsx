import { CalendarDays, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { caseCategories, caseStatuses, caseTemplates, type ConsultationCase } from "@/lib/phase2-data";

type CaseFormProps = {
  mode: "new" | "edit";
  record?: ConsultationCase;
};

const baseFields = [
  "案件番号",
  "件名",
  "相談日",
  "相談者",
  "相談者区分",
  "地区",
  "市町村",
  "漁協名",
  "漁港名",
  "魚種",
  "漁業種類",
  "担当者",
  "次回対応日",
  "期限",
  "関係者",
  "タグ"
];

export function CaseForm({ mode, record }: CaseFormProps) {
  const initialCategory = record?.category ?? "漁港利用";
  const templateItems = caseTemplates[initialCategory as keyof typeof caseTemplates] ?? caseTemplates.漁港利用;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" aria-hidden />
            {mode === "new" ? "相談記録を作成" : "相談記録を編集"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">登録済み資料とAI回答を案件に紐付け、継続支援と引継ぎに使う前提の入力画面です。</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="space-y-1 text-sm font-medium">
            相談区分
            <select defaultValue={initialCategory} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
              {caseCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            対応状況
            <select defaultValue={record?.status ?? "未対応"} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
              {caseStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          {baseFields.map((field) => (
            <label key={field} className="space-y-1 text-sm font-medium">
              {field}
              <Input
                defaultValue={
                  field === "案件番号"
                    ? record?.caseNumber
                    : field === "件名"
                      ? record?.title
                      : field === "相談日"
                        ? record?.consultedAt
                        : field === "担当者"
                          ? record?.assignee
                          : field === "次回対応日"
                            ? record?.nextActionDate
                            : field === "期限"
                              ? record?.dueDate
                              : field === "タグ"
                                ? record?.tags.join(", ")
                                : undefined
                }
                placeholder={field}
                type={field.includes("日") || field === "期限" ? "date" : "text"}
              />
            </label>
          ))}
          <label className="space-y-1 text-sm font-medium">
            相談内容
            <Textarea defaultValue={record?.content} placeholder="相談内容、事実関係、確認したい判断を記録" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            AI回答
            <Textarea defaultValue={record?.aiAnswer} placeholder="AI回答を保存する場合に転記" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            内部メモ
            <Textarea defaultValue={record?.internalMemo} placeholder="庁内・漁協内部の検討事項。閲覧権限に注意。" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden />
            入力テンプレート
          </CardTitle>
          <p className="text-sm text-muted-foreground">相談区分に応じて、聞き漏れや引継ぎ漏れを防ぐ確認項目です。</p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {templateItems.map((item) => (
            <label key={item} className="space-y-1 text-sm font-medium">
              {item}
              <Input placeholder={`${item}を入力`} />
            </label>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full">
        <Save className="h-4 w-4" aria-hidden />
        {mode === "new" ? "案件を保存" : "変更を保存"}
      </Button>
      <p className="text-xs text-muted-foreground">このPhaseでは画面とDB設計を整備しています。実保存はSupabase連携後にServer Actionへ接続します。</p>
    </div>
  );
}
