import { BellRing } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateNotifications } from "@/lib/phase3-data";

export default function AdminNotificationsPage() {
  return (
    <AppShell title="更新通知">
      <div className="space-y-3">
        {updateNotifications.map((notification) => (
          <Card key={notification.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-4 w-4" aria-hidden />
                {notification.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{notification.documentTitle}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>改正日: {notification.amendedAt} / 施行日: {notification.effectiveDate}</p>
              <p>変更概要: {notification.summary}</p>
              <p>影響する業務: {notification.impact}</p>
              <p>確認担当者: {notification.owner}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
