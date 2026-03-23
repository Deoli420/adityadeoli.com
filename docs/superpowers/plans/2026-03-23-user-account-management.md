# User & Account Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add self-service signup, team invites, RBAC enforcement, and settings pages to make SentinelAI a production SaaS product.

**Architecture:** Extend existing JWT auth with OWNER role, new Invite model, signup/join endpoints. Apply `require_role()` dependency to all write routes. Frontend gets signup, join, and settings pages with permission-aware UI.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, PostgreSQL 16, React 19, TypeScript, Tailwind CSS 4, React Query v5, Zustand, react-hot-toast

**Spec:** `docs/superpowers/specs/2026-03-23-user-account-management-design.md`

---

## Task 1: Database — Migration, Model, OWNER Role

**Files:**
- Modify: `app/models/user.py` — add OWNER to UserRole enum
- Create: `app/models/invite.py` — Invite model
- Create: `alembic/versions/011_add_invites_and_owner_role.py` — migration
- Modify: `scripts/seed.py` — seed OWNER instead of ADMIN
- Modify: `docker-compose.yml` — expose DB port on localhost

- [ ] **Step 1: Add OWNER to UserRole enum**

In `app/models/user.py`, add OWNER before ADMIN:
```python
class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"
```

- [ ] **Step 2: Create Invite model**

Create `app/models/invite.py`:
```python
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import DateTime, ForeignKey, String, func, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.user import UserRole

def _default_expiry():
    return datetime.now(timezone.utc) + timedelta(days=7)

class Invite(Base):
    __tablename__ = "invites"
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_invite_org_email_pending"),
    )
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role", create_type=False), nullable=False, default=UserRole.MEMBER)
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True, default=lambda: secrets.token_hex(32))
    invited_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_default_expiry)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization")
    inviter = relationship("User", foreign_keys=[invited_by])
```

- [ ] **Step 3: Create Alembic migration**

Create `alembic/versions/011_add_invites_and_owner_role.py`. Read the existing migration files in `alembic/versions/` to match the naming and dependency chain pattern. The migration must:
1. Add 'OWNER' to the PostgreSQL `user_role` enum type using `ALTER TYPE user_role ADD VALUE 'OWNER' BEFORE 'ADMIN'`
2. Create the `invites` table with all columns from the model
3. Update existing ADMIN users to OWNER (one per org): `UPDATE users SET role = 'OWNER' WHERE role = 'ADMIN' AND id IN (SELECT MIN(id::text)::uuid FROM users WHERE role = 'ADMIN' GROUP BY organization_id)`

- [ ] **Step 4: Update seed script**

In `scripts/seed.py`, change the admin user creation from `role=UserRole.ADMIN` to `role=UserRole.OWNER`.

- [ ] **Step 5: Expose DB port for direct access**

In `docker-compose.yml`, add to the `db` service:
```yaml
    ports:
      - "127.0.0.1:5432:5432"
```
This allows SSH tunnel access from GUI tools but is NOT exposed to the internet.

- [ ] **Step 6: Run migration and verify**

```bash
# Local
cd /Users/adityadeoli/SentinelAI && alembic upgrade head

# Production (after deploy)
ssh root@64.227.143.70 "cd /home/deploy/sentinelai && docker compose exec api alembic upgrade head"
```

- [ ] **Step 7: Commit**
```bash
git add app/models/user.py app/models/invite.py alembic/versions/011_* scripts/seed.py docker-compose.yml
git commit -m "feat: add OWNER role, Invite model, and migration 011"
```

---

## Task 2: Backend — Signup, Join, User Management APIs

**Files:**
- Create: `app/schemas/user_management.py` — Pydantic schemas for signup, join, user ops
- Create: `app/schemas/invite.py` — Invite request/response schemas
- Create: `app/repositories/invite.py` — Invite CRUD
- Create: `app/api/v1/users.py` — User management endpoints
- Create: `app/api/v1/invites.py` — Invite endpoints
- Create: `app/api/v1/organization.py` — Org management endpoints
- Modify: `app/api/v1/auth.py` — Add signup and join endpoints
- Modify: `app/services/auth.py` — Add signup and join logic
- Modify: `app/repositories/auth.py` — Add org creation, user listing
- Modify: `app/api/v1/router.py` — Register new routers

