---
name: dossier-builder
description: Create a concrete handoff contract only when one already-bounded work unit needs a dossier for another agent, thread, future session, formal worker prompt, or durable handoff. Use when objective, sources, boundaries, acceptance rows, checks or evidence, stop gates, and report schemas must be captured before delegation. Do not use to plan work Codex will perform directly in the current turn, for unbounded work, or for ordinary same-thread implementation.
---

# Dossier Builder

Use this skill to prevent vague handoffs. A dossier is the contract between the supervisor and a worker.

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
- worker role and report expectations

If these inputs are missing, create a discovery dossier or return BLOCKED.

For early discovery, the only source may be conversation context and the only allowed surface may be a planned brief, doc, or question list. Do not require repository paths or existing files.

Use a provisional dossier for low-risk drafts, plans, outlines, rubrics, and options when sources are thin but the output can clearly mark assumptions. Use BLOCKED for factual, irreversible, regulated, publication, or production changes that lack material sources or boundaries.

## Dossier Shape

```yaml
workflow:
work_unit:
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
worker_role:
completion_report_schema:
verification_report_schema:
stop_gates:
assumptions:
open_questions:
```

## Handoff Rules

- Name exact files, docs, systems, or artifact paths when available.
- Prefer concrete boundaries over broad module names.
- Include forbidden surfaces even when the worker seems trustworthy.
- Convert unknowns into open questions, not hidden assumptions.
- Include adversarial checks for malformed input, stale state, authorization, schema drift, replay, no-op implementation, and untrusted sources when relevant.
- Require workers to report skipped checks and assumptions.
- For non-code work, use evidence such as citations, before/after excerpts, review rubrics, examples, artifact diffs, or explicit user decisions instead of commands.
- Require repair tickets to cite the verification finding or acceptance row they repair.

## Failure Modes

Return BLOCKED rather than producing a dossier when:

- material sources are absent or contradictory for the proposed next action
- the work unit is unbounded and cannot be converted into discovery or provisional drafting
- allowed and forbidden surfaces cannot be named
- acceptance cannot be verified
- the worker role would need to make product decisions
- a waiver or approval is remembered but not evidenced by a user decision, artifact, or source
