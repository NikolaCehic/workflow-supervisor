# Strict Workflow

Use this reference only for `strict_full_workflow`.

## Required Invariants

Strict mode requires:

1. A ranked controlling source set and material gaps.
2. A source-requirement coverage ledger.
3. A concise SPEC review packet when interpretation needs human confirmation.
4. Bounded units that preserve every current-scope material requirement.
5. Acceptance rows with expected outcomes and evidence requirements.
6. Explicit authority before consequential external actions.
7. On-demand worker contracts for roles actually used.
8. Independent verification when risk or the user requires it and a worker is available.

Do not require a repository, Markdown files, a goal, or automated workers when the task does not need them.

## Coverage Ledger

For each material requirement record:

```yaml
id:
source_ref:
requirement:
disposition: in_current_scope | explicit_user_deferred | blocked_needs_decision | out_of_scope_by_user | non_material_context
work_unit:
acceptance_row:
decision_or_waiver_evidence:
```

Preserve named systems, quantities, “live” semantics, exit criteria, and mandatory evidence. Do not hide unimplemented requirements in residual risks, skipped checks, future work, or recommendations.

## SPEC Review

Create an inline or durable SPEC only when interpretation benefits from review. Include objective, non-goals, controlling sources, interpreted scope, coverage summary, proposed units, acceptance summary, assumptions, risks, questions, and decision state.

With `execution_path: human_in_loop`, pause at each named material interpretation checkpoint. With `execution_path: autonomous_goal`, continue when sources resolve interpretation and no higher-priority approval is required. Never fabricate approval; a worker recommendation is not authorization.

## Role Selection

- Researcher: source authority or contradiction work is substantial.
- Implementer/executor: mutation or production is required.
- Verifier: acceptance needs independent evidence.
- Repair: only after an actionable FAIL/BLOCKED finding.
- Documenter: only when durable state or a requested deliverable needs updating.

A read-only audit does not need an implementer. A successful first pass does not need a repair worker. Small durable updates can remain a supervisor responsibility unless independence is material.

## Closeout

Audit every current-scope requirement and outcome row. Final PASS requires material PASS rows or explicit waivers from the user or a controlling source with demonstrated waiver authority. Report blocked and deferred requirements visibly. Apply only the external disposition the user explicitly authorized.
