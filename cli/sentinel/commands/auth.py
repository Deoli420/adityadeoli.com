"""Auth commands — login / logout."""

import click
from rich.console import Console

console = Console()


@click.group("login")
def auth_group():
    """Authentication commands."""


@auth_group.command("login")
@click.option("--email", "-e", prompt="Email", help="Your SentinelAI email.")
@click.option("--password", "-p", prompt=True, hide_input=True, help="Password.")
@click.option("--api-url", default=None, help="API base URL (default: production).")
def login_cmd(email: str, password: str, api_url: str | None):
    """Authenticate with SentinelAI."""
    from sentinel.client import client

    try:
        data = client.login(email, password, api_url)
        console.print(f"[green]✓[/green] Logged in as [bold]{email}[/bold]")
        console.print(f"  Token stored in ~/.sentinel/config.json")
        if data.get("user"):
            user = data["user"]
            console.print(f"  Org:  {user.get('organization_name', '?')}")
            console.print(f"  Role: {user.get('role', '?')}")
    except Exception as exc:
        console.print(f"[red]✗ Login failed:[/red] {exc}")
        raise SystemExit(1)


@auth_group.command("logout")
def logout_cmd():
    """Clear stored credentials."""
    from sentinel.client import client

    client.logout()
    console.print("[green]✓[/green] Logged out. Credentials cleared.")
