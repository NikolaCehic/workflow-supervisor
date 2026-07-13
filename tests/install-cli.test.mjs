import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "bin", "workflow-skills.mjs");
const onlySkill = "workflow-supervisor";

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

function runAsync(args, cwd = tempDir()) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (status, signal) => resolve({ status, signal, stdout, stderr }));
  });
}

function workflowIgnoreCount(project) {
  const file = path.join(project, ".gitignore");
  if (!fs.existsSync(file)) return 0;
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() === ".workflow/").length;
}

function readManifest(target) {
  return JSON.parse(fs.readFileSync(path.join(target, ".workflow-skills-install.json"), "utf8"));
}

test("project install adds .workflow to gitignore once and installs the one-skill pack for both agents", () => {
  const project = tempDir();
  fs.writeFileSync(path.join(project, ".gitignore"), "node_modules/\n");

  const result = runRaw([
    "install", "--agent", "all", "--scope", "project", "--project", project,
  ], project);

  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stdout.match(/Added \.workflow\//g) || []).length, 1);
  assert.equal(workflowIgnoreCount(project), 1);
  assert.match(fs.readFileSync(path.join(project, ".gitignore"), "utf8"), /node_modules\/\n# workflow-supervisor: managed \.workflow\/; gitignore-existed=true\n\.workflow\/\n/);
  assert.ok(fs.existsSync(path.join(project, ".agents", "skills", onlySkill, "SKILL.md")));
  assert.ok(fs.existsSync(path.join(project, ".claude", "skills", onlySkill, "SKILL.md")));
  const codexSkill = fs.readFileSync(path.join(project, ".agents", "skills", onlySkill, "SKILL.md"), "utf8");
  const claudeSkill = fs.readFileSync(path.join(project, ".claude", "skills", onlySkill, "SKILL.md"), "utf8");
  assert.doesNotMatch(codexSkill, /^disable-model-invocation:/m);
  assert.match(claudeSkill, /^disable-model-invocation: true$/m);
  assert.match(fs.readFileSync(path.join(project, ".agents", "skills", "WORKFLOW_SKILL_PACK.md"), "utf8"), /`\$workflow-supervisor`/);
  assert.match(fs.readFileSync(path.join(project, ".claude", "skills", "WORKFLOW_SKILL_PACK.md"), "utf8"), /`\/workflow-supervisor`/);
  const originalIgnoreOwnership = readManifest(path.join(project, ".agents", "skills")).workflowGitignore;

  const repeat = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
  ], project);

  assert.equal(repeat.status, 0, repeat.stderr);
  assert.equal(workflowIgnoreCount(project), 1);
  const repeatedManifest = readManifest(path.join(project, ".agents", "skills"));
  assert.deepEqual(repeatedManifest.skills.map(({ name }) => name), [onlySkill]);
  assert.deepEqual(repeatedManifest.workflowGitignore, originalIgnoreOwnership);
});

test("project install dry run reports the gitignore update without writing any state", () => {
  const project = tempDir();
  const result = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project, "--dry-run",
  ], project);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would add \.workflow\/ in /);
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
  assert.equal(fs.existsSync(path.join(project, ".agents")), false);
});

test("project installs require an existing directory and never create a missing project", () => {
  const parent = tempDir();
  const project = path.join(parent, "missing-project");
  const result = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
  ], parent);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Project must already exist and be a directory/);
  assert.equal(fs.existsSync(project), false);
});

test("a regular-file target is rejected before project gitignore mutation", () => {
  const project = tempDir();
  const target = path.join(project, ".agents", "skills");
  const originalIgnore = Buffer.from("dist/\n# preserve exact bytes\n", "utf8");
  fs.writeFileSync(path.join(project, ".gitignore"), originalIgnore);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, "owned by user\n");

  const result = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project, "--force",
  ], project);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Skill target must be a directory/);
  assert.deepEqual(fs.readFileSync(path.join(project, ".gitignore")), originalIgnore);
  assert.equal(fs.readFileSync(target, "utf8"), "owned by user\n");
});

