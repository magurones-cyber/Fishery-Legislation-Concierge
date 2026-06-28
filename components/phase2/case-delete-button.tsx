"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function CaseDeleteButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteCase() {
    const reason = window.prompt("削除理由を入力してください。例：誤登録");
    if (!reason?.trim()) return;
    if (!window.confirm("この相談履歴を削除します。添付ファイルもStorageから削除します。よろしいですか？")) return;

    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/cases/${caseId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() })
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!response.ok || data.error) {
      setMessage(data.error ?? "削除に失敗しました。");
      return;
    }

    router.replace("/cases");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={deleteCase}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive bg-destructive px-3 text-sm font-medium text-destructive-foreground disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {loading ? "削除中" : "削除"}
      </button>
      {message ? <p className="rounded-md border border-destructive bg-destructive/10 p-2 text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
