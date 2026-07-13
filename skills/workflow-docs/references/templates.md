# Workflow Docs Template Index

Load only the lane needed for the task.

Create Markdown artifacts under `<workspace>/.workflow/` by default. Use another directory only when the user names one, the project already has a clearer workflow-state convention, or the artifact is a final deliverable that belongs elsewhere.

In Git-backed codebases, inspect ignore conventions first. When local mutation is authorized, ensure `.workflow/` is ignored before creating local state; otherwise keep state inline or use an already-ignored location. Do not stage or publish workflow state unless explicitly selected as a final deliverable.

## Documentation Production

Read [documentation-production.md](documentation-production.md) when creating or revising documentation deliverables, briefs, outlines, factual source registers, review plans, publication assets, or maintenance plans.

Includes:

- `DOCUMENTATION-BRIEF.md`
- `CONTENT-INVENTORY.md`
- `OUTLINE.md`
- `CONTENT-DRAFT.md`
- `CLAIMS-REGISTER.md`
- `STYLE-GUIDE.md`
- `GLOSSARY.md`
- `ASSET-REGISTER.md`
- `REVIEW-PLAN.md`
- `REVISION-QUEUE.md`
- `PUBLISHING-CHECKLIST.md`
- `PUBLICATION-LOG.md`
- `MAINTENANCE-PLAN.md`

## Workflow Control

Load only the focused control reference needed:

- [workflow-foundations.md](workflow-foundations.md) for workflow state, lean ledger, source map, or SPEC.
- [work-units-and-delegation.md](work-units-and-delegation.md) for work units, dossier state, or workers.
- [verification-and-repair.md](verification-and-repair.md) for acceptance, verification, or repairs.
- [decisions-handoff-and-outcome.md](decisions-handoff-and-outcome.md) for decisions, handoff, goal pointer, or outcome.

Includes:

- `WORKFLOW.md`
- `LEDGER.md`
- `SOURCE-CORPUS.md`
- `SPEC.md`
- `WORK-UNITS.md`
- `DOSSIER.md` human index and `.workflow/dossiers/*.yaml` machine contracts
- `WORKER-MAP.md`
- `ACCEPTANCE-MATRIX.md`
- `VERIFICATION-REPORT.md`
- `REPAIR-TICKETS.md`
- `DECISIONS.md`
- `HANDOFF.md`
- `GOAL-STATE.md`
- `OUTCOME.md`

## Goal And Resume

Read [goal-resume.md](goal-resume.md) when mirroring Codex goal state, resolving active-goal conflicts, or creating resume packs.

Includes:

- `GOAL-STATE.md`
- goal-aware `WORKFLOW.md` fields
- goal-aware `OUTCOME.md` fields

## Planning Outputs

Read [planning-outputs.md](planning-outputs.md) for ready-for-agent briefs, prototype decisions, or architecture recommendations.

Includes:

- `AGENT-BRIEF.md`
- `PROTOTYPE-DECISION.md`
- `ARCHITECTURE-RECOMMENDATIONS.md`
