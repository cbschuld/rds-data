/**
 * @group mysql
 */

import { setupRDSDatabase } from './db';

test('select an integer', async () => {
  const rds = setupRDSDatabase().getInstance();
  const results = await rds.query('SELECT 1 as id');
  expect(results.data[0].id.number).toBe(1);
});
