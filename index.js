require('dotenv').config();
const app = require('./src/server');
const { startSock } = require('./src/whatsapp');

const PORT = process.env.PORT || 3000;

startSock();
app.listen(PORT, () => console.log(`📡 API running at http://localhost:${PORT}`));
