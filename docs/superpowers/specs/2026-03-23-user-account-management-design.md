# SentinelAI — User & Account Management Design Spec

## Problem

SentinelAI has no user management. Users can only be created via a seed script or direct DB access. There's no signup, no invite flow, no team management UI, and RBAC enforcement is only applied to 3 endpoints. This blocks SaaS adoption — a potential customer can't try the product without manual intervention.

## Goals

1. Self-service signup that creates an org + admin user in under 30 seconds
2. Invite flow so admins can onboard their team without engineering help
3. RBAC enforcement on every write endpoint, with permission-aware frontend
4. Settings pages for profile, team, and organization management
5. Architecture that supports future scaling (email verification, SSO, billing) without rewrites

## Non-Goals (Build Later)

- Email delivery (invites use copy-link for now)
- Email verification on signup
- Password reset via email
- SSO / OAuth / Google login
- Billing / Stripe / usage limits
- Custom roles or granular permissions
- Org deletion (manual DB operation)

---

## 1. Roles & Access Control

### 1.1 Role Hierarchy

Four roles, ordered by privilege:

```
OWNER > ADMIN > MEMBER > VIEWER
```

- **OWNER**: Created the org. Exactly one per org. Can transfer ownership but cannot be removed. Has all ADMIN permissions plus org-destructive operations.
- **ADMIN**: Full management access. Can invite users, change roles, manage org settings, configure webhooks/scheduler.
- **MEMBER**: Operational access. Can create/edit/delete endpoints, manage incidents, trigger runs, manage alert rules.
- **VIEWER**: Read-only access. Can view all dashboards, endpoints, incidents, security findings. Can export data. Cannot modify anything.

### 1.2 Permission Matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|--------|-------|-------|--------|--------|
| View dashboards, endpoints, incidents, security, AI telemetry | ✅ | ✅ | ✅ | ✅ |
| Export data (CSV) | ✅ | ✅ | ✅ | ✅ |
| Create/edit/delete endpoints | ✅ | ✅ | ✅ | ❌ |
| Trigger monitor runs, test requests | ✅ | ✅ | ✅ | ❌ |
| Manage incidents (acknowledge, resolve, notes) | ✅ | ✅ | ✅ | ❌ |
| Manage alert rules, SLA configs | ✅ | ✅ | ✅ | ❌ |
| Upload OpenAPI specs, trigger debug | ✅ | ✅ | ✅ | ❌ |
| Invite users, change roles, remove members | ✅ | ✅ | ❌ | ❌ |
| Manage organization settings | ✅ | ✅ | ❌ | ❌ |
| Manage webhooks, scheduler | ✅ | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

### 1.3 Backend Enforcement

Two reusable FastAPI dependencies (extending existing `require_role()` in `app/core/auth.py`):

```python
require_admin = Depends(require_role(UserRole.OWNER, UserRole.ADMIN))
require_write = Depends(require_role(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER))
```

Applied to every route handler:
- All `POST/PATCH/DELETE` on endpoints, incidents, alert-rules, SLA, contracts, debug, monitor → `require_write`
- User management, org settings, invites, alerts config, scheduler → `require_admin`
- Ownership transfer → `require_role(UserRole.OWNER)`
- All `GET` routes → `CurrentUser` (any authenticated role)

### 1.4 Frontend Enforcement

Two existing hooks already handle this:
- `useIsAdmin()` → returns true for OWNER or ADMIN
- `useCanWrite()` → returns true for OWNER, ADMIN, or MEMBER

UI elements hidden/disabled based on role:
- "Add Endpoint" button → hidden for VIEWER
- Quick action buttons (acknowledge/resolve) → hidden for VIEWER
- "Invite" button on team page → hidden for MEMBER/VIEWER
- Edit/delete buttons on endpoint detail → hidden for VIEWER
- Settings sub-nav items → "Team" and "Organization" hidden for non-ADMIN

---

## 2. Data Model Changes

### 2.1 UserRole Enum Update

Extend existing enum in `app/models/user.py`:

