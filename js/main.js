var state = {
  view: 'auth',
  docSearch: '',
  activeDocId: null,
  quiz: null,
  editingDocId: null,
  manageDocId: null
};

function escapeHtml(text) {
  if (text === undefined || text === null) {
    return '';
  }
  var str = text + '';
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  str = str.replace(/"/g, '&quot;');
  str = str.replace(/'/g, '&#039;');
  return str;
}

function refreshIcons() {
  if (window.lucide) {
    try {
      window.lucide.createIcons();
    } catch (e) {
    }
  }
}

function openModal(id) {
  var modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
  }
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
  var anyOpen = false;
  var modals = ['docModal', 'quizModal', 'docFormModal', 'quizManageModal', 'confirmModal'];
  for (var i = 0; i < modals.length; i++) {
    var m = document.getElementById(modals[i]);
    if (m && !m.classList.contains('hidden')) {
      anyOpen = true;
      break;
    }
  }
  if (!anyOpen) {
    document.body.style.overflow = '';
  }
}

function toast(message, type) {
  if (type === undefined) {
    type = 'info';
  }
  var container = document.getElementById('toast');
  if (!container) {
    return;
  }
  var el = document.createElement('div');
  var colors = 'bg-ink text-white';
  if (type === 'success') {
    colors = 'bg-ggreen text-white';
  }
  if (type === 'error') {
    colors = 'bg-gred text-white';
  }
  el.className = 'toast-item ' + colors + ' text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg max-w-xs';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(function() {
    el.style.transition = 'opacity 0.25s ease';
    el.style.opacity = '0';
    setTimeout(function() {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 250);
  }, 2600);
}

function showError(id, message) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
}

function hideError(id) {
  var el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
  }
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    var tl = document.getElementById('tabLogin');
    var tr = document.getElementById('tabRegister');
    if (tl) {
      tl.classList.add('text-gblue');
      tl.classList.remove('text-sub');
      tl.classList.add('border-gblue');
      tl.classList.remove('border-transparent');
    }
    if (tr) {
      tr.classList.remove('text-gblue');
      tr.classList.add('text-sub');
      tr.classList.remove('border-gblue');
      tr.classList.add('border-transparent');
    }
    var lf = document.getElementById('loginForm');
    var rf = document.getElementById('registerForm');
    if (lf) {
      lf.classList.remove('hidden');
    }
    if (rf) {
      rf.classList.add('hidden');
    }
    hideError('loginError');
    hideError('registerError');
  } else {
    var tl2 = document.getElementById('tabLogin');
    var tr2 = document.getElementById('tabRegister');
    if (tr2) {
      tr2.classList.add('text-gblue');
      tr2.classList.remove('text-sub');
      tr2.classList.add('border-gblue');
      tr2.classList.remove('border-transparent');
    }
    if (tl2) {
      tl2.classList.remove('text-gblue');
      tl2.classList.add('text-sub');
      tl2.classList.remove('border-gblue');
      tl2.classList.add('border-transparent');
    }
    var lf2 = document.getElementById('loginForm');
    var rf2 = document.getElementById('registerForm');
    if (rf2) {
      rf2.classList.remove('hidden');
    }
    if (lf2) {
      lf2.classList.add('hidden');
    }
    hideError('loginError');
    hideError('registerError');
  }
}

function showView(view) {
  state.view = view;
  var authv = document.getElementById('authView');
  var uv = document.getElementById('userView');
  var av = document.getElementById('adminView');
  if (authv) {
    authv.classList.add('hidden');
  }
  if (uv) {
    uv.classList.add('hidden');
  }
  if (av) {
    av.classList.add('hidden');
  }
  if (view === 'auth') {
    if (authv) {
      authv.classList.remove('hidden');
    }
    var nav = document.getElementById('navbar');
    if (nav) {
      nav.classList.add('hidden');
    }
  } else {
    var v = document.getElementById(view + 'View');
    if (v) {
      v.classList.remove('hidden');
    }
    var nav2 = document.getElementById('navbar');
    if (nav2) {
      nav2.classList.remove('hidden');
    }
  }
  var navLinks = document.querySelectorAll('.nav-link');
  for (var i = 0; i < navLinks.length; i++) {
    if (navLinks[i].dataset.nav === view) {
      navLinks[i].classList.add('nav-link-active');
    } else {
      navLinks[i].classList.remove('nav-link-active');
    }
  }
  if (view === 'user') {
    renderDocGrid();
  }
  if (view === 'admin') {
    renderAdminTable();
  }
  refreshIcons();
}

