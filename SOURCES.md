# 出典と収録内容

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

STIX Two Mathを同梱しています。フォントの著作権表示とSIL Open Font License 1.1は，[OFL.txt](docs/lecture05/assets/fonts/OFL.txt)に収録しています。
