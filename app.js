const exampleCode = `define plus(a, b) {
  return a + b
}

print(plus(2, 3))`;

const editor = document.querySelector("#codeEditor");
const lineNumbers = document.querySelector("#lineNumbers");
const syntaxHighlight = document.querySelector("#syntaxHighlight");
const outputLog = document.querySelector("#outputLog");
const runButton = document.querySelector("#runButton");
const stopButton = document.querySelector("#stopButton");
const fileMenu = document.querySelector("#fileMenu");
const fileMenuButton = document.querySelector("#fileMenuButton");
const saveToPcButton = document.querySelector("#saveToPcButton");
const loadFromPcButton = document.querySelector("#loadFromPcButton");
const fileInput = document.querySelector("#fileInput");
const formatButton = document.querySelector("#formatButton");
const runStatus = document.querySelector("#runStatus");
const outputPanel = document.querySelector("#outputPanel");
const splitWorkbench = document.querySelector("#splitWorkbench");
const workspace = document.querySelector(".workspace");
const codeWrap = document.querySelector("#codeWrap");
const extensionTopbarMount = document.querySelector("#extensionTopbarMount");
const extensionModeMount = document.querySelector("#extensionModeMount");
const extensionButton = document.querySelector("#extensionButton");
const extensionModal = document.querySelector("#extensionModal");
const extensionCloseButton = document.querySelector("#extensionCloseButton");
const extensionUrlInput = document.querySelector("#extensionUrlInput");
const extensionLoadButton = document.querySelector("#extensionLoadButton");
const extensionStatusText = document.querySelector("#extensionStatusText");
const extensionList = document.querySelector("#extensionList");
const settingsButton = document.querySelector("#settingsButton");
const settingsModal = document.querySelector("#settingsModal");
const settingsCloseButton = document.querySelector("#settingsCloseButton");
const settingsLanguage = document.querySelector("#settingsLanguage");
const settingsTheme = document.querySelector("#settingsTheme");
const settingsFontSize = document.querySelector("#settingsFontSize");
const settingsTabSize = document.querySelector("#settingsTabSize");
const settingsResetButton = document.querySelector("#settingsResetButton");
const learningModeButton = document.querySelector("#learningModeButton");
const homeLink = document.querySelector("#homeLink");
const lessonTab = document.querySelector("#lessonTab");
const referenceTab = document.querySelector("#referenceTab");
const lessonView = document.querySelector("#lessonView");
const referenceView = document.querySelector("#referenceView");
const tutorialProgress = document.querySelector("#tutorialProgress");
const outputLineLimit = 1000;
const extensionStorageKey = "clambon.web.extensions.v1";
const tutorialStorageKey = "clambon.web.tutorial.v1";
const learningModeStorageKey = "clambon.web.learning-mode.v1";
const settingsStorageKey = "clambon.web.settings.v1";
const projectFormat = "clambon-project";
const projectVersion = 1;
const tutorialData = window.ClambonTutorialData;
const defaultSettings = Object.freeze({ language: "ja", theme: "system", fontSize: 12, tabSize: 2 });
const settingsOptions = {
  language: new Set(["ja", "en"]), theme: new Set(["system", "light", "dark"]),
  fontSize: new Set([12, 14, 16, 18, 20]), tabSize: new Set([2, 4, 8])
};

const messages = {
  ja: {
    "settings.kicker": "Preferences", "settings.title": "Playgroundの設定", "settings.language": "表示言語",
    "settings.theme": "テーマ", "settings.themeSystem": "OSの設定に合わせる", "settings.themeLight": "ライト",
    "settings.themeDark": "ダーク", "settings.fontSize": "エディタの文字サイズ", "settings.tabSize": "Tab幅",
    "settings.autoSave": "変更は自動的に保存されます。", "settings.reset": "初期値に戻す",
    idle: "待機中", loading: "準備中", running: "実行中", completed: "完了", stopped: "停止", error: "エラー",
    outputPlaceholder: "実行結果がここに表示されます。", starting: "実行を開始しました...",
    lessons: "レッスン", reference: "ブロック対応表", compare: "ブロックとコードを比べる", exercise: "演習する",
    copy: "コードをコピー", copied: "コピーしました", hint: "ヒント：", lessonReady: "できました！次のステップへ進めます。",
    lessonWaiting: "コードを実行すると、ここに判定結果が表示されます。", next: "次のレッスン", first: "最初のレッスンへ",
    resetProgress: "学習進捗をリセット", search: "検索", searchPlaceholder: "構文やブロック名", category: "カテゴリ",
    platform: "対応元", all: "すべて", official: "確認した公式資料", noBlock: "対応するブロックは見つかっていません",
    settingsButton: "Playgroundの設定", close: "閉じる"
  },
  en: {
    "settings.kicker": "Preferences", "settings.title": "Playground settings", "settings.language": "Display language",
    "settings.theme": "Theme", "settings.themeSystem": "Use system setting", "settings.themeLight": "Light",
    "settings.themeDark": "Dark", "settings.fontSize": "Editor font size", "settings.tabSize": "Tab width",
    "settings.autoSave": "Changes are saved automatically.", "settings.reset": "Reset to defaults",
    idle: "Idle", loading: "Preparing", running: "Running", completed: "Completed", stopped: "Stopped", error: "Error",
    outputPlaceholder: "Program output appears here.", starting: "Starting program...",
    lessons: "Lessons", reference: "Block reference", compare: "Compare blocks and code", exercise: "Try it",
    copy: "Copy code", copied: "Copied", hint: "Hint: ", lessonReady: "Great! You can move to the next step.",
    lessonWaiting: "Run your code to see the result here.", next: "Next lesson", first: "Back to first lesson",
    resetProgress: "Reset learning progress", search: "Search", searchPlaceholder: "Syntax or block name", category: "Category",
    platform: "Source", all: "All", official: "View official documentation", noBlock: "No matching block was found",
    settingsButton: "Playground settings", close: "Close"
  }
};

function loadSettings() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(settingsStorageKey) || "{}"); } catch (_error) { saved = {}; }
  return Object.fromEntries(Object.entries(defaultSettings).map(([key, fallback]) => {
    const value = key === "fontSize" || key === "tabSize" ? Number(saved[key]) : saved[key];
    return [key, settingsOptions[key].has(value) ? value : fallback];
  }));
}

let playgroundSettings = loadSettings();
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const msg = (key) => messages[playgroundSettings.language]?.[key] || messages.ja[key] || key;

let paneDragState = null;
let engineWorker = null;
let engineReady = false;
let engineStarting = false;
let latestCheckpoint = null;
let pendingRunCode = null;
let loadedExtensions = [];
let extensionRuntimes = [];
let currentEditMode = "code";
let inputSyncTimer = null;
let currentRunOutput = [];
let tutorialState = loadTutorialState();
let learningModeEnabled = localStorage.getItem(learningModeStorageKey) === "true";
let projectFileBusy = false;
let settingsReturnFocus = null;
const pressedKeys = new Set();
const keyReleaseTimers = new Map();
const scratchSyntaxCategories = new Map([
  ["motion", "syntax-motion"],
  ["looks", "syntax-looks"],
  ["sound", "syntax-sound"],
  ["events", "syntax-events"],
  ["control", "syntax-control"],
  ["sensing", "syntax-sensing"],
  ["operators", "syntax-operator"],
  ["variables", "syntax-variable"],
  ["lists", "syntax-list"],
  ["custom", "syntax-custom"]
]);

const syntaxKeywordGroups = {
  control: new Set(["wait", "repeat", "forever", "if", "else"]),
  variable: new Set(["var"]),
  list: new Set(["list", "add", "delete", "insert", "item"]),
  operator: new Set([
    "mod", "and", "or", "not", "random", "join", "letter", "length", "contains", "round",
    "abs", "floor", "ceiling", "sqrt", "sin", "cos", "tan", "asin", "acos", "atan", "ln", "log",
    "true", "false"
  ]),
  custom: new Set(["define", "return"]),
  extension: new Set(["import", "print"])
};

const baseSyntaxKeywordClasses = new Map(
  Object.entries(syntaxKeywordGroups).flatMap(([group, keywords]) =>
    Array.from(keywords, (keyword) => [keyword, `syntax-${group}`])
  )
);
let activeSyntaxKeywords = [];
let activeSyntaxContexts = [];

function syntaxWarning(extensionName, detail) {
  return `${extensionName} のsyntaxHighlighting: ${detail}`;
}

