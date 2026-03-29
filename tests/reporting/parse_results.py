"""
Parse JUnit XML and Allure results into a structured summary.

WHY JUnit XML?
JUnit XML is the universal test result format — every test framework
(pytest, JUnit, NUnit, Mocha) can produce it. CI tools (Jenkins, GitHub
Actions, GitLab CI) natively understand it. We parse it to extract:
- Total tests, passed, failed, skipped, errors
- Individual test names with durations
- Failure messages and stack traces

WHY ALLURE JSON?
Allure results contain richer metadata — severity levels, features,
steps, attachments (screenshots). We parse these for the email report
to show which FEATURES passed vs failed, not just test functions.
"""

import json
import os
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


@dataclass
class TestResult:
    name: str
    classname: str
    status: str  # passed, failed, error, skipped
    duration: float  # seconds
    message: str = ""
    feature: str = ""
    severity: str = "normal"


@dataclass
class TestSummary:
    total: int = 0
    passed: int = 0
    failed: int = 0
    errors: int = 0
    skipped: int = 0
    duration: float = 0.0
    suite_name: str = ""
    timestamp: str = ""
    tests: list[TestResult] = field(default_factory=list)
    features: dict[str, dict] = field(default_factory=dict)  # feature -> {passed, failed, total}

    @property
    def pass_rate(self) -> float:
        return (self.passed / self.total * 100) if self.total > 0 else 0.0

    @property
    def status_emoji(self) -> str:
        if self.failed > 0 or self.errors > 0:
            return "❌"
        return "✅"

    @property
    def status_text(self) -> str:
        if self.failed > 0 or self.errors > 0:
            return "FAILED"
        return "PASSED"

    @property
    def failed_tests(self) -> list[TestResult]:
        return [t for t in self.tests if t.status in ("failed", "error")]

    @property
    def duration_formatted(self) -> str:
        if self.duration < 60:
            return f"{self.duration:.1f}s"
        minutes = int(self.duration // 60)
        seconds = self.duration % 60
        return f"{minutes}m {seconds:.0f}s"


def parse_junit_xml(xml_path: str) -> TestSummary:
    """Parse a JUnit XML file into a TestSummary."""
    tree = ET.parse(xml_path)
    root = tree.getroot()

    summary = TestSummary(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )

    # Handle both <testsuites> and <testsuite> root elements
    testsuites = root.findall(".//testsuite") if root.tag == "testsuites" else [root]

    for suite in testsuites:
        summary.suite_name = suite.get("name", "Test Suite")
        suite_time = float(suite.get("time", 0))
        summary.duration += suite_time

        for testcase in suite.findall("testcase"):
            name = testcase.get("name", "")
            classname = testcase.get("classname", "")
            duration = float(testcase.get("time", 0))

            # Determine status
            failure = testcase.find("failure")
            error = testcase.find("error")
            skipped = testcase.find("skipped")

            if failure is not None:
                status = "failed"
                message = failure.get("message", failure.text or "")[:500]
                summary.failed += 1
            elif error is not None:
                status = "error"
                message = error.get("message", error.text or "")[:500]
                summary.errors += 1
            elif skipped is not None:
                status = "skipped"
                message = skipped.get("message", "")
                summary.skipped += 1
            else:
                status = "passed"
                message = ""
                summary.passed += 1

            summary.total += 1
            summary.tests.append(TestResult(
                name=name,
                classname=classname,
                status=status,
                duration=duration,
                message=message,
            ))

    return summary


def parse_allure_results(allure_dir: str, summary: TestSummary) -> TestSummary:
    """Enrich TestSummary with Allure metadata (features, severity)."""
    allure_path = Path(allure_dir)
    if not allure_path.exists():
        return summary

    for json_file in allure_path.glob("*-result.json"):
        try:
            with open(json_file) as f:
                data = json.load(f)

            test_name = data.get("name", "")
            labels = {l["name"]: l["value"] for l in data.get("labels", [])}
            feature = labels.get("feature", "Unknown")
            severity = labels.get("severity", "normal")

            # Update test with allure metadata
            for test in summary.tests:
                if test.name == test_name:
                    test.feature = feature
                    test.severity = severity
                    break

            # Aggregate by feature
            if feature not in summary.features:
                summary.features[feature] = {"passed": 0, "failed": 0, "total": 0}
            summary.features[feature]["total"] += 1
            status = data.get("status", "unknown")
            if status == "passed":
                summary.features[feature]["passed"] += 1
            elif status in ("failed", "broken"):
                summary.features[feature]["failed"] += 1

        except (json.JSONDecodeError, KeyError):
            continue

    return summary
