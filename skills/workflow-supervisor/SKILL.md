---
name: workflow-supervisor
description: Coordinate open-ended, multi-step agent workflows when the user explicitly requests supervised or agent-loop coordination and at least one hard trigger is present, or when no explicit supervisor wording exists but two or more hard triggers are present. Hard triggers include multi-agent or multi-thread handoff, durable resume need, high-risk independent verification, contradictory or missing sources, multi-unit scope, repair loops, approval gates, or workflow-state documentation. Do not use for simple single-turn answers, ordinary repo inspection, medium scoped edits, typo fixes, one-off tests, or narrowly scoped changes that can be completed directly.
---

# Workflow Supervisor

Use this skill as the coordinating spine for complex work. The supervisor owns decomposition, handoff quality, loop discipline, stop gates, and outcome reporting. It may do source discovery and reporting itself, but implementation, verification, repair-ticket writing, and documentation should be treated as separate roles when the environment supports separate agents or threads.

## Domain Neutrality

This workflow must work without a repository, codebase, existing docs, or installed project conventions. Treat "surface" as any mutable target: files, documents, designs, datasets, decisions, prompts, workflows, tickets, configs, UI states, business processes, or research artifacts. Treat "check" as any evidence-producing method: tests, commands, inspections, rubrics, document diffs, stakeholder decisions, examples, screenshots, source citations, or manual verification.

When no source corpus exists, make the first work unit a discovery/intake unit instead of inventing prerequisites. Do not require `AGENTS.md`, a repo, commands, or Markdown files unless the specific task provides them or needs them.

## Codex Goal Lifecycle

This skill is loop-oriented. When the user invokes it for an open-ended supervised workflow and explicitly says goal, agent loop, long-running repair/verification cycle, or durable continuation, bind the workflow to a Codex goal when the environment supports goals and the governing instructions permit goal creation.

Use this lifecycle:

1. Call `get_goal` or the environment's equivalent first.
2. Classify goal state: `none`, `active relevant`, `active unrelated`, `complete old`, `blocked old`, or `tool unavailable`.
3. If an active relevant goal exists, reuse it.
4. If an active unrelated goal exists, do not create, reuse, complete, block, or update it. Ask the user whether to switch goals or continue with goal binding skipped.
5. If no active goal exists and the invocation explicitly asks for a goal or agent loop, or the governing environment says supervisor invocations should create goals, call `create_goal` at most once with a concrete objective.
6. Do not create a goal for simple single-turn answers, ordinary scoped edits, tiny tasks, or when the user says not to.
7. Keep the goal objective stable. Track tactical steps in the plan, dossier, workflow docs, or `GOAL-STATE.md` rather than trying to rewrite the goal.
8. Use `update_goal` only for terminal `complete` or `blocked` states when the environment supports that action.
9. Mark the goal complete only after acceptance evidence supports completion and no required supervisor work remains.
10. Distinguish workflow/unit BLOCKED from Codex goal blocked. Mark a Codex goal blocked only after the same material blocker repeats across the required consecutive goal turns and no meaningful progress remains.
11. On resume after compaction or handoff, read the active goal first, then reconcile workflow docs and current artifacts.

If the environment has no goal tool or goal creation is not permitted, state the intended goal objective in the supervisor report and continue with workflow docs or another state artifact as the fallback state container.

## Operating Contract

- Ground the workflow in sources before creating work units.
- Classify the workflow as `autonomous_goal` or `human_in_loop` before spawning threads or beginning implementation.
- Always produce a plan. In `human_in_loop`, make it an approval packet and stop for approval. In `autonomous_goal`, make it an execution plan and continue only when autonomy is explicitly authorized.
- Do not begin implementation until the path gate is satisfied, at least one concrete dossier exists, and no stop gate applies.
- Spawn worker threads only when the environment supports threads and the path gate authorizes delegation; otherwise emit handoff prompts or workflow docs as the fallback.
- Do not start implementer, verifier, repair-author, or documenter threads before the path gate is satisfied; role-specific start conditions are additional gates after that.
- Keep roles separate: implementers implement, verifiers verify, repair authors write tickets, documenters update workflow artifacts, and the supervisor coordinates.
- Treat same-thread verification as a self-check, not independent verification.
- Prefer explicit PASS/FAIL/BLOCKED states over soft completion language.
- Stop instead of improvising when sources are missing, contradictory, materially stale, or too vague to produce acceptance criteria.
- Keep provenance optional; require enough outcome detail for another agent to resume.
- Treat companion skills as optional phase tools, not an automatic cascade. Use the smallest set needed for the current risk.

