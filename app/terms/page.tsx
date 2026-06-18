import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";

export default function TermsPage() {
  return (
    <AppShell title="利用規約">
      <Card>
        <CardHeader>
          <CardTitle>利用規約</CardTitle>
          <p className="text-sm text-muted-foreground">版: {CURRENT_TERMS_VERSION}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>本アプリは、水産関係法令、条例、通知、手引、内部資料、FAQ等を検索し、根拠資料付きの実務支援回答を提供する業務支援ツールです。</p>
          <p>質問、AI回答、参照資料、利用日時、カテゴリ、評価、添付資料、利用ログは、回答履歴の保存、業務改善、FAQ改善、研修テーマ抽出、支援ニーズ把握、資料追加のために保存されます。</p>
          <p>質問文は、原文、マスキング後テキスト、AI API送信用テキストを分けて保存します。外部AI APIへ送信する前に、氏名、電話番号、メール、住所、船名、口座情報、個別事業者名等を可能な範囲でマスキングします。</p>
          <p>管理者分析画面では個人情報を原則マスキング表示します。個別ログ閲覧は管理者以上に限定し、閲覧理由の入力と監査ログ記録を必須とします。</p>
          <p>個人情報や機密情報は必要最小限で入力してください。AI回答は行政判断又は法的助言を確定するものではなく、必要に応じて所管部署へ確認してください。</p>
          <p>外部AI APIを利用する場合があります。送信前に個人情報・機密情報をマスキングする設計ですが、完全な検出を保証するものではありません。</p>
          <p>禁止事項: 目的外利用、虚偽情報の登録、権限外資料の閲覧、個人情報の不必要な入力、ログの外部提供。</p>
          <p>質問ログ、添付、監査ログの保存期間は組織設定で管理し、初期設計では質問ログ5年、監査ログ7年、添付資料は案件保存期間に連動する前提です。</p>
          <p>削除、訂正、利用停止の依頼は、所属管理者又はシステム管理者へ申し出てください。法令、監査、紛争対応上保存が必要な場合は、理由を示して保存を継続することがあります。</p>
          <Link href="/privacy" className="text-primary">プライバシーポリシーを見る</Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