```python
class UserRole(str, enum.Enum):
    OWNER = "OWNER"      # NEW
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"
```

### 2.2 New Model: Invite

```
Table: invites

id                UUID        PK, default uuid4
organization_id   UUID        FK → organizations, NOT NULL, indexed
email             String(255) NOT NULL
role              UserRole    NOT NULL, default MEMBER
token             String(64)  NOT NULL, unique, indexed (crypto-random hex)
invited_by        UUID        FK → users, NOT NULL
expires_at        DateTime    NOT NULL (default: now + 7 days)
used_at           DateTime    nullable (set when accepted)
created_at        DateTime    NOT NULL, server default
```

Constraints:
- Unique on (organization_id, email) WHERE used_at IS NULL (prevent duplicate pending invites)
- Token is 32 bytes of `secrets.token_hex(32)` → 64 char hex string

### 2.3 Migration: `011_add_invites_and_owner_role.py`

1. Add `OWNER` to UserRole PostgreSQL enum type
2. Create `invites` table
3. Update the first admin user in each org to OWNER role (data migration)

---

## 3. API Endpoints

### 3.1 Auth (Public)

```
POST /api/v1/auth/signup
  Body: { name, email, password, org_name? }
  → Creates org (slug auto-generated from org_name or email domain)
  → Creates user with OWNER role
  → Returns { access_token, user } + refresh_token cookie
  Validation: email format, password min 8 chars, name required
  Rate limit: 3/min

POST /api/v1/auth/join/:token
  Body: { display_name, password }
  → Validates token (not expired, not used)
  → Creates user in the invite's org with invite's role
  → Marks invite as used (sets used_at)
  → Returns { access_token, user } + refresh_token cookie
  Rate limit: 5/min

GET /api/v1/auth/invites/:token/validate
  → Public endpoint to check if invite token is valid
  → Returns { valid, email, org_name, role, expires_at }
```

### 3.2 Users (Authenticated)

```
GET /api/v1/users/me
  → Returns current user profile

PATCH /api/v1/users/me
  Body: { display_name?, email? }
  → Updates own profile
  Validation: email uniqueness within org

PATCH /api/v1/users/me/password
  Body: { current_password, new_password }
  → Changes own password
  → Increments token_version (invalidates all other sessions)

GET /api/v1/users/
  → List all members in current org (any authenticated user)
  → Returns: [{ id, email, display_name, role, is_active, created_at }]

PATCH /api/v1/users/:id/role          [ADMIN+ only]
  Body: { role }
  → Changes user's role
  Constraints:
    - Cannot change OWNER's role (must transfer first)
    - Cannot set role to OWNER (must use transfer endpoint)
    - Cannot change own role

DELETE /api/v1/users/:id              [ADMIN+ only]
  → Deactivates user (sets is_active=false), revokes all refresh tokens
  Constraints:
    - Cannot remove OWNER
    - Cannot remove self
```

### 3.3 Invites (ADMIN+ only)

```
POST /api/v1/invites/
  Body: { email, role? }
  → Creates invite, returns { id, token, invite_url, expires_at }
  Validation:
    - Email not already a member of this org
    - No existing pending invite for this email in this org
    - Role cannot be OWNER

GET /api/v1/invites/
  → List pending (unused, unexpired) invites for current org

DELETE /api/v1/invites/:id
  → Revokes (deletes) a pending invite
```

### 3.4 Organization (ADMIN+ only)

```
GET /api/v1/organization/
  → Returns current org details { id, name, slug, created_at, member_count }

PATCH /api/v1/organization/
  Body: { name?, slug? }
  → Updates org settings
  Validation: slug uniqueness, alphanumeric + hyphens only

POST /api/v1/organization/transfer-ownership    [OWNER only]
  Body: { new_owner_id }
  → Transfers OWNER role to specified user, demotes current owner to ADMIN
  → Creates audit log entry
```

---

## 4. Signup Flow

### 4.1 Sequence

