---
name: loop-policy
description: Define execution policy only for supervised, multi-agent, long-running, resumable, approval-gated, or repair-loop workflows. Use for sequential or parallel execution, retry and repair limits, budgets, escalation, Codex goal binding, blocking rules, continuation criteria, and no-progress detection. Do not use for one failing command, normal retrying, routine user approval, or a one-shot task with obvious completion.
---

# Loop Policy

Use this skill to decide how the workflow moves before the loop starts.

## No-Prerequisite Rule

The policy must not require a repository, test suite, issue tracker, or documentation folder unless the task itself does. When prerequisites are missing, choose discovery-first mode or require a lightweight intake artifact before production work.

## Goal Policy

For loop-oriented supervisor work, define how the workflow uses Codex goals:

- goal_start: create, reuse, skip, or ask
- codex_goal_tool_actions: `get_goal` at start/resume, `create_goal` at most once when explicitly allowed, `update_goal` only for terminal complete or blocked
- goal_state_mirror_cadence: each work unit, each verification result, each repair loop, and final outcome
- goal_completion_rule: evidence required before completion
- goal_blocked_rule: same material blocker across the required consecutive goal turns and no meaningful progress
- goal_resume_rule: read active goal before workflow docs, then reconcile

Do not create goals for small direct tasks. A goal is the state container for open-ended loops, not a wrapper around every command.

## Policy Dimensions

- Mode: sequential, parallel, staged parallel, or discovery-first.
- Approval: none, before implementation, before publication, before irreversible action, or before each unit.
- Repair limit: maximum repair loops per unit.
- Budget: time, token, command, cost, or file-change limits.
- Escalation: when to ask the user, spawn a specialist, or stop.
- Completion: evidence required before marking done.
- Resume: artifacts needed before pausing or compacting.
- Mutation conflict: whether units touch the same mutable surfaces or decisions.

## Default Policy

Use this default unless the task says otherwise:

```yaml
mode: sequential
approval_gate: before irreversible or user-visible publication
repair_limit_per_unit: 2
parallel_allowed_when: units do not share mutable surfaces
workflow_unit_blocked_after: first material blocker may stop the unit while the Codex goal remains active
codex_goal_blocked_after: same material blocker across 3 consecutive goal turns and no meaningful progress
completion_requires: acceptance evidence plus residual risk report
resume_requires: handoff or outcome doc for long workflows
missing_prerequisites: discovery-first, not failure
goal_start: create when explicitly goal/agent-loop oriented or environment-authorized, otherwise mirror state in docs
goal_state_mirror_cadence: after unit terminal states and final outcome
```

## No-Progress Detection

Treat the loop as no-progress when:

- the same missing input recurs
- repairs do not address verifier findings
- verification repeats without new evidence
- scope keeps expanding to avoid completion
- checks cannot run and no substitute evidence exists

## Parallel Safety

Do not run units in parallel when they edit the same files, documents, datasets, decisions, workflows, design surfaces, or publication artifacts. If overlap is unclear, run sequentially or create a discovery unit to map ownership first.

## Output Shape

```yaml
workflow:
mode:
approval_gates:
repair_limit:
parallel_rules:
budgets:
escalation_rules:
stop_gates:
completion_rule:
resume_artifacts:
goal_policy:
```
