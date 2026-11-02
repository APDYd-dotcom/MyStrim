if (typeof localStorage === 'undefined') {
  var _mystrim_ls = {};
  global.localStorage = {
    getItem: function(key) {
      if (_mystrim_ls.hasOwnProperty(key)) {
        return _mystrim_ls[key];
      }
      return null;
    },
    setItem: function(key, value) {
      _mystrim_ls[key] = String(value);
    },
    removeItem: function(key) {
      delete _mystrim_ls[key];
    },
    clear: function() {
      _mystrim_ls = {};
    }
  };
}

var KEYS = {
  USERS: 'mystrim_users',
  DOCS: 'mystrim_documents',
  SESSION: 'mystrim_session',
  SEEDED: 'mystrim_seeded_v2'
};

function hashPassword(pw) {
  try {
    if (typeof btoa === 'function') {
      return btoa(pw);
    }
  } catch (e) {
  }
  var str = pw + '';
  var out = '';
  for (var i = 0; i < str.length; i++) {
    out += str.charCodeAt(i).toString(16);
  }
  return out;
}

function uid(prefix) {
  if (prefix === undefined) {
    prefix = 'id';
  }
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function readJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    } else {
      return fallback;
    }
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
  }
}

function getUsers() {
  return readJSON(KEYS.USERS, []);
}

function saveUsers(users) {
  writeJSON(KEYS.USERS, users);
}

function findUserByEmail(email) {
  var users = getUsers();
  var lowerEmail = (email + '').toLowerCase();
  for (var i = 0; i < users.length; i++) {
    if ((users[i].email + '').toLowerCase() === lowerEmail) {
      return users[i];
    }
  }
  return null;
}

function findUserById(id) {
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === id) {
      return users[i];
    }
  }
  return null;
}

function createUser(obj) {
  var users = getUsers();
  var user = {
    id: uid('user'),
    name: obj.name,
    email: (obj.email + '').toLowerCase(),
    passwordHash: hashPassword(obj.password),
    role: obj.role || 'user',
    coins: 0,
    completed: {},
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  return user;
}

function updateUser(userId, patch) {
  var users = getUsers();
  var idx = -1;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) {
      idx = i;
      break;
    }
  }
  if (idx === -1) {
    return null;
  }
  var user = users[idx];
  for (var key in patch) {
    if (patch.hasOwnProperty(key)) {
      user[key] = patch[key];
    }
  }
  users[idx] = user;
  saveUsers(users);
  return users[idx];
}

function verifyUser(email, password) {
  var user = findUserByEmail(email);
  if (!user) {
    return null;
  }
  if (user.passwordHash === hashPassword(password)) {
    return user;
  }
  return null;
}

function getDocs() {
  return readJSON(KEYS.DOCS, []);
}

function saveDocs(docs) {
  writeJSON(KEYS.DOCS, docs);
}

function findDocById(id) {
  var docs = getDocs();
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].id === id) {
      return docs[i];
    }
  }
  return null;
}

function createDoc(obj) {
  var docs = getDocs();
  var doc = {
    id: uid('doc'),
    title: obj.title,
    url: obj.url,
    volume: obj.volume,
    quiz: [],
    createdAt: new Date().toISOString()
  };
  docs.push(doc);
  saveDocs(docs);
  return doc;
}

function updateDoc(docId, patch) {
  var docs = getDocs();
  var idx = -1;
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].id === docId) {
      idx = i;
      break;
    }
  }
  if (idx === -1) {
    return null;
  }
  var doc = docs[idx];
  for (var key in patch) {
    if (patch.hasOwnProperty(key)) {
      doc[key] = patch[key];
    }
  }
  docs[idx] = doc;
  saveDocs(docs);
  return docs[idx];
}

function removeDoc(docId) {
  var docs = getDocs();
  var newDocs = [];
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].id !== docId) {
      newDocs.push(docs[i]);
    }
  }
  saveDocs(newDocs);
}

function addQuestion(docId, question) {
  var docs = getDocs();
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].id === docId) {
      docs[i].quiz.push({ id: uid('q'), question: question.question, options: question.options, correctIndex: question.correctIndex });
      saveDocs(docs);
      return docs[i];
    }
  }
  return null;
}

