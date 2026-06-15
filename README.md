# Workflow Supervisor

Portable workflow skills for supervising complex agent work without turning the package into a full harness.

![Workflow Supervisor hero image showing the supervisor coordinating source corpus, work units, dossiers, roles, loop policy, acceptance, repair, workflow docs, and final outputs](assets/workflow-supervisor-hero.png)

Workflow Supervisor is an installable skill pack and small npm CLI for Codex and Claude Code. It is built for work that is too broad, risky, ambiguous, or long-running to trust to one ordinary prompt.

The package enforces a simple contract:

```text
complete intake
-> source grounding
-> bounded work units
-> DossierV1 preflight
-> one-shot worker delegation
-> WorkerReportV1 validation
-> verification, repair, and final disposition
```

It does not create a daemon, queue, mailbox, dashboard, or product-sized harness. The supervisor stays in the visible conversation; workers are short-lived CLI runs with bounded context.

## What It Solves

Use this pack when an agent needs to:

- ask and enforce complete intake before work starts
- split a broad goal into bounded work units
- create concrete worker dossiers with allowed and forbidden surfaces
- separate implementer, verifier, repair, and documenter roles
- run automated workers through Codex or Claude Code
- reject vague worker contracts before model calls happen
- require evidence-backed PASS, FAIL, or BLOCKED reports
- preserve resumable workflow state in Markdown artifacts

Do not use it for tiny edits, one-off commands, routine README wording, or tasks with clear files and clear acceptance criteria.

## Supported Targets

Automated worker delegation is certified for:

| Agent | Install target | Worker adapter |
|---|---|---|
| Codex | `~/.agents/skills` or `<project>/.agents/skills` | `codex exec --json --output-schema` |
| Claude Code | `${CLAUDE_HOME:-~/.claude}/skills` or `<project>/.claude/skills` | `claude -p --output-format json --json-schema` |

`generic` is supported only for Markdown instruction export into a custom directory. It is not a certified automated delegation adapter.

## How The Supervisor Runs

Using `$workflow-supervisor` loads instructions into the current agent. It does not automatically create threads, subagents, workers, goals, branches, commits, pull requests, deployments, or publications.

The current agent acts as the supervisor:

1. It asks the required intake questions.
2. It creates a source map, work units, loop policy, acceptance rows, and dossiers.
3. It validates each dossier.
4. It launches role-scoped workers only after the path gate is satisfied.
5. It reads one normalized report from each worker.
6. It routes verification failures into repair work.
7. It produces the final outcome report and disposition.

Workers do not talk to each other. Workers do not ask the human directly. If a worker needs a human decision, it returns `BLOCKED` and the supervisor asks the user.

## Intake Gate

The supervisor must ask every required intake item before planning deeply, binding a Codex goal, implementing, delegating workers, publishing, or taking irreversible action.

```text
Before I start the supervisor loop, answer every intake item:
1. Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work?
2. Execution path: autonomous_goal or human_in_loop?
3. Mode: sequential, parallel where safe, or staged parallel?
4. Delegation: automated worker delegation, native threads/subagents if available, or same-session phased?
5. Final disposition: keep local, open PR, push main, deploy/publish, or ask at the end?
6. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files?
7. State artifacts: create `.workflow/` docs, use another artifact directory, or keep state inline?
```

Keywords do not satisfy intake. A prompt like `use workflow-supervisor to migrate db from sqlite to LanceDB` gives an objective, but it does not authorize execution path, mutation boundaries, delegation, or final disposition.

## Worker Delegation

The portable worker command is:

```bash
workflow-supervisor delegate \
  --agent codex \
  --role implementer \
  --unit U1 \
  --cwd . \
  --dossier .workflow/dossiers/U1-implementer.yaml
```

The same command works for Claude Code:

```bash
workflow-supervisor delegate \
  --agent claude-code \
  --role verifier \
  --unit U1 \
  --cwd . \
  --dossier .workflow/dossiers/U1-verifier.yaml
```

Each worker receives only its role, unit, dossier, sources, acceptance rows, stop gates, and report schema. It does not inherit the full user conversation.

## DossierV1 Gate

No valid dossier, no worker.

Before delegation, validate the worker contract:

```bash
workflow-supervisor validate-dossier .workflow/dossiers/U1-implementer.yaml \
  --role implementer \
  --unit U1 \
  --json
```

`validate-dossier` accepts JSON, YAML, or fenced YAML in Markdown. It rejects:

- missing required fields
- placeholders such as `TBD`, `unknown`, `as needed`, or `use your judgment`
- broad mutable surfaces such as `all files`, `entire repo`, or `*`
- missing forbidden surfaces
- unresolved open questions
- role or unit mismatches
- missing acceptance rows
- worker prompts that do not require `WorkerReportV1`

`delegate` runs this preflight automatically when `--dossier` is provided. If the dossier is missing or invalid, it returns a normalized `BLOCKED` report with `reason: invalid_dossier`, and no worker process starts.

## WorkerReportV1

Every worker result is normalized into `WorkerReportV1`:

