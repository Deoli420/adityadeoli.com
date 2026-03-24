# Narrative Engine — Design Spec

## Problem

Incidents in SentinelAI show raw data — signal flags, severity scores, fingerprint hashes. A developer opening an incident sees numbers and badges but no story. They have to mentally reconstruct what happened by reading anomaly reasoning, checking fingerprint matches, and cross-referencing resolution notes. The Narrative Engine turns structured incident data into human-readable stories.

## Goals

1. Generate a 2-4 sentence narrative for every incident that answers: what happened, has this happened before, what should you try
2. Use templates for deterministic baseline, LLM for richer synthesis when context warrants the cost
3. Store narratives on the incident for instant retrieval
4. Show narratives prominently on incident detail and as subtitles on incident list

## Non-Goals

- Real-time streaming narrative updates
- User-editable narratives
- Narrative versioning or history
- Multi-language support

---

## 1. Narrative Generation

### 1.1 Template Mode (No LLM)

Always available, zero cost. Assembles from structured data:

```
{endpoint_name} triggered a {severity} incident: {signal_summary}.
{recurrence_line}
{resolution_line}
```

Where:
- `signal_summary`: Human-readable list of signal flags. "latency spike (3.2s vs baseline), schema drift, status 500"
- `recurrence_line`: "This is the Nth occurrence of this pattern." or "First occurrence of this pattern." (from fingerprint cache)
- `resolution_line`: "Previously resolved in {avg_time}: {last_notes}" or "No prior resolution data available." (from fingerprint cache)

### 1.2 LLM Mode (Cost-Gated)

Called when ALL of these are true:
- Anomaly reasoning text exists (from anomaly engine)
- At least one of: fingerprint occurrence_count > 1, OR 3+ signal flags, OR cross-endpoint matches exist

LLM prompt sends:
- Signal flags and their values
- Anomaly reasoning (truncated 500 chars)
- Status code and response time
- Fingerprint match data (occurrence count, avg resolution, last notes)
- Cross-endpoint match info

LLM returns structured JSON:
```json
{
  "narrative": "string (2-4 sentences)",
  "suggested_action": "string (1 sentence, optional)"
}
```

Falls back to template mode if LLM returns None or fails.

### 1.3 Cost Control

Same pattern as existing anomaly engine:
- Each LLM call tracked via AiTelemetryRecord
- Uses gpt-4o-mini (cheapest, sufficient for summarization)
- Estimated cost per narrative: ~$0.001 (500 input tokens, 100 output tokens)

---

## 2. Storage

Add `narrative` TEXT column to `incidents` table. Nullable. Generated once on creation, can be regenerated on demand.

Migration: `013_add_incident_narrative.py`

---

## 3. Service

`app/services/narrative.py` — `NarrativeService`

Methods:
- `generate(incident, pipeline, fingerprint_match)` → str: Main entry. Tries LLM if conditions met, falls back to template.
- `_template_narrative(incident, signal_flags, match_data)` → str: Deterministic template assembly.
- `_llm_narrative(incident, pipeline, match_data)` → str | None: LLM call with structured prompt.
- `regenerate(incident_id, tenant_id)` → str: Re-generates and persists.

Prompt template in `app/ai/prompt_templates.py`:
- `NARRATIVE_SYSTEM_PROMPT`: "You are a concise incident narrator for an API monitoring platform..."
- `build_narrative_prompt(signal_flags, anomaly_reasoning, match_data, status_code, response_time)` → str

---

## 4. Integration Points

### 4.1 Scheduler (on creation)
In `_manage_incidents()` in `jobs.py`, after incident creation and fingerprint matching:
1. Call `NarrativeService.generate(incident, pipeline, match_result)`
2. Set `incident.narrative = result`
3. Commit

### 4.2 API (on demand)
- `GET /incidents/{id}` — include `narrative` in response (already stored)
- `POST /incidents/{id}/generate-narrative` — regenerate narrative, persist, return updated incident

### 4.3 Incident list
- `IncidentListItem` schema: add `narrative: str | None` field
- Query already loads incidents — just include the column

---

## 5. Frontend

### 5.1 NarrativeCard (incident detail)
New component on IncidentDetailPage, above PatternMatchCard:
- Shows narrative text in a card with BookOpen icon
- If no narrative: "Generate Story" button that calls POST /generate-narrative
- Loading state while generating
- Text styled as text-sm text-text-primary with subtle bg-surface-secondary card

### 5.2 Incident list subtitle
In IncidentsPage IncidentRow, below the title:
- Show first 100 chars of narrative in text-xs text-text-tertiary
- Truncated with ellipsis

---

## 6. Files Affected

### Backend (New)
- `app/services/narrative.py` — NarrativeService
- `alembic/versions/013_add_incident_narrative.py` — Migration

### Backend (Modified)
- `app/ai/prompt_templates.py` — Add narrative prompts
- `app/scheduler/jobs.py` — Call narrative service on incident creation
- `app/services/incident.py` — Add narrative to list items
- `app/api/v1/incidents.py` — Add generate-narrative endpoint, include narrative in responses
- `app/schemas/incident.py` — Add narrative field to response schemas

### Frontend (New)
- `frontend/src/components/incidents/NarrativeCard.tsx`

### Frontend (Modified)
- `frontend/src/pages/IncidentDetailPage.tsx` — Add NarrativeCard
- `frontend/src/pages/IncidentsPage.tsx` — Show narrative subtitle
- `frontend/src/services/endpointsService.ts` — Add generateNarrative API call
- `frontend/src/hooks/useIncidents.ts` — Add useGenerateNarrative mutation
- `frontend/src/types/incident.ts` — Add narrative to IncidentListItem

---

## 7. Verification

1. Create an incident via monitoring pipeline → narrative auto-generated
2. View incident detail → NarrativeCard shows story
3. Incident list → subtitle shows truncated narrative
4. "Generate Story" button works for incidents without narratives
5. LLM unavailable → template narrative still generated
6. `npm run build` compiles clean
7. Deploy and verify production
