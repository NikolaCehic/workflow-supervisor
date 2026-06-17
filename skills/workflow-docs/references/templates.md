# Workflow Docs Template Index

Load only the lane needed for the task.

Create Markdown artifacts under `<workspace>/.workflow/` by default. Use another directory only when the user names one, the project already has a clearer workflow-state convention, or the artifact is a final deliverable that belongs elsewhere.

In Git-backed codebases, ensure `<workspace>/.gitignore` contains `.workflow/` before creating the directory. Workflow state is local working memory and should not be staged or published unless explicitly selected as a final deliverable.

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

Read [workflow-control.md](workflow-control.md) when preserving supervised workflow state, work units, dossiers, acceptance matrices, verification reports, repairs, decisions, delegation state, or outcomes.

Includes:

- `WORKFLOW.md`
- `SOURCE-CORPUS.md`
- `SPEC.md`
- `WORK-UNITS.md`
- `DOSSIER.md`
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
