import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_OUTPUT_BYTES = 10 * 1024 * 1024;
const DEFAULT_QUIESCENCE_MS = 100;
const TERMINATION_GRACE_MS = 25;
const EXIT_AFTER_KILL_MS = 2_000;

function requireCommand(command) {
  if (typeof command !== "string" || command.length === 0) {
    throw new TypeError("command must be a non-empty string");
  }
}

function requireArgs(args) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("args must be an array of strings");
  }
}

function requirePositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
}

function requireNonNegativeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
}

function delay(milliseconds) {
  if (milliseconds <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function boundedExit(child, milliseconds) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off("exit", onExit);
      child.off("close", onClose);
      resolve(value);
    };
    const onExit = (status, signal) => finish({ status, signal });
    const onClose = (status, signal) => finish({ status, signal });
    const timer = setTimeout(() => finish(null), milliseconds);
    child.once("exit", onExit);
    child.once("close", onClose);
  });
}

function posixGroupExists(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    return true;
  }
}

function signalPosixGroup(pid, signal, limitations) {
  if (!Number.isInteger(pid) || pid <= 0) return;
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (error?.code !== "ESRCH") {
      limitations.push(`Could not send ${signal} to process group ${pid}: ${error.message}`);
    }
  }
}

async function runTaskkill(pid, limitations) {
  if (!Number.isInteger(pid) || pid <= 0) return true;

  return new Promise((resolve) => {
    let settled = false;
    let taskkill;
    const finish = (success) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(success);
    };

    try {
      taskkill = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        shell: false,
        stdio: "ignore",
        windowsHide: true,
      });
    } catch (error) {
      limitations.push(`Could not start taskkill for process ${pid}: ${error.message}`);
      resolve(false);
      return;
    }

    taskkill.once("error", (error) => {
      limitations.push(`taskkill failed for process ${pid}: ${error.message}`);
      finish(false);
    });
    taskkill.once("exit", (status) => finish(status === 0));
    const timer = setTimeout(() => {
      limitations.push(`taskkill did not finish within ${EXIT_AFTER_KILL_MS}ms for process ${pid}.`);
      taskkill.kill("SIGKILL");
      finish(false);
    }, EXIT_AFTER_KILL_MS);
  });
}

function directKill(child, limitations) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  try {
    child.kill("SIGKILL");
  } catch (error) {
    limitations.push(`Direct-child SIGKILL fallback failed: ${error.message}`);
  }
}

function makeOutputCollector(maxOutputBytes, onOverflow) {
  const stdout = [];
  const stderr = [];
  let storedBytes = 0;
  let overflow = false;

  const collect = (stream, chunk) => {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const remaining = Math.max(0, maxOutputBytes - storedBytes);
    if (remaining > 0) {
      const stored = bytes.length <= remaining ? bytes : bytes.subarray(0, remaining);
      stream.push(stored);
      storedBytes += stored.length;
    }
    if (bytes.length > remaining && !overflow) {
      overflow = true;
      onOverflow();
    }
  };

  return {
    stdout(chunk) {
      collect(stdout, chunk);
    },
    stderr(chunk) {
      collect(stderr, chunk);
    },
    result() {
      return {
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        overflow,
      };
    },
  };
}

/**
 * Run one command while owning and cleaning up its descendant process tree.
 * Output is capped by one aggregate byte budget shared by stdout and stderr.
 */