## Supervisor Loop

1. Restate the objective, constraints, non-goals, known sources, and unknowns.
2. Bind or reconcile the Codex goal when the invocation is goal/loop-oriented and no unrelated active goal prevents binding.
3. Build or request a source corpus map. Use `$source-corpus` when source authority, freshness, or contradictions matter.
4. Split the objective into bounded work units. Use `$work-unit` for ambiguous or multi-phase goals.
5. Choose a loop policy before starting work: sequential or parallel, retry limits, approval gates, budgets, goal update cadence, and blocker rules. Use `$loop-policy` when the policy is not obvious.
6. Build dossiers for the first implementation units and any planned verification, repair, or documentation threads. Use `$dossier-builder` when handing work to another agent or when the task has boundaries.
7. Assign worker roles with explicit allowed and forbidden behavior. Use `$worker-roles` for multi-agent or multi-thread work.
8. Select the execution path:
   - `human_in_loop`: use when the user asks to approve plans, the work is high-risk or irreversible without preauthorization, or autonomy is unclear.
   - `autonomous_goal`: use only when the user or environment explicitly authorizes autonomous goal execution and no higher-priority rule requires human approval.
9. Present the path-specific plan:
   - `human_in_loop`: approval packet with plan, work units, thread plan, approval gates, stop gates, and first dossiers. Stop until the human approves or revises it.
   - `autonomous_goal`: execution plan with the same contents plus autonomous boundaries, allowed actions, stop gates, repair limits, and final disposition policy. Continue after recording it when autonomy is authorized.
10. After the path gate is satisfied, create or hand off named threads from the thread plan. Send each worker only its role, dossier, sources, acceptance rows, stop gates, and report schema.
11. Talk to each worker thread after handoff: confirm receipt, answer scoped questions, collect terminal reports, and preserve report links or summaries in the supervisor state.
12. Verify independently where possible. Use `$acceptance-matrix` to map every requirement to evidence. Start verifier threads only after the relevant implementer report is available.
13. If verification FAILs, convert findings into repair tickets and route them to a repair-author or implementer repair thread. Do not expand scope during repair.
14. Re-run verification after repairs. Continue only until PASS, BLOCKED, repair limit, or path stop.
15. Start documenter threads only after source, implementation, verification, or repair evidence exists, unless the documenter is explicitly creating planning state.
16. If verification BLOCKs, report the blocker and stop or ask for the missing decision.
17. Use `$workflow-docs` to create or refresh reusable Markdown artifacts when the workflow must persist across context loss, agents, or sessions.
18. When all material acceptance rows are PASS or waived, apply the final disposition policy:
   - `human_in_loop`: ask the human to choose PR, push main, or keep local.
   - `autonomous_goal`: use the preauthorized final disposition if present; if not present, keep changes local and report the green state.
19. Finish with an outcome report that names execution path, goal status, sources, work units, worker threads, checks, skipped checks, residual risks, final disposition decision, and next action.

## Execution Paths

### Human-In-Loop

Use `human_in_loop` when the user requests approval, autonomy is unclear, sources are disputed, work is high-risk without safe autonomous boundaries, or the task includes irreversible actions without preauthorization, such as production deploys, direct main pushes, data migrations, external publication, paid operations, security-sensitive changes, legal/compliance decisions, credential handling, or destructive data changes.

The first supervisor deliverable is a plan for approval, not implementation. The approval packet must include:

- objective and non-goals
- source corpus summary and gaps
- work units and sequence
- thread plan with names, roles, dossiers, dependencies, and start conditions
- acceptance matrix summary
- approval gates and stop gates
- expected final disposition choices: PR, push main, or keep local