test("a dangling project gitignore symlink is rejected without target mutation", () => {
  const project = tempDir();
  const ignoreFile = path.join(project, ".gitignore");
  const missing = path.join(project, "missing-ignore-target");
  fs.symlinkSync(missing, ignoreFile);

  const result = runRaw(["install", "--agent", "codex", "--scope", "project", "--project", project], project);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /gitignore must be one regular, non-symlink/);
  assert.equal(fs.lstatSync(ignoreFile).isSymbolicLink(), true);
  assert.equal(fs.readlinkSync(ignoreFile), missing);
  assert.equal(fs.existsSync(path.join(project, ".agents")), false);
});

test("Claude user installs honor CLAUDE_CONFIG_DIR", () => {
  const sandbox = tempDir();
  const home = path.join(sandbox, "home");
  const config = path.join(sandbox, "claude-config");
  fs.mkdirSync(home);
  const result = spawnSync(process.execPath, [cli, "install", "--agent", "claude-code", "--scope", "user"], {
    cwd: sandbox,
    encoding: "utf8",
    env: { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: config },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(config, "skills", onlySkill, "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(home, ".claude", "skills")), false);
});

test("project native targets reject symlink ancestors before writing outside the project", async (t) => {
  for (const [agent, parent] of [["codex", ".agents"], ["claude-code", ".claude"]]) {
    await t.test(agent, () => {
      const project = tempDir();
      const outside = tempDir();
      fs.symlinkSync(outside, path.join(project, parent), "dir");
      const result = runRaw(["install", "--agent", agent, "--scope", "project", "--project", project], project);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /must not traverse a symlink|escapes the project/);
      assert.equal(fs.existsSync(path.join(outside, "skills", onlySkill)), false);
      assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
    });
  }
});

test("owned installs cannot be silently reclassified between user and project scope", async (t) => {
  await t.test("project to user", () => {
    const project = tempDir();
    const target = path.join(project, ".agents", "skills");
    assert.equal(runRaw(["install", "--agent", "codex", "--scope", "project", "--project", project], project).status, 0);
    const manifest = fs.readFileSync(path.join(target, ".workflow-skills-install.json"));
    const rejected = runRaw(["install", "--agent", "codex", "--scope", "user", "--target", target], project);
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /scope user does not match owned manifest scope project/);
    assert.deepEqual(fs.readFileSync(path.join(target, ".workflow-skills-install.json")), manifest);
    assert.equal(workflowIgnoreCount(project), 1);
  });

  await t.test("user to project", () => {
    const project = tempDir();
    const target = path.join(project, ".agents", "skills");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    assert.equal(runRaw(["install", "--agent", "codex", "--scope", "user", "--target", target], project).status, 0);
    const rejected = runRaw(["install", "--agent", "codex", "--scope", "project", "--project", project], project);
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /scope project does not match owned manifest scope user/);
    assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
  });
});

test("install requires force before replacing an unowned generated control path", () => {
  const target = path.join(tempDir(), "skills");
  const control = path.join(target, "WORKFLOW_SKILL_PACK.md");
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(control, "user-owned sentinel\n");

  const refused = runRaw(["install", "--agent", "generic", "--target", target]);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /control file is not owned/);
  assert.equal(fs.readFileSync(control, "utf8"), "user-owned sentinel\n");
  assert.equal(fs.existsSync(path.join(target, ".workflow-skills-install.json")), false);
  assert.equal(fs.existsSync(path.join(target, onlySkill)), false);

  const forced = runRaw(["install", "--agent", "generic", "--target", target, "--force"]);
  assert.equal(forced.status, 0, forced.stderr);
  assert.match(fs.readFileSync(control, "utf8"), /Workflow Supervisor/);
});

