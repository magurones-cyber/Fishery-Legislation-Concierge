"use client";

import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { photoAttachmentTypes, samplePhotos } from "@/lib/phase4-data";

export function PhotoAttachments() {
  const [selectedType, setSelectedType] = useState(photoAttachmentTypes[0]);
  const [previewName, setPreviewName] = useState("");

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-secondary bg-secondary/10 p-3 text-xs leading-relaxed">
        写真には個人情報、位置情報、車両番号、船名、口座情報等が写り込む場合があります。アップロード前に確認してください。
      </div>
      <label className="space-y-1 text-sm font-medium">
        写真種別
        <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
          {photoAttachmentTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium">
        撮影又はアップロード
        <Input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => setPreviewName(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      {previewName ? (
        <div className="rounded-md border bg-background p-3 text-sm">
          <p className="font-medium">{previewName}</p>
          <p className="text-xs text-muted-foreground">サムネイルとEXIF確認はStorage接続後に生成します。</p>
        </div>
      ) : null}
      <div className="grid gap-2">
        {samplePhotos.map((photo) => (
          <article key={photo.id} className="rounded-md border bg-background p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{photo.type}</p>
                <p className="text-xs text-muted-foreground">{photo.capturedAt}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="写真を削除">
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="mt-2 flex min-h-28 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              <Camera className="mr-2 h-4 w-4" aria-hidden />
              サムネイル
            </div>
            <p className="mt-2 text-muted-foreground">{photo.comment}</p>
            <p className="mt-1 text-xs text-muted-foreground">EXIF: {photo.exifPolicy}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
