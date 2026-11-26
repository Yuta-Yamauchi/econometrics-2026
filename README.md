# 計量経済学I・2026年度 Web教材

講義全体の教材一覧を`docs/index.html`，授業回ごとの教材を`docs/lectureXX/`に置くGitHub Pages用のリポジトリです。現在は第2回・第5回・第6回・第7回・第8回の教材を収録しています。

- 第2回：Xの分布と線形射影
- 第5回：アニメーションで見る中心極限定理
- 第6回：アニメーションで見る仮説検定
- 第7回：仮説検定から信頼区間へ
- 第8回：推定量の分布から信頼区間へ

HTML・CSS・JavaScript・Rコード・画像・ローカルフォントを同梱しています。公開にビルド処理やパッケージのインストールは不要です。第2回の起動時は，インターネット接続を使ってWebR 0.6.0と日本語フォントを読み込みます。

## 第6回：仮説検定（2026年11月12日）

第6回の検定先行版56ページに対応する，ビルド不要のアニメーション教材です。
入口は docs/lecture06/index.html です。第5回と同じ配色・書体・再生操作を使い，
標本・統計量・分布を横に並べ，スマートフォンでは縦に並べます。

- 帰無仮説の下で標本を取り直し，Z統計量をヒストグラムに集めて標準正規分布と比べます。
- 棄却の基準を動かし，第一種・第二種の過誤の面積を比べます。
- 標本平均と標準誤差を毎回求め，t統計量を集めます。同じ標本のZ統計量とt統計量を，共通のt分布の臨界値で判定し，誤って棄却した回数・割合と理論上の棄却率を並べます。標本数5・25・100，有意水準5%・1%を選び，10,000回の結果を表示できます。
- 講義の25人の標本から始め，母平均の候補と標本平均をそれぞれ動かして，t統計量とp値の変化を示します。標本平均を動かすときは全観測を同じ量だけ移動し，標本数・標準誤差を保ちます。それぞれの値を個別に初期値へ戻せます。

検出力と回帰係数のt検定は，今回の第6回Web教材には含みません。
再生・停止，1回ずつの実行，100回追加，500回の結果，速度，標本数，候補値，有意水準を操作できます。
Escで全アニメーションを停止します。非表示タブ・画面外でも停止します。
OSの動きを減らす設定に対応し，すべてのデータ・フォントを同梱しています。
HTMLを直接開いても動作します。外部配信ライブラリやサーバー計算は使いません。

公開用ファイルは docs/ 全体です。既存の main ブランチの /docs 公開設定を使えます。
以前の母平均を中心とした信頼区間の教材は docs/lecture07/mean-intervals.html に保持しています。

再生成・検証：

    python scripts/lecture06-testing/prepare-data.py
    Rscript --vanilla scripts/lecture06-testing/reference-values.R
    node qa/lecture06-testing/check-math.cjs
    node qa/check-assets.mjs
    node scripts/serve.mjs --port 4196

ブラウザー検証は qa/lecture06-testing/check-browser.cjs です。
PlaywrightとChromeを検証時だけ使用し，TESTING_URLで接続先，LECTURE_BROWSERでブラウザーを指定できます。
Rとの数値照合，PC・スマートフォンでの操作と表示，動きを減らす設定を確認しています。
データ・数式の出典は SOURCES.md に記載しています。

## 第7回：仮説検定から信頼区間へ

入口は `docs/lecture07/index.html` です。2026年11月19日の第7回講義に合わせ，正規回帰モデルの検定から信頼区間を作ります。第6回と同じ白地・青を基調とし，本文は常体，ページ内のハイパーリンクはありません。

- 残差・誤差を切り替えて，傾きの標準誤差と，自由度 n − 2 の t 検定を確認します。
- 標本・推定値・標準誤差を固定し，候補を動かす6段階のアニメーションで，棄却されない候補から信頼区間を作ります。右図は t 値の絶対値と p 値を切り替えられます。
- 同じ標本の検定結果と区間を行ごとに対応させ，5,000標本までの被覆を表示します。標本数は10・25・100・400，信頼水準は90・95・99%です。
- 区間幅について，標本サイズ，残差のばらつき，X のばらつき，信頼水準を比較します。散布図と区間の軸を左右でそろえています。
- 講義の100人・10,000人の数値例を使い，統計的な有意性と効果量を比較します。

