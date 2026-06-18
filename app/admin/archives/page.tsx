import { ArchiveRestore, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveCandidates, transferStatuses } from "@/lib/storage-policy-data";

export default function AdminArchivesPage() {
  return (
    <AppShell title="アーカイブ">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArchiveRestore className="h-4 w-4" aria-hidden />
              アーカイブ候補
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archiveCandidates.map((candidate) => (
              <div key={candidate} className="rounded-md border bg-background p-3 text-sm">
                {candidate}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" aria-hidden />
              転送ステータス
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {transferStatuses.map((status) => (
              <div key={status.label} className="rounded-md border bg-background p-3">
                <p className="text-sm font-semibold">{status.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{status.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