test("install, upgrade, and uninstall protect modified owned context without force", () => {
  const target = path.join(tempDir(), "skills");
  assert.equal(runRaw(["install", "--agent", "generic", "--target", target]).status, 0);
  const control = path.join(target, "WORKFLOW_SKILL_PACK.md");
  fs.appendFileSync(control, "USER LOCAL CUSTOMIZATION\n");
  const customized = fs.readFileSync(control);

  for (const command of ["install", "upgrade", "uninstall"]) {
    const refused = runRaw([command, "--agent", "generic", "--target", target]);
    assert.equal(refused.status, 1, `${command}: ${refused.stderr}`);
    assert.match(refused.stderr, /WORKFLOW_SKILL_PACK\.md integrity mismatch/);
    assert.deepEqual(fs.readFileSync(control), customized);
    assert.equal(fs.existsSync(path.join(target, onlySkill, "SKILL.md")), true);
    assert.equal(fs.existsSync(path.join(target, ".workflow-skills-install.json")), true);
  }

  const forced = runRaw(["uninstall", "--agent", "generic", "--target", target, "--force"]);
  assert.equal(forced.status, 0, forced.stderr);
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
        "install", "--agent", "generic", "--target", target, "--force",
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

  const installed = runRaw(["install", "--agent", "generic", "--target", target]);
  assert.equal(installed.status, 0, installed.stderr);
  let after = fs.statSync(foreign);
  assert.equal(after.ino, before.ino);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(fs.readFileSync(foreign, "utf8"), "foreign sentinel\n");

  const removed = runRaw(["uninstall", "--agent", "generic", "--target", target]);
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
    "install", "--agent", "all", "--scope", "project", "--project", project, "--force",
  ], project);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to replace directory/);
  assert.equal(fs.existsSync(path.join(codexTarget, onlySkill)), false);
  assert.equal(fs.existsSync(path.join(codexTarget, ".workflow-skills-install.json")), false);
  assert.equal(fs.readFileSync(claudeSentinel, "utf8"), "claude sentinel\n");
  const after = fs.statSync(foreign);
  assert.equal(after.ino, before.ino);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(fs.readFileSync(foreign, "utf8"), "foreign sentinel\n");
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
});

test("reinstall is idempotent and the manifest and generated context contain only workflow-supervisor", () => {
  const target = path.join(tempDir(), "skills");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = runRaw(["install", "--agent", "generic", "--target", target]);
    assert.equal(result.status, 0, result.stderr);
  }

  assert.deepEqual(readManifest(target).skills.map(({ name }) => name), [onlySkill]);
  const context = fs.readFileSync(path.join(target, "WORKFLOW_SKILL_PACK.md"), "utf8");
  assert.match(context, /\$workflow-supervisor/);
  assert.doesNotMatch(context, /\$workflow-docs|\$work-unit|\$worker-roles/);
});

test("install and uninstall reject the removed multi-skill selection surface before mutation", () => {
  const target = path.join(tempDir(), "skills");
  const install = runRaw([
    "install", "--agent", "generic", "--target", target, "--skills", onlySkill,
  ]);
  assert.equal(install.status, 1);
  assert.match(install.stderr, /Unknown option for install: --skills/);
  assert.equal(fs.existsSync(target), false);

  const healthy = runRaw(["install", "--agent", "generic", "--target", target]);
  assert.equal(healthy.status, 0, healthy.stderr);
  const manifestBefore = fs.readFileSync(path.join(target, ".workflow-skills-install.json"));
  const uninstall = runRaw([
    "uninstall", "--agent", "generic", "--target", target, "--skills", onlySkill,
  ]);
  assert.equal(uninstall.status, 1);
  assert.match(uninstall.stderr, /Unknown option for uninstall: --skills/);
  assert.deepEqual(fs.readFileSync(path.join(target, ".workflow-skills-install.json")), manifestBefore);
  assert.ok(fs.existsSync(path.join(target, onlySkill, "SKILL.md")));
});

