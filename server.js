const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static('public'));

const database = {
    "роблокс": [
        "https://ru.wikipedia.org/wiki/Roblox",
        "https://www.roblox.com/"
    ],
    "питон": [
        "https://ru.wikipedia.org/wiki/Python",
        "https://www.python.org/"
    ]
};

app.post('/api/search', (req, res) => {
    const { keyword } = req.body;
    const urls = database[keyword.toLowerCase()];
    
    if (!urls) {
        return res.status(404).json({ error: "Ключевое слово не найдено" });
    }
    res.json({ urls });
});

app.get('/api/download', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Нет URL" });

    try {
        const response = await axios.get(url, { 
            responseType: 'text',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        
        res.json({
            content: response.data,
            size: Buffer.byteLength(response.data, 'utf8') 
        });
    } catch (error) {
        res.status(500).json({ error: "Ошибка скачивания: " + error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});