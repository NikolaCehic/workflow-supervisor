# Workflow Control Templates

Use these for supervised workflow state. Do not use them for ordinary documentation drafting unless workflow state or handoff is required.

## WORKFLOW.md

```md
# Workflow

## Objective

## Audience Or Consumer

## Current Status

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

| ID | Title | Objective | Dependencies | Status | Verification |
|---|---|---|---|---|---|

## Sequencing

## Parallelization Notes

## Blocked Units
```

## DOSSIER.md

```md
# Dossier

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

## Report Schema

## Stop Gates

## Open Questions
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

## Objective

## Work Completed

## Verification Evidence

## Checks Run

## Checks Skipped

## Residual Risks

## Follow-Up
```
