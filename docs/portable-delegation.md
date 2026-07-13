# Portable Delegation

Portable delegation runs one local Codex or Claude Code CLI process for one bounded worker unit. It is useful when an independent transcript, read-only review, or separate mutation boundary adds value. It is intentionally not a resident orchestrator.

Use a native host subagent when it already provides suitable isolation and lifecycle controls. Use the CLI when a reproducible one-shot contract and wrapper-owned verification are useful. Skip both when the current model can safely do and verify the work directly.

## Data Flow

```text
DelegationContractV1
  -> bounded worker prompt
  -> Codex or Claude Code CLI
  -> provider-intersection transport schema
  -> normalize transport placeholders
  -> canonical WorkerResultV1 runtime validation
  -> acceptance, exit, process, and mutation checks
  -> WorkerReportV1
```

The contract and repository are untrusted task data. They cannot change the worker role, permissions, write scope, authority, output shape, or supervisor policy.

## DelegationContractV1

New contracts are strict JSON and reject unknown fields.

```json
{
  "schema": "DelegationContractV1",
  "unit": "U1",
  "role": "implementer",
  "objective": "Add the documented retry limit.",
  "authority": {
    "grants": ["Modify the declared write scope for this local task."],
    "source": ["The user's request in the supervising task."]
  },
  "inputs": ["docs/retry-policy.md"],
  "write_scope": ["src/retry.js", "tests/retry.test.js"],
  "expected_effect": "mutation_required",
  "acceptance": [
    {
      "id": "A1",
      "outcome": "Retries stop at the documented limit.",
      "evidence": ["Focused automated test exercising the limit."]
    }
  ],
  "checks": ["node --test tests/retry.test.js"],
  "stop_conditions": ["The controlling retry policy is missing or contradictory."]
}
```

Field rules:

| Field | Rule |
|---|---|
| `unit` | Stable 1-128 character safe identifier; must equal `--unit`. |
| `role` | `implementer`, `verifier`, `repair`, or `documenter`; must equal `--role`. |
| `authority.grants` | Concrete permissions already granted by a user or governing source. A worker cannot authorize itself. |
| `authority.source` | Provenance for those grants. |
| `inputs` | Bounded controlling inputs. An empty array is valid. |
| `write_scope` | Normalized relative paths under `--cwd`; default-deny for mutation. |
| `expected_effect` | `mutation_required`, `mutation_allowed`, or `read_only`. |
| `acceptance` | One or more unique `A1`, `A2`, ... rows with expected outcome and required evidence. |
| `checks` | Concrete checks available to the worker. An empty array is valid. |
| `stop_conditions` | One or more conditions that require the worker to stop. |

A verifier must use `read_only` and an empty write scope. `read_only` always requires an empty write scope. Both mutation modes require at least one write-scope path.

Validate before launch:

```bash
workflow-supervisor validate-contract .workflow/contracts/U1.json --json
```

Contract files are limited to 64 KiB and are read as regular, non-symlink files with before/after metadata checks.

## Prompt Preview And Budget

`--preview` performs contract, adapter, and prompt-budget validation without starting the agent:

```bash
workflow-supervisor delegate \
  --agent codex \
  --role implementer \
  --unit U1 \
  --cwd . \
  --contract .workflow/contracts/U1.json \
  --preview
```

The `DelegatePreviewV1` output includes contract bytes, prompt bytes, schema bytes, an estimated prompt token count, redacted command, declared write scope, and guard limitations. The default prompt limit is 65,536 bytes. Use `--max-prompt-bytes` to set a smaller or explicitly larger limit, up to 1 MiB.

The worker prompt contains the canonical minified contract once. Built-in adapters use [`worker-result-transport-v1.schema.json`](../schemas/worker-result-transport-v1.schema.json), a conservative intersection of the structured-output grammar accepted by Codex and Claude Code. The richer canonical rules remain in [`worker-result-v1.schema.json`](../schemas/worker-result-v1.schema.json) and the runtime validator. The schema is included in prompt text only for an adapter without native schema support.

## WorkerResultV1

The model emits one compact object and no prose:

```json
{
  "schema": "WorkerResultV1",
  "status": "PASS",
  "summary": "Added and verified the retry limit.",
  "changes": ["src/retry.js", "tests/retry.test.js"],
  "outcomes": [
    {
      "id": "A1",
      "verdict": "PASS",
      "evidence": ["node --test tests/retry.test.js passed and exercised the configured limit."]
    }
  ],
  "checks": ["node --test tests/retry.test.js"],
  "skipped": [],
  "findings": [],
  "blocker": "",
  "next": "Supervisor should inspect the diff and accept A1."
}
```

