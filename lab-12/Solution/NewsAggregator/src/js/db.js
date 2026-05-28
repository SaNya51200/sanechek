const DB_NAME = 'news-db';
const STORE_NAME = 'articles';
function initDB() { return new Promise((resolve, reject) => { const req = indexedDB.open(DB_NAME, 1); req.onupgradeneeded = e => { e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' }); }; req.onsuccess = e => resolve(e.target.result); req.onerror = e => reject(e.target.error); }); }
async function saveArticles(articles) { const db = await initDB(); const tx = db.transaction(STORE_NAME, 'readwrite'); const store = tx.objectStore(STORE_NAME); articles.forEach(a => store.put(a)); return tx.complete; }
async function getArticles() { const db = await initDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE_NAME, 'readonly'); const store = tx.objectStore(STORE_NAME); const req = store.getAll(); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