第7回の最初の回帰標本は既存の `reference-data.js`，以後の標本生成は `ci-core.js` と共通です。新しい表示・計算は `interval-core.js`，`interval-plots.js`，`interval-app.js`，`intervals.css` にあります。標本サイズの区間幅比較では，X の1人当たりのばらつきと残差標準偏差を固定するため，比較用の標本を構成しています。

検証はこのリポジトリのルートから実行します。

```powershell
node qa/lecture07-inversion/check-math.cjs --export
Rscript --vanilla scripts/lecture07/inversion-reference.R
node qa/lecture07-inversion/check-math.cjs
node qa/lecture07-inversion/check-browser.cjs
node qa/check-assets.mjs
```

Rの `lm`・`confint`・`qt`・`pt`・`dt` との326項目の照合，60,000区間の検定との対応，6段階のアニメーションと画面幅320・390・768・1440pxの表示を確認しています。ブラウザー検証時のみPlaywrightとChromeを使います。通常の表示は外部ライブラリや通信を使わず，HTMLを直接開いて動作します。

## 第7回の補助教材（母平均の信頼区間）

以下は `docs/lecture07/mean-intervals.html` に保存した従来の補助教材です。

標準誤差を使って区間幅を取り直すアニメーションを追加しました。複数の標本を並べ，観測値から標本平均へ集約し，母標準偏差σを使う共通幅の区間を作ります。次に，各標本の標準誤差を計算し，中心を標本平均に固定したまま，両端をt分布による区間へ動かします。元の共通幅は破線で重ねて比較できます。

回帰係数の区間幅について，スライド46–47ページと同じ散布図の比較を追加しました。基準の図を残し，もう一方の縦方向のずれ，または中心からの横の広がりを1倍から2倍まで動かします。各図の推定直線，区間の両端に対応する傾き，その直下の95%信頼区間を連動させます。ページ内の「回帰係数の区間の幅」に収録しています。

「再生」「一時停止」「戻る」「次へ」とスライダーで操作できます。「標本を替えて繰り返す」が有効な場合は，完成した区間を表示した後，次の標本群へ進みます。OSで動きを減らす設定を有効にしている場合，新しいアニメーションは工程単位で切り替わります。Escで全アニメーションを停止できます。

第7回はフォント・データを含めてローカルファイルだけで動作し，HTMLを直接ブラウザーで開くこともできます。

既に第7回を公開している場合は，`docs/lecture07/`をこの版の内容で置き換えます。公開設定が`main`ブランチの`/docs`なら，設定変更は不要です。再生成コード・検証記録も保存する場合は，`scripts/lecture07/`，`qa/lecture07/`，`README.md`，`SOURCES.md`，`qa/check-assets.mjs`，`scripts/serve.mjs`も更新します。

## 公開済みの教材に第7回を追加する

1. `docs/lecture07/`を，既存リポジトリの`docs/`に追加します。
2. `docs/index.html`の教材一覧に，第7回の項目を追加します。同梱の`docs/index.html`に追加済みの項目を収録しています。
3. 再生成・検証用のファイルも管理する場合は，`scripts/lecture07/`と`qa/lecture07/`を追加し，`qa/check-assets.mjs`を更新します。
4. 公開元のブランチへ変更を反映すると，既存のPages設定で第7回も配信されます。

第7回の公開先は，教材一覧のURLの末尾に`lecture07/`を加えた場所です。すべての計算・描画をブラウザー内で行い，第7回には外部ライブラリの読み込みやサーバー処理はありません。`docs/lecture07/index.html`を直接ブラウザーで開いても操作できます。

## GitHub Pagesで公開する

