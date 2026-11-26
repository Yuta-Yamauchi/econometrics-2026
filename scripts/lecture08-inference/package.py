"""Package the GitHub Pages source with verification records, excluding QA images."""
from pathlib import Path
import hashlib
import json
import zipfile

course = Path(__file__).resolve().parents[2]
archive = course.parent / "econometrics-2026_lecture08_inference_github_pages.zip"
files = sorted(p for p in course.rglob("*") if p.is_file()
               and not any(part in {".git", "node_modules", "__pycache__", "screenshots"} for part in p.relative_to(course).parts)
               and p.relative_to(course).as_posix() != "qa/lecture08-inference/package-checks.json"
               and not (p.relative_to(course).parts[0] == "qa" and p.suffix.lower() in {".png", ".jpg", ".jpeg"}))
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
    for path in files:
        bundle.write(path, path.relative_to(course).as_posix())
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    for required in ["docs/index.html", "docs/.nojekyll", "docs/lecture08/index.html", "docs/lecture08/whiteboard.html",
                     "docs/lecture07/index.html", "docs/lecture07/mean-intervals.html",
                     "docs/lecture07/assets/js/interval-core.js", "docs/lecture07/assets/js/interval-plots.js",
                     "docs/lecture07/assets/js/interval-app.js", "docs/lecture07/assets/css/intervals.css",
                     "docs/lecture02/index.html", "docs/lecture06/assets/favicon.svg",
                     "docs/lecture08/assets/inference-core.js", "docs/lecture08/assets/inference-app.js",
                     "docs/lecture08/assets/inference-plots.js", "docs/lecture08/assets/inference.css",
                     "docs/lecture08/assets/fonts/STIXTwoMath-Regular.otf"]:
        assert hashlib.sha256(bundle.read(required)).digest() == hashlib.sha256((course / required).read_bytes()).digest()
    browser = json.loads(bundle.read("qa/lecture08-inference/browser-checks.json"))
    assert not browser["errors"] and len(browser["layouts"]) == 4
    math = json.loads(bundle.read("qa/lecture08-inference/math-checks.json"))
    assert math["independentRComparisons"] == 78 and math["replicationsChecked"] == 45000
    inversion = json.loads(bundle.read("qa/lecture08-inference/inversion-checks.json"))
    assert inversion["intervalTestEquivalence"] and inversion["trueConditionalMeanRendered"]
    axes = json.loads(bundle.read("qa/lecture08-inference/axes-checks.json"))
    assert axes["allPointsInFixedAxes"] and axes["all99PercentIntervalsInFixedDomain"]
    regression = json.loads(bundle.read("qa/lecture07-inversion/math-checks.json"))
    assert regression["independentRComparisons"] == 326 and regression["coverageEquivalences"] == 60000
    regression_browser = json.loads(bundle.read("qa/lecture07-inversion/browser-checks.json"))
    assert not regression_browser["errors"] and len(regression_browser["layouts"]) == 4
    final = json.loads(bundle.read("qa/lecture07-inversion/final-checks.json"))
    assert not final["errors"] and not final["externalRequests"] and final["legacyPagePreserved"]
    style = json.loads(bundle.read("qa/style-alignment/checks.json"))
    assert style["referenceVerified"] and style["cssBaseMatchesLecture06"]
    assert all(not page["overflow"] and page["hyperlinks"] == 0 for page in style["pages"])
    for lesson in ["lecture07", "lecture08"]:
        assert b'<a ' not in bundle.read(f"docs/{lesson}/index.html")
report = {"archive": archive.name, "files": len(files), "bytes": archive.stat().st_size,
          "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "zipIntegrity": True,
          "entryPointsAndAssetsMatch": True}
(course / "qa/lecture08-inference/package-checks.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
