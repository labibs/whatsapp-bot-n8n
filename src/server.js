const express = require('express');
const { sendWhatsAppMessage } = require('./whatsapp');
const { normalizeNumber } = require('./helpers');

const app = express();
app.use(express.json());

// Helper function to send message safely
async function safeSendWhatsApp(number, message, label = 'user') {
    try {
        const normalized = normalizeNumber(number);
        console.log(`📤 Sending message to ${label}: ${normalized} | ${message}`);
        const result = await sendWhatsAppMessage(normalized, message);
        console.log(`✅ Message sent to ${label}:`, result);
        return { to: normalized, status: 'sent', ...result };
    } catch (err) {
        console.error(`❌ Failed to send to ${label}:`, err.message);
        return { to: number, status: 'error', message: err.message };
    }
}

app.post('/send-wa', async (req, res) => {
    const { number, number_atasan, message } = req.body;
    const results = [];

    if (number) {
        results.push(await safeSendWhatsApp(number, message, 'user'));
    }

    if (number_atasan) {
        results.push(await safeSendWhatsApp(number_atasan, message, 'atasan'));
    }

    res.send({ status: 'done', results });
});

module.exports = app;
