# Workflow And Documentation Artifacts

`$workflow-docs` creates only the smallest useful artifact set.

Default location: create Markdown workflow artifacts under `<workspace>/.workflow/`. Use another directory only when the user names one, the project already has a clearer workflow-state convention, or the artifact is a final deliverable that belongs elsewhere.

In Git-backed codebases, `.workflow/` is local working state. Ensure `<workspace>/.gitignore` contains `.workflow/` before creating artifacts there, and do not commit that directory unless the user explicitly makes workflow state a deliverable.

## Workflow Control

- `.workflow/LEDGER.md`
- `.workflow/WORKFLOW.md`
- `.workflow/SOURCE-CORPUS.md`
- `.workflow/WORK-UNITS.md`
- `.workflow/DOSSIER.md`
- `.workflow/WORKER-MAP.md`
- `.workflow/ACCEPTANCE-MATRIX.md`
- `.workflow/VERIFICATION-REPORT.md`
- `.workflow/REPAIR-TICKETS.md`
- `.workflow/DECISIONS.md`
- `.workflow/HANDOFF.md`
- `.workflow/OUTCOME.md`
- `.workflow/GOAL-STATE.md`

## Documentation Production

- `.workflow/DOCUMENTATION-BRIEF.md`
- `.workflow/CONTENT-INVENTORY.md`
- `.workflow/OUTLINE.md`
- `.workflow/CONTENT-DRAFT.md`
- `.workflow/CLAIMS-REGISTER.md`
- `.workflow/STYLE-GUIDE.md`
- `.workflow/GLOSSARY.md`
- `.workflow/ASSET-REGISTER.md`
- `.workflow/REVIEW-PLAN.md`
- `.workflow/REVISION-QUEUE.md`
- `.workflow/PUBLISHING-CHECKLIST.md`
- `.workflow/PUBLICATION-LOG.md`
- `.workflow/MAINTENANCE-PLAN.md`

## State Medium

Markdown is the default, but state may also be an inline brief, spreadsheet tab, ticket set, design annotation, CRM note, runbook, decision log, slide appendix, whiteboard note, or chat continuation note.

For `lean_work_unit_runner`, prefer one compact ledger over multiple workflow documents. Each executable row should carry `id`, `source_ref`, `scope`, `done`, `check`, `status`, touched surfaces, and blockers. Escalated units may link to strict-mode SPEC, dossier, or verification artifacts only when needed.

For product or integration implementation, `WORK-UNITS.md` and lean ledger rows should also carry `slice_type`, `observable_behavior`, `demo_or_verification`, `layers_touched`, and `horizontal_slice_justification` where useful. Prefer `tracer_bullet` units for behavior work. Use horizontal slices only for prefactoring, migration safety, infrastructure, documentation, research, or risk-boundary work with a concrete justification.

For native thread or subagent delegation, `WORKER-MAP.md` must record the native resource id, terminal report, close action, and close result. Do not mark a native worker closed until the resource close is recorded.