- [ ] **Step 1: Create Pydantic schemas**

Create `app/schemas/user_management.py`:
```python
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole

class SignupRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    org_name: str | None = None  # defaults to "{name}'s Organization"

class JoinRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)

class UpdateProfileRequest(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

class ChangeRoleRequest(BaseModel):
    role: UserRole

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    is_active: bool
    created_at: str

class OrgUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(None, min_length=1, max_length=63, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')

class TransferOwnershipRequest(BaseModel):
    new_owner_id: str
```

Create `app/schemas/invite.py`:
```python
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole

class CreateInviteRequest(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MEMBER

class InviteResponse(BaseModel):
    id: str
    email: str
    role: str
    token: str
    invite_url: str
    expires_at: str
    created_at: str

class ValidateInviteResponse(BaseModel):
    valid: bool
    email: str | None = None
    org_name: str | None = None
    role: str | None = None
    expires_at: str | None = None
```

- [ ] **Step 2: Create Invite repository**

Create `app/repositories/invite.py` with methods:
- `create(org_id, email, role, invited_by) → Invite`
- `get_by_token(token) → Invite | None` (with joinedload organization)
- `get_pending_by_org(org_id) → list[Invite]` (where used_at IS NULL and expires_at > now)
- `get_pending_by_email_and_org(email, org_id) → Invite | None`
- `mark_used(invite_id)`
- `delete(invite_id)`

- [ ] **Step 3: Add signup and join to auth service**

In `app/services/auth.py`, add methods:
- `signup(display_name, email, password, org_name) → (access_token, refresh_token, user)`:
  1. Check email not taken globally (for now, simplify)
  2. Generate slug from org_name using `re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')`
  3. Create Organization
  4. Create User with role=OWNER
  5. Generate tokens
- `join_via_invite(token, display_name, password) → (access_token, refresh_token, user)`:
  1. Validate invite (exists, not used, not expired)
  2. Create User with invite's email, role, org_id
  3. Mark invite used
  4. Generate tokens

In `app/repositories/auth.py`, add methods:
- `create_organization(name, slug) → Organization`
- `create_user(email, password_hash, display_name, role, org_id) → User`
- `get_users_by_org(org_id) → list[User]`
- `get_user_by_id_and_org(user_id, org_id) → User | None`
- `update_user(user_id, **fields)`
- `get_org_by_id(org_id) → Organization | None`
- `update_org(org_id, **fields)`
- `check_slug_exists(slug) → bool`

- [ ] **Step 4: Add signup and join auth routes**

In `app/api/v1/auth.py`, add:
- `POST /auth/signup` — public, calls service.signup, sets refresh cookie, returns access_token + user
- `POST /auth/join/{token}` — public, calls service.join_via_invite, same return pattern
- `GET /auth/invites/{token}/validate` — public, validates token and returns info

Follow the exact same pattern as the existing `login` endpoint for cookie setting and response format.

- [ ] **Step 5: Create user management routes**

Create `app/api/v1/users.py` with router prefix `/users`:
- `GET /users/me` — return current user (CurrentUser dependency)
- `PATCH /users/me` — update profile (display_name, email)
- `PATCH /users/me/password` — change password (verify current, hash new, increment token_version)
- `GET /users/` — list org members (any auth user, filtered by TenantId)
- `PATCH /users/{user_id}/role` — change role (require_admin, with OWNER/self protection)
- `DELETE /users/{user_id}` — deactivate user (require_admin, with OWNER/self protection)

- [ ] **Step 6: Create invite routes**

Create `app/api/v1/invites.py` with router prefix `/invites`:
- `POST /invites/` — create invite (require_admin), validate email not already member, no pending duplicate, role != OWNER
- `GET /invites/` — list pending invites (require_admin)
- `DELETE /invites/{invite_id}` — revoke invite (require_admin)

