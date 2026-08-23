const siteMenu = document.querySelector("#siteMenu");
const siteMenuButton = document.querySelector("#siteMenuButton");
const siteMenuPanel = document.querySelector("#siteMenuPanel");
const siteLanguageButton = document.querySelector("#siteLanguageButton");
const siteLanguagePicker = document.querySelector("#siteLanguagePicker");
const siteLanguageMenu = document.querySelector("#siteLanguageMenu");
const settingsStorageKey = "clambon.web.settings.v1";

function loadSiteSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsStorageKey) || "{}");
    return { ...saved, language: saved.language === "en" ? "en" : "ja" };
  } catch (_error) {
    return { language: "ja" };
  }
}

let siteSettings = loadSiteSettings();

const commonTranslations = [
  ["#siteMenuPanel a:nth-of-type(1)", "トップ", "Home"],
  ["#siteMenuPanel a:nth-of-type(2)", "ドキュメント", "Documentation"]
];

const homeTranslations = [
  [".home-message", "Scratchのブロックを、<em>そのままコードへ置き換えるだけ。</em>", "Turn Scratch blocks <em>directly into code.</em>", "html"],
  ["#homeTitle", "Clambon Playgroundへようこそ", "Welcome to Clambon Playground"],
  [".home-lead", "Scratchで知っているブロックを、そのままコードにしてみよう。Clambonなら、<strong>はじめての文字のプログラミング</strong>も安心です。", "Turn the Scratch blocks you know into code. With Clambon, your <strong>first steps in text programming</strong> can feel safe and familiar.", "html"],
  [".home-actions .home-primary-button", "学習モードではじめる <span aria-hidden=\"true\">→</span>", "Start learning <span aria-hidden=\"true\">→</span>", "html"],
  [".home-actions .home-text-link", "ドキュメントを読む", "Read the documentation"],
  ["#bridgeFeatureTitle", "Scratchからテキスト言語へ渡るための、<em>中間言語。</em>", "An <em>intermediate language</em> bridging Scratch and text-based programming.", "html"],
  [".bridge-feature-copy > p:last-child", "Scratchに近いことばや形のまま、キーボードでコードを書いて、すぐに動かせます。<strong class=\"bridge-reassurance\">遊びながら、自然にプログラミングの力が身につきます。</strong>", "Use familiar Scratch-like words and shapes, type your code, and run it right away.<strong class=\"bridge-reassurance\">Build real programming skills naturally while you play.</strong>", "html"],
  [".bridge-steps li:nth-child(1) strong", "Scratchで考える", "Think with Scratch"],
  [".bridge-steps li:nth-child(1) p", "いつものブロックの考え方からスタート。", "Start with the blocks you already know."],
  [".bridge-steps li:nth-child(2) strong", "Clambonで書いてみる", "Try writing with Clambon"],
  [".bridge-steps li:nth-child(2) p", "近いことばを使って、コードを動かしてみよう。", "Use familiar words and make your code run."],
  [".bridge-steps li:nth-child(3) strong", "次の言語へステップアップ", "Step up to your next language"],
  [".bridge-steps li:nth-child(3) p", "読む・書く・直す力が、少しずつ身につきます。", "Build your reading, writing, and fixing skills one step at a time."],
  ["#scratchFeatureTitle", "ScratchをそのままClambonへ。", "Bring Scratch directly into Clambon."],
  [".scratch-feature > p", "むずかしいルールを、はじめから覚えなくても大丈夫。Scratchのブロックを見ながら、同じ意味のコードを書けます。", "You do not need to learn lots of difficult rules first. Look at a Scratch block and write code with the same meaning."],
  [".pair-connector strong", "書きうつすだけでOK！", "Just copy it into code!"],
  [".clambon-code code", "もし <score == 85> {\n\n}", "if <score == 85> {\n\n}"],
  ["#featuresTitle", "Clambonでできること", "What you can do with Clambon"],
  [".home-info-card:nth-child(1) h3", "ブロックと同じ", "Matches your blocks"],
  [".home-info-card:nth-child(1) p", "Scratchを見ながら、そのままコードにできます。", "Look at Scratch and turn it straight into code."],
  [".home-info-card:nth-child(2) h3", "すぐ動く", "Runs right away"],
  [".home-info-card:nth-child(2) p", "書いたらボタンを押すだけ。結果もすぐ見られます。", "Write it, press a button, and see the result."],
  [".home-info-card:nth-child(3) h3", "もっと作れる", "Create even more"],
  [".home-info-card:nth-child(3) p", "ゲームや日本語など、できることを増やせます。", "Add games, Japanese code, and more."],
  ["#quickDocsTitle", "Playgroundの使い方", "How to use Playground"],
  [".home-docs .home-section-heading > p:last-child", "最初のプログラムは、たった3ステップ。間違えても何度でも試せます。", "Your first program takes only three steps. You can edit and try again as often as you like."],
  [".home-steps li:nth-child(1) > span", "ステップ1", "Step 1"], [".home-steps li:nth-child(2) > span", "ステップ2", "Step 2"], [".home-steps li:nth-child(3) > span", "ステップ3", "Step 3"],
  [".home-steps li:nth-child(1) h3", "コードを書く", "Write code"], [".home-steps li:nth-child(1) p", "左のらんに、コードを書いてみよう。", "Try writing code in the box on the left."],
  [".home-steps li:nth-child(2) h3", "動かす", "Run it"], [".home-steps li:nth-child(2) p", "右上の ▶ ボタンを押してみよう。", "Press the ▶ button in the upper-right."],
  [".home-steps li:nth-child(3) h3", "結果を見る", "See what happens"], [".home-steps li:nth-child(3) p", "うまくいかなくても大丈夫。直して何度でもためせます。", "It is okay if it does not work yet. Fix it and try as many times as you like."],
  [".home-code-sample p", "より詳しい文法やScratch対応表は、ドキュメントで確認できます。", "See the documentation for more syntax and the complete Scratch mapping."],
  [".home-code-sample a", "詳しいドキュメントへ →", "Open the full documentation →"],
  ["#extensionsTitle", "公式拡張機能", "Official extensions"],
  [".home-extensions .home-section-heading > p:last-child", "やりたいことに合わせてClambonを育てよう。", "Grow Clambon to match what you want to create."],
  [".home-extension-card:nth-child(1) .extension-reading", "クラゲ", "Kurage"], [".home-extension-card:nth-child(2) .extension-reading", "ジャパクラ", "Japakura"], [".home-extension-card:nth-child(3) .extension-reading", "カタクラ", "Katakura"],
  [".home-extension-card:nth-child(1) > p", "キャラクターを動かして、遊べるゲームを作れます。", "Move characters and build games you can play."],
  [".home-extension-card:nth-child(2) > p", "Clambonのコードを、日本語で書けます。", "Write Clambon code in Japanese."],
  [".home-extension-card:nth-child(3) > p", "Clambonのコードを、カタカナで書けます。", "Write Clambon code in Katakana."],
  [".home-extension-card:nth-child(1) > a:last-child, .home-extension-card:nth-child(2) > a:last-child, .home-extension-card:nth-child(3) > a:last-child", "Playgroundで試す →", "Try in Playground →", "all"],
  [".home-final-cta h2", "だいじょうぶ。Scratchで知っていることから始めよう。", "You can do this. Start with what you already know from Scratch."],
  [".home-final-cta > p:last-of-type", "ブロックの見本を見ながら、自分のペースで何度でもためせます。", "Use the block examples and try again at your own pace, as many times as you like."],
  [".home-final-cta .home-primary-button", "学習モードではじめる →", "Start learning →"]
];

