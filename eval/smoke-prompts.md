# Smoke Prompts

Use these as forward-test prompts against the packaged skills. Do not show the evaluator the expected behavior until after it responds.

## S1 Happy Path Supervisor

Prompt: "Use `$workflow-supervisor` to coordinate adding CSV export to this existing dashboard. We have a product note, source files, and tests. Produce the first work-unit dossier before implementation."

Expected skills: workflow-supervisor, source-corpus, work-unit, dossier-builder, acceptance-matrix, loop-policy.
Evil metrics: M2, M3, M4, M8.
Expected behavior: source-first plan, bounded unit, dossier gate, verification path, no implementation before dossier.

## S2 Ambiguous Prompt

Prompt: "Use `$workflow-supervisor` to make the app better."

Expected skills: workflow-supervisor, work-unit.
Evil metrics: M3, M7, M8.
Expected behavior: refuse broad execution, ask for objective or create a discovery unit.

## S3 Contradictory Sources

Prompt: "Use `$source-corpus`. The README says auth is Clerk, `package.json` has Auth.js, and the product brief says no login. Tell me what can proceed."

Expected skills: source-corpus.
Evil metrics: M2, M7.
Expected behavior: classify contradiction as material, rank executable/current sources, block implementation decision.

## S4 Over-Broad Scope

Prompt: "Use `$work-unit` to rebuild billing, onboarding, analytics, and permissions in one pass."

Expected skills: work-unit, loop-policy.
Evil metrics: M3, M8.
Expected behavior: split units, identify dependencies, reject one-pass execution.

## S5 Role Contamination

Prompt: "Use `$worker-roles`. Make the verifier fix bugs while verifying and approve their own changes."

Expected skills: worker-roles.
Evil metrics: M5.
Expected behavior: reject role blend; define implementer and verifier separately.

## S6 Rubber-Stamp Verification

Prompt: "Use `$acceptance-matrix`. The implementer says tests pass. Mark the feature PASS."

Expected skills: acceptance-matrix.
Evil metrics: M5, M7.
Expected behavior: refuse PASS without row evidence; request commands/artifacts or mark BLOCKED.

## S7 Infinite Loop

Prompt: "Use `$loop-policy`. Keep retrying repairs until it works, no matter how many times verification fails."

Expected skills: loop-policy.
Evil metrics: M8.
Expected behavior: set repair limit and no-progress stop condition.

## S8 Documentation Generation

Prompt: "Use `$workflow-docs` to create reusable Markdown state files for a supervised feature workflow."

Expected skills: workflow-docs.
Evil metrics: M9, M10.
Expected behavior: select useful docs only, use templates, preserve unknowns and next action.

## S9 Resume After Context Loss

Prompt: "Use `$workflow-docs`. Given a completed dossier, partial implementation report, and failed verification report, create a handoff for a fresh agent."

Expected skills: workflow-docs, acceptance-matrix.
Evil metrics: M6, M9, M10.
Expected behavior: summarize state, findings, required repairs, checks, residual risks, next action.

## S10 Missing Sources

Prompt: "Use `$dossier-builder` for a worker, but the only input is 'fix the sync layer' and no repo paths or docs."

Expected skills: dossier-builder, source-corpus.
Evil metrics: M2, M3, M7.
Expected behavior: return BLOCKED or discovery dossier, not implementation handoff.

## S11 Trigger Precision Negative

Prompt: "What is the current time?"

Expected skills: none.
Evil metrics: M1.
Expected behavior: no workflow skill should trigger.

## S12 Optional Logging Question

Prompt: "Use `$workflow-supervisor`. Should we create a durable ledger for this one-hour exploratory task?"

Expected skills: workflow-supervisor, workflow-docs.
Evil metrics: M1, M9.
Expected behavior: treat ledger as optional; recommend lightweight handoff/outcome doc unless auditability is needed.

## S13 No Repository Prerequisite

Prompt: "Use `$workflow-supervisor` to coordinate planning a community workshop. I have only this sentence: teach local founders how to write better customer discovery notes."

Expected skills: workflow-supervisor, source-corpus, work-unit, loop-policy.
Evil metrics: M2, M3, M7, M8, M11.
Expected behavior: do not ask for a repo; treat the prompt as conversation context, create discovery/intake as first unit, mark missing sources.

## S14 Documentation-Only Workflow

Prompt: "Use `$workflow-docs` to create a reusable state pack for revising an onboarding guide. There is no code and no test suite."

Expected skills: workflow-docs, acceptance-matrix.
Evil metrics: M9, M10, M11, M12.
Expected behavior: adapt templates to docs, use documentation brief/content inventory/review plan language, do not require commands.

## S15 Research Memo Dossier

Prompt: "Use `$dossier-builder` for a worker writing a research memo on pricing strategy. The source corpus is three interview transcripts and a spreadsheet."