Build invite_url using `settings.FRONTEND_ORIGIN + "/join/" + token`

- [ ] **Step 7: Create organization routes**

Create `app/api/v1/organization.py` with router prefix `/organization`:
- `GET /organization/` — return current org details + member count (require_admin)
- `PATCH /organization/` — update name/slug (require_admin, validate slug uniqueness)
- `POST /organization/transfer-ownership` — transfer OWNER (require_role OWNER only)

- [ ] **Step 8: Register new routers**

In `app/api/v1/router.py`, add:
```python
from app.api.v1.users import router as users_router
from app.api.v1.invites import router as invites_router
from app.api.v1.organization import router as organization_router

v1_router.include_router(users_router)
v1_router.include_router(invites_router)
v1_router.include_router(organization_router)
```

- [ ] **Step 9: Verify backend starts and new endpoints appear in /docs**

```bash
cd /Users/adityadeoli/SentinelAI && uvicorn app.main:app --reload
# Visit http://localhost:8000/docs — verify new endpoints
```

- [ ] **Step 10: Commit**
```bash
git add app/schemas/ app/repositories/invite.py app/api/v1/users.py app/api/v1/invites.py app/api/v1/organization.py app/api/v1/auth.py app/api/v1/router.py app/services/auth.py app/repositories/auth.py
git commit -m "feat: add signup, join, user management, invite, and org APIs"
```

---

## Task 3: Backend — RBAC Enforcement on All Write Routes

**Files:**
- Modify: `app/api/v1/endpoints.py` — add require_write
- Modify: `app/api/v1/incidents.py` — add require_write
- Modify: `app/api/v1/alert_rules.py` — add require_write
- Modify: `app/api/v1/sla.py` — add require_write
- Modify: `app/api/v1/contracts.py` — add require_write
- Modify: `app/api/v1/debug.py` — add require_write
- Modify: `app/api/v1/monitor.py` — add require_write
- Modify: `app/api/v1/schema.py` — add require_write
- Modify: `app/core/auth.py` — add convenience aliases

- [ ] **Step 1: Add convenience aliases to auth.py**

In `app/core/auth.py`, add at the bottom:
```python
# Convenience dependencies for route protection
RequireWrite = Depends(require_role(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER))
RequireAdmin = Depends(require_role(UserRole.OWNER, UserRole.ADMIN))
RequireOwner = Depends(require_role(UserRole.OWNER))
```

- [ ] **Step 2: Apply require_write to all write endpoints**

For each of these files, add `dependencies=[RequireWrite]` to every `POST`, `PATCH`, `DELETE` route decorator (except the ones that already have `require_role`):

- `app/api/v1/endpoints.py`: POST /, PATCH /{id}, DELETE /{id}
- `app/api/v1/incidents.py`: POST /, PATCH /{id}/status, POST /{id}/notes
- `app/api/v1/alert_rules.py`: POST /, PATCH /{id}, DELETE /{id}, POST /{id}/toggle
- `app/api/v1/sla.py`: POST /, PATCH /{id}, DELETE /{id}
- `app/api/v1/contracts.py`: POST /{id}/upload, POST /{id}/validate
- `app/api/v1/debug.py`: POST /{id}/suggest
- `app/api/v1/monitor.py`: POST /run/{id}
- `app/api/v1/schema.py`: POST /{id}/accept

Import pattern for each file:
```python
from app.core.auth import RequireWrite
```

Then add to routes:
```python
@router.post("/", dependencies=[RequireWrite])
```

- [ ] **Step 3: Verify existing admin-only routes still work**

The `alerts.py` and `scheduler.py` files already have `require_role(UserRole.ADMIN)`. Update these to include OWNER:
```python
dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))]
```

