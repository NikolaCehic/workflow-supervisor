# Compatibility

Workflow Supervisor has three different compatibility surfaces: skill discovery, one-shot worker delegation, and generic Markdown export. Support for one does not imply support for the others.

## Runtime

Node.js 22 or newer is required. The package has no runtime npm dependencies.

The package does not pin a Codex or Claude Code release. Provider CLIs can change command flags, permission modes, authentication, or structured-output behavior independently. Run diagnostics against the exact executable installed on the target machine.

```bash
workflow-supervisor delegate-doctor --agent all --require-pass
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

The first command checks executable discovery and a bounded version invocation. `--probe` additionally makes a live, read-only structured-output call. It may consume provider quota or incur cost.

## Capability Matrix

| Target | Invocation | Skill install | Portable context | Automated delegation | Structured output |
|---|---|---:|---:|---:|---:|
| Codex | `$workflow-supervisor` | Yes | Yes | Built-in adapter | File-backed provider transport schema |
| Claude Code, direct skill | `/workflow-supervisor` | Yes | Yes | Built-in adapter | Inline provider transport schema |
| Claude Code, plugin | `/workflow-supervisor:workflow-supervisor` | Marketplace | Yes | Built-in adapter | Inline provider transport schema |
| Generic Markdown agent | Host-specific | Custom directory | Yes | No | No maintained transport |

`--agent all` means Codex and Claude Code. Generic is intentionally excluded because it has no maintained worker transport.

## Codex

The installed skill contains `SKILL.md` and `agents/openai.yaml`. It is explicit opt-in and should be invoked by name:

```text
Use $workflow-supervisor to choose the lightest route and require evidence before accepting delegated work.
```

Install locations:

```bash
workflow-supervisor install --agent codex --scope user
workflow-supervisor install --agent codex --scope project --project .
```

The repository root is also a native Codex plugin. Its `.codex-plugin/plugin.json` points to the root `skills/` directory, so a Codex plugin install uses the same canonical skill and the same `$workflow-supervisor` invocation.

The built-in one-shot adapter uses `codex exec`, sends the prompt on stdin, asks for structured output through the provider-intersection transport schema, ignores personal runtime configuration, and selects `read-only` for verifier or `workspace-write` for mutation roles. It keeps user/project `.rules` enforcement. Only the final completed Codex `agent_message` is eligible as the event-stream result; command output is never promoted to a report. The wrapper normalizes the transport object and applies the stricter canonical runtime validation before accepting it. Native sandbox modes are the prevention boundary; repository instructions may remain ambient, and the Workflow Supervisor guard checks for violations after the process returns.

Primary provider references: [Codex CLI reference](https://developers.openai.com/codex/cli/reference/) and [Codex non-interactive mode](https://developers.openai.com/codex/noninteractive/).

## Claude Code

Claude Code installs the same `SKILL.md` folder:

```bash
workflow-supervisor install --agent claude-code --scope user
workflow-supervisor install --agent claude-code --scope project --project .
```

User-scope installs default to `~/.claude/skills`. When `CLAUDE_CONFIG_DIR` is set, the installer uses `<CLAUDE_CONFIG_DIR>/skills` and forwards that variable to delegated Claude processes, matching Claude Code's documented configuration-directory override. See [Claude Code environment variables](https://code.claude.com/docs/en/env-vars) and [the `.claude` directory reference](https://code.claude.com/docs/en/claude-directory).

A directly installed skill is invoked as `/workflow-supervisor`. For plugin distribution, the repository root contains `.claude-plugin/marketplace.json`, whose `workflow-supervisor` entry points to `plugins/claude`. That isolated directory contains the plugin manifest and a validated copy of the canonical skill; after marketplace installation, invoke `/workflow-supervisor:workflow-supervisor`.

The built-in adapter uses headless `claude -p`, disables skills and configured MCP servers, persists no session, requests JSON output with the provider-intersection transport schema, and selects `plan` for verifier or `acceptEdits` for mutation roles. Only a successful top-level Claude `structured_output` carrier is eligible as the wrapped result. It deliberately does not use `--bare` because bare mode bypasses normal OAuth/keychain authentication. Claude may still load settings, hooks, or `CLAUDE.md`; run in a reviewed workspace and treat native permissions plus the post-run guard as the boundary. Verify the flags against the installed Claude Code version before relying on them.

The transport schema is deliberately less expressive than the canonical `WorkerResultV1` rules because both provider structured-output implementations must accept it. Every carrier field is required, and unused optional strings may be empty. The wrapper removes transport placeholders and then enforces the canonical bounds, path rules, uniqueness, status semantics, and acceptance coverage. Provider-level schema success is only a parsing boundary.

If skill discovery is unavailable, emit a context file:

```bash
workflow-supervisor emit-context --agent claude-code --profile direct --out CLAUDE.md
```

Primary provider references: [Claude Code CLI reference](https://code.claude.com/docs/en/cli-usage) and [Claude Code permission modes](https://code.claude.com/docs/en/permission-modes).

## Generic Markdown Agents

Generic support is instruction delivery only:

```bash
workflow-supervisor install --agent generic --target ./agent-skills
workflow-supervisor emit-context --agent generic --profile tracked --out AGENTS.md
```

Point the receiving agent at `WORKFLOW_SKILL_PACK.md`, the installed `workflow-supervisor/SKILL.md`, or the emitted file. Generic support does not provide authentication, permissions, process lifecycle, schema enforcement, or mutation isolation. Do not claim automated delegation support for an agent without a maintained adapter and compatibility tests.

## Native Host Workers

The skill can use a host's native worker or subagent mechanism when the current tool manifest exposes suitable creation, wait, follow-up, interruption, and lifecycle controls. Use only operations that actually exist. Do not invent a cleanup call or assume that a completed worker is still a live resource.

Native host delegation does not automatically produce the CLI's `WorkerReportV1`. The supervising model must still map acceptance IDs to evidence and report the host transport's real limitations.

## Operating Systems

The CLI avoids shell interpolation and normalizes contract write paths for portable safety.

- POSIX process cleanup uses a new process group. A descendant that creates another session or joins another group can escape that cleanup boundary.
- On Windows, native `.exe`/`.com` commands run directly. Standard npm `.cmd` shims are reduced to a native target or an exact Node-shebang target; unrecognized `.cmd` and all `.bat` commands fail closed.
- Windows cleanup uses `taskkill /T /F`. Process ancestry cannot prove cleanup of a descendant that detached before enumeration.
- Filesystem case sensitivity, permissions, symlink privileges, and CLI installation paths differ by environment.

The runtime attaches platform cleanup limitations to delegation reports. A green test on one operating system is not proof that native CLIs, permissions, or path behavior are identical on another.

Repository CI is configured for Ubuntu on Node.js 22, 24, and 26, plus macOS and Windows on Node.js 24. A separate Ubuntu/Node.js 24 package job installs the generated tarball into a fresh npm project, verifies its version, and validates the installed artifact. This matrix exercises the package and CLI; it does not certify every provider CLI version, authentication setup, filesystem, or detached-process behavior.

## Models And Prompts

Workflow Supervisor is model-agnostic at the report boundary, but it does not compensate for a model that cannot understand the task or produce reliable evidence. Newer models often complete small, well-scoped work better with a concise prompt than with orchestration context. That is why v1 defaults to `direct` and loads no route reference.

Use `tracked` for resume risk and `delegated` for genuine independence or isolation, not as a default quality booster.

## Distribution Surfaces

Repository source, GitHub releases, and npm are separate:

```bash
git describe --tags --always
npm view workflow-supervisor version
workflow-supervisor --version
```

Use the command that corresponds to the surface you installed. The v1 GitHub release is created before npm publication and attaches the verified `.tgz`, `SHA256SUMS`, a CycloneDX `sbom.cdx.json`, and `provenance.intoto.json`. The provenance statement records the source commit, workflow run, builder environment, and tarball digest; it is not npm registry provenance or a cryptographic signature. A `v1.0.0` GitHub tag still does not mean npm has been published, and an old global executable can coexist with a newer checkout.
