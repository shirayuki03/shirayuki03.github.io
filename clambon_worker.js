let pyodide = null;
let initialized = false;
let initializing = null;
let runCodeProxy = null;
let resetStateProxy = null;
let importStateProxy = null;
let exportStateProxy = null;
let configureExtensionsProxy = null;
let setExtensionInputProxy = null;
let outputBuffer = [];
let lastOutputFlush = 0;
let configuredExtensions = [];

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const OUTPUT_FLUSH_INTERVAL_MS = 30;
const OUTPUT_FLUSH_MAX_LINES = 100;

function post(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

function flushOutput() {
  if (!outputBuffer.length) return;
  post("output", { text: outputBuffer.join("\n") });
  outputBuffer = [];
  lastOutputFlush = Date.now();
}

function queueOutput(line) {
  outputBuffer.push(String(line));
  const now = Date.now();
  if (outputBuffer.length >= OUTPUT_FLUSH_MAX_LINES || now - lastOutputFlush >= OUTPUT_FLUSH_INTERVAL_MS) {
    flushOutput();
  }
}

function pyToJs(proxy) {
  if (!proxy || typeof proxy.toJs !== "function") {
    return proxy;
  }
  const value = proxy.toJs({ dict_converter: Object.fromEntries });
  proxy.destroy();
  return value;
}

async function readText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} を読み込めませんでした。`);
  }
  return response.text();
}

async function initialize() {
  if (initialized) return;
  if (initializing) {
    await initializing;
    return;
  }

  initializing = (async () => {
    post("status", { status: "loading" });
    importScripts(`${PYODIDE_URL}pyodide.js`);
    pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
    await pyodide.loadPackage(["micropip", "sympy"]);

    const micropip = pyodide.pyimport("micropip");
    await micropip.install("lark");

    const [grammarText, runtimeText] = await Promise.all([
      readText("./grammar.lark"),
      readText("./clambon_runtime.py")
    ]);

    pyodide.runPython(runtimeText);
    pyodide.globals.get("set_handlers")(
      queueOutput,
      (state) => post("checkpoint", { state: String(state) }),
      (extensionName, eventType, payloadJson) => {
        post("extensionEvent", {
          extensionName: String(extensionName),
          eventType: String(eventType),
          payload: JSON.parse(String(payloadJson || "{}"))
        });
      }
    );
    pyodide.globals.get("init_runtime")(grammarText, pyodide.toPy(configuredExtensions));

    runCodeProxy = pyodide.globals.get("run_code_async");
    resetStateProxy = pyodide.globals.get("reset_state");
    importStateProxy = pyodide.globals.get("import_state");
    exportStateProxy = pyodide.globals.get("export_state");
    configureExtensionsProxy = pyodide.globals.get("configure_extensions");
    setExtensionInputProxy = pyodide.globals.get("set_extension_input");
    initialized = true;
    post("ready");
  })();

  try {
    await initializing;
  } finally {
    initializing = null;
  }
}

async function runSource(code, restoreState) {
  await initialize();
  configureExtensionsProxy(pyodide.toPy(configuredExtensions));
  post("status", { status: "running" });
  pyodide.globals.set("__run_code_source", String(code || ""));
  pyodide.globals.set("__run_restore_state", restoreState || null);
  const result = pyToJs(await pyodide.runPythonAsync("await run_code_async(__run_code_source, __run_restore_state)"));
  flushOutput();
  if (result && result.checkpoint) {
    post("checkpoint", { state: result.checkpoint });
  }
  if (result && result.ok) {
    post("status", { status: "completed" });
    return;
  }
  post("error", { message: result?.error || "実行中にエラーが起きました。" });
  post("status", { status: "error" });
}

self.addEventListener("message", (event) => {
  const { type, code, restoreState, state, extensions, input } = event.data || {};

  (async () => {
    if (type === "init") {
      await initialize();
      return;
    }

    if (type === "run") {
      configuredExtensions = Array.isArray(extensions) ? extensions : configuredExtensions;
      await runSource(String(code || ""), restoreState || null);
      return;
    }

    if (type === "configureExtensions") {
      configuredExtensions = Array.isArray(extensions) ? extensions : [];
      if (initialized) {
        configureExtensionsProxy(pyodide.toPy(configuredExtensions));
      }
      post("extensionsConfigured", { extensions: configuredExtensions.map((extension) => extension.name) });
      return;
    }

    if (type === "extensionInput") {
      await initialize();
      setExtensionInputProxy(pyodide.toPy(input || {}));
      return;
    }

    if (type === "restore") {
      await initialize();
      const restored = pyToJs(importStateProxy(state || null));
      post("checkpoint", { state: restored });
      post("status", { status: "stopped" });
      return;
    }

    if (type === "reset") {
      await initialize();
      const resetState = pyToJs(resetStateProxy());
      post("checkpoint", { state: resetState });
      post("status", { status: "stopped" });
    }
  })().catch((error) => {
    post("error", { message: error?.message || "実行エンジンでエラーが起きました。" });
    post("status", { status: "error" });
  });
});
