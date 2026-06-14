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

This skill is loop-oriented. Complete intake is mandatory before goal binding. After all required intake decisions are answered, bind the workflow to a Codex goal only when the completed intake and governing environment both authorize goal-oriented work.

Use this lifecycle:

1. Confirm the complete intake gate is satisfied. If any required intake answer is missing or ambiguous, ask for the missing answer(s) and stop.
2. Call `get_goal` or the environment's equivalent.
3. Classify goal state: `none`, `active relevant`, `active unrelated`, `complete old`, `blocked old`, or `tool unavailable`.
4. If an active relevant goal exists, reuse it.
5. If an active unrelated goal exists, do not create, reuse, complete, block, or update it. Ask the user whether to switch goals or continue with goal binding skipped.
6. If no active goal exists and completed intake authorizes goal binding, call `create_goal` at most once with a concrete objective.
7. Do not create a goal for simple single-turn answers, ordinary scoped edits, tiny tasks, incomplete intake, or when the user says not to.
8. Keep the goal objective stable. Track tactical steps in the plan, dossier, workflow docs, or `.workflow/GOAL-STATE.md` rather than trying to rewrite the goal.
9. Use `update_goal` only for terminal `complete` or `blocked` states when the environment supports that action.
10. Mark the goal complete only after acceptance evidence supports completion and no required supervisor work remains.
11. Distinguish workflow/unit BLOCKED from Codex goal blocked. Mark a Codex goal blocked only after the same material blocker repeats across the required consecutive goal turns and no meaningful progress remains.
12. On resume after compaction or handoff, read the active goal first, then reconcile workflow docs and current artifacts.

If the environment has no goal tool or goal creation is not permitted, state the intended goal objective in the supervisor report and continue with workflow docs or another state artifact as the fallback state container.

## Operating Contract

- After complete intake, ground the workflow in sources before creating work units.
- Treat skill use as instruction loading in the current agent, not as thread, subagent, goal, branch, commit, PR, publication, or other side-effect creation.
- Run the complete intake gate before goal creation, thread creation, implementation, publication, or other irreversible action.
- Do not infer execution path, mode, delegation, final disposition, or boundaries from keywords, action verbs, or intent guesses.
- Classify the workflow as `autonomous_goal` or `human_in_loop` only from completed intake answers before spawning threads or beginning implementation.
- Always produce a plan after complete intake. In `human_in_loop`, make it an approval packet and stop for approval. In `autonomous_goal`, make it an execution plan and continue only when the completed intake authorizes that path.
- Do not begin implementation until complete intake and the path gate are satisfied, at least one concrete dossier exists, and no stop gate applies.
- Spawn worker threads only when the environment supports threads and complete intake plus the path gate authorize delegation; otherwise emit handoff prompts or workflow docs as the fallback.
- Do not start implementer, verifier, repair-author, or documenter threads before complete intake and the path gate are satisfied; role-specific start conditions are additional gates after that.
- Keep roles separate: implementers implement, verifiers verify, repair authors write tickets, documenters update workflow artifacts, and the supervisor coordinates.
- Treat same-thread verification as a self-check, not independent verification.
- Prefer explicit PASS/FAIL/BLOCKED states over soft completion language.
- Stop instead of improvising when sources are missing, contradictory, materially stale, or too vague to produce acceptance criteria.
- Keep provenance optional; require enough outcome detail for another agent to resume.
- Treat companion skills as optional phase tools, not an automatic cascade. Use the smallest set needed for the current risk.

## Skills, Threads, And Subagents

Using this skill does not spawn a thread or subagent. It coordinates the current agent until a separate execution mechanism is explicitly available and authorized.

Treat these as distinct mechanisms:

- Skill: reusable instructions loaded into the current agent.
- Worker thread: a separate environment-managed conversation or task created with thread tools when allowed.
- Subagent: a separate worker execution mechanism when the environment exposes one.
- Handoff prompt: a ready-to-send worker brief used when thread or subagent tools are unavailable or not approved.

Start worker threads or subagents only after complete intake and the path gate are satisfied, a concrete dossier exists, the loop policy authorizes delegation, and the environment allows the tool. If environment rules require explicit user approval for user-visible thread creation, obtain it before creating threads. Otherwise, output scoped handoff prompts and mark execution as `thread_unavailable` or `delegation_unavailable`.

## Intake Gate

Every supervisor invocation must pass the complete intake gate before creating a goal, decomposing deeply, spawning workers, implementing, publishing, or taking irreversible action. If the current conversation already contains explicit answers to every required intake decision, record those answers and proceed. Otherwise, ask the intake packet and stop.

Do not use keywords to skip intake. Words such as "autonomous", "agent loop", "work until done", "approval", "generate", or "create" are not substitutes for completed intake answers.

Required intake decisions:

- Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work.
- Execution path: `autonomous_goal` or `human_in_loop`.
- Execution mode: `sequential`, `parallel_where_safe`, or `staged_parallel`.
- Delegation: `same_thread_only`, `use_threads_or_subagents_if_available`, or `handoff_prompts_only`.
- Final disposition: `keep_local_when_green`, `open_pr_when_green`, `push_main_when_green`, `deploy_when_green`, `publish_when_green`, or `ask_at_end`.
- Mutation boundaries: local files, dependency installs, network calls, external services, credentials, destructive operations, and any forbidden surfaces.
- State artifacts: whether to create workflow docs under `<workspace>/.workflow/`, use another named artifact directory, or keep state inline.

Use this question shape for the first intake ask:

```text
Before I start the supervisor loop, answer every intake item:
1. Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work?
2. Execution path: autonomous_goal or human_in_loop?
3. Mode: sequential, parallel where safe, or staged parallel?
4. Delegation: same-thread only, use threads/subagents if available, or handoff prompts only?
5. Final disposition: keep local, open PR, push main, deploy/publish, or ask at the end?
6. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files?
7. State artifacts: create `.workflow/` docs, use another artifact directory, or keep state inline?
```

