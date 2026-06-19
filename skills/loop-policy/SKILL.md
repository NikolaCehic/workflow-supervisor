---
name: loop-policy
description: Define execution policy only for supervised, multi-agent, portable-worker, long-running, resumable, autonomous-goal, human-in-loop, approval-gated, or repair-loop workflows. Use for execution path selection, sequential or parallel execution, worker delegation, retry and repair limits, budgets, escalation, Codex goal binding, blocking rules, continuation criteria, and no-progress detection. Do not use for one failing command, normal retrying, routine user approval, or a one-shot task with obvious completion.
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
- goal_resume_rule: read active goal before workflow docs, reconcile state, and continue from the recorded next action after human decisions
- human_decision_resume_rule: ask the smallest blocking decision, update state, invalidate only affected downstream artifacts, and resume without restarting intake unless intake changed

Do not create goals for small direct tasks. A goal is the state container for open-ended loops, not a wrapper around every command.

## Policy Dimensions

- Profile: `lean_work_unit_runner`, `strict_full_workflow`, or `planning_only`; choose before heavy artifacts, goals, workers, or implementation.
- Intake: whether every required intake decision has an explicit user answer, and which unanswered items must be re-asked before any work can start.
- Execution path: autonomous_goal or human_in_loop, from completed intake only.
- Mode: sequential, parallel, staged parallel, or discovery-first, from completed intake only.
- Approval: none, before worker delegation, before implementation, before verification, before repair, before publication, before irreversible action, before each unit, or path-gated.
- Delegation orchestration: selected transport, adapter availability, naming scheme, start timing, supervisor checkpoint cadence, terminal report collection, native resource close behavior, and stop behavior when automated delegation is unavailable.
- Repair limit: maximum repair loops per unit.
- Budget: time, token, command, cost, or file-change limits.
- Escalation: when to ask the user, delegate to a specialist worker, or stop.
- Completion: evidence required before marking done.
- Resume: artifacts needed before pausing, compacting, or waiting for a human decision.
- Mutation conflict: whether units touch the same mutable surfaces or decisions.

## Default Policy

Use this default unless the task says otherwise:

```yaml
profile_selection: before goal creation, heavy planning, worker delegation, implementation, verification, repair, final disposition, publication, or irreversible action
profiles:
  lean_work_unit_runner: large bounded backlog, pure work units, low-footprint direct execution, compact ledger, no default subagents
  strict_full_workflow: ambiguous, high-risk, delegated, source-of-truth, security, external-service, publication, or broad interpretation work
  planning_only: intake, scope review, sequencing, risks, and recommendations without implementation
intake_required_when: every supervisor invocation before goal creation, planning beyond intake, worker delegation, implementation, verification, repair, final disposition, publication, or irreversible action
intake_question_count: ask the complete intake packet first; on follow-up ask every unanswered or ambiguous item
required_intake_decisions: objective_and_source, profile, execution_path, mode, delegation, final_disposition, mutation_boundaries, state_artifacts
use_judgment_defaults: none; user must answer every required intake decision explicitly
keyword_shortcuts: forbidden for path, mode, delegation, final disposition, and boundaries; profile may be selected only from explicit user intent plus controlling source
mode: from completed intake only
execution_path: from completed intake only
approval_gate: path-gated; complete intake before any path-specific plan; human approval for human_in_loop plans; explicit completed-intake authorization for autonomous_goal; explicit completed-intake authorization for irreversible or user-visible publication
repair_limit_per_unit: 2
parallel_allowed_when: units do not share mutable surfaces
worker_delegation_rule: strict mode after complete intake, path gate, concrete dossier, supported automated transport, and supported resource close; lean mode only after explicit authorization or escalation trigger
native_transport_rule: after complete intake, path gate, concrete dossier, and confirmed close operation when the environment exposes approved thread or subagent tools
worker_name_template: wf/<workflow-slug>/<unit-id>-<role>-<dossier-slug>
supervisor_checkpoint_cadence: after worker start, native resource id capture, terminal report, native resource close, repair ticket creation, re-verification, and final disposition
native_worker_lifecycle:
  required_fields: worker_name, transport, native_resource_id, status, terminal_report, close_action, close_result
  codex_close_action: close_agent
  final_outcome_gate: blocked if any native worker lacks close_result
lean_checkpoint_cadence: after each unit ledger update, at user-selected batch size, on blocker, on risk escalation, and final outcome
lean_unit_readiness: id, source_ref, scope, done, check, status
lean_resource_gates: no unapproved subagents, no broad scans unless needed for current unit, one active unit by default, stop or ask when memory/process churn threatens throughput
final_disposition_policy: from completed intake only; if set to ask_at_end, stop and ask at final disposition
workflow_unit_blocked_after: first material blocker may stop the unit while the Codex goal remains active
codex_goal_blocked_after: same material blocker across 3 consecutive goal turns and no meaningful progress
completion_requires: acceptance evidence plus residual risk report
resume_requires: workflow state or outcome doc for long workflows
human_decision_resume_rule: record blocker and next action before asking; after answer, update Q&A/decision/coverage state, re-run only affected downstream steps, invalidate stale artifacts, and continue from recorded next action
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
profile:
intake:
execution_path:
mode:
approval_gates:
delegation_policy:
native_worker_lifecycle:
  required_close_action:
  open_native_workers:
lean_policy:
  ledger:
  unit_readiness:
  batch_checkpoint:
  focused_check:
  escalation_triggers:
repair_limit:
parallel_rules:
budgets:
escalation_rules:
stop_gates:
completion_rule:
resume_artifacts:
human_decision_resume_rule:
goal_policy:
final_disposition_policy:
```