function removeQuestion(docId, questionId) {
  var docs = getDocs();
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].id === docId) {
      var newQuiz = [];
      for (var j = 0; j < docs[i].quiz.length; j++) {
        if (docs[i].quiz[j].id !== questionId) {
          newQuiz.push(docs[i].quiz[j]);
        }
      }
      docs[i].quiz = newQuiz;
      saveDocs(docs);
      return docs[i];
    }
  }
  return null;
}

function getSession() {
  return readJSON(KEYS.SESSION, null);
}

function setSession(userId) {
  writeJSON(KEYS.SESSION, { userId: userId });
}

function clearSession() {
  try {
    localStorage.removeItem(KEYS.SESSION);
  } catch (e) {
  }
}

function getCurrentUser() {
  var s = getSession();
  if (!s) {
    return null;
  }
  return findUserById(s.userId);
}

function seedIfNeeded() {
  try {
    if (localStorage.getItem(KEYS.SEEDED)) {
      return;
    }
  } catch (e) {
  }

  if (!findUserByEmail('admin@mystrim.com')) {
    createUser({
      name: 'Admin',
      email: 'admin@mystrim.com',
      password: 'Admin@2026',
      role: 'admin'
    });
  }

  var docs = getDocs();
  if (docs.length === 0) {
    var d1 = createDoc({
      title: 'The Rise of Streaming Media — Vol. 1',
      url: 'https://docs.google.com/document/d/1XampleStreamingHistoryDocId/edit',
      volume: 1
    });
    addQuestion(d1.id, {
      question: 'Which of these best describes "streaming" media?',
      options: [
        'Media downloaded fully before it can be viewed',
        'Media delivered and played back continuously over a network',
        'Media printed on physical discs only',
        'Media that can only be viewed once'
      ],
      correctIndex: 1
    });
    addQuestion(d1.id, {
      question: 'What was one major driver of the streaming boom?',
      options: [
        'Slower internet speeds',
        'Decline of mobile devices',
        'Widespread broadband and mobile internet access',
        'Removal of all TV channels'
      ],
      correctIndex: 2
    });
    addQuestion(d1.id, {
      question: 'A "volume" in MyStrim documents typically represents:',
      options: [
        'The loudness of the audio',
        'A part or edition number in a series',
        'The file size',
        'The number of viewers'
      ],
      correctIndex: 1
    });
    addQuestion(d1.id, {
      question: 'Which metric do streaming platforms commonly track?',
      options: [
        'Watch time / engagement',
        'Number of printed pages',
        'Disc rotation speed',
        'Radio frequency'
      ],
      correctIndex: 0
    });
    addQuestion(d1.id, {
      question: 'Completing a quiz with 80% or higher rewards you with:',
      options: ['Nothing', 'A badge only', 'Coins', 'A warning'],
      correctIndex: 2
    });

    var d2 = createDoc({
      title: 'Content Licensing Basics — Vol. 2',
      url: 'https://docs.google.com/document/d/2XampleLicensingBasicsDocId/edit',
      volume: 2
    });
    addQuestion(d2.id, {
      question: 'A content license typically grants:',
      options: [
        'Full ownership transfer',
        'Permission to use content under specific terms',
        'Unlimited rights with no restrictions',
        'Nothing at all'
      ],
      correctIndex: 1
    });
    addQuestion(d2.id, {
      question: '"Exclusive rights" in media licensing means:',
      options: [
        'Only one licensee can use the content as agreed',
        'Anyone can use the content freely',
        'The content is public domain',
        'The license never expires'
      ],
      correctIndex: 0
    });
    addQuestion(d2.id, {
      question: 'Territorial licensing restricts content by:',
      options: ['File format', 'Geographic region', 'Font size', 'Upload date'],
      correctIndex: 1
    });
    addQuestion(d2.id, {
      question: 'A licensing "window" refers to:',
      options: [
        'A UI element',
        'The time period content may be distributed',
        'A pop-up ad',
        'A video resolution setting'
      ],
      correctIndex: 1
    });
  }

  try {
    localStorage.setItem(KEYS.SEEDED, '1');
  } catch (e) {
  }
}

var COIN_REWARD = 20;
var PASS_THRESHOLD = 80;
