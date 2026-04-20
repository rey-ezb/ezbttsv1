import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "static" / "index.html"
CSS_PATH = ROOT / "static" / "styles.css"


class FrontendGlassLayoutTests(unittest.TestCase):
    def test_professional_glass_layout_markup_and_styles_present(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8")
        css = CSS_PATH.read_text(encoding="utf-8")

        self.assertIn('class="ambient ambient-one"', html)
        self.assertNotIn('class="ambient ambient-three"', html)
        self.assertIn('class="rail-chip"', html)
        self.assertIn(".ambient {", css)
        self.assertIn(".rail-chip {", css)
        self.assertIn(".glass-sheen::before", css)
        self.assertIn(".panel-results-primary .panel-header", css)
        self.assertIn("--accent: #4267b2;", css)

    def test_upload_status_is_cleared_when_inputs_change(self) -> None:
        js = (ROOT / "static" / "app.js").read_text(encoding="utf-8")

        self.assertIn('dataUploadForm.querySelector(\'input[name="files"]\')', js)
        self.assertIn('dataUploadForm.querySelector(\'select[name="uploadType"]\')', js)
        self.assertIn('uploadFileInput.addEventListener("change", () => setStatus(""))', js)
        self.assertIn('uploadTypeInput.addEventListener("change", () => setStatus(""))', js)

    def test_index_uses_versioned_frontend_assets(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8")

        self.assertIn('/styles.css?v=', html)
        self.assertIn('/app.js?v=', html)

    def test_kpi_dashboard_shell_and_hooks_are_present(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8")
        css = CSS_PATH.read_text(encoding="utf-8")
        js = (ROOT / "static" / "app.js").read_text(encoding="utf-8")

        self.assertIn('id="kpi-filter-form"', html)
        self.assertIn('data-kpi-tab="orders"', html)
        self.assertIn('id="kpi-workspace-content"', html)
        self.assertIn(".panel-kpi-filters", css)
        self.assertIn(".workspace-tab", css)
        self.assertIn("new URLSearchParams", js)
        self.assertIn('setActivePage("planning")', js)
        self.assertIn('let activePage = "planning";', js)
        self.assertIn("monthlyActualMix = defaults.monthlyActualMix || {}", js)
        self.assertIn("monthlyActuals = defaults.monthlyActuals || {}", js)
        self.assertIn("Actual change vs previous month:", js)
        self.assertIn("Plan year", html)
        self.assertIn("Shows the selected plan year by month.", html)
        self.assertIn("Baseline mix for the selected date range", html)
        self.assertIn("Baseline unit mix %", js)
        self.assertNotIn("TikTok baseline unit mix %", js)
        self.assertIn("Historical Trends", html)
        self.assertIn('data-history-tab="trends"', html)
        self.assertIn('data-history-tab="launch"', html)
        self.assertIn("Launch planning", html)
        self.assertIn("renderHistoricalTrend", js)


if __name__ == "__main__":
    unittest.main()