const docsTranslations = [
  [".docs-play-button", "Playgroundを開く →", "Open Playground →"],
  [".docs-sidebar a:nth-of-type(1)", "Clambonとは", "What is Clambon?"], [".docs-sidebar a:nth-of-type(2)", "はじめ方", "Getting started"],
  [".docs-sidebar a:nth-of-type(3)", "Scratchとの対応", "Scratch mapping"], [".docs-sidebar a:nth-of-type(4)", "基本文法", "Basic syntax"], [".docs-sidebar a:nth-of-type(5)", "拡張機能", "Extensions"],
  [".docs-intro h1", "Scratchからコードへ進むための、Clambon入門。", "An introduction to Clambon: your path from Scratch to code."],
  [".docs-intro > p:last-child", "ClambonはScratchのブロックと1対1対応するコードを記述できるプログラミング言語です。このページでは、Playgroundの使い方と最初に覚える文法を説明します。", "Clambon is a programming language whose code corresponds one-to-one with Scratch blocks. This page explains how to use Playground and the first syntax to learn."],
  ["#getting-started h2", "はじめ方", "Getting started"],
  [".docs-numbered-list li:nth-child(1) b", "Playgroundを開く", "Open Playground"], [".docs-numbered-list li:nth-child(1) span", "ホームの「学習モードではじめる」を押します。", "Select “Start learning” on the home page."],
  [".docs-numbered-list li:nth-child(2) b", "コードを書く", "Write code"], [".docs-numbered-list li:nth-child(2) span", "左側のエディタへプログラムを入力します。", "Enter your program in the editor on the left."],
  [".docs-numbered-list li:nth-child(3) b", "実行する", "Run it"], [".docs-numbered-list li:nth-child(3) span", "右上の ▶ を押し、出力欄で結果を確認します。", "Press ▶ in the upper-right corner and check the result in the output panel."],
  [".docs-code > span", "最初のプログラム", "Your first program"],
  ["#scratch-mapping h2", "Scratchとの1対1対応", "One-to-one mapping with Scratch"],
  ["#scratch-mapping > p:not(.home-kicker):not(.docs-note)", "1つのScratchブロックに対して、同じ役割を持つClambonの書き方があります。学習パレットの「ブロック対応表」では、対応元の画像とコードを並べて確認できます。", "Each Scratch block has a corresponding Clambon expression with the same role. The learning palette's block reference shows source images beside their code."],
  [".mapping-table > div:nth-child(2) span", "「Hello!」と言う", "say “Hello!”"], [".mapping-table > div:nth-child(3) span", "1から10までの乱数", "pick random 1 to 10"], [".mapping-table > div:nth-child(4) span", "1秒待つ", "wait 1 second"],
  [".docs-note", "正確な対応一覧はPlayground内の「学習」→「ブロック対応表」を参照してください。", "For the complete mapping, open Learning → Block reference in Playground."],
  ["#syntax h2", "基本文法", "Basic syntax"],
  [".docs-topic-grid article:nth-child(1) h3", "出力", "Output"], [".docs-topic-grid article:nth-child(1) p", "値や計算結果を出力欄へ表示します。", "Display values and calculation results in the output panel."],
  [".docs-topic-grid article:nth-child(2) h3", "関数", "Functions"], [".docs-topic-grid article:nth-child(2) p", "処理をまとめ、名前を付けて再利用します。", "Group behavior, give it a name, and reuse it."],
  [".docs-topic-grid article:nth-child(3) h3", "拡張機能", "Extensions"], [".docs-topic-grid article:nth-child(3) p", "プログラムの先頭で使う拡張機能を読み込みます。", "Load the extensions used by your program at the beginning."],
  ["#extensions h2", "公式拡張機能", "Official extensions"],
  [".docs-extension-list article:nth-child(1) p", "Canvasゲーム、スプライト、キーボード、コスチュームを追加します。", "Adds canvas games, sprites, keyboard input, and costumes."],
  [".docs-extension-list article:nth-child(2) p", "Clambonの予約語を日本語で記述できるようにします。", "Lets you write Clambon keywords in Japanese."],
  [".docs-extension-list article:nth-child(3) p", "Clambonの予約語をカタカナで記述できるようにします。", "Lets you write Clambon keywords in Katakana."],
  [".docs-next h2", "実際に書いてみよう", "Try writing some code"], [".docs-next p", "学習パレットとブロック対応表を開いた状態で始められます。", "Start with the learning palette and block reference ready to use."],
  [".docs-next .home-primary-button", "学習モードではじめる →", "Start learning →"]
];