function renderNavbar(user) {
  var un = document.getElementById('userName');
  if (un) {
    un.textContent = user.name;
  }
  var ua = document.getElementById('userAvatar');
  if (ua) {
    ua.textContent = (user.name || '?').trim().charAt(0).toUpperCase();
  }
  var cc = document.getElementById('coinCount');
  if (cc) {
    cc.textContent = user.coins;
  }
  var cb = document.getElementById('coinBadge');
  if (cb) {
    cb.classList.remove('hidden');
    cb.classList.add('flex');
  }
  if (user.role === 'admin') {
    var nab = document.getElementById('navAdminBtn');
    var nabm = document.getElementById('navAdminBtnMobile');
    if (nab) {
      nab.classList.remove('hidden');
    }
    if (nabm) {
      nabm.classList.remove('hidden');
    }
  } else {
    var nab2 = document.getElementById('navAdminBtn');
    var nabm2 = document.getElementById('navAdminBtnMobile');
    if (nab2) {
      nab2.classList.add('hidden');
    }
    if (nabm2) {
      nabm2.classList.add('hidden');
    }
  }
}

function bumpCoins(newCount) {
  var cc2 = document.getElementById('coinCount');
  if (cc2) {
    cc2.textContent = newCount;
  }
  var badge = document.getElementById('coinBadge');
  if (!badge) {
    return;
  }
  badge.classList.remove('coin-bump');
  void badge.offsetWidth;
  badge.classList.add('coin-bump');
}

function afterLogin(user) {
  var current = getCurrentUser();
  if (!current) {
    current = user;
  }
  renderNavbar(current);
  if (current.role === 'admin') {
    showView('admin');
  } else {
    showView('user');
  }
}

function initAuth() {
  var tl = document.getElementById('tabLogin');
  if (tl) {
    tl.addEventListener('click', function() {
      switchAuthTab('login');
    });
  }
  var tr = document.getElementById('tabRegister');
  if (tr) {
    tr.addEventListener('click', function() {
      switchAuthTab('register');
    });
  }
  var fab = document.getElementById('fillAdminBtn');
  if (fab) {
    fab.addEventListener('click', function() {
      var le = document.getElementById('loginEmail');
      var lp = document.getElementById('loginPassword');
      if (le) {
        le.value = 'admin@mystrim.com';
      }
      if (lp) {
        lp.value = 'Admin@2026';
      }
    });
  }
  var lf = document.getElementById('loginForm');
  if (lf) {
    lf.addEventListener('submit', function(e) {
      e.preventDefault();
      var le2 = document.getElementById('loginEmail');
      var lp2 = document.getElementById('loginPassword');
      var email = le2 ? le2.value.trim() : '';
      var password = lp2 ? lp2.value : '';
      var user = verifyUser(email, password);
      if (!user) {
        showError('loginError', 'Incorrect email or password.');
        return;
      }
      hideError('loginError');
      setSession(user.id);
      afterLogin(user);
    });
  }
  var rf = document.getElementById('registerForm');
  if (rf) {
    rf.addEventListener('submit', function(e) {
      e.preventDefault();
      var rn = document.getElementById('regName');
      var re = document.getElementById('regEmail');
      var rp = document.getElementById('regPassword');
      var rc = document.getElementById('regConfirm');
      var name = rn ? rn.value.trim() : '';
      var email = re ? re.value.trim() : '';
      var password = rp ? rp.value : '';
      var confirm = rc ? rc.value : '';
      hideError('registerError');
      if (name === '' || email === '' || password === '' || confirm === '') {
        showError('registerError', 'All fields are required.');
        return;
      }
      if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        showError('registerError', 'Passwords do not match.');
        return;
      }
      if (findUserByEmail(email)) {
        showError('registerError', 'An account with this email already exists.');
        return;
      }
      var user = createUser({ name: name, email: email, password: password, role: 'user' });
      setSession(user.id);
      renderNavbar(getCurrentUser());
      showView('user');
      toast('Welcome, ' + user.name + '!', 'success');
    });
  }
}

function initNavbar() {
  var lob = document.getElementById('logoutBtn');
  if (lob) {
    lob.addEventListener('click', function() {
      clearSession();
      var lf = document.getElementById('loginForm');
      var rf = document.getElementById('registerForm');
      if (lf && lf.reset) {
        lf.reset();
      }
      if (rf && rf.reset) {
        rf.reset();
      }
      switchAuthTab('login');
      showView('auth');
      toast('Logged out.', 'info');
    });
  }
  var navLinks = document.querySelectorAll('.nav-link');
  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener('click', function() {
      var nav = this.dataset.nav;
      if (nav === 'user') {
        showView('user');
      }
      if (nav === 'admin') {
        showView('admin');
      }
    });
  }
}

