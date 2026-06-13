---
name: workflow-docs
description: Generate or refresh durable workflow-state, handoff, resume, verification, repair, decision, or documentation-production control artifacts. Use when the work needs reusable state such as workflow control docs, documentation briefs, source inventories, review plans, revision queues, publishing checklists, or maintenance plans. Do not use for ordinary README edits, help article drafting, prose cleanup, summaries, marketing copy, decorative docs, or documentation content unless reusable workflow/documentation-production state is requested.
---

# Workflow Docs

Use this skill to make the workspace remember the workflow. These Markdown files are working artifacts, not explanatory essays.

## No-Prerequisite Mode

Do not require existing Markdown files. You may create a minimal doc set from conversation context alone, as long as unknowns are marked. For non-document workflows, create only the artifacts that help the next agent or human continue.

## State Artifact Medium

Markdown is the default when the workspace/file medium is appropriate, but reusable workflow state may also be an inline brief, spreadsheet tab, ticket set, design annotation, CRM note, runbook, decision log, slide appendix, whiteboard note, or chat handoff. Choose the medium that the next human or agent can actually use.

## Artifact Lanes

Use two lanes:

- Workflow control: preserve state, decisions, work units, handoffs, verification, and outcomes.
- Documentation production: define audience, purpose, content inventory, outline, style, review path, publication readiness, and maintenance.

For documentation work, start with `DOCUMENTATION-BRIEF.md` unless the user provides an equivalent brief. Without audience, reader task, document type, owner, source expectations, and publishing target, create a brief or ask for the missing decision before drafting final content.

## Modes

- Scaffold blank artifacts for a new workflow.
- Generate artifacts from conversation, source inspection, or supervisor state.
- Refresh existing artifacts while preserving unresolved questions and decisions.
- Create a resume pack for another thread or future session.
- Convert verification and repair results into durable reports.
- Preserve thread plans, worker handoffs, terminal reports, and final disposition decisions when supervised work spans threads.

## Rules

- Load [references/templates.md](references/templates.md) first when choosing exact templates, then load only the referenced lane file needed for the task.
- Load [references/documentation-production.md](references/documentation-production.md) for documentation deliverables, content drafts, claims registers, review plans, publishing, and maintenance.
- Load [references/workflow-control.md](references/workflow-control.md) for supervised workflow state, work units, dossiers, acceptance, verification, repairs, decisions, handoffs, and outcomes.
- Load [references/goal-resume.md](references/goal-resume.md) for Codex goal mirrors, active-goal conflicts, and resume packs.
- Keep facts, assumptions, open questions, and inferences separate.
- Include paths, commands, sources, and evidence when available.
- Do not hide missing information. Use `Unknown` or `Blocked` with reason.
- Prefer concise tables and checklists over narrative.
- Do not create files the workflow will not use.
- Reject requests to create every possible workflow document "just in case"; select the smallest doc set that preserves state or enables production.
- Do not treat workflow docs as a required provenance ledger; use them as lightweight working memory.
- Adapt headings from files and commands to artifacts and evidence for non-code workflows.
- Preserve acceptance matrices and verification reports; do not reinterpret evidence rows or change verdicts unless the workflow explicitly asks for a review/update.

## Artifact Selection

- `WORKFLOW.md`: overall objective, policy, state, units, and next action.
- `SOURCE-CORPUS.md`: source map, authority ranking, contradictions, gaps.
- `WORK-UNITS.md`: decomposition and sequencing.
- `DOSSIER.md`: handoff contract for one unit.
- `THREAD-MAP.md`: thread names, roles, dossiers, dependencies, start conditions, report status, and supervisor checkpoints.
- `ACCEPTANCE-MATRIX.md`: verifiable done criteria.
- `VERIFICATION-REPORT.md`: evidence-backed PASS/FAIL/BLOCKED report.
- `REPAIR-TICKETS.md`: actionable repair tasks from verifier findings.
- `DECISIONS.md`: durable decisions, assumptions, and reversals.
- `HANDOFF.md`: resume state for another agent or session.
- `OUTCOME.md`: final status, checks, risks, and next step.
- `GOAL-STATE.md`: optional fallback record when a Codex goal tool is unavailable or goal state must be mirrored for handoff.
- `DOCUMENTATION-BRIEF.md`: audience, purpose, document type, reader task, channel, owner, approvers, and success criteria.
- `CONTENT-INVENTORY.md`: existing materials, reusable sections, gaps, stale areas, and owners.
- `OUTLINE.md`: information architecture, section hierarchy, and required content.
- `STYLE-GUIDE.md`: tone, terminology, formatting, examples, and banned phrasing.
- `GLOSSARY.md`: approved terms, definitions, aliases, and deprecated terms.
- `REVIEW-PLAN.md`: SME, editorial, legal, compliance, accessibility, localization, and approval steps.
- `REVISION-QUEUE.md`: section-level feedback and editorial repair tasks.
- `PUBLISHING-CHECKLIST.md`: metadata, links, assets, permissions, approvals, and launch target.
- `MAINTENANCE-PLAN.md`: owner, review cadence, expiry date, and update triggers.
- `CONTENT-DRAFT.md`: actual documentation draft body with audience, reader task, sources, open claims, examples, review status, and publishing target.
- `CLAIMS-REGISTER.md`: claim-level source, citation, confidence, reviewer, status, rights, and recheck tracking.
- `ASSET-REGISTER.md`: images, diagrams, videos, source files, licenses, owners, and usage status.
- `PUBLICATION-LOG.md`: channel, version, approver, date, and notes for published artifacts.

## Output Requirement

When generating docs, report which files were created or updated, which sources informed them, and which fields remain unknown.
