import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { checkDatabaseHealth, isDatabaseSeeded } from './db-health';

const execAsync = promisify(exec);

/**
 * Run Prisma migrations
 */
async function runMigrations(): Promise<void> {
    console.log('🔄 Running database migrations...');

    try {
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
            cwd: path.join(__dirname, '../..'),
            env: { ...process.env }
        });

        if (stdout) console.log(stdout);
        if (stderr && !stderr.includes('already applied')) console.error(stderr);

        console.log('✅ Database migrations completed successfully');
    } catch (error) {
        console.error('❌ Error running migrations:', error);
        throw error;
    }
}

/**
 * Run database seed script
 */
async function runSeed(): Promise<void> {
    console.log('🌱 Seeding database with initial data...');

    try {
        const { stdout, stderr } = await execAsync('npm run seed', {
            cwd: path.join(__dirname, '../..'),
            env: { ...process.env }
        });

        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        console.log('✅ Database seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

/**
 * Wait for database to be available with retry logic
 */
async function waitForDatabase(maxRetries = 10, retryDelay = 2000): Promise<void> {
    console.log('⏳ Waiting for database to be available...');

    for (let i = 0; i < maxRetries; i++) {
        const health = await checkDatabaseHealth();

        if (health.isConnected) {
            console.log('✅ Database is available');
            return;
        }

        console.log(`⏳ Database not ready (attempt ${i + 1}/${maxRetries}). Retrying in ${retryDelay / 1000}s...`);

        if (health.error) {
            console.log(`   Error: ${health.error}`);
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error('Database is not available after maximum retries');
}

/**
 * Initialize the database: check connection, run migrations, and seed if needed
 */
export async function initializeDatabase(): Promise<void> {
    console.log('\n🚀 Initializing database...\n');

    try {
        // Step 1: Wait for database to be available
        await waitForDatabase();

        // Step 2: Run migrations
        await runMigrations();

        // Step 3: Check if database needs seeding
        const isSeeded = await isDatabaseSeeded();

        if (!isSeeded) {
            console.log('📊 Database is empty, running seed script...');
            await runSeed();
        } else {
            console.log('✅ Database already contains data, skipping seed');
        }

        console.log('\n✅ Database initialization completed successfully!\n');
    } catch (error) {
        console.error('\n❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Initialize database with graceful error handling
 * Returns true if successful, false otherwise
 */
export async function initializeDatabaseSafe(): Promise<boolean> {
    try {
        await initializeDatabase();
        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
}
