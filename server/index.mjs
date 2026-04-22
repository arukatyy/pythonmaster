import { createServer } from 'node:http';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process, { loadEnvFile } from 'node:process';
import { DatabaseSync } from 'node:sqlite';
import { hashSync } from 'bcryptjs';

const envPath = resolve(process.cwd(), '.env');

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const port = Number(process.env.PORT || 4000);
const dbFile = resolve(process.cwd(), process.env.SQLITE_DB_PATH || 'server/data/app.db');

mkdirSync(dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);

db.exec('PRAGMA foreign_keys = ON;');

function getTableColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all();
}

function getForeignKeys(tableName) {
  return db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
}

function ensureColumn(tableName, columnName, definition) {
  const hasColumn = getTableColumns(tableName).some((column) => column.name === columnName);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    app_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    course TEXT NOT NULL DEFAULT 'Жаңа тіркелуші',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    created_by_user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products(category_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_created_by_user_id
  ON products(created_by_user_id);
`);

ensureColumn('users', 'phone', 'TEXT');
ensureColumn('users', 'course', "TEXT NOT NULL DEFAULT 'Жаңа тіркелуші'");
ensureColumn('users', 'progress', 'INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)');
ensureColumn('users', 'status', "TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))");
ensureColumn('users', 'avatar_url', 'TEXT');

db.prepare(`
  INSERT INTO app_meta (id, app_name)
  VALUES (1, ?)
  ON CONFLICT(id) DO NOTHING;
`).run('Interactive UI Flow Design');

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM users').get().total;
  if (count > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, course, progress, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoUsers = [
    ['Асхат Нұрланов', 'askhat.n@example.com', '+7 701 234 5678', hashSync('demo123', 10), 'customer', 'Python Basics', 75, 'active', '2026-01-15T09:00:00.000Z', '2026-01-15T09:00:00.000Z'],
    ['Айгерім Сапарова', 'aigerim.s@example.com', '+7 702 345 6789', hashSync('demo123', 10), 'customer', 'Data Science', 45, 'active', '2026-02-20T09:00:00.000Z', '2026-02-20T09:00:00.000Z'],
    ['Ернар Қайратов', 'ernar.k@example.com', '+7 705 456 7890', hashSync('demo123', 10), 'customer', 'Web Development', 92, 'active', '2026-01-08T09:00:00.000Z', '2026-01-08T09:00:00.000Z'],
    ['Дина Әбілова', 'dina.a@example.com', '+7 707 567 8901', hashSync('demo123', 10), 'customer', 'Python Basics', 30, 'active', '2026-03-12T09:00:00.000Z', '2026-03-12T09:00:00.000Z'],
  ];

  for (const user of demoUsers) {
    insertUser.run(...user);
  }
}

function seedCategories() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM categories').get().total;
  if (count > 0) return;

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, description)
    VALUES (?, ?)
  `);

  const demoCategories = [
    ['Python', 'Python бағдарламалау және автоматтандыру курстары'],
    ['Data Science', 'Деректер талдауы мен machine learning бағыттары'],
    ['Web Development', 'Frontend және backend веб әзірлеу курстары'],
  ];

  for (const category of demoCategories) {
    insertCategory.run(...category);
  }
}

function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM products').get().total;
  if (count > 0) return;

  const pythonCategory = db.prepare(`SELECT id FROM categories WHERE name = 'Python'`).get();
  const dataCategory = db.prepare(`SELECT id FROM categories WHERE name = 'Data Science'`).get();
  const webCategory = db.prepare(`SELECT id FROM categories WHERE name = 'Web Development'`).get();
  const creatorUser = db.prepare(`SELECT id FROM users ORDER BY id ASC LIMIT 1`).get();

  if (!pythonCategory || !dataCategory || !webCategory || !creatorUser) {
    return;
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (category_id, created_by_user_id, name, description, price, stock, sku, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoProducts = [
    [pythonCategory.id, creatorUser.id, 'Python Basics', 'Python тілінің негіздерін үйрететін бастауыш курс', 24990, 120, 'PY-BASIC-001', 1],
    [dataCategory.id, creatorUser.id, 'Data Science Starter', 'Pandas, визуализация және талдау негіздері', 39990, 80, 'DS-START-001', 1],
    [webCategory.id, creatorUser.id, 'Web Development Pro', 'HTML, CSS, JavaScript және React бойынша толық курс', 45990, 65, 'WEB-PRO-001', 1],
  ];

  for (const product of demoProducts) {
    insertProduct.run(...product);
  }
}

function migratePlaintextPasswords() {
  const legacyUsers = db.prepare(`
    SELECT id, password
    FROM users
  `).all().filter((user) => typeof user.password === 'string' && !user.password.startsWith('$2'));

  const updatePassword = db.prepare(`
    UPDATE users
    SET password = ?, updated_at = ?
    WHERE id = ?
  `);

  for (const user of legacyUsers) {
    updatePassword.run(hashSync(user.password, 10), new Date().toISOString(), user.id);
  }
}

seedUsers();
seedCategories();
seedProducts();
migratePlaintextPasswords();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  response.end(JSON.stringify(payload, null, 2));
}

function getSchemaSummary() {
  return {
    users: {
      columns: getTableColumns('users'),
      foreignKeys: getForeignKeys('users'),
    },
    categories: {
      columns: getTableColumns('categories'),
      foreignKeys: getForeignKeys('categories'),
    },
    products: {
      columns: getTableColumns('products'),
      foreignKeys: getForeignKeys('products'),
    },
  };
}

