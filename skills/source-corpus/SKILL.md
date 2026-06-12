---
name: source-corpus
description: Identify, rank, and reconcile sources of truth only when choosing, ranking, or reconciling authoritative sources is material to whether work can proceed. Use when source authority, freshness, contradictions, access rights, citation requirements, or evidence gaps change the safe next action. Do not use for routine citation gathering, straightforward file inspection, simple web lookup, ordinary repo inspection for a scoped change, self-contained answers, or obvious uncontested source grounding.
---

# Source Corpus

Use this skill to turn scattered context into a source map that a workflow can trust.

## No-Prerequisite Mode

Do not assume a repository, wiki, ticket tracker, or documentation folder exists. If the only available source is the user's prompt, classify it as conversation context and mark missing sources explicitly.

Use `allowed_next_action` instead of treating missing sources as a universal block:

- `discovery_only`: enough to ask questions or gather sources
- `provisional_draft`: enough for a low-risk draft, outline, rubric, plan, or options list with assumptions marked
- `production_change`: enough for a material edit, implementation, publication, or decision
- `blocked`: not enough because the next action would make factual, irreversible, regulated, or high-risk claims

Block only when the missing source is material to the proposed next action.

## Source Classes

- Primary executable: code, tests, schemas, configs, fixtures, generated lockfiles.
- Primary written: product specs, RFCs, architecture docs, contracts, tickets with owner decisions.
- Operational evidence: logs, CI output, metrics, customer reports, previous run artifacts.
- Conversation context: user instructions, chat summaries, design decisions.
- Created artifacts: drafts, outlines, diagrams, slide decks, spreadsheets, screenshots, prototypes, decision records.
- External references: web docs, standards, vendor docs. Verify freshness when unstable.
- Inference: model reasoning from sources. Mark clearly as inference, not evidence.

For documentation work, also capture source owner, access constraints, usage rights, citation requirement, confidentiality, last reviewed date, coverage, and review risk when known.

## Ranking Rules

Rank each source by:

- authority: who or what owns the truth
- proximity: how close it is to the behavior or decision
- freshness: whether it may have changed
- specificity: whether it directly addresses the task
- executability: whether it can be tested or inspected
- conflict risk: whether another source disagrees

Prefer executable repo reality over stale prose for current behavior. Prefer explicit user constraints over inferred product intent.
For documentation, research, design, and planning workflows, prefer the artifact under revision and explicit stakeholder instructions over generic best practices.

## Process

1. List candidate sources and how they were found.
2. Classify each source.
3. Read the minimum authoritative set before recommending action.
4. Identify missing sources and whether they block progress.
5. Detect contradictions and label them material or non-material.
6. Extract only task-relevant claims.
7. Produce a source corpus map with evidence gaps.

## Output Shape

```yaml
objective:
sources:
  - path_or_ref:
    class:
    authority:
    freshness:
    relevant_claims:
    owner:
    access:
    usage_rights:
    citation_needed:
    last_reviewed:
    coverage:
    risk:
    confidence:
missing_sources:
contradictions:
  - source_a:
    source_b:
    issue:
    material: true|false
evidence_gaps:
must_read_before_action:
safe_to_proceed: true|false
allowed_next_action: discovery_only|provisional_draft|production_change|blocked
blocking_question:
```

## Stop Gates

Stop when the task depends on a source that is missing, inaccessible, contradicted by a higher-authority source, or likely stale and unstable. Continue only if the missing source is non-material and the output states the assumption.