test("uninstall dry run reports removal without mutating owned files", () => {
  const target = path.join(tempDir(), "skills");
  assert.equal(runRaw(["install", "--agent", "generic", "--target", target]).status, 0);
  const files = [
    path.join(target, onlySkill, "SKILL.md"),
    path.join(target, "WORKFLOW_SKILL_PACK.md"),
    path.join(target, ".workflow-skills-install.json"),
  ];
  const before = files.map((file) => fs.readFileSync(file));

  const result = runRaw(["uninstall", "--agent", "generic", "--target", target, "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would remove 1 skills/);
  assert.deepEqual(files.map((file) => fs.readFileSync(file)), before);
});

test("uninstall refuses unowned targets and checksum drift unless forced", () => {
  const unowned = path.join(tempDir(), "skills");
  fs.mkdirSync(path.join(unowned, onlySkill), { recursive: true });
  fs.writeFileSync(path.join(unowned, onlySkill, "KEEP.txt"), "user-owned\n");
  const refused = runRaw(["uninstall", "--agent", "generic", "--target", unowned]);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /Missing owned install manifest/);
  assert.equal(fs.existsSync(path.join(unowned, onlySkill, "KEEP.txt")), true);

  const target = path.join(tempDir(), "skills");
  assert.equal(runRaw(["install", "--agent", "generic", "--target", target]).status, 0);
  fs.appendFileSync(path.join(target, onlySkill, "SKILL.md"), "\nlocal drift\n");
  const drift = runRaw(["uninstall", "--agent", "generic", "--target", target]);
  assert.equal(drift.status, 1);
  assert.match(drift.stderr, /integrity mismatch/);
  assert.equal(fs.existsSync(path.join(target, onlySkill, "SKILL.md")), true);
  const forced = runRaw(["uninstall", "--agent", "generic", "--target", target, "--force"]);
  assert.equal(forced.status, 0, forced.stderr);
});

test("install and uninstall reject source-target overlap before mutation", () => {
  const sandbox = tempDir();
  const clone = path.join(sandbox, "repo");
  fs.cpSync(repoRoot, clone, { recursive: true });
  const sourceSkill = path.join(clone, "skills", onlySkill, "SKILL.md");

  const install = runRaw([
    "install", "--agent", "generic", "--root", clone, "--target", path.join(clone, "skills"), "--force",
  ], sandbox);
  assert.equal(install.status, 1);
  assert.match(install.stderr, /overlap is unsafe/);
  assert.equal(fs.existsSync(sourceSkill), true);

  const rootTarget = runRaw([
    "install", "--agent", "generic", "--root", clone, "--target", clone, "--force",
  ], sandbox);
  assert.equal(rootTarget.status, 1);
  assert.match(rootTarget.stderr, /package root\/target overlap is unsafe/);
  assert.equal(fs.existsSync(path.join(clone, ".workflow-skills-install.json")), false);
  assert.equal(fs.existsSync(path.join(clone, onlySkill)), false);

  const uninstall = runRaw([
    "uninstall", "--agent", "generic", "--root", clone, "--target", path.join(clone, "skills"), "--force",
  ], sandbox);
  assert.equal(uninstall.status, 1);
  assert.match(uninstall.stderr, /overlap is unsafe/);
  assert.equal(fs.existsSync(sourceSkill), true);
});

test("agent all rejects one shared target without leaving partial state", () => {
  const target = path.join(tempDir(), "shared-skills");
  const result = runRaw(["install", "--agent", "all", "--target", target]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /distinct install targets/);
  assert.equal(fs.existsSync(target), false);
});

test("doctor verifies installed files, checksums, package freshness, and the one-skill manifest", () => {
  const target = path.join(tempDir(), "skills");
  assert.equal(runRaw(["install", "--agent", "generic", "--target", target]).status, 0);
  const healthyRaw = runRaw(["doctor", "--agent", "generic", "--target", target, "--require-pass"]);
  assert.equal(healthyRaw.status, 0, healthyRaw.stderr);
  const healthy = JSON.parse(healthyRaw.stdout);
  assert.equal(healthy.status, "PASS");
  assert.deepEqual(healthy.installedSkills.map(({ name }) => name), [onlySkill]);

  fs.rmSync(path.join(target, onlySkill, "SKILL.md"));
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
  ], project);
  assert.equal(installed.status, 0, installed.stderr);
  const target = path.join(project, ".agents", "skills");

  fs.rmSync(path.join(target, "WORKFLOW_SKILL_PACK.md"));
  let checked = runRaw(["doctor", "--agent", "codex", "--target", target, "--require-pass"], project);
  assert.equal(checked.status, 1);
  assert.match(JSON.parse(checked.stdout).errors.join(" "), /WORKFLOW_SKILL_PACK\.md is missing/);

  const repaired = runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project, "--force",
  ], project);
  assert.equal(repaired.status, 0, repaired.stderr);
  fs.writeFileSync(path.join(project, ".gitignore"), "node_modules/\n");
  checked = runRaw(["doctor", "--agent", "codex", "--target", target, "--require-pass"], project);
  assert.equal(checked.status, 1);
  assert.match(JSON.parse(checked.stdout).errors.join(" "), /workflow ignore check failed/);
});