- [ ] **Step 4: Commit**
```bash
git add app/core/auth.py app/api/v1/endpoints.py app/api/v1/incidents.py app/api/v1/alert_rules.py app/api/v1/sla.py app/api/v1/contracts.py app/api/v1/debug.py app/api/v1/monitor.py app/api/v1/schema.py app/api/v1/alerts.py app/api/v1/scheduler.py
git commit -m "feat: enforce RBAC on all write endpoints"
```

---

## Task 4: Frontend — Signup, Join, Auth Updates

**Files:**
- Create: `frontend/src/pages/SignupPage.tsx`
- Create: `frontend/src/pages/JoinPage.tsx`
- Create: `frontend/src/services/userService.ts`
- Modify: `frontend/src/app/router.tsx` — add /signup and /join/:token routes
- Modify: `frontend/src/pages/LoginPage.tsx` — add "Create account" link
- Modify: `frontend/src/hooks/useAuth.ts` — update useIsAdmin and useCanWrite for OWNER
- Modify: `frontend/src/stores/authStore.ts` — ensure role handling includes OWNER

- [ ] **Step 1: Create userService.ts**

Create `frontend/src/services/userService.ts` with all new API functions:
- `signup(data)`, `joinInvite(token, data)`, `validateInvite(token)`
- `getUsers()`, `updateProfile(data)`, `changePassword(data)`
- `changeUserRole(userId, role)`, `removeUser(userId)`
- `createInvite(data)`, `getInvites()`, `revokeInvite(id)`
- `getOrganization()`, `updateOrganization(data)`, `transferOwnership(newOwnerId)`

- [ ] **Step 2: Update auth hooks for OWNER role**

In `frontend/src/hooks/useAuth.ts`:
```typescript
export function useCanWrite() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

export function useIsAdmin() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "OWNER" || role === "ADMIN";
}

export function useIsOwner() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "OWNER";
}
```

- [ ] **Step 3: Create SignupPage.tsx**

Match the existing LoginPage.tsx design (centered card, logo, form fields). Fields:
- Display Name (required)
- Email (required, email validation)
- Password (required, min 8 chars)
- Organization Name (optional, placeholder: "My Company")
- Submit button: "Create Account"
- Below: "Already have an account? Sign in" link to /login

On submit: call `userService.signup()`, store auth state via `useAuthStore`, navigate to `/`.

- [ ] **Step 4: Create JoinPage.tsx**

On mount: call `userService.validateInvite(token)` to check token validity.
- Invalid/expired: show error card with message
- Valid: show card with "You've been invited to join {org_name} as {role}" + form (Display Name, Password)
- On submit: call `userService.joinInvite(token, data)`, store auth, navigate to `/`

- [ ] **Step 5: Update router.tsx**

Add public routes before the PrivateRoute:
```tsx
{ path: "/signup", element: <SignupPage /> },
{ path: "/join/:token", element: <JoinPage /> },
```

- [ ] **Step 6: Update LoginPage.tsx**

Add link below the login form:
```tsx
<p className="text-center text-xs text-text-tertiary mt-4">
  Don't have an account?{" "}
  <Link to="/signup" className="text-accent hover:underline font-medium">Create one</Link>
</p>
```

- [ ] **Step 7: Build and verify**
```bash
cd /Users/adityadeoli/SentinelAI/frontend && npm run build
```

- [ ] **Step 8: Commit**
```bash
git add frontend/src/pages/SignupPage.tsx frontend/src/pages/JoinPage.tsx frontend/src/services/userService.ts frontend/src/app/router.tsx frontend/src/pages/LoginPage.tsx frontend/src/hooks/useAuth.ts
git commit -m "feat: add signup page, join page, and auth hook updates"
```

---

## Task 5: Frontend — Settings Pages (Profile, Team, Org)

**Files:**
- Create: `frontend/src/pages/settings/SettingsLayout.tsx`
- Create: `frontend/src/pages/settings/ProfileSettings.tsx`
- Create: `frontend/src/pages/settings/TeamSettings.tsx`
- Create: `frontend/src/pages/settings/OrgSettings.tsx`
- Create: `frontend/src/components/settings/InviteModal.tsx`
- Create: `frontend/src/components/settings/MemberRow.tsx`
- Create: `frontend/src/hooks/useUsers.ts`
- Create: `frontend/src/hooks/useInvites.ts`
- Modify: `frontend/src/app/router.tsx` — add settings routes
- Modify: `frontend/src/components/layout/Sidebar.tsx` — add Settings nav item

