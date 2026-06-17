# Workflow Supervisor

Workflow Supervisor is a strict supervision skill pack for agent work that needs to stay organized, resumable, and evidence-backed.

It is for moments when you do not want an agent to jump straight into implementation, lose the thread halfway through, verify its own work, or quietly skip important handoffs. You ask for the supervisor, the supervisor asks the right setup questions, turns the work into small units, creates worker dossiers, delegates scoped work to real worker agents when possible, verifies the results, and leaves a clear outcome trail.

Example prompt:

```text
Use $workflow-supervisor to build a FastAPI Naive RAG demo for a healthcare specialist agent.
```

The correct first response is not code. The correct first response is an intake packet. That is intentional.

![Workflow Supervisor hero image showing the supervisor coordinating source corpus, work units, dossiers, roles, loop policy, acceptance, repair, workflow docs, and final outputs](assets/workflow-supervisor-hero.png)

## What You Get

Workflow Supervisor gives you a repeatable workflow for serious agent tasks:

- a complete intake before work starts
- a source map, even when the only source is the user prompt
- bounded work units, including `WU-001` for tiny tasks
- dossiers that tell each worker exactly what to do and what not to touch
- separate implementer, verifier, repair, and documenter responsibilities
- structured worker reports instead of loose prose
- evidence-based verification
- repair loops that stay tied to failed acceptance rows
- durable `.workflow/` state when the work needs to survive context loss
- a final report with checks, risks, workers, and next actions

The main design choice is simple: the supervisor coordinates, workers do scoped work, and the CLI stays small.

## The Mental Model

Think of Workflow Supervisor as a project lead inside the current agent conversation.

The supervisor:

- asks the user for missing decisions
- decides when work is ready to start
- creates the plan, units, dossiers, and acceptance rows
- hands work to role-specific workers
- reads worker reports
- routes blockers and repairs
- decides when verification is good enough
- applies the final disposition policy

Workers:

- receive one scoped dossier
- perform one role
- return one structured report
- do not talk to the human directly
- do not choose final disposition
- do not message each other

The CLI:

- installs the skills
- validates skill and schema files
- validates `DossierV1`
- invokes one worker process
- validates `WorkerReportV1`
- returns a normalized report to the supervisor

It is not a daemon, queue, dashboard, scheduler, or full agent harness.

```mermaid
flowchart TB
  User["User"] --> Supervisor["Supervisor agent in the current chat"]
  Supervisor --> Intake["Complete intake"]
  Supervisor --> Sources["Source corpus"]
  Supervisor --> Units["Work units"]
  Supervisor --> Matrix["Acceptance matrix"]
  Supervisor --> Dossiers["DossierV1 files"]
  Supervisor --> CLI["workflow-supervisor CLI"]
  CLI --> Codex["Codex worker"]
  CLI --> Claude["Claude Code worker"]
  Codex --> Report["WorkerReportV1"]
  Claude --> Report
  Report --> Supervisor
  Supervisor --> Docs[".workflow/ state"]
  Supervisor --> Outcome["Final report"]
```

## What Happens When You Invoke It

When you explicitly invoke `workflow-supervisor`, `$workflow-supervisor`, or say to use the skill, the workflow enters `strict_full_workflow`.

Strict mode means task size does not matter. Even if the request is "make a function that adds two numbers", explicit supervisor invocation still means the full workflow:

1. Ask the complete intake packet.
2. Build or record the source corpus.
3. Create at least one work unit.
4. Create acceptance rows.
5. Create dossiers for the planned workers.
6. Create a worker-agent plan.
7. Ask for approval when the selected path is human-in-loop.
8. Delegate scoped work to real workers when the environment supports it.
9. Verify with evidence.
10. Route repair work if verification fails.
11. Refresh docs or outcome state.
12. Report final status and next action.

This rule exists to prevent the agent from deciding that a task is "too simple" and quietly skipping the supervisor.

## Intake

The supervisor must get explicit answers to these seven items before planning deeply, creating a goal, delegating workers, implementing, publishing, or taking irreversible action:

```text
1. Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work?
2. Execution path: autonomous_goal or human_in_loop?
3. Mode: sequential, parallel where safe, or staged parallel?
4. Delegation: automated worker delegation, native threads/subagents if available, or same-session phased?
5. Final disposition: keep local, open PR, push main, deploy/publish, or ask at the end?
6. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files?
7. State artifacts: create .workflow docs, use another artifact directory, or keep state inline?
```

If any answer is missing or vague, the supervisor asks only for the missing pieces and stops. Phrases like "work autonomously", "just do it", or "use your judgment" do not fill in the missing intake fields.

