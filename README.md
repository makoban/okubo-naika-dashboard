# おおくぼ内科クリニック 確認用ダッシュボード

おおくぼ内科クリニックのサイト更新操作を確認するためのGitHub Pages用ダッシュボードです。

## 編集できる範囲

- TOPのトピックス
- 医院案内ページ下部の診療報酬のお知らせ

変更内容はブラウザの `localStorage` に下書き保存され、同じブラウザ内の確認プレビューへ反映されます。公開確認サイト側はこの下書きを読まず、GitHub Pagesで公開済みのデータだけを表示します。
公開変更は `makoban` のGitHubログイン確認を経由し、サイト側のGitHub Actionsが内容を検証して公開データを更新します。

現在の反映先はGitHub Pagesの公開確認サイトです。現行公式サイト `www.okubo-naika-cl.com` を直接更新する仕組みではありません。

公開サイト案: <https://makoban.github.io/okubo-naika-renewal/>

操作説明書: <https://makoban.github.io/okubo-naika-dashboard/manual.html>

## 回帰テスト

追加パッケージは不要です。Node.jsの標準テストランナーで実行します。

```bash
node --test tests/*.test.mjs
```

ブラウザ下書きの保存・判定・リセット、安全な別画面表示、CMSの件数・文字数上限を検査します。
