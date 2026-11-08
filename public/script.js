let currentContent = "";

async function search() {
    const keyword = document.getElementById('keyword').value.trim();
    const errorMsg = document.getElementById('error-msg');
    const urlList = document.getElementById('url-list');
    
    errorMsg.textContent = "";
    urlList.innerHTML = "";
    
    if (!keyword) {
        errorMsg.textContent = "Введите ключевое слово!";
        return;
    }

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);

        data.urls.forEach(url => {
            const li = document.createElement('li');
            li.textContent = url;
            li.onclick = () => downloadContent(url);
            urlList.appendChild(li);
        });
    } catch (err) {
        errorMsg.textContent = err.message;
    }
}

async function downloadContent(url) {
    const downloadSection = document.getElementById('download-section');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const contentSection = document.getElementById('content-section');
    const contentDisplay = document.getElementById('content-display');

    downloadSection.classList.remove('hidden');
    contentSection.classList.add('hidden');
    progressBar.style.width = '0%';
    statusText.textContent = "Соединение с сервером...";

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (progress > 90) progress = 90; 
        progressBar.style.width = progress + '%';
    }, 200);

    try {
        const response = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        clearInterval(interval);
        
        if (!response.ok) throw new Error(data.error);

        progressBar.style.width = '100%';
        statusText.textContent = `Успешно! Размер файла: ${(data.size / 1024).toFixed(2)} КБ`;
        
        currentContent = data.content;
        contentDisplay.textContent = currentContent;
        contentSection.classList.remove('hidden');
        
    } catch (err) {
        clearInterval(interval);
        statusText.textContent = "Ошибка: " + err.message;
    }
}

function saveToLocalStorage() {
    if (!currentContent) return;
    const keyword = document.getElementById('keyword').value.trim() || "без_названия";
    
    localStorage.setItem('saved_' + keyword, currentContent);
    alert("Контент сохранен в LocalStorage!");
    updateSavedList();
}

function updateSavedList() {
    const savedList = document.getElementById('saved-list');
    savedList.innerHTML = "";
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('saved_')) {
            const li = document.createElement('li');
            li.textContent = "Ключ: " + key.replace('saved_', '');
            li.onclick = () => showSavedContent(key);
            savedList.appendChild(li);
        }
    }
}

function showSavedContent(key) {
    const savedDisplay = document.getElementById('saved-display');
    savedDisplay.classList.remove('hidden');
    savedDisplay.textContent = localStorage.getItem(key);
}

function clearLocalStorage() {
    if (confirm("Удалить все сохранения?")) {
        localStorage.clear();
        updateSavedList();
        document.getElementById('saved-display').classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', updateSavedList);