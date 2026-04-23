const defaultHTML = `<!doctype html>
<html>
  <head><title>My HTML Quest</title></head>
  <body>
    <main>
      <h1>Hello, Builder!</h1>
      <p>Start editing to learn HTML.</p>
    </main>
  </body>
</html>`;

const lessons = [
  { title: 'HTML Basics', explanation: 'Elements, tags, and nesting build the skeleton of every web page.', prompt: '<h1>Heading</h1><p>Paragraph</p>' },
  { title: 'Semantic Structure', explanation: 'Use <header>, <main>, <section>, <article>, and <footer> for meaning.', prompt: '<main><section><h2>Topic</h2></section></main>' },
  { title: 'Forms', explanation: 'Collect data using labels, inputs, and buttons.', prompt: '<form><label>Name<input /></label><button>Submit</button></form>' },
  { title: 'Accessibility', explanation: 'Use alt text, labels, and landmarks so everyone can use your page.', prompt: '<img alt="Decorative icon" src="...">' },
  { title: 'Layout Fundamentals', explanation: 'Group content and structure blocks clearly before CSS styling.', prompt: '<div class="card"><h3>Title</h3></div>' }
];

const practiceTargets = [
  { name: 'Simple Card', html: '<section><h2>Profile</h2><p>Frontend Learner</p><button>Follow</button></section>' },
  { name: 'Signup Form', html: '<form><label>Email<input type="email"></label><button>Join</button></form>' }
];

const quizQuestions = [
  { type: 'mcq', q: 'Which tag is semantic?', choices: ['<section>', '<div>', '<span>'], answer: 0 },
  { type: 'fill', q: 'Fill in the gap: <___> defines the most important heading.', answer: 'h1' },
  { type: 'fix', q: 'Fix this broken HTML: <ul><li>One<li>Two</ul>', answerIncludes: '</li>' }
];

let state = {
  projectName: 'My Project',
  code: defaultHTML,
  mode: 'learn',
  xp: Number(localStorage.getItem('xql_xp') || 0),
  streak: Number(localStorage.getItem('xql_streak') || 1),
  accuracy: 0,
  achievements: JSON.parse(localStorage.getItem('xql_achievements') || '[]'),
  selectedPath: null,
  practiceIndex: 0,
  quizIndex: 0
};

const editor = document.getElementById('codeEditor');
const preview = document.getElementById('livePreview');
const feedbackList = document.getElementById('feedbackList');
const syntaxPreview = document.getElementById('syntaxPreview');

function init() {
  registerSW();
  renderMode();
  loadProjects();
  editor.value = state.code;
  renderPreview();
  renderFeedback();
  bindEvents();
  updateStats(0);
  renderOnlineEnhancements();
}

function bindEvents() {
  document.getElementById('modeNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    state.mode = btn.dataset.mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderMode();
  });

  let timer;
  editor.addEventListener('input', () => {
    state.code = editor.value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      renderPreview();
      renderFeedback();
      saveAuto();
    }, 120);
  });

  document.getElementById('saveBtn').addEventListener('click', () => saveProject(state.projectName));
  document.getElementById('saveAsBtn').addEventListener('click', () => {
    const name = prompt('Project name?', state.projectName);
    if (name) saveProject(name);
  });
  document.getElementById('exportBtn').addEventListener('click', exportHTML);
  document.getElementById('importInput').addEventListener('change', (e) => importFile(e.target.files[0]));
  document.getElementById('projectPicker').addEventListener('change', (e) => loadProject(e.target.value));

  const editorPanel = document.getElementById('editorPanel');
  editorPanel.addEventListener('dragover', (e) => e.preventDefault());
  editorPanel.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) importFile(file);
  });

  window.addEventListener('message', (e) => {
    if (e.data?.type === 'elementSelected') {
      state.selectedPath = e.data.path;
      document.getElementById('selectedElement').textContent = e.data.outer;
      document.getElementById('inlineEditor').value = e.data.outer;
    }
  });

  document.getElementById('applyInlineBtn').addEventListener('click', applyInlineEdit);
  document.getElementById('tourBtn').addEventListener('click', startTour);

  window.addEventListener('online', renderOnlineEnhancements);
  window.addEventListener('offline', renderOnlineEnhancements);
}

