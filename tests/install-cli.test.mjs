import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "bin", "workflow-skills.mjs");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "workflow-install-"));
}

function runRaw(args, cwd = tempDir()) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function workflowIgnoreCount(project) {
  return fs
    .readFileSync(path.join(project, ".gitignore"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() === ".workflow/").length;
}

test("project install adds .workflow to the target project gitignore once", () => {
  const project = tempDir();
  fs.writeFileSync(path.join(project, ".gitignore"), "node_modules/\n");

  const result = runRaw([
    "install",
    "--agent",
    "all",
    "--scope",
    "project",
    "--project",
    project,
    "--skills",
    "workflow-docs",
  ], project);

  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stdout.match(/Added \.workflow\//g) || []).length, 1);
  assert.equal(workflowIgnoreCount(project), 1);
  assert.match(fs.readFileSync(path.join(project, ".gitignore"), "utf8"), /node_modules\/\n\.workflow\/\n/);
  assert.ok(fs.existsSync(path.join(project, ".agents", "skills", "workflow-docs", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(project, ".claude", "skills", "workflow-docs", "SKILL.md")));

  const repeat = runRaw([
    "install",
    "--agent",
    "codex",
    "--scope",
    "project",
    "--project",
    project,
    "--skills",
    "workflow-docs",
    "--force",
  ], project);

  assert.equal(repeat.status, 0, repeat.stderr);
  assert.equal(workflowIgnoreCount(project), 1);
});

test("project install dry run reports the gitignore update without writing it", () => {
  const project = tempDir();
  const result = runRaw([
    "install",
    "--agent",
    "codex",
    "--scope",
    "project",
    "--project",
    project,
    "--skills",
    "workflow-docs",
    "--dry-run",
  ], project);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would add \.workflow\/ in /);
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
});

test("project installs require an existing directory and never create a missing project", () => {
  const parent = tempDir();
  const project = path.join(parent, "missing-project");
  const result = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
    "--skills", "workflow-docs",
  ], parent);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Project must already exist and be a directory/);
  assert.equal(fs.existsSync(project), false);
});

test("a regular-file target is rejected before project gitignore mutation", () => {
  const project = tempDir();
  const target = path.join(project, "not-a-directory");
  const originalIgnore = Buffer.from("dist/\n# preserve exact bytes\n", "utf8");
  fs.writeFileSync(path.join(project, ".gitignore"), originalIgnore);
  fs.writeFileSync(target, "owned by user\n");

  const result = runRaw([
    "install", "--agent", "generic", "--scope", "project", "--project", project,
    "--target", target, "--skills", "workflow-docs", "--force",
  ], project);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Skill target must be a directory/);
  assert.deepEqual(fs.readFileSync(path.join(project, ".gitignore")), originalIgnore);
  assert.equal(fs.readFileSync(target, "utf8"), "owned by user\n");
});

test("generated control files replace symlink and hard-link entries without following external aliases", async (t) => {
  for (const kind of ["symlink", "hardlink"]) {
    await t.test(kind, () => {
      const sandbox = tempDir();
      const target = path.join(sandbox, "skills");
      const outside = path.join(sandbox, "outside.txt");
      const control = path.join(target, "WORKFLOW_SKILL_PACK.md");
      fs.mkdirSync(target);
      fs.writeFileSync(outside, "external sentinel\n");
      if (kind === "symlink") fs.symlinkSync(outside, control);
      else fs.linkSync(outside, control);

      const result = runRaw([
        "install", "--agent", "generic", "--target", target,
        "--skills", "workflow-supervisor", "--force",
      ], sandbox);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(fs.readFileSync(outside, "utf8"), "external sentinel\n");
      const stat = fs.lstatSync(control);
      assert.equal(stat.isFile(), true);
      assert.equal(stat.isSymbolicLink(), false);
      assert.equal(stat.nlink, 1);
    });
  }
});

