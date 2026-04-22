
# Interactive UI Flow Design

Interactive UI Flow Design is a Vite + React оқу платформасының интерфейсі. Жобаға SQLite-пен жұмыс істейтін шағын Node.js backend қосылған.

## Мүмкіндіктері

- студентті тіркеу формасы
- admin dashboard
- SQLite деректер базасы
- `/api/health`, `/api/schema`, `/api/users` endpoint-тері

## Іске қосу

1. `npm install`
2. `npm run dev`
3. Бөлек терминалда `npm run server`

Frontend әдетте Vite арқылы, backend `http://localhost:4000` мекенжайында іске қосылады.

## Деректер базасы

Базаны дайындау:

```bash
npm run db:init
```

Тексеру:

```bash
http://localhost:4000/api/health
```

Негізгі кестелер:

- `app_meta` - жоба туралы қызметтік ақпарат
- `users` - тіркелген қолданушылар
- `categories` - курс санаттары
- `products` - өнімдер мен курстар

## Git үшін ескерту

Жобада `node_modules`, `dist`, `.env`, уақытша файлдар және локал backup zip файлдары `.gitignore` арқылы еленбейді.