export async function runProcessTree({
  command,
  args = [],
  cwd = process.cwd(),
  env = process.env,
  input,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES,
  quiescenceMs = DEFAULT_QUIESCENCE_MS,
} = {}) {
  requireCommand(command);
  requireArgs(args);
  requirePositiveInteger(timeoutMs, "timeoutMs");
  requirePositiveInteger(maxOutputBytes, "maxOutputBytes");
  requireNonNegativeInteger(quiescenceMs, "quiescenceMs");

  const startedAt = process.hrtime.bigint();
  const strategy = process.platform === "win32" ? "windows_taskkill" : "posix_process_group";
  const limitations = process.platform === "win32"
    ? ["taskkill /T depends on Windows process ancestry and cannot prove cleanup of descendants that detached before enumeration."]
    : ["Process-group cleanup cannot reach a descendant that deliberately creates a new session or joins another process group."];

  let child;
  let runtimeError = null;
  let timedOut = false;
  let terminationRequested = false;
  let preExitCleanup = null;
  let descendantsTerminated = true;

  const requestTermination = () => {
    if (terminationRequested) return preExitCleanup;
    terminationRequested = true;
    if (!child?.pid) return Promise.resolve(true);

    if (process.platform === "win32") {
      preExitCleanup = runTaskkill(child.pid, limitations).then((success) => {
        if (!success) directKill(child, limitations);
        return success;
      });
    } else {
      signalPosixGroup(child.pid, "SIGTERM", limitations);
      preExitCleanup = delay(TERMINATION_GRACE_MS).then(() => {
        signalPosixGroup(child.pid, "SIGKILL", limitations);
        return true;
      });
    }
    return preExitCleanup;
  };

  let collector;
  try {
    child = spawn(command, args, {
      cwd,
      env,
      detached: process.platform !== "win32",
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch (error) {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    return {
      status: null,
      signal: null,
      stdout: "",
      stderr: "",
      error,
      timedOut: false,
      overflow: false,
      durationMs,
      cleanup: {
        strategy,
        descendants_terminated: true,
        quiescence_ms: quiescenceMs,
        limitations: [...limitations, "The direct process did not start, so no process tree was created."],
      },
    };
  }

  collector = makeOutputCollector(maxOutputBytes, requestTermination);
  child.stdout.on("data", collector.stdout);
  child.stderr.on("data", collector.stderr);
  child.stdout.once("error", (error) => {
    runtimeError ??= error;
    requestTermination();
  });
  child.stderr.once("error", (error) => {
    runtimeError ??= error;
    requestTermination();
  });
  child.stdin.once("error", () => {
    // EPIPE is expected when a command exits without consuming all input.
  });

  const directExit = new Promise((resolve) => {
    let settled = false;
    const finish = (status, signal) => {
      if (settled) return;
      settled = true;
      resolve({ status, signal });
    };
    child.once("error", (error) => {
      runtimeError ??= error;
      if (!child.pid) finish(null, null);
    });
    child.once("exit", finish);
    child.once("close", finish);
  });

  const timer = setTimeout(() => {
    timedOut = true;
    requestTermination();
  }, timeoutMs);

  if (input === undefined || input === null) child.stdin.end();
  else child.stdin.end(input);

  let exit = await directExit;
  clearTimeout(timer);

  if (preExitCleanup) {
    const preExitSuccess = await preExitCleanup;
    descendantsTerminated &&= preExitSuccess;
  }

  if (child.exitCode === null && child.signalCode === null && child.pid) {
    directKill(child, limitations);
    const forcedExit = await boundedExit(child, EXIT_AFTER_KILL_MS);
    if (forcedExit) exit = forcedExit;
    else {
      descendantsTerminated = false;
      limitations.push(`The direct child did not report exit within ${EXIT_AFTER_KILL_MS}ms after forced cleanup.`);
    }
  }

  // A successful direct child may leave inherited workers alive. Clean the tree
  // again after its exit, then hold the result for a bounded quiet interval.
  if (child.pid) {
    if (process.platform === "win32") {
      const taskkillSuccess = await runTaskkill(child.pid, limitations);
      // A nonzero taskkill after the root exited is inconclusive, not proof of a leak.
      // The platform limitation above remains attached to every Windows result.
      descendantsTerminated &&= taskkillSuccess || child.exitCode !== null || child.signalCode !== null;
      await delay(quiescenceMs);
    } else {
      signalPosixGroup(child.pid, "SIGTERM", limitations);
      const graceMs = Math.min(TERMINATION_GRACE_MS, quiescenceMs);
      await delay(graceMs);
      signalPosixGroup(child.pid, "SIGKILL", limitations);
      await delay(quiescenceMs - graceMs);
      if (posixGroupExists(child.pid)) {
        descendantsTerminated = false;
        limitations.push(`Process group ${child.pid} still existed after the ${quiescenceMs}ms quiescence interval.`);
      }
    }
  } else {
    await delay(quiescenceMs);
  }

  child.stdout.destroy();
  child.stderr.destroy();
  const output = collector.result();
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  return {
    status: exit.status,
    signal: exit.signal,
    stdout: output.stdout,
    stderr: output.stderr,
    error: runtimeError,
    timedOut,
    overflow: output.overflow,
    durationMs,
    cleanup: {
      strategy,
      descendants_terminated: descendantsTerminated,
      quiescence_ms: quiescenceMs,
      limitations,
    },
  };
}
