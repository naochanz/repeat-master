import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "プライバシーポリシー | DORILOOP",
  description: "DORILOOPのプライバシーポリシーについて",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Content */}
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1F2937] mb-8">プライバシーポリシー</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              DORILOOP（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。
              本プライバシーポリシーは、本アプリにおける個人情報の取り扱いについて説明します。
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">1. 収集する情報</h2>
              <p className="text-gray-600 mb-4">本アプリでは、以下の情報を収集する場合があります。</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>メールアドレス（アカウント登録時）</li>
                <li>学習データ（問題集の登録情報、回答履歴、正答率など）</li>
                <li>アプリの利用状況に関するデータ</li>
                <li>お問い合わせ時にご提供いただく情報</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">2. 情報の利用目的</h2>
              <p className="text-gray-600 mb-4">収集した情報は、以下の目的で利用します。</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>本アプリのサービス提供および機能の改善</li>
                <li>ユーザーサポートの提供</li>
                <li>サービスに関する重要なお知らせの送信</li>
                <li>利用規約違反への対応</li>
                <li>統計データの作成（個人を特定できない形式）</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">3. 第三者への提供について</h2>
              <p className="text-gray-600 mb-4">
                本アプリは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要な場合</li>
                <li>サービス提供に必要な業務委託先に提供する場合（適切な管理のもと）</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">4. データの保護について</h2>
              <p className="text-gray-600">
                本アプリは、ユーザーの個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざん、
                漏洩などを防止するため、必要かつ適切なセキュリティ対策を講じています。
                データは暗号化され、安全なサーバーに保存されます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">5. データの保存期間</h2>
              <p className="text-gray-600">
                ユーザーの個人情報は、サービス提供に必要な期間保存されます。
                アカウントを削除された場合、関連する個人情報は合理的な期間内に削除されます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">6. ユーザーの権利</h2>
              <p className="text-gray-600 mb-4">ユーザーは以下の権利を有します。</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>個人情報へのアクセス権</li>
                <li>個人情報の訂正・削除の請求権</li>
                <li>個人情報の利用停止の請求権</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">7. プライバシーポリシーの変更</h2>
              <p className="text-gray-600">
                本プライバシーポリシーは、必要に応じて変更されることがあります。
                重要な変更がある場合は、アプリ内またはメールでお知らせします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">8. お問い合わせ先</h2>
              <p className="text-gray-600">
                本プライバシーポリシーに関するお問い合わせは、以下までご連絡ください。
              </p>
              <p className="text-gray-600 mt-4">
                メールアドレス: <a href="mailto:naochanz927.2@gmail.com" className="text-[#F97316] hover:underline">naochanz927.2@gmail.com</a>
              </p>
            </section>

            <p className="text-gray-500 text-sm mt-12">
              制定日: 2026年1月1日<br />
              最終更新日: 2026年1月1日
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
