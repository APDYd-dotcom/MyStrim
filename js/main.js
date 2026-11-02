/* =========================================================
   MyStrim — main.js
   Vanilla JS single-page app controller.
   ========================================================= */

(function () {
  'use strict';

  /* ------------------------- app state ------------------------- */
  const state = {
    view: 'auth',        // 'auth' | 'user' | 'admin'
    docSearch: '',
    activeDocId: null,   // doc currently open in docModal
    quiz: null,          // { docId, questions, index, score, selected, answered, coinAwarded }
    editingDocId: null,  // set when docFormModal is in edit mode
    manageDocId: null,   // doc currently open in quizManageModal
  };

  /* ------------------------- dom helpers ------------------------- */
  const $ = (id) => document.getElementById(id);
  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
  function openModal(id) {
    $(id).classList.remove('hidden');
    $(id).querySelector('.modal-pop, [data-modal-box]');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    $(id).classList.add('hidden');
    // restore scroll only if no other modal is open
    const anyOpen = ['docModal', 'quizModal', 'docFormModal', 'quizManageModal', 'confirmModal']
      .some(m => !$(m).classList.contains('hidden'));
    if (!anyOpen) document.body.style.overflow = '';
  }

  function toast(message, type = 'info') {
    const container = $('toast');
    const el = document.createElement('div');
    const colors = {
      info: 'bg-ink text-white',
      success: 'bg-ggreen text-white',
      error: 'bg-gred text-white',
    };
    el.className = `toast-item ${colors[type] || colors.info} text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg max-w-xs`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, 2600);
  }

  /* ------------------------- view switching ------------------------- */
  function showView(view) {
    state.view = view;
    ['authView', 'userView', 'adminView'].forEach(id => $(id).classList.add('hidden'));
    if (view === 'auth') {
      $('authView').classList.remove('hidden');
      $('navbar').classList.add('hidden');
    } else {
      $(view + 'View').classList.remove('hidden');
      $('navbar').classList.remove('hidden');
    }
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('nav-link-active', btn.dataset.nav === view);
    });
    if (view === 'user') renderDocGrid();
    if (view === 'admin') renderAdminTable();
    refreshIcons();
  }

  /* ------------------------- navbar ------------------------- */
  function renderNavbar(user) {
    $('userName').textContent = user.name;
    $('userAvatar').textContent = (user.name || '?').trim().charAt(0).toUpperCase();
    $('coinCount').textContent = user.coins;
    $('coinBadge').classList.remove('hidden');
    $('coinBadge').classList.add('flex');
    const isAdmin = user.role === 'admin';
    $('navAdminBtn').classList.toggle('hidden', !isAdmin);
    $('navAdminBtnMobile').classList.toggle('hidden', !isAdmin);
  }

  function bumpCoins(newCount) {
    $('coinCount').textContent = newCount;
    const badge = $('coinBadge');
    badge.classList.remove('coin-bump');
    void badge.offsetWidth; // reflow to restart animation
    badge.classList.add('coin-bump');
  }

  /* ------------------------- auth ------------------------- */
  function initAuth() {
    $('tabLogin').addEventListener('click', () => switchAuthTab('login'));
    $('tabRegister').addEventListener('click', () => switchAuthTab('register'));

    $('fillAdminBtn').addEventListener('click', () => {
      $('loginEmail').value = 'admin@mystrim.com';
      $('loginPassword').value = 'Admin@2026';
    });

    $('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('loginEmail').value.trim();
      const password = $('loginPassword').value;
      const user = UserStore.verify(email, password);
      if (!user) {
        showError('loginError', 'Incorrect email or password.');
        return;
      }
      hideError('loginError');
      Session.set(user.id);
      afterLogin(user);
    });

    $('registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('regName').value.trim();
      const email = $('regEmail').value.trim();
      const password = $('regPassword').value;

      if (!name || !email || password.length < 6) {
        showError('registerError', 'Please fill all fields (password 6+ characters).');
        return;
      }
      if (UserStore.findByEmail(email)) {
        showError('registerError', 'An account with this email already exists.');
        return;
      }
      hideError('registerError');
      const user = UserStore.create({ name, email, password, role: 'user' });
      Session.set(user.id);
      toast(`Welcome, ${user.name}!`, 'success');
      afterLogin(user);
    });

    $('logoutBtn').addEventListener('click', () => {
      Session.clear();
      $('loginForm').reset();
      $('registerForm').reset();
      switchAuthTab('login');
      showView('auth');
      toast('Logged out.', 'info');
    });
  }

  function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    $('loginForm').classList.toggle('hidden', !isLogin);
    $('registerForm').classList.toggle('hidden', isLogin);
    $('tabLogin').classList.toggle('text-gblue', isLogin);
    $('tabLogin').classList.toggle('border-gblue', isLogin);
    $('tabLogin').classList.toggle('text-sub', !isLogin);
    $('tabLogin').classList.toggle('border-transparent', !isLogin);
    $('tabRegister').classList.toggle('text-gblue', !isLogin);
    $('tabRegister').classList.toggle('border-gblue', !isLogin);
    $('tabRegister').classList.toggle('text-sub', isLogin);
    $('tabRegister').classList.toggle('border-transparent', isLogin);
  }

  function showError(id, msg) {
    const el = $(id);
    el.textContent = msg;
    el.classList.remove('hidden');
  }
  function hideError(id) {
    $(id).classList.add('hidden');
  }

  function afterLogin(user) {
    renderNavbar(user);
    showView(user.role === 'admin' ? 'admin' : 'user');
  }

  /* ------------------------- user: document grid ------------------------- */
  function renderDocGrid() {
    const user = Session.currentUser();
    if (!user) return;
    const docs = DocStore.all()
      .filter(d => d.title.toLowerCase().includes(state.docSearch.toLowerCase()))
      .sort((a, b) => a.volume - b.volume);

    const grid = $('docGrid');
    grid.innerHTML = '';
    $('docEmptyState').classList.toggle('hidden', docs.length > 0);
    $('docEmptyState').classList.toggle('flex', docs.length === 0);

    docs.forEach(doc => {
      const completion = user.completed[doc.id];
      const passed = !!(completion && completion.passed);
      const hasQuiz = doc.quiz.length > 0;

      const card = document.createElement('button');
      card.className = 'doc-card text-left bg-white border border-line rounded-xl2 p-5 flex flex-col gap-3';
      card.innerHTML = `
        <div class="flex items-start justify-between">
          <span class="text-xs font-medium text-gblue bg-gblue-soft px-2.5 py-1 rounded-full">Vol. ${escapeHtml(doc.volume)}</span>
          ${passed
            ? `<span class="inline-flex items-center gap-1 text-xs font-medium text-ggreen bg-ggreen-soft px-2.5 py-1 rounded-full"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>Completed</span>`
            : ''
          }
        </div>
        <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
          <i data-lucide="file-text" class="w-5 h-5 text-sub"></i>
        </div>
        <h3 class="font-medium text-ink leading-snug line-clamp-2">${escapeHtml(doc.title)}</h3>
        <div class="flex items-center justify-between text-xs text-sub mt-auto pt-1">
          <span class="inline-flex items-center gap-1"><i data-lucide="help-circle" class="w-3.5 h-3.5"></i>${hasQuiz ? doc.quiz.length + ' questions' : 'No quiz yet'}</span>
          <span class="inline-flex items-center gap-1 text-gyellow font-medium"><i data-lucide="coins" class="w-3.5 h-3.5"></i>${COIN_REWARD}</span>
        </div>
      `;
      card.addEventListener('click', () => openDocModal(doc.id));
      grid.appendChild(card);
    });
    refreshIcons();
  }

  $('docSearch') && $('docSearch').addEventListener('input', (e) => {
    state.docSearch = e.target.value;
    renderDocGrid();
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /* ------------------------- doc detail modal ------------------------- */
  function toEmbedUrl(url) {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://docs.google.com/document/d/${match[1]}/preview`;
    return url;
  }

  function openDocModal(docId) {
    const doc = DocStore.findById(docId);
    if (!doc) return;
    state.activeDocId = docId;
    $('docModalVolume').textContent = `Volume ${doc.volume}`;
    $('docModalTitle').textContent = doc.title;
    $('docModalFrame').src = toEmbedUrl(doc.url);
    $('docModalOpenLink').href = doc.url;
    openModal('docModal');
    refreshIcons();
  }

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  $('docModalQuizBtn').addEventListener('click', () => {
    if (!state.activeDocId) return;
    startQuiz(state.activeDocId);
  });

  /* ------------------------- quiz engine ------------------------- */
  function startQuiz(docId) {
    const doc = DocStore.findById(docId);
    if (!doc) return;

    $('quizModalTitle').textContent = doc.title;
    $('quizResultState').classList.add('hidden');
    $('quizResultState').classList.remove('flex');

    if (!doc.quiz || doc.quiz.length === 0) {
      $('quizQuestionState').classList.add('hidden');
      $('quizQuestionState').classList.remove('flex');
      $('quizNoneState').classList.remove('hidden');
      $('quizNoneState').classList.add('flex');
      $('quizProgressBar').style.width = '0%';
      openModal('quizModal');
      refreshIcons();
      return;
    }

    $('quizNoneState').classList.add('hidden');
    $('quizNoneState').classList.remove('flex');

    // shuffle a shallow copy so repeat attempts feel fresh
    const questions = shuffle(doc.quiz.slice());

    state.quiz = {
      docId,
      questions,
      index: 0,
      score: 0,
      selected: null,
      answered: false,
    };

    openModal('quizModal');
    renderQuizQuestion();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderQuizQuestion() {
    const q = state.quiz;
    const question = q.questions[q.index];

    $('quizQuestionState').classList.remove('hidden');
    $('quizQuestionState').classList.add('flex');
    $('quizQuestionCounter').textContent = `Question ${q.index + 1} of ${q.questions.length}`;
    $('quizQuestionText').textContent = question.question;
    $('quizProgressBar').style.width = `${Math.round((q.index / q.questions.length) * 100)}%`;
    $('quizNextBtn').classList.add('hidden');

    const optionsWrap = $('quizOptions');
    optionsWrap.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    question.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.innerHTML = `<span class="opt-letter">${letters[idx]}</span><span>${escapeHtml(optText)}</span>`;
      btn.addEventListener('click', () => selectQuizOption(idx));
      optionsWrap.appendChild(btn);
    });
    refreshIcons();
  }

  function selectQuizOption(idx) {
    const q = state.quiz;
    if (q.answered) return;
    q.answered = true;
    q.selected = idx;

    const question = q.questions[q.index];
    const correct = idx === question.correctIndex;
    if (correct) q.score++;

    const buttons = $('quizOptions').querySelectorAll('.quiz-option');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === question.correctIndex) {
        btn.classList.add('quiz-option-correct');
      } else if (i === idx) {
        btn.classList.add('quiz-option-wrong');
      }
    });

    $('quizNextBtn').textContent = q.index === q.questions.length - 1 ? 'See results' : 'Next';
    $('quizNextBtn').classList.remove('hidden');
  }

  $('quizNextBtn').addEventListener('click', () => {
    const q = state.quiz;
    if (q.index < q.questions.length - 1) {
      q.index++;
      q.answered = false;
      q.selected = null;
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  });

  function finishQuiz() {
    const q = state.quiz;
    const total = q.questions.length;
    const percentage = Math.round((q.score / total) * 100);
    const passed = percentage >= PASS_THRESHOLD;

    $('quizProgressBar').style.width = '100%';
    $('quizQuestionState').classList.add('hidden');
    $('quizQuestionState').classList.remove('flex');

    const user = Session.currentUser();
    const prior = user.completed[q.docId] || { attempts: 0, bestScore: 0, passed: false };
    const alreadyPassed = !!prior.passed;
    const newlyAwarded = passed && !alreadyPassed;

    const updatedCompleted = {
      ...user.completed,
      [q.docId]: {
        attempts: prior.attempts + 1,
        bestScore: Math.max(prior.bestScore, percentage),
        passed: prior.passed || passed,
      }
    };

    let updatedUser = user;
    if (newlyAwarded) {
      updatedUser = UserStore.update(user.id, {
        completed: updatedCompleted,
        coins: user.coins + COIN_REWARD,
      });
      bumpCoins(updatedUser.coins);
      toast(`Nice! +${COIN_REWARD} coins earned`, 'success');
    } else {
      updatedUser = UserStore.update(user.id, { completed: updatedCompleted });
    }

    renderResultScreen(percentage, q.score, total, passed, newlyAwarded, alreadyPassed);
  }

  function renderResultScreen(percentage, correct, total, passed, newlyAwarded, alreadyPassed) {
    $('quizResultState').classList.remove('hidden');
    $('quizResultState').classList.add('flex');

    $('quizResultScore').textContent = `${percentage}%`;
    $('quizResultLabel').textContent = `You got ${correct} of ${total} correct`;

    const iconWrap = $('quizResultIconWrap');
    const icon = $('quizResultIcon');
    if (passed) {
      iconWrap.className = 'w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-ggreen-soft';
      icon.setAttribute('data-lucide', 'trophy');
      icon.className = 'w-8 h-8 text-ggreen';
    } else {
      iconWrap.className = 'w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gred-soft';
      icon.setAttribute('data-lucide', 'refresh-ccw');
      icon.className = 'w-8 h-8 text-gred';
    }

    $('quizResultCoins').classList.toggle('hidden', !newlyAwarded);
    $('quizResultRetryNote').classList.toggle('hidden', passed);
    if (passed && alreadyPassed && !newlyAwarded) {
      $('quizResultRetryNote').textContent = 'You already earned coins for this document.';
      $('quizResultRetryNote').classList.remove('hidden');
    } else if (!passed) {
      $('quizResultRetryNote').textContent = 'You need 80% to earn coins. Give it another try!';
    }

    refreshIcons();
  }

  $('quizRetryBtn').addEventListener('click', () => {
    if (state.quiz) startQuiz(state.quiz.docId);
  });

  $('quizDoneBtn').addEventListener('click', () => {
    closeModal('quizModal');
    closeModal('docModal');
    state.quiz = null;
    renderDocGrid();
  });

  /* ------------------------- admin: documents table ------------------------- */
  function renderAdminTable() {
    const docs = DocStore.all().sort((a, b) => a.volume - b.volume);
    const tbody = $('adminDocTableBody');
    tbody.innerHTML = '';
    $('adminEmptyState').classList.toggle('hidden', docs.length > 0);
    $('adminEmptyState').classList.toggle('flex', docs.length === 0);

    docs.forEach(doc => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface/60';
      tr.innerHTML = `
        <td class="px-5 py-3.5 font-medium text-ink max-w-[220px] truncate">${escapeHtml(doc.title)}</td>
        <td class="px-5 py-3.5 text-sub">${escapeHtml(doc.volume)}</td>
        <td class="px-5 py-3.5 text-sub">${doc.quiz.length} question${doc.quiz.length === 1 ? '' : 's'}</td>
        <td class="px-5 py-3.5 text-sub max-w-[220px] truncate">
          <a href="${doc.url}" target="_blank" rel="noopener" class="text-gblue hover:underline">${escapeHtml(doc.url)}</a>
        </td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end gap-1">
            <button data-action="quiz" class="p-2 rounded-full hover:bg-surface" title="Manage quiz"><i data-lucide="list-checks" class="w-4 h-4 text-sub"></i></button>
            <button data-action="edit" class="p-2 rounded-full hover:bg-surface" title="Edit"><i data-lucide="pencil" class="w-4 h-4 text-sub"></i></button>
            <button data-action="delete" class="p-2 rounded-full hover:bg-surface" title="Delete"><i data-lucide="trash-2" class="w-4 h-4 text-gred"></i></button>
          </div>
        </td>
      `;
      tr.querySelector('[data-action="quiz"]').addEventListener('click', () => openQuizManageModal(doc.id));
      tr.querySelector('[data-action="edit"]').addEventListener('click', () => openDocForm(doc.id));
      tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
        confirmAction(
          'Delete document?',
          `"${doc.title}" and its quiz will be permanently removed.`,
          () => {
            DocStore.remove(doc.id);
            renderAdminTable();
            toast('Document deleted.', 'success');
          }
        );
      });
      tbody.appendChild(tr);
    });
    refreshIcons();
  }

  $('addDocBtn').addEventListener('click', () => openDocForm(null));

  function openDocForm(docId) {
    state.editingDocId = docId;
    const doc = docId ? DocStore.findById(docId) : null;
    $('docFormTitle').textContent = doc ? 'Edit document' : 'Add document';
    $('docFormId').value = doc ? doc.id : '';
    $('docFormTitleInput').value = doc ? doc.title : '';
    $('docFormUrl').value = doc ? doc.url : '';
    $('docFormVolume').value = doc ? doc.volume : '';
    openModal('docFormModal');
    refreshIcons();
  }

  $('docForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('docFormId').value;
    const payload = {
      title: $('docFormTitleInput').value.trim(),
      url: $('docFormUrl').value.trim(),
      volume: Number($('docFormVolume').value),
    };
    if (!payload.title || !payload.url || !payload.volume) return;

    if (id) {
      DocStore.update(id, payload);
      toast('Document updated.', 'success');
    } else {
      DocStore.create(payload);
      toast('Document added.', 'success');
    }
    closeModal('docFormModal');
    renderAdminTable();
  });

  /* ------------------------- admin: manage quiz ------------------------- */
  function openQuizManageModal(docId) {
    state.manageDocId = docId;
    renderQuizManageList();
    $('quizQuestionForm').reset();
    openModal('quizManageModal');
  }

  function renderQuizManageList() {
    const doc = DocStore.findById(state.manageDocId);
    if (!doc) return;
    $('quizManageTitle').textContent = doc.title;

    const list = $('quizManageList');
    list.innerHTML = '';
    $('quizManageEmpty').classList.toggle('hidden', doc.quiz.length > 0);

    const letters = ['A', 'B', 'C', 'D'];
    doc.quiz.forEach((q, i) => {
      const item = document.createElement('div');
      item.className = 'border border-line rounded-lg p-4';
      item.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm font-medium text-ink">${i + 1}. ${escapeHtml(q.question)}</p>
          <button data-del class="p-1.5 rounded-full hover:bg-surface shrink-0" title="Delete question">
            <i data-lucide="trash-2" class="w-4 h-4 text-gred"></i>
          </button>
        </div>
        <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          ${q.options.map((opt, idx) => `
            <div class="text-xs px-2.5 py-1.5 rounded-md ${idx === q.correctIndex ? 'bg-ggreen-soft text-ggreen font-medium' : 'bg-surface text-sub'}">
              ${letters[idx]}. ${escapeHtml(opt)}
            </div>
          `).join('')}
        </div>
      `;
      item.querySelector('[data-del]').addEventListener('click', () => {
        confirmAction('Delete question?', 'This question will be removed from the quiz.', () => {
          DocStore.removeQuestion(doc.id, q.id);
          renderQuizManageList();
          renderAdminTable();
          toast('Question deleted.', 'success');
        });
      });
      list.appendChild(item);
    });
    refreshIcons();
  }

  $('quizQuestionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const question = $('qFormText').value.trim();
    const options = [$('qOpt0').value.trim(), $('qOpt1').value.trim(), $('qOpt2').value.trim(), $('qOpt3').value.trim()];
    const correctIndex = Number(document.querySelector('input[name="qCorrect"]:checked').value);
    if (!question || options.some(o => !o)) return;

    DocStore.addQuestion(state.manageDocId, { question, options, correctIndex });
    $('quizQuestionForm').reset();
    renderQuizManageList();
    renderAdminTable();
    toast('Question added.', 'success');
  });

  /* ------------------------- generic confirm modal ------------------------- */
  let pendingConfirm = null;
  function confirmAction(title, message, onConfirm) {
    $('confirmTitle').textContent = title;
    $('confirmMessage').textContent = message;
    pendingConfirm = onConfirm;
    openModal('confirmModal');
  }
  $('confirmOkBtn').addEventListener('click', () => {
    if (pendingConfirm) pendingConfirm();
    pendingConfirm = null;
    closeModal('confirmModal');
  });
  $('confirmCancelBtn').addEventListener('click', () => {
    pendingConfirm = null;
    closeModal('confirmModal');
  });

  /* ------------------------- nav clicks ------------------------- */
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.nav));
  });

  /* close modals on backdrop click */
  ['docModal', 'quizModal', 'docFormModal', 'quizManageModal', 'confirmModal'].forEach(id => {
    $(id).addEventListener('click', (e) => {
      if (e.target === $(id)) {
        if (id === 'quizModal' && state.quiz) return; // avoid accidental close mid-quiz
        closeModal(id);
      }
    });
  });

  /* ------------------------- init ------------------------- */
  function init() {
    seedIfNeeded();
    initAuth();
    switchAuthTab('login');

    const user = Session.currentUser();
    if (user) {
      renderNavbar(user);
      showView(user.role === 'admin' ? 'admin' : 'user');
    } else {
      showView('auth');
    }
    refreshIcons();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
