"""Export commands — download CSV reports."""

import click
from rich.console import Console

console = Console()


@click.group("export")
def export_group():
    """Export data as CSV files."""


@export_group.command("runs")
@click.option("--days", "-d", default=7, help="Number of days to export.")
@click.option("--output", "-o", default="sentinel_runs.csv", help="Output filename.")
@click.option("--endpoint", "-e", default=None, help="Filter by endpoint ID.")
def export_runs(days: int, output: str, endpoint: str | None):
    """Export run history to CSV."""
    from sentinel.client import client
    from datetime import datetime, timedelta, timezone

    params: dict[str, str] = {}
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    params["date_from"] = date_from
    if endpoint:
        params["endpoint_ids"] = endpoint

    client.download("/api/v1/export/runs", output, params=params)
    console.print(f"[green]✓[/green] Exported runs to [bold]{output}[/bold]")


@export_group.command("incidents")
@click.option("--days", "-d", default=30, help="Number of days to export.")
@click.option("--output", "-o", default="sentinel_incidents.csv", help="Output filename.")
def export_incidents(days: int, output: str):
    """Export incidents to CSV."""
    from sentinel.client import client
    from datetime import datetime, timedelta, timezone

    params: dict[str, str] = {}
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    params["date_from"] = date_from

    client.download("/api/v1/export/incidents", output, params=params)
    console.print(f"[green]✓[/green] Exported incidents to [bold]{output}[/bold]")


@export_group.command("risk-scores")
@click.option("--days", "-d", default=7, help="Number of days to export.")
@click.option("--output", "-o", default="sentinel_risk_scores.csv", help="Output filename.")
def export_risk(days: int, output: str):
    """Export risk scores to CSV."""
    from sentinel.client import client
    from datetime import datetime, timedelta, timezone

    params: dict[str, str] = {}
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    params["date_from"] = date_from

    client.download("/api/v1/export/risk-scores", output, params=params)
    console.print(f"[green]✓[/green] Exported risk scores to [bold]{output}[/bold]")


@export_group.command("sla")
@click.option("--output", "-o", default="sentinel_sla_report.csv", help="Output filename.")
def export_sla(output: str):
    """Export SLA report to CSV."""
    from sentinel.client import client

    client.download("/api/v1/export/sla", output)
    console.print(f"[green]✓[/green] Exported SLA report to [bold]{output}[/bold]")
