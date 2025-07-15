// modules/whatsapp.js
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
require('dotenv').config();

let sock = null;

async function initializeWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth');
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state
        });

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', (update) => handleConnectionUpdate(update, initializeWhatsApp));
        sock.ev.on('messages.upsert', handleIncomingMessages);

    } catch (error) {
        console.error('❌ Gagal inisialisasi WhatsApp:', error.message);
        setTimeout(initializeWhatsApp, 5000);
    }
}

async function handleConnectionUpdate(update, reconnectCallback) {
    const { connection, lastDisconnect, qr } = update;
    console.log('💡 Connection update:', connection);

    if (qr) {
        try {
            // Tampilkan QR di terminal
            qrcodeTerminal.generate(qr, { small: true });

            // Simpan QR ke file .png
            await QRCode.toFile('qr.png', qr);
            console.log('✅ QR disimpan ke qr.png');
        } catch (err) {
            console.error('❌ Gagal membuat QR PNG:', err.message);
        }
    }

    if (connection === 'open') {
        console.log('✅ WhatsApp connected!');
    }

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log('🔌 Disconnected:', reason);

        if (reason !== DisconnectReason.loggedOut) {
            console.log('🔁 Reconnecting...');
            setTimeout(reconnectCallback, 3000);
        }
    }
}

async function handleIncomingMessages({ messages }) {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (from === 'status@broadcast') return;

    if (isGroup) {
        console.log(`📣 Grup: ${from}`);
    } else {
        console.log(`📩 Pribadi dari: ${from}`);

        try {
            await axios.post(process.env.N8N_WEBHOOK_URL, {
                from,
                text,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('❌ Gagal kirim ke n8n:', err.message);
        }
    }
}

async function sendWhatsAppMessage(number, message) {
    if (!sock) throw new Error('❌ WhatsApp not connected');
    const jid = number + '@s.whatsapp.net';

    await sock.sendMessage(jid, { text: message });
    return { to: number, status: 'success' };
}

module.exports = {
    initializeWhatsApp,
    sendWhatsAppMessage
};
