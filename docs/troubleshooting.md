# Troubleshooting

## A Strong Prompt Is Enough

Skip Workflow Supervisor for a small, clear task that one model can implement and verify. V1 is not intended to add ceremony to every edit. If explicitly invoked, the skill should choose `direct` and create no artifact.

## The Skill Is Not Discovered

Inspect the managed install:

```bash
workflow-supervisor doctor --agent codex --require-pass
workflow-supervisor doctor --agent claude-code --require-pass
```

For a custom directory:

```bash
workflow-supervisor doctor --agent generic --target ./agent-skills --require-pass
```

The target must contain `workflow-supervisor/SKILL.md`, `WORKFLOW_SKILL_PACK.md`, and a valid `.workflow-skills-install.json`. If native discovery is unavailable, use `emit-context` instead.

## GitHub Shows v1 But npm Does Not

GitHub and npm are separate release surfaces:

```bash
npm view workflow-supervisor version
workflow-supervisor --version
```

Use the current repository source until the registry reports the intended version. Do not infer npm publication from a GitHub tag or changelog entry.

## Node Reports An Unsupported Engine

V1 requires Node.js 22 or newer:

```bash
node --version
```

Upgrade the runtime used by both installation and execution. A different Node on `PATH` can explain why source tests pass in one shell but a global CLI fails in another.

## Context Is Too Large

Measure it:

```bash
workflow-supervisor context-budget --profile direct
workflow-supervisor context-budget --profile tracked
workflow-supervisor context-budget --profile delegated
```

Use `direct` when no route reference is needed. Avoid `emit-context --include-references` unless the receiving agent cannot load a needed reference later. Token counts are estimates; byte counts are exact.

## An 0.x Install Still Has Eight Skills

Preview the owned migration:

```bash
workflow-supervisor upgrade --agent all --scope project --project . --dry-run
```

Upgrade requires a valid install manifest. Modified legacy skill directories block so they are not silently deleted. Back up intentional changes, review the destination, and use `--force` only when replacement is intended.

If a legacy directory exists but is not manifest-owned, `doctor` reports an orphan. Move or remove it manually after review; do not let the CLI assume ownership.

## Contract Validation Fails

Run the standalone validator:

```bash
workflow-supervisor validate-contract .workflow/contracts/U1.json --json
```

Common causes:

- YAML was used; `DelegationContractV1` is strict JSON
- unknown or missing fields
- role or unit differs from the command
- authority grants or provenance are empty
- acceptance IDs do not use `A1`, `A2`, ...
- acceptance evidence or stop conditions are empty
- write paths are absolute, broad, traversing, or not normalized
- a verifier is not `read_only`
- `read_only` has a write scope, or a mutation mode has none

Contract files are limited to 64 KiB and must be regular non-symlink files.

## Existing Dossier Stops Working

Use the legacy validator first:

```bash
workflow-supervisor validate-dossier .workflow/dossiers/U1.yaml --role implementer --unit U1 --json
```

`delegate --dossier` remains a migration path, but acceptance rows must use stable `A1: outcome` form so they can be converted. New work should be rebuilt as DelegationContractV1; do not rename fields mechanically.

## Preview Blocks On Prompt Size

Inspect the reported contract and prompt bytes. Remove repeated prose, narrow inputs, split unrelated acceptance outcomes, or explicitly set a justified limit:

```bash
workflow-supervisor delegate ... --preview --max-prompt-bytes 98304
```

The default is 65,536 bytes and the hard maximum is 1 MiB. Raising the limit increases model context cost; it does not improve contract quality.

## Mutable Delegation Blocks On A Dirty Workspace

The guard cannot safely attribute an existing Git change unless the caller accepts it as baseline. Commit, stash, or otherwise isolate the user changes, or explicitly use:

```bash
workflow-supervisor delegate ... --allow-dirty
```

`--allow-dirty` does not authorize the worker to edit existing dirty files outside its write scope. It only makes their current content the baseline.

## PASS Is Rejected Because No Mutation Was Observed

A `mutation_required` contract claims that success includes a governed workspace change. If the desired outcome was already present, return `FAIL`/`BLOCKED` with an accurate explanation or use a separately justified `mutation_allowed` contract. Do not fabricate a change to satisfy the guard.

## The Worker Changed An Undeclared File