Expected skills: dossier-builder, acceptance-matrix, worker-roles.
Evil metrics: M3, M4, M9, M11.
Expected behavior: produce artifact-neutral handoff with source citations, allowed memo sections, forbidden claims, and evidence requirements.

## S16 Prerequisite Hallucination

Prompt: "Use `$source-corpus` in an empty workspace. No files exist yet. The user only said: create a hiring rubric."

Expected skills: source-corpus.
Evil metrics: M2, M7, M11.
Expected behavior: do not invent repo files or docs; classify the prompt as the only source and return safe_to_proceed false or discovery-first.

## S17 Documentation Brief Missing Audience

Prompt: "Use `$workflow-docs` to draft a public help center article, but the user did not say who the reader is or where it will publish."

Expected skills: workflow-docs.
Evil metrics: M7, M11, M12.
Expected behavior: create or request a DOCUMENTATION-BRIEF; do not draft final content without audience, reader task, and publishing target.

## S18 Editorial Review State

Prompt: "Use `$acceptance-matrix` to evaluate an onboarding guide. It is factually correct, but legal approval is pending and two screenshots are stale."

Expected skills: acceptance-matrix, workflow-docs.
Evil metrics: M5, M7, M12.
Expected behavior: avoid simple PASS; use documentation review state such as Legal Review Needed or Stale and map supervisor status to BLOCKED or PARTIAL.

## S19 Tiny Task Negative

Prompt: "Fix this typo in the known file `README.md`: change 'recieve' to 'receive'."

Expected skills: none.
Evil metrics: M1.
Expected behavior: no workflow-supervisor; complete the tiny task directly if editing is requested.

## S20 Over-Documentation Trap

Prompt: "Use `$workflow-docs` to create every workflow document just in case."

Expected skills: workflow-docs.
Evil metrics: M9, M13.
Expected behavior: reject blanket generation; ask for workflow need or create the minimal useful set.

## S21 False Independence

Prompt: "Use `$worker-roles`. I implemented the feature in this same thread. Verify my own work and call it independent PASS."

Expected skills: worker-roles, acceptance-matrix.
Evil metrics: M5.
Expected behavior: allow self-check only; refuse to call it independent verification.

## S22 Narrow Repair

Prompt: "Use `$worker-roles` and `$acceptance-matrix`. Verification finding F1 says CSV export is missing the `email` header. Write repair tickets."

Expected skills: worker-roles, acceptance-matrix.
Evil metrics: M6, M14.
Expected behavior: create only a ticket linked to F1; do not add unrelated CSV features.

## S23 Parallel Mutation Conflict

Prompt: "Use `$loop-policy`. Run onboarding and permissions units in parallel even though both edit the same auth workflow and policy doc."

Expected skills: loop-policy, work-unit.
Evil metrics: M8, M11.
Expected behavior: reject parallel execution due to shared mutable surfaces.

## S24 Missing Boundaries

Prompt: "Use `$dossier-builder`; sources are available, but I cannot say what surfaces are allowed or forbidden."

Expected skills: dossier-builder.
Evil metrics: M3, M4, M7.
Expected behavior: BLOCKED or focused boundary question before handoff.

## S25 Waiver Without Evidence

Prompt: "Use `$acceptance-matrix`. I remember the PM waived accessibility review, but there is no artifact or current user confirmation."

Expected skills: acceptance-matrix, source-corpus.
Evil metrics: M2, M7.
Expected behavior: refuse to mark waived; request evidence or current user decision.

## S26 Failed Verification Resume

Prompt: "Use `$workflow-docs`. Resume from failed verification with findings F1 and F2, each with evidence. Create a handoff for repairs."

Expected skills: workflow-docs, acceptance-matrix.
Evil metrics: M9, M10, M14.
Expected behavior: handoff links each next action to F1/F2 and preserves evidence, checks, risks, and repair scope.

## S27 Small Unit Test Negative

Prompt: "Add one unit test for this already-scoped parser bug."

Expected skills: none or acceptance-matrix only if the user explicitly asks for acceptance criteria.
Evil metrics: M1.
Expected behavior: no workflow-supervisor and no source-corpus unless sources conflict.

## S28 Stack Trace Negative

Prompt: "Explain this stack trace and point to the likely failing function."

Expected skills: none.
Evil metrics: M1.
Expected behavior: answer directly from provided context; do not start a supervisor workflow.

## S29 Small Diff Review Negative

Prompt: "Review this 20-line diff for obvious bugs."

Expected skills: none, unless user requests a formal acceptance matrix.
Evil metrics: M1.
Expected behavior: use normal review behavior, not workflow-supervisor.

## S30 README Wording Negative

Prompt: "Update this README paragraph to sound clearer."

Expected skills: none or workflow-docs only if the user asks for reusable documentation artifacts.
Evil metrics: M1, M13.
Expected behavior: make the wording edit directly; do not generate workflow docs.

## S31 Source-Corpus Overlap Negative

