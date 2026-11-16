require('dotenv').config();
const { app } = require('./app');

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`GadgetKu API berjalan di http://localhost:${PORT}`);
  const demoEmails = ['SEED_ADMIN_EMAIL', 'SEED_SELLER_EMAIL', 'SEED_PEMBELI_EMAIL']
    .map((key) => process.env[key])
    .filter(Boolean);
  if (demoEmails.length) console.log(`Akun contoh: ${demoEmails.join(' | ')}`);
  console.log('Password akun contoh mengikuti SEED_PASSWORD di server/.env');
});
