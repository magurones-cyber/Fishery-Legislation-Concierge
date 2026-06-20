import { AppShell } from "@/components/layout/app-shell";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetPasswordPage() {
  return (
    <AppShell title="初回パスワード設定">
      <Card>
        <CardHeader>
          <CardTitle>パスワードを設定</CardTitle>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
