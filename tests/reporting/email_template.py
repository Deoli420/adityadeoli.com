"""
HTML email template for test reports.

WHY HTML EMAIL?
Plain text emails are ignored. HTML emails with color-coded pass/fail
badges get attention. This template follows email design best practices:
- Inline CSS (email clients strip <style> tags)
- Table-based layout (Outlook doesn't support flexbox/grid)
- System fonts only (custom fonts don't load in email)
- Max width 600px (mobile-friendly)
- Dark on light contrast (accessible)

INDUSTRY STANDARD:
This is how tools like Allure, ExtentReports, and TestRail
format their email digests — a summary header with pass/fail,
feature breakdown table, and failed test details.
"""

from .parse_results import TestSummary


def generate_html_report(summary: TestSummary, report_url: str = "", run_url: str = "") -> str:
    """Generate a beautiful HTML email report from test results."""

    # Color scheme
    GREEN = "#22c55e"
    RED = "#ef4444"
    YELLOW = "#f59e0b"
    GRAY = "#94a3b8"
    BG = "#f8fafc"
    CARD_BG = "#ffffff"
    TEXT = "#0f172a"
    TEXT_SECONDARY = "#64748b"
    ACCENT = "#6366f1"

    status_color = GREEN if summary.status_text == "PASSED" else RED
    pass_rate_color = GREEN if summary.pass_rate >= 90 else (YELLOW if summary.pass_rate >= 70 else RED)

    # Feature rows
    feature_rows = ""
    for feature, stats in sorted(summary.features.items()):
        f_color = GREEN if stats["failed"] == 0 else RED
        f_icon = "✅" if stats["failed"] == 0 else "❌"
        feature_rows += f"""
        <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: {TEXT};">
                {f_icon} {feature}
            </td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: {f_color}; text-align: center; font-weight: 600;">
                {stats['passed']}/{stats['total']}
            </td>
        </tr>
        """

    # Failed test rows
    failed_rows = ""
    for test in summary.failed_tests:
        severity_badge = f'<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: {RED}15; color: {RED};">{test.severity.upper()}</span>'
        message_preview = (test.message[:200] + "...") if len(test.message) > 200 else test.message
        failed_rows += f"""
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 13px; font-weight: 600; color: {TEXT};">{test.name}</div>
                <div style="font-size: 11px; color: {TEXT_SECONDARY}; margin-top: 2px;">{test.feature} · {test.duration:.1f}s {severity_badge}</div>
                <div style="font-size: 12px; color: {RED}; margin-top: 6px; padding: 8px; background: {RED}08; border-radius: 6px; font-family: monospace; word-break: break-all;">
                    {message_preview}
                </div>
            </td>
        </tr>
        """

    # Links section
    links_html = ""
    if report_url or run_url:
        links = []
        if run_url:
            links.append(f'<a href="{run_url}" style="color: {ACCENT}; text-decoration: none; font-weight: 600;">View CI Run →</a>')
        if report_url:
            links.append(f'<a href="{report_url}" style="color: {ACCENT}; text-decoration: none; font-weight: 600;">View Allure Report →</a>')
        links_html = " · ".join(links)

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: {BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background: {BG}; padding: 32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

    <!-- Header -->
    <tr><td style="padding: 24px 24px 16px; background: {CARD_BG}; border-radius: 12px 12px 0 0; border: 1px solid #e2e8f0; border-bottom: none;">
        <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td>
                <div style="font-size: 20px; font-weight: 700; color: {TEXT};">🛡️ SentinelAI Test Report</div>
                <div style="font-size: 12px; color: {TEXT_SECONDARY}; margin-top: 4px;">{summary.timestamp} · {summary.suite_name}</div>
            </td>
            <td align="right">
                <div style="display: inline-block; padding: 8px 20px; border-radius: 8px; font-size: 16px; font-weight: 700; color: white; background: {status_color};">
                    {summary.status_emoji} {summary.status_text}
                </div>
            </td>
        </tr>
        </table>
    </td></tr>

    <!-- KPI Strip -->
    <tr><td style="padding: 0; background: {CARD_BG}; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid {status_color};">
        <tr>
            <td width="25%" align="center" style="padding: 16px 8px;">
                <div style="font-size: 28px; font-weight: 700; color: {TEXT};">{summary.total}</div>
                <div style="font-size: 11px; color: {TEXT_SECONDARY}; text-transform: uppercase; letter-spacing: 0.5px;">Total</div>
            </td>
            <td width="25%" align="center" style="padding: 16px 8px;">
                <div style="font-size: 28px; font-weight: 700; color: {GREEN};">{summary.passed}</div>
                <div style="font-size: 11px; color: {TEXT_SECONDARY}; text-transform: uppercase; letter-spacing: 0.5px;">Passed</div>
            </td>
            <td width="25%" align="center" style="padding: 16px 8px;">
                <div style="font-size: 28px; font-weight: 700; color: {RED if summary.failed > 0 else GRAY};">{summary.failed}</div>
                <div style="font-size: 11px; color: {TEXT_SECONDARY}; text-transform: uppercase; letter-spacing: 0.5px;">Failed</div>
            </td>
            <td width="25%" align="center" style="padding: 16px 8px;">
                <div style="font-size: 28px; font-weight: 700; color: {pass_rate_color};">{summary.pass_rate:.0f}%</div>
                <div style="font-size: 11px; color: {TEXT_SECONDARY}; text-transform: uppercase; letter-spacing: 0.5px;">Pass Rate</div>
            </td>
        </tr>
        </table>
    </td></tr>

    <!-- Duration + Skipped bar -->
    <tr><td style="padding: 12px 24px; background: {BG}; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="font-size: 12px; color: {TEXT_SECONDARY};">⏱ Duration: <strong style="color: {TEXT};">{summary.duration_formatted}</strong></td>
            <td align="right" style="font-size: 12px; color: {TEXT_SECONDARY};">⏭ Skipped: <strong style="color: {TEXT};">{summary.skipped}</strong> · ⚠ Errors: <strong style="color: {TEXT};">{summary.errors}</strong></td>
        </tr>
        </table>
    </td></tr>

    <!-- Feature Breakdown -->
    {"" if not feature_rows else f'''
    <tr><td style="padding: 16px 24px 8px; background: {CARD_BG}; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 14px; font-weight: 700; color: {TEXT}; margin-bottom: 8px;">Feature Breakdown</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <tr style="background: {BG};">
            <td style="padding: 8px 16px; font-size: 11px; font-weight: 600; color: {TEXT_SECONDARY}; text-transform: uppercase; letter-spacing: 0.5px;">Feature</td>
            <td style="padding: 8px 16px; font-size: 11px; font-weight: 600; color: {TEXT_SECONDARY}; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Pass/Total</td>
        </tr>
        {feature_rows}
        </table>
    </td></tr>
    '''}

    <!-- Failed Tests Detail -->
    {"" if not failed_rows else f'''
    <tr><td style="padding: 16px 24px 8px; background: {CARD_BG}; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 14px; font-weight: 700; color: {RED}; margin-bottom: 8px;">❌ Failed Tests ({summary.failed + summary.errors})</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid {RED}20; border-radius: 8px; overflow: hidden;">
        {failed_rows}
        </table>
    </td></tr>
    '''}

    <!-- Links -->
    {"" if not links_html else f'''
    <tr><td style="padding: 16px 24px; background: {CARD_BG}; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 13px; text-align: center;">{links_html}</div>
    </td></tr>
    '''}

    <!-- Footer -->
    <tr><td style="padding: 16px 24px; background: {CARD_BG}; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <div style="font-size: 11px; color: {TEXT_SECONDARY}; text-align: center;">
            SentinelAI Test Automation · Generated by pytest + Allure
        </div>
    </td></tr>

</table>
</td></tr>
</table>

</body>
</html>
"""
    return html
