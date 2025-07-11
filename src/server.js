const express = require('express');
const { sendWhatsAppMessage } = require('./whatsapp');
const { normalizeNumber } = require('./helpers');

const app = express();
app.use(express.json());

app.post('/send-wa', async (req, res) => {
    const { number, number_atasan, message } = req.body;
    const results = [];

    try {
        if (number) results.push(await sendWhatsAppMessage(normalizeNumber(number), message));
    } catch (err) {
        console.error('❌ Kirim ke user gagal:', err.message);
        results.push({ to: number, status: 'error', message: err.message });
    }

    try {
        if (number_atasan) results.push(await sendWhatsAppMessage(normalizeNumber(number_atasan), message));
    } catch (err) {
        console.error('❌ Kirim ke atasan gagal:', err.message);
        results.push({ to: number_atasan, status: 'error', message: err.message });
    }

    res.send({ status: 'done', results });
});

module.exports = app;
