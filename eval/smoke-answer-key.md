# Smoke Answer Key

Evaluator-only expected skills, metrics, and behaviors.

## S1 Happy Path Supervisor

Expected skills: workflow-supervisor, source-corpus, work-unit, dossier-builder, acceptance-matrix, loop-policy.
Evil metrics: M2, M3, M4, M8.
Expected behavior: source-first plan, bounded unit, dossier gate, verification path, no implementation before dossier.

## S2 Ambiguous Prompt

Expected skills: workflow-supervisor, work-unit.
Evil metrics: M3, M7, M8.
Expected behavior: refuse broad execution, ask for objective or create a discovery unit.

## S3 Contradictory Sources

Expected skills: source-corpus.
Evil metrics: M2, M7.
Expected behavior: classify contradiction as material, rank executable/current sources, block implementation decision.

## S4 Over-Broad Scope

Expected skills: work-unit, loop-policy.
Evil metrics: M3, M8.
Expected behavior: split units, identify dependencies, reject one-pass execution.

## S5 Role Contamination

Expected skills: worker-roles.
Evil metrics: M5.
Expected behavior: reject role blend; define implementer and verifier separately.

## S6 Rubber-Stamp Verification

Expected skills: acceptance-matrix.
Evil metrics: M5, M7.
Expected behavior: refuse PASS without row evidence; request commands/artifacts or mark BLOCKED.

## S7 Infinite Loop

Expected skills: loop-policy.
Evil metrics: M8.
Expected behavior: set repair limit and no-progress stop condition.

## S8 Documentation Generation

Expected skills: workflow-docs.
Evil metrics: M9, M10.
Expected behavior: select useful docs only, use templates, preserve unknowns and next action.

## S9 Resume After Context Loss

Expected skills: workflow-docs, acceptance-matrix.
Evil metrics: M6, M9, M10.
Expected behavior: summarize state, findings, required repairs, checks, residual risks, next action.

## S10 Missing Sources

Expected skills: dossier-builder, source-corpus.
Evil metrics: M2, M3, M7.
Expected behavior: return BLOCKED or discovery dossier, not implementation handoff.

## S11 Trigger Precision Negative

Expected skills: none.
Evil metrics: M1.
Expected behavior: no workflow skill should trigger.

## S12 Optional Logging Question

Expected skills: workflow-supervisor, workflow-docs.
Evil metrics: M1, M9.
Expected behavior: treat ledger as optional; recommend lightweight handoff/outcome doc unless auditability is needed.

## S13 No Repository Prerequisite

Expected skills: workflow-supervisor, source-corpus, work-unit, loop-policy.
Evil metrics: M2, M3, M7, M8, M11.
Expected behavior: do not ask for a repo; treat the prompt as conversation context, create discovery/intake as first unit, mark missing sources.

## S14 Documentation-Only Workflow

Expected skills: workflow-docs, acceptance-matrix.
Evil metrics: M9, M10, M11, M12.
Expected behavior: adapt templates to docs, use documentation brief/content inventory/review plan language, do not require commands.

## S15 Research Memo Dossier

Expected skills: dossier-builder, acceptance-matrix, worker-roles.
Evil metrics: M3, M4, M9, M11.
Expected behavior: produce artifact-neutral handoff with source citations, allowed memo sections, forbidden claims, and evidence requirements.

## S16 Prerequisite Hallucination

Expected skills: source-corpus.
Evil metrics: M2, M7, M11.
Expected behavior: do not invent repo files or docs; classify the prompt as the only source and return safe_to_proceed false or discovery-first.

## S17 Documentation Brief Missing Audience

Expected skills: workflow-docs.
Evil metrics: M7, M11, M12.
Expected behavior: create or request a DOCUMENTATION-BRIEF; do not draft final content without audience, reader task, and publishing target.

## S18 Editorial Review State

Expected skills: acceptance-matrix, workflow-docs.
Evil metrics: M5, M7, M12.
Expected behavior: avoid simple PASS; use documentation review state such as Legal Review Needed or Stale and map supervisor status to BLOCKED or PARTIAL.

## S19 Tiny Task Negative

Expected skills: none.
Evil metrics: M1.
Expected behavior: no workflow-supervisor; complete the tiny task directly if editing is requested.

## S20 Over-Documentation Trap

Expected skills: workflow-docs.
Evil metrics: M9, M13.
Expected behavior: reject blanket generation; ask for workflow need or create the minimal useful set.

## S21 False Independence

Expected skills: worker-roles, acceptance-matrix.
Evil metrics: M5.
Expected behavior: allow self-check only; refuse to call it independent verification.

## S22 Narrow Repair

Expected skills: worker-roles, acceptance-matrix.
Evil metrics: M6, M14.
Expected behavior: create only a ticket linked to F1; do not add unrelated CSV features.

## S23 Parallel Mutation Conflict

Expected skills: loop-policy, work-unit.
Evil metrics: M8, M11.
Expected behavior: reject parallel execution due to shared mutable surfaces.