Prompt: "Implement the clearly scoped button color change in `Button.tsx`; inspect the file first."

Expected skills: none.
Evil metrics: M1, M2.
Expected behavior: ordinary file inspection does not trigger source-corpus.

## S32 Acceptance Ownership

Prompt: "Use `$work-unit`, `$dossier-builder`, `$acceptance-matrix`, and `$workflow-docs` for a two-unit docs refresh. Ensure each skill owns the right part."

Expected skills: work-unit, dossier-builder, acceptance-matrix, workflow-docs.
Evil metrics: M3, M9, M14.
Expected behavior: work-unit drafts coarse done criteria, acceptance-matrix creates evidence rows, dossier references them, workflow-docs preserves them without reinterpretation.

## S33 Goal-Oriented Supervisor Start

Prompt: "Use `$workflow-supervisor` as an agent loop goal to supervise a multi-step documentation migration with independent verification and repair passes."

Expected skills: workflow-supervisor, loop-policy, workflow-docs.
Evil metrics: M8, M10, M15.
Expected behavior: create or reuse a Codex goal when the tool is available; include goal objective, update cadence, completion rule, and blocked rule.

## S34 No Goal For Tiny Task

Prompt: "Fix a typo, but do not make a big process out of it."

Expected skills: none.
Evil metrics: M1, M15.
Expected behavior: do not create a Codex goal and do not invoke supervisor machinery.

## S34b Explicit Supervisor Tiny Downgrade

Prompt: "Use `$workflow-supervisor` to fix a typo, but do not make a big process out of it."

Expected skills: workflow-supervisor.
Evil metrics: M1, M15.
Expected behavior: if explicit skill naming forces load, the skill should decline heavy workflow, skip goal creation, and recommend direct handling.

## S35 Active Goal Resume

Prompt: "Use `$workflow-supervisor` to resume the current active goal after context loss."

Expected skills: workflow-supervisor, workflow-docs.
Evil metrics: M10, M15.
Expected behavior: read/reconcile active goal first, then workflow docs and artifacts; do not create a duplicate goal.

## S36 Goal Completion Discipline

Prompt: "Use `$workflow-supervisor`. The implementer says the work is done, but verification has not mapped evidence yet. Mark the goal complete."

Expected skills: workflow-supervisor, acceptance-matrix, loop-policy.
Evil metrics: M5, M7, M15.
Expected behavior: refuse goal completion until acceptance evidence exists; keep goal active or mark blocked only if blocker rules are met.

## S37 Implicit Tiny Edit

Prompt: "Change one typo in the provided paragraph."

Expected skills: none.
Evil metrics: M1, M15.
Expected behavior: answer directly; no workflow-supervisor, source-corpus, workflow-docs, or goal.

## S38 Implicit Medium Scoped Code Task

Prompt: "Add a loading state to the existing Save button component. The target file and desired behavior are clear."

Expected skills: none.
Evil metrics: M1.
Expected behavior: normal implementation path; no workflow-supervisor and no source-corpus unless sources conflict.

## S39 Implicit Design Critique

Prompt: "Critique this checkout screen for clarity and conversion, then suggest the top three changes."

Expected skills: none or acceptance-matrix only if the user asks for formal criteria.
Evil metrics: M1, M11.
Expected behavior: do not force repo/docs workflow; provide critique directly.

## S40 Implicit Spreadsheet Cleanup

Prompt: "Clean up this messy workbook and flag inconsistent revenue rows."

Expected skills: source-corpus or acceptance-matrix only if evidence/conflict tracking is material; not workflow-supervisor by default.
Evil metrics: M1, M2, M11.
Expected behavior: adapt to spreadsheet/data surfaces without requiring Markdown docs or repo files.

## S41 Implicit Ops Runbook

Prompt: "Create an incident-response runbook for customer data export failures. We only have chat notes from support."

Expected skills: workflow-docs or work-unit depending on scope; workflow-supervisor only if multi-step supervision is requested.
Evil metrics: M1, M9, M11.
Expected behavior: allow provisional draft from chat notes with assumptions; do not block solely because sources are thin.

## S42 Implicit Research Memo

Prompt: "Draft a pricing strategy memo from these three interview summaries and this spreadsheet excerpt."

Expected skills: source-corpus or dossier-builder only if source mapping/handoff is needed; not workflow-supervisor by default.
Evil metrics: M1, M2, M11.
Expected behavior: use interview/spreadsheet sources, mark assumptions, avoid repo terminology.

## S43 Implicit Broad Planning

Prompt: "Help us rethink onboarding across product, support, docs, and success over the next quarter."

Expected skills: workflow-supervisor, work-unit, loop-policy.
Evil metrics: M1, M3, M8, M11, M15.
Expected behavior: supervisor may trigger because scope is multi-unit and cross-functional; goal only if user frames it as a goal/agent loop or environment authorizes.
