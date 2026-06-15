# Workflow Control Templates

Use these for supervised workflow state. Do not use them for ordinary documentation drafting unless workflow state or continuation is required.

Default path: create these files under `<workspace>/.workflow/` unless the user provides another artifact directory or the project already has an established workflow-state location.

Git rule: in a Git-backed codebase, ensure `<workspace>/.gitignore` contains `.workflow/` before creating this directory. Treat `.workflow/` as local workflow memory; do not stage, commit, push, or include it in a PR unless the user explicitly makes workflow state a final deliverable.

## WORKFLOW.md

```md
# Workflow

## Objective

## Audience Or Consumer

## Current Status

## Execution Path

## Final Disposition Policy

## Constraints

## Non-Goals

## Source Corpus

## Artifact Map

## Work Units

| ID | Title | Status | Depends On | Next Action |
|---|---|---|---|---|

## Loop Policy

## Stop Gates

## Next Action
```

## SOURCE-CORPUS.md

```md
# Source Corpus

## Source Ranking

| Source | Type | Owner | Authority | Freshness | Access | Usage Rights | Relevant Claims | Risk | Confidence |
|---|---|---|---|---|---|---|---|---|---|

## Contradictions

| Sources | Issue | Material | Resolution |
|---|---|---|---|

## Missing Sources

## Evidence Gaps

## Assumptions And Inferences

## Allowed Next Action
```

## WORK-UNITS.md

```md
# Work Units

| ID | Worker Slug | Title | Objective | Dependencies | Status | Verification |
|---|---|---|---|---|---|---|

## Sequencing

## Parallelization Notes

## Blocked Units
```

## DOSSIER.md

```md
# Dossier

## Dossier ID

## Worker Name

## Worker Role

## Delegation Transport

## Start Condition

## Work Unit

## Objective

## Non-Goals

## Sources To Read

## Boundary Type

## Scope Boundaries

### Allowed Surfaces Or Artifacts

### Forbidden Surfaces, Claims, Or Decisions

## Read-Only Neighbor Context

## Acceptance Matrix

## Quality Or Risk Checks

## Required Checks Or Evidence

## Owner Or Contributor Role

## Worker Prompt

## Supervisor Checkpoints

## Report Schema

## Stop Gates

## Open Questions
```

## WORKER-MAP.md

```md
# Worker Map

| Worker Name | Role | Transport | Work Unit | Dossier | Start Condition | Dependencies | Status | Terminal Report |
|---|---|---|---|---|---|---|---|---|

## Supervisor Checkpoints

## Blocked Workers

## Closed Workers
```

## ACCEPTANCE-MATRIX.md

```md
# Acceptance Matrix

| ID | Requirement | Evidence Required | Verification Method | Adversarial Check | Status | Evidence |
|---|---|---|---|---|---|---|

## Residual Risks

## Waivers
```

## VERIFICATION-REPORT.md

```md
# Verification Report

Status: PASS | FAIL | BLOCKED | NEEDS REVISION | APPROVED WITH CAVEATS | READY TO PUBLISH | SME REVIEW NEEDED | LEGAL REVIEW NEEDED | STALE

Verified Work Unit:

Verified Worker:

## Sources Inspected

## Materials Inspected

## Checks, Reviews, Or Evidence Methods

| Method | Result | Evidence |
|---|---|---|

## Acceptance Mapping

| Requirement | Verdict | Evidence |
|---|---|---|

## Findings

## Skipped Checks

## Residual Risks

## Repair Or Revision Recommendations

## Re-Verification Required
```

## REPAIR-TICKETS.md

```md
# Repair Tickets

## Ticket 1: Title

Finding Or Matrix Row:
Severity:
Affected Surfaces Or Artifacts:
Problem:
Required Repair:
Required Checks Or Evidence:
Acceptance Criteria:
```

## DECISIONS.md

```md
# Decisions

| Date | Decision | Source | Rationale | Reversible |
|---|---|---|---|---|

## Assumptions

## Reversals

## Open Questions
```

## HANDOFF.md

```md
# Handoff

## Current State

## What Was Done

## What Remains

## Sources Used

## Checks, Reviews, Or Methods

## Known Risks

## Blockers

## Next Recommended Action
```

## OUTCOME.md

```md
# Outcome

Status: PASS | FAIL | BLOCKED | PARTIAL

Final Disposition: PR | PUSH_MAIN | KEEP_LOCAL | UNDECIDED

Execution Path:

Final Disposition Policy:

## Objective

## Work Completed

## Workers

## Verification Evidence

## Checks Run

## Checks Skipped

## Residual Risks

## Follow-Up
```