function applyTranslations(entries, language) {
  entries.forEach(([selector, ja, en, mode]) => {
    const nodes = mode === "all" ? document.querySelectorAll(selector) : [document.querySelector(selector)];
    nodes.forEach((node) => {
      if (!node) return;
      if (mode === "html") node.innerHTML = language === "en" ? en : ja;
      else node.textContent = language === "en" ? en : ja;
    });
  });
}

function applySiteLanguage(language, persist = true) {
  siteSettings.language = language === "en" ? "en" : "ja";
  document.documentElement.lang = siteSettings.language;
  applyTranslations(commonTranslations, siteSettings.language);
  applyTranslations(document.body.classList.contains("docs-page") ? docsTranslations : homeTranslations, siteSettings.language);
  siteLanguageButton.textContent = siteSettings.language === "en" ? "🌐 Language" : "🌐 言語";
  const english = siteSettings.language === "en";
  siteLanguageButton.setAttribute("aria-label", english ? "Select display language" : "表示言語を選択する");
  siteLanguageMenu.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute("aria-checked", String(button.dataset.language === siteSettings.language));
  });
  document.title = document.body.classList.contains("docs-page")
    ? (english ? "Documentation | Clambon" : "ドキュメント | Clambon")
    : (english ? "Clambon | Text programming that starts with Scratch" : "Clambon | Scratchから始めるテキストプログラミング言語");
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = document.body.classList.contains("docs-page")
    ? (english ? "Documentation for getting started with Clambon, basic syntax, Scratch mappings, and official extensions." : "Clambonの始め方、基本文法、Scratchとの1対1対応、公式拡張機能を説明するドキュメント。")
    : (english ? "Clambon is a learning-focused programming language whose code maps one-to-one to Scratch blocks." : "Scratchのブロックと1対1対応するコードを書ける、学習向けプログラミング言語Clambon。");
  document.querySelector("#siteMenu")?.setAttribute("aria-label", english ? "Site menu" : "サイトメニュー");
  document.querySelector(".home-character")?.setAttribute("alt", english ? "Clambon character" : "Clambonのキャラクター");
  document.querySelector(".scratch-pair")?.setAttribute("aria-label", english ? "One-to-one example of a Scratch block and Clambon code" : "ScratchブロックとClambonコードの1対1対応例");
  document.querySelector(".bridge-steps")?.setAttribute("aria-label", english ? "The path from Scratch to text-based programming" : "Scratchからテキスト言語へ進む流れ");
  const scratchExampleImage = document.querySelector(".scratch-example-image");
  scratchExampleImage?.setAttribute("src", english ? "./assets/scratch-if-score-en.png" : "./assets/scratch-if-score.png");
  scratchExampleImage?.setAttribute("alt", english ? "Scratch block representing: if score equals 85" : "もしscoreが85なら、を表すScratchブロック");
  document.querySelector(".docs-sidebar")?.setAttribute("aria-label", english ? "Documentation contents" : "ドキュメント目次");
  document.querySelector(".mapping-table")?.setAttribute("aria-label", english ? "Scratch and Clambon mapping examples" : "ScratchとClambonの対応例");
  document.querySelectorAll(".extension-github-link").forEach((link) => {
    const name = link.querySelector("h3")?.textContent || "Extension";
    link.setAttribute("aria-label", english ? `Open ${name} on GitHub` : `${name}のGitHubを開く`);
  });
  setSiteMenuOpen(false);
  setLanguageMenuOpen(false);
  if (persist) localStorage.setItem(settingsStorageKey, JSON.stringify(siteSettings));
}