1. GitHubで，`econometrics-2026`という名前のリポジトリを作成します。GitHubの無料プランでは公開リポジトリを使います。
2. このREADMEがあるフォルダーの**中身**を，リポジトリの`main`ブランチの直下へ配置します。ZIPを使う場合は展開してから配置し，`docs/index.html`と`docs/.nojekyll`を含めます。
3. リポジトリの **Settings → Pages** を開きます。
4. **Source: Deploy from a branch**，**Branch: main**，**Folder: /docs** を選び，**Save** を押します。
5. Pages画面で公開の完了を確認し，表示されたURLを開きます。

公開元の設定は[GitHub公式ドキュメント](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)に対応しています。

標準の公開URLは次のとおりです。`<GitHubユーザー名>`を実際のアカウント名に置き換えます。

| 内容 | URL |
| --- | --- |
| 教材一覧 | `https://<GitHubユーザー名>.github.io/econometrics-2026/` |
| 第2回 | `https://<GitHubユーザー名>.github.io/econometrics-2026/lecture02/` |
| 第5回 | `https://<GitHubユーザー名>.github.io/econometrics-2026/lecture05/` |
| 第6回 | https://<GitHubユーザー名>.github.io/econometrics-2026/lecture06/ |
| 第7回 | `https://<GitHubユーザー名>.github.io/econometrics-2026/lecture07/` |
| 第8回 | `https://<GitHubユーザー名>.github.io/econometrics-2026/lecture08/` |

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
│   ├── lecture02/
│   │   ├── index.html            # 第2回の教材
│   │   ├── app.js
│   │   ├── style.css
│   │   ├── model.R               # WebRで実行する計算本体
│   │   ├── README.md             # 操作説明
│   │   └── fonts/                # フォント・ライセンス・変換元
│   ├── lecture05/
│   │   ├── index.html            # 第5回の教材
│   │   └── assets/
│   │       ├── css/lesson.css
│   │       ├── js/               # 計算・描画・保存済み結果
│   │       ├── images/           # CPSの3図
│   │       └── fonts/            # STIX Two MathとOFL.txt
│   └── lecture07/
│       ├── index.html            # 第7回の教材
│       └── assets/
│           ├── css/lesson.css
│           ├── js/               # 信頼区間の計算・描画・アニメーション
│           └── fonts/            # STIX Two MathとOFL.txt
├── scripts/
│   ├── serve.mjs                 # サイト全体の確認用サーバー
│   ├── lecture05/
│   │   └── regenerate-data.cjs   # 第5回の保存データ再生成
│   └── lecture07/
│       ├── prepare-data.R        # 臨界値・スライド共通標本の変換
│       ├── mean_sample.csv
│       └── regression_sample.csv
└── qa/
    ├── check-assets.mjs          # 全ページのリンク・ファイル参照の検証
    ├── lecture02/
    │   ├── model_tests.R         # 元教材の計算検証
    │   └── source-verification.json # 元教材に保存されていた検証記録
    ├── lecture05/
    │   ├── check-demo.cjs
    │   ├── check-animation.cjs
    │   └── demo-generation.json  # 保存データのシード・設定・要約値
    └── lecture07/
        ├── check-ci.cjs          # R・スライドとの一致と反復実験
        ├── check-animation.cjs   # アニメーションの状態遷移
        ├── check-derivation.cjs  # 誤差の分布・端点の反転・区間構成
        ├── check-repeat.cjs      # 標本の自動切り替え・繰り返し再生
        └── *-checks.json         # 検証結果
