"""Save the exact input data and build a standalone GitHub Pages package."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

HERE = Path(__file__).resolve().parent
COURSE = HERE.parent.parent
WORKSPACE = COURSE.parent.parent.parent
SITE = COURSE / 'docs' / 'lecture08'
INPUT = HERE / 'input'
ORIGINAL = WORKSPACE / 'output' / 'pdf' / 'lecture08_whiteboard'
FILES = {
    'data': ['star_sample.csv', 'oats_sample.csv', 'inference_sample_examples.csv',
             'inference_replicates.csv', 'model_comparison_samples.csv',
             'model_comparison_curves.csv', 'simpson_sample.csv'],
    'results': ['star_inference.csv', 'oats_inference.csv',
                'model_comparison_pointwise.csv', 'model_local_changes.csv',
                'inference_coverage.csv', 'inference_observed.csv',
                'simpson_slopes.csv', 'model_cost_changes.csv'],
}
manifest = []
for folder, names in FILES.items():
    (INPUT / folder).mkdir(parents=True, exist_ok=True)
    for name in names:
        source = ORIGINAL / folder / name
        target = INPUT / folder / name
        if source.exists():
            shutil.copy2(source, target)
        assert target.exists(), str(target)
        manifest.append({'file': f'{folder}/{name}', 'bytes': target.stat().st_size,
                         'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
(INPUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

README = '''# 第8回 統計的推論とモデルの活用

36場面・124段階のHTML講義です。同じ図へ線・式を加え，比べる点を丸で囲み，差や対応関係を矢印で示します。27場面の60段階に丸囲み・矢印・式の強調を組み込みました。PDFのページ画像を使わず，Rで生成したSVGの点や線をブラウザーで操作します。

## すぐに閲覧する

ZIPを展開し，`index.html`をChrome・Edge・Firefox・Safariなどの新しいブラウザーで開きます。インターネット接続やインストールは不要です。外部の参考資料へのリンクを開く場合は通信を使用します。

- 「次へ」またはSpace・右矢印：図や式を一段階追加
- 「前へ」または左矢印：一段階戻る
- 「もう一度」：現在の書き込みを再生
- 「目次」：場面を選ぶ
- 「講義ノート」またはN：その場面の説明・計算設定
- 「全画面」またはF：全画面表示
- 下部の再生位置：講義の任意の位置へ移動

URL末尾は，例えば `#simpson/3` のように場面と段階を表します。小さい画面では図を横にスクロールできます。端末の「動きを減らす」設定に対応しています。

## GitHub Pagesで公開する

1. このZIPの内容を展開し，`index.html`と`assets`がリポジトリの直下に並ぶように配置してコミットします。`.nojekyll`も含めます。
2. リポジトリの **Settings → Pages → Build and deployment** で，Sourceを **Deploy from a branch** にします。
3. 公開するブランチ（例：main）と **/(root)** を選び，Saveを押します。

ビルドコマンド，npm，R，サーバー側の処理，外部CDNは公開・閲覧に不要です。相対パスを使っているため，リポジトリ名に依存せずプロジェクトサイトとして動作します。

既存の講義サイトへ追加する場合は，`index.html`・`assets`・`.nojekyll`を `docs/lecture08/` に置きます。そのサイトで選択している公開元 `main /docs` を使用します。既存の教材一覧から `lecture08/` へリンクします。

公開元の設定は，[GitHub公式ドキュメント](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)に対応しています。この一式には公開先URLや認証情報は含めていません。

## 内容と出典

実データでの判断，線形射影係数の推論，モデルの形・バイアスとバリアンス・過学習，シンプソンのパラドクスと重回帰を扱います。出典と全設定はページ内の「出典・設定」にまとめています。

画面構成の参考は，StatQuest with Josh Starmerの[How to make your own StatQuest!!!](https://www.youtube.com/watch?v=crLXJG-EAhk)です。同じ図を維持した段階提示と，透明度による注目箇所の切り替えを取り入れています。StatQuestの図・文章・音声は転載していません。

講義動画[Machine Learning Fundamentals: Bias and Variance](https://www.youtube.com/watch?v=EuBBz3bI-aA)の，説明文から曲線へ矢印を引く場面，点と線の距離を加える場面，新しいデータを重ねる場面も参考にしました。確認位置と反映箇所は `verification/review.md` に記録しています。補習の改善幅は `#model-target/1` から7段階で，比較する点，縦の差，改善幅どうしの差の順に進みます。

## 編集と再生成

- `assets/lecture.js`：本文，講義ノート，各場面・各段階で表示する要素
- `assets/board.css`：表示
- `assets/board.js`：前後移動，描線，移動，色変更，目次
- `assets/figures.js`：Rで生成した図をまとめたもの
- `source/prepare-figures.R`：作図と数値の照合
- `source/annotations.R`：図の丸囲み・矢印と，式に重ねるペンの形
- `source/input/`：使用した保存済みデータ・結果とSHA-256一覧

図を再生成する場合は，展開したフォルダーで次を実行します。Rは追加パッケージ不要，Node.jsも追加パッケージ不要です。

```sh
Rscript --vanilla source/prepare-figures.R source/input assets/figures
node source/bundle.mjs .
```

再現用の原データは公開実験データと講義用模擬データです。本文の参考文献とデータ出典はHTML内に収録しています。数式フォントSTIX Two MathのSIL Open Font Licenseは `assets/fonts/OFL.txt` にあります。
'''
(HERE / 'README-standalone.md').write_text(README, encoding='utf-8')

dest = COURSE.parent / 'lecture08_whiteboard_html_github_pages.zip'
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED, compresslevel=7) as z:
    for p in SITE.rglob('*'):
        if p.is_file():
            z.write(p, p.relative_to(SITE).as_posix())
    z.writestr('README.md', README)
    for name in ['prepare-figures.R', 'annotations.R', 'bundle.mjs']:
        z.write(HERE / name, 'source/' + name)
    for p in INPUT.rglob('*'):
        if p.is_file():
            z.write(p, 'source/input/' + p.relative_to(INPUT).as_posix())
    qa = COURSE / 'qa' / 'lecture08'
    for name in ['browser-checks.json', 'annotation-checks.json', 'review.md']:
        if (qa / name).exists():
            z.write(qa / name, 'verification/' + name)
print(json.dumps({'zip': str(dest), 'bytes': dest.stat().st_size, 'input_files': len(manifest)}, ensure_ascii=False))
