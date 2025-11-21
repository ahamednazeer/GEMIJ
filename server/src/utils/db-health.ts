import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DatabaseHealthStatus {
    isConnected: boolean;
    message: string;
    error?: string;
}

/**
 * Check if the database is accessible and responsive
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
    try {
        // Try to execute a simple query
        await prisma.$queryRaw`SELECT 1`;

        return {
            isConnected: true,
            message: 'Database connection successful'
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
            isConnected: false,
            message: 'Database connection failed',
            error: errorMessage
        };
    }
}

/**
 * Check if the database has been seeded (by checking if any users exist)
 */
export async function isDatabaseSeeded(): Promise<boolean> {
    try {
        const userCount = await prisma.user.count();
        return userCount > 0;
    } catch (error) {
        console.error('Error checking if database is seeded:', error);
        return false;
    }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
}
