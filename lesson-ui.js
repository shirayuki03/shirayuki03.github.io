/* The learning workspace owns its drafts; the production workspace owns its source. */
window.ClambonLearning = (() => {
  const key = 'clambon.web.tutorial.v2';
  const workspaceKey = 'clambon.web.production.v1';
  let initialized = false;
  let mode = false;
  let production = null;
  let activeRun = null;
  let feedback = null;
  let predictionFeedback = null;
  let saveFailed = false;
  let runTimer = null;
  const clearRunTimer = () => { clearTimeout(runTimer); runTimer = null; };
  const stages = ['overview', 'predict', 'practice', 'challenge', 'review'];
  const L = (ja, en) => playgroundSettings.language === 'en' ? en : ja;
  const t = value => escapeHtml(value);
  const lesson = () => getCurrentLesson();
  const record = id => tutorialData.lessons.find(item => item.id === id);
  const draftKey = () => `${tutorialState.lessonId}:${tutorialState.stage === 'practice' ? 'practice' : 'challenge'}`;
  function write(storageKey, value) {
    try { localStorage.setItem(storageKey, JSON.stringify(value)); saveFailed = false; }
    catch (_) { saveFailed = true; }
    document.querySelector('#learningSaveWarning')?.toggleAttribute('hidden', !saveFailed);
  }
  function loadState() {
    const fallback = {lessonId:'hello', completed:[], drafts:{}, stages:{}, hints:{}, assisted:[], checklist:[], stage:'overview', screen:'home', legacyCompleted:[]};
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      if (!raw || typeof raw !== 'object') {
        const legacy = JSON.parse(localStorage.getItem('clambon.web.tutorial.v1') || '{}');
        return {...fallback, legacyCompleted:Array.isArray(legacy.completed) ? legacy.completed.filter(v => typeof v === 'string') : []};
      }
      const ids = new Set(window.ClambonTutorialData.lessons.map(item => item.id));
      const validIds = v => Array.isArray(v) ? [...new Set(v.filter(id => ids.has(id)))] : [];
      const safeMap = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
      return {...fallback, lessonId:ids.has(raw.lessonId) ? raw.lessonId : 'hello', completed:validIds(raw.completed),
        drafts:Object.fromEntries(Object.entries(safeMap(raw.drafts)).filter(([,v]) => typeof v === 'string')),
        stages:safeMap(raw.stages), hints:safeMap(raw.hints), assisted:validIds(raw.assisted),
        checklist:Array.isArray(raw.checklist) ? raw.checklist.filter(i => Number.isInteger(i) && i >= 0 && i < 3) : [],
        legacyCompleted:Array.isArray(raw.legacyCompleted) ? raw.legacyCompleted.filter(v => typeof v === 'string') : [],
        stage:stages.includes(raw.stage) ? raw.stage : 'overview', screen:['home','course','lesson'].includes(raw.screen) ? raw.screen : 'home'};
    } catch (_) { return fallback; }
  }
  function save() { write(key, tutorialState); }
  function saveEditor() {
    if (mode) tutorialState.drafts[draftKey()] = editor.value;
    else if (initialized) {
      production = {source:editor.value, checkpoint:latestCheckpoint, output:outputLog.textContent};
      write(workspaceKey, production);
    }
    if (mode) save();
  }
  function restoreProduction() {
    try {
      const stored = JSON.parse(localStorage.getItem(workspaceKey) || 'null');
      if (stored && typeof stored.source === 'string') {
        production = stored;
        editor.value = stored.source;
        latestCheckpoint = typeof stored.checkpoint === 'string' ? stored.checkpoint : null;
      }
    } catch (_) { /* Keep the existing editor if storage is unavailable. */ }
  }
  function loadDraft() {
    const item = lesson();
    editor.value = tutorialState.drafts[draftKey()] ?? (tutorialState.stage === 'practice' ? item.sample : item.starter);
    latestCheckpoint = null;
    outputLog.textContent = msg('outputPlaceholder');
    setStatus("待機中", "idle");
    updateEditorPresentation();
  }
  function cancelRun() {
    clearRunTimer();
    activeRun = null;
    if (engineStarting || runStatus.classList.contains('running')) stopCode();
    latestCheckpoint = null;
  }
  function changeMode(enabled) {
    if (initialized && enabled === mode) return;
    if (!initialized) { initialized = true; mode = false; }
    if (enabled) {
      production = {source:editor.value, checkpoint:latestCheckpoint, output:outputLog.textContent};
      write(workspaceKey, production);
      cancelRun(); mode = true; loadDraft();
    } else if (mode) {
      saveEditor(); cancelRun();
      if (engineWorker) stopCode();
      mode = false;
      editor.value = production?.source ?? exampleCode;
      latestCheckpoint = production?.checkpoint ?? null;
      outputLog.textContent = production?.output || msg('outputPlaceholder');
      updateEditorPresentation();
    }
    render();
  }
  function goStage(stage, fresh = false) {
    if (!stages.includes(stage)) return;
    if (!fresh) saveEditor();
    cancelRun(); feedback = null; predictionFeedback = null;
    tutorialState.stage = stage; tutorialState.screen = 'lesson';
    tutorialState.stages[tutorialState.lessonId] = stage;
    save(); loadDraft(); render(true);
  }
  function select(id) {
    if (!record(id)) return;
    saveEditor(); cancelRun(); feedback = null; predictionFeedback = null;
    tutorialState.lessonId = id; tutorialState.stage = stages.includes(tutorialState.stages[id]) ? tutorialState.stages[id] : 'overview';
    tutorialState.screen = 'lesson'; save(); loadDraft(); render(true);
  }
  const button = (action, label, primary = false, attrs = '') => `<button type="button" data-learn="${action}" class="learn-button ${primary ? 'learn-primary' : ''}" ${attrs}>${label}</button>`;
  function summary(item) {
    const assisted = tutorialState.assisted.includes(item.id);
    return tutorialState.completed.includes(item.id) ? (assisted ? L('要復習','Review suggested') : L('完了','Complete')) : L('未完了','Not finished');
  }
  function chapterProgress(chapter) {
    const items = tutorialData.lessons.filter(item => item.chapter === chapter.id);
    return `${items.filter(item => tutorialState.completed.includes(item.id)).length}/${items.length}`;
  }
  function render(focus = false) {
    if (!window.tutorialData && !window.ClambonTutorialData) return;
    const item = lesson();
    const chapter = localizeRecord(tutorialData.chapters.find(c => c.id === item.chapter));
    const chapterIndex = tutorialData.chapters.findIndex(c => c.id === item.chapter) + 1;
    const done = tutorialState.completed.length;
    const percent = Math.round(done / tutorialData.lessons.length * 100);
    tutorialProgress.textContent = `${done}/${tutorialData.lessons.length}`;
    tutorialProgress.title = `${percent}%`;
    const header = `<div class="learn-toolbar">${button('home',L('学習ホーム','Home'))}${button('course',L('章一覧','Chapters'))}<span>${L('この章','Chapter')} ${chapterProgress(chapter)}</span></div>`;
    let html;
    if (tutorialState.screen === 'home') {
      const first = tutorialData.lessons.find(i => !tutorialState.completed.includes(i.id));
      html = `<article class="learn-welcome"><p class="learn-eyebrow">SCRATCH → CLAMBON</p><h3 data-learn-focus tabindex="-1">${L('コードで、作れるようになる。','From code to creation.')}</h3><div class="learn-resume"><small>${chapterIndex}/7 · ${t(chapter.title)}</small><strong>${t(item.title)}</strong>${button('resume', L('続きから学ぶ','Continue learning'),true)}</div><p>${L('知っているブロックを手がかりに、コードで小さな作品を作ろう。','Use familiar blocks to learn how to build a small project with code.')}</p><div class="learn-meter" role="progressbar" aria-label="${L('コースの進捗','Course progress')}" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${done}"><span style="width:${percent}%"></span></div><p class="learn-caption">${L('全7章・28レッスン','7 chapters · 28 lessons')} · ${done}/28 ${L('完了','complete')}</p>${button('course', L('章一覧から選ぶ','Explore the chapters'))}${!first ? `<p>${L('全レッスン完了！作品を制作画面で育てましょう。','All lessons complete! Keep building your project in the editor.')}</p>` : ''}${tutorialState.legacyCompleted.length ? `<p class="learn-caption">${L('以前のコースの完了記録も保持しています','Previous course records are preserved')}: ${tutorialState.legacyCompleted.length}/6</p>` : ''}</article>`;
    } else if (tutorialState.screen === 'course') {
      html = `<h3 data-learn-focus tabindex="-1">${L('学びたい章を選ぶ','Choose a chapter')}</h3><p class="learn-caption">${L('順番に進めても、知っている章を飛ばしても大丈夫です。','Follow the course or jump to any chapter.')}</p><div class="learn-chapters">${tutorialData.chapters.map((raw,i) => {
        const c = localizeRecord(raw);
        return `<details ${c.id === item.chapter ? 'open' : ''}><summary><span class="learn-chapter-number">${i+1}</span><strong>${t(c.title)}</strong><span>${chapterProgress(c)}</span></summary><p>${t(c.description)}</p><div class="learn-lesson-list">${tutorialData.lessons.filter(l => l.chapter === c.id).map((rawLesson,j) => {
          const l = localizeRecord(rawLesson);
          return `<button type="button" data-learn="select" data-id="${l.id}" ${l.id===item.id?'aria-current="step"':''}><span>${tutorialState.completed.includes(l.id)?'✓':j+1}</span><span>${t(l.title)}<small>${summary(l)}</small></span></button>`;
        }).join('')}</div></details>`;
      }).join('')}</div>`;
    } else {
      const labels = [L('目標','Goal'),L('予想','Predict'),L('試す','Try'),L('課題','Create'),L('振り返り','Review')];
      const stageIndex = stages.indexOf(tutorialState.stage);
      html = `<p class="learn-eyebrow">${L('第','Chapter ')}${chapterIndex}${L('章','')} · ${t(chapter.title)}</p><h3 data-learn-focus tabindex="-1">${t(item.title)}</h3><nav class="learn-stages" aria-label="${L('レッスンのステップ','Lesson steps')}">${stages.map((s,i)=>`<button type="button" data-learn="stage" data-stage="${s}" ${i===stageIndex?'aria-current="step"':''}><span>${i+1}</span>${labels[i]}</button>`).join('')}</nav><article class="learn-content">${renderStage(item)}</article>`;
    }
    lessonView.innerHTML = `${header}${html}<p id="learningSaveWarning" class="lesson-feedback error" role="status" ${saveFailed?'':'hidden'}>${L('このブラウザに保存できません。画面を閉じる前にPCへ保存してください。','Browser storage is unavailable. Save your code to your computer before closing.')}</p>`;
    if (focus) {
      lessonView.querySelector('[data-learn-focus]')?.focus({preventScroll:true});
      document.querySelector('.tutorial-body').scrollTop = 0;
    }
  }
  function renderStage(item) {
    const s = tutorialState.stage;
    if (s === 'overview') return `<p>${t(item.concept)}</p><pre><code>${t(item.sample)}</code></pre><details class="learn-comparison"><summary>${L('Scratchのブロックと比べる','Compare with Scratch blocks')}</summary>${blockPreview(getMapping(item.mappingId))}<p>${t(getMapping(item.mappingId)?.comparison || '')}</p></details><div class="learn-actions">${button('stage',L('動きを予想する','Predict the result'),true,'data-stage="predict"')}${button('stage',L('課題へ進む','Skip to the task'),false,'data-stage="challenge"')}</div>`;
    if (s === 'predict') {
      const q = item.prediction;
      return `<p><strong>${t(q.question)}</strong></p><pre><code>${t(item.sample)}</code></pre><div class="learn-prediction">${q.choices.map((choice,i)=>button('predict',t(choice),false,`data-choice="${i}"`)).join('')}</div><div role="status">${predictionFeedback?`<p class="lesson-feedback ${predictionFeedback.correct?'success':''}">${t(predictionFeedback.text)}</p>`:''}</div>${button('stage',L('実行して確かめる','Try running it'),true,'data-stage="practice"')}`;
    }
    if (s === 'practice') return `<p>${L('例のコードをエディタに用意しました。実行して、値や文字を1か所変えてみましょう。ここでは自由に試せます。','The example is in the editor. Run it, then change a value or message and try again. Experiment freely here.')}</p><p class="learn-caption">${L('次の課題とは別に保存されます。','This draft is saved separately from your task.')}</p><div class="learn-actions">${button('run',L('▶ 実行する','▶ Run code'),true)}${button('stage',L('自分で書く課題へ','Write it yourself'),false,'data-stage="challenge"')}</div><div id="lessonFeedback" class="lesson-feedback" role="status">${t(feedback?.text || L('結果を見て、予想と比べてみましょう。','Compare the result with your prediction.'))}</div>`;
    if (s === 'review') {
      const complete = tutorialState.completed.includes(item.id);
      if (!complete) return `<p>${L('課題を実行して、今回の内容を確かめましょう。','Run the task to check what you have learned.')}</p>${button('stage',L('課題に戻る','Return to task'),true,'data-stage="challenge"')}`;
      const index = tutorialData.lessons.findIndex(i=>i.id === item.id);
      return `<div class="learn-complete">✓ ${L('レッスン完了','Lesson complete')}</div><p>${t(item.concept)}</p>${tutorialState.assisted.includes(item.id)?`<p class="lesson-hint">${L('解答例を見た課題です。時間を置いて、もう一度自分で書いてみましょう。','You viewed the solution. Try writing it yourself again later.')}</p>`:''}<div class="learn-actions">${index < tutorialData.lessons.length-1 ? button('next',L('次のレッスンへ','Next lesson'),true) : button('export',L('作品を制作画面へ','Continue in the editor'),true)}${button('retry',L('もう一度練習する','Practice again'))}</div>${item.chapter==='project' && index < tutorialData.lessons.length-1?button('export',L('今のコードを制作画面へコピー','Copy this code to the editor')):''}`;
    }
    const hintCount = Math.min(3, Number(tutorialState.hints[item.id]) || 0);
    const hints = [...item.hints, item.solution];
    return `<p class="lesson-task">${t(item.task)}</p><p class="learn-caption">${L('コードは左のエディタに書きます。途中の内容も自動保存します。','Write in the code editor. Your draft is saved automatically.')}</p>${item.chapter==='project'&&item.id!=='plan-picker'?button('inherit',L('前の課題から引き継ぐ','Use previous code')):''}<div class="learn-actions">${button('run',L('▶ 実行して確かめる','▶ Run and check'),true)}${button('hint',hintCount < 2 ? L('ヒントを見る','Show a hint') : L('解答例を見る','View solution'),false,hintCount>=3?'disabled':'')}</div>${hintCount?`<div class="learn-hints">${hints.slice(0,hintCount).map((h,i)=>i===2?`<details open><summary>${L('解答例','Example solution')}</summary><pre><code>${t(h)}</code></pre>${button('solution',L('解答例をエディタに入れる','Use solution in editor'))}</details>`:`<p><strong>${L('ヒント','Hint')} ${i+1}</strong><br>${t(h)}</p>`).join('')}</div>`:''}<div id="lessonFeedback" class="lesson-feedback ${feedback?.success?'success':feedback?.error?'error':''}" role="status">${t(feedback?.text || (tutorialState.completed.includes(item.id) ? L('この課題は完了しています。もう一度試すこともできます。','This task is complete. You can still try it again.') : L('実行すると、ここに確認結果が表示されます。','Run your code to check it here.')))}</div>${item.free?`<fieldset class="learn-checklist"><legend>${L('作品の動作確認','Project checklist')}</legend>${item.checklist.map((label,i)=>`<label><input type="checkbox" data-check="${i}" ${tutorialState.checklist.includes(i)?'checked':''}>${t(label)}</label>`).join('')}</fieldset>${button('finish',L('作品を完成にする','Complete project'),true,feedback?.ran&&tutorialState.checklist.length===3?'':'disabled')}`:''}${tutorialState.completed.includes(item.id)?button('stage',L('振り返りへ','Review this lesson'),true,'data-stage="review"'):''}`;
  }
  function runContext(code) {
    saveEditor();
    if (!mode) { activeRun = null; return null; }
    const item = record(tutorialState.lessonId);
    const context = {id:item.id, stage:tutorialState.stage, code, token:Date.now()+Math.random()};
    activeRun = context; feedback = null;
    return {...context, assessment:context.stage==='challenge' ? {expected:item.expected,nodes:item.nodes,tests:item.tests,range:item.range,oneOf:item.oneOf,free:item.free} : null};
  }
  function receive(result, context) {
    clearRunTimer();
    if (!mode || !activeRun || activeRun.token!==context?.token || tutorialState.lessonId!==context.id || tutorialState.stage!==context.stage || editor.value!==context.code) return;
    if (context.stage!=='challenge') {
      feedback={text:L('実行できました。値を変えてもう一度試したら、自分で書く課題へ進みましょう。','Code ran. Try changing a value, then move on to your task.')}; render(); return;
    }
    const item = lesson();
    const text = result.ok ? (item.free ? L('実行できました。3項目を確認して作品を完成にしましょう。','Code ran. Verify the three checklist items to finish.') : L('できました！課題の条件を満たしました。振り返りへ進めます。','Well done! Your code meets the task requirements. Continue to review.')) :
      result.reason==='syntax' ? L('今回使う構文を確認しましょう。ヒントから考え方を確かめられます。','Check the syntax this task asks you to practice. Open a hint if needed.') :
      result.reason==='case' ? L('今の出力は合っていますが、別の値では結果が変わりました。境界の値や、引数の使い方を確認しましょう。','The current output is right, but another input failed. Check boundaries and how you use parameters.') :
      result.reason==='error' ? L('実行エラーがあります。括弧・引用符・変数の名前を確認しましょう。','There is a runtime error. Check parentheses, quotes and variable names.') :
      L('出力が課題の条件と違います。表示する値・順番・回数を確認しましょう。','The output differs from the task. Check values, order and repetition count.');
    feedback = {success:result.ok,error:!result.ok,ran:result.ok,text};
    if (result.ok && !item.free && !tutorialState.completed.includes(item.id)) tutorialState.completed.push(item.id);
    save(); render();
  }
  function onEdit() {
    saveEditor(); activeRun = null; feedback = null;
    // Changing code invalidates the free-project run, but keeps historical completion.
    document.querySelector('[data-learn="finish"]')?.setAttribute('disabled','');
    const node = document.querySelector('#lessonFeedback');
    if (node && mode) { node.className='lesson-feedback'; node.textContent=L('変更しました。実行して確かめましょう。','Code changed. Run it to check.'); }
  }
  function click(event) {
    const target = event.target.closest('[data-learn]');
    if (!target || target.disabled) return;
    const action = target.dataset.learn;
    if (action==='home'||action==='course') { saveEditor(); tutorialState.screen=action; save(); render(true); }
    if (action==='resume') { tutorialState.screen='lesson'; save(); render(true); }
    if (action==='select') select(target.dataset.id);
    if (action==='stage') goStage(target.dataset.stage);
    if (action==='predict') {
      const q=lesson().prediction; const correct=Number(target.dataset.choice)===q.answer;
      predictionFeedback={correct,text:(correct?L('そのとおり！ ','That’s right! '):L('もう一度考えてみよう。 ','Try again. '))+q.explanation}; render();
    }
    if (action==='run') runCode();
    if (action==='hint') {
      const id=lesson().id; const count=Math.min(3,(Number(tutorialState.hints[id])||0)+1);
      tutorialState.hints[id]=count;
      if (count===3&&!tutorialState.assisted.includes(id)) tutorialState.assisted.push(id);
      save(); render();
    }
    if (action==='solution') { editor.value=lesson().solution; updateEditorPresentation(); onEdit(); editor.focus(); }
    if (action==='next') { const i=tutorialData.lessons.findIndex(item=>item.id===lesson().id); if(i+1<tutorialData.lessons.length) select(tutorialData.lessons[i+1].id); }
    if (action==='retry') {
      const id=lesson().id; saveEditor(); tutorialState.completed=tutorialState.completed.filter(v=>v!==id); tutorialState.assisted=tutorialState.assisted.filter(v=>v!==id);
      delete tutorialState.drafts[`${id}:challenge`]; tutorialState.hints[id]=0; tutorialState.checklist=[];
      goStage('challenge', true);
    }
    if (action==='inherit') {
      const i=tutorialData.lessons.findIndex(item=>item.id===lesson().id); const previous=tutorialData.lessons[i-1];
      const source=tutorialState.drafts[`${previous.id}:challenge`];
      if(typeof source==='string') {
        if(editor.value!==lesson().starter && editor.value!=='' && !confirm(L('今の課題のコードを、前の課題のコードに置き換えますか？','Replace this task draft with the previous task’s code?'))) return;
        editor.value=source; updateEditorPresentation(); onEdit();
      } else { feedback={text:L('前の課題のコードはまだありません。開始コードから作れます。','There is no previous draft yet. Use the starter code.')}; render(); }
    }
    if (action==='finish' && lesson().free && feedback?.ran && tutorialState.checklist.length===3) {
      if(!tutorialState.completed.includes(lesson().id))tutorialState.completed.push(lesson().id); goStage('review');
    }
    if (action==='export') {
      saveEditor(); const source=tutorialState.drafts[`${lesson().id}:challenge`] ?? lesson().starter;
      if (production?.source?.trim() && !confirm(L('制作画面のコードを、この作品のコピーに置き換えますか？現在の制作コードはPCに保存しておけます。','Replace the production editor with a copy of this project? You can save the current production code to your computer first.'))) return;
      setLearningMode(false); editor.value=source; latestCheckpoint=null; updateEditorPresentation(); saveEditor(); editor.focus();
    }
  }
  function checklist(event) {
    if (!event.target.matches('[data-check]')) return;
    const i=Number(event.target.dataset.check);
    tutorialState.checklist=tutorialState.checklist.filter(v=>v!==i);
    if(event.target.checked)tutorialState.checklist.push(i);
    save();
    const finish=lessonView.querySelector('[data-learn="finish"]');
    if(finish)finish.disabled=!(feedback?.ran&&tutorialState.checklist.length===3);
  }
  return {loadState,save,saveEditor,restoreProduction,changeMode,render,runContext,receive,onEdit,click,checklist,
    running:()=>{
      clearRunTimer();
      if (!mode || !activeRun) return;
      runTimer = setTimeout(() => {
        stopCode();
        feedback={error:true,text:L('実行が長くなったため停止しました。繰り返しが終わる条件と、変数の更新を確認しましょう。','The run took too long and was stopped. Check the loop condition and variable updates.')};
        render();
      }, 8000);
    },
    settled:clearRunTimer,
    cancel:()=>{clearRunTimer();activeRun=null;}, error:()=>{clearRunTimer();activeRun=null;feedback={error:true,text:L('実行エラーがあります。出力欄の説明を読み、括弧・引用符・変数の名前を確認しましょう。','There is a runtime error. Read the output and check parentheses, quotes and variable names.')};}};
})();