test("install and uninstall preserve unrelated target entries byte-for-byte and metadata-in-place", () => {
  const target = path.join(tempDir(), "skills");
  const foreign = path.join(target, "foreign-skill", "keep.txt");
  fs.mkdirSync(path.dirname(foreign), { recursive: true });
  fs.writeFileSync(foreign, "foreign sentinel\n");
  const oldTime = new Date("2000-01-01T00:00:00.000Z");
  fs.utimesSync(foreign, oldTime, oldTime);
  const before = fs.statSync(foreign);

  const installed = runRaw([
    "install", "--agent", "generic", "--target", target,
    "--skills", "workflow-supervisor",
  ]);
  assert.equal(installed.status, 0, installed.stderr);
  let after = fs.statSync(foreign);
  assert.equal(after.ino, before.ino);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(fs.readFileSync(foreign, "utf8"), "foreign sentinel\n");

  const removed = runRaw([
    "uninstall", "--agent", "generic", "--target", target,
    "--skills", "workflow-supervisor",
  ]);
  assert.equal(removed.status, 0, removed.stderr);
  after = fs.statSync(foreign);
  assert.equal(after.ino, before.ino);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(fs.readFileSync(foreign, "utf8"), "foreign sentinel\n");
});

test("multi-agent project install rolls back every target and preserves gitignore bytes", () => {
  const project = tempDir();
  const originalIgnore = Buffer.from("node_modules/\n# no final workflow entry", "utf8");
  fs.writeFileSync(path.join(project, ".gitignore"), originalIgnore);
  fs.writeFileSync(path.join(project, ".claude"), "blocks the second agent target\n");

  const result = runRaw([
    "install", "--agent", "all", "--scope", "project", "--project", project,
    "--skills", "workflow-docs",
  ], project);

  assert.equal(result.status, 1);
  assert.equal(fs.existsSync(path.join(project, ".agents")), false);
  assert.equal(fs.readFileSync(path.join(project, ".claude"), "utf8"), "blocks the second agent target\n");
  assert.deepEqual(fs.readFileSync(path.join(project, ".gitignore")), originalIgnore);
});

test("multi-agent execution-time rollback preserves unrelated files in an earlier target", () => {
  const project = tempDir();
  const codexTarget = path.join(project, ".agents", "skills");
  const foreign = path.join(codexTarget, "foreign-skill", "keep.txt");
  const claudeControlDirectory = path.join(project, ".claude", "skills", "WORKFLOW_SKILL_PACK.md");
  const claudeSentinel = path.join(claudeControlDirectory, "keep.txt");
  fs.mkdirSync(path.dirname(foreign), { recursive: true });
  fs.writeFileSync(foreign, "foreign sentinel\n");
  fs.mkdirSync(claudeControlDirectory, { recursive: true });
  fs.writeFileSync(claudeSentinel, "claude sentinel\n");
  const oldTime = new Date("2000-01-01T00:00:00.000Z");
  fs.utimesSync(foreign, oldTime, oldTime);
  const before = fs.statSync(foreign);

  const result = runRaw([
    "install", "--agent", "all", "--scope", "project", "--project", project,
    "--skills", "workflow-docs", "--force",
  ], project);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to replace directory/);
  assert.equal(fs.existsSync(path.join(codexTarget, "workflow-docs")), false);
  assert.equal(fs.existsSync(path.join(codexTarget, ".workflow-skills-install.json")), false);
  assert.equal(fs.readFileSync(claudeSentinel, "utf8"), "claude sentinel\n");
  const after = fs.statSync(foreign);
  assert.equal(after.ino, before.ino);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(fs.readFileSync(foreign, "utf8"), "foreign sentinel\n");
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
});

