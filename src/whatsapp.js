const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { Boom } = require('@hapi/boom');
require('dotenv').config();

let sockGlobal = null;

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state
    });

    sockGlobal = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        console.log('💡 Connection update:', update);
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'open') {
            console.log('✅ WhatsApp connected!');
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('🔌 Disconnected:', reason);
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(startSock, 3000); // retry connect
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (from === 'status@broadcast') return;

        if (isGroup) {
            console.log('📣 Pesan dari grup:', from);
        } else {
            console.log('📩 Pesan pribadi dari:', from);

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
    });
}

// Digunakan untuk kirim pesan WA dari luar
async function sendWhatsAppMessage(number, message) {
    if (!sockGlobal) throw new Error('WhatsApp not connected');
    const jid = number + '@s.whatsapp.net';
    await sockGlobal.sendMessage(jid, { text: message });
    return { to: number, status: 'success' };
}

module.exports = {
    startSock,
    sendWhatsAppMessage
};