function renderPreview() {
  const doc = preview.contentDocument;
  doc.open();
  doc.write(`${state.code}
<script>
(function(){
  const getPath = (el) => {
    const path = [];
    while (el && el.parentElement) {
      path.unshift([...el.parentElement.children].indexOf(el));
      el = el.parentElement;
      if (el.tagName === 'HTML') break;
    }
    return path;
  };
  document.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    document.querySelectorAll('.highlighted').forEach(n => n.classList.remove('highlighted'));
    ev.target.classList.add('highlighted');
    parent.postMessage({ type:'elementSelected', path:getPath(ev.target), outer:ev.target.outerHTML.slice(0, 250) }, '*');
  }, true);
})();
<\/script>`);
  doc.close();

  syntaxPreview.textContent = syntaxHints(state.code);
}

function syntaxHints(code) {
  const tagCount = (code.match(/<[^/!][^>]*>/g) || []).length;
  return `tags detected: ${tagCount}\nTip: keep indentation consistent for readability.`;
}

function renderFeedback() {
  const tips = analyzeCode(state.code);
  feedbackList.innerHTML = tips.map(t => `<li class="${t.ok ? 'good' : 'warn'}">${t.msg}</li>`).join('');
}

function analyzeCode(code) {
  const tips = [];
  const stack = [];
  const tagPattern = /<\/?([a-z1-6]+)(?:\s[^>]*)?>/gi;
  let m;
  while ((m = tagPattern.exec(code))) {
    const raw = m[0];
    const name = m[1].toLowerCase();
    if (raw.startsWith('</')) {
      const last = stack.pop();
      if (last !== name) tips.push({ ok: false, msg: `Potential mismatch near </${name}>.` });
    } else if (!raw.endsWith('/>') && !['img', 'input', 'br', 'hr', 'meta', 'link'].includes(name)) {
      stack.push(name);
    }
  }
  if (stack.length) tips.push({ ok: false, msg: `You may have unclosed tags: ${stack.join(', ')}.` });
  if (/<div/.test(code) && !/<section|<article|<main|<nav/.test(code)) tips.push({ ok: false, msg: 'Consider semantic tags (<section>, <main>) over too many <div>.' });
  if (!/<img[^>]+alt=/i.test(code) && /<img/i.test(code)) tips.push({ ok: false, msg: 'Add alt text to images for accessibility.' });
  if (!tips.length) tips.push({ ok: true, msg: 'Great structure! No obvious HTML issues detected.' });
  return tips;
}

function renderMode() {
  const views = ['learnMode', 'practiceMode', 'builderMode', 'quizMode'];
  views.forEach(id => document.getElementById(id).classList.add('hidden'));
  if (state.mode === 'learn') renderLearnMode();
  if (state.mode === 'practice') renderPracticeMode();
  if (state.mode === 'builder') renderBuilderMode();
  if (state.mode === 'quiz') renderQuizMode();
}

function renderLearnMode() {
  const el = document.getElementById('learnMode');
  el.classList.remove('hidden');
  el.innerHTML = `<h3>Learn Mode</h3>${lessons.map((l, i) => `<details ${i===0?'open':''}><summary>${l.title}</summary><p>${l.explanation}</p><pre>${escapeHtml(l.prompt)}</pre><button onclick="insertLesson(${i})">Load in Sandbox</button></details>`).join('')}`;
}
window.insertLesson = (i) => {
  state.code = `<!doctype html><html><body>${lessons[i].prompt}</body></html>`;
  editor.value = state.code;
  renderPreview();
  renderFeedback();
  updateStats(20);
};

function renderPracticeMode() {
  const target = practiceTargets[state.practiceIndex];
  const el = document.getElementById('practiceMode');
  el.classList.remove('hidden');
  el.innerHTML = `
    <h3>Practice Mode: Replication Engine</h3>
    <p>Target: <strong>${target.name}</strong></p>
    <pre>${escapeHtml(target.html)}</pre>
    <button onclick="loadPracticeTarget()">Load Target in Editor</button>
    <button onclick="nextPractice()">Next Challenge</button>
    <button onclick="comparePractice()">Compare Accuracy</button>
    <div id="practiceResult"></div>
  `;
}
window.loadPracticeTarget = () => {
  state.code = `<!doctype html><html><body>${practiceTargets[state.practiceIndex].html}</body></html>`;
  editor.value = state.code;
  renderPreview();
};
window.nextPractice = () => { state.practiceIndex = (state.practiceIndex + 1) % practiceTargets.length; renderPracticeMode(); };
window.comparePractice = () => {
  const target = practiceTargets[state.practiceIndex].html;
  const score = compareMarkup(target, state.code);
  state.accuracy = score;
  document.getElementById('accuracyValue').textContent = `${score}%`;
  document.getElementById('practiceResult').innerHTML = `Accuracy: <strong>${score}%</strong> ${score > 80 ? '🎉 Great match!' : 'Try improving semantic structure.'}`;
  updateStats(score > 80 ? 40 : 10);
};

