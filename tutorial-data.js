window.ClambonTutorialData = (() => {
  const scratch = "Scratch標準";
  const turbo = "TurboWarp標準";
  const extension = "TurboWarp拡張";
  const none = "対応なし";
  const scratchDocs = "https://en.scratch-wiki.info/wiki/Blocks";
  const turboDocs = "https://docs.turbowarp.org/";
  const gallery = "https://extensions.turbowarp.org/";
  const scratchImage = (name) => `./assets/blocks/scratch/${name}.png`;
  const userImages = {
    wait: ["control001"],
    "wait-until": ["control006"],
    repeat: ["control002"],
    forever: ["control003"],
    if: ["control004"],
    "if-else": ["control005"],
    var: ["data001", "data002"],
    assignment: ["data002"],
    list: ["data009"],
    append: ["data010"],
    delete: ["data011"],
    "delete-all": ["data012"],
    insert: ["data013"],
    item: ["data015"],
    "list-length": ["data017"],
    print: ["print-log"],
    define: ["moreblocks001"],
    "function-call": ["moreblocks002"],
    return: ["return"],
    arithmetic: ["operators001", "operators002", "operators003", "operators004"],
    mod: ["operators016"],
    power: ["power"],
    negative: ["negative"],
    compare: ["operators006", "operators007", "operators008"],
    logic: ["operators009", "operators010", "operators011"],
    random: ["operators005"],
    join: ["operators012"],
    letter: ["operators013"],
    length: ["operators014"],
    contains: ["operators015", "data018"],
    round: ["operators017"],
    "math-basic": ["operators018"],
    trigonometry: ["sin", "cos", "tan"],
    "inverse-trig": ["asin", "acos", "atan"],
    logarithm: ["ln", "log"],
    napier: ["napier"]
  };

  const mappings = [
    ["import", "基本", "import JapaCla", "拡張機能を読み込む", none, "", "", "Clambonではプログラムから拡張を読み込みます。", turboDocs],
    ["wait", "制御", "wait(1)", "指定秒数待つ", scratch, "制御", "1秒待つ", "どちらも次の命令へ進むまで待機します。", scratchDocs],
    ["wait-until", "制御", "wait <x > 3>", "条件まで待つ", scratch, "制御", "まで待つ", "条件が真になるまで処理を止めます。", scratchDocs],
    ["repeat", "制御", "repeat(3) { }", "回数を指定して繰り返す", scratch, "制御", "3回繰り返す", "波括弧の内側がScratchのC型ブロック内に対応します。", scratchDocs],
    ["forever", "制御", "forever { }", "ずっと繰り返す", scratch, "制御", "ずっと", "停止するまで中の命令を繰り返します。", scratchDocs],
    ["if", "制御", "if <x > 3> { }", "条件分岐", scratch, "制御", "もし〜なら", "山括弧内の条件が六角形の条件スロットに対応します。", scratchDocs],
    ["if-else", "制御", "if <x > 3> { } else { }", "二方向の条件分岐", scratch, "制御", "もし〜なら、でなければ", "条件に応じて片方だけを実行します。", scratchDocs],
    ["var", "変数", "var score = 10", "変数を作り値を入れる", scratch, "変数", "scoreを10にする", "Clambonでは宣言と初期値の設定を一行で行います。", scratchDocs],
    ["assignment", "変数", "score = 20", "変数の値を変更する", scratch, "変数", "scoreを20にする", "既にある変数へ新しい値を入れます。", scratchDocs],
    ["list", "リスト", "list items = [1, 2]", "リストを作る", scratch, "変数", "リストを作る", "Clambonでは初期要素も同時に書けます。", scratchDocs],
    ["append", "リスト", "items.add(3)", "末尾へ追加する", scratch, "変数", "3をitemsに追加する", "どちらもリスト末尾に要素を追加します。", scratchDocs],
    ["delete", "リスト", "items.delete(1)", "要素を削除する", scratch, "変数", "itemsの1番目を削除する", "番号を指定して要素を削除します。", scratchDocs],
    ["delete-all", "リスト", "items.delete(all)", "全要素を削除する", scratch, "変数", "itemsのすべてを削除する", "リストを空にします。", scratchDocs],
    ["insert", "リスト", "items.insert(\"A\" at 1)", "位置を指定して挿入する", scratch, "変数", "Aをitemsの1番目に挿入する", "値と挿入位置を指定します。", scratchDocs],
    ["item", "リスト", "items.item(1)", "指定位置の要素を得る", scratch, "変数", "itemsの1番目", "どちらもリスト番号は1から始まります。", scratchDocs],
    ["list-length", "リスト", "items.length", "リストの長さを得る", scratch, "変数", "itemsの長さ", "要素数を数値として返します。", scratchDocs],
    ["print", "入出力", "print(\"Hello\")", "出力欄へ表示する", extension, "Consoles", "log", "Clambonは画面の出力欄、TurboWarpは開発者コンソールへ表示します。", "https://extensions.turbowarp.org/"],
    ["define", "関数", "define plus(a, b) { return a + b }", "関数を定義する", scratch, "ブロック定義", "plus a b を定義", "引数を持つ再利用可能な処理を作ります。", scratchDocs],
    ["function-call", "関数", "plus(2, 3)", "関数を呼び出す", scratch, "ブロック定義", "plus 2 3", "定義した処理へ引数を渡して実行します。", scratchDocs],
    ["return", "関数", "return a + b", "呼び出し元へ値を返す", turbo, "Custom Reporters", "return", "TurboWarpのCustom Reportersは値を返すカスタムブロックを作れます。", "https://docs.turbowarp.org/return"],
    ["arithmetic", "演算", "a + b / 2", "四則演算", scratch, "演算", "+ − × ÷", "丸い演算ブロックを入れ子にする操作に対応します。", scratchDocs],
    ["mod", "演算", "a mod b", "余りを求める", scratch, "演算", "aをbで割った余り", "割り算の余りを返します。", scratchDocs],
    ["power", "演算", "2 ^ 8", "べき乗", extension, "Math", "x ^ y", "TurboWarp公式Math拡張のべき乗に対応します。", gallery],
    ["negative", "演算", "-x", "符号を反転する", scratch, "演算", "0 - x", "Scratchでは減算ブロックを組み合わせます。", scratchDocs],
    ["compare", "演算", "<a == b> / <a > b> / <a < b>", "比較する", scratch, "演算", "= / > / <", "結果は真または偽になります。", scratchDocs],
    ["logic", "演算", "<A> and <B> / or / not", "条件を組み合わせる", scratch, "演算", "かつ / または / ではない", "六角形の真偽値ブロックに対応します。", scratchDocs],
    ["random", "演算", "random(1 to 10)", "乱数を作る", scratch, "演算", "1から10までの乱数", "指定範囲からランダムな値を返します。", scratchDocs],
    ["join", "文字列", "join(\"A\", \"B\")", "文字列をつなぐ", scratch, "演算", "AとB", "二つの値を文字列として連結します。", scratchDocs],
    ["letter", "文字列", "letter(1 of \"ABC\")", "指定位置の文字を得る", scratch, "演算", "ABCの1番目の文字", "文字位置は1から始まります。", scratchDocs],
    ["length", "文字列", "length(\"ABC\")", "文字数を得る", scratch, "演算", "ABCの長さ", "文字列の長さを数値で返します。", scratchDocs],
    ["contains", "文字列", "\"ABC\" contains \"B\"", "文字を含むか調べる", scratch, "演算", "ABCにBが含まれる", "含まれていれば真になります。", scratchDocs],
    ["round", "数学", "round(x)", "四捨五入する", scratch, "演算", "xを四捨五入", "最も近い整数を返します。", scratchDocs],
    ["math-basic", "数学", "abs(x) / floor(x) / ceiling(x) / sqrt(x)", "基本数学関数", scratch, "演算", "abs / floor / ceiling / sqrt", "Scratchの数学関数メニューに対応します。", scratchDocs],
    ["trigonometry", "数学", "sin(x) / cos(x) / tan(x)", "三角関数", scratch, "演算", "sin / cos / tan", "どちらも角度は度数法で扱います。", scratchDocs],
    ["inverse-trig", "数学", "asin(x) / acos(x) / atan(x)", "逆三角関数", scratch, "演算", "asin / acos / atan", "Scratchの数学関数メニューに対応します。", scratchDocs],
    ["logarithm", "数学", "ln(x) / log(x)", "対数", scratch, "演算", "ln / log", "自然対数と常用対数に対応します。", scratchDocs],
    ["napier", "数学", "e", "ネイピア数", extension, "Math", "e", "TurboWarp公式Math拡張で定数として扱えます。", gallery]
  ].map(([id, category, syntax, description, platform, extensionName, blockName, comparison, source]) => {
    const images = (userImages[id] || []).map(scratchImage);
    return { id, category, syntax, description, platform, extensionName, blockName, comparison, source, image: images[0] || "", images };
  });

  const categoryLabels = { "基本": "Basics", "制御": "Control", "変数": "Variables", "リスト": "Lists", "入出力": "I/O", "関数": "Functions", "演算": "Operators", "文字列": "Text", "数学": "Math" };
  const platformLabels = { [scratch]: "Scratch built-in", [turbo]: "TurboWarp built-in", [extension]: "TurboWarp extension", [none]: "No equivalent" };
  const englishMappings = {
    import: ["Load an extension", "", "Clambon loads extensions from the program."],
    wait: ["Wait for a number of seconds", "wait 1 second", "Both wait before continuing to the next instruction."],
    "wait-until": ["Wait until a condition is true", "wait until", "Execution pauses until the condition becomes true."],
    repeat: ["Repeat a fixed number of times", "repeat 3", "The code inside braces corresponds to the inside of Scratch's C-shaped block."],
    forever: ["Repeat forever", "forever", "The instructions repeat until the program is stopped."],
    if: ["Conditional branch", "if ... then", "The condition inside angle brackets corresponds to a hexagonal condition slot."],
    "if-else": ["Two-way conditional branch", "if ... then, else", "Only one branch runs according to the condition."],
    var: ["Create and initialize a variable", "set score to 10", "Clambon declares and initializes a variable on one line."],
    assignment: ["Change a variable's value", "set score to 20", "A new value is assigned to an existing variable."],
    list: ["Create a list", "make a list", "Clambon can include initial items in the declaration."],
    append: ["Append an item", "add 3 to items", "Both add an item to the end of a list."],
    delete: ["Delete an item", "delete item 1 of items", "An item is removed by its position."],
    "delete-all": ["Delete all items", "delete all of items", "The list becomes empty."],
    insert: ["Insert at a position", "insert A at 1 of items", "Specify both the value and insertion position."],
    item: ["Get an item at a position", "item 1 of items", "List positions start at 1 in both languages."],
    "list-length": ["Get list length", "length of items", "Returns the number of items."],
    print: ["Show text in the output", "log", "Clambon writes to the output panel; TurboWarp writes to the developer console."],
    define: ["Define a function", "define plus a b", "Creates reusable behavior with parameters."],
    "function-call": ["Call a function", "plus 2 3", "Passes arguments to a defined function and runs it."],
    return: ["Return a value", "return", "TurboWarp Custom Reporters can create custom blocks that return values."],
    arithmetic: ["Arithmetic", "+ - × ÷", "This corresponds to nesting round operator blocks."],
    mod: ["Find the remainder", "a mod b", "Returns the remainder after division."], power: ["Exponentiation", "x ^ y", "Equivalent to exponentiation in TurboWarp's official Math extension."],
    negative: ["Negate a value", "0 - x", "Scratch combines this using a subtraction block."], compare: ["Compare values", "= / > / <", "The result is true or false."],
    logic: ["Combine conditions", "and / or / not", "Corresponds to hexagonal Boolean blocks."], random: ["Generate a random number", "pick random 1 to 10", "Returns a random value in the specified range."],
    join: ["Join text", "join A B", "Concatenates two values as text."], letter: ["Get a character at a position", "letter 1 of ABC", "Character positions start at 1."],
    length: ["Get text length", "length of ABC", "Returns the number of characters."], contains: ["Check whether text contains text", "ABC contains B", "Returns true when the text is present."],
    round: ["Round a number", "round x", "Returns the nearest integer."], "math-basic": ["Basic math functions", "abs / floor / ceiling / sqrt", "Corresponds to Scratch's math function menu."],
    trigonometry: ["Trigonometric functions", "sin / cos / tan", "Angles are measured in degrees in both."], "inverse-trig": ["Inverse trigonometric functions", "asin / acos / atan", "Corresponds to Scratch's math function menu."],
    logarithm: ["Logarithms", "ln / log", "Supports natural and common logarithms."], napier: ["Euler's number", "e", "Available as a constant in TurboWarp's official Math extension."]
  };
  mappings.forEach((mapping) => {
    const [description, blockName, comparison] = englishMappings[mapping.id];
    mapping.en = { category: categoryLabels[mapping.category], description, platform: platformLabels[mapping.platform], blockName, comparison };
  });

  const lessons = [
    { id: "output", title: "出力してみよう", mappingId: "print", sample: 'print("こんにちは")', task: '「Clambon」と出力してみよう。', expected: ["Clambon"], required: [/\bprint\s*\(/], hint: 'print("Clambon") の形で書きます。' },
    { id: "variables", title: "変数と計算", mappingId: "var", sample: "var answer = 3 + 4\nprint(answer)", task: "変数answerに3 + 4を入れ、7を出力しよう。", expected: ["7"], required: [/\bvar\s+answer\s*=/, /\bprint\s*\(\s*answer\s*\)/], hint: "varで変数を作り、printで変数名を出力します。" },
    { id: "conditions", title: "条件分岐", mappingId: "if", sample: 'var score = 80\nif <score > 60> {\n  print("合格")\n}', task: "scoreが60より大きいとき「合格」と出力しよう。", expected: ["合格"], required: [/\bif\s*</, /\bscore\s*>\s*60/], hint: "if <条件> { 命令 } の形を使います。" },
    { id: "loops", title: "繰り返し", mappingId: "repeat", sample: 'repeat(3) {\n  print("Clambon")\n}', task: "repeatを使って「Clambon」を3回出力しよう。", expected: ["Clambon", "Clambon", "Clambon"], required: [/\brepeat\s*\(\s*3\s*\)/], hint: "repeat(3)の波括弧内にprintを書きます。" },
    { id: "functions", title: "関数を作ろう", mappingId: "define", sample: "define plus(a, b) {\n  return a + b\n}\n\nprint(plus(2, 3))", task: "plus関数を定義して、plus(2, 3)の結果5を出力しよう。", expected: ["5"], required: [/\bdefine\s+plus\s*\(/, /\breturn\s+a\s*\+\s*b/, /\bplus\s*\(\s*2\s*,\s*3\s*\)/], hint: "define、return、関数呼び出しの3つを確認しましょう。" },
    { id: "extensions", title: "拡張機能を追加しよう", mappingId: "import", sample: 'import JapaCla\n\n変数 message = "こんにちは"\n印刷(message)', task: "JapaClaを追加し、日本語の予約語を使って「こんにちは」と出力しよう。", expected: ["こんにちは"], required: [/^\s*import\s+JapaCla\b/m, /(?:^|\s)変数\s+message\s*=/, /印刷\s*\(\s*message\s*\)/], requiredExtension: "JapaCla", extensionUrl: "https://github.com/shirayuki03/JapaCla", hint: "「JapaClaを追加」を押して読み込み、コードの先頭に import JapaCla を書きます。" }
  ];

  const englishLessons = {
    output: ["Try output", "Output “Clambon” in the output panel.", "Write it in the form print(\"Clambon\")."],
    variables: ["Variables and arithmetic", "Store 3 + 4 in answer and output 7.", "Create a variable with var, then print its name."],
    conditions: ["Conditions", "When score is greater than 60, output “合格”.", "Use the form if <condition> { instruction }."],
    loops: ["Loops", "Use repeat to output “Clambon” three times.", "Put print inside the braces of repeat(3)."],
    functions: ["Create a function", "Define plus and output 5 from plus(2, 3).", "Check define, return, and the function call."],
    extensions: ["Add an extension", "Add JapaCla and output “こんにちは” using Japanese keywords.", "Load JapaCla, then put import JapaCla at the start of the code."]
  };
  lessons.forEach((lesson) => { const [title, task, hint] = englishLessons[lesson.id]; lesson.en = { title, task, hint }; });

  return { lessons, mappings, platforms: [scratch, turbo, extension, none], platformLabels };
})();
