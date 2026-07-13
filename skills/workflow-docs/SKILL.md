---
name: workflow-docs
description: Generate or refresh durable workflow, delegation, resume, verification, repair, decision, planning-handoff, or documentation-production state. Use only when the user explicitly invokes $workflow-docs or an active workflow-supervisor needs reusable state such as a compact ledger, ready-for-agent brief, source inventory, review plan, publishing checklist, maintenance plan, or handoff. Do not use for ordinary README edits, prose cleanup, summaries, marketing copy, or decorative documentation.
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

In a Git-backed codebase, `.workflow/` is local supervisor state by default. Inspect existing ignore conventions before writing. When local mutation is authorized, add `.workflow/` to the appropriate ignore file if needed; otherwise keep state inline or use an already-ignored location. Do not stage, commit, or publish workflow state unless the user explicitly names it as a final deliverable.

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
- Load [references/workflow-foundations.md](references/workflow-foundations.md) for `WORKFLOW.md`, `LEDGER.md`, source mapping, or a reviewable SPEC.
- Load [references/work-units-and-delegation.md](references/work-units-and-delegation.md) for work units, validated machine dossier YAML, a human dossier index, or worker lifecycle state.
- Load [references/verification-and-repair.md](references/verification-and-repair.md) for acceptance, outcome verification, or repair tickets.
- Load [references/decisions-handoff-and-outcome.md](references/decisions-handoff-and-outcome.md) for decisions, resume handoff, goal pointer, or exact final disposition.
- Load [references/goal-resume.md](references/goal-resume.md) for Codex goal mirrors, active-goal conflicts, and resume packs.
- Load [references/planning-outputs.md](references/planning-outputs.md) for ready-for-agent briefs, prototype decisions, and architecture recommendations.
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
- `.workflow/DOSSIER.md`: human index of machine dossiers and their validation state.
- `.workflow/dossiers/*.yaml`: canonical `DossierV1` machine contracts validated before delegation.
- `.workflow/WORKER-MAP.md`: worker names, roles, transports, native resource ids, dossiers, dependencies, start conditions, terminal reports, supported lifecycle actions/results, and supervisor checkpoints.
- `.workflow/ACCEPTANCE-MATRIX.md`: verifiable done criteria.
- `.workflow/VERIFICATION-REPORT.md`: evidence-backed PASS/FAIL/BLOCKED report.
- `.workflow/REPAIR-TICKETS.md`: actionable repair tasks from verifier findings.
- `.workflow/DECISIONS.md`: durable decisions, assumptions, and reversals.
- `.workflow/HANDOFF.md`: resume state for another agent or session.
- `.workflow/OUTCOME.md`: final status, checks, risks, and next step.
- `.workflow/GOAL-STATE.md`: optional fallback or mirror for Codex goal state, terminal blocked-goal history, and human-decision resume checkpoints.
- `.workflow/AGENT-BRIEF.md`: human-readable, ready-for-agent planning handoff that must become a dossier before machine delegation.
- `.workflow/PROTOTYPE-DECISION.md`: discovery question, observation, decision, and delete-or-absorb result.
- `.workflow/ARCHITECTURE-RECOMMENDATIONS.md`: planning-only candidates, evidence, test surfaces, and required decisions.
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
