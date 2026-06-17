---
name: acceptance-matrix
description: Convert requirements into formal, evidence-mapped acceptance criteria only for supervised, high-risk, ambiguous, resumable, or delegated workflows. Use when verification must map each requirement to evidence, adversarial cases, PASS/FAIL/BLOCKED states, review states, and residual risk. Do not use for ordinary code review, small scoped edits, routine test runs, trivial explicit acceptance, or declaring completion unless the user asks for an acceptance matrix or evidence-mapped verification.
---

# Acceptance Matrix

Use this skill to define what counts as done and what evidence proves it.

## Ownership Boundary

This skill owns evidence rows and supervisor verdict mapping. `$work-unit` may draft coarse done criteria, `$dossier-builder` may embed or reference rows, and `$workflow-docs` may preserve the matrix. Those skills should not reinterpret evidence or silently change verdicts.

## Matrix Rules

- Every requirement needs evidence.
- Evidence must name a source, command, artifact, UI state, test, inspection, or user decision.
- Acceptance rows must preserve the source requirement's strength: named systems, quantities, live/integration wording, exit criteria, and "must" language.
- A weaker proxy check is not equivalent evidence unless the user explicitly waives or narrows the original requirement.
- PASS requires all material rows to be satisfied or explicitly waived by the user.
- FAIL requires at least one material row with unmet evidence.
- BLOCKED applies when evidence cannot be obtained or sources conflict.
- Residual risks must not be hidden inside PASS.
- If residual risks, skipped checks, future work, or next recommended actions contain an unimplemented material source requirement, the matrix status is FAIL or BLOCKED, not PASS.

## Source Fidelity Rules

When a source-requirement coverage ledger exists, every `in_current_scope` material requirement needs at least one matrix row. Preserve exact source details that affect scope or verification, including:

- named integrations or providers
- corpus sizes, question counts, coverage thresholds, or latency/cost budgets
- "live" versus artifact-only behavior
- required data sources, credentials, services, or indexes
- roadmap phase exit criteria
- mandatory checks, screenshots, reports, or review states

Do not downgrade requirements while making them testable. Examples of invalid substitutions:

- live service load/query verification -> generated export file only
- required validation corpus size -> small starter fixture
- named provider support -> generic extension hook
- required analysis and report generation -> keyword metadata only
- provider-backed extraction or indexing -> deterministic placeholder logic

If a requirement cannot be verified in the current environment, mark it BLOCKED or require a user waiver. Do not convert it into an easier row.

## Row Shape

| ID | Source Ref | Requirement | Evidence Required | Verification Method | Adversarial Check | Status | Evidence |
|---|---|---|---|---|---|---|---|

Use statuses: Pending, PASS, FAIL, BLOCKED, Waived.

For documentation and review workflows, also record a domain-specific review state when useful: Needs Revision, Approved With Caveats, Ready To Publish, SME Review Needed, Legal Review Needed, Stale, or Deferred. Map it back to PASS/FAIL/BLOCKED for supervisor decisions.

## Adversarial Checks

Consider:

- malformed or missing input
- stale source or version mismatch
- unauthorized capability
- schema or contract drift
- unsupported kind or mode
- no-op implementation
- hardcoded fixture output
- hidden network or filesystem dependency
- ambiguous user approval
- skipped required check
- missing citation or unsupported claim
- document structure regression
- stakeholder requirement omitted
- source requirement weakened or omitted
- roadmap exit criteria demoted to future work
- material requirement hidden in residual risks
- artifact cannot be reused by a fresh agent or human

## Verification Report Shape

```yaml
status: PASS|FAIL|BLOCKED
verified_work_unit:
verified_worker:
matrix:
  - id:
    requirement:
    status:
    evidence:
    verification_method:
    finding:
findings:
residual_risks:
skipped_checks:
repair_recommendations:
reverify_required: true|false
```

Repair recommendations must link to the failed or blocked matrix row ID. Do not recommend repairs for requirements that were not in scope unless the verifier first records a separate scope gap.

After repairs, verification must rerun against the affected rows and any regression rows. The supervisor may mark the workflow green only when material rows are PASS or explicitly waived with evidence.

## Rubber-Stamp Guard

Reject verification that says only "looks good", "tests pass", or "implemented" without row-by-row evidence. Ask for exact evidence or mark BLOCKED.
