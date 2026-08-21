const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigrations() {
  console.log('[Migrator] Starting database migrations...');
  const migrationsDir = path.join(__dirname, 'migrations');

  try {
    // Ensure migrations table exists to track executed migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL UNIQUE,
        \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const [executedRows] = await pool.query('SELECT name FROM `schema_migrations`');
    const executedSet = new Set(executedRows.map(r => r.name));

    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`[Migrator] Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`[Migrator] Executing ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Split statements by semicolon where appropriate or execute whole block
      const connection = await pool.getConnection();
      try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        // Execute SQL script
        const statements = sqlContent
          .split(/;\s*$/m)
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await connection.query(statement);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.query('INSERT INTO `schema_migrations` (`name`) VALUES (?)', [file]);
        console.log(`[Migrator] Successfully executed ${file}`);
      } finally {
        connection.release();
      }
    }

    console.log('[Migrator] All database migrations completed successfully.');
    return true;
  } catch (error) {
    console.error('[Migrator Error] Migration failed:', error.message);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}

module.exports = runMigrations;
