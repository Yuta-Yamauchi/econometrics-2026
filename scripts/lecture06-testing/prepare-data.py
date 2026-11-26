from pathlib import Path
import csv,json,shutil
HERE=Path(__file__).resolve().parent
DEST=HERE.parents[1]/'docs/lecture06'
def rows(name):
    with (HERE/name).open(encoding='utf-8-sig') as f:return list(csv.DictReader(f))
data={'meanY':[float(r['y']) for r in rows('mean_sample.csv')]}
(DEST/'assets/js/testing-data.js').write_text(
 'globalThis.TestingData = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',
 encoding='utf-8')
shutil.copy2(HERE/'index.html',DEST/'index.html')
assert len(data['meanY'])==25
print('Prepared the saved 25-person sample and lecture 6 page.')
