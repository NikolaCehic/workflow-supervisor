# Workflow Foundation Templates

Load this reference for overall workflow state, a lean ledger, source mapping, or a reviewable SPEC.

Create file-backed state under `<workspace>/.workflow/` only when useful and authorized. Inspect ignore conventions first; do not stage or publish workflow state unless the user makes it a deliverable.

## Contents

- [WORKFLOW.md](#workflowmd)
- [LEDGER.md](#ledgermd)
- [SOURCE-CORPUS.md](#source-corpusmd)
- [SPEC.md](#specmd)

## WORKFLOW.md

```md
# Workflow

## Objective

## Audience Or Consumer

## Current Status

## Execution Path

autonomous_goal | human_in_loop

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
Execution Path: autonomous_goal | human_in_loop
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

| ID | Source Ref | Slice Type | Scope | Observable Behavior | Expected Outcome | Demo Or Verification | Layers Touched | Horizontal Justification | Done Signal | Check | Status | Touched Surfaces | Evidence | Blocker Or Next Action |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

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
