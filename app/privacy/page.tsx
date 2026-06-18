import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/lib/privacy/consent";

export default function PrivacyPage() {
  return (
    <AppShell title="プライバシーポリシー">
      <Card>
        <CardHeader>
          <CardTitle>プライバシーポリシー</CardTitle>
          <p className="text-sm text-muted-foreground">版: {CURRENT_PRIVACY_POLICY_VERSION}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>質問ログには個人情報又は機密情報が含まれる可能性があります。管理者による閲覧・分析は利用目的の範囲内に限定します。</p>
          <p>保存対象は、質問本文、マスキング後テキスト、AI送信テキスト、AI回答、根拠資料、利用日時、カテゴリ、タグ、回答信頼度、不足資料、回答評価、同意バージョン等です。</p>
          <p>質問文は、原文、マスキング後テキスト、AI API送信用テキストを分けて保存します。AI送信前に、氏名、電話番号、メールアドレス、住所、船名、口座情報、個別事業者名等をマスキングします。</p>
          <p>分析画面では、氏名、電話番号、メールアドレス、住所、口座情報、船名、登録番号、団体名等をマスキングした表示を原則とします。</p>
          <p>個別ログ閲覧は、問い合わせ対応、不具合調査、FAQ改善、研修テーマ抽出、不足資料確認、漁協支援、事故・トラブル対応、監査等の目的に限定します。閲覧理由と閲覧事実は監査ログへ保存します。</p>
          <p>外部AI APIを利用する場合があります。送信対象は必要最小限のマスキング後テキストと根拠候補に限定し、APIキーはサーバー側のみで扱います。</p>
          <p>PDFや添付画像はprivate bucketを基本とし、閲覧時は短時間の署名付きURLを発行します。</p>
          <p>保存期間は組織設定で管理し、初期設計では質問ログ5年、監査ログ7年、添付資料は案件保存期間に連動します。削除、訂正、利用停止の依頼は所属管理者又はシステム管理者へ申し出てください。</p>
          <Link href="/consent" className="text-primary">同意画面へ進む</Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
