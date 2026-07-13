# Workflow And Documentation Artifacts

`$workflow-docs` creates only the smallest useful artifact set.

Default location: create Markdown workflow artifacts under `<workspace>/.workflow/`. Use another directory only when the user names one, the project already has a clearer workflow-state convention, or the artifact is a final deliverable that belongs elsewhere.

In Git-backed codebases, `.workflow/` is local working state. Inspect existing ignore conventions first; when local mutation is authorized, ensure `.workflow/` is ignored before creating it. Otherwise keep state inline or use an already-ignored location. Do not commit workflow state unless the user explicitly makes it a deliverable.

## Workflow Control

- `.workflow/LEDGER.md`
- `.workflow/WORKFLOW.md`
- `.workflow/SOURCE-CORPUS.md`
- `.workflow/SPEC.md`
- `.workflow/WORK-UNITS.md`
- `.workflow/DOSSIER.md` human dossier index
- `.workflow/dossiers/*.yaml` canonical validated `DossierV1` machine contracts
- `.workflow/WORKER-MAP.md`
- `.workflow/ACCEPTANCE-MATRIX.md`
- `.workflow/VERIFICATION-REPORT.md`
- `.workflow/REPAIR-TICKETS.md`
- `.workflow/DECISIONS.md`
- `.workflow/HANDOFF.md`
- `.workflow/OUTCOME.md`
- `.workflow/GOAL-STATE.md`
- `.workflow/AGENT-BRIEF.md`
- `.workflow/PROTOTYPE-DECISION.md`
- `.workflow/ARCHITECTURE-RECOMMENDATIONS.md`

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

For `lean_work_unit_runner`, prefer one compact ledger over multiple workflow documents. Each executable row should carry `id`, `source_ref`, `slice_type`, `scope`, `done`, `check`, `status`, touched surfaces, evidence, and blockers. Product/integration rows also carry observable behavior, expected outcome, demo or verification, layers touched, and horizontal justification. Escalated units may link to strict-mode SPEC, dossier, or verification artifacts only when needed.

For product or integration implementation, `WORK-UNITS.md` and lean ledger rows should also carry `slice_type`, `observable_behavior`, `expected_outcome`, `demo_or_verification`, `layers_touched`, and `horizontal_slice_justification` where useful. Prefer `tracer_bullet` units for behavior work. Use horizontal slices only for prefactoring, migration safety, infrastructure, documentation, research, or risk-boundary work with a concrete justification.

For outcome-bearing verification, `ACCEPTANCE-MATRIX.md` and `VERIFICATION-REPORT.md` should include a verification environment, outcome evaluation rows, preferred and available verification capabilities, evidence strength, invalid PASS conditions, and any required external checks. Row-level `CONDITIONAL_PASS` means strongly inferred but not fully observable; it must not be treated as final green status without explicit waiver evidence.

For native thread or subagent delegation, `WORKER-MAP.md` records the native resource id, terminal report, and any lifecycle action/result actually supported by the transport. Do not invent a close operation; platform-managed completion may itself be terminal.

Machine dossiers distinguish a narrow display role from the canonical `implementer|verifier|repair|documenter` machine role and include `boundary_kind`, a non-empty authority list, and `authority_source` pointing to the granting user, policy, or artifact. Both legacy report-schema fields equal `WorkerReportV1`. A read-only Approver may recommend or report a designated authority's decision; persisting it requires a separately authorized documenter, and neither creates consequential authority.

Record `execution_path` as `autonomous_goal` or `human_in_loop`. In `OUTCOME.md`, name the exact final action and target actually performed; use `KEEP_LOCAL`, `NO_CHANGES`, `CANCELLED`, or `UNDECIDED` only when those are the actual disposition.
