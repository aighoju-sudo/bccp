const express = require('express');
const session = require('express-session');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const publicDir = path.join(__dirname, 'public');
const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB 연결 실패:', err.message);
    return;
  }

  console.log('SQLite DB 연결 성공');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT,
      text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));
app.use(session({
  secret: 'chat-app-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
}));

function sendHomePage(req, res) {
  res.sendFile(path.join(publicDir, 'home.html'));
}

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  next();
}

app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/home', sendHomePage);
app.get('/home.html', sendHomePage);
app.get('/login', (req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(publicDir, 'signup.html'));
});
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/home');
  });
});

app.get('/chat', requireLogin, (req, res) => {
  res.sendFile(path.join(publicDir, 'chat.html'));
});

app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }

  res.json({ loggedIn: false, user: null });
});

app.get('/api/messages', requireLogin, (req, res) => {
  db.all('SELECT id, sender, text, created_at FROM messages ORDER BY id ASC', [], (err, rows) => {
    if (err) {
      console.error('메시지 조회 실패:', err.message);
      return res.status(500).json({ error: '메시지 조회 실패' });
    }

    res.json(rows);
  });
});

app.post('/api/signup', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error('회원 조회 실패:', err.message);
      return res.status(500).json({ error: '회원 조회 실패' });
    }

    if (row) {
      return res.status(409).json({ error: '이미 존재하는 아이디입니다.' });
    }

    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password],
      function (insertErr) {
        if (insertErr) {
          console.error('회원 저장 실패:', insertErr.message);
          return res.status(500).json({ error: '회원 저장 실패' });
        }

        req.session.user = { id: this.lastID, username };
        res.json({ success: true, user: req.session.user });
      }
    );
  });
});

app.post('/api/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
  }

  db.get('SELECT id, username, password FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error('로그인 조회 실패:', err.message);
      return res.status(500).json({ error: '로그인 조회 실패' });
    }

    if (!row || row.password !== password) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    req.session.user = { id: row.id, username: row.username };
    res.json({ success: true, user: req.session.user });
  });
});

app.post('/api/messages', requireLogin, (req, res) => {
  const sender = (req.session.user.username || 'user').trim();
  const text = (req.body.text || '').trim();

  if (!text) {
    return res.status(400).json({ error: '메시지가 비어 있습니다.' });
  }

  db.run(
    'INSERT INTO messages (sender, text, created_at) VALUES (?, ?, datetime("now", "localtime"))',
    [sender, text],
    function (err) {
      if (err) {
        console.error('메시지 저장 실패:', err.message);
        return res.status(500).json({ error: '메시지 저장 실패' });
      }

      res.json({
        id: this.lastID,
        sender,
        text,
        created_at: new Date(Date.now() + 9 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace('T', ' ')
      });
    }
  );
});

app.listen(8080, () => {
  console.log('site home in http://localhost:8080');
});

