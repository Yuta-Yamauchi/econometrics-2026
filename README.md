# 計量経済学I・2026年度 Web教材

講義全体の教材一覧を`docs/index.html`，授業回ごとの教材を`docs/lectureXX/`に置くGitHub Pages用のリポジトリです。現在は第5回の教材を収録しています。

- 第5回：標本から，平均・回帰係数の分布へ
- 実データ例：教育年数と週給（CPS 1988・28,155人）
- シミュレーション：標本平均と回帰係数の分布

HTML・CSS・JavaScript・画像・数式フォントを同梱しています。公開にビルド処理やパッケージのインストールは不要です。

## GitHub Pagesで公開する

1. GitHubで，`econometrics-2026`という名前のリポジトリを作成します。GitHubの無料プランでは公開リポジトリを使います。
2. このREADMEがあるフォルダーの**中身**を，リポジトリの`main`ブランチの直下へ配置します。ZIPを使う場合は展開してから配置し，`docs/index.html`と`docs/.nojekyll`を含めます。
3. リポジトリの **Settings → Pages** を開きます。
4. **Source: Deploy from a branch**，**Branch: main**，**Folder: /docs** を選び，**Save** を押します。
5. Pages画面で公開の完了を確認し，表示されたURLを開きます。

標準の公開URLは次のとおりです。`<GitHubユーザー名>`を実際のアカウント名に置き換えます。

| 内容 | URL |
| --- | --- |
| 教材一覧 | `https://<GitHubユーザー名>.github.io/econometrics-2026/` |
| 第5回 | `https://<GitHubユーザー名>.github.io/econometrics-2026/lecture05/` |

公開対象は`docs/`です。独自のGitHub Actionsワークフローの追加は不要です。ページ間のリンクとファイル参照は相対パスにしています。

手順の出典：[GitHub公式ドキュメント：公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## リポジトリ構成

```text
econometrics-2026/
├── README.md
├── SOURCES.md
├── .gitignore
├── .gitattributes
├── docs/                         # GitHub Pagesの公開対象
│   ├── .nojekyll
│   ├── index.html                # 講義全体の教材一覧
│   ├── assets/css/index.css      # 教材一覧のスタイル
│   └── lecture05/
│       ├── index.html            # 第5回の教材
│       └── assets/
│           ├── css/lesson.css
│           ├── js/               # 計算・描画・保存済み結果
│           ├── images/           # CPSの3図
│           └── fonts/            # STIX Two MathとOFL.txt
├── scripts/
│   ├── serve.mjs                 # サイト全体の確認用サーバー
│   └── lecture05/
│       └── regenerate-data.cjs   # 第5回の保存データ再生成
└── qa/
    ├── check-assets.mjs          # 全ページのリンク・ファイル参照の検証
    └── lecture05/
        ├── check-demo.cjs
        ├── check-animation.cjs
        └── demo-generation.json  # 保存データのシード・設定・要約値
```

トップページには第5回へのリンクと，教材内の実データ・標本平均・回帰係数へのリンクを掲載しています。第5回のナビゲーションにある「教材一覧」からトップページへ戻れます。

## 教材を更新・追加する

- 教材一覧：`docs/index.html`を編集します。
- 第5回の本文：`docs/lecture05/index.html`を編集します。
- 第5回の図・見た目・動作：`docs/lecture05/assets/`内の該当ファイルを編集します。
- 新しい授業回：`docs/lecture06/`などに`index.html`と必要なファイルを置き，トップページの`lesson-list`に対応する項目を追加します。

授業回ごとの画像・スクリプト・フォントは，各教材の`assets/`に置きます。新しい教材の再生成コードや計算検証が必要な場合は，`scripts/lecture06/`，`qa/lecture06/`のように授業回ごとに追加できます。

## ローカルで確認する

Node.jsが利用できる環境で，リポジトリのルートから実行します。確認用スクリプトはNode.jsの標準モジュールだけを使います。

```sh
node scripts/serve.mjs
```

- [教材一覧](http://127.0.0.1:4190/econometrics-2026/)
- [第5回の教材](http://127.0.0.1:4190/econometrics-2026/lecture05/)

GitHub Pagesと同じように，リポジトリ名の下で配信して確認できます。終了するときはターミナルで`Ctrl+C`を押します。別のパスやポートを使う場合は，`node scripts/serve.mjs --base /my-course/ --port 4191`のように指定します。

## 検証と第5回のデータ再生成

```sh
node qa/check-assets.mjs
node qa/lecture05/check-demo.cjs
node qa/lecture05/check-animation.cjs
```

全ページの相対リンク・アンカー・参照ファイルを確認します。第5回の計算検証では回帰18設定・標本平均9設定を，アニメーション検証では一時停止・再開・リセット・速度変更・500回での停止を確認します。結果は各検証コードと同じフォルダーの`*-checks.json`へ出力します。

第5回の保存済みシミュレーションを再生成する場合に実行します。

```sh
node scripts/lecture05/regenerate-data.cjs
```

`docs/lecture05/assets/js/demo-data.js`と`qa/lecture05/demo-generation.json`を更新します。基準シードは20261103，各設定の試行数は500です。通常の公開・閲覧では再生成は不要です。
