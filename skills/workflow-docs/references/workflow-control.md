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

## Blocking Decision

| ID | Blocked Artifact | Question | Affected Requirements | Affected Work Units | Status | Answer Source |
|---|---|---|---|---|---|---|

## Resume Checkpoint

Last Completed Step:

Next Action:

Artifacts To Refresh:

Stale Artifacts Invalidated:

## Next Action
```

## LEDGER.md

Use this for `lean_work_unit_runner` when the backlog is already bounded and the workflow needs high throughput with human-verifiable state.

```md
# Lean Work Unit Ledger

Profile: lean_work_unit_runner
Execution Path:
Mode:
Delegation:
Final Disposition:
Batch Checkpoint:

## Scope Contract

Objective:
Controlling Backlog Or Source:
Allowed Surfaces:
Forbidden Surfaces:
Escalation Triggers:

## Units

| ID | Source Ref | Scope | Done Signal | Check | Status | Touched Surfaces | Evidence | Blocker Or Next Action |
|---|---|---|---|---|---|---|---|---|

## Batch Checkpoints

| Batch | Units | Result | Checks | Human Review Needed | Next Action |
|---|---|---|---|---|---|
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

## SPEC.md

```md
# SPEC

Status: Draft | Approved | Needs Revision | Blocked

## Objective

## Source Of Truth

| Source | Role | Notes |
|---|---|---|

## Interpreted Scope

## Non-Goals

## Requirement Coverage

| ID | Source Ref | Requirement | Proposed Disposition | Final Disposition | Decision Source | Work Unit | Acceptance Row |
|---|---|---|---|---|---|---|---|

## Deferred, Out-Of-Scope, Or Blocked Items

| ID | Requirement | Status | Reason | Needed Decision |
|---|---|---|---|---|

## Proposed Work Units

| Work Unit | Objective | Depends On | Verification |
|---|---|---|---|

## Acceptance Summary

## Assumptions And Risks

## Open Questions

| ID | Question | Asked By | Answer | Status |
|---|---|---|---|---|

## Q&A Log

| ID | Question | Answer | Spec Change Required | Status |
|---|---|---|---|---|

## Resume Checkpoint

Blocked At:

Required Human Decision:

Affected Requirement IDs:

Affected Work Units:

Next Action After Answer:

Artifacts To Refresh:

Stale Artifacts Invalidated:

## Human Verification

Reviewer:

Decision: Approved | Needs Revision | Blocked

Decision Source:

Notes:
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

| Worker Name | Role | Transport | Native Resource ID | Work Unit | Dossier | Start Condition | Dependencies | Status | Terminal Report | Close Action | Close Result |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Supervisor Checkpoints

## Blocked Workers

## Closed Workers

Closed means the terminal report has been consumed and any native thread or subagent resource has a recorded close result. For Codex subagents, record the `spawn_agent` id as Native Resource ID and `close_agent` as Close Action. A workflow with open native workers must remain BLOCKED until the close result is recorded.
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

## GOAL-STATE.md

```md
# Goal State

## Objective

## Goal Binding

created | reused | skipped | unavailable | conflict

## Goal Status

active | complete | blocked | blocked old | unknown

## Previous Blocked Goal

Goal Reference:

Reason:

Use As History Only: yes | no

## Last Tool Action

get_goal | create_goal | update_goal | none

## Next Allowed Goal Action

## Last Completed Step

## Current Work Unit

## Current Blocker

## Human Decision Needed

Question:

Smallest Sufficient Answer:

## Human Decision Answer

Answer:

Decision Type: clarification | scope change | requirement waiver | explicit deferral | blocker resolution | final disposition | intake change | workflow cancellation

## Resume Checkpoint

Next Action:

Artifacts To Refresh:

Stale Artifacts Invalidated:

## Completion Rule

## Blocked Rule
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
