const sequelize = require('./config/database');
const User = require('./models/User');

async function syncDb() {
  try {
    console.log('Authenticating...');
    await sequelize.authenticate();
    console.log('Syncing User with alter: true...');
    await User.sync({ alter: true });
    console.log('Sync complete.');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}
syncDb();