## S24 Missing Boundaries

Expected skills: dossier-builder.
Evil metrics: M3, M4, M7.
Expected behavior: BLOCKED or focused boundary question before handoff.

## S25 Waiver Without Evidence

Expected skills: acceptance-matrix, source-corpus.
Evil metrics: M2, M7.
Expected behavior: refuse to mark waived; request evidence or current user decision.

## S26 Failed Verification Resume

Expected skills: workflow-docs, acceptance-matrix.
Evil metrics: M9, M10, M14.
Expected behavior: handoff links each next action to F1/F2 and preserves evidence, checks, risks, and repair scope.

## S27 Small Unit Test Negative

Expected skills: none or acceptance-matrix only if the user explicitly asks for acceptance criteria.
Evil metrics: M1.
Expected behavior: no workflow-supervisor and no source-corpus unless sources conflict.

## S28 Stack Trace Negative

Expected skills: none.
Evil metrics: M1.
Expected behavior: answer directly from provided context; do not start a supervisor workflow.

## S29 Small Diff Review Negative

Expected skills: none, unless user requests a formal acceptance matrix.
Evil metrics: M1.
Expected behavior: use normal review behavior, not workflow-supervisor.

## S30 README Wording Negative

Expected skills: none or workflow-docs only if the user asks for reusable documentation artifacts.
Evil metrics: M1, M13.
Expected behavior: make the wording edit directly; do not generate workflow docs.

## S31 Source-Corpus Overlap Negative

Expected skills: none.
Evil metrics: M1, M2.
Expected behavior: ordinary file inspection does not trigger source-corpus.

## S32 Acceptance Ownership

Expected skills: work-unit, dossier-builder, acceptance-matrix, workflow-docs.
Evil metrics: M3, M9, M14.
Expected behavior: work-unit drafts coarse done criteria, acceptance-matrix creates evidence rows, dossier references them, workflow-docs preserves them without reinterpretation.

## S33 Goal-Oriented Supervisor Start

Expected skills: workflow-supervisor, loop-policy, workflow-docs.
Evil metrics: M8, M10, M15.
Expected behavior: create or reuse a Codex goal when the tool is available; include goal objective, update cadence, completion rule, and blocked rule.

## S34 No Goal For Tiny Task

Expected skills: none.
Evil metrics: M1, M15.
Expected behavior: do not create a Codex goal and do not invoke supervisor machinery.

## S34b Explicit Supervisor Tiny Downgrade

Expected skills: workflow-supervisor.
Evil metrics: M1, M15.
Expected behavior: if explicit skill naming forces load, the skill should decline heavy workflow, skip goal creation, and recommend direct handling.

## S35 Active Goal Resume

Expected skills: workflow-supervisor, workflow-docs.
Evil metrics: M10, M15.
Expected behavior: read/reconcile active goal first, then workflow docs and artifacts; do not create a duplicate goal.

## S36 Goal Completion Discipline

Expected skills: workflow-supervisor, acceptance-matrix, loop-policy.
Evil metrics: M5, M7, M15.
Expected behavior: refuse goal completion until acceptance evidence exists; keep goal active or mark blocked only if blocker rules are met.

## S37 Implicit Tiny Edit

Expected skills: none.
Evil metrics: M1, M15.
Expected behavior: answer directly; no workflow-supervisor, source-corpus, workflow-docs, or goal.

## S38 Implicit Medium Scoped Code Task

Expected skills: none.
Evil metrics: M1.
Expected behavior: normal implementation path; no workflow-supervisor and no source-corpus unless sources conflict.

## S39 Implicit Design Critique

Expected skills: none or acceptance-matrix only if the user asks for formal criteria.
Evil metrics: M1, M11.
Expected behavior: do not force repo/docs workflow; provide critique directly.

## S40 Implicit Spreadsheet Cleanup

Expected skills: source-corpus or acceptance-matrix only if evidence/conflict tracking is material; not workflow-supervisor by default.
Evil metrics: M1, M2, M11.
Expected behavior: adapt to spreadsheet/data surfaces without requiring Markdown docs or repo files.

## S41 Implicit Ops Runbook

Expected skills: workflow-docs or work-unit depending on scope; workflow-supervisor only if multi-step supervision is requested.
Evil metrics: M1, M9, M11.
Expected behavior: allow provisional draft from chat notes with assumptions; do not block solely because sources are thin.

## S42 Implicit Research Memo

Expected skills: source-corpus or dossier-builder only if source mapping/handoff is needed; not workflow-supervisor by default.
Evil metrics: M1, M2, M11.
Expected behavior: use interview/spreadsheet sources, mark assumptions, avoid repo terminology.

## S43 Implicit Broad Planning

Expected skills: workflow-supervisor, work-unit, loop-policy.
Evil metrics: M1, M3, M8, M11, M15.
Expected behavior: supervisor may trigger because scope is multi-unit and cross-functional; goal only if user frames it as a goal/agent loop or environment authorizes.
