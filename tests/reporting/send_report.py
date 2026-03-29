"""
Send test report via Gmail SMTP.

HOW GMAIL SMTP WORKS:
1. You need a Google App Password (NOT your regular Gmail password)
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a 16-character password for "Mail" on "Other (SentinelAI)"
4. Use that as GMAIL_APP_PASSWORD in env or GitHub secrets

WHY APP PASSWORD instead of regular password?
Google blocks "less secure app" login. App Passwords bypass this
while still requiring 2FA on your account — it's more secure.

WHY SMTP instead of Gmail API?
SMTP is simpler — 10 lines of code, no OAuth flow, no refresh tokens,
no Google Cloud project. For automated notifications, SMTP is standard.

SECURITY:
- Never hardcode credentials in source code
- Use environment variables or GitHub Actions secrets
- App passwords can be revoked individually without changing your main password
"""

import os
import shutil
import smtplib
import subprocess
import sys
import tempfile
import zipfile
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path

from .parse_results import parse_junit_xml, parse_allure_results, TestSummary
from .email_template import generate_html_report


def _zip_allure_data(allure_results_dir: str) -> str | None:
    """
    Zip raw Allure result JSON files for email attachment.

    WHY RAW DATA instead of generated HTML?
    Gmail blocks zip files containing HTML/JS (security policy).
    Raw JSON data is safe to attach. Recipient runs:
        unzip allure-data.zip -d allure-data
        allure serve allure-data
    to get the full interactive report locally.
    """
    try:
        results_path = Path(allure_results_dir)
        json_files = list(results_path.glob("*.json")) + list(results_path.glob("*.txt"))
        if not json_files:
            return None

        zip_path = os.path.join(tempfile.gettempdir(), "allure-data-email.zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in json_files:
                zf.write(f, f.name)

        size_kb = os.path.getsize(zip_path) // 1024
        if size_kb > 20000:  # >20MB — too large for Gmail
            print(f"  ⚠️ Allure data too large ({size_kb}KB) — skipping attachment")
            os.unlink(zip_path)
            return None

        return zip_path
    except Exception as e:
        print(f"  ⚠️ Allure data zip failed: {e}")
        return None


def _generate_allure_zip(allure_results_dir: str) -> str | None:
    """
    Generate Allure HTML report and zip it for email attachment.

    WHY ZIP?
    Allure reports are multi-file HTML (index.html + JS + CSS + data).
    You can't attach a folder to an email. Zipping it into a single file
    lets the recipient download, unzip, and open index.html locally.

    Gmail attachment limit is 25MB — Allure reports are typically 1-5MB
    zipped, well within limits.
    """
    try:
        # Check if allure CLI is available
        allure_cmd = shutil.which("allure")
        if not allure_cmd:
            print("  ⚠️ Allure CLI not found — skipping report attachment")
            print("    Install: brew install allure (Mac) or apt install allure (Linux)")
            return None

        # Generate HTML report to temp directory
        with tempfile.TemporaryDirectory() as tmpdir:
            report_dir = os.path.join(tmpdir, "allure-report")
            result = subprocess.run(
                [allure_cmd, "generate", allure_results_dir, "-o", report_dir, "--clean"],
                capture_output=True, text=True, timeout=60,
            )
            if result.returncode != 0:
                print(f"  ⚠️ Allure generate failed: {result.stderr[:200]}")
                return None

            # Zip the report with password protection
            # Gmail blocks zips containing HTML/JS. Password-protecting
            # encrypts the file list so Gmail can't scan contents.
            # Password: "sentinelai" (included in email body)
            zip_path = os.path.join(tmpdir, "allure-report.zip")
            zip_result = subprocess.run(
                ["zip", "-r", "-P", "sentinelai", zip_path, "."],
                cwd=report_dir, capture_output=True, text=True, timeout=30,
            )
            if zip_result.returncode != 0:
                # Fallback: try without password
                with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                    for root, dirs, files in os.walk(report_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, report_dir)
                            zf.write(file_path, arcname)

            # Copy zip to a persistent location (tmpdir will be cleaned up)
            persistent_zip = os.path.join(tempfile.gettempdir(), "allure-report-email.zip")
            shutil.copy2(zip_path, persistent_zip)
            print(f"  Generated Allure report zip: {os.path.getsize(persistent_zip) // 1024}KB")
            return persistent_zip

    except subprocess.TimeoutExpired:
        print("  ⚠️ Allure generation timed out (60s)")
        return None
    except Exception as e:
        print(f"  ⚠️ Allure zip generation failed: {e}")
        return None


def send_email_report(
    *,
    junit_xml_path: str,
    allure_results_dir: str = "",
    recipient: str = "",
    sender: str = "",
    app_password: str = "",
    suite_name: str = "SentinelAI Tests",
    run_url: str = "",
    report_url: str = "",
    attach_html: bool = True,
) -> bool:
    """
    Parse test results and send a beautiful HTML email report.

    Args:
        junit_xml_path: Path to JUnit XML file (from pytest --junit-xml)
        allure_results_dir: Path to Allure results directory (optional, enriches report)
        recipient: Email to send to (default: env REPORT_EMAIL)
        sender: Gmail address to send from (default: env GMAIL_USER)
        app_password: Gmail App Password (default: env GMAIL_APP_PASSWORD)
        suite_name: Name for the test suite header
        run_url: Link to the CI run (optional)
        report_url: Link to the hosted Allure report (optional)
        attach_html: Whether to attach the report as an HTML file

    Returns:
        True if sent successfully, False otherwise
    """
    # Resolve credentials from env if not provided
    recipient = recipient or os.getenv("REPORT_EMAIL", "")
    sender = sender or os.getenv("GMAIL_USER", "")
    app_password = app_password or os.getenv("GMAIL_APP_PASSWORD", "")

    if not all([recipient, sender, app_password]):
        print("ERROR: Missing email credentials. Set REPORT_EMAIL, GMAIL_USER, GMAIL_APP_PASSWORD")
        print(f"  REPORT_EMAIL: {'set' if recipient else 'MISSING'}")
        print(f"  GMAIL_USER: {'set' if sender else 'MISSING'}")
        print(f"  GMAIL_APP_PASSWORD: {'set' if app_password else 'MISSING'}")
        return False

    if not os.path.exists(junit_xml_path):
        print(f"ERROR: JUnit XML not found: {junit_xml_path}")
        return False

    # Parse results
    print(f"Parsing JUnit XML: {junit_xml_path}")
    summary = parse_junit_xml(junit_xml_path)
    summary.suite_name = suite_name

    if allure_results_dir and os.path.exists(allure_results_dir):
        print(f"Enriching with Allure data: {allure_results_dir}")
        summary = parse_allure_results(allure_results_dir, summary)

    # Generate HTML
    html_content = generate_html_report(summary, report_url=report_url, run_url=run_url)

    # Build email
    subject = f"{summary.status_emoji} SentinelAI {suite_name}: {summary.passed}/{summary.total} passed ({summary.pass_rate:.0f}%)"

    # Use "mixed" to support both inline HTML and file attachments
    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"] = f"SentinelAI CI <{sender}>"
    msg["To"] = recipient

    # Body part (HTML with plain text fallback)
    body = MIMEMultipart("alternative")

    # Plain text fallback
    plain_text = f"""
SentinelAI Test Report — {summary.status_text}
{'=' * 50}

Suite: {suite_name}
Time: {summary.timestamp}
Duration: {summary.duration_formatted}

Results:
  Total:   {summary.total}
  Passed:  {summary.passed}
  Failed:  {summary.failed}
  Skipped: {summary.skipped}
  Errors:  {summary.errors}
  Pass Rate: {summary.pass_rate:.1f}%
"""
    if summary.failed_tests:
        plain_text += f"\nFailed Tests ({len(summary.failed_tests)}):\n"
        for t in summary.failed_tests:
            plain_text += f"  ❌ {t.name}\n     {t.message[:100]}\n"

    if run_url:
        plain_text += f"\nCI Run: {run_url}\n"

    plain_text += "\nAllure data attached. To view: unzip allure-data.zip -d data && allure serve data\n"

    body.attach(MIMEText(plain_text, "plain"))
    body.attach(MIMEText(html_content, "html"))
    msg.attach(body)

    # Attach HTML summary report as a proper .html file
    # Using MIMEText with subtype "html" ensures correct encoding.
    # The key: set Content-Disposition to "attachment" so it downloads
    # as a file instead of rendering inline.
    if attach_html:
        report_filename = f"sentinelai-report-{summary.timestamp.replace(' ', '_').replace(':', '-')}.html"
        html_attachment = MIMEText(html_content, "html", "utf-8")
        html_attachment.add_header("Content-Disposition", "attachment", filename=report_filename)
        msg.attach(html_attachment)

    # Attach Allure report as JSON data bundle (Gmail blocks HTML/JS zips)
    # Instead of zipping the full report (which Gmail blocks as security risk),
    # we attach the raw Allure results JSON. The recipient can generate the
    # report locally: allure serve <unzipped-dir>
    if allure_results_dir and os.path.exists(allure_results_dir):
        allure_data_zip = _zip_allure_data(allure_results_dir)
        if allure_data_zip:
            with open(allure_data_zip, "rb") as f:
                data_attachment = MIMEBase("application", "zip")
                data_attachment.set_payload(f.read())
                encoders.encode_base64(data_attachment)
                data_name = f"allure-data-{summary.timestamp.replace(' ', '_').replace(':', '-')}.zip"
                data_attachment.add_header("Content-Disposition", f'attachment; filename="{data_name}"')
                msg.attach(data_attachment)
                print(f"  Attached Allure data: {data_name} ({os.path.getsize(allure_data_zip) // 1024}KB)")
            try:
                os.unlink(allure_data_zip)
            except OSError:
                pass

    # Send via Gmail SMTP
    print(f"Sending report to {recipient} via Gmail SMTP...")
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender, app_password)
            smtp.send_message(msg)
        print(f"✅ Report sent successfully to {recipient}")
        print(f"   Subject: {subject}")
        return True
    except smtplib.SMTPAuthenticationError:
        print("❌ Gmail authentication failed!")
        print("   Make sure you're using a 16-char App Password, not your regular password.")
        print("   Generate one at: https://myaccount.google.com/apppasswords")
        return False
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False