Expected human pauses are normal. A workflow can move from `WAITING_FOR_HUMAN` back to `ACTIVE` after the user approves a plan or answers a blocker question.

## The Workflow

The full loop looks like this:

```text
complete intake
-> source corpus
-> work units
-> loop policy
-> acceptance matrix
-> dossiers
-> approval or autonomous path gate
-> worker handoff
-> worker report
-> verification
-> repair if needed
-> re-verification
-> documentation
-> final disposition
```

The worker lifecycle is tracked separately:

```text
planned -> handed_off -> acknowledged -> reported -> verified -> closed
```

This makes it possible to see where the workflow is, which worker owns which piece, what evidence exists, and what should happen next.

## Skills In The Pack

The skill pack is made of small focused skills. The supervisor can use them as phase instructions.

| Skill | What it does |
|---|---|
| `workflow-supervisor` | Coordinates the whole workflow, gates, workers, verification, repair, and final disposition. |
| `source-corpus` | Lists and ranks sources, gaps, contradictions, authority, freshness, and allowed next action. |
| `work-unit` | Turns the objective into bounded units with dependencies, surfaces, readiness, and done criteria. |
| `loop-policy` | Defines execution path, mode, approval gates, repair limits, budgets, goal policy, and resume behavior. |
| `acceptance-matrix` | Turns requirements into evidence rows with PASS, FAIL, BLOCKED, and waiver handling. |
| `dossier-builder` | Creates concrete `DossierV1` contracts for workers. |
| `worker-roles` | Defines role boundaries so implementers, verifiers, repair authors, and documenters do not blur together. |
| `workflow-docs` | Creates or refreshes durable `.workflow/` artifacts when state needs to persist. |

Loading a skill does not spawn a worker. A skill is instruction context for the current supervisor. A worker is a separate role-scoped execution run.

## Files The Workflow Creates

Workflow state lives under `.workflow/` by default. The directory is local supervisor memory, not product code.

In a Git-backed project, `.workflow/` must be in `.gitignore` before these files are written. Project installs do this automatically.

Common workflow files:

| File | Created from | Purpose |
|---|---|---|
| `.workflow/WORKFLOW.md` | `workflow-supervisor`, `loop-policy`, `workflow-docs` | Main state, objective, execution path, policy, stop gates, next action. |
| `.workflow/SOURCE-CORPUS.md` | `source-corpus`, `workflow-docs` | Source ranking, missing sources, contradictions, assumptions. |
| `.workflow/WORK-UNITS.md` | `work-unit`, `workflow-docs` | Unit list, dependencies, sequencing, blocked units. |
| `.workflow/DOSSIER.md` or `.workflow/dossiers/*.yaml` | `dossier-builder`, `workflow-docs` | Worker contracts for implementation, verification, repair, or documentation. |
| `.workflow/WORKER-MAP.md` | `workflow-supervisor`, `worker-roles`, `workflow-docs` | Worker names, roles, transports, lifecycle, reports, blockers. |
| `.workflow/ACCEPTANCE-MATRIX.md` | `acceptance-matrix`, `workflow-docs` | Evidence rows and material PASS, FAIL, BLOCKED states. |
| `.workflow/VERIFICATION-REPORT.md` | verifier worker, `acceptance-matrix`, `workflow-docs` | Verification evidence, findings, skipped checks, residual risks. |
| `.workflow/REPAIR-TICKETS.md` | repair worker, `workflow-docs` | Repair tasks tied to failed rows or verifier findings. |
| `.workflow/DECISIONS.md` | supervisor, `workflow-docs` | User decisions, assumptions, reversals, unresolved questions. |
| `.workflow/HANDOFF.md` | supervisor, `workflow-docs` | Resume pack for another agent or later session. |
| `.workflow/OUTCOME.md` | supervisor, documenter worker, `workflow-docs` | Final status, checks, risks, disposition, next action. |
| `.workflow/GOAL-STATE.md` | supervisor, `workflow-docs` | Codex goal mirror when goal state needs durable backup. |

For documentation-heavy workflows, `workflow-docs` can also create:

```text
.workflow/DOCUMENTATION-BRIEF.md
.workflow/CONTENT-INVENTORY.md
.workflow/OUTLINE.md
.workflow/CONTENT-DRAFT.md
.workflow/CLAIMS-REGISTER.md
.workflow/STYLE-GUIDE.md
.workflow/GLOSSARY.md
.workflow/ASSET-REGISTER.md
.workflow/REVIEW-PLAN.md
.workflow/REVISION-QUEUE.md
.workflow/PUBLISHING-CHECKLIST.md
.workflow/PUBLICATION-LOG.md
.workflow/MAINTENANCE-PLAN.md
```

