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

Validate one machine-checkable `DossierV1` contract before delegation. The command accepts JSON, YAML, or fenced YAML in a Markdown file.

```bash
workflow-supervisor validate-dossier .workflow/dossiers/U1-implementer.yaml --role implementer --unit U1 --json
```

The validator rejects missing fields, unresolved open questions, broad mutable surfaces such as `all files`, missing forbidden surfaces, role mismatches, unit mismatches, missing acceptance rows, and worker prompts that do not require `WorkerReportV1`.

### `doctor`

Print package, target, and skill discovery information.

```bash
workflow-supervisor doctor --agent codex
workflow-supervisor doctor --agent claude-code
workflow-supervisor doctor --agent generic --target ./agent-skills
```

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

`--agent all` installs only the certified target set: Codex and Claude Code. Use `generic` with `--target` when you want a Markdown instruction bundle for another environment.

Project-scope installs also ensure `<project>/.gitignore` contains `.workflow/`. Workflow artifacts are local supervisor state by default and should not be pushed with the consuming repository unless the user explicitly makes them deliverables.

### `uninstall`

Remove installed skill folders and package context files.

```bash
workflow-supervisor uninstall --agent codex --scope user
workflow-supervisor uninstall --agent generic --target ./agent-skills
```

### `emit-context`

Create a portable instruction file for a Markdown-reading workspace. The output embeds the selected `SKILL.md` files and bundled Markdown references, so the receiving agent can use the skills without separately reading the skill directory.

```bash
workflow-supervisor emit-context --agent generic --target ./agent-skills --out AGENTS.md
workflow-supervisor emit-context --agent claude-code --skills workflow-supervisor,workflow-docs --out CLAUDE.md
```

Options:

```text
--agent codex|claude-code|generic
--scope user|project
--project <path>
--target <path>
--skills all|a,b      Embed all skills or a comma-separated subset.
--out <path>          Write to a file instead of stdout.
--root <path>         Use another package root.
```

### `delegate`

Run one role-scoped worker through an installed Codex or Claude Code CLI and print exactly one normalized `WorkerReportV1` JSON object. Missing or invalid `DossierV1` contracts, missing CLIs, invalid worker output, timeouts, non-zero PASS results, PASS without evidence, top-level `CONDITIONAL_PASS`, PASS with conditional outcome rows, forbidden-surface changes, and verifier mutations become `BLOCKED` reports instead of unstructured prose.

The report schema lives at `schemas/worker-report-v1.schema.json`. The Codex adapter passes it via `--output-schema`; the Claude Code adapter passes it via `--json-schema`; every adapter is still wrapper-validated after the run.

`WorkerReportV1.status` remains `PASS`, `FAIL`, or `BLOCKED`. Outcome-bearing verifier reports may include `verification_environment` and `outcome_evaluations`; `CONDITIONAL_PASS` is allowed only as an outcome row verdict to record strongly inferred but not fully observable behavior.

`--dossier` is a hard preflight gate. It must parse as `DossierV1` and pass concrete-field checks before the worker process starts. The delegate command uses `allowed_surfaces` and `forbidden_surfaces` from the dossier as surface guards unless explicit CLI surface flags are provided.

```bash
workflow-supervisor delegate --agent codex --role implementer --unit U1 --cwd . --dossier .workflow/DOSSIER.md --allowed-surfaces src,tests
workflow-supervisor delegate --agent claude-code --role verifier --unit U1 --cwd . --dossier .workflow/DOSSIER.md --forbidden-surfaces src
```

Options:

```text
--agent codex|claude-code
--role implementer|verifier|repair|documenter
--unit <id>                 Work unit ID copied into WorkerReportV1.
--cwd <path>                Workspace for the worker command. Defaults to current directory.
--dossier <path>            Role-scoped dossier to include in the worker prompt.
--allowed-surfaces a,b      Optional comma-separated mutable boundaries.
--forbidden-surfaces a,b    Optional comma-separated forbidden boundaries.
--timeout-ms <ms>           Subprocess timeout. Defaults to 120000.
--allow-dirty              Allow mutable delegation when git status is already dirty.
--adapter-command <json>    Override the adapter command as a JSON array of strings.
--prompt-mode stdin|arg     Send the prompt on stdin or as the final argument. Overrides default only with --adapter-command.
```

Adapter commands live in `adapters/<agent>/adapter.json` as command arrays, not shell strings. Use `--adapter-command` for local testing or platform setups whose executable name differs from the default. Override commands run with `--cwd` as their working directory, so use absolute paths for custom scripts unless they live in that workspace.

### `delegate-doctor`

Inspect a delegate adapter. Without `--probe`, this checks whether the executable is present. With `--probe`, it runs a trivial worker delegation and validates the normalized report path.

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
--require-pass             Exit nonzero when any inspected adapter is BLOCKED.
--cwd <path>
```

Use `workflow-supervisor delegate-doctor --agent all --probe --require-pass` as the certification gate in CI or in an environment where both target CLIs are installed. The command still prints JSON diagnostics when it exits nonzero.

## Exit Codes

- `0`: command succeeded
- `1`: validation, install, argument, or filesystem error
