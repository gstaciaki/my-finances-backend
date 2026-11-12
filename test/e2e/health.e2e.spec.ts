import request from 'supertest';
import { app } from '@src/app';
import { prisma } from '@src/database';

describe('GET /health (e2e)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('responds 200 without listening on a port', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
  });

  it('runs against the test database', async () => {
    const [row] = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database()
    `;

    expect(row.current_database.endsWith('_test')).toBe(true);
  });
});
