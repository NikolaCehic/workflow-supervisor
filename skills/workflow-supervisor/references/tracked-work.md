# Tracked Work

Use one ledger only when it reduces resume risk or makes several outcomes human-verifiable.

## Unit Shape

```yaml
id:
source:
scope:
outcome:
check:
status: pending | active | pass | fail | blocked
changes: []
evidence: []
blocker_or_next:
```

Prefer vertical slices that expose one observable behavior. Use a horizontal unit only for migration safety, infrastructure, research, or another concrete boundary reason.

## Loop

1. Select one ready unit.
2. Inspect only the sources needed for it.
3. Make the smallest sufficient change.
4. Run the focused check.
5. Update one ledger row.
6. Repair only failed outcomes, then rerun affected and regression checks.

Parallelize read-only or disjoint units only. Serialize overlapping files, shared state, migrations, external systems, and ambiguous ownership.

## Pause And Resume

Before a pause, preserve only:

- objective and hard boundaries
- controlling sources and decisions
- completed, active, blocked, and remaining units
- changes and evidence
- the blocker and smallest question
- exact next action

After an answer, update affected state and invalidate only downstream work whose assumptions changed. Do not restart unrelated completed work.

Keep state inline for short work. Use `.workflow/LEDGER.md` only when the workspace permits local workflow files; keep it untracked unless the user makes it a deliverable.