function parseExtensionSyntaxHighlighting(extensionName, definition) {
  const result = { keywords: [], contexts: [], warnings: [] };
  if (definition == null) return result;
  if (typeof definition !== "object" || Array.isArray(definition)) {
    result.warnings.push(syntaxWarning(extensionName, "オブジェクトではないため無視しました。"));
    return result;
  }

  if (definition.keywords != null && (typeof definition.keywords !== "object" || Array.isArray(definition.keywords))) {
    result.warnings.push(syntaxWarning(extensionName, "keywordsがオブジェクトではないため無視しました。"));
  } else {
    for (const [category, keywords] of Object.entries(definition.keywords || {})) {
      const className = scratchSyntaxCategories.get(category);
      if (!className) {
        result.warnings.push(syntaxWarning(extensionName, `未対応カテゴリ「${category}」を無視しました。`));
        continue;
      }
      if (!Array.isArray(keywords)) {
        result.warnings.push(syntaxWarning(extensionName, `${category}は配列ではないため無視しました。`));
        continue;
      }
      for (const keyword of keywords) {
        if (typeof keyword !== "string" || !keyword.length) {
          result.warnings.push(syntaxWarning(extensionName, `${category}の空または文字列ではない予約語を無視しました。`));
          continue;
        }
        result.keywords.push({ keyword, className });
      }
    }
  }

  if (definition.contexts != null && !Array.isArray(definition.contexts)) {
    result.warnings.push(syntaxWarning(extensionName, "contextsが配列ではないため無視しました。"));
  } else {
    for (const context of definition.contexts || []) {
      const className = scratchSyntaxCategories.get(context?.category);
      if (!context || typeof context !== "object" || Array.isArray(context)
          || typeof context.keyword !== "string" || !context.keyword.length
          || typeof context.prefix !== "string" || !context.prefix.length
          || !className) {
        result.warnings.push(syntaxWarning(extensionName, "不正なcontext定義を無視しました。"));
        continue;
      }
      result.contexts.push({ keyword: context.keyword, prefix: context.prefix, className });
    }
  }
  return result;
}

function isAsciiIdentifierKeyword(keyword) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(keyword);
}

function hasAsciiIdentifierBoundary(source, index, keyword) {
  if (!isAsciiIdentifierKeyword(keyword)) return true;
  const before = source[index - 1] || "";
  const after = source[index + keyword.length] || "";
  return !/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after);
}

function rebuildSyntaxHighlighting() {
  const keywordClasses = new Map(baseSyntaxKeywordClasses);
  const contexts = [];
  for (const extension of loadedExtensions) {
    for (const entry of extension.syntaxHighlighting?.keywords || []) {
      if (!keywordClasses.has(entry.keyword)) keywordClasses.set(entry.keyword, entry.className);
    }
    for (const context of extension.syntaxHighlighting?.contexts || []) {
      if (!contexts.some((entry) => entry.keyword === context.keyword && entry.prefix === context.prefix)) {
        contexts.push(context);
      }
    }
  }
  activeSyntaxKeywords = Array.from(keywordClasses, ([keyword, className]) => ({ keyword, className }))
    .sort((left, right) => right.keyword.length - left.keyword.length);
  activeSyntaxContexts = contexts.sort((left, right) => right.prefix.length - left.prefix.length);
}

function escapeHighlightHtml(text) {
  return text.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);
}

function renderSyntaxHighlight(source) {
  let html = "";
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (character === '"' || character === "'") {
      const quote = character;
      let end = index + 1;
      let escaped = false;
      while (end < source.length) {
        const current = source[end++];
        if (escaped) escaped = false;
        else if (current === "\\") escaped = true;
        else if (current === quote) break;
      }
      html += escapeHighlightHtml(source.slice(index, end));
      index = end;
      continue;
    }

    const context = activeSyntaxContexts.find((entry) =>
      source.startsWith(entry.keyword, index)
      && source.slice(Math.max(0, index - entry.prefix.length), index) === entry.prefix
      && hasAsciiIdentifierBoundary(source, index, entry.keyword)
    );
    const keyword = context || activeSyntaxKeywords.find((entry) =>
      source.startsWith(entry.keyword, index) && hasAsciiIdentifierBoundary(source, index, entry.keyword)
    );
    if (keyword) {
      html += `<span class="${keyword.className}">${escapeHighlightHtml(keyword.keyword)}</span>`;
      index += keyword.keyword.length;
      continue;
    }
    html += escapeHighlightHtml(character);
    index += 1;
  }
  syntaxHighlight.innerHTML = html + (source.endsWith("\n") ? " " : "");
}

function updateEditorPresentation() {
  const count = editor.value.split("\n").length;
  lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
  renderSyntaxHighlight(editor.value);
}

function setStatus(text, state = "idle") {
  const statusKeys = { "待機中": "idle", "準備中": "loading", "実行中": "running", "完了": "completed", "停止": "stopped", "エラー": "error" };
  runStatus.textContent = statusKeys[text] ? msg(statusKeys[text]) : text;
  runStatus.className = `run-status ${state}`;
  if (state === "running") {
    startInputSync();
  } else {
    stopInputSync();
  }
}

function appendOutput(text) {
  const next = String(text);
  if (!outputLog.textContent || [messages.ja.outputPlaceholder, messages.en.outputPlaceholder].includes(outputLog.textContent)) {
    outputLog.textContent = next;
  } else {
    outputLog.textContent += `${outputLog.textContent.endsWith("\n") ? "" : "\n"}${next}`;
  }
  const lines = outputLog.textContent.split("\n");
  if (lines.length > outputLineLimit) {
    outputLog.textContent = lines.slice(-outputLineLimit).join("\n");
  }
  outputLog.scrollTop = outputLog.scrollHeight;
}

function handleWorkerMessage(event) {
  const { type, status, text, state, message, extensionName, eventType, payload } = event.data || {};

  if (type === "ready") {
    engineReady = true;
    engineStarting = false;
    sendExtensionInput();
    if (!pendingRunCode) {
      setStatus("待機中", "idle");
    }
    if (latestCheckpoint && pendingRunCode === null) {
      engineWorker.postMessage({ type: "restore", state: latestCheckpoint });
    }
    if (pendingRunCode !== null) {
      const code = pendingRunCode;
      pendingRunCode = null;
      postRun(code);
    }
    return;
  }

  if (type === "output") {
    currentRunOutput.push(...String(text).split("\n"));
    appendOutput(text);
    return;
  }

  if (type === "checkpoint") {
    latestCheckpoint = state || latestCheckpoint;
    return;
  }

  if (type === "error") {
    appendOutput(message || (playgroundSettings.language === "en" ? "An error occurred while running the program." : "実行中にエラーが起きました。"));
    setStatus("エラー", "idle");
    showLessonFeedback(false, extensionLessonFeedback() || (playgroundSettings.language === "en" ? "Fix the runtime error, then try again." : "実行エラーを直してから、もう一度試してみましょう。"));
    return;
  }

  if (type === "extensionEvent") {
    dispatchExtensionEvent(extensionName, eventType, payload);
    return;
  }

  if (type === "status") {
    if (status === "loading") setStatus("準備中", "running");
    if (status === "running") setStatus("実行中", "running");
    if (status === "completed") {
      setStatus("完了", "saved");
      evaluateCurrentLesson();
    }
    if (status === "stopped") setStatus("停止", "idle");
    if (status === "error") setStatus("エラー", "idle");
  }
}

function createEngineWorker() {
  if (engineWorker || engineStarting) return;

  engineStarting = true;
  engineReady = false;
  engineWorker = new Worker("./clambon_worker.js");
  const worker = engineWorker;
  worker.addEventListener("message", (event) => {
    if (worker !== engineWorker) return;
    handleWorkerMessage(event);
  });
  worker.addEventListener("error", (event) => {
    if (worker !== engineWorker) return;
    appendOutput(`${playgroundSettings.language === "en" ? "Could not start the runtime" : "実行エンジンを起動できませんでした"}: ${event.message}`);
    setStatus("エラー", "idle");
    engineReady = false;
    engineStarting = false;
  });
  engineWorker.postMessage({ type: "init" });
}

function postRun(code) {
  setStatus("実行中", "running");
  focusGameSurface();
  sendExtensionInput();
  engineWorker.postMessage({
    type: "run",
    code,
    restoreState: latestCheckpoint,
    extensions: getWorkerExtensions()
  });
}

function runCode() {
  const code = editor.value;
  currentRunOutput = [];
  outputLog.textContent = msg("starting");
  if (!engineWorker) {
    pendingRunCode = code;
    createEngineWorker();
    return;
  }
  if (!engineReady) {
    pendingRunCode = code;
    setStatus("準備中", "running");
    return;
  }
  postRun(code);
}

function loadTutorialState() {
  const fallback = { lessonId: "output", completed: [], passed: false };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(tutorialStorageKey) || "{}") };
  } catch (_error) {
    return fallback;
  }
}