test("incremental installs are idempotent and preserve a complete manifest", () => {
  const target = path.join(tempDir(), "skills");
  for (const skill of ["workflow-docs", "work-unit", "workflow-docs"]) {
    const result = runRaw(["install", "--agent", "generic", "--target", target, "--skills", skill]);
    assert.equal(result.status, 0, result.stderr);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(target, ".workflow-skills-install.json"), "utf8"));
  assert.deepEqual(manifest.skills.map((skill) => skill.name), ["work-unit", "workflow-docs"]);
  const context = fs.readFileSync(path.join(target, "WORKFLOW_SKILL_PACK.md"), "utf8");
  assert.match(context, /\$work-unit/);
  assert.match(context, /\$workflow-docs/);
});

test("subset install rejects stale unselected skills without restamping the manifest", () => {
  const sandbox = tempDir();
  const source = path.join(sandbox, "source");
  for (const directory of ["skills", "schemas", "adapters"]) {
    fs.cpSync(path.join(repoRoot, directory), path.join(source, directory), { recursive: true });
  }
  const target = path.join(sandbox, "installed-skills");
  const initial = runRaw([
    "install", "--agent", "generic", "--root", source, "--target", target,
    "--skills", "workflow-docs,work-unit",
  ], sandbox);
  assert.equal(initial.status, 0, initial.stderr);
  const manifestFile = path.join(target, ".workflow-skills-install.json");
  const originalManifest = fs.readFileSync(manifestFile);

  fs.appendFileSync(path.join(source, "skills", "work-unit", "SKILL.md"), "\n<!-- source update -->\n");
  const subset = runRaw([
    "install", "--agent", "generic", "--root", source, "--target", target,
    "--skills", "workflow-docs",
  ], sandbox);

  assert.equal(subset.status, 1);
  assert.match(subset.stderr, /Unselected installed skill work-unit is stale/);
  assert.deepEqual(fs.readFileSync(manifestFile), originalManifest);
});

test("subset uninstall preserves remaining owned skills and metadata", () => {
  const target = path.join(tempDir(), "skills");
  assert.equal(runRaw(["install", "--agent", "generic", "--target", target, "--skills", "workflow-docs,work-unit"]).status, 0);
  const remove = runRaw(["uninstall", "--agent", "generic", "--target", target, "--skills", "workflow-docs"]);
  assert.equal(remove.status, 0, remove.stderr);

  assert.equal(fs.existsSync(path.join(target, "workflow-docs")), false);
  assert.equal(fs.existsSync(path.join(target, "work-unit", "SKILL.md")), true);
  const manifest = JSON.parse(fs.readFileSync(path.join(target, ".workflow-skills-install.json"), "utf8"));
  assert.deepEqual(manifest.skills.map((skill) => skill.name), ["work-unit"]);
  assert.match(fs.readFileSync(path.join(target, "WORKFLOW_SKILL_PACK.md"), "utf8"), /\$work-unit/);
});

test("uninstall refuses unowned targets and checksum drift unless forced", () => {
  const unowned = path.join(tempDir(), "skills");
  fs.mkdirSync(path.join(unowned, "workflow-docs"), { recursive: true });
  fs.writeFileSync(path.join(unowned, "workflow-docs", "KEEP.txt"), "user-owned\n");
  const refused = runRaw(["uninstall", "--agent", "generic", "--target", unowned, "--skills", "workflow-docs"]);
  assert.equal(refused.status, 1);
  assert.equal(fs.existsSync(path.join(unowned, "workflow-docs", "KEEP.txt")), true);

  const target = path.join(tempDir(), "skills");
  assert.equal(runRaw(["install", "--agent", "generic", "--target", target, "--skills", "workflow-docs"]).status, 0);
  fs.appendFileSync(path.join(target, "workflow-docs", "SKILL.md"), "\nlocal drift\n");
  const drift = runRaw(["uninstall", "--agent", "generic", "--target", target, "--skills", "workflow-docs"]);
  assert.equal(drift.status, 1);
  assert.match(drift.stderr, /integrity mismatch/);
  assert.equal(fs.existsSync(path.join(target, "workflow-docs", "SKILL.md")), true);
  const forced = runRaw(["uninstall", "--agent", "generic", "--target", target, "--skills", "workflow-docs", "--force"]);
  assert.equal(forced.status, 0, forced.stderr);
});

