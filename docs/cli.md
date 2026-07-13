# CLI Reference

The package exposes the same CLI through two executable names:

```bash
workflow-supervisor <command>
workflow-skills <command>
```

Node.js 22 or newer is required. With `npx`, use `npx workflow-supervisor <command>`.

## Host Invocation And Plugin Layout

The model-facing skill has host-specific invocation syntax:

| Host/install surface | Invocation |
|---|---|
| Codex plugin or installed Codex skill | `$workflow-supervisor` |
| Claude Code skill copied directly into `.claude/skills` | `/workflow-supervisor` |
| Claude Code marketplace plugin | `/workflow-supervisor:workflow-supervisor` |

The repository root is the Codex plugin because `.codex-plugin/plugin.json` points to `./skills/`. The repository root is a Claude marketplace, not the Claude plugin itself: `.claude-plugin/marketplace.json` points to `plugins/claude`, which contains the Claude plugin manifest and skill copy. These native plugin surfaces do not require the package CLI. The commands below manage direct skill copies, portable context, contracts, delegation, and diagnostics.

## Exit Codes

| Code | Meaning |
|---:|---|
| `0` | Command completed successfully; for `delegate`, the normalized result is `PASS`. |
| `1` | CLI usage, validation, install, adapter-doctor, or runtime command error. |
| `2` | `delegate` returned a valid `FAIL` or `BLOCKED` envelope. |

`delegate --soft-exit` changes a structured `FAIL` or `BLOCKED` result to exit `0`. It does not change the JSON status. `doctor` and `delegate-doctor` report blocked state in JSON and exit nonzero only when `--require-pass` is used.

`--version` or `-v` must be used alone. `--help` or `-h` prints command help.

## Package Inspection

### `list`

Print the bundled discoverable skills. V1 prints only `workflow-supervisor`.

```bash
workflow-supervisor list
```

`--root <path>` validates another source tree, primarily for package development.

### `validate`

Validate the skill, metadata, local links, context profiles and budgets, adapters, and all packaged contract/report schemas.

```bash
workflow-supervisor validate
```

`--root <path>` selects another package root.

### `context-budget`

Render one portable profile in memory and report exact UTF-8 bytes, the configured maximum, and an estimated token count.

```bash
workflow-supervisor context-budget --profile direct
workflow-supervisor context-budget --profile tracked --agent codex
workflow-supervisor context-budget --profile delegated --agent claude-code
```

Options:

```text
--profile direct|tracked|delegated  Default: direct.
--agent codex|claude-code|generic  Changes the exported heading. Default: generic.
--root <path>                      Use another package root.
```

Byte counts are exact. Token counts use `ceil(utf8_bytes / 4)` and are estimates because provider tokenizers differ.

## Contract Validation

### `validate-contract`

Validate a strict JSON `DelegationContractV1` without launching a worker.

```bash
workflow-supervisor validate-contract .workflow/contracts/U1.json
workflow-supervisor validate-contract .workflow/contracts/U1.json --json
```

The path can also be supplied as `--contract <path>`. Invalid input exits `1`. Contract files are limited to 64 KiB, must be regular non-symlink files, and must not change while read.

### `validate-dossier` (legacy)

Validate a 0.x `DossierV1` before migration.

```bash
workflow-supervisor validate-dossier .workflow/dossiers/U1.yaml \
  --role implementer \
  --unit U1 \
  --json
```

The path can also be supplied as `--dossier <path>`. JSON and the documented flat DossierV1 YAML subset are accepted. Dossier files are limited to 1 MiB. New integrations should use `validate-contract`.

## Install Lifecycle

### `install`

Install the single skill and an ownership manifest.

```bash
workflow-supervisor install --agent codex --scope user
workflow-supervisor install --agent claude-code --scope project --project .
workflow-supervisor install --agent all --scope project --project .
workflow-supervisor install --agent generic --target ./agent-skills
```

Options:

```text
--agent codex|claude-code|generic|all  Default: generic. `all` means Codex and Claude Code.
--scope user|project                   Default: user.
--project <path>                       Project root for project scope; default is cwd.
--target <path>                        Override the skill directory; required for generic.
--force                                Replace a conflicting destination after explicit review.
--dry-run                              Validate and describe without writing.
--root <path>                          Install from another package root.
```

Default targets:

| Agent | User scope | Project scope |
|---|---|---|
| Codex | `~/.agents/skills` | `<project>/.agents/skills` |
| Claude Code | `${CLAUDE_CONFIG_DIR:-~/.claude}/skills` | `<project>/.claude/skills` |
| Generic | explicit `--target` | explicit `--target` |

A project install records `.workflow/` in the project `.gitignore` when it is not already covered. Install operations are locked per target and replace managed entries transactionally.

### `doctor`

Compare the manifest, installed checksums, package version, generated context, legacy orphan directories, and project ignore ownership.

```bash
workflow-supervisor doctor --agent codex
workflow-supervisor doctor --agent all --scope project --project . --require-pass
workflow-supervisor doctor --agent generic --target ./agent-skills
```

Without `--require-pass`, an unhealthy install is reported as `status: "BLOCKED"` but the command exits `0`. Target-selection options are `--agent`, `--scope`, `--project`, and `--target`; add `--require-pass` when an unhealthy result must fail the command.

### `upgrade`

Upgrade a manifest-owned install to the current one-skill layout. The command requires an existing valid manifest.

```bash
workflow-supervisor upgrade --agent all --scope project --project . --dry-run
workflow-supervisor upgrade --agent all --scope project --project .
```

The upgrade removes manifest-owned 0.x companion skill directories and replaces `workflow-supervisor`. Modified or unowned directories block unless `--force` is supplied after backup and review. Options match `install`.