The canonical result requires only `schema`, `status`, `summary`, and `outcomes` at the root. The provider transport requires all ten carrier fields because both supported provider grammars accept that shape reliably. A model therefore uses empty arrays for unused lists and may use an empty string for unused `blocker` or `next`; the wrapper removes those empty transport placeholders before canonical validation.

Canonical validation then applies the real acceptance rules. A top-level `PASS` must report every contract acceptance ID exactly once, every row must be `PASS`, and every row must have evidence. `BLOCKED` requires a non-empty `blocker`; `PASS` and `FAIL` must omit it after normalization. Text bounds, safe relative paths, unique lists and outcome IDs, allowed statuses, and contract-ID coverage are runtime requirements even though the provider transport schema cannot express all of them.

Unknown fields, multiple output objects, unknown IDs, duplicate IDs, malformed paths, unsupported statuses, or empty PASS evidence are rejected. The wrapper does not make a second model call to repair formatting.

## WorkerReportV1

This is the canonical normalized envelope. It is wrapper output, not the preferred object for a model to author:

```json
{
  "schema": "WorkerReportV1",
  "status": "PASS",
  "role": "implementer",
  "unit_id": "U1",
  "summary": "Added and verified the retry limit.",
  "changed_surfaces": ["src/retry.js", "tests/retry.test.js"],
  "evidence": [
    {
      "kind": "A1",
      "detail": "The focused test passed and exercised the configured retry limit."
    }
  ],
  "checks_run": ["node --test tests/retry.test.js"],
  "skipped_checks": [],
  "findings": [],
  "blocking_question": null,
  "next_action": "supervisor_verify",
  "verification_environment": null,
  "outcome_evaluations": [
    {
      "id": "A1",
      "source_requirement": "Retries stop at the documented limit.",
      "expected_outcome": "Retries stop at the documented limit.",
      "preferred_verification": [],
      "available_verification": [],
      "evidence_strength": {
        "strongest_possible": [],
        "strongest_available": [],
        "limitation": null
      },
      "evidence": [
        {
          "kind": "A1",
          "detail": "The focused test passed and exercised the configured retry limit."
        }
      ],
      "invalid_pass_conditions": [],
      "verdict": "PASS",
      "limitation": null,
      "capability_limitations": [],
      "required_external_check": [],
      "finding": null
    }
  ],
  "adapter": {
    "agent": "codex",
    "command": ["codex", "exec", "--output-schema", "<WorkerResultV1 schema>", "-"],
    "exit_code": 0,
    "timed_out": false,
    "source": "adapter-json",
    "schema_mode": "file"
  },
  "guard": {
    "allowed_surface_violations": [],
    "role_violations": [],
    "warnings": [
      "Mutation checks are detective and limited to the governed workspace."
    ],
    "observed_changed_surfaces": ["src/retry.js", "tests/retry.test.js"]
  },
  "reason": null,
  "stdout_excerpt": null,
  "stderr_excerpt": null
}
```

The CLI never trusts model-owned adapter or guard metadata. It normalizes valid compact output into `WorkerReportV1` by:

- supplying the requested role and unit ID
- joining immutable expected outcomes from the contract by acceptance ID
- mapping compact evidence into normalized outcome evaluations
- supplying the actual adapter command, exit status, schema mode, and timeout state
- supplying observed workspace changes and guard findings
- redacting untrusted free-text diagnostics and credential-shaped material without rewriting validated protocol fields

Legacy model-emitted `WorkerReportV1` remains accepted only when it satisfies the strict legacy worker-output contract. The result includes a deprecation warning.

`delegate` prints exactly one normalized JSON envelope. A valid `FAIL` or `BLOCKED` is useful structured output, but exits `2` unless `--soft-exit` is set.

## Workspace Guard

Before launch, the wrapper validates every declared surface against the canonical `--cwd`. It rejects absolute, traversal, delimiter-ambiguous, Windows-reserved, escaping-symlink, and multiply-linked surfaces.

For a Git workspace, the guard records:

- tracked, untracked, and ignored file content and modes
- directory structure under `--cwd`
- HEAD and staged index state
- registered submodule worktrees and untracked embedded repositories, including ignored and untracked content
- the full Git control tree, refs, hooks, object/LFS metadata, and in-progress operation state
- every workspace-visible symlink across the full watched Git root
- declared allowed and forbidden surfaces independently

