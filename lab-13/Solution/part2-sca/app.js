const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Middleware CSP
app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.nonce = nonce;
    res.setHeader(
        'Content-Security-Policy',
        `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline';`
    );
    next();
});

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Инициализация базы данных
const db = new sqlite3.Database('./comments.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Добавляем тестовые комментарии
    db.run(`INSERT OR IGNORE INTO comments (id, username, comment) VALUES 
        (1, 'admin', 'Добро пожаловать, Целенко!'),
        (2, 'user1', 'Отличный ресурс'),
        (3, 'user2', 'Очень полезная информация')`);
});

// Замена hardcoded ключа
const API_KEY = process.env.API_KEY;

// Санитизация
const sanitizeHtml = (input) => {
    if (!input) return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Маршруты

// Главная страница с комментариями
app.get('/', (req, res) => {
    db.all(`SELECT * FROM comments ORDER BY created_at DESC`, (err, comments) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        res.render('index', { comments: comments, error: null });
    });
});

// Страница добавления комментария
app.post('/comment', (req, res) => {
    let { username, comment } = req.body;
    
    // Санитизация входных данных
    username = sanitizeHtml(username || 'Anonymous');
    comment = sanitizeHtml(comment || '');
    
    db.run(`INSERT INTO comments (username, comment) VALUES (?, ?)`, 
        [username, comment], 
        function(err) {
            if (err) {
                res.status(500).send('Error saving comment');
                return;
            }
            res.redirect('/');
        });
});

// API для получения комментариев (JSON)
app.get('/api/comments', (req, res) => {
    const sortParam = req.query.sort || 'created_at DESC';
    
    // Allow-list разрешенных значений
    const allowedSort = [
        'created_at DESC',
        'created_at ASC',
        'username ASC',
        'username DESC'
    ];
    
    if (!allowedSort.includes(sortParam)) {
        return res.status(400).json({ error: 'Invalid sort parameter' });
    }
    
    db.all(`SELECT * FROM comments ORDER BY ${sortParam}`, (err, comments) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(comments);
    });
});

// API для поиска по комментариям
app.get('/api/search', (req, res) => {
    const search = req.query.q || '';
    
    // Параметризованный запрос
    db.all(`SELECT * FROM comments WHERE comment LIKE ?`, 
        [`%${search}%`], 
        (err, comments) => {
            if (err) {
                res.status(500).json({ error: 'Database error' });
                return;
            }
            res.json(comments);
        });
});

// Эндпоинт без hardcoded секрета
app.get('/api/config', (req, res) => {
    if (!API_KEY) {
        return res.status(500).json({ error: "Missing API_KEY env" });
    }
    res.json({ 
        api_key: API_KEY,
        environment: 'development',
        debug: true
    });
});

// Эндпоинт, использующий axios - исправленный SSRF
app.get('/api/external', async (req, res) => {
    const url = req.query.url;
    
    // Валидация URL / allow-list (защита от SSRF)
    const allowedDomains = ['api.example.com', 'dummyjson.com'];
    
    try {
        const parsedUrl = new URL(url || 'https://api.example.com/data');
        if (!allowedDomains.includes(parsedUrl.hostname)) {
            return res.status(403).json({ error: 'Domain not allowed' });
        }
        
        const response = await axios.get(parsedUrl.toString());
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'External request failed' });
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