```json
{
  "schema": "WorkerReportV1",
  "status": "PASS",
  "role": "verifier",
  "unit_id": "U1",
  "summary": "Verified LanceDB search path.",
  "changed_surfaces": [],
  "evidence": ["pytest tests/test_search.py passed"],
  "checks_run": ["pytest tests/test_search.py"],
  "skipped_checks": [],
  "findings": [],
  "blocking_question": null,
  "next_action": "supervisor_review",
  "adapter": null,
  "guard": null,
  "reason": null
}
```

The wrapper rejects invalid worker output, PASS without evidence, verifier file mutations, forbidden-surface changes, timeouts, auth failures, and non-zero PASS results.

## Example Lifecycle

For a request like:

```text
Use workflow-supervisor to migrate db from sqlite to LanceDB.
```

The correct first action is intake, not implementation. After the user answers every intake item, the supervisor can proceed:

1. Source map: find SQLite imports, data access code, migrations, tests, and LanceDB requirements.
2. Work units: split into dependency/config, storage adapter, migration path, tests, and docs.
3. Acceptance matrix: define evidence for each unit.
4. Dossiers: create `DossierV1` contracts for implementer and verifier workers.
5. Delegation: run Codex or Claude Code workers through `workflow-supervisor delegate`.
6. Verification: reject unsupported PASS reports and route FAIL into repair.
7. Documentation: update `.workflow/` and project docs after evidence exists.
8. Final disposition: keep local, open PR, push, deploy, publish, or ask at end based only on intake.

## Install

From a local checkout:

```bash
git clone https://github.com/NikolaCehic/workflow-supervisor.git
cd workflow-supervisor
npm run validate
node ./bin/workflow-skills.mjs install --agent codex --scope user
```

After npm publication:

```bash
npx workflow-supervisor install --agent codex --scope user
npx workflow-supervisor install --agent claude-code --scope user
```

Project-local install:

```bash
npx workflow-supervisor install --agent all --scope project --project .
```

Generic Markdown export:

```bash
npx workflow-supervisor emit-context \
  --agent generic \
  --skills workflow-supervisor,workflow-docs \
  --out AGENTS.md
```

## CLI

```bash
workflow-supervisor list
workflow-supervisor validate
workflow-supervisor validate-dossier .workflow/dossiers/U1.yaml --role implementer --unit U1 --json
workflow-supervisor doctor --agent codex
workflow-supervisor install --agent all --scope project --project .
workflow-supervisor emit-context --agent generic --out AGENTS.md
workflow-supervisor delegate --agent codex --role implementer --unit U1 --dossier .workflow/dossiers/U1.yaml
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

See [docs/cli.md](docs/cli.md) for the full command reference.

## Included Skills

| Skill | Purpose |
|---|---|
| `$workflow-supervisor` | Coordinates intake, work units, delegation, verification, repair, docs, goal state, and final disposition. |
| `$source-corpus` | Ranks and reconciles sources of truth. |
| `$work-unit` | Decomposes broad objectives into bounded units. |
| `$dossier-builder` | Builds concrete `DossierV1` worker contracts. |
| `$worker-roles` | Separates implementer, verifier, repair, documenter, reviewer, and synthesis responsibilities. |
| `$acceptance-matrix` | Defines evidence-backed PASS, FAIL, BLOCKED, and waiver criteria. |
| `$loop-policy` | Defines retry limits, approval gates, parallel safety, budgets, and stop rules. |
| `$workflow-docs` | Creates durable workflow and documentation-production artifacts. |

## Workflow Artifacts

When state needs to survive compaction, handoff, or another session, use `.workflow/`:

```text
.workflow/WORKFLOW.md
.workflow/SOURCE-CORPUS.md
.workflow/WORK-UNITS.md
.workflow/DOSSIER.md
.workflow/WORKER-MAP.md
.workflow/ACCEPTANCE-MATRIX.md
.workflow/VERIFICATION-REPORT.md
.workflow/REPAIR-TICKETS.md
.workflow/DECISIONS.md
.workflow/HANDOFF.md
.workflow/OUTCOME.md
.workflow/GOAL-STATE.md
```

Documentation-production workflows can also use briefs, inventories, outlines, drafts, claims registers, style guides, glossaries, review plans, publishing checklists, and maintenance plans.

## Validation

Run the package checks before publishing or installing from a checkout:

```bash
npm run validate
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

The current validation suite covers intake enforcement, adapter narrowing, `WorkerReportV1`, `DossierV1`, vague-dossier rejection, missing CLI handling, auth-looking failures, verifier mutation guards, and live adapter probes.

## Repository Layout

```text
skills/      production skill folders
adapters/    Codex and Claude Code adapter metadata
schemas/     DossierV1 and WorkerReportV1 schemas
bin/         workflow-supervisor CLI
docs/        compatibility, CLI, and delegation documentation
tests/       lifecycle and delegate-gate tests
```

## Status

The package is ready for local installation and explicit skill invocation. Keep implicit invocation disabled unless your environment has proven routing precision for these skills.