Loose control files are content-hashed. Git object and LFS payloads use inode, size, mode, link-count, modification-time, and kernel-maintained change-time fingerprints so large history stores do not need to be reread on every delegation. Any workspace-visible symlink whose canonical or potential target escapes the watched Git root is rejected. For a non-Git workspace, the guard snapshots the directory tree under `--cwd` and rejects symlinks that escape it.

After process-tree cleanup and a bounded quiet interval, the wrapper takes another snapshot. It rejects:

- observed changes outside the allowed set
- changes to forbidden surfaces or Git control state
- any verifier or `read_only` mutation
- `mutation_required` PASS with no observed change
- observed changes omitted from the worker's `changes`
- worker-reported changes outside the allowed set
- an unavailable or failed post-run guard

A mutable role in a dirty Git workspace blocks before launch unless `--allow-dirty` is supplied. With that flag, the existing content becomes the baseline; new changes are still compared.

The guard is detective. It does not prevent writes, watch paths outside `--cwd`, prove that every system side effect was absent, or revert violations. Native agent permissions and an OS-level sandbox remain the enforcement boundary.

## Process And Output Bounds

The runner launches without shell interpolation and limits combined stored stdout/stderr to 10 MiB. Timeout defaults to 120 seconds and can be raised to at most 24 hours. Timeout, overflow, or stream failure requests cleanup before the mutation audit.

On POSIX, the child owns a new process group. The wrapper signals that group, waits a short grace period, sends a final kill, and checks whether the group still exists after a bounded quiet interval. A descendant that deliberately creates a new session or joins another group is outside that cleanup boundary.

On Windows, cleanup uses `taskkill /PID <pid> /T /F`. Windows ancestry cannot prove cleanup of a descendant that detached before enumeration. Every report carries the relevant platform limitation. A process tree that cannot reach verified quiescence is a role violation, not PASS.

## Environment And Credentials

The worker receives a small allowlist of runtime variables such as `PATH`, home/temp/locale settings, agent home directories, and certificate paths. Application credentials and language/runtime injection variables are not inherited by default.

Forward credentials only by exact name:

```bash
workflow-supervisor delegate \
  ... \
  --credential-env OPENAI_API_KEY
```

The contract must contain a grant that names `OPENAI_API_KEY`, identifies it as a credential environment variable, and says it is explicitly authorized. Broad credential forwarding is not supported. Exact forwarded values are scrubbed from commands, raw output diagnostics, and untrusted free-text report fields even when they do not look like API keys. Trusted protocol IDs, status/verdict enums, capabilities, and validated paths are not rewritten; credentials that exactly collide with reserved protocol identifiers block before launch. A coincidental match with a contract ID or validated path remains structural data. Encoded, hashed, split, or otherwise transformed variants may not be recognizable.

Environment filtering reduces accidental leakage. It does not prevent a worker from reading credentials already stored in files, keychains, agent configuration, or services accessible under the operating-system identity.

## Built-In Adapters

| Agent | One-shot command shape | Role boundary |
|---|---|---|
| Codex | `codex exec` with stdin, ephemeral mode, JSON events, and a file-backed provider-intersection schema | `read-only` for verifier; `workspace-write` for mutation roles |
| Claude Code | `claude -p` with skills and configured MCP servers disabled, stdin, JSON output, no session persistence, and the inline provider-intersection schema | `plan` for verifier; `acceptEdits` for mutation roles |

The Claude adapter deliberately does not add `--bare`: bare mode would bypass the normal OAuth/keychain authentication path. Avoiding `--bare` preserves authentication but also means settings, hooks, or `CLAUDE.md` may still be visible. The adapter flags and the post-run guard reduce accidental scope; they do not replace a reviewed workspace or OS sandbox.

Commands are defined in `adapters/<agent>/adapter.json` and must pass package validation. Provider CLI behavior can change, so certify the installed versions:

```bash
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

An executable/version check without `--probe` does not prove authentication or structured-output compatibility. A probe makes a live model call and may incur provider cost.

Custom commands require both `--adapter-command` and `--unsafe-adapter-override`. They remain subject to prompt, process, output, and workspace checks but are outside the built-in command and permission guarantees.

## Legacy Dossier Migration

`--dossier` and `--dossier-text` still accept valid `DossierV1`. The wrapper validates it, converts stable `A1: outcome` acceptance rows into structured rows, preserves forbidden surfaces in the guard, derives `expected_effect` from the role, discards dossier-owned prompt text, and then uses the v1 path. Exactly one path or inline input source is accepted.

The compatibility path is deprecated. Use [migrating-to-v1.md](migrating-to-v1.md) to rebuild contracts instead of mechanically renaming fields.
