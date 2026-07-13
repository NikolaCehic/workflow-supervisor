# CLI Reference

The package exposes two executables:

```bash
workflow-supervisor
workflow-skills
```

When using `npx`, run:

```bash
npx workflow-supervisor <command>
```

## Commands

### `list`

Print skills bundled with the package.

```bash
workflow-supervisor list
```

### `validate`

Validate skill folder structure, `SKILL.md` frontmatter, required metadata, opt-in policy, adapter metadata, and the `WorkerReportV1` and `DossierV1` schema artifacts.

```bash
workflow-supervisor validate
```

### `validate-dossier`

Validate one machine-checkable `DossierV1` contract before delegation. The command accepts JSON or the documented flat DossierV1 YAML subset, either directly or in a fenced Markdown block. Unsupported YAML structures, duplicate keys, and unknown DossierV1 properties fail closed.

```bash
workflow-supervisor validate-dossier .workflow/dossiers/U1-implementer.yaml --role implementer --unit U1 --json
```

The validator rejects missing fields, unresolved open questions, broad boundaries such as `all files`, missing forbidden surfaces, role mismatches, unit mismatches, missing authority provenance, missing or duplicate acceptance-row IDs, malformed feedback loops, and worker prompts that do not require `WorkerReportV1`. `portable_delegate` requires `boundary_kind: local_path`; native or same-session contracts may use `boundary_kind: artifact`. Bug-fix or risky behavior-change dossiers require a concrete red-capable `feedback_loop`. A `feedback_loop_waiver` is accepted only as a structured reason, substitute evidence, and approving user or governing source, and it is mutually exclusive with `feedback_loop`.

### `doctor`

Inspect package, target, manifest ownership, installed files, checksums, and package freshness. `status: "PASS"` means every manifest-owned skill matches both its recorded checksum and the current package source. Missing, malformed, modified, or stale installs return `status: "BLOCKED"` with per-skill diagnostics.

```bash
workflow-supervisor doctor --agent codex
workflow-supervisor doctor --agent claude-code
workflow-supervisor doctor --agent generic --target ./agent-skills
workflow-supervisor doctor --agent all --require-pass
```

Use `--require-pass` when automation must receive a nonzero exit if one inspected install is unhealthy. JSON diagnostics are still printed.

### `install`

Install skills into a supported agent target.

```bash
workflow-supervisor install --agent codex
workflow-supervisor install --agent claude-code
workflow-supervisor install --agent generic --target ./agent-skills
workflow-supervisor install --agent all --scope project --project .
workflow-supervisor uninstall --agent codex --scope user
```

Options:

```text
--agent codex|claude-code|generic|all
--scope user|project  Install to user-level or project-level location where supported.
--project <path>      Project root for project-scope installs.
--target <path>       Override install directory. Required for generic installs.
--skills all|a,b      Install all skills or a comma-separated subset.
--force               Replace existing installed skill folders.
--dry-run             Validate and print intended action without writing.
--root <path>         Use another package root.
```

Default targets:

| Agent | Scope | Default |
|---|---|---|
| Codex | user | `~/.agents/skills` |
| Codex | project | `<project>/.agents/skills` |
| Claude Code | user | `${CLAUDE_HOME:-~/.claude}/skills` |
| Claude Code | project | `<project>/.claude/skills` |
| Generic | any | requires `--target` |

`--agent all` installs only the built-in target set: Codex and Claude Code. Use `generic` with `--target` when you want a Markdown instruction bundle for another environment.

Installs are manifest-owned and transactional. Incremental installs merge with the existing manifest, reinstalling the same unchanged skill is idempotent, and expected preflight failures occur before the target is replaced. One explicit `--target` cannot be shared by `--agent all`. Source/target overlap, root/home targets, symlink targets, unowned existing skill folders, malformed manifests, and unexplained checksum drift are rejected before mutation.

Project-scope installs also ensure `<project>/.gitignore` contains `.workflow/`. Workflow artifacts are local supervisor state by default and should not be pushed with the consuming repository unless the user explicitly makes them deliverables.

### `uninstall`

Remove manifest-owned skill folders. A subset uninstall preserves the remaining skills, manifest, and package context. Uninstall refuses targets without a matching ownership manifest and refuses checksum drift unless `--force` explicitly authorizes removal of the selected drifted skill.

```bash
workflow-supervisor uninstall --agent codex --scope user
workflow-supervisor uninstall --agent generic --target ./agent-skills
workflow-supervisor uninstall --agent generic --target ./agent-skills --skills workflow-docs
```

### `emit-context`

Create a portable instruction file for a Markdown-reading workspace. By default, output embeds only `workflow-supervisor/SKILL.md` and no bundled references. Select more skills explicitly and use `--references` only when the receiving task needs their Markdown references.

```bash
workflow-supervisor emit-context --agent generic --target ./agent-skills --out AGENTS.md
workflow-supervisor emit-context --agent claude-code --skills workflow-supervisor,workflow-docs --references --out CLAUDE.md
```

Options:

```text
--agent codex|claude-code|generic
--scope user|project
--project <path>
--target <path>
--skills all|a,b      Embed a comma-separated subset. Defaults to workflow-supervisor.
--include-references  Also embed bundled Markdown references for selected skills.
--references          Short alias for --include-references.
--out <path>          Write to a new file instead of stdout.
--force               Allow replacing an existing --out file.
--root <path>         Use another package root.
```