function getDocPreviewUrl(url) {
  var parts = (url + '').split('/d/');
  if (parts.length < 2) {
    return url;
  }
  var idPart = parts[1].split('/')[0];
  return 'https://docs.google.com/document/d/' + idPart + '/preview';
}

function openDoc(id) {
  var doc = findDocById(id);
  if (!doc) {
    return;
  }
  state.activeDocId = id;
  var dmt = document.getElementById('docModalTitle');
  if (dmt) {
    dmt.textContent = doc.title;
  }
  var dmv = document.getElementById('docModalVolume');
  if (dmv) {
    dmv.textContent = 'Volume ' + doc.volume;
  }
  var preview = getDocPreviewUrl(doc.url);
  var df = document.getElementById('docFrame');
  if (df) {
    df.src = preview;
  }
  var parts = (doc.url + '').split('/d/');
  var docIdPart = parts.length > 1 ? parts[1].split('/')[0] : '';
  var openUrl = 'https://docs.google.com/document/d/' + docIdPart + '/edit';
  var onb = document.getElementById('docOpenNewTab');
  if (onb) {
    onb.href = openUrl;
  }
  var tqb = document.getElementById('takeQuizBtn');
  var noq = document.getElementById('noQuizNote');
  if (!doc.quiz || doc.quiz.length === 0) {
    if (tqb) {
      tqb.classList.add('hidden');
    }
    if (noq) {
      noq.classList.remove('hidden');
    }
  } else {
    if (tqb) {
      tqb.classList.remove('hidden');
    }
    if (noq) {
      noq.classList.add('hidden');
    }
  }
  openModal('docModal');
}

function closeDocModal() {
  var df = document.getElementById('docFrame');
  if (df) {
    df.src = 'about:blank';
  }
  closeModal('docModal');
}

