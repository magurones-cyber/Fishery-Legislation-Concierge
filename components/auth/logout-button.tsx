import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className="inline-flex h-10 w-10 items-center justify-center rounded-md active:bg-muted" title="ログアウト">
        <LogOut className="h-5 w-5" aria-hidden />
        <span className="sr-only">ログアウト</span>
      </button>
    </form>
  );
}