```

トップページでは，授業回と教材名を並べた行全体が教材へのリンクになっています。第2・5・6・7回の教材の上部からトップページへ戻れます。

## 教材を更新・追加する

- 教材一覧：`docs/index.html`を編集します。
- 第2回の本文・動作・計算：`docs/lecture02/`のHTML・JavaScript・Rコードを編集します。
- 第5回の本文：`docs/lecture05/index.html`を編集します。
- 第5回の図・見た目・動作：`docs/lecture05/assets/`内の該当ファイルを編集します。
- 第7回の本文：`docs/lecture07/index.html`を編集します。
- 第7回の図・計算・動作：`docs/lecture07/assets/`内の該当ファイルを編集します。
- 新しい授業回：`docs/lecture07/`などに`index.html`と必要なファイルを置き，トップページの`lesson-list`に対応する項目を追加します。

第2回は元教材の相対参照を保つため，`app.js`と`model.R`を同じ階層に置いています。第5回の画像・スクリプト・フォントは`assets/`にあります。新しい教材の再生成コードや計算検証が必要な場合は，`scripts/lecture07/`，`qa/lecture07/`のように授業回ごとに追加できます。

## ローカルで確認する

Node.jsが利用できる環境で，リポジトリのルートから実行します。確認用スクリプトはNode.jsの標準モジュールだけを使います。

```sh
node scripts/serve.mjs
```

- [教材一覧](http://127.0.0.1:4190/econometrics-2026/)
- [第2回の教材](http://127.0.0.1:4190/econometrics-2026/lecture02/)
- [第5回の教材](http://127.0.0.1:4190/econometrics-2026/lecture05/)
- [第7回の教材](http://127.0.0.1:4190/econometrics-2026/lecture07/)
- [第8回の教材](http://127.0.0.1:4190/econometrics-2026/lecture08/)

GitHub Pagesと同じように，リポジトリ名の下で配信して確認できます。終了するときはターミナルで`Ctrl+C`を押します。別のパスやポートを使う場合は，`node scripts/serve.mjs --base /my-course/ --port 4191`のように指定します。

## 検証と第5回のデータ再生成

```sh
node qa/check-assets.mjs
node qa/lecture05/check-demo.cjs
node qa/lecture05/check-animation.cjs
node qa/lecture07/check-ci.cjs
node qa/lecture07/check-animation.cjs
node qa/lecture07/check-derivation.cjs
node qa/lecture07/check-repeat.cjs
node qa/lecture07/check-standardization.cjs
node qa/lecture07/check-parallel.cjs
node qa/lecture07/check-parallel-estimated.cjs
node qa/lecture07/check-regression-width.cjs
```

全ページの相対リンク・アンカー・参照ファイルを確認します。第2回で使用するWebRとGoogle Fontsの外部参照も記録します。第5回の計算検証では回帰18設定・標本平均9設定を，アニメーション検証では一時停止・再開・リセット・速度変更・500回での停止を確認します。これらの結果は各検証コードと同じフォルダーの`*-checks.json`へ出力します。

第2回の計算は，Rが利用できる環境で次のように検証できます。実行結果を標準出力に表示します。

```sh
Rscript --vanilla qa/lecture02/model_tests.R docs/lecture02/model.R
```

第5回の保存済みシミュレーションを再生成する場合に実行します。

```sh
node scripts/lecture05/regenerate-data.cjs
```

`docs/lecture05/assets/js/demo-data.js`と`qa/lecture05/demo-generation.json`を更新します。基準シードは20261103，各設定の試行数は500です。通常の公開・閲覧では再生成は不要です。

## 第7回の補助教材の操作と計算

この節は `docs/lecture07/mean-intervals.html` に対応します。

- **標準化と信頼区間の逆算**：標本平均の分布を平行移動し，標本平均の標準偏差で伸縮して標準正規分布に変換します。中央の確率範囲から不等式を変形し，分母を両端へ移し，標本平均の移項，符号の反転，左右の並べ替えによって信頼区間を求めます。シミュレーションの母平均μ = 50と，各標本の標準化した値Zも表示します。
- **推定誤差から信頼区間へ**：推定誤差E = Ȳ − μの理論分布N(0, σ²/n)から，中央の確率範囲[−h, h]を取り出します。h = cσ/√nです。両端を反転し，観測された標本平均を加えて信頼区間を構成します。誤差の下側の端点は区間の上限に，上側の端点は下限に対応し，図と数式で同じ色を使います。構成部分が使う値は，観測された標本平均，既知のσ，標本サイズ，信頼水準です。「次へ」で1工程を再生し，「戻る」とスライダーで途中に戻れます。「前の標本」「次の標本」は工程を保って標本を切り替えます。標本は母平均のシミュレーションと共通です。
- **複数の標本から信頼区間へ**：3・6・10標本（初期値6）を縦に並べ，各標本の観測値を標本平均へ集約し，同時に左右へ誤差幅を伸ばします。標本サイズと信頼水準は全標本で共通です。区間は既知のσ = 10から計算します。「標本を替えて繰り返す」で，完成した区間を2秒間（1倍速）表示した後，次の標本群へ進みます。500標本を重複・欠落なく表示し，最後の組の後は最初へ戻ります。標本数によって最後の組が少なくなる場合があります。「母平均を表示」は初期状態ではオフで，オンにするとμ = 50の線と，完成した区間が母平均を含むかどうかを表示します。
- **標準誤差を使った信頼区間**：「複数の標本から信頼区間へ」と同じ標本を使います。観測値を標本平均へ集約し，共通の半幅cσ/√nの区間を作り，各標本の標準誤差se(Ȳ) = sY/√nを求めて，半幅をt分布の分位点×標準誤差へ取り直します。区間の中心と目盛りは幅を取り直す間も固定します。各行にsY・標準誤差・半幅を表示します。「元の幅を残す」で取り直す前の端点を重ねられます。標本サイズ，信頼水準，同時表示数を変更でき，500標本を繰り返し表示します。
- **母平均**：正規母集団N(50, 10²)から標本を取り，既知のσによるz区間，または標本標準偏差sによるt区間を作ります。t分布の自由度はn − 1です。
- **回帰係数**：Xを0から4の等間隔に固定し，Y = 2 + 1.5X + U，U ∼ N(0, 1.5²)の独立な誤差を生成します。通常の最小二乗法の標準誤差と，自由度n − 2のt分布を使います。
- **回帰係数の区間の幅**：100点の基準標本と，散らばり方を変えた標本を比較します。「縦のばらつき」では説明変数の位置を固定して残差を伸縮し，「横の広がり」では残差を保ってXの中心からの距離を伸縮します。全ケースで推定直線はŶ = 2 + 1.5X，信頼水準は95%です。「再生」「一時停止」「戻る」「次へ」「リセット」と倍率スライダーで操作します。「次へ」は1倍→1.5倍→2倍の順に進みます。左右の図の軸は同じ尺度で，アニメーション中も固定します。縦方向のずれを2倍にすると区間幅は2倍，中心からの横の距離を2倍にすると区間幅は半分になります。

標準化と逆算，推定誤差からの構成では，「標本を替えて繰り返す」を初期設定で有効にしています。「再生」で現在の工程から進み，完成した区間を2秒間（1倍速）表示してから，次の標本について，標準化と逆算の10段階，または誤差分布からの区間構成の7段階を繰り返します。500番目の次は1番目へ戻ります。一時停止・再開は，完成した区間の表示中にも使えます。チェックを外すと現在の標本で停止し，「次へ」はチェックの状態にかかわらず1工程だけ進みます。設定と標本番号は各アニメーションで独立しています。いずれかを再生すると，他のアニメーションはその位置で一時停止します。

母平均・回帰係数のシミュレーションでは，「再生」は連続再生，「1回を再生」は区間を一つ作って停止します。一時停止・速度変更の後も作成途中の標本を引き継ぎます。「100回追加」「500回の結果」は計算結果をまとめて表示します。「リセット」は同じ条件の最初の標本に戻ります。最大500回で停止します。

信頼水準（90%・95%・99%）と，母平均のσの既知・未知を変更すると，保存した同じ標本から区間を再計算します。標本サイズを変更すると最初から始めます。標本選択用スライダーと「含まない区間」から，個々の区間と対応する標本を確認できます。右図には選択した標本を含む最大30区間を表示し，母数を含む割合は全区間で計算します。

n = 25の最初の母平均の標本と，n = 100の最初の回帰標本は，第7回スライドのCSVと共通です。それ以降はJavaScriptのMulberry32とBox–Muller法で標準正規乱数を作ります。基準シードは母平均20261106，回帰20261107です。各回のシードは，基準シードと`Math.imul(n, 2654435761)`，`Math.imul(index + 1, 1597334677)`の排他的論理和を32ビット符号なし整数に変換した値です。ページを開き直しても，同じ条件なら同じ標本列になります。

Rの`qnorm`・`qt`による臨界値と，講義スライド共通の標本を再変換するには，Rが使える環境で次を実行します。通常の公開・閲覧では実行不要です。

```sh
Rscript --vanilla scripts/lecture07/prepare-data.R
```

`qa/lecture07/check-ci.cjs`は，Rの計算値，スライドの区間端点，信頼水準間の区間の包含関係，36設定の各1万回の母数包含率を確認します。`check-animation.cjs`は，一時停止・再開，1回再生，速度変更，リセット，未完了の標本の扱い，500回での停止を確認します。`check-derivation.cjs`は，誤差分布の面積と中央確率，両端の反転・移動と区間端点の対応，真の母平均を使わない区間構成，標本間で共通の誤差分布と目盛り，7段階の再生操作を確認します。`check-standardization.cjs`は，分布の平行移動・伸縮，不等式の各段階，分母の移動，両方式での区間端点の一致を確認します。`check-parallel.cjs`は，並行して構成した区間と従来の計算の一致，共通の再生位置，標本群の重複・欠落の有無を確認します。`check-repeat.cjs`は，4つのアニメーションで，完成した区間の表示時間，一時停止・再開，自動切り替え，繰り返し解除，標本列の一巡を確認します。

`check-parallel-estimated.cjs`は，4種類の標本サイズ・3種類の信頼水準について各500標本を検証します。既存の共通幅のアニメーションとの標本の一致，区間端点とt区間の計算の一致，幅を取り直す間の中心・目盛りの固定，標本ごとの標準誤差，標本群の重複・欠落の有無を確認します。

ブラウザー検証は`qa/lecture07/check-parallel-estimated-browser.cjs`で実行します。PlaywrightとChromium系ブラウザーは検証時のみ使い，教材の公開・閲覧には不要です。既定ではEdgeとポート4192を使います。`LECTURE_URL`と`LECTURE_BROWSER`で接続先・ブラウザーを変更できます。結果は`qa/lecture07/parallel-estimated-browser-checks.json`，表示画像は`qa/lecture07/screenshots/`に保存します。

散布図の区間幅比較は，保存済みの最初の回帰標本の残差を標準偏差1.5にそろえ，推定切片2・推定傾き1.5となるよう構成しています。新しい乱数は使いません。`check-regression-width.cjs`は，Rで保存した3ケースの全300点と区間端点に加え，変化途中の202設定で固定する量・軸・幅の比率を照合します。対応する保存データは`scripts/lecture07/regression_width_scatter.csv`，Rの計算値は`qa/lecture07/regression-width-reference.csv`です。

`node qa/lecture07/check-regression-width-browser.cjs`で，新しい比較の操作，既存アニメーションとの相互停止，キーボード操作，動きを減らす設定，画面幅320–1365px，HTMLの直接表示を検証します。結果は`qa/lecture07/regression-width-browser-checks.json`に保存します。

## 第8回・統計的推論とモデルの活用（板書形式）

`docs/lecture08/whiteboard.html` は，第8回全体を36場面・124段階に再構成したホワイトボード形式のHTML講義です。同じ図を保ち，線・式の追加，丸囲み・矢印・下線による強調，基準線の移動，点の色変更によって説明を進めます。Space・左右矢印・画面下のボタンで操作し，目次・講義ノート・出典表示・全画面に対応します。

Rで作図したSVGと保存済み数値を同梱しているため，ビルドや外部CDNは不要です。`docs/lecture08/whiteboard.html` を直接開くこともできます。

図の再生成は，RとNode.jsがある環境で，このフォルダーから次を実行します。

```sh
Rscript --vanilla scripts/lecture08/prepare-figures.R
node scripts/lecture08/bundle.mjs
```

本文と進行は `docs/lecture08/assets/lecture.js`，描画・操作は `board.js`，入力データは `scripts/lecture08/input/` にあります。検証記録は `qa/lecture08/` に収録しています。単独公開用のZIPと手順は，配布フォルダーの一つ上の `lecture08_whiteboard_html_github_pages.zip` と `scripts/lecture08/README-standalone.md` にあります。

## 第8回・推定量の分布から信頼区間へ（2026年11月26日）

入口は `docs/lecture08/index.html` です。第2回と同じ平均曲線を使い，第8回の非正規誤差の設定で，散布図，OLSの傾きの分布，標準化した推定誤差，信頼区間を対応づけています。第6回と同じ白地・青を基調とし，小見出しや補助ラベルを抑えています。

- 補習時間の分布を，一様・短時間に多い・長時間に多い，から選べます。
- 標本サイズは40・240・960人，信頼水準は90・95・99%です。
- 再生，1回進める，100回追加，5,000回の結果を使い，標本から分布を作ります。
- 第7回と同じく，標本・推定値・標準誤差を固定して候補の傾きを動かし，棄却されない候補から信頼区間を作ります。今回の検定は，HC0標準誤差と標準正規近似を使います。
- 左図の検定統計量と，右図の候補ごとの絶対値・棄却されない範囲が連動します。下限，推定値，上限を通る6段階の再生・停止・前後移動と，候補の手動スライダーを使えます。
- 同じ標本の散布図と区間を連動させ，真の傾きを含まない区間を選べます。散布図には真の条件付き期待値と，それを近似する母集団の線形射影を描きます。区間端点の傾きの直線は標本の中心を通ります。右図は選択した標本の周囲の最大30区間，包含割合は生成した全標本で計算します。

標準誤差はスライドと同じHC0です。母集団の係数と漸近分散を数値積分で求め，区間の幅は各標本の残差から計算します。模擬標本はJavaScriptのMulberry32，正規乱数にはBox–Muller法，指数乱数には逆関数法を使って生成します。基準シードは20261126です。標本サイズ・標本番号・分布の識別値から各標本のシードを定め，同じ設定で同じ標本を再現します。講義スライドとデータ生成過程は共通ですが，乱数列はこの教材用のものです。

公開・閲覧には追加ビルドや外部ライブラリを使いません。HTMLを直接開いても動作します。GitHub Pagesには `docs/` 全体を配置します。第8回を追加する場合は `docs/lecture08/` と教材一覧の `docs/index.html` を更新し，既存の第2回・第6回のフォルダーを保持します。新しい配布ZIPは，このフォルダーの一つ上の `econometrics-2026_lecture08_inference_github_pages.zip` です。

Rによる独立した数値照合と操作検証：

```sh
node qa/lecture08-inference/check-math.cjs --export
Rscript --vanilla scripts/lecture08-inference/reference.R
node qa/lecture08-inference/check-math.cjs
node qa/lecture08-inference/check-inversion.cjs
node qa/lecture08-inference/check-axes.cjs
node qa/check-assets.mjs
node qa/lecture08-inference/check-browser.cjs
```

ブラウザー検証時だけPlaywrightとChromeを使用します。検証結果は `qa/lecture08-inference/math-checks.json`・`inversion-checks.json`・`browser-checks.json`，表示画像は同フォルダーの `screenshots/` に保存します。教材の本文と動的な説明は常体です。

第8回の散布図は，全設定・全標本で X 軸を0〜10，Y 軸を40〜240に固定しています。傾きの分布と区間一覧は同じ横軸を使い，同じ母集団・標本サイズでは，反復回数・表示標本・信頼水準を変えても表示範囲を変えません。軸の範囲は5,000標本の99%区間までを含めて定めています。全9設定・45,000標本で，散布図の点と区間が表示範囲内にあることを `axes-checks.json` に記録しています。

## 第7回・第8回の共通スタイル

両ページの基本スタイルは，第6回の `assets/css/testing.css` と同じ規則を使用しています。本文は15px・行間1.8，見出し・操作部・凡例・グラフ間隔も第6回にそろえ，画面幅700px以下で図を縦に配置します。グラフ内の文字サイズと軸線も第6回に合わせています。信頼区間の構成や30標本の一覧に必要な図の高さは，各図で指定しています。

第6回の公開ページとブラウザー上の計算済みスタイルを照合し，第7回・第8回を幅320・390・768・1440pxで確認しました。結果は `qa/style-alignment/checks.json` にあります。