function shuffleArray(arr) {
  var array = arr.slice();
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function startQuiz() {
  var doc = findDocById(state.activeDocId);
  if (!doc || !doc.quiz || doc.quiz.length === 0) {
    return;
  }
  var questions = shuffleArray(doc.quiz);
  state.quiz = {
    docId: doc.id,
    questions: questions,
    index: 0,
    score: 0,
    selected: null,
    answered: false,
    coinAwarded: false
  };
  closeDocModal();
  renderQuiz();
  openModal('quizModal');
}

function renderQuiz() {
  var quiz = state.quiz;
  if (!quiz) {
    return;
  }
  var qp = document.getElementById('quizProgress');
  if (qp) {
    qp.textContent = 'Question ' + (quiz.index + 1) + ' of ' + quiz.questions.length;
  }
  var pct = ((quiz.index) / quiz.questions.length) * 100;
  var qbar = document.getElementById('quizBar');
  if (qbar) {
    qbar.style.width = pct + '%';
  }
  var q = quiz.questions[quiz.index];
  var qq = document.getElementById('quizQuestion');
  if (qq) {
    qq.textContent = q.question;
  }
  var optionsDiv = document.getElementById('quizOptions');
  if (!optionsDiv) {
    return;
  }
  optionsDiv.innerHTML = '';
  for (var i = 0; i < q.options.length; i++) {
    var btn = document.createElement('button');
    btn.className = 'quiz-option w-full text-left px-4 py-3 rounded-lg border border-line hover:bg-surface transition flex items-start gap-3';
    btn.innerHTML = '<span class="w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center text-sm font-medium flex-shrink-0">' + String.fromCharCode(65 + i) + '</span><span class="text-sm text-ink pt-0.5">' + escapeHtml(q.options[i]) + '</span>';
    btn.setAttribute('data-idx', i);
    btn.onclick = (function(idx, button) {
      return function() {
        selectQuizOption(idx, button);
      };
    })(i, btn);
    optionsDiv.appendChild(btn);
  }
  var qnb = document.getElementById('quizNextBtn');
  if (qnb) {
    qnb.classList.add('hidden');
    if (quiz.index === quiz.questions.length - 1) {
      qnb.textContent = 'See results';
    } else {
      qnb.textContent = 'Next';
    }
  }
  refreshIcons();
}

function selectQuizOption(idx, btn) {
  var quiz = state.quiz;
  if (!quiz || quiz.answered) {
    return;
  }
  quiz.selected = idx;
  quiz.answered = true;
  var q = quiz.questions[quiz.index];
  var optionsDiv = document.getElementById('quizOptions');
  if (!optionsDiv) {
    return;
  }
  var optionBtns = optionsDiv.getElementsByTagName('button');
  for (var i = 0; i < optionBtns.length; i++) {
    optionBtns[i].disabled = true;
    optionBtns[i].classList.remove('hover:bg-surface');
    if (i === q.correctIndex) {
      optionBtns[i].classList.add('bg-ggreen-soft');
      optionBtns[i].classList.add('border-ggreen');
    } else if (i === idx) {
      optionBtns[i].classList.add('bg-gred-soft');
      optionBtns[i].classList.add('border-gred');
    }
  }
  if (idx === q.correctIndex) {
    quiz.score = quiz.score + 1;
  }
  var qnb2 = document.getElementById('quizNextBtn');
  if (qnb2) {
    qnb2.classList.remove('hidden');
  }
}

function nextQuiz() {
  var quiz = state.quiz;
  if (!quiz) {
    return;
  }
  if (quiz.index < quiz.questions.length - 1) {
    quiz.index = quiz.index + 1;
    quiz.answered = false;
    quiz.selected = null;
    renderQuiz();
    return;
  }
  showQuizResults();
}

function showQuizResults() {
  var quiz = state.quiz;
  if (!quiz) {
    return;
  }
  var total = quiz.questions.length;
  var score = quiz.score;
  var pct = Math.round((score / total) * 100);
  var qqr = document.getElementById('quizQuestion');
  if (qqr) {
    qqr.textContent = 'Results';
  }
  var qpr = document.getElementById('quizProgress');
  if (qpr) {
    qpr.textContent = score + ' of ' + total + ' correct';
  }
  var qbrr = document.getElementById('quizBar');
  if (qbrr) {
    qbrr.style.width = '100%';
  }
  var optionsDiv = document.getElementById('quizOptions');
  if (optionsDiv) {
    optionsDiv.innerHTML = '';
    var resultDiv = document.createElement('div');
    resultDiv.className = 'text-center py-6';
    if (pct >= PASS_THRESHOLD) {
      resultDiv.innerHTML = '<div class="w-16 h-16 rounded-full bg-ggreen-soft flex items-center justify-center mx-auto mb-3"><i data-lucide="trophy" class="w-8 h-8 text-ggreen"></i></div><div class="text-3xl font-bold text-ink">' + pct + '%</div><div class="text-sm text-sub mt-1">You got ' + score + ' of ' + total + ' correct</div>';
    } else {
      resultDiv.innerHTML = '<div class="w-16 h-16 rounded-full bg-gred-soft flex items-center justify-center mx-auto mb-3"><i data-lucide="refresh-cw" class="w-8 h-8 text-gred"></i></div><div class="text-3xl font-bold text-ink">' + pct + '%</div><div class="text-sm text-sub mt-1">You got ' + score + ' of ' + total + ' correct</div>';
    }
    optionsDiv.appendChild(resultDiv);
  }
  var qnb3 = document.getElementById('quizNextBtn');
  if (qnb3) {
    qnb3.classList.add('hidden');
  }
  var actionDiv = document.getElementById('quizActions');
  if (!actionDiv) {
    return;
  }
  actionDiv.innerHTML = '';
  var user = getCurrentUser();
  if (pct >= PASS_THRESHOLD && user) {
    if (!quiz.coinAwarded) {
      var completed = user.completed || {};
      var alreadyPassed = completed[quiz.docId] && completed[quiz.docId].passed;
      if (!alreadyPassed) {
        var newCoins = (user.coins || 0) + COIN_REWARD;
        user.coins = newCoins;
        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
          if (users[i].id === user.id) {
            users[i] = user;
            break;
          }
        }
        saveUsers(users);
        renderNavbar(user);
        bumpCoins(newCoins);
        var banner = document.getElementById('coinEarnedBanner');
        if (banner) {
          banner.classList.remove('hidden');
          setTimeout(function() {
            banner.classList.add('hidden');
          }, 3000);
        }
        toast('+' + COIN_REWARD + ' coins earned', 'success');
        quiz.coinAwarded = true;
      } else {
        var already = document.createElement('div');
        already.className = 'text-sm text-sub text-center mb-2';
        already.textContent = 'You already earned coins for this document.';
        actionDiv.appendChild(already);
      }
    }
    if (!user.completed) {
      user.completed = {};
    }
    user.completed[quiz.docId] = {
      attempts: (user.completed[quiz.docId] ? user.completed[quiz.docId].attempts + 1 : 1),
      bestScore: Math.max((user.completed[quiz.docId] ? user.completed[quiz.docId].bestScore : 0), pct),
      passed: true
    };
    var users2 = getUsers();
    for (var j = 0; j < users2.length; j++) {
      if (users2[j].id === user.id) {
        users2[j] = user;
        break;
      }
    }
    saveUsers(users2);
  } else if (user) {
    if (!user.completed) {
      user.completed = {};
    }
    user.completed[quiz.docId] = {
      attempts: (user.completed[quiz.docId] ? user.completed[quiz.docId].attempts + 1 : 1),
      bestScore: Math.max((user.completed[quiz.docId] ? user.completed[quiz.docId].bestScore : 0), pct),
      passed: user.completed[quiz.docId] ? user.completed[quiz.docId].passed : false
    };
    var users3 = getUsers();
    for (var k = 0; k < users3.length; k++) {
      if (users3[k].id === user.id) {
        users3[k] = user;
        break;
      }
    }
    saveUsers(users3);
    var need = document.createElement('div');
    need.className = 'text-sm text-gred text-center mb-2';
    need.textContent = 'You need 80% to earn coins. Give it another try!';
    actionDiv.appendChild(need);
  }
  var retake = document.createElement('button');
  retake.className = 'px-4 py-2 rounded-full border border-line text-sm font-medium hover:bg-surface';
  retake.textContent = 'Retake quiz';
  retake.onclick = function() {
    startQuiz();
  };
  actionDiv.appendChild(retake);
  var done = document.createElement('button');
  done.className = 'px-4 py-2 rounded-full bg-gblue text-white text-sm font-medium hover:bg-gblue-dark ml-2';
  done.textContent = 'Done';
  done.onclick = function() {
    var qm = document.getElementById('quizModal');
    if (qm) {
      qm.classList.add('hidden');
    }
    var ceb = document.getElementById('coinEarnedBanner');
    if (ceb) {
      ceb.classList.add('hidden');
    }
    document.body.style.overflow = '';
    if (state.view === 'user') {
      renderDocGrid();
    }
    refreshIcons();
  };
  actionDiv.appendChild(done);
  refreshIcons();
}

