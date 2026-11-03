# 出典と収録内容

## 第2回の教材

`lecture02_weighting_empirical_github_pages`の公開用ファイルを`docs/lecture02/`へ収録しています。教材名はXの分布と線形射影です。仮想データを生成するJavaScriptとRコード，フォント一式を保持し，ページ上部に教材一覧へのリンクを設けています。

計算には[WebR](https://docs.r-wasm.org/webr/latest/) 0.6.0を使います。`app.js`が外部配信のWebRモジュールと，同じフォルダーにある`model.R`を読み込みます。日本語フォントはGoogle Fontsから取得します。

元教材の計算検証は`qa/lecture02/model_tests.R`，保存済みの検証記録は`qa/lecture02/source-verification.json`に収録しています。

## 第5回の教材

[標本から，平均・回帰係数の分布へ](https://econometrics-nonnormal-regression-2026.mchyuta.chatgpt.site/)をもとに，2026年11月3日にGitHub Pages用のファイルを整理しました。移行元はSitesの保存版7に対応するソースです。

- 元ソースのコミット：`1f0a158d996779294e8a7bc906295b369082e390`
- 実データ例：教育年数と週給（CPS 1988・28,155人）
- シミュレーション：元ソースのJavaScriptと保存済み結果をそのまま収録
- 移行時の編集：実データ例をCPSに限定し，ファイルの配置と参照パスを変更

## CPS 1988

元教材の図は，RパッケージAERの`CPS1988`を使って作成されています。

- [AER：CPS1988のデータ説明](https://search.r-project.org/CRAN/refmans/AER/html/CPS1988.html)
- 入力変数：教育年数，週給の自然対数
- 収録図：散布図と回帰直線，残差の分布，教育年数別の残差の分布

このリポジトリには，元教材の完成済みPNGを収録しています。

## 数式フォント

第2回はTeX Gyre HerosとMLModernをもとにしたWebフォントを同梱しています。著作権表示・ライセンス・変換元は`docs/lecture02/fonts/`にあり，[FONT-NOTICES.txt](docs/lecture02/fonts/FONT-NOTICES.txt)に対応を記載しています。

第5回はSTIX Two Mathを同梱しています。フォントの著作権表示とSIL Open Font License 1.1は，[OFL.txt](docs/lecture05/assets/fonts/OFL.txt)に収録しています。
