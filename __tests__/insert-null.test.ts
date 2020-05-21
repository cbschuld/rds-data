// eslint-disable-next-line import/no-extraneous-dependencies
import { v4 as uuid } from 'uuid';
import { setupRDSDatabase } from './db';

let id = uuid();
let pk = 0;

test('Insert UUID as null, read back and update', async () => {
  const rds = setupRDSDatabase().getInstance();
  const writeResults = await rds.query('INSERT INTO TestList (id,uuid) VALUES(null,null)');
  pk = writeResults.insertId || 0;

  let readResults = await rds.query('SELECT id, uuid FROM TestList WHERE id = :pk', { pk });

  expect(writeResults.insertId).not.toBe(0);
  expect(writeResults.numberOfRecordsUpdated).toBe(1);

  expect(readResults.data[0].uuid.isNull).toBe(true);
  expect(readResults.data[0].uuid.string).toBe(undefined);
  expect(readResults.data[0].id.string).not.toBe(0);

  id = uuid();

  await rds.query('UPDATE TestList SET uuid = :id WHERE id = :pk', { pk, id });
  readResults = await rds.query('SELECT id, uuid FROM TestList WHERE id = :pk', { pk });

  expect(readResults.data.length).toBe(1);
  expect(readResults.columns.length).toBe(2);
  expect(readResults.insertId).toBe(0);
  expect(readResults.numberOfRecordsUpdated).toBe(0);
  expect(readResults.data[0].uuid.string).toBe(id);
  expect(readResults.data[0].id.string).not.toBe(0);
});

test('Insert UUID as null from variable, read back and update', async () => {
  const rds = setupRDSDatabase().getInstance();
  const u: string | null = null;
  const writeResults = await rds.query('INSERT INTO TestList (id,uuid) VALUES(null,:u)', { u });
  pk = writeResults.insertId || 0;

  let readResults = await rds.query('SELECT id, uuid FROM TestList WHERE id = :pk', { pk });

  expect(writeResults.insertId).not.toBe(0);
  expect(writeResults.numberOfRecordsUpdated).toBe(1);

  expect(readResults.data[0].uuid.isNull).toBe(true);
  expect(readResults.data[0].uuid.string).toBe(undefined);
  expect(readResults.data[0].id.string).not.toBe(0);

  id = uuid();

  await rds.query('UPDATE TestList SET uuid = :id WHERE id = :pk', { pk, id });
  readResults = await rds.query('SELECT id, uuid FROM TestList WHERE id = :pk', { pk });

  expect(readResults.data.length).toBe(1);
  expect(readResults.columns.length).toBe(2);
  expect(readResults.insertId).toBe(0);
  expect(readResults.numberOfRecordsUpdated).toBe(0);
  expect(readResults.data[0].uuid.string).toBe(id);
  expect(readResults.data[0].id.string).not.toBe(0);
});
