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

## One-Pass Collapse Guard

Do not collapse a multi-phase roadmap, spec, or "source of truth" corpus into one broad implementation unit unless every material requirement can be completed and verified inside that unit. If the source contains phases, exit criteria, named integrations, scale targets, or different risk classes, split them into independently verifiable units.

Treat these as separate-unit signals:

- roadmap phases or milestones
- multiple external data sources, providers, services, or credentials
- live system integration plus local artifact fallback
- extraction/indexing/retrieval/evaluation/reporting layers with different evidence needs
- numeric targets such as corpus size, eval question count, latency budget, or coverage threshold
- implementation work that would otherwise be described as residual risk, future work, or next recommended action

If a supervisor provides a source-requirement coverage ledger, every `in_current_scope` material requirement must appear in at least one work unit's done criteria. Every `explicit_user_deferred`, `blocked_needs_decision`, or `out_of_scope_by_user` item must remain visible in `blocked_units` or a separate deferral list; do not hide it inside a unit note.

Create exactly one `WU-001` only when the task is genuinely tiny or the full current-scope ledger can be implemented, verified, and documented as one bounded unit without deferred material requirements.

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
    source_requirements_covered:
    verification:
    sequence:
parallel_groups:
blocked_units:
deferred_or_out_of_scope_requirements:
first_recommended_unit:
```

## Stop Gates

Stop when a unit cannot name a done criterion, required source, or boundary. Ask for a decision or return a smaller discovery unit.
