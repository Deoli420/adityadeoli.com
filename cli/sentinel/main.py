"""
SentinelAI CLI — main entry point.

Usage:
  sentinel login --email admin@sentinelai.com
  sentinel endpoints list
  sentinel endpoints run <id>
  sentinel endpoints status <id>
  sentinel incidents list --status open
  sentinel incidents resolve <id>
  sentinel export runs --days 7 --output runs.csv
  sentinel health
"""

import click

from sentinel.commands.auth import auth_group
from sentinel.commands.endpoints import endpoints_group
from sentinel.commands.incidents import incidents_group
from sentinel.commands.export import export_group


@click.group()
@click.version_option(package_name="sentinel-cli")
def cli():
    """SentinelAI — API monitoring from the command line."""


# Register sub-commands
cli.add_command(auth_group)
cli.add_command(endpoints_group)
cli.add_command(incidents_group)
cli.add_command(export_group)


@cli.command()
def health():
    """Check API health."""
    from sentinel.client import client
    from rich.console import Console

    console = Console()
    data = client.get("/api/v1/health")
    console.print(f"[green]✓[/green] {data.get('app', 'SentinelAI')} v{data.get('version', '?')}")
    console.print(f"  Status:   {data.get('status', '?')}")
    console.print(f"  Database: {data.get('database', '?')}")
    console.print(f"  API URL:  {client.api_url}")


if __name__ == "__main__":
    cli()