function setSiteMenuOpen(isOpen, returnFocus = false) {
  siteMenuPanel.hidden = !isOpen;
  siteMenuButton.setAttribute("aria-expanded", String(isOpen));
  const english = siteSettings.language === "en";
  siteMenuButton.setAttribute("aria-label", isOpen ? (english ? "Close menu" : "メニューを閉じる") : (english ? "Open menu" : "メニューを開く"));
  if (isOpen) siteMenuPanel.querySelector("a")?.focus();
  if (!isOpen && returnFocus) siteMenuButton.focus();
}

function setLanguageMenuOpen(isOpen, returnFocus = false) {
  siteLanguageMenu.hidden = !isOpen;
  siteLanguageButton.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) siteLanguageMenu.querySelector(`[data-language="${siteSettings.language}"]`)?.focus();
  if (!isOpen && returnFocus) siteLanguageButton.focus();
}

siteMenuButton.addEventListener("click", () => setSiteMenuOpen(siteMenuPanel.hidden));
siteLanguageButton.addEventListener("click", () => setLanguageMenuOpen(siteLanguageMenu.hidden));
siteLanguageMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-language]");
  if (!option) return;
  applySiteLanguage(option.dataset.language);
  siteLanguageButton.focus();
});
siteLanguageMenu.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const options = Array.from(siteLanguageMenu.querySelectorAll("[data-language]"));
  const current = options.indexOf(document.activeElement);
  const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
    : event.key === "ArrowDown" ? (current + 1) % options.length : (current - 1 + options.length) % options.length;
  options[next]?.focus();
});
siteMenuPanel.addEventListener("click", () => setSiteMenuOpen(false));
document.addEventListener("click", (event) => {
  if (!siteMenu.contains(event.target) && !siteMenuPanel.hidden) setSiteMenuOpen(false);
  if (!siteLanguagePicker.contains(event.target) && !siteLanguageMenu.hidden) setLanguageMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !siteMenuPanel.hidden) setSiteMenuOpen(false, true);
  if (event.key === "Escape" && !siteLanguageMenu.hidden) setLanguageMenuOpen(false, true);
});
document.querySelectorAll("[data-learning-start]").forEach((link) => {
  link.addEventListener("click", () => localStorage.setItem("clambon.web.learning-mode.v1", "true"));
});

applySiteLanguage(siteSettings.language, false);
