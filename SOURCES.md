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

## 第6回の教材（仮説検定）

2026年11月12日の第6回「仮説検定」検定先行版に対応しています。

- 模擬標本は講義と同じ mean_sample.csv の25観測です。
  p値の例はこの標本を初期値とし，母平均の候補と標本平均を動かします。標本平均の変更は全観測の平行移動に対応し，標本数25と標準誤差を固定しています。
- 反復アニメーションは帰無仮説の母平均45，母標準偏差10の独立な正規標本です。
  Mulberry32とBox–Muller変換を使い，標本数と試行番号から決まる固定シードで生成します。
- 棄却率の比較は，同じ標本の Z = (標本平均 − 45) / (10 / √n) と T = (標本平均 − 45) / (sY / √n) を使います。どちらも自由度n − 1のt分布の共通の臨界値で判定し，両側検定の誤った棄却を数えます。理論上の棄却率は，Zについては標準正規分布，Tについてはt分布の，共通の臨界値を超える確率から計算します。Rの参照値を qa/lecture06-testing/rejection-reference.csv に保存しています。
- 過誤の比較は，推定された傾きが真の傾き0または5を中心とする標準偏差2の正規分布に従う説明用モデルです。
- Rの dt・pt・qt・pnorm とJavaScriptの密度・確率・臨界値を照合しています。
  qa/lecture06-testing/ に参照値と検証記録があります。

検定の説明と図の対応は，講義スライドおよび指定参考資料07.pdfに基づいています。
スタイルとローカル数式フォントは第5回のGitHub Pages用教材に合わせています。

## 第7回の教材（仮説検定から信頼区間へ）

入口は `docs/lecture07/index.html` です。元資料は `output/pdf/lecture07_confidence_intervals_from_tests/` の講義ソースです。

- 正規回帰モデル，誤差・残差，自由度と標準誤差：`sections/01_regression.tex`。
- 候補ごとの検定，信頼区間の構成，p値との対応：`sections/02_tests_to_intervals.tex`。
- 検定と被覆の対応：`sections/03_coverage.tex`。
- 標本サイズ・残差・X のばらつき・信頼水準の比較：`sections/04_interval_width.tex`。幅比較の標本は同じ固定量を満たすようブラウザーで構成し，点の配置はスライドと同一とは限りません。
- 効果量0.01の例：`sections/01_opening.tex` と保存済みの `results/effect_size_examples.csv`。CSVを `scripts/lecture07/effect_size_examples.csv` に同梱しています。
- 最初の回帰標本：`scripts/lecture07/regression_sample.csv` と共通です。以後の反復は従来の `ci-core.js` の乱数列を使い，講義の保存済み10,000標本の被覆率とは別に計算します。
- t分布の確率・密度は第6回と同じ不完全ベータ関数・ガンマ関数による計算です。臨界値は両側確率を反転して求め，Rで照合しています。

独立したRの照合コードは `scripts/lecture07/inversion-reference.R`，入力データ・数値とブラウザーの検証記録は `qa/lecture07-inversion/` にあります。

## 第7回の補助教材（母平均の信頼区間）

従来のページは `docs/lecture07/mean-intervals.html` に保存しています。

2026年11月6日に作成した第6回「信頼区間」の講義スライドをもとにし，2026年11月11日に，標準誤差を使って区間幅を取り直すアニメーションを追加しました。

- 母平均の最初の標本：講義スライドの`data/mean_sample.csv`（n = 25）。
- 回帰の最初の標本：講義スライドの`data/regression_sample.csv`（n = 100）。
- 上記CSVを`scripts/lecture07/`に同梱しています。データはいずれも講義用のシミュレーションです。
- 母平均の区間の構成と反復解釈：[NIST/SEMATECH e-Handbook，Confidence Limits for the Mean](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm)。
- 標準正規分布とt分布の臨界値はRの`qnorm`・`qt`で計算し，`docs/lecture07/assets/js/reference-data.js`に保存しています。

母平均・回帰係数の信頼区間の反復実験では，同梱した最初の標本に続けてJavaScriptで標本を生成します。乱数生成と検証の条件はREADMEの第7回の補助教材の説明に記載しています。

標準誤差を使って区間幅を取り直すアニメーションは，共通幅のアニメーションと同じ標本を使います。各標本の不偏分散から標本標準偏差sYを求め，標準誤差sY/√nと，自由度n − 1のt分布の分位点から信頼区間を計算します。計算には共通の`ci-core.js`と，保存済みのRの臨界値を使います。

