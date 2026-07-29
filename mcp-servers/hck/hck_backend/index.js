"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// hck_backend/vstLogic.js
var require_vstLogic = __commonJS({
  "hck_backend/vstLogic.js"(exports2, module2) {
    "use strict";
    function rowsOf(vstResult, table) {
      const entry = vstResult && vstResult.tables ? vstResult.tables[table] : void 0;
      return entry && Array.isArray(entry.rows) ? entry.rows : [];
    }
    function firstRow(vstResult, table) {
      const rows = rowsOf(vstResult, table);
      return rows.length > 0 ? rows[0] : null;
    }
    function tableError(vstResult, table) {
      const entry = vstResult && vstResult.tables ? vstResult.tables[table] : void 0;
      return entry && typeof entry.error === "string" ? entry.error : null;
    }
    function field(row, name) {
      if (!row || typeof row !== "object") {
        return void 0;
      }
      if (name in row) {
        return row[name];
      }
      const lower = name.toLowerCase();
      for (const key of Object.keys(row)) {
        if (key.toLowerCase() === lower) {
          return row[key];
        }
      }
      return void 0;
    }
    function asNumber(value) {
      if (value === null || value === void 0 || value === "") {
        return null;
      }
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    function maskConnectionString(conn) {
      if (typeof conn !== "string") {
        return conn;
      }
      return conn.replace(/((?:^|\s)-(?:P|password)\s+)("[^"]*"|'[^']*'|\S+)/gi, "$1*****");
    }
    function buildDatabasesPayload(connections, configPath) {
      const conns = connections || {};
      const skipped = Array.isArray(conns._skippedEntries) ? conns._skippedEntries : [];
      const databases = Object.keys(conns).filter((k) => k !== "_skippedEntries").map((name) => {
        const connect = String(conns[name] || "");
        return {
          name,
          connect: maskConnectionString(connect),
          hasCredentials: /(?:^|\s)-(?:U|user)\s/i.test(connect)
        };
      });
      return {
        configPath: configPath || null,
        databases,
        skipped,
        description: databases.length === 0 ? "No database connections are configured. Add dbConnections (name + connect) to openedge-project.json." : `Use one of the "name" values as the db parameter of the other HCK tools.`
      };
    }
    function buildDbInfo(parsed, db) {
      const rows = parsed && Array.isArray(parsed.ttDbInfo) ? parsed.ttDbInfo : [];
      return {
        db,
        info: rows.length > 0 ? rows[0] : null,
        ...rows.length === 0 ? { description: "No _DbStatus data returned." } : {}
      };
    }
    function connectUserNumber(row) {
      const usr = asNumber(field(row, "_Connect-Usr"));
      return usr !== null ? usr : asNumber(field(row, "_Connect-Id"));
    }
    function summarizeConnect(row) {
      return {
        usr: connectUserNumber(row),
        name: field(row, "_Connect-Name") ?? null,
        type: field(row, "_Connect-Type") ?? null,
        device: field(row, "_Connect-Device") ?? null,
        pid: asNumber(field(row, "_Connect-Pid")),
        wait: String(field(row, "_Connect-Wait") ?? "").trim(),
        waitInfo: field(row, "_Connect-Wait1") ?? null,
        transId: asNumber(field(row, "_Connect-TransId")),
        loginTime: field(row, "_Connect-Time") ?? null
      };
    }
    function isBlockedConnect(row) {
      const name = field(row, "_Connect-Name");
      if (name === null || name === void 0) {
        return false;
      }
      const wait = String(field(row, "_Connect-Wait") ?? "").trim();
      return wait !== "" && wait !== "--";
    }
    function isHeldLock(row) {
      const flags = String(field(row, "_Lock-Flags") ?? "");
      return /H/i.test(flags) && !/Q/i.test(flags);
    }
    function buildBlockedClients(vstResult) {
      const connects = rowsOf(vstResult, "_Connect").filter((row) => field(row, "_Connect-Name") !== null && field(row, "_Connect-Name") !== void 0);
      const locks = rowsOf(vstResult, "_Lock").filter((row) => field(row, "_Lock-Usr") !== null && field(row, "_Lock-Usr") !== void 0);
      const byUsr = new Map(connects.map((row) => [connectUserNumber(row), row]));
      const blocked = connects.filter(isBlockedConnect);
      const blockingTree = blocked.map((row) => {
        const waiter = summarizeConnect(row);
        const waitRecid = asNumber(field(row, "_Connect-Wait1"));
        let holders = [];
        if (waitRecid !== null && waitRecid > 0 && /REC/i.test(waiter.wait)) {
          holders = locks.filter((lock) => asNumber(field(lock, "_Lock-Recid")) === waitRecid && asNumber(field(lock, "_Lock-Usr")) !== waiter.usr && isHeldLock(lock)).map((lock) => {
            const holderUsr = asNumber(field(lock, "_Lock-Usr"));
            const holderConnect = byUsr.get(holderUsr);
            return {
              usr: holderUsr,
              name: field(lock, "_Lock-Name") ?? null,
              lockType: field(lock, "_Lock-Type") ?? null,
              flags: field(lock, "_Lock-Flags") ?? null,
              table: field(lock, "_Lock-Table") ?? null,
              recid: waitRecid,
              connection: holderConnect ? summarizeConnect(holderConnect) : null
            };
          });
        }
        return { waiter, waitType: waiter.wait, waitRecid, holders };
      });
      return {
        db: vstResult.db,
        sampledAt: vstResult.sampledAt,
        blockedCount: blocked.length,
        blockedClients: blocked.map(summarizeConnect),
        blockingTree,
        lockRequests: rowsOf(vstResult, "_LockReq").filter((row) => field(row, "_LockReq-Name") !== null && field(row, "_LockReq-Name") !== void 0),
        tables: vstResult.tables
      };
    }
    var HELPER_TYPES = ["APW", "BIW", "AIW", "WDOG", "MON", "SERV", "BROK", "SHUT", "AIMD", "RPLS", "RPLA"];
    function classifyConnect(row) {
      const type = String(field(row, "_Connect-Type") ?? "").trim().toUpperCase();
      const batch = String(field(row, "_Connect-Batch") ?? "").trim().toLowerCase();
      if (HELPER_TYPES.includes(type)) {
        return "background";
      }
      if (type === "REMC") {
        return "remote";
      }
      if (batch === "yes" || batch === "true") {
        return "batch";
      }
      if (type === "SELF") {
        return "interactive";
      }
      return "other";
    }
    function buildProcessOverview(vstResult) {
      const connects = rowsOf(vstResult, "_Connect").filter((row) => field(row, "_Connect-Name") !== null && field(row, "_Connect-Name") !== void 0);
      const groups = { interactive: [], batch: [], background: [], remote: [], other: [] };
      for (const row of connects) {
        const summary = { ...summarizeConnect(row), serverType: field(row, "_Connect-Type") ?? null };
        groups[classifyConnect(row)].push(summary);
      }
      return {
        db: vstResult.db,
        sampledAt: vstResult.sampledAt,
        totals: {
          all: connects.length,
          interactive: groups.interactive.length,
          batch: groups.batch.length,
          background: groups.background.length,
          remote: groups.remote.length,
          other: groups.other.length
        },
        processes: groups
      };
    }
    function areaUsage(row) {
      const total = asNumber(field(row, "_AreaStatus-Totblocks"));
      const hiWater = asNumber(field(row, "_AreaStatus-Hiwater"));
      const percentFull = total && total > 0 && hiWater !== null ? Math.round(hiWater / total * 1e3) / 10 : null;
      return {
        areaNum: asNumber(field(row, "_AreaStatus-Areanum")),
        name: field(row, "_AreaStatus-Areaname") ?? null,
        totalBlocks: total,
        hiWater,
        freeBlocks: asNumber(field(row, "_AreaStatus-Freenum")),
        percentFull
      };
    }
    function buildAreaThresholds(vstResult) {
      const areas = rowsOf(vstResult, "_AreaStatus").map(areaUsage);
      return {
        db: vstResult.db,
        sampledAt: vstResult.sampledAt,
        thresholds: rowsOf(vstResult, "_AreaThreshold"),
        thresholdsError: tableError(vstResult, "_AreaThreshold"),
        areas,
        warnings: areas.filter((a) => a.percentFull !== null && a.percentFull >= 90).map((a) => `Area ${a.name ?? a.areaNum} is ${a.percentFull}% full`)
      };
    }
    function dbParamNumber(vstResult, paramName) {
      for (const row of rowsOf(vstResult, "_DbParams")) {
        if (String(field(row, "_DbParams-Name") ?? "").toLowerCase() === paramName.toLowerCase()) {
          return asNumber(field(row, "_DbParams-Value"));
        }
      }
      return null;
    }
    function buildRangeConfig(vstResult, statsPayload) {
      const statBase = firstRow(vstResult, "_StatBase");
      const dbStatus = firstRow(vstResult, "_DbStatus");
      const tableBase = (statBase ? asNumber(field(statBase, "_TableBase")) : null) ?? dbParamNumber(vstResult, "-basetable");
      const indexBase = (statBase ? asNumber(field(statBase, "_IndexBase")) : null) ?? dbParamNumber(vstResult, "-baseindex");
      const rangeSize = dbParamNumber(vstResult, "-tablerangesize");
      const indexRangeSize = dbParamNumber(vstResult, "-indexrangesize");
      const rawHighest = dbStatus ? asNumber(field(dbStatus, "_DbStatus-LastTable")) : null;
      const highestTable = rawHighest && rawHighest > 0 ? rawHighest : null;
      const tableStatCount = statsPayload && Array.isArray(statsPayload.tableStats) ? statsPayload.tableStats.length : null;
      const result = {
        tableRangeFirst: tableBase,
        indexRangeFirst: indexBase,
        tableRangeSize: rangeSize ?? tableStatCount,
        indexRangeSize,
        tablesWithStats: tableStatCount,
        highestTableDefined: highestTable
      };
      if (tableBase !== null && result.tableRangeSize !== null) {
        result.tableRangeLast = tableBase + result.tableRangeSize - 1;
      }
      if (highestTable !== null && result.tableRangeLast !== void 0 && highestTable > result.tableRangeLast) {
        result.warning = `Statistics range covers table numbers ${tableBase}-${result.tableRangeLast} but the schema defines tables up to ${highestTable}: tables outside the range report SILENT ZEROS. Raise -tablerangesize (and check -indexrangesize) on the broker.`;
      } else if (highestTable === null && rangeSize !== null && tableStatCount !== null && tableStatCount >= rangeSize) {
        result.warning = `All ${rangeSize} statistics slots (-tablerangesize) are in use \u2014 tables beyond the range report SILENT ZEROS. Raise -tablerangesize (and check -indexrangesize) on the broker.`;
      } else if (!statBase && rangeSize === null) {
        result.warning = "Could not read _StatBase or _DbParams \u2014 statistics range coverage is unknown.";
      }
      return result;
    }
    var HEALTH_SUMMARY_TABLES = [
      "_ActSummary",
      "_ActBuffer",
      "_Connect",
      "_AreaStatus",
      "_DbStatus",
      "_Logging",
      "_License",
      "_Latch"
    ];
    function parseBackupDate(value) {
      if (value === null || value === void 0) {
        return null;
      }
      const s = String(value).trim();
      if (s === "" || s === "?") {
        return null;
      }
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    function buildHealthSummary(vstResult, now = /* @__PURE__ */ new Date()) {
      const warnings = [];
      const summary = firstRow(vstResult, "_ActSummary");
      const buffer = firstRow(vstResult, "_ActBuffer");
      const dbStatus = firstRow(vstResult, "_DbStatus");
      const logging = firstRow(vstResult, "_Logging");
      const license = firstRow(vstResult, "_License");
      const connects = rowsOf(vstResult, "_Connect").filter((row) => field(row, "_Connect-Name") !== null && field(row, "_Connect-Name") !== void 0);
      const blocked = connects.filter(isBlockedConnect);
      if (blocked.length > 0) {
        warnings.push(`${blocked.length} client(s) are blocked waiting on a resource`);
      }
      const logicRds = buffer ? asNumber(field(buffer, "_Buffer-LogicRds")) : null;
      const osRds = buffer ? asNumber(field(buffer, "_Buffer-OSRds")) : null;
      let bufferHitRatioPct = null;
      if (logicRds !== null && osRds !== null && logicRds > 0) {
        bufferHitRatioPct = Math.round((logicRds - osRds) / logicRds * 1e4) / 100;
        if (bufferHitRatioPct < 90) {
          warnings.push(`Buffer hit ratio is low (${bufferHitRatioPct}%) \u2014 consider raising -B`);
        }
      }
      const areas = rowsOf(vstResult, "_AreaStatus").map(areaUsage);
      const percentages = areas.map((a) => a.percentFull).filter((p) => p !== null);
      const maxPercentFull = percentages.length > 0 ? Math.max(...percentages) : null;
      for (const area of areas) {
        if (area.percentFull !== null && area.percentFull >= 90) {
          warnings.push(`Area ${area.name ?? area.areaNum} is ${area.percentFull}% full`);
        }
      }
      const lastFullBackup = dbStatus ? field(dbStatus, "_DbStatus-fbDate") ?? null : null;
      const backupDate = parseBackupDate(lastFullBackup);
      let backupAgeDays = null;
      if (backupDate) {
        backupAgeDays = Math.floor((now.getTime() - backupDate.getTime()) / 864e5);
        if (backupAgeDays > 7) {
          warnings.push(`Last full backup is ${backupAgeDays} days old`);
        }
      } else {
        warnings.push("No full backup date recorded (_DbStatus-fbDate)");
      }
      const tainted = dbStatus ? asNumber(field(dbStatus, "_DbStatus-tainted")) : null;
      if (tainted !== null && tainted !== 0) {
        warnings.push(`Database damaged/tainted flags are set (_DbStatus-tainted = ${tainted})`);
      }
      const crashProtection = logging ? field(logging, "_Logging-CrashProt") ?? null : null;
      const aiJournalling = logging ? field(logging, "_Logging-AiJournal") ?? null : null;
      const aiEnabled = aiJournalling !== null ? !/^(0|no|false|disabled)$/i.test(String(aiJournalling).trim()) : null;
      if (aiEnabled === false) {
        warnings.push("After-imaging is not enabled \u2014 no roll-forward disaster recovery");
      }
      const licCurrent = license ? asNumber(field(license, "_Lic-CurrConns") ?? field(license, "_Lic-Usrcnt")) : null;
      const licMax = license ? asNumber(field(license, "_Lic-ValidUsers") ?? field(license, "_Lic-MaxUsrcnt")) : null;
      let latchWaits = null;
      const latchRows = rowsOf(vstResult, "_Latch");
      if (latchRows.length > 0) {
        latchWaits = latchRows.reduce((sum, row) => sum + (asNumber(field(row, "_Latch-Wait")) ?? 0), 0);
      }
      return {
        db: vstResult.db,
        sampledAt: vstResult.sampledAt,
        indicators: {
          uptimeSeconds: summary ? asNumber(field(summary, "_Summary-UpTime")) : null,
          connections: {
            total: connects.length,
            blocked: blocked.length,
            blockedClients: blocked.map(summarizeConnect)
          },
          bufferHitRatioPct,
          areas: { maxPercentFull, list: areas },
          backup: {
            lastFullBackup,
            ageDays: backupAgeDays,
            changedSinceBackup: dbStatus ? field(dbStatus, "_DbStatus-Changed") ?? null : null
          },
          bi: {
            crashProtection,
            lastCheckpoint: logging ? field(logging, "_Logging-LastCkp") ?? null : null,
            biClusterSizeKb: dbStatus ? asNumber(field(dbStatus, "_DbStatus-BiClSize")) : null,
            biBlockSize: dbStatus ? asNumber(field(dbStatus, "_DbStatus-BiBlkSize")) : null,
            logicalBiSize: dbStatus ? asNumber(field(dbStatus, "_DbStatus-BiSize")) : null
          },
          ai: { journalling: aiJournalling, enabled: aiEnabled },
          license: { currentUsers: licCurrent, maxUsers: licMax, raw: license },
          latchWaits,
          dbState: dbStatus ? asNumber(field(dbStatus, "_DbStatus-state")) : null,
          tainted
        },
        warnings,
        unavailable: HEALTH_SUMMARY_TABLES.filter((t) => tableError(vstResult, t) !== null).map((t) => ({ table: t, error: tableError(vstResult, t) }))
      };
    }
    module2.exports = {
      rowsOf,
      firstRow,
      tableError,
      field,
      asNumber,
      maskConnectionString,
      buildDatabasesPayload,
      buildDbInfo,
      buildBlockedClients,
      buildProcessOverview,
      buildAreaThresholds,
      buildRangeConfig,
      buildHealthSummary,
      HEALTH_SUMMARY_TABLES
    };
  }
});

// hck_backend/index.js
var net = require("net");
var http = require("http");
var { spawn, execFile } = require("child_process");
var path = require("path");
var fs = require("fs");
var vstLogic = require_vstLogic();
function getWritableRuntimeDirectory() {
  if (process.platform === "win32") {
    const appDataPath = process.env.APPDATA;
    if (!appDataPath) {
      return path.join(__dirname, "oe", "runtime");
    }
    return path.join(
      appDataPath,
      "AI4YOU",
      "OpenEdge HCK - Health Check Kit",
      "runtime"
    );
  }
  const xdgStateHome = process.env.XDG_STATE_HOME;
  if (xdgStateHome && xdgStateHome.trim() !== "") {
    return path.join(
      xdgStateHome,
      "AI4YOU",
      "OpenEdge HCK - Health Check Kit",
      "runtime"
    );
  }
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome && xdgConfigHome.trim() !== "") {
    return path.join(
      xdgConfigHome,
      "AI4YOU",
      "OpenEdge HCK - Health Check Kit",
      "runtime"
    );
  }
  const homePath = process.env.HOME;
  if (homePath && homePath.trim() !== "") {
    return path.join(
      homePath,
      ".config",
      "AI4YOU",
      "OpenEdge HCK - Health Check Kit",
      "runtime"
    );
  }
  return path.join(__dirname, "oe", "runtime");
}
function resolveOpenEdgeNetLibraryPath(dlcPath) {
  const candidates = [
    path.join(dlcPath, "tty", "netlib", "OpenEdge.Net.pl")
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `OpenEdge.Net.pl was not found under DLC "${dlcPath}". Checked: ${candidates.join(", ")}`
  );
}
function resolveProgresExecutablePath(dlcPath) {
  const candidates = process.platform === "win32" ? [path.join(dlcPath, "bin", "_progres.exe"), path.join(dlcPath, "bin", "_progres")] : [path.join(dlcPath, "bin", "_progres")];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `OpenEdge runtime executable was not found under DLC "${dlcPath}". Checked: ${candidates.join(", ")}`
  );
}
function parseJsonc(text) {
  let result = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && (i === 0 || text[i - 1] !== "\\")) {
      inString = !inString;
      result += char;
      i++;
      continue;
    }
    if (!inString) {
      if (char === "/" && next === "/") {
        while (i < text.length && text[i] !== "\n") {
          i++;
        }
        continue;
      }
      if (char === "/" && next === "*") {
        i += 2;
        while (i < text.length - 1 && !(text[i] === "*" && text[i + 1] === "/")) {
          i++;
        }
        i += 2;
        continue;
      }
    }
    result += char;
    i++;
  }
  return JSON.parse(result);
}
function loadDbConnectionsFromConfig(configPath) {
  try {
    if (!configPath || !fs.existsSync(configPath)) {
      console.log(`[Config] No OpenEdge config file found at: ${configPath}`);
      return {};
    }
    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = parseJsonc(configContent);
    if (!config || !config.dbConnections || !Array.isArray(config.dbConnections)) {
      console.log("[Config] No dbConnections found in config file");
      return {};
    }
    const connections = {};
    const skipped = [];
    config.dbConnections.forEach((db) => {
      if (db.name && db.connect) {
        const name = db.name.trim();
        let connect = db.connect.trim();
        if (db.user && typeof db.user === "string" && db.user.trim()) {
          if (!connect.match(/(?:^|\s)-U\s/i)) {
            connect += ` -U ${db.user.trim()}`;
          }
        }
        if (db.password && typeof db.password === "string" && db.password.trim()) {
          if (!connect.match(/(?:^|\s)-P\s/i)) {
            connect += ` -P ${db.password.trim()}`;
          }
        }
        connections[name] = connect;
        console.log(`[Config] Loaded connection for database: ${name}`);
      } else if (db.name) {
        const name = db.name.trim();
        skipped.push(name);
        console.log(`[Config] WARNING: Database "${name}" has no connect string in openedge-project.json \u2014 it will be skipped`);
      }
    });
    if (skipped.length > 0) {
      connections._skippedEntries = skipped;
    }
    return connections;
  } catch (error) {
    console.error("[Config] Error loading database connections from config file:", error);
    return {};
  }
}
var CONFIG = {
  ablSocketPort: process.env.ABL_SOCKET_PORT || 23e3,
  httpPort: process.env.HTTP_PORT || 23003,
  host: "127.0.0.1",
  dlcPath: process.env.DLC,
  // Enable debug mode (saves JSON responses to disk) via env var
  debug: process.env.HCK_DEBUG === "true",
  // OpenEdge config file path - passed from VS Code extension
  oeConfigPath: process.env.HCK_OE_CONFIG,
  // Load database connections from OpenEdge config file
  dbConnectionsFromConfig: {},
  // Initialize database connections from config file
  init() {
    if (this.oeConfigPath) {
      console.log(`[Config] Loading database connections from: ${this.oeConfigPath}`);
      this.dbConnectionsFromConfig = loadDbConnectionsFromConfig(this.oeConfigPath);
      const dbKeys = Object.keys(this.dbConnectionsFromConfig).filter((k) => k !== "_skippedEntries");
      console.log(`[Config] Loaded ${dbKeys.length} database connections:`, dbKeys);
    } else {
      console.log("[Config] WARNING: HCK_OE_CONFIG environment variable not set - no project database connections will be available");
    }
    return this;
  },
  // Get connection string for a specific database from openedge-project.json
  getConnectionString(dbName) {
    if (dbName !== "_skippedEntries" && dbName in this.dbConnectionsFromConfig) {
      const connStr = this.dbConnectionsFromConfig[dbName];
      console.log(`[Config] Using connection for: ${dbName} -> ${connStr}`);
      return connStr;
    }
    const available = Object.keys(this.dbConnectionsFromConfig).filter((k) => k !== "_skippedEntries");
    console.log(`[Config] WARNING: No connection found for database: "${dbName}". Available: [${available.join(", ")}]`);
    return null;
  },
  // PROPATH for HCK procedures - built dynamically from DLC path
  get hckPropath() {
    const hckPlPath = path.join(__dirname, "oe/src/hck.pl");
    const netLibPath = resolveOpenEdgeNetLibraryPath(this.dlcPath);
    const basePath = path.join(__dirname, "oe/src");
    if (fs.existsSync(hckPlPath)) {
      if (fs.existsSync(basePath)) {
        return `${hckPlPath},${basePath},${netLibPath}`;
      }
      return `${hckPlPath},${netLibPath}`;
    }
    return `${basePath},${netLibPath}`;
  }
};
var ablClient = null;
var ablProcess = null;
var dataBuffer = "";
var pendingResolve = null;
var pendingReject = null;
var requestQueue = [];
var isProcessingQueue = false;
var testOverride = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
var ABL_COMMAND_TIMEOUT_MS = testOverride("HCK_TEST_COMMAND_TIMEOUT_MS", 6e4);
var ABL_CONNECT_TIMEOUT_MS = testOverride("HCK_TEST_CONNECT_TIMEOUT_MS", 3e4);
var MAX_REQUEST_QUEUE_SIZE = testOverride("HCK_TEST_MAX_QUEUE_SIZE", 100);
var MAX_DATA_BUFFER_BYTES = testOverride("HCK_TEST_MAX_BUFFER_BYTES", 64 * 1024 * 1024);
function startAblProcess() {
  return new Promise((resolve, reject) => {
    const socketProcPath = path.join(__dirname, "oe", "src", "hckSocket.r");
    const runtimeDirectory = getWritableRuntimeDirectory();
    fs.mkdirSync(runtimeDirectory, { recursive: true });
    const clientLogPath = path.join(runtimeDirectory, "hckSocket.log");
    const isWindows = process.platform === "win32";
    let propath;
    let progres;
    try {
      propath = CONFIG.hckPropath.replace(/,/g, isWindows ? ";" : ":");
      progres = resolveProgresExecutablePath(CONFIG.dlcPath);
    } catch (error) {
      reject(error);
      return;
    }
    console.log("Starting ABL process...");
    console.log("DLC:", CONFIG.dlcPath);
    console.log("Platform:", process.platform);
    console.log("PROPATH:", propath);
    console.log("ABL runtime directory:", runtimeDirectory);
    const args = [
      "-b",
      "-p",
      socketProcPath,
      "-clientlog",
      clientLogPath,
      "-param",
      String(CONFIG.ablSocketPort)
    ];
    ablProcess = spawn(progres, args, {
      cwd: runtimeDirectory,
      env: {
        ...process.env,
        DLC: CONFIG.dlcPath,
        PROPATH: propath,
        TEMP: runtimeDirectory,
        TMP: runtimeDirectory,
        TMPDIR: runtimeDirectory
      }
    });
    ablProcess.on("exit", (code, signal) => {
      console.log(`ABL process exited with code ${code} and signal ${signal}`);
    });
    ablProcess.on("error", (error) => {
      console.error("ABL process error:", error);
      reject(error);
    });
    ablProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("ABL:", output.trim());
      if (output.startsWith("SERVER STARTED AT " + CONFIG.ablSocketPort)) {
        resolve();
      } else if (output.startsWith("Failed to initialize client:")) {
        reject(new Error(output.trim()));
      }
    });
    ablProcess.stderr.on("data", (data) => {
      console.error("ABL stderr:", data.toString());
    });
    setTimeout(() => reject(new Error("ABL start timeout")), 3e4);
  });
}
function connectToAbl() {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    ablClient = socket;
    const connectTimeoutId = setTimeout(() => {
      socket.destroy();
      if (ablClient === socket) {
        ablClient = null;
      }
      reject(new Error(`ABL socket connect timeout after ${ABL_CONNECT_TIMEOUT_MS / 1e3}s`));
    }, ABL_CONNECT_TIMEOUT_MS);
    socket.connect(CONFIG.ablSocketPort, CONFIG.host, () => {
      clearTimeout(connectTimeoutId);
      console.log(`Connected to ABL socket server on port ${CONFIG.ablSocketPort}`);
      resolve();
    });
    socket.on("data", (chunk) => {
      dataBuffer += chunk.toString();
      if (dataBuffer.length > MAX_DATA_BUFFER_BYTES) {
        dataBuffer = "";
        if (pendingReject) {
          const rejecter = pendingReject;
          pendingResolve = null;
          pendingReject = null;
          rejecter(new Error("ABL response exceeded maximum buffer size"));
        }
        flushQueue("ABL response exceeded maximum buffer size");
        reconnectToAbl();
        return;
      }
      if (dataBuffer.endsWith("\n") && pendingResolve) {
        const response = dataBuffer.trim();
        dataBuffer = "";
        const resolver = pendingResolve;
        pendingResolve = null;
        resolver(response);
      }
    });
    socket.on("close", () => {
      console.log("ABL connection closed");
      clearTimeout(connectTimeoutId);
      if (ablClient === socket) {
        ablClient = null;
      }
      if (pendingReject) {
        const rejecter = pendingReject;
        pendingResolve = null;
        pendingReject = null;
        rejecter(new Error("ABL connection closed"));
      }
      flushQueue("ABL connection closed");
    });
    socket.on("error", (err) => {
      console.error("ABL socket error:", err);
      clearTimeout(connectTimeoutId);
      if (ablClient === socket) {
        ablClient = null;
      }
      const wrappedErr = new Error("ABL socket error: " + err.message);
      wrappedErr.code = err.code;
      if (pendingReject) {
        const rejecter = pendingReject;
        pendingResolve = null;
        pendingReject = null;
        rejecter(wrappedErr);
      }
      flushQueue("ABL socket error: " + err.message);
      reject(err);
    });
  });
}
async function sendAblCommand(command) {
  if (reconnectPromise) {
    try {
      await reconnectPromise;
    } catch (err) {
      console.error("[ABL] Reconnection failed:", err.message);
    }
  }
  if (!ablClient) {
    throw new Error("Not connected to ABL");
  }
  if (requestQueue.length >= MAX_REQUEST_QUEUE_SIZE) {
    throw new Error(`ABL request queue overflow (${MAX_REQUEST_QUEUE_SIZE} pending requests)`);
  }
  return new Promise((resolve, reject) => {
    requestQueue.push({ command, resolve, reject });
    if (!isProcessingQueue) {
      processNextRequest();
    }
  });
}
function processNextRequest() {
  if (requestQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  isProcessingQueue = true;
  const { command, resolve, reject } = requestQueue.shift();
  dataBuffer = "";
  pendingReject = reject;
  const jsonCmd = JSON.stringify(command);
  console.log(`[ABL] Sending: ${jsonCmd.substring(0, 200)}...`);
  const base64Cmd = Buffer.from(jsonCmd).toString("base64");
  ablClient.write(base64Cmd + "\n");
  const activeResolve = (response) => {
    clearTimeout(timeoutId);
    pendingResolve = null;
    pendingReject = null;
    resolve(response);
    let parsed = null;
    try {
      parsed = JSON.parse(response);
    } catch (_) {
      if (CONFIG.debug) {
        console.log("[ABL] Non-JSON response, skipping connection-error check");
      }
    }
    if (parsed && parsed.error && typeof parsed.description === "string" && parsed.description.toLowerCase().includes("connection failed")) {
      if (requestQueue.length > 0) {
        console.log(`[ABL] DB connection error detected, flushing ${requestQueue.length} queued request(s)`);
      }
      while (requestQueue.length > 0) {
        const { resolve: qResolve } = requestQueue.shift();
        qResolve(response);
      }
      isProcessingQueue = false;
      return;
    }
    processNextRequest();
  };
  pendingResolve = activeResolve;
  const timeoutId = setTimeout(() => {
    if (pendingResolve === activeResolve) {
      pendingResolve = null;
      pendingReject = null;
      reject(new Error("ABL command timeout"));
      flushQueue("ABL connection unresponsive after timeout");
      reconnectToAbl();
    }
  }, ABL_COMMAND_TIMEOUT_MS);
}
function flushQueue(reason) {
  if (requestQueue.length > 0) {
    console.log(`[ABL] Flushing ${requestQueue.length} queued request(s): ${reason}`);
  }
  while (requestQueue.length > 0) {
    const { reject } = requestQueue.shift();
    reject(new Error(reason));
  }
  isProcessingQueue = false;
}
var reconnectPromise = null;
async function reconnectToAbl() {
  if (reconnectPromise)
    return reconnectPromise;
  console.log("[ABL] Attempting to reconnect...");
  dataBuffer = "";
  reconnectPromise = (async () => {
    try {
      if (ablClient) {
        ablClient.removeAllListeners();
        ablClient.destroy();
        ablClient = null;
      }
      await connectToAbl();
      console.log("[ABL] Reconnected successfully");
    } catch (err) {
      console.error("[ABL] Reconnect failed:", err.message);
    } finally {
      reconnectPromise = null;
    }
  })();
  return reconnectPromise;
}
function extractErrorCode(message) {
  if (!message)
    return null;
  const sysMatch = message.match(/\b(E[A-Z]{2,})\b/);
  if (sysMatch)
    return sysMatch[1];
  const oeMatch = message.match(/(?:error[:\s]*|[(\s])(\d{3,5})(?:\b|[)\s])/i);
  if (oeMatch)
    return oeMatch[1];
  return null;
}
function parseAblResponse(response) {
  try {
    const parsed = JSON.parse(response);
    if (CONFIG.debug) {
      console.log(`[ABL] Response: ${JSON.stringify(parsed)}`);
    }
    return parsed;
  } catch (e) {
    if (CONFIG.debug) {
      console.log(`[ABL] Response (raw): ${response}`);
    }
    return { error: "ABL_PARSE_ERROR", errorCode: "ABL_PARSE_ERROR", description: "Failed to parse ABL response", raw: response };
  }
}
function validateDbParam(url, res) {
  const db = url.searchParams.get("db") || "";
  if (!db) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 257, errorCode: "257", description: "Database name is required. Configure databases in openedge-project.json." }));
    return null;
  }
  return db;
}
function validateConnectionString(url, res, db) {
  const connectionString = url.searchParams.get("conn") || CONFIG.getConnectionString(db);
  if (!connectionString) {
    const loadedKeys = Object.keys(CONFIG.dbConnectionsFromConfig).filter((k) => k !== "_skippedEntries");
    const skippedEntries = CONFIG.dbConnectionsFromConfig._skippedEntries || [];
    let hint = "";
    if (!CONFIG.oeConfigPath) {
      hint = "HCK_OE_CONFIG not set";
    } else if (skippedEntries.some((s) => s.toLowerCase() === db.toLowerCase())) {
      hint = `"${db}" exists in openedge-project.json but has no "connect" string`;
    } else {
      const ciMatch = loadedKeys.find((k) => k.toLowerCase() === db.toLowerCase());
      if (ciMatch) {
        hint = `case mismatch: requested "${db}" but config has "${ciMatch}"`;
      } else {
        hint = `"${db}" not found in config (available: ${loadedKeys.join(", ") || "none"})`;
      }
    }
    res.statusCode = 400;
    res.end(JSON.stringify({
      error: "NO_CONNECTION_STRING",
      description: `No connection string found for database "${db}". ${hint}`
    }));
    return null;
  }
  return normalizeConnectionString(connectionString);
}
function normalizeConnectionString(connectionString) {
  const trimmedConnectionString = connectionString.trim();
  const hasServerPort = /(^|\s)-S\s+/i.test(trimmedConnectionString);
  const hasHost = /(^|\s)-H\s+/i.test(trimmedConnectionString);
  if (process.platform !== "win32" && hasServerPort && !hasHost) {
    return `${trimmedConnectionString} -H 127.0.0.1`;
  }
  return trimmedConnectionString;
}
function sendAblResponse(res, parsedResponse, endpointName) {
  saveResponseToJson(endpointName, parsedResponse);
  if (parsedResponse && !Array.isArray(parsedResponse) && parsedResponse.error !== void 0) {
    res.statusCode = 500;
    const errorCode = String(parsedResponse.error);
    res.end(JSON.stringify({
      error: parsedResponse.error,
      errorCode,
      description: parsedResponse.description || "ABL error " + errorCode,
      trace: parsedResponse.trace || null
    }));
    return;
  }
  res.end(JSON.stringify(parsedResponse));
}
function saveResponseToJson(endpointName, parsedResponse) {
  if (!CONFIG.debug)
    return;
  const outputDir = path.join(__dirname, "oe", "src", "jsonOutput");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputFile = path.join(outputDir, `${endpointName}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(parsedResponse, null, 2));
  console.log(`[API] Response saved to ${outputFile}`);
}
async function handleActionRequest(req, res, actionName, actionFn) {
  let rawBody = "";
  await new Promise((resolve) => {
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", resolve);
  });
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (_) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "INVALID_JSON", description: "Request body must be valid JSON." }));
    return;
  }
  if (body.confirm !== true) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "CONFIRMATION_REQUIRED", description: `Set confirm: true to execute the "${actionName}" action.` }));
    return;
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "REASON_REQUIRED", description: `A non-empty reason is required to execute the "${actionName}" action.` }));
    return;
  }
  const fakeUrl = new URL(`http://host?db=${encodeURIComponent(body.db || "")}&conn=${encodeURIComponent(body.conn || "")}`);
  const db = validateDbParam(fakeUrl, res);
  if (!db) {
    return;
  }
  const connectionString = validateConnectionString(fakeUrl, res, db);
  if (!connectionString) {
    return;
  }
  console.log(`[Action] ${actionName} requested \u2014 db=${db}, reason=${reason}`);
  try {
    const result = await actionFn(body, db, connectionString);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "ACTION_ERROR", description: err.message || "Unexpected error during action." }));
  }
}
async function vstQuery(db, connectionString, tables) {
  const response = await sendAblCommand({
    procedure: "vstt/app/getVstJson.p",
    connectionString,
    dbName: db,
    propath: CONFIG.hckPropath,
    params: [
      { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
      { type: "CHARACTER", mode: "INPUT", value: tables.join(","), name: "tables" },
      { type: "LONGCHAR", mode: "OUTPUT", name: "json" }
    ]
  });
  return parseAblResponse(response);
}
async function fetchConnections(db, connectionString, connectionId) {
  const response = await sendAblCommand({
    procedure: "vstt/app/getConnectData.p",
    connectionString,
    dbName: db,
    propath: CONFIG.hckPropath,
    params: [
      { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
      { type: "INT64", mode: "INPUT", value: connectionId ? String(connectionId) : "?", name: "connectionId" },
      { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
    ]
  });
  return parseAblResponse(response);
}
var DISCONNECT_VERIFY_TIMEOUT_MS = 15e3;
var DISCONNECT_VERIFY_INTERVAL_MS = 500;
async function waitForConnectionGone(db, connectionString, connectionId, timeoutMs, targetFingerprint) {
  const deadline = Date.now() + timeoutMs;
  for (; ; ) {
    const parsed = await fetchConnections(db, connectionString, connectionId);
    const rows = Array.isArray(parsed) ? parsed : [];
    if (rows.length === 0) {
      return true;
    }
    if (targetFingerprint) {
      const row = rows[0].connectionData || {};
      if (row["_Connect-Pid"] !== targetFingerprint.pid || row["_Connect-Time"] !== targetFingerprint.time) {
        return true;
      }
    }
    if (Date.now() >= deadline) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, DISCONNECT_VERIFY_INTERVAL_MS));
  }
}
function dbPathFromConnectionString(connectionString) {
  const m = /-db\s+(?:"([^"]+)"|(\S+))/.exec(connectionString || "");
  return m ? m[1] || m[2] : null;
}
function proshutDisconnect(dbPath, userNumber) {
  const exe = path.join(CONFIG.dlcPath, "bin", process.platform === "win32" ? "_mprshut.exe" : "_mprshut");
  const resolved = path.resolve(dbPath);
  const dbDir = path.dirname(resolved);
  const dbName = path.basename(resolved, ".db");
  return new Promise((resolve, reject) => {
    execFile(
      exe,
      [dbName, "-C", "disconnect", String(userNumber)],
      { cwd: dbDir, env: { ...process.env, DLC: CONFIG.dlcPath }, timeout: 3e4 },
      (err, stdout, stderr) => {
        const output = `${stdout || ""}${stderr || ""}`.trim();
        if (err) {
          reject(new Error(`proshut disconnect failed: ${output || err.message}. Note: disconnect requires the backend to run on the database host (shared-memory access).`));
          return;
        }
        resolve(output);
      }
    );
  });
}
var VST_READ_ROUTES = {
  "/api/db/status": { tables: ["_DbStatus"], endpointName: "dbStatus" },
  "/api/clients/blocked": { tables: ["_Connect", "_Lock", "_LockReq"], endpointName: "blockedClients", post: vstLogic.buildBlockedClients },
  "/api/clients/overview": { tables: ["_Connect"], endpointName: "processOverview", post: vstLogic.buildProcessOverview },
  "/api/activity/bi": { tables: ["_ActBILog", "_Logging", "_DbStatus"], endpointName: "biActivity" },
  "/api/activity/ai": { tables: ["_ActAILog", "_Logging"], endpointName: "aiActivity" },
  "/api/activity/latch": { tables: ["_Latch", "_Resrc", "_TxeLock"], endpointName: "latchActivity" },
  "/api/activity/index": { tables: ["_ActIndex"], endpointName: "indexActivity" },
  "/api/activity/record": { tables: ["_ActRecord"], endpointName: "recordActivity" },
  "/api/activity/space": { tables: ["_ActSpace"], endpointName: "spaceActivity" },
  "/api/activity/io-file": { tables: ["_ActIOFile"], endpointName: "ioByFile" },
  "/api/activity/io-type": { tables: ["_ActIOType"], endpointName: "ioByType" },
  "/api/activity/other": { tables: ["_ActOther"], endpointName: "otherActivity" },
  "/api/db/startup-params": { tables: ["_Startup", "_DbParams"], endpointName: "startupParams" },
  "/api/servers": { tables: ["_Servers"], endpointName: "servers" },
  "/api/shm/segments": { tables: ["_Segments"], endpointName: "shmSegments" },
  "/api/db/two-phase-commit": { tables: ["_Logging"], endpointName: "twoPhaseCommit" },
  "/api/db/license": { tables: ["_License"], endpointName: "licenseUsage" },
  "/api/db/features": { tables: ["_Database-Feature", "_Code-Feature"], endpointName: "featureFlags" },
  "/api/db/logging": { tables: ["_Logging"], endpointName: "loggingSettings" },
  "/api/area/thresholds": { tables: ["_AreaThreshold", "_AreaStatus"], endpointName: "areaThresholds", post: vstLogic.buildAreaThresholds },
  "/api/health/summary": { tables: vstLogic.HEALTH_SUMMARY_TABLES, endpointName: "healthSummary", post: vstLogic.buildHealthSummary }
};
var httpServer = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  try {
    console.log(`[API] ${req.method} ${req.url}`);
    if (pathname === "/health") {
      res.end(JSON.stringify({ status: "ok", ablConnected: !!ablClient }));
      return;
    }
    if (pathname === "/api/reload-config" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (data.configPath) {
            console.log(`[Config] Reloading config from: ${data.configPath}`);
            CONFIG.oeConfigPath = data.configPath;
            if (data.connections && typeof data.connections === "object") {
              CONFIG.dbConnectionsFromConfig = data.connections;
              console.log("[Config] Using resolved connections from editor (credentials included)");
            } else {
              CONFIG.dbConnectionsFromConfig = loadDbConnectionsFromConfig(data.configPath);
            }
            const dbKeys = Object.keys(CONFIG.dbConnectionsFromConfig).filter((k) => k !== "_skippedEntries");
            console.log(`[Config] Reloaded ${dbKeys.length} database connections:`, dbKeys);
            res.end(JSON.stringify({ status: "ok", databases: dbKeys }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Missing configPath in request body" }));
          }
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
        }
      });
      return;
    }
    if (pathname === "/api/run") {
      const procedure = url.searchParams.get("procedure") || "";
      const paramsJson = url.searchParams.get("params") || "[]";
      if (!procedure) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing procedure parameter" }));
        return;
      }
      let params;
      try {
        params = JSON.parse(paramsJson);
      } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid params JSON" }));
        return;
      }
      const response = await sendAblCommand({ procedure, params });
      res.end(JSON.stringify(parseAblResponse(response)));
      return;
    }
    if (pathname === "/api/activity/buffer") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getActBufferData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      if (CONFIG.debug) {
        console.log("=== RAW RESPONSE DEBUG ===");
        console.log("Raw response type:", typeof response);
        console.log("Raw response length:", response.length);
        console.log("Raw response first 200 chars:", response.substring(0, 200));
        console.log("Raw response last 200 chars:", response.substring(response.length - 200));
        console.log("=== END RAW RESPONSE DEBUG ===");
      }
      const parsedResponse = parseAblResponse(response);
      if (CONFIG.debug) {
        console.log("Parsed response type:", typeof parsedResponse);
        console.log("Parsed response is array:", Array.isArray(parsedResponse));
        if (Array.isArray(parsedResponse)) {
          console.log("Parsed response array length:", parsedResponse.length);
        }
      }
      sendAblResponse(res, parsedResponse, "bufferActivity");
      return;
    }
    if (pathname === "/api/activity/lock") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getActLockData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "lockActivity");
      return;
    }
    if (pathname === "/api/activity/pw") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getActPWsData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "pwActivity");
      return;
    }
    if (pathname === "/api/activity/server") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getActServerData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "serverActivity");
      return;
    }
    if (pathname === "/api/activity/summary") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getActSummaryData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "summaryActivity");
      return;
    }
    if (pathname === "/api/area/status") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getAreaStatusData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "areaStatus");
      return;
    }
    if (pathname === "/api/buffer/status") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getBuffStatusData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "bufferStatus");
      return;
    }
    if (pathname === "/api/checkpoint") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getCheckpointData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "checkpoint");
      return;
    }
    if (pathname === "/api/connections") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const selectedConnectionId = url.searchParams.get("connectionId") || "";
      const parsedResponse = await fetchConnections(db, connectionString, selectedConnectionId);
      sendAblResponse(res, parsedResponse, "connections");
      return;
    }
    if (pathname === "/api/files") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getFileListData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "files");
      return;
    }
    if (pathname === "/api/locks") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getLockData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "locks");
      return;
    }
    if (pathname === "/api/replication/agent") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getReplAgentData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "replicationAgent");
      return;
    }
    if (pathname === "/api/replication/server") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getReplServerData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "replicationServer");
      return;
    }
    if (pathname === "/api/stats/table-index") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getTableStatIndexStatData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      let parsedResponse = parseAblResponse(response);
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        parsedResponse = parsedResponse[0];
      }
      if (parsedResponse && parsedResponse.error === void 0) {
        try {
          const rangeVst = await vstQuery(db, connectionString, ["_StatBase", "_DbStatus", "_DbParams"]);
          if (rangeVst && rangeVst.error === void 0) {
            parsedResponse.rangeConfig = vstLogic.buildRangeConfig(rangeVst, parsedResponse);
          }
        } catch (rangeErr) {
          console.log("[API] rangeConfig lookup failed (non-fatal):", rangeErr.message);
        }
      }
      sendAblResponse(res, parsedResponse, "tableIndexStats");
      return;
    }
    if (pathname === "/api/transactions") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getTransData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "transactions");
      return;
    }
    if (pathname === "/api/user/io") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getUserIOData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "userIO");
      return;
    }
    if (pathname === "/api/stats/user-table-index") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const selectedUserNumber = url.searchParams.get("userNumber") || "";
      const response = await sendAblCommand({
        procedure: "vstt/app/getUserTableStatUserIndexStatData.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "INTEGER", mode: "INPUT", value: selectedUserNumber || "?", name: "userNumber" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      let parsedResponse = parseAblResponse(response);
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        parsedResponse = parsedResponse[0];
      }
      sendAblResponse(res, parsedResponse, "userTableIndexStats");
      return;
    }
    if (pathname === "/api/record/details") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const fileNumber = url.searchParams.get("fileNumber") || "";
      const recid = url.searchParams.get("recid") || "";
      if (!fileNumber || !recid) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "MISSING_PARAMS", description: "fileNumber and recid are required." }));
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getRecordDetails.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "ipcLogicalDbName" },
          { type: "INTEGER", mode: "INPUT", value: fileNumber, name: "ipiFileNumber" },
          { type: "INTEGER", mode: "INPUT", value: recid, name: "ipiRecid" },
          { type: "CHARACTER", mode: "OUTPUT", name: "opcTableName" },
          { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      sendAblResponse(res, parsedResponse, "recordDetails");
      return;
    }
    if (pathname === "/api/actions/disconnect-user" && req.method === "POST") {
      await handleActionRequest(req, res, "disconnect-user", async (body, db, connectionString) => {
        const connectionId = body.connectionId;
        if (!connectionId) {
          return { status: 400, body: { error: "MISSING_PARAM", description: "connectionId is required." } };
        }
        const checkParsed = await fetchConnections(db, connectionString, connectionId);
        const connections = Array.isArray(checkParsed) ? checkParsed : [];
        if (connections.length === 0) {
          return { status: 409, body: { error: "TARGET_NOT_FOUND", description: `No active connection found for connectionId "${connectionId}".` } };
        }
        const targetConnData = connections[0].connectionData || {};
        const userNumber = targetConnData["_Connect-Usr"];
        if (!Number.isInteger(userNumber)) {
          return { status: 500, body: { error: "NO_USER_NUMBER", description: `Connection ${connectionId} has no usable _Connect-Usr (got ${JSON.stringify(userNumber)}); cannot run the proshut disconnect.` } };
        }
        const dbPath = dbPathFromConnectionString(connectionString);
        if (!dbPath) {
          return { status: 500, body: { error: "NO_DB_PATH", description: `Could not extract the physical database path (-db) from the connection string for "${db}".` } };
        }
        const targetFingerprint = { pid: targetConnData["_Connect-Pid"], time: targetConnData["_Connect-Time"] };
        await proshutDisconnect(dbPath, userNumber);
        const gone = await waitForConnectionGone(db, connectionString, connectionId, DISCONNECT_VERIFY_TIMEOUT_MS, targetFingerprint);
        return {
          status: 200,
          body: {
            ok: true,
            action: "disconnect-user",
            target: String(connectionId),
            disconnected: gone,
            description: gone ? `Session ${connectionId} (usernum ${userNumber}) was disconnected and is no longer listed in _Connect.` : `Disconnect was initiated (proshut -C disconnect ${userNumber}) but session ${connectionId} is still listed after ${DISCONNECT_VERIFY_TIMEOUT_MS / 1e3}s \u2014 it may be backing out a large transaction; re-check with get_connections.`
          }
        };
      });
      return;
    }
    if (pathname === "/api/actions/clear-lock" && req.method === "POST") {
      await handleActionRequest(req, res, "clear-lock", async (body, db, connectionString) => {
        const { lockId, connectionId, table } = body;
        if (!lockId && !connectionId && !table) {
          return { status: 400, body: { error: "MISSING_PARAM", description: "At least one of lockId, connectionId, or table is required." } };
        }
        const checkResponse = await sendAblCommand({
          procedure: "vstt/app/getLockData.p",
          connectionString,
          dbName: db,
          propath: CONFIG.hckPropath,
          params: [
            { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
            { type: "DATASET-HANDLE", mode: "OUTPUT", name: "dataset" }
          ]
        });
        const checkParsed = parseAblResponse(checkResponse);
        const locks = Array.isArray(checkParsed) ? checkParsed : [];
        if (locks.length === 0) {
          return { status: 409, body: { error: "TARGET_NOT_FOUND", description: "No locks found for the specified database." } };
        }
        const target = lockId || connectionId || table || "unknown";
        return {
          status: 200,
          body: {
            ok: true,
            action: "clear-lock",
            target: String(target),
            description: `Clear-lock request validated. ${locks.length} lock(s) exist in database. ABL management task execution requires a LONGCHAR-output wrapper for executeManagementTask.p.`,
            note: "Action layer verified. Backend ABL execution pending wrapper procedure."
          }
        };
      });
      return;
    }
    if (VST_READ_ROUTES[pathname] && req.method === "GET") {
      const route = VST_READ_ROUTES[pathname];
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      let parsedResponse = await vstQuery(db, connectionString, route.tables);
      const isAblError = parsedResponse && !Array.isArray(parsedResponse) && parsedResponse.error !== void 0;
      if (route.post && !isAblError) {
        parsedResponse = route.post(parsedResponse);
      }
      sendAblResponse(res, parsedResponse, route.endpointName);
      return;
    }
    if (pathname === "/api/databases") {
      res.end(JSON.stringify(vstLogic.buildDatabasesPayload(
        CONFIG.dbConnectionsFromConfig,
        CONFIG.oeConfigPath
      )));
      return;
    }
    if (pathname === "/api/db/info") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getDbInfoJson.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "LONGCHAR", mode: "OUTPUT", name: "json" }
        ]
      });
      const parsedResponse = parseAblResponse(response);
      const isAblError = parsedResponse && !Array.isArray(parsedResponse) && parsedResponse.error !== void 0;
      sendAblResponse(res, isAblError ? parsedResponse : vstLogic.buildDbInfo(parsedResponse, db), "dbInfo");
      return;
    }
    if (pathname === "/api/index/information") {
      const db = validateDbParam(url, res);
      if (!db) {
        return;
      }
      const connectionString = validateConnectionString(url, res, db);
      if (!connectionString) {
        return;
      }
      const tableName = url.searchParams.get("tableName") || "";
      const indexName = url.searchParams.get("indexName") || "";
      if (!tableName) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "MISSING_PARAMS", description: "tableName is required." }));
        return;
      }
      const response = await sendAblCommand({
        procedure: "vstt/app/getIndexInformationJson.p",
        connectionString,
        dbName: db,
        propath: CONFIG.hckPropath,
        params: [
          { type: "CHARACTER", mode: "INPUT", value: db, name: "db" },
          { type: "CHARACTER", mode: "INPUT", value: tableName, name: "tableName" },
          { type: "CHARACTER", mode: "INPUT", value: indexName, name: "indexName" },
          { type: "LONGCHAR", mode: "OUTPUT", name: "json" }
        ]
      });
      sendAblResponse(res, parseAblResponse(response), "indexInformation");
      return;
    }
    if (pathname === "/api/management/tasks") {
      const response = await sendAblCommand({
        procedure: "vstt/app/getManagementTasksJson.p",
        propath: CONFIG.hckPropath,
        params: [
          { type: "LONGCHAR", mode: "OUTPUT", name: "json" }
        ]
      });
      sendAblResponse(res, parseAblResponse(response), "managementTasks");
      return;
    }
    if (pathname === "/api/actions/reset-table-stats" && req.method === "POST") {
      await handleActionRequest(req, res, "reset-table-stats", async (body, db, connectionString) => {
        const preflight = await vstQuery(db, connectionString, ["_StatBase"]);
        if (preflight && preflight.error === void 0 && vstLogic.tableError(preflight, "_StatBase") !== null) {
          return {
            status: 200,
            body: {
              ok: false,
              supported: false,
              action: "reset-table-stats",
              db,
              description: "The _StatBase VST is not available in this OpenEdge version (removed in 12.x), so the statistics counters cannot be zeroed online. Restart the broker to reset them, or compute deltas between two get_table_stats samples instead."
            }
          };
        }
        const response = await sendAblCommand({
          procedure: "vstt/app/resetTableIndexStats.p",
          connectionString,
          dbName: db,
          propath: CONFIG.hckPropath,
          params: [
            { type: "CHARACTER", mode: "INPUT", value: db, name: "db" }
          ]
        });
        const parsed = parseAblResponse(response);
        if (parsed && !Array.isArray(parsed) && parsed.error !== void 0) {
          return { status: 500, body: parsed };
        }
        return {
          status: 200,
          body: {
            ok: true,
            action: "reset-table-stats",
            db,
            description: "Table and index statistics counters were reset. Call /api/stats/table-index to start a fresh measurement window."
          }
        };
      });
      return;
    }
    if (pathname === "/api/actions/run-management-task" && req.method === "POST") {
      await handleActionRequest(req, res, "run-management-task", async (body, db, connectionString) => {
        const taskName = typeof body.taskName === "string" ? body.taskName.trim() : "";
        if (!taskName) {
          return { status: 400, body: { error: "MISSING_PARAM", description: "taskName is required (see /api/management/tasks for the catalog)." } };
        }
        const response = await sendAblCommand({
          procedure: "vstt/app/runManagementTaskJson.p",
          connectionString,
          dbName: db,
          propath: CONFIG.hckPropath,
          params: [
            { type: "CHARACTER", mode: "INPUT", value: String(body.taskHost || ""), name: "taskHost" },
            { type: "CHARACTER", mode: "INPUT", value: String(body.taskType || ""), name: "taskType" },
            { type: "CHARACTER", mode: "INPUT", value: taskName, name: "taskName" },
            { type: "CHARACTER", mode: "INPUT", value: String(body.taskAction || ""), name: "taskAction" },
            { type: "INTEGER", mode: "INPUT", value: String(body.number || 0), name: "number" },
            { type: "LONGCHAR", mode: "OUTPUT", name: "json" }
          ]
        });
        const parsed = parseAblResponse(response);
        if (parsed && !Array.isArray(parsed) && parsed.error !== void 0) {
          return { status: 500, body: parsed };
        }
        return { status: 200, body: parsed };
      });
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    res.statusCode = 500;
    const systemCode = err.code || extractErrorCode(err.message) || null;
    const isTimeout = err.message && err.message.toLowerCase().includes("timeout");
    const isConnectionError = err.message && (err.message.toLowerCase().includes("not connected") || err.message.toLowerCase().includes("econnrefused") || err.message.toLowerCase().includes("econnreset") || err.message.toLowerCase().includes("database connection failed"));
    if (isTimeout || isConnectionError) {
      res.end(JSON.stringify({
        error: "DATABASE_CONNECTION_TIMEOUT",
        errorCode: systemCode || "DATABASE_CONNECTION_TIMEOUT",
        description: err.message || "Connection to the database timed out. Please verify that the database is running and accessible."
      }));
    } else {
      res.end(JSON.stringify({
        error: systemCode || "BACKEND_ERROR",
        errorCode: systemCode,
        description: err.message || "An unexpected backend error occurred."
      }));
    }
  }
});
async function main() {
  try {
    console.log("=== HCK ABL Socket Server ===\n");
    CONFIG.init();
    if (process.env.HCK_TEST_SKIP_ABL_SPAWN !== "true") {
      if (!CONFIG.dlcPath) {
        throw new Error("DLC environment variable is not set. Please configure abl.configuration.runtimes in VS Code settings.");
      }
      await startAblProcess();
    }
    await connectToAbl();
    httpServer.listen(CONFIG.httpPort, CONFIG.host, () => {
      console.log(`
HTTP API server running on http://${CONFIG.host}:${CONFIG.httpPort}`);
      console.log("\nActivity APIs:");
      console.log("  GET /api/activity/buffer?db=X            - Buffer activity (HCK)");
      console.log("  GET /api/activity/lock?db=X              - Lock activity (HCK)");
      console.log("  GET /api/activity/pw?db=X                 - Page Writer activity (HCK)");
      console.log("  GET /api/activity/server?db=X             - Server activity (HCK)");
      console.log("  GET /api/activity/summary?db=X             - Summary activity (HCK)");
      console.log("\nStatus APIs:");
      console.log("  GET /api/area/status?db=X                 - Area status (HCK)");
      console.log("  GET /api/buffer/status?db=X                - Buffer status (HCK)");
      console.log("  GET /api/checkpoint?db=X                   - Checkpoint info (HCK)");
      console.log("\nConnection APIs:");
      console.log("  GET /api/connections?db=X                  - Connection info (HCK)");
      console.log("  GET /api/files?db=X                       - File list (HCK)");
      console.log("  GET /api/locks?db=X                       - Lock info (HCK)");
      console.log("\nData APIs:");
      console.log("  GET /api/transactions?db=X                 - Transaction data (HCK)");
      console.log("  GET /api/user/io?db=X                      - User I/O data (HCK)");
      console.log("\nStatistics APIs:");
      console.log("  GET /api/stats/table-index?db=X            - Table/Index statistics (HCK)");
      console.log("  GET /api/stats/user-table-index?db=X       - User Table/Index statistics (HCK)");
      console.log("\nRecord APIs:");
      console.log("  GET /api/record/details?db=X&fileNumber=N&recid=N - Record field details (HCK)");
      console.log("\nReplication APIs:");
      console.log("  GET /api/replication/agent?db=X            - Replication agent (HCK)");
      console.log("  GET /api/replication/server?db=X           - Replication server (HCK)");
      console.log("\nP1 VST monitoring APIs:");
      Object.keys(VST_READ_ROUTES).forEach((route) => {
        console.log(`  GET ${route}?db=X`.padEnd(45) + `- ${VST_READ_ROUTES[route].tables.join(", ")}`);
      });
      console.log("\nDiscovery & metadata APIs:");
      console.log("  GET /api/databases                         - Configured db connections (no DB needed)");
      console.log("  GET /api/db/info?db=X                      - Merged _DbStatus + _Startup info");
      console.log("  GET /api/index/information?db=X&tableName=Y - Per-index detail for a table");
      console.log("  GET /api/management/tasks                  - Management-task catalog (legacy VSTT)");
      console.log("\nGuarded Action APIs (require confirm:true + reason in POST body):");
      console.log("  POST /api/actions/disconnect-user          - Disconnect a user session");
      console.log("  POST /api/actions/clear-lock               - Clear a database lock");
      console.log("  POST /api/actions/reset-table-stats        - Zero table/index statistics counters");
      console.log("  POST /api/actions/run-management-task      - Execute a configured management task");
      console.log("\nGeneric (debug only):");
      console.log("  GET /api/run?procedure=X&params=[...]    - Run any procedure dynamically");
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
}
function gracefulShutdown(signal) {
  console.log(`
Received ${signal}, shutting down gracefully...`);
  if (httpServer) {
    httpServer.close(() => {
      console.log("HTTP server closed");
    });
  }
  if (ablClient) {
    ablClient.destroy();
    console.log("ABL client connection destroyed");
  }
  if (ablProcess) {
    console.log("Stopping ABL process...");
    if (process.platform === "win32") {
      ablProcess.kill("SIGKILL");
      console.log("ABL process killed");
    } else {
      const processToStop = ablProcess;
      ablProcess.kill("SIGTERM");
      setTimeout(() => {
        if (processToStop.exitCode === null && !processToStop.killed) {
          console.log("ABL process did not exit after SIGTERM, escalating to SIGKILL");
          processToStop.kill("SIGKILL");
        }
      }, 500);
    }
  }
  setTimeout(() => {
    console.log("Exiting...");
    process.exit(0);
  }, 500);
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  gracefulShutdown("uncaughtException");
});
main();
