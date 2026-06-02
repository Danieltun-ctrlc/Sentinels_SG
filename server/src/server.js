const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🛡️  Sentinel SG backend running on http://localhost:${PORT}`);
});