- [ ] **Step 1: Create React Query hooks**

Create `frontend/src/hooks/useUsers.ts`:
- `useUsers()` — list org members
- `useUpdateProfile()` — mutation for profile update
- `useChangePassword()` — mutation
- `useChangeRole()` — mutation
- `useRemoveUser()` — mutation

Create `frontend/src/hooks/useInvites.ts`:
- `useInvites()` — list pending invites
- `useCreateInvite()` — mutation
- `useRevokeInvite()` — mutation

Both follow existing React Query patterns in the codebase (see `useEndpoints.ts` for reference).

- [ ] **Step 2: Create SettingsLayout.tsx**

Layout with left sub-nav (Profile | Team | Organization) + right content area via `<Outlet />`.
- Team and Organization tabs: only visible when `useIsAdmin()` returns true
- Uses NavLink with active state styling matching existing sidebar patterns
- Header: "Settings" with gear icon

- [ ] **Step 3: Create ProfileSettings.tsx**

Two cards:
1. **Profile** card: display name + email inputs, "Save" button. Uses `useUpdateProfile()` mutation.
2. **Change Password** card: current password, new password, confirm password. Uses `useChangePassword()` mutation.
3. Role badge (read-only): shows current role with color coding.
4. Account info: joined date.

- [ ] **Step 4: Create TeamSettings.tsx (ADMIN+ only)**

Two sections:
1. **Members table**: columns = Name, Email, Role (dropdown for ADMIN+), Joined, Actions (remove button). Use `MemberRow` component for each row. OWNER row shows "Owner" badge, no actions.
2. **Pending Invites**: list with email, role, expires date, revoke button.
3. **Invite Member** button opens `InviteModal`.

- [ ] **Step 5: Create InviteModal.tsx**

Modal (or slide-over) with:
- Email input (required)
- Role selector: ADMIN, MEMBER, VIEWER (dropdown, default MEMBER)
- "Send Invite" button
- On success: show the copyable invite link with a "Copy" button
- Uses `useCreateInvite()` mutation

- [ ] **Step 6: Create MemberRow.tsx**

Table row component:
- Avatar (initials), name, email, role badge/dropdown, joined date
- Role dropdown: disabled for OWNER, disabled for self, calls `useChangeRole()`
- Remove button: confirmation dialog, calls `useRemoveUser()`
- Owner shows crown/shield icon instead of dropdown

- [ ] **Step 7: Create OrgSettings.tsx (ADMIN+ only)**

- Org name input + slug input + "Save" button
- Read-only: member count, created date
- Danger zone (OWNER only): "Transfer Ownership" with user selector dropdown + confirm dialog

- [ ] **Step 8: Add settings routes to router.tsx**

```tsx
import { SettingsLayout } from "@/pages/settings/SettingsLayout.tsx";
import { ProfileSettings } from "@/pages/settings/ProfileSettings.tsx";
import { TeamSettings } from "@/pages/settings/TeamSettings.tsx";
import { OrgSettings } from "@/pages/settings/OrgSettings.tsx";

// Inside the Layout children:
{
  path: "settings",
  element: <SettingsLayout />,
  children: [
    { index: true, element: <ProfileSettings /> },
    { path: "team", element: <TeamSettings /> },
    { path: "organization", element: <OrgSettings /> },
  ],
},
```

- [ ] **Step 9: Add Settings to Sidebar**

In `Sidebar.tsx`, add Settings nav item (Settings icon from lucide) to NAV_ITEMS, positioned before "Add Endpoint" or at the bottom before user info.

- [ ] **Step 10: Build and verify**
```bash
cd /Users/adityadeoli/SentinelAI/frontend && npm run build
```

