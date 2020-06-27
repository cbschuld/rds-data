/**
 * @group pg
 */

import { setupRDSDatabase } from './db';

test('select an integer', async () => {
  const rds = setupRDSDatabase().getInstance();
  const results = await rds.query('SELECT 1 as id');
  expect(results.data[0].id.number).toBe(1);
});

test('select a uuid', async () => {
  const rds = setupRDSDatabase().getInstance();
  await rds.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  const results = await rds.query('SELECT gen_random_uuid() as id');

  expect(results.data[0].id.string).toEqual(expect.stringMatching(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/));
});

// TODO binary decode('YmFzZTY0IGVuY29kZWQgc3RyaW5n', 'base64')
// TODO custom enumerations
// TODO arrays SELECT ARRAY[0, 1, 2, 3]::INT[] as arr
// TODO bson