# ── CLI Entry Point ──────────────────────────────────────────────────────

def main():
    """CLI: python -m tests.reporting.send_report <junit.xml> [allure-dir]"""
    import argparse

    parser = argparse.ArgumentParser(description="Send SentinelAI test report via email")
    parser.add_argument("junit_xml", help="Path to JUnit XML results file")
    parser.add_argument("--allure-dir", default="", help="Path to Allure results directory")
    parser.add_argument("--suite-name", default="SentinelAI Tests", help="Suite name for header")
    parser.add_argument("--run-url", default="", help="CI run URL")
    parser.add_argument("--report-url", default="", help="Allure report URL")
    parser.add_argument("--recipient", default="", help="Email recipient (or set REPORT_EMAIL env)")
    parser.add_argument("--sender", default="", help="Gmail sender (or set GMAIL_USER env)")
    parser.add_argument("--app-password", default="", help="Gmail App Password (or set GMAIL_APP_PASSWORD env)")

    args = parser.parse_args()

    success = send_email_report(
        junit_xml_path=args.junit_xml,
        allure_results_dir=args.allure_dir,
        suite_name=args.suite_name,
        run_url=args.run_url,
        report_url=args.report_url,
        recipient=args.recipient,
        sender=args.sender,
        app_password=args.app_password,
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
