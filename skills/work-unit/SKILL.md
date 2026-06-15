---
name: work-unit
description: Decompose fuzzy or broad objectives into bounded, sequenced, verifiable work units. Use when a task is too large, ambiguous, multi-phase, dependency-heavy, or risky to execute as one edit; when a supervisor needs packets, milestones, slices, tickets, or agent delegation; or when scope must be narrowed before implementation. Do not use for already-small tasks with clear files and acceptance.
---

# Work Unit

Use this skill to make work small enough that another agent can complete and verify it without guessing.

## Boundary Types

Work units can be bounded by code package, document section, source set, stakeholder decision, research question, design screen, workflow step, data slice, risk class, or output artifact. Do not force repository terminology onto non-code work.

## Unit Quality Bar

A good work unit has:

- one objective
- a stable unit ID suitable for dossier and worker naming
- named dependencies
- explicit in-scope and out-of-scope surfaces
- known sources or source gaps
- readiness criteria
- done criteria
- verification strategy
- estimated sequencing position
- a stop condition

Reject units that are just themes, vague phases, or lists of unrelated work.

Work-unit drafts coarse done criteria only. Use `$acceptance-matrix` when those criteria need evidence rows, PASS/FAIL/BLOCKED mapping, or adversarial verification.

## Decomposition Process

1. Restate the parent objective.
2. Identify natural boundaries: user workflow, package, document, API contract, risk class, or dependency layer.
3. Split into units that can be verified independently.
4. Mark dependencies and ordering constraints.
5. Mark which units can run in parallel only when they do not mutate the same surfaces.
6. Define readiness and done criteria for each unit.
7. If sources are absent, create a discovery/intake unit before production work.
8. Identify the first unit that is safe to dossier.

For over-broad one-pass requests, produce a sequencing recommendation and invoke or mirror `$loop-policy` fields for mode, parallel safety, approval gates, and repair limits.

## Output Shape

```yaml
parent_objective:
units:
  - id:
    worker_slug:
    title:
    objective:
    in_scope:
    out_of_scope:
    dependencies:
    sources_needed:
    allowed_surfaces:
    forbidden_surfaces:
    readiness:
    done_criteria:
    verification:
    sequence:
parallel_groups:
blocked_units:
first_recommended_unit:
```

## Stop Gates

Stop when a unit cannot name a done criterion, required source, or boundary. Ask for a decision or return a smaller discovery unit.
