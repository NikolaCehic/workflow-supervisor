---
name: worker-roles
description: Define narrow role contracts only when creating explicit worker prompts or separating responsibilities across multiple agents, threads, reviewers, or formal handoffs. Use to prevent role bleed such as verifiers editing implementation, implementers self-approving, or repair authors inventing scope. Do not use for ordinary single-agent reviewing, editing, researching, documenting, or implementing in the current thread.
---

# Worker Roles

Use this skill to make delegation safe. Each worker prompt should include one role, one objective, allowed behavior, forbidden behavior, sources to read, and a report schema.

## Domain Neutrality

Use "Executor" or "Producer" instead of "Implementer" when the work is documentation, research, design, planning, operations, data, or other non-code production. Use "artifact changed" instead of "files changed" when the mutable output is not a file.

## Solo Mode

When separate agents, threads, or reviewers are unavailable, collapse roles into phases in the same session. Label verification as `self-check`, not independent verification. Require independent review only when the user asks, the work is high-risk, publication-bound, regulated, security-sensitive, or the loop policy requires it.

## Role Contracts

### Implementer Or Executor

- May edit only allowed surfaces.
- Must not stage, commit, publish, approve, or edit workflow records unless assigned.
- Must report files or artifacts changed, decisions followed, checks run or evidence produced, skipped checks, assumptions, and acceptance mapping.

### Verifier

- Must not edit files except unavoidable command side effects.
- Must inspect sources and diff/artifacts independently.
- Must map every acceptance item to evidence.
- Must return PASS, FAIL, or BLOCKED.
- Must list repair intent only, not code changes.

### Researcher

- Finds and ranks evidence.
- Must distinguish source claims from inference.
- Must not decide implementation scope.

### Repair-Ticket Author

- Converts verifier findings into actionable tickets.
- Must not invent new scope.
- Must include severity, affected surfaces or artifacts, problem, required repair, required checks or evidence, and acceptance criteria.
- Must link each ticket to a verifier finding ID, acceptance row, or exact evidence gap.

### Documenter

- Creates or updates workflow artifacts from evidence.
- Must preserve unknowns and residual risks.
- Must not turn unresolved questions into facts.

### Editor

- Revises content for audience, structure, clarity, voice, and completeness.
- Must not invent unsupported facts or erase source uncertainty.
- Must report changed sections, rationale, open questions, and review needs.

### Subject-Matter Reviewer

- Reviews factual accuracy within an assigned domain.
- Must distinguish required corrections from preferences.
- Must cite sources or expertise basis for material changes.

### Approver

- Grants or withholds publication or workflow approval.
- Must name caveats, required follow-ups, and expiration or review cadence when relevant.

### Reviewer

- Reviews completed artifacts, plans, or changes.
- Must prioritize issues and missing evidence.
- Must not silently repair unless explicitly assigned.

### Synthesizer

- Compresses context for continuation.
- Must preserve decisions, blockers, sources, checks, and next actions.

## Anti Role-Bleed Rules

- A verifier that edits implementation has invalidated independence.
- An implementer that declares final PASS without verifier evidence is premature.
- A repair author that adds product requirements is expanding scope.
- A documenter that hides unknowns is corrupting resume state.
- A supervisor that implements code should mark that role switch explicitly.
- Same-thread verification is a self-check unless an independent verifier separately inspects the evidence.

## Worker Prompt Minimums

Include:

- role name
- work unit and objective
- must-read sources
- allowed and forbidden surfaces
- acceptance criteria
- stop gates
- exact report schema
