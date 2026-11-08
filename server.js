const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

let readings = [
    { meter: 'elec', date: '2023-04-01', valueDay: 40217, valueNight: 9800 },
    { meter: 'water', date: '2023-04-01', value: 100 }
];

const tariffs = {
    elec_day: 6.20,
    elec_night: 2.40,
    water_base: 42.30,
    water_over: 54.10 
};

app.get('/api/readings/latest', (req, res) => {
    const latestElec = readings.filter(r => r.meter === 'elec').pop();
    const latestWater = readings.filter(r => r.meter === 'water').pop();
    res.json({ elec: latestElec, water: latestWater });
});

app.post('/api/readings', (req, res) => {
    const { meter, date, valueDay, valueNight, value } = req.body;

    const lastElec = readings.filter(r => r.meter === 'elec').pop();
    const lastWater = readings.filter(r => r.meter === 'water').pop();

    if (meter === 'elec') {
        if (valueDay < lastElec.valueDay || valueNight < lastElec.valueNight) {
            return res.status(400).json({ error: 'Ошибка: Новые показания не могут быть меньше предыдущих (FR-6)' });
        }
        readings.push({ meter, date, valueDay, valueNight });
    } 
    else if (meter === 'water') {
        if (value < lastWater.value) {
            return res.status(400).json({ error: 'Ошибка: Новые показания не могут быть меньше предыдущих (FR-6)' });
        }
        readings.push({ meter, date, value });
    } 
    else {
        return res.status(400).json({ error: 'Неизвестный тип счетчика' });
    }

    res.status(201).json({ message: 'Показания успешно приняты!' });
});

app.get('/api/invoice', (req, res) => {
    const elecReadings = readings.filter(r => r.meter === 'elec');
    const waterReadings = readings.filter(r => r.meter === 'water');

    const elecCurrent = elecReadings[elecReadings.length - 1];
    const elecPrev = elecReadings[elecReadings.length - 2] || { valueDay: 0, valueNight: 0 };
    
    const waterCurrent = waterReadings[waterReadings.length - 1];
    const waterPrev = waterReadings[waterReadings.length - 2] || { value: 0 };

    const consumptionDay = elecCurrent.valueDay - elecPrev.valueDay;
    const consumptionNight = elecCurrent.valueNight - elecPrev.valueNight;
    const consumptionWater = waterCurrent.value - waterPrev.value;

    const costDay = consumptionDay * tariffs.elec_day;
    const costNight = consumptionNight * tariffs.elec_night;
    
    let costWater = 0;
    if (consumptionWater > 10) {
        costWater = (10 * tariffs.water_base) + ((consumptionWater - 10) * tariffs.water_over);
    } else {
        costWater = consumptionWater * tariffs.water_base;
    }

    const total = costDay + costNight + costWater;
    const debt = 420.00; 

    res.json({
        items: [
            { name: 'Электро - день', cons: consumptionDay, rate: tariffs.elec_day, total: costDay },
            { name: 'Электро - ночь', cons: consumptionNight, rate: tariffs.elec_night, total: costNight },
            { name: 'Вода', cons: consumptionWater, rate: tariffs.water_base, total: costWater }
        ],
        totalAccrued: total,
        debt: debt,
        toPay: total + debt
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен! Откройте http://localhost:${PORT}`);
});