function compareMarkup(target, current) {
  const clean = (s) => s.replace(/\s+/g, ' ').trim();
  const tags = ['header', 'main', 'section', 'h1', 'h2', 'p', 'button', 'form', 'label', 'input'];
  let points = 0;
  tags.forEach(t => {
    if (clean(target).includes(`<${t}`) === clean(current).includes(`<${t}`)) points += 10;
  });
  return Math.min(100, points);
}

function renderBuilderMode() {
  const el = document.getElementById('builderMode');
  el.classList.remove('hidden');
  const blocks = ['div', 'section', 'button', 'form', 'input', 'img', 'h1', 'p'];
  el.innerHTML = `
    <h3>Drag & Drop HTML Builder</h3>
    <div class="builder-palette">${blocks.map(b => `<span class="draggable" draggable="true" data-tag="${b}">${b}</span>`).join('')}</div>
    <div class="drop-canvas" id="dropCanvas">Drop elements here…</div>
    <button onclick="appendCanvasToEditor()">Generate HTML Code</button>
  `;

  el.querySelectorAll('.draggable').forEach(item => {
    item.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', item.dataset.tag));
  });

  const canvas = document.getElementById('dropCanvas');
  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    const tag = e.dataTransfer.getData('text/plain');
    const node = document.createElement('div');
    node.dataset.tag = tag;
    node.textContent = `<${tag}>`;
    node.className = 'draggable';
    canvas.appendChild(node);
    updateStats(5);
  });
}
window.appendCanvasToEditor = () => {
  const tags = [...document.querySelectorAll('#dropCanvas [data-tag]')].map(n => n.dataset.tag);
  const html = tags.map(t => t === 'img' ? '<img src="https://picsum.photos/120" alt="placeholder" />' : t === 'input' ? '<input type="text" />' : `<${t}>${t}</${t}>`).join('\n');
  state.code = `<!doctype html><html><body>${html}</body></html>`;
  editor.value = state.code;
  renderPreview();
  renderFeedback();
};

function renderQuizMode() {
  const q = quizQuestions[state.quizIndex];
  const el = document.getElementById('quizMode');
  el.classList.remove('hidden');
  let body = `<h3>Quiz & Trivia</h3><p>${q.q}</p>`;
  if (q.type === 'mcq') {
    body += q.choices.map((c, i) => `<button onclick="submitQuiz('${i}')">${c}</button>`).join('');
  } else {
    body += `<input id="quizInput" placeholder="Your answer" /> <button onclick="submitQuiz(document.getElementById('quizInput').value)">Submit</button>`;
  }
  body += `<div id="quizResult"></div><button onclick="nextQuiz()">Next Quiz</button>`;
  el.innerHTML = body;
}
window.submitQuiz = (val) => {
  const q = quizQuestions[state.quizIndex];
  let pass = false;
  if (q.type === 'mcq') pass = Number(val) === q.answer;
  if (q.type === 'fill') pass = String(val).trim().toLowerCase() === q.answer;
  if (q.type === 'fix') pass = String(val).includes(q.answerIncludes);
  document.getElementById('quizResult').textContent = pass ? '✅ Correct!' : '❌ Not quite—try again.';
  updateStats(pass ? 30 : 2);
};
window.nextQuiz = () => { state.quizIndex = (state.quizIndex + 1) % quizQuestions.length; renderQuizMode(); };

function applyInlineEdit() {
  if (!state.selectedPath) return;
  const html = document.getElementById('inlineEditor').value;
  const doc = preview.contentDocument;
  let node = doc.documentElement;
  for (const idx of state.selectedPath) {
    node = node.children[idx];
    if (!node) return;
  }
  const temp = doc.createElement('div');
  temp.innerHTML = html;
  if (!temp.firstElementChild) return;
  node.replaceWith(temp.firstElementChild);
  state.code = '<!doctype html>\n' + doc.documentElement.outerHTML;
  editor.value = state.code;
  renderFeedback();
  updateStats(15);
}