It should not create all of these by default. It should create the smallest useful set.

## Dossiers

A dossier is the worker contract. It is how the supervisor prevents vague delegation.

Before any worker starts, the supervisor creates a concrete `DossierV1` with:

- workflow name
- work unit
- dossier id
- worker name
- worker role
- delegation transport
- start condition
- objective and non-goals
- source corpus and must-read sources
- allowed surfaces
- forbidden surfaces
- acceptance rows
- adversarial checks
- required commands or evidence
- worker prompt
- supervisor checkpoints
- report schemas
- stop gates
- assumptions
- open questions

Validate a dossier before delegation:

```bash
workflow-supervisor validate-dossier .workflow/dossiers/WU-001-implementer.yaml --role implementer --unit WU-001 --json
```

The validator rejects things like `TBD`, `unknown`, `all files`, `entire repo`, unresolved open questions, role mismatches, unit mismatches, missing forbidden surfaces, and prompts that do not require `WorkerReportV1`.

## Workers

The required worker responsibilities are:

| Responsibility | CLI role value | What it does |
|---|---|---|
| Implementer | `implementer` | Changes only the allowed surfaces named in the dossier. |
| Verifier | `verifier` | Checks the work against acceptance rows and must not edit implementation. |
| Repair author | `repair` | Converts failed rows or verifier findings into actionable repair work. |
| Documenter | `documenter` | Updates workflow or outcome docs from evidence. |

The skill text may say "repair-author" because that is the human role. The CLI schema uses `repair`.

Workers receive only their scoped handoff:

- role
- dossier
- sources
- acceptance rows
- stop gates
- report schema

They return one terminal `WorkerReportV1`.

## Worker Reports

Every delegated worker returns this machine-shaped report:

```json
{
  "schema": "WorkerReportV1",
  "status": "PASS",
  "role": "verifier",
  "unit_id": "WU-001",
  "summary": "Verified the API responses and retrieval behavior against the acceptance rows.",
  "changed_surfaces": [],
  "evidence": ["pytest tests/test_api.py passed", "manual inspection of /health response"],
  "checks_run": ["pytest tests/test_api.py"],
  "skipped_checks": [],
  "findings": [],
  "blocking_question": null,
  "next_action": "supervisor_review",
  "adapter": null,
  "guard": null,
  "reason": null
}
```

The supervisor trusts the report shape, not loose prose. A PASS without evidence is invalid. A verifier that edits implementation is invalid. A worker that asks the human directly is converted into a blocker for the supervisor to route.

## How The Supervisor Talks To Workers

The portable worker path is one CLI command:

```bash
workflow-supervisor delegate \
  --agent <codex|claude-code> \
  --role <implementer|verifier|repair|documenter> \
  --unit <unit-id> \
  --cwd <workspace> \
  --dossier <path>
```

The command:

1. Validates the dossier as `DossierV1`.
2. Builds a scoped worker prompt.
3. Starts the selected agent CLI with an adapter command array.
4. Captures stdout, stderr, exit code, and timeout.
5. Extracts and validates `WorkerReportV1`.
6. Runs surface and role guards.
7. Prints one normalized JSON report for the supervisor.

Certified worker adapters:

- `codex`
- `claude-code`

The `generic` target is for Markdown instruction export. It is not a certified automated worker adapter.

Check local adapter readiness:

