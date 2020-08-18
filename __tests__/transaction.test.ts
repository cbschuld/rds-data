/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Transaction tests
 *
 * @group pg
 * @group mysql
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { v4 as uuid } from 'uuid';
import { setupRDSDatabase } from './db';

const TABLE = `TestList${process.env.JEST_WORKER_ID}`;

const sleepyTime = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

beforeAll(async () => {
  const rds = setupRDSDatabase().getInstance();
  await rds.query(`DROP TABLE IF EXISTS ${TABLE};`);
  await rds.query(`
    CREATE TABLE ${TABLE} (
      data TEXT DEFAULT NULL
    );`);
});

test.only('Simple Transaction', async () => {
  const rds = setupRDSDatabase().getInstance();

  const startInfo = await rds.query(`SELECT COUNT(*) AS cn FROM ${TABLE}`);

  const results = await rds.transaction().then(async (transactionId) => {
    await rds.query(`INSERT INTO ${TABLE} (data) VALUES (:data)`, { data: uuid() }, transactionId);
    await rds.query(`INSERT INTO ${TABLE} (data) VALUES (:data)`, { data: uuid() }, transactionId);
    await rds.query(`INSERT INTO ${TABLE} (data) VALUES (:data)`, { data: uuid() }, transactionId);
    const r = await rds.commit(transactionId);
    return r;
  });

  expect(results).toBe('Transaction Committed');

  const endInfo = await rds.query(`SELECT COUNT(*) AS cn FROM ${TABLE}`);
  const startCount = startInfo.data[0].cn.number;
  const endCount = endInfo.data[0].cn.number;

  expect(results).toBe('Transaction Committed');
  expect(startCount).toBe(endCount! - 3);
});

test('Rollback Transaction', async () => {
  const rds = setupRDSDatabase().getInstance();

  const startInfo = await rds.query(`SELECT COUNT(id) AS cn FROM ${TABLE}`);

  const results = await rds.transaction().then(async (transactionId) => {
    await rds.query(`INSERT INTO ${TABLE} (data) VALUES (:data)`, { data: uuid() }, transactionId);
    await rds.query(`INSERT INTO ${TABLE} (data) VALUES (:data)`, { data: uuid() }, transactionId);
    await rds.query(`INSERT INTO ${TABLE} (data) VALUES (:data)`, { data: uuid() }, transactionId);
    const r = await rds.rollback(transactionId);
    return r;
  });

  // transactions can execute slowly in aurora and
  // the count can sometimes come back before the lock is over
  if (process.env.CI !== 'true') await sleepyTime(500);

  const endInfo = await rds.query(`SELECT COUNT(*) AS cn FROM ${TABLE}`);
  const startCount = startInfo.data[0].cn.number;
  const endCount = endInfo.data[0].cn.number;

  expect(results).toBe('Rollback Complete');
  expect(startCount).toBe(endCount);
});