test("install and uninstall reject source-target overlap before mutation", () => {
  const sandbox = tempDir();
  const clone = path.join(sandbox, "repo");
  fs.cpSync(repoRoot, clone, { recursive: true });
  const sourceSkill = path.join(clone, "skills", "workflow-docs", "SKILL.md");

  const install = runRaw([
    "install", "--agent", "generic", "--root", clone, "--target", path.join(clone, "skills"),
    "--skills", "workflow-docs", "--force",
  ], sandbox);
  assert.equal(install.status, 1);
  assert.match(install.stderr, /overlap is unsafe/);
  assert.equal(fs.existsSync(sourceSkill), true);

  const rootTarget = runRaw([
    "install", "--agent", "generic", "--root", clone, "--target", clone,
    "--skills", "workflow-supervisor", "--force",
  ], sandbox);
  assert.equal(rootTarget.status, 1);
  assert.match(rootTarget.stderr, /package root\/target overlap is unsafe/);
  assert.equal(fs.existsSync(path.join(clone, ".workflow-skills-install.json")), false);
  assert.equal(fs.existsSync(path.join(clone, "workflow-supervisor")), false);

  fs.writeFileSync(path.join(clone, "skills", ".workflow-skills-install.json"), JSON.stringify({
    package: "workflow-supervisor",
    version: "0.3.0",
    agent: "generic",
    scope: "user",
    project: null,
    target: path.join(clone, "skills"),
    installedAt: new Date().toISOString(),
    workflowGitignore: null,
    skills: [{ name: "workflow-docs", checksum: "0".repeat(64) }],
  }));
  const uninstall = runRaw([
    "uninstall", "--agent", "generic", "--root", clone, "--target", path.join(clone, "skills"),
    "--skills", "workflow-docs", "--force",
  ], sandbox);
  assert.equal(uninstall.status, 1);
  assert.match(uninstall.stderr, /overlap is unsafe/);
  assert.equal(fs.existsSync(sourceSkill), true);
});

test("agent all rejects one shared target without leaving partial state", () => {
  const target = path.join(tempDir(), "shared-skills");
  const result = runRaw(["install", "--agent", "all", "--target", target, "--skills", "workflow-docs"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /distinct install targets/);
  assert.equal(fs.existsSync(target), false);
});

test("doctor verifies installed files, checksums, and package freshness", () => {
  const target = path.join(tempDir(), "skills");
  assert.equal(runRaw(["install", "--agent", "generic", "--target", target, "--skills", "workflow-docs"]).status, 0);
  const healthy = runRaw(["doctor", "--agent", "generic", "--target", target, "--require-pass"]);
  assert.equal(healthy.status, 0, healthy.stderr);
  assert.equal(JSON.parse(healthy.stdout).status, "PASS");

  fs.rmSync(path.join(target, "workflow-docs", "SKILL.md"));
  const brokenRaw = runRaw(["doctor", "--agent", "generic", "--target", target, "--require-pass"]);
  assert.equal(brokenRaw.status, 1);
  const broken = JSON.parse(brokenRaw.stdout);
  assert.equal(broken.status, "BLOCKED");
  assert.ok(broken.errors.some((error) => error.includes("checksum mismatch")));
});

test("doctor verifies generated context and project workflow-ignore state", () => {
  const project = tempDir();
  const installed = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
    "--skills", "workflow-docs",
  ], project);
  assert.equal(installed.status, 0, installed.stderr);
  const target = path.join(project, ".agents", "skills");

  fs.rmSync(path.join(target, "WORKFLOW_SKILL_PACK.md"));
  let checked = runRaw(["doctor", "--agent", "codex", "--target", target, "--require-pass"], project);
  assert.equal(checked.status, 1);
  assert.match(JSON.parse(checked.stdout).errors.join(" "), /WORKFLOW_SKILL_PACK\.md is missing/);

  const repaired = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
    "--skills", "workflow-docs", "--force",
  ], project);
  assert.equal(repaired.status, 0, repaired.stderr);
  fs.writeFileSync(path.join(project, ".gitignore"), "node_modules/\n");
  checked = runRaw(["doctor", "--agent", "codex", "--target", target, "--require-pass"], project);
  assert.equal(checked.status, 1);
  assert.match(JSON.parse(checked.stdout).errors.join(" "), /workflow ignore check failed/);
});

