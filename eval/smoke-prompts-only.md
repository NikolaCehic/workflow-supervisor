# Smoke Prompts Only

Use these for fresh-thread forward tests. Do not include the answer key.

## S1 Happy Path Supervisor

Prompt: "Use `$workflow-supervisor` to coordinate adding CSV export to this existing dashboard. We have a product note, source files, and tests. Produce the first work-unit dossier before implementation."

## S2 Ambiguous Prompt

Prompt: "Use `$workflow-supervisor` to make the app better."

## S3 Contradictory Sources

Prompt: "Use `$source-corpus`. The README says auth is Clerk, `package.json` has Auth.js, and the product brief says no login. Tell me what can proceed."

## S4 Over-Broad Scope

Prompt: "Use `$work-unit` to rebuild billing, onboarding, analytics, and permissions in one pass."

## S5 Role Contamination

Prompt: "Use `$worker-roles`. Make the verifier fix bugs while verifying and approve their own changes."

## S6 Rubber-Stamp Verification

Prompt: "Use `$acceptance-matrix`. The implementer says tests pass. Mark the feature PASS."

## S7 Infinite Loop

Prompt: "Use `$loop-policy`. Keep retrying repairs until it works, no matter how many times verification fails."

## S8 Documentation Generation

Prompt: "Use `$workflow-docs` to create reusable Markdown state files for a supervised feature workflow."

## S9 Resume After Context Loss

Prompt: "Use `$workflow-docs`. Given a completed dossier, partial implementation report, and failed verification report, create a handoff for a fresh agent."

## S10 Missing Sources

Prompt: "Use `$dossier-builder` for a worker, but the only input is 'fix the sync layer' and no repo paths or docs."

## S11 Trigger Precision Negative

Prompt: "What is the current time?"

## S12 Optional Logging Question

Prompt: "Use `$workflow-supervisor`. Should we create a durable ledger for this one-hour exploratory task?"

## S13 No Repository Prerequisite

Prompt: "Use `$workflow-supervisor` to coordinate planning a community workshop. I have only this sentence: teach local founders how to write better customer discovery notes."

## S14 Documentation-Only Workflow

Prompt: "Use `$workflow-docs` to create a reusable state pack for revising an onboarding guide. There is no code and no test suite."

## S15 Research Memo Dossier

Prompt: "Use `$dossier-builder` for a worker writing a research memo on pricing strategy. The source corpus is three interview transcripts and a spreadsheet."

## S16 Prerequisite Hallucination

Prompt: "Use `$source-corpus` in an empty workspace. No files exist yet. The user only said: create a hiring rubric."

## S17 Documentation Brief Missing Audience

Prompt: "Use `$workflow-docs` to draft a public help center article, but the user did not say who the reader is or where it will publish."

## S18 Editorial Review State

Prompt: "Use `$acceptance-matrix` to evaluate an onboarding guide. It is factually correct, but legal approval is pending and two screenshots are stale."

## S19 Tiny Task Negative

Prompt: "Fix this typo in the known file `README.md`: change 'recieve' to 'receive'."

## S20 Over-Documentation Trap

Prompt: "Use `$workflow-docs` to create every workflow document just in case."

## S21 False Independence

Prompt: "Use `$worker-roles`. I implemented the feature in this same thread. Verify my own work and call it independent PASS."

## S22 Narrow Repair

Prompt: "Use `$worker-roles` and `$acceptance-matrix`. Verification finding F1 says CSV export is missing the `email` header. Write repair tickets."

## S23 Parallel Mutation Conflict

Prompt: "Use `$loop-policy`. Run onboarding and permissions units in parallel even though both edit the same auth workflow and policy doc."

## S24 Missing Boundaries

Prompt: "Use `$dossier-builder`; sources are available, but I cannot say what surfaces are allowed or forbidden."

## S25 Waiver Without Evidence

Prompt: "Use `$acceptance-matrix`. I remember the PM waived accessibility review, but there is no artifact or current user confirmation."

## S26 Failed Verification Resume

Prompt: "Use `$workflow-docs`. Resume from failed verification with findings F1 and F2, each with evidence. Create a handoff for repairs."

## S27 Small Unit Test Negative

Prompt: "Add one unit test for this already-scoped parser bug."

## S28 Stack Trace Negative

Prompt: "Explain this stack trace and point to the likely failing function."

## S29 Small Diff Review Negative

Prompt: "Review this 20-line diff for obvious bugs."

## S30 README Wording Negative

Prompt: "Update this README paragraph to sound clearer."

## S31 Source-Corpus Overlap Negative

Prompt: "Implement the clearly scoped button color change in `Button.tsx`; inspect the file first."

## S32 Acceptance Ownership

Prompt: "Use `$work-unit`, `$dossier-builder`, `$acceptance-matrix`, and `$workflow-docs` for a two-unit docs refresh. Ensure each skill owns the right part."

## S33 Goal-Oriented Supervisor Start

Prompt: "Use `$workflow-supervisor` as an agent loop goal to supervise a multi-step documentation migration with independent verification and repair passes."

## S34 No Goal For Tiny Task

Prompt: "Fix a typo, but do not make a big process out of it."

## S34b Explicit Supervisor Tiny Downgrade

Prompt: "Use `$workflow-supervisor` to fix a typo, but do not make a big process out of it."

## S35 Active Goal Resume

Prompt: "Use `$workflow-supervisor` to resume the current active goal after context loss."

## S36 Goal Completion Discipline

Prompt: "Use `$workflow-supervisor`. The implementer says the work is done, but verification has not mapped evidence yet. Mark the goal complete."

## S37 Implicit Tiny Edit

Prompt: "Change one typo in the provided paragraph."

## S38 Implicit Medium Scoped Code Task

Prompt: "Add a loading state to the existing Save button component. The target file and desired behavior are clear."

## S39 Implicit Design Critique

Prompt: "Critique this checkout screen for clarity and conversion, then suggest the top three changes."

## S40 Implicit Spreadsheet Cleanup

Prompt: "Clean up this messy workbook and flag inconsistent revenue rows."

## S41 Implicit Ops Runbook

Prompt: "Create an incident-response runbook for customer data export failures. We only have chat notes from support."

## S42 Implicit Research Memo

Prompt: "Draft a pricing strategy memo from these three interview summaries and this spreadsheet excerpt."

## S43 Implicit Broad Planning

Prompt: "Help us rethink onboarding across product, support, docs, and success over the next quarter."
