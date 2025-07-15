require('dotenv').config();
const app = require('./src/server');
const { initializeWhatsApp } = require('./src/whatsapp');

const PORT = process.env.PORT || 3000;

initializeWhatsApp();
app.listen(PORT, () => console.log(`📡 API running at http://localhost:${PORT}`));
