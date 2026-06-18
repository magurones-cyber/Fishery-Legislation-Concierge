import Link from "next/link";
import { Anchor } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Anchor className="h-6 w-6" aria-hidden />
          </div>
          <CardTitle className="text-xl">漁業関係法令コンシェルジュ</CardTitle>
          <p className="text-sm text-muted-foreground">自由サインアップではなく、管理者招待制です。</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <LoginForm />
          <Link href="/dashboard" className="block text-center text-sm text-primary">
            デモ画面を開く
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