test("doctor enforces requested scope and installer-owned gitignore provenance", () => {
  const project = tempDir();
  const installed = runRaw(["install", "--agent", "codex", "--scope", "project", "--project", project], project);
  assert.equal(installed.status, 0, installed.stderr);
  const target = path.join(project, ".agents", "skills");

  const wrongScope = runRaw(["doctor", "--agent", "codex", "--scope", "user", "--target", target, "--require-pass"], project);
  assert.equal(wrongScope.status, 1);
  assert.match(wrongScope.stdout, /doctor scope user does not match owned manifest scope project/);

  const ignoreFile = path.join(project, ".gitignore");
  const withoutMarker = fs.readFileSync(ignoreFile, "utf8")
    .split(/\n/)
    .filter((line) => !line.startsWith("# workflow-supervisor: managed .workflow/"))
    .join("\n");
  fs.writeFileSync(ignoreFile, withoutMarker);
  const brokenOwnership = runRaw(["doctor", "--agent", "codex", "--scope", "project", "--project", project, "--require-pass"], project);
  assert.equal(brokenOwnership.status, 1);
  assert.match(brokenOwnership.stdout, /exactly one intact ownership marker/);

  const repaired = runRaw(["install", "--agent", "codex", "--scope", "project", "--project", project, "--force"], project);
  assert.equal(repaired.status, 0, repaired.stderr);
  assert.equal(runRaw(["doctor", "--agent", "codex", "--scope", "project", "--project", project, "--require-pass"], project).status, 0);
});

test("doctor all aggregates every agent and require-pass fails if any install is unhealthy", () => {
  const project = tempDir();
  const install = runRaw([
    "install", "--agent", "all", "--scope", "project", "--project", project,
  ], project);
  assert.equal(install.status, 0, install.stderr);
  fs.rmSync(path.join(project, ".claude", "skills", onlySkill, "SKILL.md"));

  const checked = runRaw([
    "doctor", "--agent", "all", "--scope", "project", "--project", project, "--require-pass",
  ], project);
  assert.equal(checked.status, 1);
  const reports = JSON.parse(checked.stdout);
  assert.deepEqual(reports.map((report) => report.agent), ["codex", "claude-code"]);
  assert.deepEqual(reports.map((report) => report.status), ["PASS", "BLOCKED"]);
});

test("project uninstall preserves a workflow ignore entry that predated installation byte-for-byte", () => {
  const project = tempDir();
  const ignore = Buffer.from("dist/\n.workflow/\n# user-owned final line", "utf8");
  fs.writeFileSync(path.join(project, ".gitignore"), ignore);
  assert.equal(runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
  ], project).status, 0);

  const removed = runRaw([
    "uninstall", "--agent", "codex", "--scope", "project", "--project", project,
  ], project);
  assert.equal(removed.status, 0, removed.stderr);
  assert.deepEqual(fs.readFileSync(path.join(project, ".gitignore")), ignore);
});

test("project uninstall removes its marked ignore pair and preserves a later user duplicate", () => {
  const project = tempDir("later-user-ignore");
  const ignoreFile = path.join(project, ".gitignore");
  fs.writeFileSync(ignoreFile, "node_modules/\n");
  const installed = runRaw(["install", "--agent", "codex", "--scope", "project", "--project", project], project);
  assert.equal(installed.status, 0, installed.stderr);
  fs.appendFileSync(ignoreFile, "# user-owned duplicate\n.workflow/\n");

  const removed = runRaw(["uninstall", "--agent", "codex", "--scope", "project", "--project", project], project);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(fs.readFileSync(ignoreFile, "utf8"), "node_modules/\n# user-owned duplicate\n.workflow/\n");
  assert.match(removed.stdout, /Removed \.workflow\/ from /);
  assert.match(removed.stdout, /Retained \.workflow\/ in .*a user-managed ignore entry remains/);
});

