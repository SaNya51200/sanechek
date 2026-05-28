const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const news = [
  { id: 1, title: 'KMM reaches Beta', summary: 'Kotlin Multiplatform reaches Beta status, ready for production.', date: '2026-04-01' },
  { id: 2, title: 'Flutter 4.0 Released', summary: 'A major update for the Flutter framework with enhanced performance.', date: '2026-03-25' },
  { id: 3, title: 'React Native New Architecture', summary: 'TurboModules and Fabric now default in newest version.', date: '2026-03-30' }
];
app.get('/api/news', (req, res) => res.json(news));
app.listen(3000, () => console.log('Mock News API on port 3000'));
