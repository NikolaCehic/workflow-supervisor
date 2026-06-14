---
name: loop-policy
description: Define execution policy only for supervised, multi-agent, multi-thread, long-running, resumable, autonomous-goal, human-in-loop, approval-gated, or repair-loop workflows. Use for execution path selection, sequential or parallel execution, thread orchestration, retry and repair limits, budgets, escalation, Codex goal binding, blocking rules, continuation criteria, and no-progress detection. Do not use for one failing command, normal retrying, routine user approval, or a one-shot task with obvious completion.
---

# Loop Policy

Use this skill to decide how the workflow moves before the loop starts.

## No-Prerequisite Rule

The policy must not require a repository, test suite, issue tracker, or documentation folder unless the task itself does. When prerequisites are missing, choose discovery-first mode or require a lightweight intake artifact before production work.

## Goal Policy

For loop-oriented supervisor work, define how the workflow uses Codex goals after complete intake is satisfied:

- goal_start: create, reuse, skip, or ask
- execution_path: `autonomous_goal` or `human_in_loop`, from completed intake only
- codex_goal_tool_actions: `get_goal` at start/resume, `create_goal` at most once when explicitly allowed, `update_goal` only for terminal complete or blocked
- goal_state_mirror_cadence: each work unit, each verification result, each repair loop, and final outcome
- goal_completion_rule: evidence required before completion
- goal_blocked_rule: same material blocker across the required consecutive goal turns and no meaningful progress
- goal_resume_rule: read active goal before workflow docs, then reconcile

Do not create goals for small direct tasks. A goal is the state container for open-ended loops, not a wrapper around every command.

## Policy Dimensions

- Intake: whether every required intake decision has an explicit user answer, and which unanswered items must be re-asked before any work can start.
- Execution path: autonomous_goal or human_in_loop, from completed intake only.
- Mode: sequential, parallel, staged parallel, or discovery-first, from completed intake only.
- Approval: none, before thread creation, before implementation, before verification, before repair, before publication, before irreversible action, before each unit, or path-gated.
- Delegation orchestration: thread or subagent availability, naming scheme, spawn timing, supervisor checkpoint cadence, terminal report collection, and fallback when delegation tools are unavailable.
- Repair limit: maximum repair loops per unit.
- Budget: time, token, command, cost, or file-change limits.
- Escalation: when to ask the user, spawn a specialist, or stop.
- Completion: evidence required before marking done.
- Resume: artifacts needed before pausing or compacting.
- Mutation conflict: whether units touch the same mutable surfaces or decisions.

## Default Policy

Use this default unless the task says otherwise:

```yaml
intake_required_when: every supervisor invocation before goal creation, planning beyond intake, thread or subagent creation, implementation, verification, repair, final disposition, publication, or irreversible action
intake_question_count: ask the complete intake packet first; on follow-up ask every unanswered or ambiguous item
required_intake_decisions: objective_and_source, execution_path, mode, delegation, final_disposition, mutation_boundaries, state_artifacts
use_judgment_defaults: none; user must answer every required intake decision explicitly
keyword_shortcuts: forbidden; do not infer path, mode, delegation, final disposition, or boundaries from prompt keywords
mode: from completed intake only
execution_path: from completed intake only
approval_gate: path-gated; complete intake before any path-specific plan; human approval for human_in_loop plans; explicit completed-intake authorization for autonomous_goal; explicit completed-intake authorization for irreversible or user-visible publication
repair_limit_per_unit: 2
parallel_allowed_when: units do not share mutable surfaces
thread_spawn_rule: after complete intake, path gate, and concrete dossier
subagent_spawn_rule: after complete intake, path gate, and concrete dossier when the environment exposes subagent tools
thread_name_template: wf/<workflow-slug>/<unit-id>-<role>-<dossier-slug>
supervisor_checkpoint_cadence: after handoff acknowledgement, terminal report, repair ticket creation, re-verification, and final disposition
final_disposition_policy: from completed intake only; if set to ask_at_end, stop and ask at final disposition
workflow_unit_blocked_after: first material blocker may stop the unit while the Codex goal remains active
codex_goal_blocked_after: same material blocker across 3 consecutive goal turns and no meaningful progress
completion_requires: acceptance evidence plus residual risk report
resume_requires: handoff or outcome doc for long workflows
missing_prerequisites: discovery-first, not failure
goal_start: after complete intake only; create only when completed intake and environment authorize goal binding, otherwise mirror state in docs
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
intake:
execution_path:
mode:
approval_gates:
delegation_policy:
repair_limit:
parallel_rules:
budgets:
escalation_rules:
stop_gates:
completion_rule:
resume_artifacts:
goal_policy:
final_disposition_policy:
```
