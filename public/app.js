function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    event.target.classList.add('active');

    if (tabId === 'invoice') {
        loadInvoice();
    }
}

function toggleFields() {
    const type = document.getElementById('meterType').value;
    if (type === 'elec') {
        document.getElementById('fields-elec').style.display = 'block';
        document.getElementById('fields-water').style.display = 'none';
    } else {
        document.getElementById('fields-elec').style.display = 'none';
        document.getElementById('fields-water').style.display = 'block';
    }
}

async function sendReadings() {
    const meter = document.getElementById('meterType').value;
    const errorDiv = document.getElementById('errorMsg');
    const successDiv = document.getElementById('successMsg');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    let body = { meter, date: new Date().toISOString() };

    if (meter === 'elec') {
        body.valueDay = Number(document.getElementById('valDay').value);
        body.valueNight = Number(document.getElementById('valNight').value);
        if (!body.valueDay || !body.valueNight) return showError('Заполните все поля');
    } else {
        body.value = Number(document.getElementById('valWater').value);
        if (!body.value) return showError('Заполните поле');
    }

    try {
        const res = await fetch('/api/readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            showError(data.error);
        } else {
            successDiv.textContent = data.message;
            successDiv.style.display = 'block';
            document.getElementById('valDay').value = '';
            document.getElementById('valNight').value = '';
            document.getElementById('valWater').value = '';
        }
    } catch (e) {
        showError('Ошибка сети. Сервер недоступен.');
    }
}

function showError(msg) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
}

async function loadInvoice() {
    try {
        const res = await fetch('/api/invoice');
        const data = await res.json();
        
        const tbody = document.querySelector('#invoiceTable tbody');
        tbody.innerHTML = '';
        
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>${item.cons.toFixed(2)}</td>
                <td>${item.rate.toFixed(2)} ₽</td>
                <td>${item.total.toFixed(2)} ₽</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('totalAccrued').textContent = data.totalAccrued.toFixed(2);
        document.getElementById('debt').textContent = data.debt.toFixed(2);
        document.getElementById('toPay').textContent = data.toPay.toFixed(2);
        
    } catch (e) {
        alert("Ошибка загрузки квитанции");
    }
}