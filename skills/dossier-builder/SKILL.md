---
name: dossier-builder
description: Create a concrete delegation contract only when one already-bounded work unit needs a dossier for another agent, automated worker run, future session, formal worker prompt, or durable continuation. Use when objective, sources, boundaries, acceptance rows, checks or evidence, stop gates, worker naming, start conditions, and report schemas must be captured before delegation. Do not use to plan work Codex will perform directly in the current turn, for unbounded work, or for ordinary same-session implementation.
---

# Dossier Builder

Use this skill to prevent vague delegation. A dossier is the contract between the supervisor and a worker.

## Domain Neutral Inputs

Use repository fields only when the task is repository-shaped. For documentation, research, design, operations, or planning work, translate "surface" into the relevant mutable artifact: document section, source set, decision area, dataset, prompt, workflow, design, or deliverable.

For documentation production, the dossier may be a content brief. It should name audience, reader task, document type, required sections, source requirements, tone, reviewers, publication target, and maintenance needs.

The dossier does not own acceptance design. It references or embeds acceptance rows produced by `$acceptance-matrix`, or marks acceptance as draft when rows still need evidence.

## Required Inputs

- bounded work unit
- source corpus or source list
- known allowed and forbidden surfaces or artifacts
- acceptance criteria or acceptance draft
- required checks or evidence
- expected outcomes, capability limits, and invalid PASS conditions for outcome-bearing work
- worker role and report expectations

If these inputs are missing, create a discovery dossier or return BLOCKED.

For bug-fix dossiers and risky behavior-change dossiers, include a red-capable feedback loop or explain why no correct loop exists. The `feedback_loop` field is optional in `DossierV1` during the compatibility phase, but `validate-dossier` emits warnings when risky work omits it.

Before delegation, validate the dossier with:

```bash
workflow-supervisor validate-dossier <dossier-path> --role <role> --unit <unit-id> --json
```

If validation fails, do not start a worker. Return BLOCKED, create a discovery dossier, or ask the supervisor/user for the missing decision.

For early discovery, the only source may be conversation context and the only allowed surface may be a planned brief, doc, or question list. Do not require repository paths or existing files.

Use a provisional dossier for low-risk drafts, plans, outlines, rubrics, and options when sources are thin but the output can clearly mark assumptions. Use BLOCKED for factual, irreversible, regulated, publication, or production changes that lack material sources or boundaries.

## Dossier Shape

```yaml
schema: DossierV1
workflow:
work_unit:
dossier_id:
worker_name:
worker_role:
delegation_transport:
start_condition:
title:
objective:
non_goals:
source_corpus:
must_read:
allowed_surfaces:
forbidden_surfaces:
read_only_neighbors:
work_points:
audience:
reader_task:
document_type:
publication_target:
reviewers:
acceptance_matrix:
adversarial_checks:
required_commands_or_evidence:
verification_environment:
  shell: true | false
  filesystem: true | false
  git_diff: true | false
  browser: true | false
  playwright_mcp: true | false
  network: true | false
outcome_evaluations:
  - id:
    source_requirement:
    expected_outcome:
    preferred_verification:
    available_verification:
    evidence_strength:
    invalid_pass_conditions:
feedback_loop:
  command_or_evidence:
  red_capable: yes | no | not_applicable
  exact_symptom_or_behavior:
  deterministic: yes | no
  expected_runtime:
  agent_runnable: yes | no
worker_role:
worker_prompt:
supervisor_checkpoints:
completion_report_schema:
verification_report_schema:
stop_gates:
assumptions:
open_questions:
```

The machine gate requires concrete strings or arrays for the core fields. Use `open_questions: [none]` only when no open question remains. Do not use placeholders such as `TBD`, `unknown`, `all files`, `entire repo`, `as needed`, or `use your judgment`.

## Delegation Rules

- Name exact files, docs, systems, or artifact paths when available.
- Prefer concrete boundaries over broad module names.
- Include forbidden surfaces even when the worker seems trustworthy.
- Convert unknowns into open questions, not hidden assumptions.
- Include adversarial checks for malformed input, stale state, authorization, schema drift, replay, no-op implementation, and untrusted sources when relevant.
- For outcome-bearing work, require workers to report row-mapped outcome evidence. The worker must not treat tests/typecheck/build as sufficient unless the row is explicitly technical or those commands observe the expected outcome.
- Include capability limitations and required external checks when an expected outcome depends on browser, visual, live-service, credential, network, or human-review capability that may be unavailable.
- For bug fixes and risky behavior changes, require a feedback loop that would catch the exact symptom or behavior. A related build, lint, or broad test run is not enough unless waiver evidence accepts it as substitute evidence.
- Require workers to report skipped checks and assumptions.
- For non-code work, use evidence such as citations, before/after excerpts, review rubrics, examples, artifact diffs, or explicit user decisions instead of commands.
- Require repair tickets to cite the verification finding or acceptance row they repair.
- Include a deterministic `worker_name` when delegation is planned. Use `wf/<workflow-slug>/<unit-id>-<role>-<dossier-slug>`.
- Include `start_condition`, such as `after path gate`, `after human plan approval`, `after autonomous execution plan`, `after implementer report`, `after verification FAIL`, or `after repairs complete`.
- Include the selected `delegation_transport`, such as `portable_delegate`, `native_thread`, `native_subagent`, or `same_session_phased`.
- Include a ready-to-send `worker_prompt` that contains only the worker's role, dossier, sources, acceptance rows, stop gates, and report schema.
- Include supervisor checkpoints for kickoff acknowledgement, blocker questions, terminal report, and closeout.
- Run `workflow-supervisor validate-dossier` before `workflow-supervisor delegate`. Treat validation failure as a stop gate.

## Failure Modes

Return BLOCKED rather than producing a dossier when:

- material sources are absent or contradictory for the proposed next action
- the work unit is unbounded and cannot be converted into discovery or provisional drafting
- allowed and forbidden surfaces cannot be named
- acceptance cannot be verified
- the worker role would need to make product decisions
- a waiver or approval is remembered but not evidenced by a user decision, artifact, or source