function updateStats(xpGain) {
  state.xp += xpGain;
  const level = Math.floor(state.xp / 120) + 1;
  document.getElementById('xpValue').textContent = state.xp;
  document.getElementById('levelValue').textContent = level;
  document.getElementById('streakValue').textContent = state.streak;
  localStorage.setItem('xql_xp', String(state.xp));
  localStorage.setItem('xql_streak', String(state.streak));
  unlockAchievements(level);
}

function unlockAchievements(level) {
  const checks = [
    { key: 'first-save', label: '💾 First Save', on: localStorage.getItem('xql_saved_once') === '1' },
    { key: 'level-3', label: '🧠 Level 3 Reached', on: level >= 3 },
    { key: 'quiz-master', label: '🏆 Quiz Explorer', on: state.quizIndex >= 2 }
  ];
  state.achievements = checks.filter(c => c.on).map(c => c.label);
  localStorage.setItem('xql_achievements', JSON.stringify(state.achievements));
  document.getElementById('achievements').innerHTML = `<small>${state.achievements.join('<br>') || 'No achievements yet.'}</small>`;
}

function saveProject(name) {
  state.projectName = name;
  const projects = JSON.parse(localStorage.getItem('xql_projects') || '{}');
  projects[name] = state.code;
  localStorage.setItem('xql_projects', JSON.stringify(projects));
  localStorage.setItem('xql_saved_once', '1');
  saveToIndexedDB(name, state.code);
  loadProjects();
  updateStats(25);
  flashState('Saved locally (localStorage + IndexedDB)');
}

function saveAuto() {
  const key = `xql_autosave_${state.projectName}`;
  localStorage.setItem(key, state.code);
  flashState('Autosaved offline');
}

function loadProjects() {
  const projects = JSON.parse(localStorage.getItem('xql_projects') || '{}');
  const picker = document.getElementById('projectPicker');
  const names = Object.keys(projects);
  picker.innerHTML = names.length ? names.map(n => `<option value="${n}">${n}</option>`).join('') : '<option value="">No saved projects</option>';
}

function loadProject(name) {
  const projects = JSON.parse(localStorage.getItem('xql_projects') || '{}');
  if (!projects[name]) return;
  state.projectName = name;
  state.code = projects[name];
  editor.value = state.code;
  renderPreview();
  renderFeedback();
}

function exportHTML() {
  const blob = new Blob([state.code], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.projectName.replace(/\s+/g, '-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.code = String(reader.result);
    editor.value = state.code;
    renderPreview();
    renderFeedback();
    updateStats(10);
  };
  reader.readAsText(file);
}

function renderOnlineEnhancements() {
  const el = document.getElementById('onlineStatus');
  if (navigator.onLine) {
    el.innerHTML = '🟢 Online: cloud save, leaderboard, shared challenges, and templates available.';
  } else {
    el.innerHTML = '🟡 Offline: local storage + IndexedDB active. Online features resume automatically.';
  }
}

function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}

function saveToIndexedDB(name, content) {
  if (!('indexedDB' in window)) return;
  const req = indexedDB.open('htmlQuestDB', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('projects');
  req.onsuccess = () => {
    const tx = req.result.transaction('projects', 'readwrite');
    tx.objectStore('projects').put({ name, content, savedAt: Date.now() }, name);
  };
}

const tourSteps = [
  { title: 'Welcome!', text: 'This is your gamified HTML lab. Learn, practice, and build.' },
  { title: 'Editor', text: 'Write HTML here. Changes render instantly in Live Preview.' },
  { title: 'Preview', text: 'Click preview elements to inspect and edit them inline.' },
  { title: 'Builder', text: 'Open Live Builder mode and drag tags into the canvas.' }
];
let tourIndex = 0;
function startTour() {
  tourIndex = 0;
  document.getElementById('tourOverlay').classList.remove('hidden');
  renderTourStep();
}
function renderTourStep() {
  const step = tourSteps[tourIndex];
  document.getElementById('tourTitle').textContent = step.title;
  document.getElementById('tourText').textContent = step.text;
}
document.getElementById('tourNextBtn').addEventListener('click', () => {
  tourIndex += 1;
  if (tourIndex >= tourSteps.length) {
    document.getElementById('tourOverlay').classList.add('hidden');
    updateStats(20);
    return;
  }
  renderTourStep();
});

function flashState(text) {
  const el = document.getElementById('autosaveState');
  el.textContent = text;
  setTimeout(() => (el.textContent = navigator.onLine ? 'online sync ready' : 'offline-first ready'), 1500);
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

init();