回帰係数の区間幅の比較は，2026年11月11日に改訂した講義スライド46–47ページの散布図と同じ条件です。保存済みの回帰標本のOLS残差を標準偏差1.5にそろえ，推定直線をŶ = 2 + 1.5Xに固定します。基準，残差を2倍，中心からのXの距離を2倍，の3ケースのRデータを`scripts/lecture07/regression_width_scatter.csv`，計算結果を`qa/lecture07/regression-width-reference.csv`に同梱しています。ブラウザーでは`regression-width.js`が同じ標本を再構成し，途中の倍率ごとに`ci-core.js`でOLSと区間幅を再計算します。

## CPS 1988

元教材の図は，RパッケージAERの`CPS1988`を使って作成されています。

- [AER：CPS1988のデータ説明](https://search.r-project.org/CRAN/refmans/AER/html/CPS1988.html)
- 入力変数：教育年数，週給の自然対数
- 収録図：散布図と回帰直線，残差の分布，教育年数別の残差の分布

このリポジトリには，元教材の完成済みPNGを収録しています。

## 数式フォント

第2回はTeX Gyre HerosとMLModernをもとにしたWebフォントを同梱しています。著作権表示・ライセンス・変換元は`docs/lecture02/fonts/`にあり，[FONT-NOTICES.txt](docs/lecture02/fonts/FONT-NOTICES.txt)に対応を記載しています。

第5回はSTIX Two Mathを同梱しています。フォントの著作権表示とSIL Open Font License 1.1は，[OFL.txt](docs/lecture05/assets/fonts/OFL.txt)に収録しています。

第6回・第7回も同じSTIX Two Mathを使い，著作権表示とライセンスを[OFL.txt](docs/lecture07/assets/fonts/OFL.txt)に同梱しています。

## 第8回の教材（統計的推論とモデルの活用）

第8回全体を36場面・124段階のHTML講義として再構成しています。Project STARとRothamstedのエンバク実験，線形射影の推論，局所線形回帰とモデル選択，シンプソンのパラドクスと重回帰を扱います。内容の出典・設定はページ内の「出典・設定」と各場面の講義ノートに収録しています。

画面構成はStatQuestの[How to make your own StatQuest!!!](https://www.youtube.com/watch?v=crLXJG-EAhk)を参考にしています。同じ図へ要素を追加し，周囲を薄くして説明対象を切り替えます。図・文章・音声の転載はありません。

図はRでSVGとして生成し，ブラウザーで描線，基準線の移動，棒の高さの変更，点の色変更を行います。公開時・閲覧時の乱数生成はありません。入力の保存済みデータと結果は `scripts/lecture08/input/` に収録し，`manifest.json` にSHA-256を保存しています。再生成スクリプトは `scripts/lecture08/prepare-figures.R`・`annotations.R`・`bundle.mjs` です。

第8回の数式フォントのライセンスは [OFL.txt](docs/lecture08/assets/fonts/OFL.txt) に同梱しています。

講義画面の参考として，StatQuestの[Machine Learning Fundamentals: Bias and Variance](https://www.youtube.com/watch?v=EuBBz3bI-aA)の複数の位置を実際に画面で確認しました。説明対象へ矢印を引く，点と線の距離を追記する，同じ図へ未使用データを加えるという順序を参考にしています。確認位置と反映箇所は `qa/lecture08/review.md` に記録しています。

## 第8回の教材（推定量の分布から信頼区間へ）

`docs/lecture08/index.html` は，第2回のWeb教材と第8回スライドの線形射影の推論に基づくシミュレーションです。既存の第8回全体の板書形式教材は `docs/lecture08/whiteboard.html` にあります。

- 平均曲線と補習時間の分布：`docs/lecture02/model.R` の `mean_function`・`distribution`。
- 非正規誤差とHC0の標準誤差：元の講義資料 `output/pdf/lecture08_linear_projection_inference/make_lecture08.R` の `fit_projection` と模擬標本生成部分。
- ページの説明順序：同講義資料の `sections/02_inference.tex`。
- 候補の検定から信頼区間を作る順序：第7回講義資料 `output/pdf/lecture07_confidence_intervals_from_tests/sections/02_tests_to_intervals.tex`。第8回では，同じ候補の反転手順を標準正規近似に適用しています。
- 正規分布の臨界値と計算の照合：`scripts/lecture08-inference/reference.R`。Rの `qnorm`・`integrate`・`lm` と，行列形式のHC0を使っています。
- 今回の標本と反復結果はブラウザー内で生成します。スライドの保存済み標本とは異なる乱数列を使用します。

第8回の平均曲線・線形射影・標本OLSを同じ散布図に示し，傾きの分布，標準化した推定誤差，信頼区間へ接続しています。区間の両端の傾きを描く直線は標本の中心を通り，係数の区間を表します。

第7回・第8回の書式は，指定された第6回の公開ページ（https://yuta-yamauchi.github.io/econometrics-2026/lecture06/）をブラウザーで確認し，その本文・見出し・操作部・凡例・余白に合わせています。両ページのCSSには，第6回の基本規則を同梱しています。
