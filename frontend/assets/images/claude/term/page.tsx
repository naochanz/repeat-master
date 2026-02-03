import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "利用規約 | DORILOOP",
  description: "DORILOOPの利用規約について",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Content */}
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1F2937] mb-8">利用規約</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              この利用規約（以下「本規約」）は、DORILOOP（以下「本アプリ」）の利用に関する条件を定めるものです。
              本アプリをご利用になる前に、本規約をよくお読みください。
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第1条（サービスの内容）</h2>
              <p className="text-gray-600 mb-4">
                本アプリは、問題集を使った学習を管理するためのアプリケーションです。主な機能は以下の通りです。
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>問題集の登録・管理</li>
                <li>問題の正解・不正解の記録</li>
                <li>学習進捗の可視化</li>
                <li>メモ・付箋機能</li>
                <li>周回ごとの成績記録</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第2条（アカウントについて）</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>本アプリの一部機能を利用するにはアカウント登録が必要です。</li>
                <li>ユーザーは、正確かつ最新の情報を登録する必要があります。</li>
                <li>アカウント情報の管理はユーザー自身の責任で行うものとします。</li>
                <li>アカウントの第三者への譲渡、貸与は禁止します。</li>
                <li>不正利用が発覚した場合、アカウントを停止または削除する場合があります。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第3条（料金プラン）</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>本アプリには無料プランと有料プラン（プレミアムプラン、追加枠）があります。</li>
                <li>有料プランの料金は、アプリ内に表示された金額とします。</li>
                <li>サブスクリプションは、解約手続きを行わない限り自動更新されます。</li>
                <li>支払いはApple IDを通じて行われ、Appleの決済規約が適用されます。</li>
                <li>返金については、Appleの返金ポリシーに従います。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第4条（禁止事項）</h2>
              <p className="text-gray-600 mb-4">ユーザーは、以下の行為を行ってはなりません。</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本アプリのサーバーやネットワーク機能を妨害する行為</li>
                <li>本アプリの運営を妨害するおそれのある行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>本アプリに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                <li>本アプリの逆コンパイル、リバースエンジニアリング、逆アセンブル</li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第5条（知的財産権）</h2>
              <p className="text-gray-600">
                本アプリに関する著作権、商標権その他の知的財産権は、運営者または正当な権利者に帰属します。
                ユーザーは、本アプリのコンテンツを運営者の許可なく複製、転載、改変、配布することはできません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第6条（免責事項）</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>運営者は、本アプリの内容の正確性、完全性、有用性等について保証しません。</li>
                <li>運営者は、本アプリの利用により生じた損害について、故意または重過失がある場合を除き、責任を負いません。</li>
                <li>運営者は、ユーザーのデータの消失、破損について責任を負いません。重要なデータはバックアップを取ることをお勧めします。</li>
                <li>運営者は、本アプリの中断、停止、終了、利用不能について責任を負いません。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第7条（サービスの変更・終了）</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>運営者は、ユーザーに事前に通知することなく、本アプリの内容を変更することができます。</li>
                <li>運営者は、相当の予告期間をもって、本アプリの提供を終了することができます。</li>
                <li>サービス終了の場合、有料プランの未使用期間については、適切な対応を行います。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第8条（利用規約の変更）</h2>
              <p className="text-gray-600">
                運営者は、必要に応じて本規約を変更することができます。
                変更後の利用規約は、本アプリ内またはウェブサイトに掲載した時点で効力を生じるものとします。
                重要な変更がある場合は、適切な方法でユーザーに通知します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第9条（準拠法・管轄裁判所）</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                <li>本アプリに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">第10条（お問い合わせ）</h2>
              <p className="text-gray-600">
                本規約に関するお問い合わせは、以下までご連絡ください。
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