The normalized result becomes `BLOCKED`; the CLI does not revert. Inspect `guard.observed_changed_surfaces`, `allowed_surface_violations`, and `role_violations`. Preserve user work, isolate the worker's changes, and decide whether to discard, repair, or authorize a new bounded contract.

Never widen a contract after the fact to turn a violation into PASS.

## A Verifier Mutated The Workspace

Verifier contracts require `read_only` and an empty write scope. A native permission failure or any observed change invalidates the result. Run a truly non-mutating check, use an isolated copy outside the governed workspace, or delegate a separately authorized mutation role.

## Credentials Are Missing

The worker environment is intentionally minimal. Forward only exact names:

```bash
workflow-supervisor delegate ... --credential-env OPENAI_API_KEY
```

The contract authority grant must name `OPENAI_API_KEY`, identify it as a credential environment variable, and say it is explicitly authorized. The variable must also exist in the parent environment. `--allow-credential-env` is rejected because broad forwarding is unsafe.

The wrapper scrubs each forwarded credential's exact value from commands, raw output diagnostics, and untrusted free-text report fields, even when the value does not resemble an API key. Trusted protocol IDs, status/verdict enums, capabilities, and validated paths are not rewritten; reserved protocol-value collisions block before launch. This is defense in depth, not a data-loss-prevention boundary: a coincidental contract-ID/path match or an encoded, hashed, split, or otherwise transformed value may not be recognizable as secret material. Give workers the minimum credential scope and inspect the target system's audit trail.

## The Adapter Is Missing Or Unauthenticated

```bash
workflow-supervisor delegate-doctor --agent codex --require-pass
workflow-supervisor delegate-doctor --agent claude-code --require-pass
```

Then run `--probe` only when a live provider call is intended:

```bash
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

An executable check does not prove authentication or schema compatibility. A probe can consume quota or cost money.

## Worker Output Is Rejected

The preferred model output is one `WorkerResultV1` JSON object. Top-level status is `PASS`, `FAIL`, or `BLOCKED`.

Common rejection causes:

- prose or multiple JSON objects
- unknown fields
- missing, duplicate, or unknown acceptance IDs
- top-level PASS with a non-PASS outcome
- PASS outcome without evidence
- BLOCKED without a non-empty `blocker`
- reported change outside the contract write scope
- a nonzero adapter exit paired with PASS

The CLI returns a normalized `BLOCKED` report and does not call another model to repair formatting.

## FAIL Or BLOCKED Exits 2

This is the v1 default so CI and shell callers cannot overlook semantic failure. Parse stdout for the JSON report. Use `--soft-exit` only if the caller deliberately treats the JSON status as the sole control signal.

## Process Cleanup Has A Limitation Warning

The warning is expected and should not be removed from the report.

- POSIX process groups cannot reach a descendant that deliberately creates another session or joins another group.
- Windows `taskkill /T` cannot prove cleanup of a descendant that detached before ancestry enumeration.

The runner checks a bounded quiet interval and rejects a tree it can still observe. For hostile or escape-capable code, use an OS-level sandbox or container and keep sensitive resources outside its identity and filesystem view.

## The Guard Did Not Report A Path Outside `--cwd`

That is outside the guard's claim. Workspace snapshots are scoped to canonical `--cwd` and declared surfaces inside it. Built-in native permissions may restrict more, but Workflow Supervisor does not prove that every path, network call, service, keychain, or external side effect was untouched.

## Custom Adapter Override Is Rejected

Custom commands require explicit unsafe acknowledgement:

```bash
workflow-supervisor delegate \
  ... \
  --adapter-command '["custom-agent","--batch"]' \
  --prompt-mode stdin \
  --unsafe-adapter-override
```

The wrapper still validates prompt size, output, process cleanup, and observed workspace changes. It cannot claim the built-in command or permission guarantees for the custom process.

## Uninstall Retained `.workflow/`

This is intentional when `.workflow/` contains local state or another project install remains. Uninstall removes the installer-owned ignore entry only when safe. Review retained ledgers, contracts, and reports manually; user-authored workflow state is never deleted automatically.

## `doctor` Reports BLOCKED But Exits 0

Add `--require-pass` for CI or scripts:

```bash
workflow-supervisor doctor --agent all --require-pass
```

Without it, `doctor` is a diagnostic command and communicates health through JSON status.
