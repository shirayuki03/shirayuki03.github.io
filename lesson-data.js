/* Course content stays separate from the searchable block reference. */
(() => {
  const chapters = [
    ['start', 'コードを動かす', 'Run your first code', '命令を順番に書いて、結果を確かめる。', 'Write instructions and check what happens.'],
    ['values', '値を覚えて使う', 'Remember and use values', '変数と計算で、使い回せるコードにする。', 'Use variables and calculations.'],
    ['choices', '条件で動きを変える', 'Make choices', '条件に応じて、実行する処理を変える。', 'Choose what to do using conditions.'],
    ['loops', '繰り返して動かす', 'Repeat actions', '繰り返しと乱数で、変化のある結果を作る。', 'Create changing results with loops and random numbers.'],
    ['lists', '複数の値を扱う', 'Work with lists', '候補をまとめて覚え、取り出して使う。', 'Store several choices and use them.'],
    ['functions', '処理をまとめる', 'Build functions', '何度も使う処理に名前を付ける。', 'Name and reuse a set of instructions.'],
    ['project', '自分の作品を作る', 'Create your own project', '抽選ツールを計画し、作り、改造する。', 'Plan, build, test and customize a picker.']
  ].map(([id, title, enTitle, description, enDescription]) => ({id, title, description, en: {title: enTitle, description: enDescription}}));
  const lessons = [];
  // Every example and solution is executable Clambon. Questions refer to the example.
  function add(chapter, id, title, enTitle, mappingId, concept, enConcept, sample, task, enTask, starter, solution, expected, nodes, hints, enHints, prediction, enPrediction, tests = [], extra = {}) {
    lessons.push({chapter, id, title, mappingId, concept, sample, task, starter, solution, expected, nodes, hints, prediction,
      tests, ...extra, en: {title: enTitle, concept: enConcept, task: enTask, hints: enHints, prediction: enPrediction}});
  }
  const P = (question, choices, answer, explanation) => ({question, choices, answer, explanation});
  add('start','hello','はじめての出力','Your first output','print',
    'printは、括弧の中の値を出力欄に表示します。文字は半角の二重引用符で囲みます。',
    'print shows a value in the output panel. Put text inside straight double quotes.',
    'print("こんにちは")','「Clambon」と表示してください。','Display “Clambon”.','', 'print("Clambon")',['Clambon'],['print_'],
    ['表示する命令はprintです。','文字を二重引用符で囲み、括弧の中に入れます。'],['Use print to display a value.','Put the quoted text inside the parentheses.'],
    P('この例を実行すると？',['こんにちは','print','何も出ない'],0,'括弧の中の文字が表示されます。'),P('What does the example display?',['こんにちは','print','Nothing'],0,'print displays the text inside the parentheses.'));
  add('start','sequence','上から順番に','Top to bottom','print',
    '命令は上から順番に実行されます。改行すると、次の命令を書きやすくなります。','Instructions run from top to bottom. Write each instruction on a new line.',
    'print("朝")\nprint("昼")','「開始」「終了」の順に、2行に分けて表示してください。','Display “開始”, then “終了”, on two lines.','print("終了")', 'print("開始")\nprint("終了")',['開始','終了'],['print_'],
    ['最初に表示したい命令を上に置きます。','printを2つ書きます。'],['Put the first instruction at the top.','Use two print instructions.'],
    P('先に表示されるのは？',['朝','昼'],0,'上に書いたprintから実行されます。'),P('Which appears first?',['朝','昼'],0,'The first print runs first.'));
  add('start','text-number','文字と数値・エラーを直す','Text, numbers and fixing errors','arithmetic',
    '数値は引用符なしで書くと計算できます。引用符の中は文字として扱います。エラーが出たら、まず括弧と引用符の対応を見ます。',
    'Numbers without quotes can be calculated. Quoted values are text. When you see an error, first check matching quotes and parentheses.',
    'print(3 + 4)\nprint("3 + 4")','括弧が足りないコードを直して、7、その次に文字「3 + 4」を表示してください。','Fix the missing parenthesis and display 7, then the text “3 + 4”.','print(3 + 4\nprint("3 + 4")', 'print(3 + 4)\nprint("3 + 4")',['7','3 + 4'],['add'],
    ['1行目の開き括弧に対応する閉じ括弧を探します。','計算する行には引用符を付けず、文字の行には引用符を付けます。'],['Find the closing parenthesis for line 1.','Use quotes for text, but not for the calculation.'],
    P('最初の行の出力は？',['7','3 + 4'],0,'引用符のない3 + 4は計算されます。'),P('What does the first line display?',['7','3 + 4'],0,'The unquoted expression is calculated.'));
  add('start','profile','章末：自己紹介を作る','Challenge: introduce yourself','print',
    'ここまでのprintと命令の順番を組み合わせます。まず表示したい順番を考えましょう。','Combine print with the order of instructions. Decide what should appear first.',
    'print("自己紹介")\nprint("音楽が好きです")','「自己紹介」「Clambonを学習中」「よろしく！」を、この順に表示してください。','Display “自己紹介”, “Clambonを学習中”, and “よろしく！” in that order.','', 'print("自己紹介")\nprint("Clambonを学習中")\nprint("よろしく！")',['自己紹介','Clambonを学習中','よろしく！'],['print_'],
    ['3行の出力には、printを3回使えます。','それぞれの文字を引用符で囲み、順番に並べます。'],['Use three print instructions.','Quote each message and put them in order.'],
    P('2つのprintを逆にすると？',['表示する順番が変わる','必ずエラーになる'],0,'コードの並び順が結果の順番になります。'),P('What if you swap the prints?',['The order of messages changes','It always causes an error'],0,'Output follows instruction order.'));
  add('values','variable','値に名前を付ける','Name a value','var',
    'Scratchの変数と同じように、値を名前で覚えます。varで作り、使うときは引用符なしで名前を書きます。','Like Scratch variables, a name remembers a value. Create one with var and use its name without quotes.',
    'var score = 10\nprint(score)','変数に20を入れ、その変数を使って20を表示してください。','Store 20 in a variable, then print that variable.','var score = 10\nprint(score)', 'var score = 20\nprint(score)',['20'],['var','var_name'],
    ['変数を作る行の値を変えます。','print(score)は、scoreという文字ではなく値を表示します。'],['Change the initial value.','print(score) displays the stored value.'],
    P('print(score)の結果は？',['10','score'],0,'変数名を引用符で囲まないと、その値が使われます。'),P('What does print(score) display?',['10','score'],0,'An unquoted variable name refers to its value.'));
  add('values','update','値を更新する','Update a value','assignment',
    '作った変数には、varを付けずに新しい値を入れられます。右側を計算してから、左側の変数に入れます。','Update an existing variable without var. Calculate the right side first, then store the result on the left.',
    'var score = 10\nscore = score + 2\nprint(score)','最初の10点に5点を加えて、15を表示してください。','Add 5 to the initial score of 10 and display 15.','var score = 10\nprint(score)', 'var score = 10\nscore = score + 5\nprint(score)',['15'],['assignment','add'],
    ['新しい値は「今の値 + 5」です。','最初のvarとprintの間に、値を更新する行を入れます。'],['The new value is the current value plus 5.','Update the variable between its declaration and print.'],
    P('更新した後のscoreは？',['10','12','2'],1,'10 + 2を計算した12が入ります。'),P('What is score after updating?',['10','12','2'],1,'The result of 10 + 2 is stored.'));
  add('values','join','文字と値をつなぐ','Join text and values','join',
    'join(左, 右)は2つの値を文字としてつなぎます。変数の値をメッセージに入れられます。','join(left, right) combines two values as text. Use it to put a variable into a message.',
    'var score = 10\nprint(join("得点：", score))','変数に30を入れて、joinを使い「得点：30」と表示してください。','Store 30 in a variable and use join to display “得点：30”.','var score = 30\nprint(score)', 'var score = 30\nprint(join("得点：", score))',['得点：30'],['var','join'],
    ['文字「得点：」と、変数の値をつなぎます。','printの中にjoin("得点：", score)を書けます。'],['Join the text “得点：” with the variable.','Put join("得点：", score) inside print.'],
    P('出力はどれ？',['得点：10','得点：score'],0,'joinは変数の値を文字につなぎます。'),P('Which is the output?',['得点：10','得点：score'],0,'join uses the value of the variable.'));
  add('values','shopping','章末：買い物の計算','Challenge: calculate a total','arithmetic',
    '値段と個数を変数に分けると、数字を変えて使えます。掛け算は半角の*で書きます。','Separate price and quantity into variables so you can reuse the code. Multiplication uses *.',
    'var price = 80\nvar count = 2\nprint(price * count)','priceに120、countに3を入れ、2つの変数を掛けた360を表示してください。別の値段と個数でも確認します。','Set price to 120 and count to 3, then print their product, 360. We also check other prices and quantities.','var price = 120\nvar count = 3', 'var price = 120\nvar count = 3\nprint(price * count)',['360'],['multiply'],
    ['合計は「値段 × 個数」です。','2つの変数を*でつないでprintします。'],['The total is price times quantity.','Multiply the two variables inside print.'],
    P('例の合計は？',['82','160','80'],1,'80を2個買うので80 * 2です。'),P('What is the example total?',['82','160','80'],1,'Two items at 80 cost 80 * 2. '),[{inputIndex:0,value:50,inputIndex2:1,value2:4,expected:['200']}]);
  add('choices','if','条件に合うときだけ','Only when a condition is true','if',
    'if <条件> { 命令 }は、条件に合うときだけ中を実行します。>は「より大きい」を表します。','if <condition> { instructions } runs its body only when the condition is true. > means greater than.',
    'var score = 80\nif <score > 60> {\n  print("合格")\n}','scoreが60より大きいときだけ「合格」と表示してください。最初の値は80にします。60と50でも確認します。','Print “合格” only when score is greater than 60. Start with 80; we also check 60 and 50.','var score = 80', 'var score = 80\nif <score > 60> {\n  print("合格")\n}',['合格'],['if_'],
    ['printをifの波括弧の中に入れます。','条件にはscore > 60を書きます。'],['Put print inside the if body.','Use score > 60 as the condition.'],
    P('scoreが60なら表示される？',['される','されない'],1,'「より大きい」なので、同じ値は含みません。'),P('Does it print when score is 60?',['Yes','No'],1,'Greater than does not include equality.'),[{inputIndex:0,value:60,expected:[]},{inputIndex:0,value:50,expected:[]},{inputIndex:0,value:61,expected:['合格']},{inputIndex:0,value:90,expected:['合格']}]);
  add('choices','else','そうでないとき','Otherwise','if-else',
    'elseは条件に合わないときの処理です。ifとelseのどちらか一方が実行されます。','else handles the other case. Exactly one of the two branches runs.',
    'var score = 40\nif <score > 60> {\n  print("合格")\n} else {\n  print("挑戦中")\n}','scoreが60より大きければ「合格」、そうでなければ「挑戦中」と表示してください。最初の値は40です。','Print “合格” if score is greater than 60, otherwise “挑戦中”. Start with 40.','var score = 40', 'var score = 40\nif <score > 60> {\n  print("合格")\n} else {\n  print("挑戦中")\n}',['挑戦中'],['if_','else_block'],
    ['条件に合わない側をelseに書きます。','ifの閉じ波括弧の後にelse { ... }を置きます。'],['Put the other case inside else.','Write else { ... } after the if body.'],
    P('例ではどちらが表示される？',['合格','挑戦中','両方'],1,'40は60より大きくないのでelse側です。'),P('What does the example display?',['合格','挑戦中','Both'],1,'40 is not greater than 60, so else runs.'),[{inputIndex:0,value:80,expected:['合格']},{inputIndex:0,value:60,expected:['挑戦中']}]);
  add('choices','logic','条件を組み合わせる','Combine conditions','logic',
    '<条件A> and <条件B>は両方が合うときに成立します。条件全体も山括弧で囲みます。','<condition A> and <condition B> is true when both are true. Wrap the entire if condition in angle brackets too.',
    'var age = 15\nif <<age > 12> and <age < 18>> {\n  print("対象")\n}','andを使い、ageが12より大きく18より小さいときだけ「対象」と表示してください。最初は15です。','Use and to print “対象” only when age is greater than 12 and less than 18. Start with 15.','var age = 15', 'var age = 15\nif <<age > 12> and <age < 18>> {\n  print("対象")\n}',['対象'],['and_'],
    ['下限と上限をそれぞれ条件にします。','<age > 12> and <age < 18>をifの条件にします。'],['Write one condition for each boundary.','Combine <age > 12> and <age < 18>.'],
    P('ageが18なら条件に合う？',['合う','合わない'],1,'18より小さい条件には18を含みません。'),P('Does age 18 meet this condition?',['Yes','No'],1,'Less than 18 excludes 18.'),[{inputIndex:0,value:12,expected:[]},{inputIndex:0,value:18,expected:[]},{inputIndex:0,value:16,expected:['対象']}]);
  add('choices','score-message','章末：得点メッセージ','Challenge: score messages','compare',
    '境界の値でも確かめると、条件の間違いを見つけやすくなります。==は「等しい」です。','Test boundary values to find mistakes. == means equal.',
    'var score = 100\nif <score == 100> {\n  print("満点！")\n} else {\n  print("次も挑戦！")\n}','100点なら「満点！」、それ以外なら「次も挑戦！」と表示してください。最初は100点です。','Display “満点！” for 100 points, otherwise “次も挑戦！”. Start with 100.','var score = 100', 'var score = 100\nif <score == 100> {\n  print("満点！")\n} else {\n  print("次も挑戦！")\n}',['満点！'],['if_','else_block','equal'],
    ['100と等しいか調べます。','代入の=と、比較の==を区別しましょう。'],['Check whether the value equals 100.','Use == for comparison, not the assignment =.'],
    P('等しいか比べる記号は？',['=','=='],1,'=は値を入れる、==は比べる記号です。'),P('Which checks equality?',['=','=='],1,'= assigns a value; == compares values.'),[{inputIndex:0,value:99,expected:['次も挑戦！']},{inputIndex:0,value:101,expected:['次も挑戦！']}]);
  add('loops','repeat','同じ命令を繰り返す','Repeat an instruction','repeat',
    'repeat(回数)の波括弧の中は、指定した回数だけ実行されます。Scratchの「回繰り返す」と同じ考え方です。','The body of repeat(count) runs that many times, like Scratch’s repeat block.',
    'repeat(2) {\n  print("こんにちは")\n}','repeatを使って「Clambon」を3回表示してください。','Use repeat to display “Clambon” three times.','', 'repeat(3) {\n  print("Clambon")\n}',['Clambon','Clambon','Clambon'],['repeat'],
    ['繰り返す回数を括弧に入れます。','繰り返したいprintを波括弧の中に書きます。'],['Put the repetition count in parentheses.','Put print inside the braces.'],
    P('例では何回表示される？',['1回','2回','3回'],1,'repeat(2)なので2回です。'),P('How many messages appear?',['1','2','3'],1,'repeat(2) runs twice.'));
  add('loops','counter','繰り返しで値を変える','Change a value in a loop','assignment',
    '繰り返すたびに変数を更新すると、毎回違う値を使えます。表示と更新の順番にも注目しましょう。','Updating a variable inside a loop changes it each time. Notice the order of print and update.',
    'var count = 1\nrepeat(3) {\n  print(count)\n  count = count + 1\n}','変数とrepeatを使い、1、2、3、4を順番に表示してください。','Use a variable and repeat to display 1, 2, 3, 4 in order.','var count = 1', 'var count = 1\nrepeat(4) {\n  print(count)\n  count = count + 1\n}',['1','2','3','4'],['repeat','assignment'],
    ['1から始め、表示するたびに1を加えます。','4回繰り返す中で、printの後に値を更新します。'],['Start at 1 and add 1 after each print.','Repeat four times, updating after print.'],
    P('例の最後に表示される値は？',['2','3','4'],1,'表示が先なので1、2、3の順です。'),P('What is the last printed value?',['2','3','4'],1,'It prints before updating, so the output is 1, 2, 3.'));
  add('loops','until','条件を満たすまで','Repeat until a condition','repeat',
    'repeat <条件>は、その条件を満たすまで繰り返します。最初から条件を満たしていれば実行しません。ずっと繰り返すforeverは停止ボタンで止められます。','repeat <condition> repeats until the condition becomes true. If already true, the body does not run. A forever loop continues until stopped.',
    'var count = 1\nrepeat <count > 3> {\n  print(count)\n  count = count + 1\n}','条件付きのrepeatを使い、3、2、1の順に表示し、0になったら終わるようにしてください。','Use a conditional repeat to print 3, 2, 1 and finish when the value reaches 0.','var count = 3', 'var count = 3\nrepeat <count == 0> {\n  print(count)\n  count = count - 1\n}',['3','2','1'],['repeat','equal','subtract'],
    ['終わる条件はcount == 0です。','表示した後に1を引きます。更新を忘れたら停止ボタンを押しましょう。'],['Stop when count == 0.','Subtract 1 after printing. If it never ends, press Stop.'],
    P('例が終わるときのcountは？',['2','3','4'],2,'countが4になるとcount > 3を満たして終わります。'),P('What is count when the example ends?',['2','3','4'],2,'At 4, count > 3 becomes true.'));
  add('loops','dice','章末：サイコロを振る','Challenge: roll a die','random',
    'random(1 to 6)は1〜6の整数をランダムに選びます。繰り返しの中で呼ぶと毎回選び直します。','random(1 to 6) picks an integer from 1 to 6. Calling it inside the loop picks a new value each time.',
    'repeat(2) {\n  print(random(1 to 6))\n}','repeatとrandomを使い、1〜6の整数を3回表示してください。毎回同じ結果でも正常です。','Use repeat and random to display three integers from 1 to 6. Repeated values are normal.','', 'repeat(3) {\n  print(random(1 to 6))\n}',null,['repeat','random'],
    ['randomで選んだ値をprintします。','repeat(3)の中でrandom(1 to 6)を使います。'],['Print the value returned by random.','Use random(1 to 6) inside repeat(3).'],
    P('6が2回続いたら？',['正常な結果','必ずコードの間違い'],0,'ランダムでも同じ値が続くことがあります。'),P('What if 6 appears twice?',['That is normal','The code must be wrong'],0,'Random choices can repeat.'),[],{range:{min:1,max:6,count:3}});
  add('lists','list','候補をまとめて覚える','Create a list','list',
    'listで複数の値をまとめます。角括弧の中に、カンマで区切って値を書きます。.lengthで要素数を調べます。','Use list to store several values. Separate items with commas inside square brackets. .length gives the item count.',
    'list items = ["赤", "青"]\nprint(items.length)','3つの候補「赤」「青」「黄」のリストを作り、要素数の3を表示してください。','Create a list of “赤”, “青”, “黄” and print its length, 3.','', 'list items = ["赤", "青", "黄"]\nprint(items.length)',['3'],['array','length_list'],
    ['list items = [...]で候補をまとめます。','要素数はitems.lengthです。'],['Use list items = [...] to store the choices.','The count is items.length.'],
    P('例のitems.lengthは？',['1','2','3'],1,'リストに2つの要素があります。'),P('What is items.length in the example?',['1','2','3'],1,'There are two items.'));
  add('lists','index','番号で取り出す','Read an item by position','item',
    'items[番号]で要素を取り出します。Scratchと同じく番号は1から始まります。','items[position] reads an item. Positions start at 1, just like Scratch.',
    'list items = ["赤", "青", "黄"]\nprint(items[1])','リストから2番目の「青」を取り出して表示してください。','Read and print the second item, “青”.','list items = ["赤", "青", "黄"]', 'list items = ["赤", "青", "黄"]\nprint(items[2])',['青'],['array','var_name'],
    ['2番目を指定する番号は2です。','print(items[2])の形を使います。'],['The second position is 2.','Use print(items[2]).'],
    P('items[1]はどの値？',['赤','青','黄'],0,'最初の番号は0ではなく1です。'),P('Which value is items[1]?',['赤','青','黄'],0,'The first position is 1, not 0.'));
  add('lists','edit-list','リストを編集する','Edit a list','append',
    '.add(値)で末尾に追加し、.delete(番号)で削除します。削除した後は残りの番号が詰まります。.insert("値" at 番号)で途中にも追加できます。',
    '.add(value) appends an item; .delete(position) removes one. Positions shift after deletion. .insert("value" at position) inserts an item.',
    'list items = ["赤", "青"]\nitems.add("黄")\nitems.delete(1)\nprint(items[1])','「赤」「青」のリストに「黄」を追加し、1番目を削除してください。その後の1番目「青」と要素数2を表示してください。','Append “黄” to [“赤”, “青”], delete the first item, then print the new first item “青” and the length 2.','list items = ["赤", "青"]', 'list items = ["赤", "青"]\nitems.add("黄")\nitems.delete(1)\nprint(items[1])\nprint(items.length)',['青','2'],['append','delete','length_list'],
    ['追加、削除、表示の順に書きます。','削除後は青が1番目、黄が2番目です。'],['Append, delete, then print.','After deletion, 青 is first and 黄 is second.'],
    P('例の削除後の1番目は？',['赤','青','黄'],1,'赤を削除すると青が先頭に移ります。'),P('What is first after deletion?',['赤','青','黄'],1,'Removing 赤 moves 青 into the first position.'));
  add('lists','picker','章末：候補から抽選する','Challenge: pick from a list','random',
    '1からリストの要素数までの番号を選び、その位置の値を取り出すと抽選になります。','Choose a number from 1 to the list length, then read that position to pick an item.',
    'list items = ["赤", "青", "黄"]\nvar index = random(1 to items.length)\nprint(items[index])','リスト「赤」「青」「黄」から、randomで番号を選び、どれか1つを表示してください。','Use random to choose a position in [“赤”, “青”, “黄”] and print one item.','list items = ["赤", "青", "黄"]', 'list items = ["赤", "青", "黄"]\nvar index = random(1 to items.length)\nprint(items[index])',null,['array','random','length_list'],
    ['ランダムに選ぶのは候補そのものではなく番号です。','random(1 to items.length)で番号を作り、items[index]で読みます。'],['Pick a position, rather than the text itself.','Use random(1 to items.length), then items[index].'],
    P('上限にitems.lengthを使う理由は？',['候補数に合わせられる','いつも1になる'],0,'候補が増減しても番号の範囲が合います。'),P('Why use items.length as the upper limit?',['It matches the number of choices','It always becomes 1'],0,'The range stays correct if the list changes.'),[],{oneOf:['赤','青','黄']});
  add('functions','define','処理に名前を付ける','Name a set of instructions','define',
    'define 名前() { ... }で処理をまとめます。定義だけでは実行されず、名前()で呼び出します。','define name() { ... } groups instructions. A definition does not run until you call name().',
    'define greet() {\n  print("こんにちは")\n}\ngreet()','「こんにちは」と表示する関数を作り、2回呼び出してください。関数名は自由です。','Define a function that prints “こんにちは” and call it twice. Choose any function name.','', 'define greet() {\n  print("こんにちは")\n}\ngreet()\ngreet()',['こんにちは','こんにちは'],['define','function_call'],
    ['同じ処理を2つ書く代わりに、名前を2回呼びます。','関数を定義した後で、greet()を2行書けます。'],['Call the function twice instead of repeating its body.','After defining greet, write greet() on two lines.'],
    P('定義だけを書いた場合は？',['すぐ表示する','呼ぶまで表示しない'],1,'定義と呼び出しは別の操作です。'),P('What happens with only the definition?',['It prints immediately','Nothing prints until called'],1,'Defining and calling are separate actions.'));
  add('functions','parameter','値を渡して使う','Pass a value','function-call',
    '引数は、呼び出すときに渡す値です。関数内では、括弧に書いた名前で受け取ります。','An argument is a value passed when calling a function. The parameter name receives it inside the function.',
    'define greet(name) {\n  print(join("こんにちは、", name))\n}\ngreet("そら")','名前を1つ受け取り、「こんにちは、名前」と表示する関数を作って「うみ」で呼んでください。別の名前でも確認します。','Define a one-parameter function that prints “こんにちは、” joined with the name. Call it with “うみ”. We also try another name.','', 'define greet(name) {\n  print(join("こんにちは、", name))\n}\ngreet("うみ")',['こんにちは、うみ'],['define','function_call','join'],
    ['固定の名前ではなく、引数をjoinでつなぎます。','定義の括弧にname、呼び出しの括弧に"うみ"を入れます。'],['Join the parameter instead of a fixed name.','Use name in the definition and "うみ" in the call.'],
    P('例のnameに入る値は？',['name','そら'],1,'呼び出し時の値が引数に入ります。'),P('What value does name receive?',['name','そら'],1,'The call supplies the parameter value.'),[{callArgs:['りく'],expected:['こんにちは、りく']}]);
  add('functions','return','計算結果を返す','Return a result','return',
    'returnは計算結果を呼び出し元に返します。printは表示する命令です。返した値は、さらに計算に使えます。','return sends a result back to the caller. print displays a value. Returned values can be used in more calculations.',
    'define double(n) {\n  return n * 2\n}\nprint(double(3))','数値を1つ受け取り、その2倍を返す関数を作り、4を渡した結果8を表示してください。','Define a function returning twice its parameter. Pass 4 and print 8.','', 'define double(n) {\n  return n * 2\n}\nprint(double(4))',['8'],['define','return_','function_call'],
    ['関数内でprintせず、returnを使います。','return n * 2を返し、呼び出し側でprintします。'],['Use return inside the function.','Return n * 2 and print the call result.'],
    P('例の出力は？',['3','6','2'],1,'3の2倍が戻り値です。'),P('What does the example print?',['3','6','2'],1,'The function returns twice 3.'),[{callArgs:[7],printReturn:true,expected:['14']},{callArgs:[0],printReturn:true,expected:['0']}]);
  add('functions','total-function','章末：合計の関数','Challenge: a total function','define',
    '2つの引数をカンマで区切ると、値段と個数のような組を渡せます。渡す順番をそろえましょう。','Separate two parameters with a comma to pass a price and quantity. Keep their order consistent.',
    'define total(price, count) {\n  return price * count\n}\nprint(total(80, 2))','値段と個数を受け取り、合計を返す関数を作ってください。120と3を渡して360を表示します。関数名は自由です。','Define a two-parameter function returning price times quantity. Call it with 120 and 3 and print 360. Any function name is fine.','', 'define total(price, count) {\n  return price * count\n}\nprint(total(120, 3))',['360'],['define','return_','multiply','function_call'],
    ['掛け算する2つの値を、引数として受け取ります。','return price * countの結果を、呼び出し側で表示します。'],['Receive both values as parameters.','Return price * count, then print the result at the call site.'],
    P('total(50, 4)の結果は？',['54','200','504'],1,'50 * 4を返します。'),P('What does total(50, 4) return?',['54','200','504'],1,'It returns 50 * 4.'),[{callArgs:[50,4],printReturn:true,expected:['200']},{callArgs:[120,0],printReturn:true,expected:['0']}]);
  const checks = ['候補をリストで管理している','選んだ番号がリストの範囲内にある','実行すると候補のどれかが表示される'];
  const enChecks = ['Choices are stored in a list','The chosen position is inside the list','Running displays one of the choices'];
  add('project','plan-picker','作品の計画を立てる','Plan your picker','list',
    '作品の目標は「今日やることを選ぶ抽選ツール」です。必要な処理は、候補を覚える→番号を選ぶ→候補を表示する、の3つです。','Build a picker for something to do today. Store choices, pick a position, then display that choice.',
    'list activities = ["読書", "散歩", "音楽"]\nprint(activities.length)','まずは候補「読書」「散歩」「音楽」をリストにして、要素数3を表示してください。','First store “読書”, “散歩”, “音楽” in a list and print its length, 3.','', 'list activities = ["読書", "散歩", "音楽"]\nprint(activities.length)',['3'],['array','length_list'],
    ['最初から全部作らず、候補の準備から始めます。','listと.lengthを使います。'],['Start by preparing the choices.','Use list and .length.'],
    P('最初に用意するものは？',['候補のリスト','正解の文章を固定する'],0,'変更しやすい候補のリストから始めます。'),P('What should you prepare first?',['A list of choices','One fixed answer'],0,'Start with a list that you can change.'));
  add('project','build-picker','抽選する処理を作る','Build the picker','random',
    '前の課題のリストを使って、番号の抽選と表示を加えます。「前の課題から引き継ぐ」でコードを持ってこられます。','Add a random position and output to the previous list. Use “Use previous code” to bring it into this task.',
    'list activities = ["読書", "散歩", "音楽"]\nvar index = random(1 to activities.length)\nprint(activities[index])','「読書」「散歩」「音楽」のリストから、randomで選んだ1つを表示してください。','Use random to display one of “読書”, “散歩”, “音楽” from the list.','list activities = ["読書", "散歩", "音楽"]', 'list activities = ["読書", "散歩", "音楽"]\nvar index = random(1 to activities.length)\nprint(activities[index])',null,['array','random','length_list'],
    ['リストの章で作った抽選と同じ組み合わせです。','番号を1〜activities.lengthから選び、activities[index]を表示します。'],['Combine the steps from the list chapter.','Pick from 1 to activities.length and print activities[index].'],
    P('候補を増やしても使える上限は？',['3で固定','activities.length'],1,'要素数を使うと、候補の増減に対応できます。'),P('Which upper limit adapts to new choices?',['Always 3','activities.length'],1,'The list length adapts to added or removed choices.'),[],{oneOf:['読書','散歩','音楽']});
  add('project','test-picker','動きを確かめる','Test your picker','random',
    '乱数を使う作品は、同じ答えが続く場合もあります。候補が1つの場合、候補を増やした場合も試してみましょう。','Random programs can repeat the same answer. Try one choice, then add more choices.',
    'list activities = ["読書"]\nvar index = random(1 to activities.length)\nprint(activities[index])','候補を「読書」1つにして、抽選が必ず「読書」を表示するか確かめてください。番号の上限は要素数にします。','Use only “読書” and check that the picker always prints it. Use the list length as the upper limit.','list activities = ["読書"]', 'list activities = ["読書"]\nvar index = random(1 to activities.length)\nprint(activities[index])',['読書'],['array','random','length_list'],
    ['1〜1の乱数は必ず1になります。','候補が1つでも、番号の作り方は変えなくて大丈夫です。'],['A random number from 1 to 1 is always 1.','Keep using the list length as the upper limit.'],
    P('候補が1つなら毎回同じ結果でも？',['正常','失敗'],0,'選べる候補が1つなので正常です。'),P('Is repeating the single choice correct?',['Yes','No'],0,'There is only one possible choice.'));
  add('project','remix','自分の作品に改造する','Make it your own','define',
    '候補を自分の好きなものに変えたり、メッセージを足したり、抽選を関数にまとめたりしましょう。ここには1つの正解はありません。','Change the choices, add a message, or put the picker in a function. There is no single correct solution here.',
    'list activities = ["読書", "散歩", "音楽"]\nvar index = random(1 to activities.length)\nprint(join("今日のおすすめ：", activities[index]))','自分の候補で抽選ツールを完成させましょう。実行して下の3項目を確認したら、作品を完成にできます。','Finish a picker with your own choices. Run it and verify the three checklist items to complete your project.','list activities = ["読書", "散歩", "音楽"]\nvar index = random(1 to activities.length)\nprint(activities[index])', 'list activities = ["読書", "散歩", "音楽"]\nvar index = random(1 to activities.length)\nprint(join("今日のおすすめ：", activities[index]))',null,[],
    ['まず候補を自分の好きなものに変えてみましょう。','表示を工夫するならjoin、処理をまとめるならdefineが使えます。'],['Start by changing the choices to your own.','Try join for a message or define to group the picker instructions.'],
    P('自由制作で大切なのは？',['例と完全に同じコード','作りたい動きを確かめること'],1,'目的に合って動くか、自分で確かめます。'),P('What matters for your own project?',['Matching the example exactly','Checking that it does what you want'],1,'Check your program against your own goal.'),[],{free:true, checklist:checks});
  lessons.at(-1).en.checklist = enChecks;
  window.ClambonTutorialData = {...window.ClambonTutorialData, chapters, lessons};
})();