function getTableCounts() {
  return {
    users: db.prepare('SELECT COUNT(*) AS total FROM users').get().total,
    categories: db.prepare('SELECT COUNT(*) AS total FROM categories').get().total,
    products: db.prepare('SELECT COUNT(*) AS total FROM products').get().total,
  };
}

function listUsers() {
  return db.prepare(`
    SELECT
      id,
      name,
      email,
      phone,
      course,
      progress,
      status,
      role,
      avatar_url AS avatarUrl,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM users
    ORDER BY datetime(created_at) DESC, id DESC
  `).all();
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error('Request body тым үлкен'));
        request.destroy();
      }
    });

    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('JSON форматы қате'));
      }
    });

    request.on('error', reject);
  });
}

function validateUserPayload(payload) {
  const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!fullName) return 'Аты-жөні міндетті';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email форматы қате';
  if (!/^\d{11}$/.test(phone)) return 'Телефон тек 11 цифрдан тұруы керек';
  if (password.length < 6 || !/\d/.test(password)) return 'Пароль кемінде 6 символ және 1 саннан тұруы керек';

  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 6 || !/\d/.test(password)) {
    return 'Пароль кемінде 6 символ және 1 саннан тұруы керек';
  }

  return null;
}

function createUser(payload) {
  const now = new Date().toISOString();
  const passwordHash = hashSync(payload.password, 10);
  const insert = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, course, progress, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'customer', 'Жаңа тіркелуші', 0, 'active', ?, ?)
    RETURNING
      id,
      name,
      email,
      phone,
      course,
      progress,
      status,
      role,
      avatar_url AS avatarUrl,
      created_at AS createdAt,
      updated_at AS updatedAt
  `);

  return insert.get(payload.fullName.trim(), payload.email.trim().toLowerCase(), payload.phone.trim(), passwordHash, now, now);
}

function updateUserPassword(userId, password) {
  const passwordHash = hashSync(password, 10);
  const now = new Date().toISOString();

  return db.prepare(`
    UPDATE users
    SET password = ?, updated_at = ?
    WHERE id = ?
    RETURNING
      id,
      name,
      email,
      phone,
      course,
      progress,
      status,
      role,
      avatar_url AS avatarUrl,
      created_at AS createdAt,
      updated_at AS updatedAt
  `).get(passwordHash, now, userId);
}

function getHealthPayload() {
  const meta = db.prepare(`
    SELECT id, app_name, created_at
    FROM app_meta
    WHERE id = 1
  `).get();

  return {
    ok: true,
    message: 'SQLite деректер базасына қосылу сәтті орындалды',
    database: {
      engine: 'SQLite',
      file: dbFile,
    },
    meta,
    counts: getTableCounts(),
    tables: getSchemaSummary(),
  };
}

if (process.argv.includes('--init-only')) {
  console.log(JSON.stringify(getHealthPayload(), null, 2));
  db.close();
  process.exit(0);
}

const server = createServer((request, response) => {
  if (!request.url) {
    return sendJson(response, 400, { ok: false, message: 'Request URL табылмады' });
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/') {
    return sendJson(response, 200, {
      ok: true,
      message: 'Server жұмыс істеп тұр',
      endpoints: ['/api/health', '/api/schema', '/api/users'],
    });
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
    return sendJson(response, 200, getHealthPayload());
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/schema') {
    return sendJson(response, 200, {
      ok: true,
      database: {
        engine: 'SQLite',
        file: dbFile,
      },
      counts: getTableCounts(),
      tables: getSchemaSummary(),
    });
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/users') {
    return sendJson(response, 200, {
      ok: true,
      users: listUsers(),
    });
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/users') {
    readRequestBody(request)
      .then((payload) => {
        const validationError = validateUserPayload(payload);
        if (validationError) {
          sendJson(response, 400, { ok: false, message: validationError });
          return;
        }

        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(payload.email.trim().toLowerCase());
        if (existingUser) {
          sendJson(response, 409, { ok: false, message: 'Бұл email-пен user бұрын тіркелген' });
          return;
        }

        const user = createUser(payload);
        sendJson(response, 201, { ok: true, user });
      })
      .catch((error) => {
        sendJson(response, 400, {
          ok: false,
          message: error instanceof Error ? error.message : 'Сұранысты өңдеу кезінде қате болды',
        });
      });
    return;
  }

  const passwordMatch = requestUrl.pathname.match(/^\/api\/users\/(\d+)\/password$/);
  if (request.method === 'PATCH' && passwordMatch) {
    readRequestBody(request)
      .then((payload) => {
        const validationError = validatePassword(payload.password);
        if (validationError) {
          sendJson(response, 400, { ok: false, message: validationError });
          return;
        }

        const user = updateUserPassword(Number(passwordMatch[1]), payload.password);
        if (!user) {
          sendJson(response, 404, { ok: false, message: 'User табылмады' });
          return;
        }

        sendJson(response, 200, { ok: true, user });
      })
      .catch((error) => {
        sendJson(response, 400, {
          ok: false,
          message: error instanceof Error ? error.message : 'Сұранысты өңдеу кезінде қате болды',
        });
      });
    return;
  }

  return sendJson(response, 404, {
    ok: false,
    message: 'Маршрут табылмады',
  });
});

server.listen(port, () => {
  console.log(`Server http://localhost:${port} адресінде іске қосылды`);
  console.log(`SQLite база файлы: ${dbFile}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
