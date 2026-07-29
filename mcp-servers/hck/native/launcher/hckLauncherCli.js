"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// native/launcher/hckLauncherCli.ts
var path = __toESM(require("path"));

// src/services/backendLauncherCore.ts
var import_child_process = require("child_process");
var import_util = require("util");
var execAsync = (0, import_util.promisify)(import_child_process.exec);
var BackendLauncherCore = class _BackendLauncherCore {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
    this.runtimeState = {
      status: "stopped",
      process: null,
      baseUrl: null,
      port: null
    };
    this.startPromise = null;
  }
  static {
    this.STDOUT_ERROR_PATTERNS = [
      { pattern: /Startup failed:\s*(.+)/i, message: "Backend Startup Failed", severity: "critical" },
      { pattern: /\[ABL\] Reconnect failed:\s*(.+)/i, message: "ABL Reconnect Failed", severity: "error" },
      { pattern: /ABL process exited with code (\d+)/i, message: "ABL Process Exited", severity: "error" },
      { pattern: /ABL process error:\s*(.+)/i, message: "ABL Process Error", severity: "error" },
      { pattern: /ABL socket error:\s*(.+)/i, message: "ABL Socket Error", severity: "error" },
      { pattern: /ABL connection closed/i, message: "ABL Connection Lost", severity: "warning" },
      { pattern: /Uncaught exception:\s*(.+)/i, message: "Backend Uncaught Exception", severity: "critical" },
      { pattern: /\[Config\] Error loading.*:\s*(.+)/i, message: "Config Loading Error", severity: "warning" },
      { pattern: /Failed to initialize client:\s*(.+)/i, message: "ABL Client Init Failed", severity: "error" },
      { pattern: /ABL start timeout/i, message: "ABL Start Timeout", severity: "error" },
      { pattern: /ABL command timeout/i, message: "ABL Command Timeout", severity: "error" },
      { pattern: /Not connected to ABL/i, message: "ABL Not Connected", severity: "error" },
      { pattern: /\[ABL\] DB connection error detected/i, message: "Database Connection Failed", severity: "error" },
      { pattern: /ABL:.*\*\*\s*(.+)/i, message: "ABL Runtime Warning", severity: "warning" }
    ];
  }
  onEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  getStatus() {
    return this.runtimeState.status;
  }
  isRunning() {
    return this.runtimeState.status === "running";
  }
  getBaseUrl() {
    return this.runtimeState.baseUrl;
  }
  getPort() {
    return this.runtimeState.port;
  }
  async start(request) {
    if (this.startPromise) {
      return this.startPromise;
    }
    if (this.runtimeState.status === "running" && this.runtimeState.process && this.runtimeState.baseUrl && this.runtimeState.port !== null) {
      return {
        processId: this.runtimeState.process.pid ?? 0,
        port: this.runtimeState.port,
        baseUrl: this.runtimeState.baseUrl
      };
    }
    this.startPromise = this.startInternal(request);
    try {
      return await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }
  async stop() {
    if (!this.runtimeState.process) {
      this.runtimeState.status = "stopped";
      await this.killOrphanedProcesses(this.runtimeState.port ?? void 0, void 0);
      return;
    }
    this.runtimeState.status = "stopping";
    const activeProcess = this.runtimeState.process;
    await this.stopProcess(activeProcess);
    this.runtimeState.process = null;
    this.runtimeState.baseUrl = null;
    this.runtimeState.status = "stopped";
    await this.killOrphanedProcesses(this.runtimeState.port ?? void 0, void 0);
    this.runtimeState.port = null;
  }
  async startInternal(request) {
    const maxAttempts = Math.max(1, (request.retryCount ?? 0) + 1);
    await this.killOrphanedProcesses(request.httpPort, request.ablSocketPort);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.runtimeState.status = "starting";
      this.emit({ type: "starting", attempt, maxAttempts, timestamp: Date.now() });
      try {
        const result = await this.startAttempt(request);
        this.runtimeState.status = "running";
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt >= maxAttempts) {
          this.runtimeState.status = "stopped";
          this.emitError({
            message: "Backend Startup Failed",
            details: message,
            severity: "critical",
            errorCode: this.extractSystemCode(message)
          });
          throw error;
        }
        this.emit({
          type: "retrying",
          attempt,
          maxAttempts,
          reason: message,
          timestamp: Date.now()
        });
      }
    }
    throw new Error("Backend failed to start");
  }
  async startAttempt(request) {
    return new Promise((resolve, reject) => {
      const env = this.buildEnvironment(request);
      const backendProcess = (0, import_child_process.spawn)(request.command ?? "node", [request.indexPath], {
        cwd: request.workingDirectory ?? request.backendPath,
        shell: request.shell ?? true,
        stdio: ["pipe", "pipe", "pipe"],
        env
      });
      this.runtimeState.process = backendProcess;
      this.runtimeState.port = request.httpPort;
      this.runtimeState.baseUrl = null;
      let settled = false;
      let isReady = false;
      let startupTimeout = setTimeout(async () => {
        if (settled || isReady) {
          return;
        }
        settled = true;
        this.emitError({
          message: "Backend Startup Timeout",
          details: `Server failed to start within ${request.startupTimeoutMs ?? 1e4}ms`,
          severity: "error"
        });
        await this.stopProcess(backendProcess);
        reject(new Error("Server failed to start within the configured timeout"));
      }, request.startupTimeoutMs ?? 1e4);
      const clearStartupTimeout = () => {
        if (startupTimeout) {
          clearTimeout(startupTimeout);
          startupTimeout = null;
        }
      };
      backendProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        this.emit({ type: "stdout", output, timestamp: Date.now() });
        this.forwardStdoutErrors(output);
        if (!isReady && output.includes("HTTP API server running")) {
          isReady = true;
          settled = true;
          clearStartupTimeout();
          const baseUrl = this.createBaseUrl(request.httpPort);
          this.runtimeState.baseUrl = baseUrl;
          this.runtimeState.port = request.httpPort;
          this.emit({
            type: "ready",
            processId: backendProcess.pid ?? 0,
            port: request.httpPort,
            baseUrl,
            timestamp: Date.now()
          });
          resolve({
            processId: backendProcess.pid ?? 0,
            port: request.httpPort,
            baseUrl
          });
        }
      });
      backendProcess.stderr?.on("data", (data) => {
        const output = data.toString();
        this.emit({ type: "stderr", output, timestamp: Date.now() });
        if (!this.isStderrNoise(output)) {
          this.emitError({
            message: "Backend Error",
            details: output.trim(),
            severity: "error",
            errorCode: this.extractSystemCode(output)
          });
        }
      });
      backendProcess.once("error", async (error) => {
        clearStartupTimeout();
        this.runtimeState.process = null;
        this.runtimeState.baseUrl = null;
        this.runtimeState.status = "stopped";
        this.emitError({
          message: "Backend Process Error",
          details: error.message,
          severity: "critical",
          errorCode: this.extractSystemCode(error.message)
        });
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
      backendProcess.once("exit", (code, signal) => {
        clearStartupTimeout();
        this.runtimeState.process = null;
        this.runtimeState.baseUrl = null;
        if (this.runtimeState.status !== "stopping") {
          this.runtimeState.status = "stopped";
        }
        this.emit({ type: "stopped", code, signal, timestamp: Date.now() });
        if (!isReady && !settled) {
          settled = true;
          reject(new Error(`Process exited with code ${code}${signal ? ` and signal ${signal}` : ""}`));
        }
      });
    });
  }
  buildEnvironment(request) {
    const env = {
      ...process.env,
      ...request.env ?? {},
      HTTP_PORT: String(request.httpPort),
      ABL_SOCKET_PORT: String(request.ablSocketPort)
    };
    if (request.workspaceConfigPath) {
      env.HCK_OE_CONFIG = request.workspaceConfigPath;
    }
    if (request.dlcPath) {
      env.DLC = request.dlcPath;
    }
    if (request.connectionsFilePath) {
      env.HCK_CONNECTIONS_FILE = request.connectionsFilePath;
    }
    return env;
  }
  createBaseUrl(port) {
    return `http://127.0.0.1:${port}`;
  }
  forwardStdoutErrors(output) {
    const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    for (const line of lines) {
      this.matchStdoutErrorLine(line);
    }
  }
  matchStdoutErrorLine(line) {
    for (const { pattern, message, severity } of _BackendLauncherCore.STDOUT_ERROR_PATTERNS) {
      const match = line.match(pattern);
      if (!match) {
        continue;
      }
      this.emitError({
        message,
        details: match[1]?.trim() || line,
        severity,
        errorCode: this.extractSystemCode(line)
      });
      return;
    }
  }
  isStderrNoise(text) {
    const noisePatterns = [
      /^\(node:\d+\) ExperimentalWarning/,
      /^\(node:\d+\) DeprecationWarning/,
      /^\(Use .* to show where the warning was created\)/
    ];
    return noisePatterns.some((pattern) => pattern.test(text.trim()));
  }
  extractSystemCode(text) {
    if (!text) {
      return void 0;
    }
    const systemMatch = text.match(/\b(E[A-Z]{2,})\b/);
    if (systemMatch) {
      return systemMatch[1];
    }
    const exitMatch = text.match(/exited with code (\d+)/);
    if (exitMatch) {
      return `EXIT_${exitMatch[1]}`;
    }
    const openEdgeMatch = text.match(/(?:error[:\s]*|[(\s])(\d{3,5})(?:\b|[)\s])/i);
    if (openEdgeMatch) {
      return openEdgeMatch[1];
    }
    return void 0;
  }
  async stopProcess(backendProcess) {
    if (backendProcess.exitCode !== null) {
      return;
    }
    if (process.platform === "win32" && backendProcess.pid) {
      await this.killProcessById(backendProcess.pid, true, true);
      return;
    }
    backendProcess.kill("SIGTERM");
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (backendProcess.exitCode === null) {
          backendProcess.kill("SIGKILL");
        }
        resolve();
      }, 3e3);
      backendProcess.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  async killOrphanedProcesses(httpPort, ablSocketPort) {
    try {
      const isWindows = process.platform === "win32";
      const findCommands = isWindows ? this.getWindowsFindCommands(httpPort, ablSocketPort) : this.getPosixFindCommands(httpPort, ablSocketPort);
      if (findCommands.length === 0) {
        return;
      }
      const results = await Promise.allSettled(
        findCommands.map(({ command, source }) => execAsync(command).then(({ stdout }) => this.extractPids(stdout, source, isWindows)))
      );
      const processIds = /* @__PURE__ */ new Set();
      for (const result of results) {
        if (result.status !== "fulfilled") {
          continue;
        }
        for (const processId of result.value) {
          processIds.add(processId);
        }
      }
      if (this.runtimeState.process?.pid) {
        processIds.delete(this.runtimeState.process.pid);
      }
      await Promise.allSettled([...processIds].map((processId) => this.killProcessById(processId, isWindows, isWindows)));
    } catch (_) {
    }
  }
  getWindowsFindCommands(httpPort, ablSocketPort) {
    const commands = [];
    if (ablSocketPort) {
      commands.push({ command: `netstat -ano | findstr :${ablSocketPort}`, source: "netstat" });
    }
    if (httpPort) {
      commands.push({ command: `netstat -ano | findstr :${httpPort}`, source: "netstat" });
    }
    return commands;
  }
  getPosixFindCommands(httpPort, ablSocketPort) {
    const commands = [];
    if (ablSocketPort) {
      commands.push({ command: `lsof -ti:${ablSocketPort} || true`, source: "lsof" });
    }
    if (httpPort) {
      commands.push({ command: `lsof -ti:${httpPort} || true`, source: "lsof" });
    }
    return commands;
  }
  extractPids(stdout, source, isWindows) {
    const processIds = [];
    if (isWindows && source === "wmic") {
      const lines2 = stdout.split("\n").filter((line) => line.trim() && !line.includes("ProcessId"));
      for (const line of lines2) {
        const processId = parseInt(line.trim(), 10);
        if (!Number.isNaN(processId) && processId > 0) {
          processIds.push(processId);
        }
      }
      return processIds;
    }
    const lines = stdout.split("\n").filter((line) => line.trim());
    for (const line of lines) {
      const parts = isWindows ? line.trim().split(/\s+/) : [line.trim()];
      const lastPart = parts[parts.length - 1];
      const processId = parseInt(lastPart, 10);
      if (!Number.isNaN(processId) && processId > 0) {
        processIds.push(processId);
      }
    }
    return processIds;
  }
  async killProcessById(processId, isWindows, includeChildren = false) {
    if (isWindows) {
      const childTreeFlag = includeChildren ? " /T" : "";
      await execAsync(`taskkill /F${childTreeFlag} /PID ${processId}`);
      return;
    }
    process.kill(processId, "SIGKILL");
  }
  emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  emitError(error) {
    this.emit({
      type: "error",
      error,
      timestamp: Date.now()
    });
  }
};