function renderDocGrid() {
  var container = document.getElementById('docGrid');
  if (!container) {
    return;
  }
  container.innerHTML = '';
  var docs = getDocs().slice();
  docs.sort(function(a, b) {
    if (a.volume < b.volume) return -1;
    if (a.volume > b.volume) return 1;
    return 0;
  });
  var search = (state.docSearch || '').toLowerCase();
  var user = getCurrentUser();
  var filtered = [];
  for (var i = 0; i < docs.length; i++) {
    if ((docs[i].title + '').toLowerCase().indexOf(search) !== -1) {
      filtered.push(docs[i]);
    }
  }
  var de = document.getElementById('docEmpty');
  if (filtered.length === 0) {
    if (de) {
      de.classList.remove('hidden');
    }
    return;
  }
  if (de) {
    de.classList.add('hidden');
  }
  for (var j = 0; j < filtered.length; j++) {
    var doc = filtered[j];
    var card = document.createElement('button');
    card.className = 'text-left bg-white border border-line rounded-xl2 p-5 hover:shadow-sm hover:border-gblue transition relative';
    card.onclick = (function(id) {
      return function() {
        openDoc(id);
      };
    })(doc.id);
    var passed = false;
    if (user && user.completed && user.completed[doc.id] && user.completed[doc.id].passed) {
      passed = true;
    }
    var badge = passed ? '<span class="absolute top-3 right-3 text-xs bg-ggreen-soft text-ggreen px-2 py-0.5 rounded-full">Completed</span>' : '';
    var qCount = doc.quiz ? doc.quiz.length : 0;
    var qText = qCount === 0 ? 'No quiz yet' : qCount + ' questions';
    card.innerHTML = badge + '<div class="flex items-start justify-between mb-2"><div class="text-base font-medium text-ink">' + escapeHtml(doc.title) + '</div></div><div class="flex items-center gap-2 mb-3"><span class="text-xs px-2 py-0.5 rounded-full bg-gblue-soft text-gblue">Volume ' + escapeHtml(doc.volume) + '</span></div><div class="flex items-center justify-between text-xs text-sub"><span>' + qText + '</span><span class="flex items-center gap-1"><i data-lucide="coins" class="w-3.5 h-3.5 text-gyellow"></i> +' + COIN_REWARD + '</span></div>';
    container.appendChild(card);
  }
  refreshIcons();
}

function initUserView() {
  var ds = document.getElementById('docSearch');
  if (ds) {
    ds.addEventListener('input', function(e) {
      state.docSearch = e.target.value;
      renderDocGrid();
    });
  }
  var dmc = document.getElementById('docModalClose');
  if (dmc) {
    dmc.addEventListener('click', closeDocModal);
  }
  var dmb = document.getElementById('docModalBackdrop');
  if (dmb) {
    dmb.addEventListener('click', closeDocModal);
  }
  var tqb2 = document.getElementById('takeQuizBtn');
  if (tqb2) {
    tqb2.addEventListener('click', startQuiz);
  }
}

