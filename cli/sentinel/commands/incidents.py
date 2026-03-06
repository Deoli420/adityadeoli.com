"""Incident commands — list, resolve."""

import click
from rich.console import Console
from rich.table import Table

console = Console()


@click.group("incidents")
def incidents_group():
    """Manage incidents."""


@incidents_group.command("list")
@click.option(
    "--status",
    "-s",
    type=click.Choice(["OPEN", "ACKNOWLEDGED", "RESOLVED", "all"], case_sensitive=False),
    default="all",
    help="Filter by status.",
)
def list_cmd(status: str):
    """List incidents."""
    from sentinel.client import client

    params = {}
    if status.lower() != "all":
        params["status"] = status.upper()

    incidents = client.get("/api/v1/incidents/", params=params)

    if not incidents:
        console.print("[dim]No incidents found.[/dim]")
        return

    table = Table(title="Incidents", show_lines=False)
    table.add_column("Title", max_width=40)
    table.add_column("Severity", justify="center")
    table.add_column("Status", justify="center")
    table.add_column("Created", max_width=20)
    table.add_column("ID", style="dim", max_width=12)

    for inc in incidents:
        sev = inc.get("severity", "?")
        sev_color = {
            "CRITICAL": "bold red",
            "HIGH": "red",
            "MEDIUM": "yellow",
            "LOW": "green",
        }.get(sev, "white")

        st = inc.get("status", "?")
        st_color = {
            "OPEN": "red",
            "ACKNOWLEDGED": "yellow",
            "RESOLVED": "green",
        }.get(st, "white")

        table.add_row(
            inc.get("title", "?"),
            f"[{sev_color}]{sev}[/{sev_color}]",
            f"[{st_color}]{st}[/{st_color}]",
            str(inc.get("created_at", "?"))[:19],
            str(inc.get("id", "?"))[:12],
        )

    console.print(table)


@incidents_group.command("resolve")
@click.argument("incident_id")
@click.option("--note", "-n", default=None, help="Resolution note.")
def resolve_cmd(incident_id: str, note: str | None):
    """Resolve an incident."""
    from sentinel.client import client

    client.patch(
        f"/api/v1/incidents/{incident_id}/status",
        json_body={"status": "RESOLVED"},
    )
    console.print(f"[green]✓[/green] Incident {incident_id[:12]}… resolved.")

    if note:
        client.post(
            f"/api/v1/incidents/{incident_id}/notes",
            json_body={"content": note},
        )
        console.print(f"  Note added: {note}")
