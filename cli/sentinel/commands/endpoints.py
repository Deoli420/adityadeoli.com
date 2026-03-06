"""Endpoint commands — list, run, status."""

import click
from rich.console import Console
from rich.table import Table

console = Console()


@click.group("endpoints")
def endpoints_group():
    """Manage monitored API endpoints."""


@endpoints_group.command("list")
def list_cmd():
    """List all monitored endpoints."""
    from sentinel.client import client

    endpoints = client.get("/api/v1/endpoints/")

    if not endpoints:
        console.print("[dim]No endpoints found.[/dim]")
        return

    table = Table(title="Monitored Endpoints", show_lines=False)
    table.add_column("Name", style="bold")
    table.add_column("Method", justify="center")
    table.add_column("URL", max_width=50)
    table.add_column("Status", justify="center")
    table.add_column("ID", style="dim", max_width=12)

    for ep in endpoints:
        method = ep.get("method", "?").upper()
        method_style = {
            "GET": "green",
            "POST": "yellow",
            "PUT": "blue",
            "DELETE": "red",
            "PATCH": "magenta",
        }.get(method, "white")

        expected = ep.get("expected_status", "?")
        table.add_row(
            ep.get("name", "?"),
            f"[{method_style}]{method}[/{method_style}]",
            ep.get("url", "?"),
            str(expected),
            str(ep.get("id", "?"))[:12],
        )

    console.print(table)


@endpoints_group.command("run")
@click.argument("endpoint_id")
def run_cmd(endpoint_id: str):
    """Trigger a monitoring pipeline run for an endpoint."""
    from sentinel.client import client

    console.print(f"[dim]Running monitor for {endpoint_id}...[/dim]")
    result = client.post(f"/api/v1/monitor/run/{endpoint_id}")

    run_data = result.get("run", {})
    risk_data = result.get("risk", {})
    anomaly_data = result.get("anomaly", {})

    # Status
    status_code = run_data.get("status_code", "?")
    is_success = run_data.get("is_success", False)
    status_icon = "[green]✓[/green]" if is_success else "[red]✗[/red]"

    console.print(f"\n{status_icon} Status: [bold]{status_code}[/bold]")

    # Response time
    rt = run_data.get("response_time_ms")
    if rt is not None:
        console.print(f"  Latency: {rt:.0f}ms")

    # Risk
    risk_score = risk_data.get("calculated_score", 0)
    risk_level = risk_data.get("risk_level", "?")
    risk_color = {
        "LOW": "green",
        "MEDIUM": "yellow",
        "HIGH": "red",
        "CRITICAL": "bold red",
    }.get(risk_level, "white")
    console.print(f"  Risk:    [{risk_color}]{risk_score} ({risk_level})[/{risk_color}]")

    # Anomaly
    if anomaly_data and anomaly_data.get("anomaly_detected"):
        severity = anomaly_data.get("severity_score", 0)
        cause = anomaly_data.get("probable_cause", "Unknown")
        console.print(f"  Anomaly: [red]Detected (severity {severity:.0f})[/red]")
        console.print(f"           {cause}")

    # Schema drift
    drift_data = result.get("schema_drift", {})
    if drift_data and drift_data.get("has_drift"):
        count = drift_data.get("drift_count", 0)
        console.print(f"  Drift:   [yellow]{count} field(s) changed[/yellow]")


@endpoints_group.command("status")
@click.argument("endpoint_id")
def status_cmd(endpoint_id: str):
    """Show latest status for an endpoint (risk, SLA, anomaly)."""
    from sentinel.client import client

    # Fetch endpoint details
    ep = client.get(f"/api/v1/endpoints/{endpoint_id}")

    console.print(f"\n[bold]{ep.get('name', '?')}[/bold]")
    console.print(f"  {ep.get('method', '?')} {ep.get('url', '?')}")

    # Latest risk
    try:
        risk = client.get(f"/api/v1/risk-scores/endpoint/{endpoint_id}/latest")
        if risk:
            score = risk.get("calculated_score", 0)
            level = risk.get("risk_level", "?")
            color = {
                "LOW": "green",
                "MEDIUM": "yellow",
                "HIGH": "red",
                "CRITICAL": "bold red",
            }.get(level, "white")
            console.print(f"  Risk:    [{color}]{score} ({level})[/{color}]")
    except Exception:
        console.print("  Risk:    [dim]N/A[/dim]")

    # SLA
    try:
        sla = client.get(f"/api/v1/sla/{endpoint_id}")
        if sla:
            target = sla.get("target_uptime_percent", 0)
            console.print(f"  SLA:     {target}% target uptime")
    except Exception:
        console.print("  SLA:     [dim]Not configured[/dim]")

    # Latest anomalies
    try:
        anomalies = client.get(
            f"/api/v1/anomalies/endpoint/{endpoint_id}",
            params={"limit": 3},
        )
        if anomalies:
            console.print(f"  Anomalies: {len(anomalies)} recent")
    except Exception:
        pass
