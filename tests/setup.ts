
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from '@neondatabase/serverless';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for testing
neonConfig.webSocketConstructor = ws;

// Test database URL (should be different from production)
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for testing');
}

export const testPool = new Pool({ connectionString: TEST_DATABASE_URL });

// Test user data
export const testUsers = {
  owner: {
    id: 'test-owner-1',
    email: 'owner@test.com',
    firstName: 'Test',
    lastName: 'Owner',
    role: 'owner'
  },
  admin: {
    id: 'test-admin-1', 
    email: 'admin@test.com',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin'
  },
  viewer: {
    id: 'test-viewer-1',
    email: 'viewer@test.com', 
    firstName: 'Test',
    lastName: 'Viewer',
    role: 'viewer'
  }
};

export async function cleanDatabase() {
  const client = await testPool.connect();
  try {
    // Clean all tables in reverse dependency order
    await client.query('TRUNCATE TABLE ssl_certificates CASCADE');
    await client.query('TRUNCATE TABLE domains CASCADE');
    await client.query('TRUNCATE TABLE alert_settings CASCADE');
    await client.query('TRUNCATE TABLE incidents CASCADE');
    await client.query('TRUNCATE TABLE privacy_notices CASCADE');
    await client.query('TRUNCATE TABLE dsar_requests CASCADE');
    await client.query('TRUNCATE TABLE consent_records CASCADE');
    await client.query('TRUNCATE TABLE data_types CASCADE');
    await client.query('TRUNCATE TABLE users CASCADE');
    await client.query('TRUNCATE TABLE sessions CASCADE');
  } finally {
    client.release();
  }
}

export async function seedTestUsers() {
  const client = await testPool.connect();
  try {
    for (const user of Object.values(testUsers)) {
      await client.query(
        `INSERT INTO users (id, email, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email, user.firstName, user.lastName, user.role]
      );
    }
  } finally {
    client.release();
  }
}

// Global test setup
beforeAll(async () => {
  // Ensure test database is ready
  await testPool.query('SELECT 1');
});

beforeEach(async () => {
  await cleanDatabase();
  await seedTestUsers();
});

afterAll(async () => {
  await testPool.end();
});