```bash
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

If a worker adapter is missing, unauthenticated, times out, returns invalid output, edits forbidden surfaces, or returns PASS without evidence, the delegate command returns a structured `BLOCKED` report.

## No Silent Fallbacks

If the environment can create, message, or delegate to worker agents, the supervisor must use real workers for implementation, verification, repair, and documentation responsibilities.

If it cannot, it must record:

```text
worker_agent_unavailable
```

Then it must stop for a human decision unless complete intake explicitly selected `same_session_phased`.

Same-session phased work is allowed only when selected. Verification in that mode is a `self-check`, not an `independent-verifier`.

## Install

Install from npm once published:

```bash
npm install -g workflow-supervisor
workflow-supervisor validate
```

Use with `npx`:

```bash
npx workflow-supervisor list
```

Install skills for Codex:

```bash
npx workflow-supervisor install --agent codex --scope user
```

Install skills for Claude Code:

```bash
npx workflow-supervisor install --agent claude-code --scope user
```

Install both certified targets into a project:

```bash
npx workflow-supervisor install --agent all --scope project --project .
```

Project installs copy the skill folders into project-level agent directories and ensure the target project `.gitignore` contains:

```gitignore
.workflow/
```

From a local checkout:

```bash
git clone https://github.com/NikolaCehic/workflow-supervisor.git
cd workflow-supervisor
npm install
npm run validate
```

## Basic Use

After installing the skills, ask your agent:

```text
Use $workflow-supervisor to implement a healthcare specialist FastAPI Naive RAG demo.
```

You should expect:

1. The supervisor asks the complete intake packet.
2. You answer every intake item.
3. If the path is `human_in_loop`, the supervisor gives you an approval packet before implementation.
4. The supervisor creates work units, acceptance rows, and dossiers.
5. The supervisor delegates scoped work to workers when supported.
6. Workers return structured reports.
7. The supervisor verifies, routes repairs if needed, and gives you the final result.

If you only want a normal quick edit, do not invoke `$workflow-supervisor`.

## CLI Reference

Common commands:

```bash
workflow-supervisor list
workflow-supervisor validate
workflow-supervisor doctor --agent all
workflow-supervisor install --agent codex --scope user
workflow-supervisor install --agent claude-code --scope user
workflow-supervisor install --agent all --scope project --project .
workflow-supervisor emit-context --agent generic --out AGENTS.md
workflow-supervisor validate-dossier .workflow/dossiers/WU-001-implementer.yaml --role implementer --unit WU-001 --json
workflow-supervisor delegate --agent codex --role implementer --unit WU-001 --cwd . --dossier .workflow/dossiers/WU-001-implementer.yaml
workflow-supervisor delegate --agent claude-code --role verifier --unit WU-001 --cwd . --dossier .workflow/dossiers/WU-001-verifier.yaml
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

The package exposes two binary names:

```text
workflow-supervisor
workflow-skills
```

`workflow-skills` is kept as an alias. Prefer `workflow-supervisor` in user-facing instructions.

## Codex, Claude Code, And Generic Targets

Codex support uses:

- `SKILL.md`
- `agents/openai.yaml`
- the `codex` CLI adapter for delegated workers

Claude Code support uses:

- the same `SKILL.md` folders
- the `claude` CLI adapter for delegated workers
- optional emitted context through `CLAUDE.md`

The presence of `agents/openai.yaml` does not mean Claude Code is unsupported. It only means Codex has a specific metadata format.

Generic support is for custom Markdown-reading agent setups:

```bash
npx workflow-supervisor emit-context --agent generic --skills workflow-supervisor,workflow-docs --out AGENTS.md
```

Generic is not a certified worker delegation target.

## Package Layout

```text
skills/                  Skill instructions
skills/*/agents/          Agent metadata, including Codex openai.yaml files
schemas/                 DossierV1 and WorkerReportV1 schemas
adapters/                Codex and Claude Code delegate command arrays
docs/                    CLI, artifact, compatibility, and troubleshooting docs
assets/                  README image assets
bin/workflow-skills.mjs  Installer, validator, delegation wrapper, and command dispatch
```

The npm package includes:

```text
skills
adapters
schemas
docs
assets
bin
README.md
LICENSE
```

## Publishing Checklist

Before publishing:

```bash
npm run validate
npm pack --dry-run
```

`npm run validate` checks skill structure, adapter metadata, schema artifacts, and the test suite.

`npm pack --dry-run` shows exactly what will be included in the npm package.

The package also has:

- `prepublishOnly`: runs `npm run validate`
- `engines.node`: `>=18`
- `license`: `MIT`
- `bin.workflow-supervisor`: `bin/workflow-skills`
- `bin.workflow-skills`: `bin/workflow-skills`

## Rules For Agents Reading This README

If you are an agent using this package:

1. Do not start work before complete intake.
2. Do not infer missing permissions from words like "autonomous", "generate", or "work until done".
3. If `$workflow-supervisor` is explicit, always create at least one work unit.
4. Do not delegate without a valid `DossierV1`.
5. Use separate worker agents when supported by the environment.
6. Do not silently collapse worker agents into same-session roleplay.
7. Treat same-session verification as `self-check`, not `independent-verifier`.
8. Trust only structured `WorkerReportV1` results from delegated workers.
9. Treat verifier edits as invalid.
10. Keep `.workflow/` ignored and local unless the user explicitly asks to publish it.

The promise is not magic autonomy. The promise is disciplined supervision: clear setup, bounded work, scoped workers, structured reports, evidence, repair, and a clean final handoff.