function saveTutorialState() {
  localStorage.setItem(tutorialStorageKey, JSON.stringify(tutorialState));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getCurrentLesson() {
  return localizeRecord(tutorialData.lessons.find((lesson) => lesson.id === tutorialState.lessonId) || tutorialData.lessons[0]);
}

function getMapping(id) {
  return localizeRecord(tutorialData.mappings.find((mapping) => mapping.id === id));
}

function isLessonExtensionLoaded(lesson) {
  return !lesson.requiredExtension || loadedExtensions.some((item) => item.name === lesson.requiredExtension);
}

function extensionLessonFeedback() {
  const lesson = getCurrentLesson();
  if (!lesson.requiredExtension || isLessonExtensionLoaded(lesson)) return "";
  return playgroundSettings.language === "en"
    ? `Load ${lesson.requiredExtension} before running the exercise.`
    : `先に${lesson.requiredExtension}を追加してから実行しましょう。`;
}

function blockPreview(mapping) {
  if (!mapping || !mapping.images?.length) {
    return `<div class="block-image-empty">${msg("noBlock")}</div>`;
  }
  const label = `${mapping.platform}${mapping.extensionName ? ` ${mapping.extensionName}` : ""}：${mapping.blockName}`;
  const images = mapping.images?.length ? mapping.images : [mapping.image];
  return `<div class="block-image-wrap"><div class="block-image-gallery">${images.map((imagePath, index) => `<img src="${escapeHtml(imagePath)}" alt="${escapeHtml(label)}${images.length > 1 ? ` ${index + 1}` : ""}" loading="lazy">`).join("")}</div><div class="block-image-fallback" aria-hidden="true"><span>${escapeHtml(mapping.blockName)}</span><small>${escapeHtml(mapping.platform)}</small></div></div>`;
}

function restoreTutorialPaneHome() {
  const tutorialPane = document.querySelector("#tutorialPanel");
  const homeSlot = splitWorkbench.querySelector(".tutorial-pane-slot");
  const currentSlot = tutorialPane?.closest(".pane-slot");
  if (!tutorialPane || !homeSlot || !currentSlot || currentSlot === homeSlot) return;

  const paneInHomeSlot = getPaneInSlot(homeSlot);
  if (paneInHomeSlot && paneInHomeSlot !== tutorialPane) {
    currentSlot.appendChild(paneInHomeSlot);
  }
  homeSlot.appendChild(tutorialPane);
}

function setLearningMode(enabled, persist = true) {
  if (!enabled) restoreTutorialPaneHome();
  learningModeEnabled = enabled;
  splitWorkbench.classList.toggle("learning-mode-off", !enabled);
  learningModeButton.classList.toggle("active", enabled);
  learningModeButton.setAttribute("aria-pressed", String(enabled));
  learningModeButton.title = playgroundSettings.language === "en"
    ? (enabled ? "Turn learning mode off" : "Turn learning mode on")
    : (enabled ? "学習モードをOFFにする" : "学習モードをONにする");
  if (persist) localStorage.setItem(learningModeStorageKey, String(enabled));
}

function renderLessons() {
  const lesson = getCurrentLesson();
  const mapping = getMapping(lesson.mappingId);
  const completed = new Set(tutorialState.completed);
  const currentIndex = tutorialData.lessons.findIndex((item) => item.id === lesson.id);
  lessonView.innerHTML = `
    <div class="lesson-picker" aria-label="${msg("lessons")}">
      ${tutorialData.lessons.map((rawItem, index) => { const item = localizeRecord(rawItem); return `<button type="button" class="lesson-chip ${item.id === lesson.id ? "active" : ""} ${completed.has(item.id) ? "done" : ""}" data-lesson-id="${item.id}"><span>${completed.has(item.id) ? "✓" : index + 1}</span>${escapeHtml(item.title)}</button>`; }).join("")}
    </div>
    <article class="lesson-card">
      <div class="lesson-step"><span>STEP 1</span><strong>${msg("compare")}</strong></div>
      <h3>${escapeHtml(lesson.title)}</h3>
      <div class="comparison-grid">
        <div><span class="comparison-label">Clambon</span><pre><code>${escapeHtml(lesson.sample)}</code></pre><button type="button" class="copy-code" data-copy-code="${escapeHtml(lesson.sample)}">${msg("copy")}</button></div>
        <div><span class="platform-badge platform-${escapeHtml(mapping.platform)}">${escapeHtml(mapping.platform)}</span>${blockPreview(mapping)}</div>
      </div>
      <p class="comparison-note">${escapeHtml(mapping.comparison)}</p>
      <div class="lesson-step exercise-step"><span>STEP 2</span><strong>${msg("exercise")}</strong></div>
      <p class="lesson-task">${escapeHtml(lesson.task)}</p>
      <p class="lesson-hint"><strong>${msg("hint")}</strong>${escapeHtml(lesson.hint)}</p>
      ${lesson.requiredExtension ? `<div class="lesson-extension-action"><div><strong>${escapeHtml(lesson.requiredExtension)}</strong><span>${isLessonExtensionLoaded(lesson) ? (playgroundSettings.language === "en" ? "Loaded" : "追加済み") : (playgroundSettings.language === "en" ? "Not loaded yet" : "まだ追加されていません")}</span></div><button type="button" id="addLessonExtensionButton" ${isLessonExtensionLoaded(lesson) ? "disabled" : ""}>${isLessonExtensionLoaded(lesson) ? (playgroundSettings.language === "en" ? "Added" : "追加済み") : (playgroundSettings.language === "en" ? `Add ${escapeHtml(lesson.requiredExtension)}` : `${escapeHtml(lesson.requiredExtension)}を追加`)}</button></div>` : ""}
      <div class="lesson-feedback ${tutorialState.passed ? "success" : ""}" id="lessonFeedback" role="status">${tutorialState.passed ? msg("lessonReady") : msg("lessonWaiting")}</div>
      ${tutorialState.passed ? `<button type="button" class="next-lesson" id="nextLessonButton">${currentIndex === tutorialData.lessons.length - 1 ? msg("first") : msg("next")}</button>` : ""}
    </article>
    <button type="button" class="reset-progress" id="resetTutorialButton">${msg("resetProgress")}</button>`;
  updateTutorialProgress();
}

function renderReference() {
  const categories = [...new Set(tutorialData.mappings.map((item) => localizeRecord(item).category))];
  referenceView.innerHTML = `
    <div class="reference-filters">
      <label><span>${msg("search")}</span><input id="referenceSearch" type="search" placeholder="${msg("searchPlaceholder")}"></label>
      <label><span>${msg("category")}</span><select id="referenceCategory"><option value="">${msg("all")}</option>${categories.map((category) => `<option>${escapeHtml(category)}</option>`).join("")}</select></label>
      <label><span>${msg("platform")}</span><select id="referencePlatform"><option value="">${msg("all")}</option>${tutorialData.platforms.map((platform) => `<option>${escapeHtml(playgroundSettings.language === "en" ? tutorialData.platformLabels?.[platform] || platform : platform)}</option>`).join("")}</select></label>
    </div>
    <p class="reference-count" id="referenceCount"></p>
    <div class="reference-list" id="referenceList"></div>`;
  filterReference();
}

function filterReference() {
  const search = (document.querySelector("#referenceSearch")?.value || "").toLowerCase();
  const category = document.querySelector("#referenceCategory")?.value || "";
  const platform = document.querySelector("#referencePlatform")?.value || "";
  const results = tutorialData.mappings.map(localizeRecord).filter((item) => {
    const haystack = `${item.syntax} ${item.description} ${item.blockName} ${item.extensionName}`.toLowerCase();
    return (!search || haystack.includes(search)) && (!category || item.category === category) && (!platform || item.platform === platform);
  });
  document.querySelector("#referenceCount").textContent = playgroundSettings.language === "en" ? `${results.length} mappings` : `${results.length}件の対応`;
  document.querySelector("#referenceList").innerHTML = results.map((item) => `
    <article class="reference-card">
      <div class="reference-title"><div><span class="reference-category">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.description)}</h3></div><span class="platform-badge platform-${escapeHtml(item.platform)}">${escapeHtml(item.platform)}</span></div>
      <pre><code>${escapeHtml(item.syntax)}</code></pre>
      ${item.extensionName ? `<p class="extension-name">${escapeHtml(item.extensionName)}：${escapeHtml(item.blockName)}</p>` : item.blockName ? `<p class="extension-name">${escapeHtml(item.blockName)}</p>` : ""}
      ${blockPreview(item)}
      <p>${escapeHtml(item.comparison)}</p>
      <a href="${escapeHtml(item.source)}" target="_blank" rel="noreferrer">${msg("official")}</a>
    </article>`).join("");
}

function setTutorialTab(name) {
  const lessonsActive = name === "lessons";
  lessonView.hidden = !lessonsActive;
  referenceView.hidden = lessonsActive;
  lessonTab.classList.toggle("active", lessonsActive);
  referenceTab.classList.toggle("active", !lessonsActive);
  lessonTab.setAttribute("aria-selected", String(lessonsActive));
  referenceTab.setAttribute("aria-selected", String(!lessonsActive));
}

function updateTutorialProgress() {
  const percent = Math.round((tutorialState.completed.length / tutorialData.lessons.length) * 100);
  tutorialProgress.textContent = `${percent}%`;
}

function showLessonFeedback(success, message) {
  const feedback = document.querySelector("#lessonFeedback");
  if (!feedback) return;
  feedback.className = `lesson-feedback ${success ? "success" : "error"}`;
  feedback.textContent = message;
}

function evaluateCurrentLesson() {
  if (!learningModeEnabled || lessonView.hidden) return;
  const lesson = getCurrentLesson();
  const extensionMessage = extensionLessonFeedback();
  if (extensionMessage) {
    showLessonFeedback(false, extensionMessage);
    return;
  }
  const actual = currentRunOutput.map((line) => line.trim()).filter(Boolean);
  const expectedMatches = actual.length === lesson.expected.length && lesson.expected.every((line, index) => actual[index] === line);
  const missingSyntax = lesson.required.some((pattern) => !pattern.test(editor.value));
  if (!expectedMatches) {
    showLessonFeedback(false, playgroundSettings.language === "en"
      ? `Check the output. Expected: ${lesson.expected.join(" / ")}`
      : `出力を確認しましょう。期待する出力：${lesson.expected.join(" / ")}`);
    return;
  }
  if (missingSyntax) {
    showLessonFeedback(false, playgroundSettings.language === "en"
      ? `The output is correct. Now use the syntax requested by the exercise. ${lesson.hint}`
      : `出力は合っています。課題で指定された構文も使ってみましょう。${lesson.hint}`);
    return;
  }
  if (!tutorialState.completed.includes(lesson.id)) tutorialState.completed.push(lesson.id);
  tutorialState.passed = true;
  saveTutorialState();
  renderLessons();
}

async function copyLessonCode(code, button) {
  try {
    await navigator.clipboard.writeText(code);
  } catch (_error) {
    const helper = document.createElement("textarea");
    helper.value = code;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  const original = button.textContent;
  button.textContent = msg("copied");
  window.setTimeout(() => { button.textContent = original; }, 1400);
}

function stopCode() {
  if (engineWorker) {
    engineWorker.terminate();
  }
  engineWorker = null;
  engineReady = false;
  engineStarting = false;
  pendingRunCode = null;
  pressedKeys.clear();
  keyReleaseTimers.forEach((timer) => window.clearTimeout(timer));
  keyReleaseTimers.clear();
  sendExtensionInput();
  setStatus("停止", "idle");
  appendOutput(playgroundSettings.language === "en"
    ? "Stopped. The next run can continue from the last completed instruction."
    : "停止しました。最後に完了した命令の状態から次の実行を始められます。");
}

function formatCode() {
  editor.value = editor.value
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .trimStart();
  updateEditorPresentation();
}

function setFileMenuOpen(isOpen) {
  fileMenu.classList.toggle("open", isOpen);
  fileMenuButton.setAttribute("aria-expanded", String(isOpen));
}

function setProjectFileBusy(busy) {
  projectFileBusy = busy;
  saveToPcButton.disabled = busy;
  loadFromPcButton.disabled = busy;
  fileInput.disabled = busy;
}

function safeArchiveSegment(value, fallback = "item") {
  const normalized = String(value || "").normalize("NFC").replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^\.+/, "");
  return normalized || fallback;
}

async function saveCodeToPc() {
  if (projectFileBusy) return;
  setProjectFileBusy(true);
  const projectName = document.querySelector("#projectName").value.trim() || "clambon-project";
  const safeName = projectName.replace(/[\\/:*?"<>|]+/g, "_");
  try {
    setStatus("保存中", "running");
    const entries = [];
    const extensions = [];
    for (const extension of loadedExtensions) {
      const runtime = extensionRuntimes.find((item) => item.name === extension.name);
      const stored = runtime?.projectStorage?.export ? await runtime.projectStorage.export() : null;
      const extensionRecord = { name: extension.name, manifestUrl: extension.manifestUrl };
      if (stored) {
        extensionRecord.data = stored.data ?? null;
        extensionRecord.files = [];
        const usedNames = new Set();
        for (const [index, file] of Array.from(stored.files || []).entries()) {
          if (!(file?.blob instanceof Blob)) throw new Error(`${extension.name} の保存データにBlobではないファイルがあります。`);
          const originalName = String(file.name || `file-${index + 1}`);
          const archiveName = `${String(index + 1).padStart(4, "0")}-${safeArchiveSegment(originalName, `file-${index + 1}`)}`;
          if (usedNames.has(archiveName)) throw new Error(`${extension.name} の保存ファイル名が重複しています。`);
          usedNames.add(archiveName);
          const path = `extensions/${safeArchiveSegment(extension.name, "extension")}/${archiveName}`;
          entries.push({ path, data: file.blob });
          extensionRecord.files.push({ name: originalName, path, type: file.blob.type || "application/octet-stream", size: file.blob.size });
        }
      }
      extensions.push(extensionRecord);
    }
    const project = { format: projectFormat, version: projectVersion, name: projectName, source: editor.value, extensions };
    entries.unshift({ path: "project.json", data: JSON.stringify(project, null, 2) });
    const blob = await window.ClambonProjectZip.create(entries);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}.clam`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("保存済み", "saved");
    outputLog.textContent = "プロジェクトをPCに保存しました。";
    setFileMenuOpen(false);
  } catch (error) {
    setStatus("保存エラー", "idle");
    outputLog.textContent = `プロジェクトを保存できませんでした: ${error.message || error}`;
  } finally {
    setProjectFileBusy(false);
  }
}

async function loadCodeFromPc(file) {
  if (!file || projectFileBusy) return;
  setProjectFileBusy(true);
  try {
    setStatus("読み込み中", "running");
    const entries = await window.ClambonProjectZip.read(file);
    const projectBlob = entries.get("project.json");
    if (!projectBlob) throw new Error("project.json がありません。従来形式の .clam は読み込めません。");
    let project;
    try { project = JSON.parse(await projectBlob.text()); } catch (_error) { throw new Error("project.json が壊れています。"); }
    if (project?.format !== projectFormat) throw new Error("Clambonプロジェクト形式ではありません。");
    if (project.version !== projectVersion) throw new Error(`未対応のプロジェクトバージョンです: ${project.version}`);
    if (typeof project.name !== "string" || typeof project.source !== "string" || !Array.isArray(project.extensions)) {
      throw new Error("プロジェクトの必須情報が不足しています。");
    }
    await clearLoadedExtensions();
    const warnings = [];
    for (const savedExtension of project.extensions) {
      if (!savedExtension || typeof savedExtension.manifestUrl !== "string") {
        warnings.push("URLがない拡張機能を読み飛ばしました。");
        continue;
      }
      try {
        const restoredExtension = await loadExtensionFromUrl(savedExtension.manifestUrl);
        const runtime = extensionRuntimes.find((item) => item.name === restoredExtension.name);
        if (savedExtension.files?.length && !runtime?.projectStorage?.import) {
          throw new Error("保存データの復元機能がありません。");
        }
        if (runtime?.projectStorage?.import) {
          const files = (savedExtension.files || []).map((fileInfo) => {
            if (!fileInfo || typeof fileInfo.path !== "string" || typeof fileInfo.name !== "string") throw new Error("画像情報が壊れています。");
            const blob = entries.get(window.ClambonProjectZip.safePath(fileInfo.path));
            if (!blob) throw new Error(`${fileInfo.name} がZIP内にありません。`);
            return { name: fileInfo.name, blob: blob.slice(0, blob.size, fileInfo.type || blob.type) };
          });
          await runtime.projectStorage.import({ data: savedExtension.data ?? null, files });
        }
      } catch (error) {
        warnings.push(`${savedExtension.name || savedExtension.manifestUrl}: ${error.message || error}`);
      }
    }
    document.querySelector("#projectName").value = project.name;
    editor.value = project.source;
    updateEditorPresentation();
    resetRuntimeState();
    setStatus(warnings.length ? "警告あり" : "読み込み済み", warnings.length ? "idle" : "saved");
    outputLog.textContent = warnings.length
      ? `${file.name} を読み込みました。\n復元できなかった拡張機能:\n- ${warnings.join("\n- ")}`
      : `${file.name} を読み込みました。`;
    setFileMenuOpen(false);
  } catch (error) {
    setStatus("読込エラー", "idle");
    outputLog.textContent = `プロジェクトを読み込めませんでした: ${error.message || error}`;
  } finally {
    setProjectFileBusy(false);
  }
}

function resetRuntimeState() {
  latestCheckpoint = null;
  pendingRunCode = null;
  if (engineWorker) {
    engineWorker.terminate();
  }
  engineWorker = null;
  engineReady = false;
  engineStarting = false;
  createEngineWorker();
}

function getWorkerExtensions() {
  return loadedExtensions.map((extension) => ({
    name: extension.name,
    version: extension.version,
    grammarText: extension.grammarText,
    pythonText: extension.pythonText
  }));
}

function normalizeManifestUrl(input) {
  const value = input.trim();
  if (!value) {
    throw new Error("URLを入力してね。");
  }

  const url = new URL(value, window.location.href);
  if (url.hostname === "github.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const [owner, repo, marker, branch, ...pathParts] = parts;
    if (!owner || !repo) {
      throw new Error("GitHubのリポジトリURLを確認してね。");
    }
    if (marker === "tree" && branch) {
      const path = pathParts.join("/");
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}${path ? "/" : ""}extension.json`;
    }
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/extension.json`;
  }

  if (!url.pathname.endsWith("extension.json")) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/extension.json`;
  }
  return url.href;
}

function resolvePackageUrl(manifestUrl, path) {
  return new URL(path, manifestUrl).href;
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} を読み込めませんでした。`);
  }
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function basename(path) {
  return String(path).split("/").filter(Boolean).pop() || path;
}

async function fetchAssets(manifestUrl, paths = []) {
  const assets = {};
  for (const path of paths) {
    const assetUrl = resolvePackageUrl(manifestUrl, path);
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`${path} を読み込めませんでした。`);
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    assets[path] = objectUrl;
    assets[basename(path)] = objectUrl;
  }
  return assets;
}

function getExtensionAssets(baseAssets = {}) {
  return { ...baseAssets };
}

async function loadExtensionFromUrl(input) {
  const manifestUrl = normalizeManifestUrl(input);
  setExtensionStatus("読み込み中...");
  const manifest = await fetchJson(manifestUrl);
  const name = String(manifest.name || "").trim();
  if (!name) {
    throw new Error("extension.json に name がありません。");
  }

  const grammarPath = manifest.grammar || (manifest.sourceTransform ? "" : "grammar.lark");
  const pythonPath = manifest.python || manifest.main || "main.py";
  const ui = manifest.ui || {};
  const assetPaths = manifest.assets || [];
  const syntaxHighlighting = parseExtensionSyntaxHighlighting(name, manifest.syntaxHighlighting);

  const [grammarText, pythonText, uiHtml, uiCss, uiJs, assets] = await Promise.all([
    grammarPath ? fetchText(resolvePackageUrl(manifestUrl, grammarPath)) : Promise.resolve(""),
    fetchText(resolvePackageUrl(manifestUrl, pythonPath)),
    ui.html ? fetchText(resolvePackageUrl(manifestUrl, ui.html)) : Promise.resolve(""),
    ui.css ? fetchText(resolvePackageUrl(manifestUrl, ui.css)) : Promise.resolve(""),
    ui.js ? fetchText(resolvePackageUrl(manifestUrl, ui.js)) : Promise.resolve(""),
    fetchAssets(manifestUrl, assetPaths)
  ]);

  const extension = {
    name,
    version: manifest.version || "",
    description: manifest.description || "",
    manifestUrl,
    uiConfig: manifest.ui || {},
    grammarText,
    pythonText,
    uiHtml,
    uiCss,
    uiJs,
    syntaxHighlighting,
    baseAssets: assets,
    assets: getExtensionAssets(assets)
  };

  loadedExtensions = loadedExtensions.filter((item) => item.name !== name);
  loadedExtensions.push(extension);
  rebuildSyntaxHighlighting();
  updateEditorPresentation();
  persistExtensionSources();
  await mountExtensionUi(extension);
  renderExtensionList();
  resetRuntimeState();
  syntaxHighlighting.warnings.forEach((warning) => appendOutput(warning));
  setExtensionStatus(syntaxHighlighting.warnings.length
    ? `${name} を読み込みました（色定義に警告あり）。`
    : `${name} を読み込みました。`);
  renderLessons();
  return extension;
}

function setExtensionStatus(text) {
  extensionStatusText.textContent = text;
}

function persistExtensionSources() {
  const sources = loadedExtensions.map((extension) => ({ manifestUrl: extension.manifestUrl }));
  localStorage.setItem(extensionStorageKey, JSON.stringify(sources));
}

async function restoreExtensions() {
  const saved = JSON.parse(localStorage.getItem(extensionStorageKey) || "[]");
  for (const item of saved) {
    try {
      await loadExtensionFromUrl(item.manifestUrl);
    } catch (error) {
      setExtensionStatus(error.message || "保存済み拡張機能を読み込めませんでした。");
    }
  }
  renderExtensionList();
}

function renderExtensionList() {
  extensionList.innerHTML = "";
  if (!loadedExtensions.length) {
    const empty = document.createElement("div");
    empty.className = "extension-item";
    empty.innerHTML = playgroundSettings.language === "en"
      ? "<div><strong>None added</strong><span>No extensions have been loaded yet.</span></div>"
      : "<div><strong>未追加</strong><span>拡張機能はまだ読み込まれていません。</span></div>";
    extensionList.appendChild(empty);
    return;
  }

  loadedExtensions.forEach((extension) => {
    const item = document.createElement("div");
    item.className = "extension-item";
    item.innerHTML = `
      <div>
        <strong>${extension.name}</strong>
        <span>${extension.version || (playgroundSettings.language === "en" ? "no version" : "versionなし")} ${extension.description || ""}</span>
      </div>
    `;
    const removeButton = document.createElement("button");
    removeButton.className = "extension-remove-button";
    removeButton.type = "button";
    removeButton.textContent = playgroundSettings.language === "en" ? "Remove" : "外す";
    removeButton.addEventListener("click", () => removeExtension(extension.name));
    item.appendChild(removeButton);
    extensionList.appendChild(item);
  });
}

async function removeExtension(name) {
  loadedExtensions = loadedExtensions.filter((extension) => extension.name !== name);
  rebuildSyntaxHighlighting();
  updateEditorPresentation();
  const runtime = extensionRuntimes.find((item) => item.name === name);
  await cleanupExtensionRuntime(runtime);
  extensionRuntimes = extensionRuntimes.filter((item) => item.name !== name);
  updateGamePanelVisibility();
  updateEditModes();
  persistExtensionSources();
  renderExtensionList();
  renderLessons();
  resetRuntimeState();
}

async function clearLoadedExtensions() {
  for (const runtime of extensionRuntimes) {
    await cleanupExtensionRuntime(runtime);
  }
  loadedExtensions = [];
  rebuildSyntaxHighlighting();
  updateEditorPresentation();
  extensionRuntimes = [];
  localStorage.setItem(extensionStorageKey, "[]");
  setEditMode("code");
  updateGamePanelVisibility();
  updateEditModes();
  renderExtensionList();
  renderLessons();
}

async function cleanupExtensionRuntime(runtime) {
  if (!runtime) return;
  if (runtime.projectStorage?.clear) await runtime.projectStorage.clear();

  for (const { pane, homeSlot } of runtime.panelMounts || []) {
    const currentSlot = pane.closest(".pane-slot");
    if (currentSlot && currentSlot !== homeSlot) {
      const displacedPane = Array.from(homeSlot.children).find((node) => node.classList?.contains("movable-pane") && node !== pane);
      if (displacedPane) currentSlot.appendChild(displacedPane);
    }
    pane.remove();
    homeSlot.remove();
  }

  runtime.mountedNodes?.forEach((node) => node.remove());
  if (runtime.extension?.baseAssets) {
    new Set(Object.values(runtime.extension.baseAssets)).forEach((url) => URL.revokeObjectURL(url));
  }
}

function getTemplateContent(template) {
  if (template instanceof HTMLTemplateElement) {
    return template.content.cloneNode(true);
  }
  const fragment = document.createDocumentFragment();
  Array.from(template.childNodes).forEach((node) => fragment.appendChild(node.cloneNode(true)));
  return fragment;
}

function appendOwnedFragment(parent, fragment, extensionName, extraClass = "") {
  const wrapper = document.createElement("div");
  wrapper.dataset.extensionOwner = extensionName;
  if (extraClass) {
    wrapper.className = extraClass;
  }
  wrapper.appendChild(fragment);
  parent.appendChild(wrapper);
  return wrapper;
}

function createScopedRoot(roots) {
  return {
    querySelector(selector) {
      for (const root of roots) {
        const found = root.querySelector(selector);
        if (found) return found;
      }
      return null;
    },
    querySelectorAll(selector) {
      return roots.flatMap((root) => Array.from(root.querySelectorAll(selector)));
    }
  };
}

function createExtensionPanel(extension, template, mountedNodes, scopedRoots, panelMounts) {
  const panelId = template.dataset.extensionPanel || "extension";
  const slot = document.createElement("div");
  slot.className = `pane-slot extension-pane-slot ${panelId}-pane-slot`;
  slot.dataset.slot = panelId;
  slot.dataset.extensionOwner = extension.name;

  const pane = document.createElement("section");
  pane.className = "extension-panel movable-pane";
  pane.dataset.pane = panelId;
  pane.dataset.extensionOwner = extension.name;
  pane.setAttribute("aria-label", template.dataset.panelLabel || template.dataset.panelTitle || panelId);

  const header = document.createElement("div");
  header.className = "extension-panel-header pane-drag-handle";
  header.title = "ドラッグで移動";
  header.innerHTML = `
    <div>
      <p class="eyebrow">${template.dataset.panelKicker || "Extension"}</p>
      <h2>${template.dataset.panelTitle || panelId}</h2>
    </div>
  `;

  const view = document.createElement("div");
  view.className = "extension-panel-view";
  view.appendChild(getTemplateContent(template));

  pane.append(header, view);
  slot.appendChild(pane);

  const outputSlot = outputPanel.closest(".pane-slot");
  splitWorkbench.insertBefore(slot, outputSlot);
  header.addEventListener("pointerdown", startPaneDrag);
  mountedNodes.push(slot);
  scopedRoots.push(view);
  panelMounts.push({ pane, homeSlot: slot });
}

async function mountExtensionUi(extension) {
  const previousRuntime = extensionRuntimes.find((runtime) => runtime.name === extension.name);
  await cleanupExtensionRuntime(previousRuntime);
  extensionRuntimes = extensionRuntimes.filter((runtime) => runtime.name !== extension.name);
  document.querySelectorAll(`[data-extension-owner="${extension.name}"]`).forEach((node) => node.remove());

  if (!extension.uiHtml && !extension.uiCss && !extension.uiJs) {
    return;
  }

  const source = document.createElement("div");
  source.innerHTML = extension.uiHtml || "";
  const mountedNodes = [];
  const scopedRoots = [];
  const panelMounts = [];

  if (extension.uiCss) {
    const style = document.createElement("style");
    style.dataset.extensionOwner = extension.name;
    style.textContent = extension.uiCss;
    document.head.appendChild(style);
    mountedNodes.push(style);
  }

  source.querySelectorAll("template[data-extension-topbar], [data-extension-topbar]:not(template)").forEach((template) => {
    const wrapper = appendOwnedFragment(
      extensionTopbarMount,
      getTemplateContent(template),
      extension.name,
      "extension-topbar-content"
    );
    mountedNodes.push(wrapper);
    scopedRoots.push(wrapper);
  });

  source.querySelectorAll("template[data-extension-mode], [data-extension-mode]:not(template)").forEach((template) => {
    const mode = template.dataset.extensionMode;
    const wrapper = appendOwnedFragment(
      extensionModeMount,
      getTemplateContent(template),
      extension.name,
      "extension-mode-content"
    );
    wrapper.dataset.extensionModeContent = mode;
    wrapper.hidden = currentEditMode !== mode;
    mountedNodes.push(wrapper);
    scopedRoots.push(wrapper);
  });

  source.querySelectorAll("template[data-extension-panel], [data-extension-panel]:not(template)").forEach((template) => {
    createExtensionPanel(extension, template, mountedNodes, scopedRoots, panelMounts);
  });

  const runtime = {
    name: extension.name,
    extension,
    handleEvent: null,
    projectStorage: null,
    legacyCostumes: new Map(),
    panelMounts,
    mountedNodes
  };

  function getLegacyCostumes() {
    return Array.from(runtime.legacyCostumes, ([name, costume]) => ({ name, url: costume.url }));
  }

  function syncLegacyCostumes() {
    runtime.legacyCostumes.forEach((costume, name) => { extension.assets[name] = costume.url; });
    if (typeof runtime.handleEvent === "function") {
      runtime.handleEvent("assets", { assets: extension.assets });
      runtime.handleEvent("costumes", { costumes: getLegacyCostumes() });
    }
  }

  function clearLegacyCostumes() {
    runtime.legacyCostumes.forEach((costume, name) => {
      URL.revokeObjectURL(costume.url);
      if (extension.baseAssets?.[name]) extension.assets[name] = extension.baseAssets[name];
      else delete extension.assets[name];
    });
    runtime.legacyCostumes.clear();
    syncLegacyCostumes();
  }

  function ensureLegacyProjectStorage() {
    if (runtime.projectStorage) return;
    runtime.projectStorage = {
      async export() {
        return {
          data: { kind: "legacy-costumes", version: 1 },
          files: Array.from(runtime.legacyCostumes, ([name, costume]) => ({ name, blob: costume.blob }))
        };
      },
      async import(payload) {
        clearLegacyCostumes();
        try {
          for (const file of payload?.files || []) {
            if (!file?.name || runtime.legacyCostumes.has(file.name)) throw new Error("保存画像の名前がないか重複しています。");
            if (!(file.blob instanceof Blob) || !file.blob.type.startsWith("image/")) throw new Error(`${file.name} は画像ではありません。`);
            runtime.legacyCostumes.set(file.name, { blob: file.blob, url: URL.createObjectURL(file.blob) });
          }
          syncLegacyCostumes();
        } catch (error) {
          clearLegacyCostumes();
          throw error;
        }
      },
      async clear() { clearLegacyCostumes(); }
    };
  }

  const api = {
    onEvent(handler) {
      runtime.handleEvent = handler;
    },
    getPressedKeys() {
      return Array.from(pressedKeys);
    },
    getCostumes() {
      ensureLegacyProjectStorage();
      return getLegacyCostumes();
    },
    addCostumes(files) {
      ensureLegacyProjectStorage();
      const pending = [];
      const errors = [];
      for (const file of Array.from(files || [])) {
        if (!(file instanceof Blob) || !String(file.type).startsWith("image/")) continue;
        if (runtime.legacyCostumes.has(file.name) || pending.some((item) => item.name === file.name)) {
          errors.push(`${file.name} はすでに追加されています。同じ名前の画像は追加できません。`);
          continue;
        }
        pending.push({ name: file.name, blob: file });
      }
      pending.forEach(({ name, blob }) => runtime.legacyCostumes.set(name, { blob, url: URL.createObjectURL(blob) }));
      errors.forEach((message) => appendOutput(message));
      if (errors.length) setStatus("エラー", "idle");
      syncLegacyCostumes();
      return { added: pending.map((item) => item.name), errors, costumes: getLegacyCostumes() };
    },
    removeCostume(name) {
      ensureLegacyProjectStorage();
      const costume = runtime.legacyCostumes.get(name);
      if (costume) URL.revokeObjectURL(costume.url);
      runtime.legacyCostumes.delete(name);
      if (extension.baseAssets?.[name]) extension.assets[name] = extension.baseAssets[name];
      else delete extension.assets[name];
      syncLegacyCostumes();
    },
    registerProjectStorage(handlers) {
      if (!handlers || typeof handlers !== "object") throw new Error("プロジェクト保存ハンドラが不正です。");
      runtime.projectStorage = handlers;
    },
    copyCostumeReference(name) {
      return copyCostumeReference(name);
    },
    setEditMode(mode) {
      setEditMode(mode);
    }
  };

  if (extension.uiJs) {
    const startExtension = new Function("root", "api", "extension", extension.uiJs);
    startExtension(createScopedRoot(scopedRoots), api, extension);
  }
  extensionRuntimes.push(runtime);
  updateGamePanelVisibility();
  updateEditModes();
}

function updateGamePanelVisibility() {
  const wantsGamePanel = loadedExtensions.some((extension) => {
    const panels = extension.uiConfig?.panels || [];
    return panels.some((panel) => panel.id === "game" || panel.type === "game");
  });
  const hasPanel = Boolean(splitWorkbench.querySelector(".extension-pane-slot"));
  splitWorkbench.classList.toggle("has-game-panel", wantsGamePanel && hasPanel);
}

function updateEditModes() {
  const modes = loadedExtensions.flatMap((extension) => extension.uiConfig?.modes || []);
  const hasExtensionModes = modes.length > 0 && extensionModeMount.children.length > 0;
  extensionTopbarMount.hidden = !hasExtensionModes;
  if (!hasExtensionModes) {
    setEditMode("code");
  } else {
    setEditMode(currentEditMode);
  }
}

function setEditMode(mode) {
  currentEditMode = mode;
  const isCode = mode === "code";
  extensionModeMount.hidden = isCode || !extensionModeMount.children.length;
  workspace.classList.toggle("mode-screen-active", !isCode);
  extensionModeMount.querySelectorAll("[data-extension-mode-content]").forEach((content) => {
    content.hidden = content.dataset.extensionModeContent !== mode;
  });
  extensionRuntimes.forEach((runtime) => {
    if (typeof runtime.handleEvent === "function") {
      runtime.handleEvent("mode", { mode });
    }
  });
}

async function copyCostumeReference(name) {
  await navigator.clipboard?.writeText(`"${name}"`);
  setStatus("コピー済み", "saved");
}

function dispatchExtensionEvent(extensionName, eventType, payload) {
  extensionRuntimes
    .filter((runtime) => runtime.name === extensionName && typeof runtime.handleEvent === "function")
    .forEach((runtime) => runtime.handleEvent(eventType, payload));
}

function setExtensionModalOpen(isOpen) {
  extensionModal.hidden = !isOpen;
  if (isOpen) {
    extensionUrlInput.focus();
  }
}

function setSettingsModalOpen(isOpen) {
  if (isOpen) settingsReturnFocus = document.activeElement;
  settingsModal.hidden = !isOpen;
  settingsButton.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) settingsLanguage.focus();
  else if (settingsReturnFocus instanceof HTMLElement && document.contains(settingsReturnFocus)) settingsReturnFocus.focus();
}

function localizeRecord(record) {
  return playgroundSettings.language === "en" && record?.en ? { ...record, ...record.en } : record;
}

function applyStaticLanguage() {
  document.documentElement.lang = playgroundSettings.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = msg(node.dataset.i18n); });
  settingsButton.title = msg("settingsButton");
  settingsButton.setAttribute("aria-label", msg("settingsButton"));
  settingsCloseButton.title = msg("close");
  settingsCloseButton.setAttribute("aria-label", msg("close"));
  const text = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
  text(".project-name span", playgroundSettings.language === "en" ? "Project" : "プロジェクト");
  text("#formatButton", playgroundSettings.language === "en" ? "Format" : "整える");
  text("#learningModeButton", playgroundSettings.language === "en" ? "📖 Learn" : "📖 学習");
  text("#fileMenuButton span", playgroundSettings.language === "en" ? "File" : "ファイル");
  text("#saveToPcButton", playgroundSettings.language === "en" ? "Save to computer" : "PCに保存する");
  text("#loadFromPcButton", playgroundSettings.language === "en" ? "Load from computer" : "PCから読み込む");
  text(".editor-panel h2", playgroundSettings.language === "en" ? "Code" : "コード");
  text(".output-panel h2", playgroundSettings.language === "en" ? "Output" : "出力");
  text(".tutorial-panel h2", playgroundSettings.language === "en" ? "Learning palette" : "学習パレット");
  text("#lessonTab", msg("lessons")); text("#referenceTab", msg("reference"));
  text("#extensionModalTitle", playgroundSettings.language === "en" ? "Add extension" : "拡張機能を追加");
  text(".extension-form label span", playgroundSettings.language === "en" ? "GitHub or manifest URL" : "GitHub または manifest URL");
  text("#extensionLoadButton", playgroundSettings.language === "en" ? "Load" : "読み込む");
  extensionButton.title = playgroundSettings.language === "en" ? "Add extension" : "拡張機能を追加";
  runButton.title = playgroundSettings.language === "en" ? "Run" : "実行";
  stopButton.title = playgroundSettings.language === "en" ? "Stop" : "停止";
  const statusKey = runStatus.classList.contains("running") ? "running"
    : runStatus.classList.contains("saved") ? "completed"
    : ["停止", "Stopped"].includes(runStatus.textContent) ? "stopped"
    : ["エラー", "Error"].includes(runStatus.textContent) ? "error" : "idle";
  runStatus.textContent = msg(statusKey);
  if ([messages.ja.outputPlaceholder, messages.en.outputPlaceholder].includes(outputLog.textContent)) outputLog.textContent = msg("outputPlaceholder");
  if (["extension.json を持つ公開拡張機能を読み込めます。", "Load a public extension that contains extension.json."].includes(extensionStatusText.textContent)) {
    extensionStatusText.textContent = playgroundSettings.language === "en" ? "Load a public extension that contains extension.json." : "extension.json を持つ公開拡張機能を読み込めます。";
  }
  setLearningMode(learningModeEnabled, false);
}

function applySettings({ persist = true } = {}) {
  const referenceState = {
    search: document.querySelector("#referenceSearch")?.value || "",
    category: document.querySelector("#referenceCategory")?.value || "",
    platform: document.querySelector("#referencePlatform")?.value || ""
  };
  const categoryRecord = tutorialData.mappings.find((item) => item.category === referenceState.category || item.en?.category === referenceState.category);
  const platformRecord = tutorialData.mappings.find((item) => item.platform === referenceState.platform || item.en?.platform === referenceState.platform);
  const resolvedTheme = playgroundSettings.theme === "system" ? (systemTheme.matches ? "dark" : "light") : playgroundSettings.theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.setProperty("--editor-font-size", `${playgroundSettings.fontSize}px`);
  settingsLanguage.value = playgroundSettings.language;
  settingsTheme.value = playgroundSettings.theme;
  settingsFontSize.value = String(playgroundSettings.fontSize);
  settingsTabSize.value = String(playgroundSettings.tabSize);
  applyStaticLanguage();
  renderLessons();
  renderReference();
  const searchInput = document.querySelector("#referenceSearch");
  const categorySelect = document.querySelector("#referenceCategory");
  const platformSelect = document.querySelector("#referencePlatform");
  if (searchInput) searchInput.value = referenceState.search;
  if (categorySelect && categoryRecord) categorySelect.value = localizeRecord(categoryRecord).category;
  if (platformSelect && platformRecord) platformSelect.value = localizeRecord(platformRecord).platform;
  filterReference();
  renderExtensionList();
  if (persist) localStorage.setItem(settingsStorageKey, JSON.stringify(playgroundSettings));
}

function updateSetting(key, value) {
  const normalized = key === "fontSize" || key === "tabSize" ? Number(value) : value;
  if (!settingsOptions[key].has(normalized)) return;
  playgroundSettings = { ...playgroundSettings, [key]: normalized };
  applySettings();
}

function handleEditorIndent(event) {
  if (event.key !== "Tab") return;
  event.preventDefault();
  const value = editor.value;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selectionEndsAtLineStart = end > start && value[end - 1] === "\n";
  const blockEnd = selectionEndsAtLineStart ? end - 1 : end;
  const lineEndIndex = value.indexOf("\n", blockEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const selectedBlock = value.slice(lineStart, lineEnd);
  const indent = " ".repeat(playgroundSettings.tabSize);

  if (start === end && !event.shiftKey) {
    editor.setRangeText(indent, start, end, "end");
  } else {
    const lines = selectedBlock.split("\n");
    let removedBeforeStart = 0;
    let totalDelta = 0;
    const changed = lines.map((line, index) => {
      if (!event.shiftKey) { totalDelta += indent.length; return indent + line; }
      const remove = Math.min((line.match(/^ */)?.[0].length || 0), playgroundSettings.tabSize);
      if (index === 0) removedBeforeStart = Math.min(remove, start - lineStart);
      totalDelta -= remove;
      return line.slice(remove);
    }).join("\n");
    editor.setRangeText(changed, lineStart, lineEnd, "preserve");
    const nextStart = event.shiftKey ? Math.max(lineStart, start - removedBeforeStart) : start + indent.length;
    const nextEnd = Math.max(nextStart, end + totalDelta);
    editor.setSelectionRange(nextStart, nextEnd);
  }
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function sendExtensionInput() {
  if (!engineWorker) return;
  engineWorker.postMessage({
    type: "extensionInput",
    input: {
      pressedKeys: Array.from(pressedKeys)
    }
  });
}

function startInputSync() {
  if (inputSyncTimer) return;
  inputSyncTimer = window.setInterval(sendExtensionInput, 33);
}

function stopInputSync() {
  if (!inputSyncTimer) return;
  window.clearInterval(inputSyncTimer);
  inputSyncTimer = null;
}

function focusGameSurface() {
  const surface = splitWorkbench.querySelector(".extension-pane-slot canvas, .extension-pane-slot [tabindex]");
  surface?.focus?.({ preventScroll: true });
}

function normalizeKeyName(eventKey) {
  const keyMap = {
    ArrowRight: "right arrow",
    ArrowLeft: "left arrow",
    ArrowUp: "up arrow",
    ArrowDown: "down arrow",
    " ": "space",
    Enter: "enter",
    Shift: "shift"
  };
  return keyMap[eventKey] || String(eventKey).toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTargetSlot(clientX, clientY) {
  const slots = Array.from(splitWorkbench.querySelectorAll(".pane-slot"));
  return slots.find((slot) => {
    const rect = slot.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  });
}

function markTargetSlot(targetSlot) {
  splitWorkbench.querySelectorAll(".pane-slot").forEach((slot) => {
    slot.classList.toggle("drop-target", slot === targetSlot);
  });
}

function getOtherSlot(originSlot) {
  return Array.from(splitWorkbench.querySelectorAll(".pane-slot")).find((slot) => slot !== originSlot);
}

function getPaneInSlot(slot) {
  return slot?.querySelector(".movable-pane") || null;
}

function getPaneOffset(fromSlot, toSlot) {
  const fromRect = fromSlot.getBoundingClientRect();
  const toRect = toSlot.getBoundingClientRect();
  return {
    x: toRect.left - fromRect.left,
    y: toRect.top - fromRect.top
  };
}

function setSiblingDestination(hitSlot) {
  const { originSlot } = paneDragState;
  if (!hitSlot) {
    paneDragState.hitSlot = null;
    paneDragState.siblingPane = null;
    paneDragState.siblingHomeSlot = null;
    paneDragState.siblingDestination = null;
    paneDragState.targetSlot = originSlot;
    markTargetSlot(null);
    return;
  }

  const siblingPane = hitSlot === originSlot ? null : getPaneInSlot(hitSlot);
  if (paneDragState.siblingPane && paneDragState.siblingPane !== siblingPane) {
    paneDragState.siblingPane.classList.remove("shifting");
    paneDragState.siblingPane.style.transform = "";
  }
  if (siblingPane) {
    siblingPane.classList.add("shifting");
  }

  paneDragState.hitSlot = hitSlot;
  paneDragState.siblingPane = siblingPane;
  paneDragState.siblingHomeSlot = siblingPane ? hitSlot : null;
  paneDragState.siblingDestination = siblingPane ? originSlot : null;
  paneDragState.siblingX = 0;
  paneDragState.siblingY = 0;
  paneDragState.targetSlot = hitSlot;
  markTargetSlot(hitSlot);
}

function animateSiblingPane() {
  if (!paneDragState) return;

  const { siblingPane, siblingHomeSlot, siblingDestination } = paneDragState;
  if (siblingPane && siblingDestination) {
    const target = getPaneOffset(siblingHomeSlot, siblingDestination);
    const dx = target.x - paneDragState.siblingX;
    const dy = target.y - paneDragState.siblingY;
    const distance = Math.hypot(dx, dy);
    const speed = clamp(distance / 180, 0.08, 0.34);

    paneDragState.siblingX += dx * speed;
    paneDragState.siblingY += dy * speed;
    siblingPane.style.transform = `translate(${paneDragState.siblingX}px, ${paneDragState.siblingY}px)`;
  }

  paneDragState.animationFrame = requestAnimationFrame(animateSiblingPane);
}

function startPaneDrag(event) {
  if (event.target.closest("button, input, textarea")) return;

  const pane = event.currentTarget.closest(".movable-pane");
  const originSlot = pane.parentElement;
  const rect = pane.getBoundingClientRect();
  const workbenchRect = splitWorkbench.getBoundingClientRect();

  paneDragState = {
    pane,
    originSlot,
    otherSlot: null,
    siblingPane: null,
    siblingHomeSlot: null,
    siblingDestination: null,
    siblingX: 0,
    siblingY: 0,
    animationFrame: null,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    minX: workbenchRect.left,
    maxX: workbenchRect.right - rect.width,
    minY: workbenchRect.top,
    maxY: workbenchRect.bottom - rect.height,
    targetSlot: originSlot
  };

  pane.style.width = `${rect.width}px`;
  pane.style.height = `${rect.height}px`;
  pane.style.left = `${rect.left}px`;
  pane.style.top = `${rect.top}px`;
  pane.classList.add("dragging");
  workspace.classList.add("dragging-pane");
  markTargetSlot(originSlot);
  setSiblingDestination(originSlot);
  animateSiblingPane();

  if (event.pointerId !== undefined && event.currentTarget.setPointerCapture) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
}

function movePaneDrag(event) {
  if (!paneDragState) return;

  const nextLeft = clamp(event.clientX - paneDragState.offsetX, paneDragState.minX, paneDragState.maxX);
  const nextTop = clamp(event.clientY - paneDragState.offsetY, paneDragState.minY, paneDragState.maxY);
  paneDragState.pane.style.left = `${nextLeft}px`;
  paneDragState.pane.style.top = `${nextTop}px`;

  setSiblingDestination(getTargetSlot(event.clientX, event.clientY));
}

function resetDraggedPane(pane) {
  pane.classList.remove("dragging");
  pane.style.width = "";
  pane.style.height = "";
  pane.style.left = "";
  pane.style.top = "";
}

function endPaneDrag() {
  if (!paneDragState) return;

  const { pane, originSlot, siblingPane, animationFrame } = paneDragState;
  const targetSlot = paneDragState.targetSlot || originSlot;

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  if (siblingPane) {
    siblingPane.classList.remove("shifting");
    siblingPane.style.transform = "";
  }

  if (targetSlot !== originSlot) {
    const targetPane = getPaneInSlot(targetSlot);
    if (targetPane) {
      originSlot.appendChild(targetPane);
    }
    targetSlot.appendChild(pane);
  } else {
    originSlot.appendChild(pane);
  }

  resetDraggedPane(pane);
  splitWorkbench.querySelectorAll(".pane-slot").forEach((slot) => slot.classList.remove("drop-target"));
  workspace.classList.remove("dragging-pane");
  paneDragState = null;
}

editor.value = exampleCode;
rebuildSyntaxHighlighting();
updateEditorPresentation();
setLearningMode(learningModeEnabled, false);
applySettings({ persist: false });
createEngineWorker();
restoreExtensions();


editor.addEventListener("input", updateEditorPresentation);
editor.addEventListener("keydown", handleEditorIndent);
editor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = editor.scrollTop;
  syntaxHighlight.scrollTop = editor.scrollTop;
  syntaxHighlight.scrollLeft = editor.scrollLeft;
});

runButton.addEventListener("click", runCode);
stopButton.addEventListener("click", stopCode);
homeLink.addEventListener("click", (event) => {
  const shouldLeave = window.confirm(playgroundSettings.language === "en"
    ? "Return to the home page without saving your code?"
    : "コードを保存せずにトップへ戻ってもよいですか？");
  if (!shouldLeave) {
    event.preventDefault();
    return;
  }
  stopCode();
});
fileMenuButton.addEventListener("click", () => {
  setFileMenuOpen(!fileMenu.classList.contains("open"));
});
saveToPcButton.addEventListener("click", saveCodeToPc);
loadFromPcButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  loadCodeFromPc(fileInput.files[0]);
  fileInput.value = "";
});
formatButton.addEventListener("click", formatCode);
extensionButton.addEventListener("click", () => setExtensionModalOpen(true));
settingsButton.addEventListener("click", () => setSettingsModalOpen(true));
settingsCloseButton.addEventListener("click", () => setSettingsModalOpen(false));
settingsModal.addEventListener("click", (event) => { if (event.target === settingsModal) setSettingsModalOpen(false); });
settingsLanguage.addEventListener("change", () => updateSetting("language", settingsLanguage.value));
settingsTheme.addEventListener("change", () => updateSetting("theme", settingsTheme.value));
settingsFontSize.addEventListener("change", () => updateSetting("fontSize", settingsFontSize.value));
settingsTabSize.addEventListener("change", () => updateSetting("tabSize", settingsTabSize.value));
settingsResetButton.addEventListener("click", () => { playgroundSettings = { ...defaultSettings }; applySettings(); });
systemTheme.addEventListener("change", () => { if (playgroundSettings.theme === "system") applySettings({ persist: false }); });
learningModeButton.addEventListener("click", () => setLearningMode(!learningModeEnabled));
extensionCloseButton.addEventListener("click", () => setExtensionModalOpen(false));
extensionModal.addEventListener("click", (event) => {
  if (event.target === extensionModal) {
    setExtensionModalOpen(false);
  }
});
extensionLoadButton.addEventListener("click", async () => {
  try {
    await loadExtensionFromUrl(extensionUrlInput.value);
  } catch (error) {
    setExtensionStatus(error.message || "拡張機能を読み込めませんでした。");
  }
});
extensionUrlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    extensionLoadButton.click();
  }
});
lessonTab.addEventListener("click", () => setTutorialTab("lessons"));
referenceTab.addEventListener("click", () => setTutorialTab("reference"));
lessonView.addEventListener("click", (event) => {
  const lessonButton = event.target.closest("[data-lesson-id]");
  if (lessonButton) {
    tutorialState.lessonId = lessonButton.dataset.lessonId;
    tutorialState.passed = tutorialState.completed.includes(tutorialState.lessonId);
    saveTutorialState();
    renderLessons();
    return;
  }
  const copyButton = event.target.closest("[data-copy-code]");
  if (copyButton) {
    copyLessonCode(copyButton.dataset.copyCode, copyButton);
    return;
  }
  if (event.target.closest("#addLessonExtensionButton")) {
    const lesson = getCurrentLesson();
    extensionUrlInput.value = lesson.extensionUrl || "";
    setExtensionModalOpen(true);
    return;
  }
  if (event.target.closest("#nextLessonButton")) {
    const currentIndex = tutorialData.lessons.indexOf(getCurrentLesson());
    tutorialState.lessonId = tutorialData.lessons[(currentIndex + 1) % tutorialData.lessons.length].id;
    tutorialState.passed = tutorialState.completed.includes(tutorialState.lessonId);
    saveTutorialState();
    renderLessons();
    return;
  }
  if (event.target.closest("#resetTutorialButton")) {
    tutorialState = { lessonId: "output", completed: [], passed: false };
    saveTutorialState();
    renderLessons();
  }
});
referenceView.addEventListener("input", filterReference);
referenceView.addEventListener("change", filterReference);
document.addEventListener("error", (event) => {
  if (event.target.matches?.(".block-image-wrap img")) {
    event.target.hidden = true;
    event.target.closest(".block-image-wrap")?.classList.add("missing-image");
  }
}, true);
document.addEventListener("click", (event) => {
  if (!fileMenu.contains(event.target)) {
    setFileMenuOpen(false);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && !settingsModal.hidden) {
    const focusable = Array.from(settingsModal.querySelectorAll("button, select, input, [href], [tabindex]:not([tabindex='-1'])")).filter((node) => !node.disabled && !node.hidden);
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    return;
  }
  if (event.key === "Escape") {
    setFileMenuOpen(false);
    setExtensionModalOpen(false);
    setSettingsModalOpen(false);
    return;
  }
  const keyName = normalizeKeyName(event.key);
  const releaseTimer = keyReleaseTimers.get(keyName);
  if (releaseTimer) {
    window.clearTimeout(releaseTimer);
    keyReleaseTimers.delete(keyName);
  }
  pressedKeys.add(keyName);
  if (runStatus.classList.contains("running") && ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
    event.preventDefault();
  }
  sendExtensionInput();
});
document.addEventListener("keyup", (event) => {
  const keyName = normalizeKeyName(event.key);
  const releaseTimer = keyReleaseTimers.get(keyName);
  if (releaseTimer) {
    window.clearTimeout(releaseTimer);
  }
  keyReleaseTimers.set(
    keyName,
    window.setTimeout(() => {
      pressedKeys.delete(keyName);
      keyReleaseTimers.delete(keyName);
      sendExtensionInput();
    }, 120)
  );
  sendExtensionInput();
});
document.querySelectorAll(".pane-drag-handle").forEach((handle) => {
  handle.addEventListener("pointerdown", startPaneDrag);
});
window.addEventListener("pointermove", movePaneDrag);
window.addEventListener("pointerup", endPaneDrag);
window.addEventListener("pointercancel", endPaneDrag);
