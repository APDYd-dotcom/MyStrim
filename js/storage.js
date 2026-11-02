/* =========================================================
   MyStrim — storage.js
   All data lives in localStorage. No backend required.
   ========================================================= */

const KEYS = {
  USERS: 'mystrim_users',
  DOCS: 'mystrim_documents',
  SESSION: 'mystrim_session',
  SEEDED: 'mystrim_seeded_v1'
};

/* ---------- tiny non-cryptographic hash (demo only) ---------- */
/* NOTE: This is NOT secure. It exists only so plaintext passwords
   are not sitting directly in localStorage for this local demo.
   Do not reuse this pattern for a real production login system. */
function hashPassword(pw) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < pw.length; i++) {
    const ch = pw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------------- generic get/set ---------------------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Storage read error for', key, e);
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ------------------------- users ------------------------- */
const UserStore = {
  all() { return readJSON(KEYS.USERS, []); },
  save(users) { writeJSON(KEYS.USERS, users); },
  findByEmail(email) {
    return this.all().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findById(id) {
    return this.all().find(u => u.id === id);
  },
  create({ name, email, password, role = 'user' }) {
    const users = this.all();
    const user = {
      id: uid('user'),
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role,
      coins: 0,
      completed: {}, // { [docId]: { score, passed, attempts, bestScore } }
      createdAt: new Date().toISOString()
    };
    users.push(user);
    this.save(users);
    return user;
  },
  update(userId, patch) {
    const users = this.all();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...patch };
    this.save(users);
    return users[idx];
  },
  verify(email, password) {
    const user = this.findByEmail(email);
    if (!user) return null;
    return user.passwordHash === hashPassword(password) ? user : null;
  }
};

/* ------------------------ documents ------------------------ */
const DocStore = {
  all() { return readJSON(KEYS.DOCS, []); },
  save(docs) { writeJSON(KEYS.DOCS, docs); },
  findById(id) { return this.all().find(d => d.id === id); },
  create({ title, url, volume }) {
    const docs = this.all();
    const doc = {
      id: uid('doc'),
      title,
      url,
      volume,
      quiz: [],
      createdAt: new Date().toISOString()
    };
    docs.push(doc);
    this.save(docs);
    return doc;
  },
  update(docId, patch) {
    const docs = this.all();
    const idx = docs.findIndex(d => d.id === docId);
    if (idx === -1) return null;
    docs[idx] = { ...docs[idx], ...patch };
    this.save(docs);
    return docs[idx];
  },
  remove(docId) {
    const docs = this.all().filter(d => d.id !== docId);
    this.save(docs);
  },
  addQuestion(docId, question) {
    const docs = this.all();
    const doc = docs.find(d => d.id === docId);
    if (!doc) return null;
    doc.quiz.push({ id: uid('q'), ...question });
    this.save(docs);
    return doc;
  },
  removeQuestion(docId, questionId) {
    const docs = this.all();
    const doc = docs.find(d => d.id === docId);
    if (!doc) return null;
    doc.quiz = doc.quiz.filter(q => q.id !== questionId);
    this.save(docs);
    return doc;
  }
};

/* ------------------------- session ------------------------- */
const Session = {
  get() { return readJSON(KEYS.SESSION, null); },
  set(userId) { writeJSON(KEYS.SESSION, { userId }); },
  clear() { localStorage.removeItem(KEYS.SESSION); },
  currentUser() {
    const s = this.get();
    if (!s) return null;
    return UserStore.findById(s.userId) || null;
  }
};

/* --------------------------- seed --------------------------- */
function seedIfNeeded() {
  if (localStorage.getItem(KEYS.SEEDED)) return;

  // Default admin account — see README.md for credentials.
  if (!UserStore.findByEmail('admin@mystrim.com')) {
    UserStore.create({
      name: 'Admin',
      email: 'admin@mystrim.com',
      password: 'Admin@2026',
      role: 'admin'
    });
  }

  // Sample documents with quizzes so the app is usable immediately.
  const docs = DocStore.all();
  if (docs.length === 0) {
    const d1 = DocStore.create({
      title: 'The Rise of Streaming Media — Vol. 1',
      url: 'https://docs.google.com/document/d/1XampleStreamingHistoryDocId/edit',
      volume: 1
    });
    ['q1', 'q2', 'q3'].forEach(() => {});
    DocStore.addQuestion(d1.id, {
      question: 'Which of these best describes "streaming" media?',
      options: [
        'Media downloaded fully before it can be viewed',
        'Media delivered and played back continuously over a network',
        'Media printed on physical discs only',
        'Media that can only be viewed once'
      ],
      correctIndex: 1
    });
    DocStore.addQuestion(d1.id, {
      question: 'What was one major driver of the streaming boom?',
      options: [
        'Slower internet speeds',
        'Decline of mobile devices',
        'Widespread broadband and mobile internet access',
        'Removal of all TV channels'
      ],
      correctIndex: 2
    });
    DocStore.addQuestion(d1.id, {
      question: 'A "volume" in MyStrim documents typically represents:',
      options: [
        'The loudness of the audio',
        'A part or edition number in a series',
        'The file size',
        'The number of viewers'
      ],
      correctIndex: 1
    });
    DocStore.addQuestion(d1.id, {
      question: 'Which metric do streaming platforms commonly track?',
      options: [
        'Watch time / engagement',
        'Number of printed pages',
        'Disc rotation speed',
        'Radio frequency'
      ],
      correctIndex: 0
    });
    DocStore.addQuestion(d1.id, {
      question: 'Completing a quiz with 80% or higher rewards you with:',
      options: ['Nothing', 'A badge only', 'Coins', 'A warning'],
      correctIndex: 2
    });

    const d2 = DocStore.create({
      title: 'Content Licensing Basics — Vol. 2',
      url: 'https://docs.google.com/document/d/2XampleLicensingBasicsDocId/edit',
      volume: 2
    });
    DocStore.addQuestion(d2.id, {
      question: 'A content license typically grants:',
      options: [
        'Full ownership transfer',
        'Permission to use content under specific terms',
        'Unlimited rights with no restrictions',
        'Nothing at all'
      ],
      correctIndex: 1
    });
    DocStore.addQuestion(d2.id, {
      question: '"Exclusive rights" in media licensing means:',
      options: [
        'Only one licensee can use the content as agreed',
        'Anyone can use the content freely',
        'The content is public domain',
        'The license never expires'
      ],
      correctIndex: 0
    });
    DocStore.addQuestion(d2.id, {
      question: 'Territorial licensing restricts content by:',
      options: ['File format', 'Geographic region', 'Font size', 'Upload date'],
      correctIndex: 1
    });
    DocStore.addQuestion(d2.id, {
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

  localStorage.setItem(KEYS.SEEDED, '1');
}

const COIN_REWARD = 20;
const PASS_THRESHOLD = 80;