```
User visits /signup
  → Enters: display name, email, password
  → Optional: organization name (defaults to "{Name}'s Organization")
  → Clicks "Create Account"

Backend:
  1. Validate inputs (email format, password strength, uniqueness)
  2. Create Organization (name, auto-slug from name)
  3. Create User (email, password_hash, display_name, role=OWNER, org_id)
  4. Generate access_token + refresh_token
  5. Create audit log: SIGNUP
  6. Return tokens + user data

Frontend:
  → Stores auth state
  → Redirects to / (dashboard)
  → Existing onboarding checklist guides next steps
```

### 4.2 Slug Generation

```python
def generate_slug(name: str) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    # If slug exists, append random suffix
    if await org_exists(base):
        base = f"{base}-{secrets.token_hex(3)}"
    return base[:63]  # max 63 chars
```

---

## 5. Invite Flow

### 5.1 Sequence

```
Admin visits /settings/team
  → Clicks "Invite Member"
  → Enters email, selects role (ADMIN/MEMBER/VIEWER)
  → Clicks "Create Invite"

Backend:
  1. Validate: email not already member, no duplicate pending invite
  2. Create Invite record (token = secrets.token_hex(32))
  3. Create audit log: USER_INVITED
  4. Return invite with token

Frontend:
  → Shows copyable invite link: {FRONTEND_ORIGIN}/join/{token}
  → Admin copies and sends to invitee (email sending added later)

Invitee visits /join/:token
  → Page validates token via GET /invites/:token/validate
  → Shows: "You've been invited to join {org_name} as {role}"
  → Enters: display name, password
  → Clicks "Join"

Backend:
  1. Validate token (exists, not used, not expired)
  2. Create User (email from invite, role from invite, org from invite)
  3. Mark invite used_at = now
  4. Generate tokens, return auth state
  5. Create audit log: USER_JOINED

Frontend:
  → Stores auth state → redirects to dashboard
```

---

## 6. Frontend Pages

### 6.1 Signup Page (`/signup`)

- Public route (no auth required)
- Card layout matching login page style
- Fields: Display Name, Email, Password, Organization Name (optional)
- "Already have an account? Sign in" link
- On success: auto-login → redirect to dashboard

### 6.2 Join/Invite Page (`/join/:token`)

- Public route
- On load: validates token via API
- Invalid/expired: shows error with "Request a new invite" message
- Valid: shows org name + role + form (display name, password)
- "Already have an account? Sign in" link
- On success: auto-login → redirect to dashboard

### 6.3 Settings Layout (`/settings/*`)

- Sub-navigation: Profile | Team | Organization
- Team and Organization only visible to ADMIN+
- Matches existing app layout (sidebar + content area)

### 6.4 Profile Settings (`/settings`)

- Edit display name, email
- Change password (current + new + confirm)
- "Your role: MEMBER" read-only badge
- "Joined: Jan 15, 2025" timestamp
- "Active sessions" info (future: list sessions)

### 6.5 Team Settings (`/settings/team`) — ADMIN+ only