function renderAdminTable() {
  var tbody = document.getElementById('adminDocTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '';
  var docs = getDocs().slice();
  docs.sort(function(a, b) {
    if (a.volume < b.volume) return -1;
    if (a.volume > b.volume) return 1;
    return 0;
  });
  var ae = document.getElementById('adminEmpty');
  if (docs.length === 0) {
    if (ae) {
      ae.classList.remove('hidden');
    }
    return;
  }
  if (ae) {
    ae.classList.add('hidden');
  }
  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    var tr = document.createElement('tr');
    tr.className = 'border-t border-line';
    var parts = (doc.url + '').split('/d/');
    var docIdPart = parts.length > 1 ? parts[1].split('/')[0] : '';
    var link = 'https://docs.google.com/document/d/' + docIdPart + '/edit';
    var qCount = doc.quiz ? doc.quiz.length : 0;
    tr.innerHTML = '<td class="px-4 py-3 text-sm text-ink">' + escapeHtml(doc.title) + '</td><td class="px-4 py-3 text-sm text-sub">' + escapeHtml(doc.volume) + '</td><td class="px-4 py-3 text-sm text-sub">' + qCount + '</td><td class="px-4 py-3 text-sm"><a href="' + escapeHtml(link) + '" target="_blank" class="text-gblue hover:underline">Open</a></td><td class="px-4 py-3 text-sm text-right"><button onclick="openEditDoc(\'' + escapeHtml(doc.id) + '\')" class="text-gblue hover:underline mr-2">Edit</button><button onclick="openManageQuiz(\'' + escapeHtml(doc.id) + '\')" class="text-gblue hover:underline mr-2">Quiz</button><button onclick="openConfirmDelete(\'' + escapeHtml(doc.id) + '\')" class="text-gred hover:underline">Delete</button></td>';
    tbody.appendChild(tr);
  }
  refreshIcons();
}

function initAdminView() {
  var adb = document.getElementById('addDocBtn');
  if (adb) {
    adb.addEventListener('click', function() {
      state.editingDocId = null;
      var dft = document.getElementById('docFormTitle');
      if (dft) {
        dft.textContent = 'Add document';
      }
      var dfti = document.getElementById('docFormTitleInput');
      if (dfti) {
        dfti.value = '';
      }
      var dfu = document.getElementById('docFormUrlInput');
      if (dfu) {
        dfu.value = '';
      }
      var dfv = document.getElementById('docFormVolumeInput');
      if (dfv) {
        dfv.value = '';
      }
      hideError('docFormError');
      openModal('docFormModal');
    });
  }
  var dfc = document.getElementById('docFormClose');
  if (dfc) {
    dfc.addEventListener('click', function() {
      closeModal('docFormModal');
    });
  }
  var dfb = document.getElementById('docFormBackdrop');
  if (dfb) {
    dfb.addEventListener('click', function() {
      closeModal('docFormModal');
    });
  }
  var dfca = document.getElementById('docFormCancel');
  if (dfca) {
    dfca.addEventListener('click', function() {
      closeModal('docFormModal');
    });
  }
  var dfs = document.getElementById('docFormSave');
  if (dfs) {
    dfs.addEventListener('click', saveDocForm);
  }
}

function openEditDoc(id) {
  var doc = findDocById(id);
  if (!doc) {
    return;
  }
  state.editingDocId = id;
  var dft2 = document.getElementById('docFormTitle');
  if (dft2) {
    dft2.textContent = 'Edit document';
  }
  var dfti2 = document.getElementById('docFormTitleInput');
  if (dfti2) {
    dfti2.value = doc.title;
  }
  var dfu2 = document.getElementById('docFormUrlInput');
  if (dfu2) {
    dfu2.value = doc.url;
  }
  var dfv2 = document.getElementById('docFormVolumeInput');
  if (dfv2) {
    dfv2.value = doc.volume;
  }
  hideError('docFormError');
  openModal('docFormModal');
}