test("project uninstall never removes an unmarked workflow ignore entry", () => {
  const project = tempDir("unmarked-ignore");
  const ignoreFile = path.join(project, ".gitignore");
  const installed = runRaw(["install", "--agent", "codex", "--scope", "project", "--project", project], project);
  assert.equal(installed.status, 0, installed.stderr);
  const withoutMarker = fs.readFileSync(ignoreFile, "utf8")
    .split(/\n/)
    .filter((line) => !line.startsWith("# workflow-supervisor: managed .workflow/"))
    .join("\n");
  fs.writeFileSync(ignoreFile, withoutMarker);

  const refused = runRaw(["uninstall", "--agent", "codex", "--scope", "project", "--project", project], project);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /workflow ignore integrity mismatch/i);
  assert.equal(fs.readFileSync(ignoreFile, "utf8"), ".workflow/\n");
  const removed = runRaw(["uninstall", "--agent", "codex", "--scope", "project", "--project", project, "--force"], project);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(fs.readFileSync(ignoreFile, "utf8"), ".workflow/\n");
  assert.match(removed.stdout, /Retained \.workflow\/ in .*no intact installer ownership marker/);
});

test("final project uninstall removes installer-owned ignore and empty agent directories on a pristine project", () => {
  const project = tempDir();
  assert.equal(runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
  ], project).status, 0);
  assert.equal(workflowIgnoreCount(project), 1);

  const removed = runRaw([
    "uninstall", "--agent", "codex", "--scope", "project", "--project", project,
  ], project);
  assert.equal(removed.status, 0, removed.stderr);
  assert.match(removed.stdout, /Removed \.workflow\/ from /);
  assert.doesNotMatch(removed.stdout, /undefined/);
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
  assert.equal(fs.existsSync(path.join(project, ".agents")), false);
});

test("project uninstall retains installer-owned ignore when workflow state still exists", () => {
  const project = tempDir();
  assert.equal(runRaw([
    "install", "--agent", "codex", "--scope", "project", "--project", project,
  ], project).status, 0);
  fs.mkdirSync(path.join(project, ".workflow"));
  fs.writeFileSync(path.join(project, ".workflow", "state.json"), "{\"keep\":true}\n");

  const removed = runRaw([
    "uninstall", "--agent", "codex", "--scope", "project", "--project", project,
  ], project);
  assert.equal(removed.status, 0, removed.stderr);
  assert.match(removed.stdout, /Retained \.workflow\/ in .*\.gitignore: \.workflow contains retained state/);
  assert.doesNotMatch(removed.stdout, /undefined/);
  assert.equal(workflowIgnoreCount(project), 1);
  assert.equal(fs.readFileSync(path.join(project, ".workflow", "state.json"), "utf8"), "{\"keep\":true}\n");
});

test("multi-agent project lifecycle keeps ignore until the final install is removed", () => {
  const project = tempDir();
  assert.equal(runRaw([
    "install", "--agent", "all", "--scope", "project", "--project", project,
  ], project).status, 0);

  const first = runRaw([
    "uninstall", "--agent", "codex", "--scope", "project", "--project", project,
  ], project);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(workflowIgnoreCount(project), 1);
  assert.ok(fs.existsSync(path.join(project, ".claude", "skills", onlySkill, "SKILL.md")));

  const final = runRaw([
    "uninstall", "--agent", "claude-code", "--scope", "project", "--project", project,
  ], project);
  assert.equal(final.status, 0, final.stderr);
  assert.match(final.stdout, /Removed \.workflow\/ from /);
  assert.doesNotMatch(`${first.stdout}${final.stdout}`, /undefined/);
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
  assert.equal(fs.existsSync(path.join(project, ".agents")), false);
  assert.equal(fs.existsSync(path.join(project, ".claude")), false);
});