- [ ] **Step 11: Commit**
```bash
git add frontend/src/pages/settings/ frontend/src/components/settings/ frontend/src/hooks/useUsers.ts frontend/src/hooks/useInvites.ts frontend/src/app/router.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: add settings pages — profile, team management, org settings"
```

---

## Task 6: Frontend — Permission-Aware UI + Final Integration

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx` — hide "Add Endpoint" for VIEWER
- Modify: `frontend/src/pages/IncidentsPage.tsx` — hide quick actions for VIEWER
- Modify: `frontend/src/pages/EndpointDetailPage.tsx` — hide edit/delete for VIEWER
- Modify: `frontend/src/pages/CreateEndpointPage.tsx` — redirect VIEWER to dashboard
- Modify: `frontend/src/components/layout/Sidebar.tsx` — hide "Add Endpoint" nav for VIEWER

- [ ] **Step 1: Hide "Add Endpoint" button for VIEWER**

In `DashboardPage.tsx`, wrap the "Add Endpoint" link:
```tsx
const canWrite = useCanWrite();
// ...
{canWrite && (
  <Link to="/endpoints/new" className="btn-primary">
    <Plus className="h-3.5 w-3.5" /> Add Endpoint
  </Link>
)}
```

In `Sidebar.tsx`, conditionally render the "Add Endpoint" nav item only for canWrite users.

- [ ] **Step 2: Hide quick actions for VIEWER on incidents**

In `IncidentsPage.tsx`, the quick action buttons (Acknowledge, Resolve) should only show for canWrite:
```tsx
const canWrite = useCanWrite();
// In IncidentRow, wrap the action buttons:
{canWrite && status === "OPEN" && <button>Acknowledge</button>}
```

- [ ] **Step 3: Hide edit/delete on EndpointDetailPage**

Wrap edit button and any delete/configure actions with `useCanWrite()` check.

- [ ] **Step 4: Redirect VIEWER from create/edit pages**

In `CreateEndpointPage.tsx`, add at the top:
```tsx
const canWrite = useCanWrite();
if (!canWrite) { navigate("/"); return null; }
```

- [ ] **Step 5: Final build and full verification**

```bash
cd /Users/adityadeoli/SentinelAI/frontend && npm run build
```

Then verify all 10 acceptance criteria from the spec:
1. Signup flow works
2. Invite flow works
3. Role enforcement (VIEWER can't write)
4. Role management (ADMIN can change roles)
5. Password change invalidates sessions
6. Owner protection
7. Settings pages render correctly
8. DB access via SSH tunnel
9. TypeScript compiles clean
10. Production deploy

- [ ] **Step 6: Commit**
```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/IncidentsPage.tsx frontend/src/pages/EndpointDetailPage.tsx frontend/src/pages/CreateEndpointPage.tsx frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: permission-aware UI — hide write actions for VIEWER role"
```

---

## Task 7: Deploy to Production

- [ ] **Step 1: Push all commits**
```bash
git push origin main
```

- [ ] **Step 2: Pull on server and run migration**
```bash
ssh root@64.227.143.70 "cd /home/deploy/sentinelai && git pull origin main && docker compose exec api alembic upgrade head"
```

- [ ] **Step 3: Build and deploy frontend**
```bash
cd /Users/adityadeoli/SentinelAI/frontend && npm run build
rsync -avz --delete frontend/dist/ root@64.227.143.70:/home/deploy/sentinelai/frontend/dist/
```

- [ ] **Step 4: Rebuild API container and restart**
```bash
ssh root@64.227.143.70 "cd /home/deploy/sentinelai && docker compose build api && docker compose up -d api && docker compose restart nginx"
```

- [ ] **Step 5: Verify production**
```bash
curl -s https://sentinelai.adityadeoli.com/api/v1/health
curl -s -o /dev/null -w "%{http_code}" https://sentinelai.adityadeoli.com/signup
curl -s -o /dev/null -w "%{http_code}" https://sentinelai.adityadeoli.com/api/v1/auth/signup
```