### `delegate`

Run one role-scoped worker through an installed Codex or Claude Code CLI and print exactly one normalized `WorkerReportV1` JSON object. Missing or invalid `DossierV1` contracts, missing CLIs, invalid worker output, timeouts, non-zero PASS results, PASS without evidence, top-level `CONDITIONAL_PASS`, PASS with conditional outcome rows, forbidden-surface changes, and verifier mutations become `BLOCKED` reports instead of unstructured prose.

The normalized envelope schema lives at `schemas/worker-report-v1.schema.json`; the raw-worker reserved-null contract lives at `schemas/worker-output-v1.schema.json`. Built-in adapters receive a dereferenced strict worker-output schema via Codex `--output-schema` or Claude Code `--json-schema`, and the trusted wrapper validates and enriches the final normalized report after the run.

`WorkerReportV1.status` remains `PASS`, `FAIL`, or `BLOCKED`. The wrapper rejects missing, extra, or mistyped report fields and rejects multiple conflicting report objects. A top-level PASS must include substantive evidence and exactly mapped PASS outcome rows for every acceptance-row ID in the dossier. `CONDITIONAL_PASS` is allowed only as an outcome row verdict to record strongly inferred but not fully observable behavior.

`--dossier` is a hard preflight gate. It must parse as `DossierV1` and pass concrete-field checks before the worker process starts. Internal inline dossiers used by adapter probes pass the same validation. The delegate command uses the dossier's `allowed_surfaces` and `forbidden_surfaces` as the authority floor: `--allowed-surfaces` may only narrow the declared allowed set, while `--forbidden-surfaces` adds prohibitions and cannot remove dossier prohibitions. Dossier text is delimited as untrusted task data and cannot override role, guard, or report rules.

```bash
workflow-supervisor delegate --agent codex --role implementer --unit U1 --cwd . --dossier .workflow/dossiers/U1-implementer.yaml --allowed-surfaces src,tests
workflow-supervisor delegate --agent claude-code --role verifier --unit U1 --cwd . --dossier .workflow/dossiers/U1-verifier.yaml --forbidden-surfaces src
```

Options:

```text
--agent codex|claude-code
--role implementer|verifier|repair|documenter
--unit <id>                 A 1-128 character safe work-unit identifier.
--cwd <path>                Workspace for the worker command. Defaults to current directory.
--dossier <path>            Role-scoped dossier to include in the worker prompt.
--allowed-surfaces a,b      Optional comma-separated mutable boundaries.
--forbidden-surfaces a,b    Optional comma-separated forbidden boundaries.
--timeout-ms <ms>           Positive integer timeout. Defaults to 120000; maximum 86400000.
--allow-dirty              Allow mutable delegation when git status is already dirty.
--allow-credential-env     Explicitly pass credential-like environment variables to the adapter process.
--require-pass             Exit nonzero when the normalized worker status is not PASS; JSON is still printed.
--adapter-command <json>    Override the adapter command as a JSON array of strings.
--prompt-mode stdin|arg     Send the prompt on stdin or as the final argument. Overrides default only with --adapter-command.
```

Adapter commands live in `adapters/<agent>/adapter.json` as command arrays, not shell strings. Use `--adapter-command` for local testing or platform setups whose executable name differs from the default. Override commands run with `--cwd` as their working directory, so use absolute paths for custom scripts unless they live in that workspace. Diagnostic command arrays redact credential-looking flags and assignments. Credential-like variables and language/runtime injection variables are removed from the adapter environment by default; `--allow-credential-env` also requires an explicit credential-environment authorization in `DossierV1.authority` and should be used only when the selected CLI cannot use its normal local login. Codex and Claude receive the prompt over stdin so dossier size and text are not exposed through process arguments.

### `delegate-doctor`

Inspect a delegate adapter. Without `--probe`, this checks for a regular executable file and execute permission and, for built-in adapters, runs the declared bounded `--version` invocation. With `--probe`, it additionally runs a fully validated trivial worker delegation and validates the normalized report path.

```bash
workflow-supervisor delegate-doctor --agent all
workflow-supervisor delegate-doctor --agent all --probe --require-pass
workflow-supervisor delegate-doctor --agent claude-code
workflow-supervisor delegate-doctor --agent codex --adapter-command '["codex","exec","--json"]' --probe
```

Options:

```text
--agent codex|claude-code|all
--adapter-command <json>    Override the adapter command as a JSON array of strings.
--prompt-mode stdin|arg
--probe                    Run a trivial WorkerReportV1 delegation check.
--allow-credential-env     Explicitly pass credential-like environment variables to a probe adapter.
--require-pass             Exit nonzero when any inspected adapter is BLOCKED.
--cwd <path>
--timeout-ms <ms>           Positive integer timeout; the version check is capped at 10000 ms.
```

Use `workflow-supervisor delegate-doctor --agent all --probe --require-pass` as the certification gate in CI or in an environment where both target CLIs are installed. The command still prints JSON diagnostics when it exits nonzero.

## Exit Codes

- `0`: command completed; normalized `delegate`/`doctor` reports may still be `FAIL` or `BLOCKED` unless `--require-pass` is set
- `1`: validation, install, argument, filesystem, or explicit `--require-pass` failure