test("doctor all aggregates every agent and require-pass fails if any install is unhealthy", () => {
  const project = tempDir();
  const install = runRaw([
    "install", "--agent", "all", "--scope", "project", "--project", project,
    "--skills", "workflow-docs",
  ], project);
  assert.equal(install.status, 0, install.stderr);
  fs.rmSync(path.join(project, ".claude", "skills", "workflow-docs", "SKILL.md"));

  const checked = runRaw([
    "doctor", "--agent", "all", "--scope", "project", "--project", project, "--require-pass",
  ], project);
  assert.equal(checked.status, 1);
  const reports = JSON.parse(checked.stdout);
  assert.deepEqual(reports.map((report) => report.agent), ["codex", "claude-code"]);
  assert.deepEqual(reports.map((report) => report.status), ["PASS", "BLOCKED"]);
});

test("emit-context defaults to supervisor only, references are opt-in, and overwrite requires force", () => {
  const cwd = tempDir();
  const out = path.join(cwd, "AGENTS.md");
  const initial = runRaw(["emit-context", "--agent", "generic", "--target", path.join(cwd, "skills"), "--out", out], cwd);
  assert.equal(initial.status, 0, initial.stderr);
  const defaultText = fs.readFileSync(out, "utf8");
  assert.match(defaultText, /Skill: \$workflow-supervisor/);
  assert.doesNotMatch(defaultText, /Skill: \$workflow-docs/);
  assert.match(defaultText, /Bundled reference bodies are not embedded/);

  const refused = runRaw(["emit-context", "--agent", "generic", "--target", path.join(cwd, "skills"), "--out", out], cwd);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /Use --force to overwrite/);

  const forced = runRaw([
    "emit-context", "--agent", "generic", "--target", path.join(cwd, "skills"), "--skills", "workflow-docs",
    "--references", "--out", out, "--force",
  ], cwd);
  assert.equal(forced.status, 0, forced.stderr);
  const emitted = fs.readFileSync(out, "utf8");
  for (const reference of [
    "workflow-foundations.md",
    "work-units-and-delegation.md",
    "verification-and-repair.md",
    "decisions-handoff-and-outcome.md",
  ]) {
    assert.match(emitted, new RegExp(`Bundled Reference: \\$workflow-docs/references/${reference.replace(".", "\\.")}`));
  }
});

test("emit-context --force replaces an output symlink instead of overwriting its referent", () => {
  const cwd = tempDir();
  const outside = path.join(cwd, "outside.md");
  const out = path.join(cwd, "AGENTS.md");
  fs.writeFileSync(outside, "external sentinel\n");
  fs.symlinkSync(outside, out);

  const result = runRaw(["emit-context", "--agent", "generic", "--out", out, "--force"], cwd);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(outside, "utf8"), "external sentinel\n");
  assert.equal(fs.lstatSync(out).isSymbolicLink(), false);
  assert.match(fs.readFileSync(out, "utf8"), /Workflow Skill Pack Portable Context/);
});

test("emit-context --force never replaces a directory", () => {
  const cwd = tempDir();
  const out = path.join(cwd, "AGENTS.md");
  const sentinel = path.join(out, "keep.txt");
  fs.mkdirSync(out);
  fs.writeFileSync(sentinel, "keep\n");

  const result = runRaw(["emit-context", "--agent", "generic", "--out", out, "--force"], cwd);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to replace directory/);
  assert.equal(fs.readFileSync(sentinel, "utf8"), "keep\n");
});