function saveDocForm() {
  var dfti3 = document.getElementById('docFormTitleInput');
  var dfu3 = document.getElementById('docFormUrlInput');
  var dfv3 = document.getElementById('docFormVolumeInput');
  var title = dfti3 ? dfti3.value.trim() : '';
  var url = dfu3 ? dfu3.value.trim() : '';
  var volume = dfv3 ? dfv3.value.trim() : '';
  var errorEl = document.getElementById('docFormError');
  if (errorEl) {
    errorEl.classList.add('hidden');
  }
  if (title === '' || url === '' || volume === '') {
    if (errorEl) {
      errorEl.textContent = 'All fields are required.';
      errorEl.classList.remove('hidden');
    }
    return;
  }
  if (state.editingDocId) {
    updateDoc(state.editingDocId, { title: title, url: url, volume: volume });
    toast('Document updated.', 'success');
  } else {
    createDoc({ title: title, url: url, volume: volume });
    toast('Document added.', 'success');
  }
  closeModal('docFormModal');
  renderAdminTable();
  if (state.view === 'user') {
    renderDocGrid();
  }
}

function openConfirmDelete(id) {
  state.editingDocId = id;
  var ct = document.getElementById('confirmText');
  if (ct) {
    ct.textContent = 'Delete this document? This cannot be undone.';
  }
  openModal('confirmModal');
}

function initConfirmModal() {
  var cc = document.getElementById('confirmClose');
  if (cc) {
    cc.addEventListener('click', function() {
      closeModal('confirmModal');
    });
  }
  var cb = document.getElementById('confirmBackdrop');
  if (cb) {
    cb.addEventListener('click', function() {
      closeModal('confirmModal');
    });
  }
  var cca = document.getElementById('confirmCancel');
  if (cca) {
    cca.addEventListener('click', function() {
      closeModal('confirmModal');
    });
  }
  var cy = document.getElementById('confirmYes');
  if (cy) {
    cy.addEventListener('click', function() {
      if (state.editingDocId) {
        removeDoc(state.editingDocId);
        toast('Document deleted.', 'success');
        state.editingDocId = null;
      }
      closeModal('confirmModal');
      renderAdminTable();
      if (state.view === 'user') {
        renderDocGrid();
      }
    });
  }
}

function openManageQuiz(id) {
  var doc = findDocById(id);
  if (!doc) {
    return;
  }
  state.manageDocId = id;
  var qmt = document.getElementById('quizManageTitle');
  if (qmt) {
    qmt.textContent = 'Manage quiz - ' + doc.title;
  }
  var qq = document.getElementById('qmQuestion');
  if (qq) {
    qq.value = '';
  }
  var o0 = document.getElementById('qmOpt0');
  if (o0) {
    o0.value = '';
  }
  var o1 = document.getElementById('qmOpt1');
  if (o1) {
    o1.value = '';
  }
  var o2 = document.getElementById('qmOpt2');
  if (o2) {
    o2.value = '';
  }
  var o3 = document.getElementById('qmOpt3');
  if (o3) {
    o3.value = '';
  }
  var radios = document.getElementsByName('qmCorrect');
  for (var r = 0; r < radios.length; r++) {
    radios[r].checked = false;
  }
  renderQuizManageList(doc);
  openModal('quizManageModal');
}

function renderQuizManageList(doc) {
  var list = document.getElementById('quizManageList');
  if (!list) {
    return;
  }
  list.innerHTML = '';
  if (!doc.quiz || doc.quiz.length === 0) {
    list.innerHTML = '<div class="text-sm text-sub">No questions yet.</div>';
    return;
  }
  for (var i = 0; i < doc.quiz.length; i++) {
    var q = doc.quiz[i];
    var item = document.createElement('div');
    item.className = 'border border-line rounded-lg p-3 mb-2';
    var opts = '';
    for (var j = 0; j < q.options.length; j++) {
      var isCorrect = j === q.correctIndex;
      if (isCorrect) {
        opts += '<div class="text-xs text-ggreen">' + String.fromCharCode(65 + j) + '. ' + escapeHtml(q.options[j]) + ' (correct)</div>';
      } else {
        opts += '<div class="text-xs text-sub">' + String.fromCharCode(65 + j) + '. ' + escapeHtml(q.options[j]) + '</div>';
      }
    }
    item.innerHTML = '<div class="flex items-start justify-between"><div class="flex-1"><div class="text-sm font-medium text-ink mb-1">' + escapeHtml(q.question) + '</div>' + opts + '</div><button onclick="deleteManageQuestion(\'' + escapeHtml(state.manageDocId) + '\', \'' + escapeHtml(q.id) + '\')" class="text-gred text-sm hover:underline">Delete</button></div>';
    list.appendChild(item);
  }
}

function initQuizManageModal() {
  var qmc = document.getElementById('quizManageClose');
  if (qmc) {
    qmc.addEventListener('click', function() {
      closeModal('quizManageModal');
    });
  }
  var qmb = document.getElementById('quizManageBackdrop');
  if (qmb) {
    qmb.addEventListener('click', function() {
      closeModal('quizManageModal');
    });
  }
  var qmab = document.getElementById('qmAddBtn');
  if (qmab) {
    qmab.addEventListener('click', addManageQuestion);
  }
}