- Member list table: name, email, role badge, joined date, actions
- "Invite Member" button → modal with email + role selector
- After invite: show copyable link in success state
- Role change: dropdown on each row (ADMIN+ can change others' roles)
- Remove member: trash icon with confirmation dialog
- Pending invites section: list with revoke button
- Cannot modify OWNER row (show "Owner" badge, no actions)
- Cannot modify own role

### 6.6 Organization Settings (`/settings/organization`) — ADMIN+ only

- Edit org name, slug
- Member count, created date (read-only)
- Danger zone (OWNER only): "Transfer Ownership" button

---

## 7. Database Access

### 7.1 Docker Compose Change

Add port mapping to `db` service (localhost only, not exposed to internet):

```yaml
db:
  ports:
    - "127.0.0.1:5432:5432"
```

### 7.2 Connection Methods

**Direct (SSH + Docker):**
```bash
ssh root@64.227.143.70
docker exec -it sentinelai-db-1 psql -U sentinel -d sentinel_db
```

**SSH Tunnel (for GUI tools):**
```bash
ssh -L 5433:localhost:5432 root@64.227.143.70
# Connect GUI to: localhost:5433, user=sentinel, pass=sentinel, db=sentinel_db
```

---

## 8. Security Considerations

1. **Password requirements**: Min 8 characters (enforced backend + frontend)
2. **Invite tokens**: 64-char hex (256 bits of entropy), single-use, 7-day expiry
3. **Rate limiting**: Signup 3/min, join 5/min, login 5/min (existing)
4. **Brute-force protection**: Existing lockout after 5 failed attempts (15 min)
5. **Token invalidation on password change**: Increment token_version
6. **OWNER protection**: Cannot be removed, role cannot be changed (only transferred)
7. **Self-modification prevention**: Cannot change own role, cannot remove self
8. **Audit logging**: All auth and management actions logged with IP + user agent

---

## 9. Files Affected

### Backend (New)
- `app/models/invite.py` — Invite model
- `app/repositories/invite.py` — Invite CRUD
- `app/schemas/invite.py` — Request/response schemas
- `app/schemas/user_management.py` — User update, role change, signup schemas
- `app/api/v1/users.py` — User management endpoints
- `app/api/v1/invites.py` — Invite endpoints
- `app/api/v1/organization.py` — Org management endpoints
- `alembic/versions/011_add_invites_and_owner_role.py` — Migration

### Backend (Modified)
- `app/models/user.py` — Add OWNER to UserRole enum
- `app/api/v1/auth.py` — Add signup and join endpoints
- `app/api/v1/router.py` — Register new routers
- `app/api/v1/endpoints.py` — Add require_write dependency
- `app/api/v1/incidents.py` — Add require_write dependency
- `app/api/v1/alert_rules.py` — Add require_write dependency
- `app/api/v1/sla.py` — Add require_write dependency
- `app/api/v1/contracts.py` — Add require_write dependency
- `app/api/v1/debug.py` — Add require_write dependency
- `app/api/v1/monitor.py` — Add require_write dependency
- `app/services/auth.py` — Add signup, join logic
- `app/repositories/auth.py` — Add org creation, user creation for signup
- `docker-compose.yml` — Add DB port mapping
- `scripts/seed.py` — Update to create OWNER instead of ADMIN

### Frontend (New)
- `frontend/src/pages/SignupPage.tsx`
- `frontend/src/pages/JoinPage.tsx`
- `frontend/src/pages/settings/SettingsLayout.tsx`
- `frontend/src/pages/settings/ProfileSettings.tsx`
- `frontend/src/pages/settings/TeamSettings.tsx`
- `frontend/src/pages/settings/OrgSettings.tsx`
- `frontend/src/components/settings/InviteModal.tsx`
- `frontend/src/components/settings/MemberRow.tsx`
- `frontend/src/hooks/useUsers.ts`
- `frontend/src/hooks/useInvites.ts`
- `frontend/src/services/userService.ts`

### Frontend (Modified)
- `frontend/src/app/router.tsx` — Add new routes
- `frontend/src/components/layout/Sidebar.tsx` — Add Settings nav item
- `frontend/src/components/auth/PrivateRoute.tsx` — Handle public routes
- `frontend/src/stores/authStore.ts` — Ensure role is accessible
- `frontend/src/pages/LoginPage.tsx` — Add "Create account" link
- Various pages — Hide write actions for VIEWER role

---

## 10. Verification

1. `alembic upgrade head` — migration applies cleanly
2. Signup flow: visit /signup → create account → lands on dashboard as OWNER
3. Invite flow: /settings/team → invite → copy link → open in incognito → join → lands on dashboard
4. Role enforcement: login as VIEWER → verify cannot create endpoints, acknowledge incidents
5. Role management: as ADMIN, change a member to VIEWER → verify their UI updates
6. Password change: change password → verify old sessions are invalidated
7. Owner protection: try to remove/demote owner → verify it's rejected
8. DB access: SSH tunnel → connect via GUI tool → verify tables
9. `cd frontend && npm run build` — TypeScript compiles clean
10. Full deploy: build → rsync → docker compose build → restart