// native/launcher/hckLauncherCli.ts
var PARENT_CHECK_INTERVAL_MS = 1e3;
async function main() {
  const [command, ...rawArgs] = process.argv.slice(2);
  if (command !== "start") {
    writeEvent({
      type: "error",
      timestamp: Date.now(),
      error: {
        message: "Unsupported command",
        details: `Received '${command ?? ""}'. Supported commands: start`,
        severity: "critical"
      }
    });
    process.exit(1);
  }
  const args = parseArgs(rawArgs);
  const request = createLaunchRequest(args);
  const launcher = new BackendLauncherCore();
  const parentPid = process.ppid;
  let stopping = false;
  let parentMonitor;
  const unsubscribe = launcher.onEvent((event) => writeEvent(event));
  const shutdown = async (signal) => {
    if (stopping) {
      return;
    }
    stopping = true;
    try {
      if (parentMonitor) {
        clearInterval(parentMonitor);
        parentMonitor = void 0;
      }
      await launcher.stop();
    } finally {
      unsubscribe();
      process.exit(0);
    }
  };
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  try {
    await launcher.start(request);
  } catch (error) {
    writeEvent({
      type: "error",
      timestamp: Date.now(),
      error: {
        message: "Launcher start failed",
        details: error instanceof Error ? error.message : String(error),
        severity: "critical"
      }
    });
    unsubscribe();
    process.exit(1);
  }
  parentMonitor = setInterval(() => {
    if (!isProcessRunning(parentPid)) {
      void shutdown("SIGTERM");
    }
  }, PARENT_CHECK_INTERVAL_MS);
  await waitForExitSignal();
}
function isProcessRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function parseArgs(rawArgs) {
  const args = {};
  for (let index = 0; index < rawArgs.length; index++) {
    const current = rawArgs[index];
    if (!current.startsWith("--")) {
      continue;
    }
    const key = current.slice(2);
    const next = rawArgs[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index++;
  }
  return args;
}
function createLaunchRequest(args) {
  const backendPath = getRequiredArg(args, "backendPath");
  const indexPath = getOptionalStringArg(args, "indexPath") ?? path.join(backendPath, "index.js");
  return {
    backendPath,
    indexPath,
    httpPort: getNumberArg(args, "httpPort", 23003),
    ablSocketPort: getNumberArg(args, "ablSocketPort", 23e3),
    dlcPath: getOptionalStringArg(args, "dlcPath"),
    workspaceConfigPath: getOptionalStringArg(args, "workspaceConfigPath"),
    connectionsFilePath: getOptionalStringArg(args, "connectionsFilePath"),
    startupTimeoutMs: getNumberArg(args, "startupTimeoutMs", 1e4),
    retryCount: getNumberArg(args, "retryCount", 3),
    workingDirectory: getOptionalStringArg(args, "workingDirectory") ?? backendPath,
    command: getOptionalStringArg(args, "command") ?? "node",
    shell: getBooleanArg(args, "shell", true)
  };
}
function getRequiredArg(args, key) {
  const value = args[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required argument --${key}`);
  }
  return value;
}
function getOptionalStringArg(args, key) {
  const value = args[key];
  return typeof value === "string" && value.trim().length > 0 ? value : void 0;
}
function getNumberArg(args, key, defaultValue) {
  const value = getOptionalStringArg(args, key);
  if (!value) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric argument for --${key}: ${value}`);
  }
  return parsed;
}
function getBooleanArg(args, key, defaultValue) {
  const value = args[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return defaultValue;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`Invalid boolean argument for --${key}: ${value}`);
}
function writeEvent(event) {
  process.stdout.write(`${JSON.stringify(event)}
`);
}
async function waitForExitSignal() {
  await new Promise(() => {
    return;
  });
}
void main().catch((error) => {
  writeEvent({
    type: "error",
    timestamp: Date.now(),
    error: {
      message: "Launcher CLI failure",
      details: error instanceof Error ? error.message : String(error),
      severity: "critical"
    }
  });
  process.exit(1);
});
