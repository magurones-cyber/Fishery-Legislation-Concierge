"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const initialCategory = record?.category ?? "漁港利用";
  const templateItems = caseTemplates[initialCategory as keyof typeof caseTemplates] ?? caseTemplates.漁港利用;

  async function saveCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const endpoint = mode === "edit" && record ? `/api/cases/${record.id}` : "/api/cases";
    const response = await fetch(endpoint, {
      method: mode === "edit" ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
    setSaving(false);

    if (!response.ok || data.error || !data.id) {
      setMessage(data.error ?? "相談履歴を保存できませんでした。");
      return;
    }

    router.push(`/cases/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={saveCase} className="space-y-4">
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
            <select name="category" defaultValue={initialCategory} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
              {caseCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            対応状況
            <select name="status" defaultValue={record?.status ?? "未対応"} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
              {caseStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          {baseFields.map((field) => (
            <label key={field} className="space-y-1 text-sm font-medium">
              {field}
              <Input
                name={fieldName(field)}
                defaultValue={fieldValue(field, record)}
                placeholder={field}
                type={field.includes("日") || field === "期限" ? "date" : "text"}
              />
            </label>
          ))}
          <label className="space-y-1 text-sm font-medium">
            相談内容
            <Textarea name="content" defaultValue={record?.content} placeholder="相談内容、事実関係、確認したい判断を記録" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            AI回答
            <Textarea name="aiAnswer" defaultValue={record?.aiAnswer} placeholder="AI回答を保存する場合に転記" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            内部メモ
            <Textarea name="internalMemo" defaultValue={record?.internalMemo} placeholder="庁内・漁協内部の検討事項。閲覧権限に注意。" />
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
              <Input name={`template_${item}`} placeholder={`${item}を入力`} />
            </label>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" disabled={saving}>
        <Save className="h-4 w-4" aria-hidden />
        {saving ? "保存中" : mode === "new" ? "案件を保存" : "変更を保存"}
      </Button>
      {message ? <p className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}
      <p className="text-xs text-muted-foreground">保存後は案件一覧で対応状況、次回対応日、期限を確認します。添付資料は案件詳細から追加します。</p>
    </form>
  );
}

function fieldName(label: string) {
  return {
    案件番号: "caseNumber",
    件名: "title",
    相談日: "consultedAt",
    相談者: "requester",
    相談者区分: "requesterType",
    地区: "district",
    市町村: "municipality",
    漁協名: "coopName",
    漁港名: "fishingPort",
    魚種: "species",
    漁業種類: "fisheryType",
    担当者: "assignee",
    次回対応日: "nextActionDate",
    期限: "dueDate",
    関係者: "stakeholders",
    タグ: "tags"
  }[label] ?? label;
}

function fieldValue(label: string, record: ConsultationCase | undefined) {
  if (!record) return undefined;
  return {
    案件番号: record.caseNumber,
    件名: record.title,
    相談日: record.consultedAt,
    相談者: record.requester,
    相談者区分: record.requesterType,
    地区: record.district,
    市町村: record.municipality,
    漁協名: record.coopName,
    漁港名: record.fishingPort,
    魚種: record.species,
    漁業種類: record.fisheryType,
    担当者: record.assignee,
    次回対応日: record.nextActionDate,
    期限: record.dueDate,
    関係者: record.stakeholders,
    タグ: record.tags.join(", ")
  }[label];
}