test("sequential cross-agent installs preserve managed-ignore ownership in either order", async (t) => {
  for (const order of [["codex", "claude-code"], ["claude-code", "codex"]]) {
    await t.test(order.join(" then "), () => {
      const project = tempDir();
      for (const agent of order) {
        const installed = runRaw(["install", "--agent", agent, "--scope", "project", "--project", project], project);
        assert.equal(installed.status, 0, installed.stderr);
      }
      for (const agent of order) {
        const removed = runRaw(["uninstall", "--agent", agent, "--scope", "project", "--project", project], project);
        assert.equal(removed.status, 0, removed.stderr);
        assert.doesNotMatch(removed.stdout, /undefined/);
      }
      assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
      assert.equal(fs.existsSync(path.join(project, ".agents")), false);
      assert.equal(fs.existsSync(path.join(project, ".claude")), false);
    });
  }
});

test("separate concurrent project operations serialize shared gitignore lifecycle", async () => {
  const project = tempDir();
  const installs = await Promise.all(["codex", "claude-code"].map((agent) => runAsync([
    "install", "--agent", agent, "--scope", "project", "--project", project,
  ], project)));
  for (const result of installs) assert.equal(result.status, 0, result.stderr);
  assert.equal(workflowIgnoreCount(project), 1);

  const removals = await Promise.all(["codex", "claude-code"].map((agent) => runAsync([
    "uninstall", "--agent", agent, "--scope", "project", "--project", project,
  ], project)));
  for (const result of removals) {
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout, /undefined/);
  }
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
  assert.equal(fs.existsSync(path.join(project, ".agents")), false);
  assert.equal(fs.existsSync(path.join(project, ".claude")), false);
});

test("emit-context defaults to direct and profile exports embed only their selected reference", () => {
  const cwd = tempDir();
  const out = path.join(cwd, "AGENTS.md");
  const initial = runRaw([
    "emit-context", "--agent", "generic", "--target", path.join(cwd, "skills"), "--out", out,
  ], cwd);
  assert.equal(initial.status, 0, initial.stderr);
  const direct = fs.readFileSync(out, "utf8");
  assert.match(direct, /Skill: \$workflow-supervisor/);
  assert.doesNotMatch(direct, /Skill: \$workflow-docs/);
  assert.match(direct, /Linked references are omitted/);
  assert.doesNotMatch(direct, /Bundled Reference:/);

  const refused = runRaw([
    "emit-context", "--agent", "generic", "--target", path.join(cwd, "skills"), "--out", out,
  ], cwd);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /Use --force to overwrite/);

  const trackedResult = runRaw([
    "emit-context", "--agent", "generic", "--profile", "tracked", "--out", out, "--force",
  ], cwd);
  assert.equal(trackedResult.status, 0, trackedResult.stderr);
  const tracked = fs.readFileSync(out, "utf8");
  assert.match(tracked, /Bundled Reference: \$workflow-supervisor\/references\/tracked-work\.md/);
  assert.doesNotMatch(tracked, /Bundled Reference: \$workflow-supervisor\/references\/(?:delegated-work|verification)\.md/);

  const delegatedResult = runRaw([
    "emit-context", "--agent", "generic", "--profile", "delegated", "--out", out, "--force",
  ], cwd);
  assert.equal(delegatedResult.status, 0, delegatedResult.stderr);
  const delegated = fs.readFileSync(out, "utf8");
  assert.match(delegated, /Bundled Reference: \$workflow-supervisor\/references\/delegated-work\.md/);
  assert.doesNotMatch(delegated, /Bundled Reference: \$workflow-supervisor\/references\/(?:tracked-work|verification)\.md/);
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
  assert.match(fs.readFileSync(out, "utf8"), /Workflow Supervisor Portable Context/);
});

test("emit-context refuses a dangling output symlink without force", () => {
  const cwd = tempDir();
  const out = path.join(cwd, "AGENTS.md");
  const missing = path.join(cwd, "missing.md");
  fs.symlinkSync(missing, out);

  const result = runRaw(["emit-context", "--agent", "generic", "--out", out], cwd);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Output exists/);
  assert.equal(fs.lstatSync(out).isSymbolicLink(), true);
  assert.equal(fs.readlinkSync(out), missing);
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