Stop until the human approves or revises the packet.

### Autonomous Goal

Use `autonomous_goal` only when the user or environment explicitly authorizes autonomous execution, such as "work autonomously until done", "run the full loop without waiting for me", or an equivalent goal policy. The autonomous plan must include:

- objective and non-goals
- source corpus summary and gaps
- work units and sequence
- thread plan with names, roles, dossiers, dependencies, and start conditions
- acceptance matrix summary
- autonomous boundaries and forbidden actions
- stop gates, repair limits, budgets, and escalation rules
- final disposition policy: `open_pr_when_green`, `push_main_when_green`, or `keep_local_when_green`

If final disposition is not preauthorized, default to `keep_local_when_green`. Direct push to the main branch requires explicit preauthorization. PR creation requires explicit preauthorization or a later human decision.

Even in `autonomous_goal`, stop and ask when required sources are missing, acceptance cannot be verified, a worker needs scope expansion, an irreversible action lacks preauthorization, or higher-priority instructions require approval.

## Thread Orchestration

After the path gate is satisfied, use environment thread tools when available. In Codex-style environments, use the configured thread-management tools to create or fork worker threads, send handoff messages, read reports, and hand off or close threads. If thread tools are unavailable, output the worker handoff prompts and mark execution as `thread_unavailable`.

Name threads deterministically from the workflow, unit, role, and dossier:

```text
wf/<workflow-slug>/<unit-id>-<role>-<dossier-slug>
```

Examples:

```text
wf/better-auth/U1-implementer-backend-auth-instance
wf/better-auth/U1-verifier-backend-auth-instance
wf/better-auth/U1-repair-auth-route-order
wf/better-auth/U6-documenter-auth-handoff
```

Use one thread per role per work unit unless the loop policy explicitly allows batching. Supervisor messages to worker threads must be scoped:

- kickoff: role, dossier, sources, acceptance rows, stop gates, report schema
- checkpoint: request status, blockers, or clarification without expanding scope
- repair handoff: failed rows, verifier findings, allowed repair surfaces, checks
- closeout: collect terminal report and confirm no further action is expected

Final disposition prompt shape:

```text
Verification is green and repair loops are closed. Choose one:
1. Open a PR
2. Push directly to main
3. Keep changes local
```

## Minimum Dossier Gate

Do not hand off or implement a work unit unless the dossier can name:

- objective and non-goals
- source corpus used and missing
- allowed and forbidden surfaces or artifacts
- acceptance matrix or acceptance draft
- required checks or evidence
- adversarial checks
- stop gates
- worker report schema
- thread name and role start condition when delegation is planned

Boundaries may be mutable artifacts, source claims, decisions, audiences, data fields, design areas, process steps, publication rights, or forbidden claims. For read-only advisory work, naming forbidden claims and decision limits can satisfy the boundary requirement.

If any item is unknown and material, stop and ask for the missing decision or mark the unit BLOCKED.

## Stop Gates

Stop when:

- source authority cannot be established
- sources contradict each other on a material requirement
- the requested scope cannot fit into a bounded work unit
- allowed and forbidden surfaces cannot be named
- acceptance cannot be verified with evidence
- a verifier is asked to edit or an implementer is asked to self-approve
- repair loops repeat without new evidence
- the user requires approval before continuing
- the selected path is `autonomous_goal` but autonomy was not explicitly authorized
- an irreversible action is requested without explicit preauthorization
- a worker thread asks to expand scope without supervisor or human approval
- final verification is not green and no waiver evidence exists

## Final Report Shape

Report:

- Status: PASS, FAIL, BLOCKED, or PARTIAL
- Execution path: autonomous_goal or human_in_loop
- Goal status and whether a Codex goal was created, reused, skipped, completed, or blocked
- Objective handled
- Sources used and gaps
- Work units completed or remaining
- Worker threads created, messaged, blocked, or skipped
- Verification evidence
- Repairs performed or recommended
- Checks run and skipped
- Residual risks
- Final disposition: PR, push main, keep local, or undecided
- Resume point or next action
