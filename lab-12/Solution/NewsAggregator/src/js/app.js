const API_URL = 'http://localhost:3000/api/news';
const newsContainer = document.getElementById('news-container');
const statusIndicator = document.getElementById('status-indicator');
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
function updateStatus() {
  if (navigator.onLine) { statusIndicator.textContent = 'Online'; statusIndicator.classList.remove('offline'); } else { statusIndicator.textContent = 'Offline (Cached Data)'; statusIndicator.classList.add('offline'); }
}
async function fetchNews() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    await saveArticles(data);
    displayNews(data);
  } catch (err) {
    console.log('Fetching from IndexedDB...');
    const localData = await getArticles();
    displayNews(localData);
  }
}
function displayNews(articles) {
  newsContainer.innerHTML = articles.map(a => `<article class="news-card"><h3>${a.title}</h3><p>${a.summary}</p><span class="date">${new Date(a.date).toLocaleDateString()}</span></article>`).join('');
}
updateStatus();
fetchNews();