If the user answers only some intake items, ask only the unanswered or ambiguous item(s) again and stop. If the user says "use your judgment", treat that item as unanswered; do not substitute defaults. Continue prompting until every required intake decision has an explicit user answer.

Treat `autonomous_goal`, PR creation, direct push, deploy, publication, paid operations, production data changes, and credential use as satisfied only by completed intake answers, not by keywords elsewhere in the prompt.

Negative example: "Using Workflow Supervisor, generate an API and create the project" is not autonomous authorization and is not complete intake. It names the supervisor and objective, but leaves required intake decisions unresolved. Ask the complete intake packet and stop before implementation.

## Supervisor Loop

1. Run the complete intake gate. Record explicit user answers. If any required intake answer is missing, vague, or delegated to judgment, ask for the unresolved item(s) and stop.
2. Restate the objective, constraints, non-goals, known sources, and unknowns from the completed intake.
3. Bind or reconcile the Codex goal only after complete intake and only when no unrelated active goal prevents binding.
4. Build or request a source corpus map. Use `$source-corpus` when source authority, freshness, or contradictions matter.
5. Split the objective into bounded work units. Use `$work-unit` for ambiguous or multi-phase goals.
6. Choose a loop policy before starting work: sequential or parallel, retry limits, approval gates, budgets, goal update cadence, and blocker rules. Use `$loop-policy` when the policy is not obvious.
7. Build dossiers for the first implementation units and any planned verification, repair, or documentation threads. Use `$dossier-builder` when handing work to another agent or when the task has boundaries.
8. Assign worker roles with explicit allowed and forbidden behavior. Use `$worker-roles` for multi-agent or multi-thread work.
9. Select the execution path:
   - `human_in_loop`: use when selected in completed intake or when a higher-priority rule requires human approval after intake.
   - `autonomous_goal`: use only when selected in completed intake and no higher-priority rule requires human approval.
10. Present the path-specific plan:
   - `human_in_loop`: approval packet with plan, work units, thread plan, approval gates, stop gates, and first dossiers. Stop until the human approves or revises it.
   - `autonomous_goal`: execution plan with the same contents plus autonomous boundaries, allowed actions, stop gates, repair limits, and final disposition policy. Continue after recording it only when complete intake authorized that path.
11. After the path gate is satisfied, create or hand off named threads from the thread plan. Send each worker only its role, dossier, sources, acceptance rows, stop gates, and report schema.
12. Talk to each worker thread after handoff: confirm receipt, answer scoped questions, collect terminal reports, and preserve report links or summaries in the supervisor state.
13. Verify independently where possible. Use `$acceptance-matrix` to map every requirement to evidence. Start verifier threads only after the relevant implementer report is available.
14. If verification FAILs, convert findings into repair tickets and route them to a repair-author or implementer repair thread. Do not expand scope during repair.
15. Re-run verification after repairs. Continue only until PASS, BLOCKED, repair limit, or path stop.
16. Start documenter threads only after source, implementation, verification, or repair evidence exists, unless the documenter is explicitly creating planning state.
17. If verification BLOCKs, report the blocker and stop or ask for the missing decision.
18. Use `$workflow-docs` to create or refresh reusable Markdown artifacts under `<workspace>/.workflow/` when the workflow must persist across context loss, agents, or sessions.
19. When all material acceptance rows are PASS or waived, apply the final disposition policy:
   - `human_in_loop`: use the completed intake final disposition; if it is `ask_at_end`, ask the human to choose PR, push main, or keep local.
   - `autonomous_goal`: use the completed intake final disposition. If it is `ask_at_end`, stop and ask before taking any final disposition action.
20. Finish with an outcome report that names execution path, goal status, sources, work units, worker threads, checks, skipped checks, residual risks, final disposition decision, and next action.

## Execution Paths

### Human-In-Loop

Use `human_in_loop` when the completed intake selects it, or when a higher-priority rule requires human approval after intake. If the user has not answered the execution-path intake item, stop and ask for that answer instead of inferring a path.

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

Use `autonomous_goal` only when the completed intake selects it. Phrases such as "work autonomously until done", "run the full loop without waiting for me", or "do not wait" do not skip the required intake packet. The autonomous plan must include:

- objective and non-goals
- source corpus summary and gaps
- work units and sequence
- thread plan with names, roles, dossiers, dependencies, and start conditions
- acceptance matrix summary
- autonomous boundaries and forbidden actions
- stop gates, repair limits, budgets, and escalation rules
- final disposition policy: `open_pr_when_green`, `push_main_when_green`, or `keep_local_when_green`

The final disposition must come from the completed intake. Direct push to the main branch, PR creation, deploy, publication, paid operations, production data changes, credential use, and destructive operations require explicit answers in the relevant intake fields.

Even in `autonomous_goal`, stop and ask when any required intake answer is missing or ambiguous, required sources are missing, acceptance cannot be verified, a worker needs scope expansion, an irreversible action lacks intake authorization, or higher-priority instructions require approval.

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

- any required intake answer is missing, vague, delegated to judgment, or contradicted by another intake answer
- source authority cannot be established
- sources contradict each other on a material requirement
- the requested scope cannot fit into a bounded work unit
- allowed and forbidden surfaces cannot be named
- acceptance cannot be verified with evidence
- a verifier is asked to edit or an implementer is asked to self-approve
- repair loops repeat without new evidence
- the user requires approval before continuing
- the selected path is `autonomous_goal` but it was inferred from prompt wording instead of a completed intake answer
- an irreversible action is requested without explicit authorization in the completed intake
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
