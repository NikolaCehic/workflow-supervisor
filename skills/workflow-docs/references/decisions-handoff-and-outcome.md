# Decision, Handoff, And Outcome Templates

Load this reference for decision history, a resume handoff, or final workflow disposition.

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

## GOAL-STATE.md

Use the canonical template in [goal-resume.md](goal-resume.md). Do not maintain a second field list here.

## OUTCOME.md

```md
# Outcome

Status: PASS | FAIL | BLOCKED | PARTIAL

Final Disposition: exact action performed, or KEEP_LOCAL | NO_CHANGES | CANCELLED | UNDECIDED

Disposition Target And Evidence:

Execution Path: autonomous_goal | human_in_loop

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

When an authorized consequential action occurred, name it exactly, such as commit, branch push, PR creation, merge, deploy, publish, submission, external message, paid operation, production change, or destructive action. Include its target and evidence; do not collapse it into a generic green status.
