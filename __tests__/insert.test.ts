// eslint-disable-next-line import/no-extraneous-dependencies
import { v4 as uuid } from 'uuid';
import { setupRDSDatabase } from './db';

const id = uuid();
let pk = 0;

test('Insert UUID', async () => {
  const rds = setupRDSDatabase().getInstance();
  const results = await rds.query('INSERT INTO TestList (id,uuid) VALUES(null,:id)', { id });

  expect(results.insertId).not.toBe(0);
  expect(results.numberOfRecordsUpdated).toBe(1);

  pk = results.insertId || 0;
});

test('Read back a UUID and validate content', async () => {
  const rds = setupRDSDatabase().getInstance();
  const results = await rds.query('SELECT id, uuid FROM TestList WHERE id = :pk', { pk });

  expect(results.data.length).toBe(1);
  expect(results.columns.length).toBe(2);
  expect(results.insertId).toBe(0);
  expect(results.numberOfRecordsUpdated).toBe(0);
  expect(results.data[0].uuid.string).toBe(id);
  expect(results.data[0].id.string).not.toBe(0);
});