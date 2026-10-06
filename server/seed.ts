import { initDB } from './db.js';
import { bootstrapData } from './bootstrap.js';

async function runSeed() {
  console.log('🌱 Starting database seeding command...');
  process.env.RUN_BOOTSTRAP = 'true';
  await initDB();
  await bootstrapData();
  console.log('🌸 Database seeding command finished successfully.');
  process.exit(0);
}

runSeed().catch(err => {
  console.error('❌ Database seeding command encountered a fatal error:', err);
  process.exit(1);
});
