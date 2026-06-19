---
name: workflow-docs
description: Generate or refresh durable workflow-state, delegation, resume, verification, repair, decision, or documentation-production control artifacts. Use when the work needs reusable state such as workflow control docs, documentation briefs, source inventories, review plans, revision queues, publishing checklists, or maintenance plans. Do not use for ordinary README edits, help article drafting, prose cleanup, summaries, marketing copy, decorative docs, or documentation content unless reusable workflow/documentation-production state is requested.
---

# Workflow Docs

Use this skill to make the workspace remember the workflow. These Markdown files are working artifacts, not explanatory essays.

## No-Prerequisite Mode

Do not require existing Markdown files. You may create a minimal doc set from conversation context alone, as long as unknowns are marked. For non-document workflows, create only the artifacts that help the next agent or human continue.

## State Artifact Medium

Markdown is the default when the workspace/file medium is appropriate, but reusable workflow state may also be an inline brief, spreadsheet tab, ticket set, design annotation, CRM note, runbook, decision log, slide appendix, whiteboard note, or chat continuation note. Choose the medium that the next human or agent can actually use.

## Default Artifact Directory

When creating Markdown workflow artifacts, use `<workspace>/.workflow/` as the default directory. Treat `<workspace>` as the active project root, repository root, or user-provided working directory. If the task has no stable workspace, keep state inline or ask where to write it.

Use another location only when the user names one, the project has an existing workflow-state convention, the target medium is not files, or the artifact is a final deliverable that belongs elsewhere. Keep control artifacts under `.workflow/` even when implementation files, docs, or product outputs are created in normal project locations.

In a Git-backed codebase, `.workflow/` is local supervisor state by default. Before creating `.workflow/` artifacts, ensure `<workspace>/.gitignore` contains `.workflow/`. Create `.gitignore` if needed. Do not stage, commit, or publish `.workflow/` unless the completed intake explicitly names workflow state as a final deliverable.

## Artifact Lanes

Use two lanes:

- Workflow control: preserve state, decisions, work units, delegation, verification, and outcomes.
- Documentation production: define audience, purpose, content inventory, outline, style, review path, publication readiness, and maintenance.

For documentation work, start with `DOCUMENTATION-BRIEF.md` unless the user provides an equivalent brief. Without audience, reader task, document type, owner, source expectations, and publishing target, create a brief or ask for the missing decision before drafting final content.

## Modes

- Scaffold blank artifacts for a new workflow.
- Generate artifacts from conversation, source inspection, or supervisor state.
- Refresh existing artifacts while preserving unresolved questions and decisions.
- Create a resume pack for another worker or future session.
- Convert verification and repair results into durable reports.
- Preserve worker delegation plans, terminal reports, and final disposition decisions when supervised work spans workers or sessions.

## Rules

- Load [references/templates.md](references/templates.md) first when choosing exact templates, then load only the referenced lane file needed for the task.
- Load [references/documentation-production.md](references/documentation-production.md) for documentation deliverables, content drafts, claims registers, review plans, publishing, and maintenance.
- Load [references/workflow-control.md](references/workflow-control.md) for supervised workflow state, work units, dossiers, acceptance, verification, repairs, decisions, delegation state, and outcomes.
- Load [references/goal-resume.md](references/goal-resume.md) for Codex goal mirrors, active-goal conflicts, and resume packs.
- Keep facts, assumptions, open questions, and inferences separate.
- Include paths, commands, sources, and evidence when available.
- Do not hide missing information. Use `Unknown` or `Blocked` with reason.
- Prefer concise tables and checklists over narrative.
- Do not create files the workflow will not use.
- Reject requests to create every possible workflow document "just in case"; select the smallest doc set that preserves state or enables production.
- Do not treat workflow docs as a required provenance ledger; use them as lightweight working memory.
- Keep `.workflow/` ignored by Git in codebases; workflow state is private working memory unless the user explicitly chooses to publish it.
- Adapt headings from files and commands to artifacts and evidence for non-code workflows.
- Preserve acceptance matrices and verification reports; do not reinterpret evidence rows or change verdicts unless the workflow explicitly asks for a review/update.

## Artifact Selection

- `.workflow/WORKFLOW.md`: overall objective, policy, state, units, and next action.
- `.workflow/LEDGER.md`: compact lean-runner state for large bounded backlogs, with one row per work unit and targeted check evidence.
- `.workflow/SOURCE-CORPUS.md`: source map, authority ranking, contradictions, gaps.
- `.workflow/SPEC.md`: human-reviewable interpretation contract, requirement coverage, Q&A, and approval decision before final work units.
- `.workflow/WORK-UNITS.md`: decomposition and sequencing.
- `.workflow/DOSSIER.md`: delegation contract for one unit.
- `.workflow/WORKER-MAP.md`: worker names, roles, transports, native resource ids, dossiers, dependencies, start conditions, report status, close actions, close results, and supervisor checkpoints.
- `.workflow/ACCEPTANCE-MATRIX.md`: verifiable done criteria.
- `.workflow/VERIFICATION-REPORT.md`: evidence-backed PASS/FAIL/BLOCKED report.
- `.workflow/REPAIR-TICKETS.md`: actionable repair tasks from verifier findings.
- `.workflow/DECISIONS.md`: durable decisions, assumptions, and reversals.
- `.workflow/HANDOFF.md`: resume state for another agent or session.
- `.workflow/OUTCOME.md`: final status, checks, risks, and next step.
- `.workflow/GOAL-STATE.md`: optional fallback or mirror for Codex goal state, terminal blocked-goal history, and human-decision resume checkpoints.
- `.workflow/DOCUMENTATION-BRIEF.md`: audience, purpose, document type, reader task, channel, owner, approvers, and success criteria.
- `.workflow/CONTENT-INVENTORY.md`: existing materials, reusable sections, gaps, stale areas, and owners.
- `.workflow/OUTLINE.md`: information architecture, section hierarchy, and required content.
- `.workflow/STYLE-GUIDE.md`: tone, terminology, formatting, examples, and banned phrasing.
- `.workflow/GLOSSARY.md`: approved terms, definitions, aliases, and deprecated terms.
- `.workflow/REVIEW-PLAN.md`: SME, editorial, legal, compliance, accessibility, localization, and approval steps.
- `.workflow/REVISION-QUEUE.md`: section-level feedback and editorial repair tasks.
- `.workflow/PUBLISHING-CHECKLIST.md`: metadata, links, assets, permissions, approvals, and launch target.
- `.workflow/MAINTENANCE-PLAN.md`: owner, review cadence, expiry date, and update triggers.
- `.workflow/CONTENT-DRAFT.md`: actual documentation draft body with audience, reader task, sources, open claims, examples, review status, and publishing target.
- `.workflow/CLAIMS-REGISTER.md`: claim-level source, citation, confidence, reviewer, status, rights, and recheck tracking.
- `.workflow/ASSET-REGISTER.md`: images, diagrams, videos, source files, licenses, owners, and usage status.
- `.workflow/PUBLICATION-LOG.md`: channel, version, approver, date, and notes for published artifacts.

## Output Requirement

When generating docs, report which files were created or updated, which artifact directory was used, which sources informed them, and which fields remain unknown.
