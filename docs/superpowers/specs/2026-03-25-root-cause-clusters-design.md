# Root Cause Clusters — Design Spec

## Problem

When a shared dependency fails (database, Redis, upstream service), multiple endpoints degrade simultaneously. SentinelAI creates separate incidents for each endpoint, but the developer sees them as unrelated events. They investigate each one individually, missing the pattern that they all started failing within minutes of each other with similar signals. Root Cause Clusters automatically group temporally and signal-correlated incidents to surface cascading failures.

## Goals

1. Auto-detect clusters when 2+ incidents across different endpoints share similar signals within a configurable time window (default 15 min)
2. New `IncidentCluster` model with lifecycle (ACTIVE → RESOLVED → MERGED)
3. Dashboard banner for active clusters, cluster tab on incidents page
4. Manual override: merge clusters, edit root cause, add/remove incidents

## Non-Goals

- ML-based root cause prediction
- Automated remediation
- Cross-organization clustering

---

## 1. Data Model

### IncidentCluster table

```
id              UUID PK
organization_id UUID FK → organizations, NOT NULL, indexed
title           VARCHAR(500) NOT NULL (auto-generated)
status          VARCHAR(20) NOT NULL default 'ACTIVE' (ACTIVE|RESOLVED|MERGED)
shared_signals  JSON NOT NULL (array of common signal flags)
root_cause_summary TEXT nullable (LLM-generated or manual)
merged_into_id  UUID FK → incident_clusters nullable (for MERGED status)
detected_at     DateTime NOT NULL
resolved_at     DateTime nullable
created_at      DateTime server_default now()
updated_at      DateTime server_default now(), onupdate now()
```

### Incident table change

Add `cluster_id UUID FK → incident_clusters nullable` to existing incidents table.

### Migration: 014_add_incident_clusters

## 2. Cluster Detection (ClusterService)

### Detection algorithm (runs in _manage_incidents after every incident creation):

1. New incident created with fingerprint + signal_flags
2. Query: all OPEN/INVESTIGATING incidents in same org, created within last 15 minutes, on DIFFERENT endpoints
3. For each candidate: compute Jaccard similarity of signal flags (threshold >= 0.5)
4. If 1+ candidates match → check if any belong to an existing ACTIVE cluster
   - Yes: add new incident to that cluster, update cluster's shared_signals (intersection)
   - No: create new cluster from the matching set + new incident
5. Auto-generate cluster title: "Cascading failure: {shared_signals} across {N} endpoints"

### Resolution:
- When all member incidents are RESOLVED → auto-resolve the cluster
- Check on every incident status change

## 3. API Endpoints

```
GET  /clusters/                        → list clusters (status filter, limit)
GET  /clusters/{id}                    → cluster detail with member incidents
PATCH /clusters/{id}                   → update title, root_cause_summary [ADMIN]
POST /clusters/{id}/merge              → merge another cluster [ADMIN]
POST /incidents/{id}/assign-cluster    → manually assign incident to cluster [ADMIN]
DELETE /incidents/{id}/assign-cluster   → remove incident from cluster [ADMIN]
```

## 4. Frontend

### Dashboard AttentionBanner
- When active clusters exist: "⚡ Cluster: 3 endpoints failing simultaneously — possible shared root cause" → links to cluster detail

### Incidents page: Clusters tab
- New tab alongside All/Open/Investigating/Resolved
- Shows cluster cards with: title, member count, shared signals, detected_at, status badge
- Click → navigates to cluster detail

### Cluster detail page (/incidents/clusters/{id})
- Header: title + status badge + root cause summary (editable for ADMIN)
- Shared signal pills
- Member incidents list (same IncidentRow component reused)
- Timeline: when each endpoint started failing (sorted by started_at)

### Incident detail
- If incident belongs to a cluster: banner "Part of cluster: {title}" with link

## 5. Files

### Backend (New)
- `app/models/incident_cluster.py`
- `app/repositories/cluster.py`
- `app/services/cluster.py`
- `app/api/v1/clusters.py`
- `alembic/versions/014_add_incident_clusters.py`

### Backend (Modified)
- `app/models/incident.py` — add cluster_id FK
- `app/scheduler/jobs.py` — call cluster detection after incident creation
- `app/services/incident.py` — check cluster auto-resolve on status change
- `app/api/v1/router.py` — register clusters_router

### Frontend (New)
- `frontend/src/components/incidents/ClusterCard.tsx`
- `frontend/src/pages/ClusterDetailPage.tsx`
- `frontend/src/hooks/useClusters.ts`

### Frontend (Modified)
- `frontend/src/services/endpointsService.ts` — cluster API functions
- `frontend/src/types/incident.ts` — add cluster types
- `frontend/src/pages/IncidentsPage.tsx` — add Clusters tab
- `frontend/src/pages/IncidentDetailPage.tsx` — cluster banner
- `frontend/src/components/dashboard/AttentionBanner.tsx` — cluster awareness
- `frontend/src/app/router.tsx` — add cluster detail route