### `uninstall`

Remove manifest-owned skill and generated context files.

```bash
workflow-supervisor uninstall --agent codex --scope user
workflow-supervisor uninstall --agent all --scope project --project . --dry-run
workflow-supervisor uninstall --agent generic --target ./agent-skills
```

Modified owned files block unless `--force` is supplied. For project installs, the installer removes its `.workflow/` ignore entry only when no other project install needs it and no retained workflow state is present. Empty install directories created under the project are removed when safe.

## Portable Context

### `emit-context`

Write a Markdown context for an agent that cannot discover skill directories.

```bash
workflow-supervisor emit-context --agent generic --profile direct --out AGENTS.md
workflow-supervisor emit-context --agent claude-code --profile tracked --out CLAUDE.md
workflow-supervisor emit-context --agent generic --profile delegated --include-references --out AGENTS.md --force
```

Options:

```text
--agent codex|claude-code|generic      Default: generic.
--profile direct|tracked|delegated     Default: direct.
--scope user|project
--project <path>
--target <path>                        Heading hint for the expected skill directory.
--include-references                   Include every bundled reference, not only the profile reference.
--out <path>                           Write to a file; otherwise print to stdout.
--force                                Overwrite an existing output file.
--root <path>                          Export from another package root.
```

`--references` is accepted as an alias for `--include-references`. A profile already embeds its selected route reference; `--include-references` intentionally produces a larger export.

## Delegation

### `delegate`

Run one local Codex or Claude Code process and print one normalized `WorkerReportV1` JSON envelope.

```bash
workflow-supervisor delegate \
  --agent codex \
  --role implementer \
  --unit U1 \
  --cwd . \
  --contract .workflow/contracts/U1.json
```

Required options:

```text
--agent codex|claude-code
--role implementer|verifier|repair|documenter
--unit <safe-id>
--contract <path> | --contract-text <strict-json>
```

Execution options:

```text
--cwd <path>                 Governed workspace. Default: cwd.
--timeout-ms <integer>       Default: 120000; maximum: 86400000.
--max-prompt-bytes <integer> Default: 65536; maximum: 1048576.
--preview                    Validate and report prompt/guard metadata without launching a model.
--allow-dirty                Permit a mutable role to start from a dirty Git baseline.
--credential-env <a,b>       Forward only these exact environment variable names.
--soft-exit                  Exit 0 for structured FAIL/BLOCKED output.
```

Advanced guard options:

```text
--allowed-surfaces <a,b>     Narrow, but never widen, contract.write_scope.
--forbidden-surfaces <a,b>   Add forbidden paths.
```

Every forwarded credential variable must be named in `--credential-env`, present in the parent environment, and explicitly authorized by name as a credential environment variable in `contract.authority.grants`. Values that collide with reserved workflow protocol identifiers are rejected before launch. The broad legacy `--allow-credential-env` flag is rejected.

Custom adapter override is intentionally unsafe and explicit:

```bash
workflow-supervisor delegate \
  ... \
  --adapter-command '["custom-agent","--batch"]' \
  --prompt-mode stdin \
  --unsafe-adapter-override
```

An override runs in the governed `--cwd` but is outside the built-in adapter command and permission guarantees. `--prompt-mode` is `stdin` or `arg`.

Built-in adapters give the provider `worker-result-transport-v1.schema.json`, a conservative structured-output grammar accepted by both supported CLIs. It requires every carrier field, so unused `blocker` and `next` values may arrive as empty strings. The wrapper removes those transport placeholders and then applies the stricter canonical `WorkerResultV1` runtime validation: bounds, path safety, uniqueness, status semantics, and exact acceptance-ID coverage. A provider accepting the transport schema is not itself a successful delegation.

Legacy compatibility options are `--dossier <path>` and `--dossier-text <text>`. They cannot be combined with contract options. A valid DossierV1 is converted to DelegationContractV1 and a deprecation warning is included. The accepted legacy `--require-pass` flag is no longer necessary because strict non-PASS exit behavior is the default.

### `delegate-doctor`

Inspect the configured command, structured-output mode, executable availability, and bounded version invocation. `--probe` additionally runs a read-only contract through the live adapter.

```bash
workflow-supervisor delegate-doctor --agent codex
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

Options:

```text
--agent codex|claude-code|all
--probe
--require-pass
--cwd <path>
--timeout-ms <integer>
--credential-env <a,b>
```

Custom doctor probes accept `--adapter-command`, `--prompt-mode`, and `--unsafe-adapter-override` under the same rules as `delegate`. An adapter override cannot be combined with `--agent all`.

## Output Contracts

- `DelegatePreviewV1`: preview metadata; no worker was started.
- `worker-result-transport-v1.schema.json`: provider-intersection structured-output carrier; not the canonical acceptance contract.
- `WorkerResultV1`: compact untrusted model output.
- `WorkerReportV1`: normalized wrapper output printed by `delegate`.
- `ContractValidationV1`: `validate-contract --json` output.
- `DossierValidationV1`: legacy `validate-dossier --json` output.
- `ContextBudgetV1`: `context-budget` output.

See [portable-delegation.md](portable-delegation.md) for the trust model and normalization rules.

## Release Gates

Repository CI runs `npm run validate` on Ubuntu with Node.js 22, 24, and 26, and on macOS and Windows with Node.js 24. Its package job packs the tarball, installs it into a fresh temporary npm consumer, checks the installed version, and runs package validation. A tag-matched release workflow repeats validation and the consumer smoke before attaching the tarball, `SHA256SUMS`, `sbom.cdx.json`, and `provenance.intoto.json` to the GitHub release. It does not publish to npm.
