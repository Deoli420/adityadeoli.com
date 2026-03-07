#!/usr/bin/env python3
"""
SentinelAI — Test Data Seeder

Seeds the test database with organizations and users for E2E tests.
Run after docker-compose services are up and migrations have run.

Usage:
    python seed_data.py [--host localhost] [--port 5433]
"""

import argparse
import sys
import time
import uuid

import bcrypt
import psycopg2


def wait_for_db(host: str, port: int, max_retries: int = 30):
    """Wait for PostgreSQL to be ready."""
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(host=host, port=port, user="sentinel", password="sentinel", dbname="sentinel_test")
            conn.close()
            print(f"  Database ready (attempt {i + 1})")
            return
        except psycopg2.OperationalError:
            print(f"  Waiting for database... (attempt {i + 1}/{max_retries})")
            time.sleep(2)
    print("ERROR: Database not available after max retries")
    sys.exit(1)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=4)).decode("utf-8")


def seed(host: str = "localhost", port: int = 5433):
    print("=" * 60)
    print(" SentinelAI — Seeding Test Data")
    print("=" * 60)

    wait_for_db(host, port)

    conn = psycopg2.connect(host=host, port=port, user="sentinel", password="sentinel", dbname="sentinel_test")
    password_hash = hash_password("testpassword123")
    created = []

    with conn.cursor() as cur:
        # ── Organization 1: test-org ─────────────────────────────────
        org1_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO organizations (id, name, slug, is_active) VALUES (%s, %s, %s, true) ON CONFLICT (slug) DO NOTHING RETURNING id",
            (org1_id, "Test Organization", "test-org"),
        )
        row = cur.fetchone()
        if row:
            org1_id = str(row[0])
            created.append("Organization: test-org")
        else:
            cur.execute("SELECT id FROM organizations WHERE slug = 'test-org'")
            org1_id = str(cur.fetchone()[0])

        # Admin user
        admin_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO users (id, email, display_name, password_hash, role, organization_id, is_active, token_version, failed_login_attempts) VALUES (%s, %s, %s, %s, 'ADMIN', %s, true, 0, 0) ON CONFLICT DO NOTHING",
            (admin_id, "admin@test.com", "Test Admin", password_hash, org1_id),
        )
        if cur.rowcount:
            created.append("User: admin@test.com (ADMIN)")

        # Member user
        member_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO users (id, email, display_name, password_hash, role, organization_id, is_active, token_version, failed_login_attempts) VALUES (%s, %s, %s, %s, 'MEMBER', %s, true, 0, 0) ON CONFLICT DO NOTHING",
            (member_id, "member@test.com", "Test Member", password_hash, org1_id),
        )
        if cur.rowcount:
            created.append("User: member@test.com (MEMBER)")

        # ── Organization 2: other-org (multi-tenancy tests) ──────────
        org2_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO organizations (id, name, slug, is_active) VALUES (%s, %s, %s, true) ON CONFLICT (slug) DO NOTHING RETURNING id",
            (org2_id, "Other Organization", "other-org"),
        )
        row = cur.fetchone()
        if row:
            org2_id = str(row[0])
            created.append("Organization: other-org")
        else:
            cur.execute("SELECT id FROM organizations WHERE slug = 'other-org'")
            org2_id = str(cur.fetchone()[0])

        # Other-org admin
        other_admin_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO users (id, email, display_name, password_hash, role, organization_id, is_active, token_version, failed_login_attempts) VALUES (%s, %s, %s, %s, 'ADMIN', %s, true, 0, 0) ON CONFLICT DO NOTHING",
            (other_admin_id, "admin@other.com", "Other Admin", password_hash, org2_id),
        )
        if cur.rowcount:
            created.append("User: admin@other.com (ADMIN, other-org)")

        conn.commit()

    conn.close()

    print()
    if created:
        print(f"  Created {len(created)} records:")
        for item in created:
            print(f"    + {item}")
    else:
        print("  All records already exist (idempotent)")
    print()
    print("  Credentials:")
    print("    admin@test.com    / testpassword123 / test-org")
    print("    member@test.com   / testpassword123 / test-org")
    print("    admin@other.com   / testpassword123 / other-org")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed SentinelAI test database")
    parser.add_argument("--host", default="localhost", help="Database host")
    parser.add_argument("--port", type=int, default=5433, help="Database port")
    args = parser.parse_args()
    seed(host=args.host, port=args.port)
