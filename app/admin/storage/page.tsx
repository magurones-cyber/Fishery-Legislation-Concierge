import { HardDrive, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bucketPolicies, storageDestinations } from "@/lib/storage-policy-data";

export default function AdminStoragePage() {
  return (
    <AppShell title="Storage管理">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" aria-hidden />
              保存先設定
            </CardTitle>
            <p className="text-sm text-muted-foreground">GitHubにはコードと最小seedのみを保存し、実データは外部保存します。</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {storageDestinations.map((item) => (
              <div key={item.name} className="rounded-md border bg-background p-3">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-sm">{item.destination}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Bucket運用
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bucketPolicies.map((policy) => (
              <div key={policy.bucket} className="rounded-md border bg-background p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{policy.bucket}</span>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs">{policy.scope}</span>
                </div>
                <p className="mt-2 text-muted-foreground">{policy.access}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