function addManageQuestion() {
  var doc = findDocById(state.manageDocId);
  if (!doc) {
    return;
  }
  var qq2 = document.getElementById('qmQuestion');
  var o02 = document.getElementById('qmOpt0');
  var o12 = document.getElementById('qmOpt1');
  var o22 = document.getElementById('qmOpt2');
  var o32 = document.getElementById('qmOpt3');
  var question = qq2 ? qq2.value.trim() : '';
  var opt0 = o02 ? o02.value.trim() : '';
  var opt1 = o12 ? o12.value.trim() : '';
  var opt2 = o22 ? o22.value.trim() : '';
  var opt3 = o32 ? o32.value.trim() : '';
  var correctIndex = -1;
  var radios = document.getElementsByName('qmCorrect');
  for (var r = 0; r < radios.length; r++) {
    if (radios[r].checked) {
      correctIndex = parseInt(radios[r].value);
      break;
    }
  }
  if (question === '' || opt0 === '' || opt1 === '' || opt2 === '' || opt3 === '' || correctIndex < 0) {
    toast('Fill all fields and select correct answer.', 'error');
    return;
  }
  addQuestion(doc.id, {
    question: question,
    options: [opt0, opt1, opt2, opt3],
    correctIndex: correctIndex
  });
  toast('Question added.', 'success');
  if (qq2) {
    qq2.value = '';
  }
  if (o02) {
    o02.value = '';
  }
  if (o12) {
    o12.value = '';
  }
  if (o22) {
    o22.value = '';
  }
  if (o32) {
    o32.value = '';
  }
  for (var r2 = 0; r2 < radios.length; r2++) {
    radios[r2].checked = false;
  }
  var updated = findDocById(doc.id);
  renderQuizManageList(updated);
  renderAdminTable();
  if (state.view === 'user') {
    renderDocGrid();
  }
}

function deleteManageQuestion(docId, qId) {
  if (!confirm('Delete this question?')) {
    return;
  }
  removeQuestion(docId, qId);
  toast('Question deleted.', 'success');
  var updated = findDocById(docId);
  renderQuizManageList(updated);
  renderAdminTable();
  if (state.view === 'user') {
    renderDocGrid();
  }
}

function initModals() {
  var modals = ['docModal', 'quizModal', 'docFormModal', 'quizManageModal', 'confirmModal'];
  for (var i = 0; i < modals.length; i++) {
    (function(id) {
      var modal = document.getElementById(id);
      if (!modal) {
        return;
      }
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          if (id === 'quizModal') {
            return;
          }
          modal.classList.add('hidden');
          if (id === 'docModal') {
            var df = document.getElementById('docFrame');
            if (df) {
              df.src = 'about:blank';
            }
          }
          var anyOpen = false;
          for (var j = 0; j < modals.length; j++) {
            var m2 = document.getElementById(modals[j]);
            if (m2 && m2 !== modal && !m2.classList.contains('hidden')) {
              anyOpen = true;
              break;
            }
          }
          if (!anyOpen) {
            document.body.style.overflow = '';
          }
        }
      });
    })(modals[i]);
  }
  var qmc2 = document.getElementById('quizModalClose');
  if (qmc2) {
    qmc2.addEventListener('click', function() {
      if (state.quiz) {
        return;
      }
      var qm = document.getElementById('quizModal');
      if (qm) {
        qm.classList.add('hidden');
      }
      document.body.style.overflow = '';
    });
  }
  var qnb4 = document.getElementById('quizNextBtn');
  if (qnb4) {
    qnb4.addEventListener('click', nextQuiz);
  }
}

function init() {
  try {
    seedIfNeeded();
  } catch (e) {
  }
  try {
    initAuth();
  } catch (e) {
  }
  try {
    initNavbar();
  } catch (e) {
  }
  try {
    initUserView();
  } catch (e) {
  }
  try {
    initAdminView();
  } catch (e) {
  }
  try {
    initConfirmModal();
  } catch (e) {
  }
  try {
    initQuizManageModal();
  } catch (e) {
  }
  try {
    initModals();
  } catch (e) {
  }
  try {
    var user = getCurrentUser();
    if (user) {
      renderNavbar(user);
      if (user.role === 'admin') {
        showView('admin');
      } else {
        showView('user');
      }
    } else {
      showView('auth');
    }
  } catch (e) {
    showView('auth');
  }
  try {
    refreshIcons();
  } catch (e) {
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
