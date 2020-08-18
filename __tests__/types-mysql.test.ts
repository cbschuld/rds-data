/**
 * MySQL type tests
 *
 * In the future, consider adding types to query-{db}.test.ts, not this file.
 *
 * @group mysql
 */

/* eslint-disable import/no-extraneous-dependencies */
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import { setupRDSDatabase } from './db';

const getRandomArbitrary = (min: number, max: number): number => Math.random() * (max - min) + min;
const uid = uuid().replace(/-/gi, '');
const d = new Date('2020-06-27T21:02:28.419Z');
const i = Math.floor(getRandomArbitrary(1024 * 1024, 0));
const txt = uuid() + uuid() + uuid() + uuid() + uuid() + uuid();
const vc = txt;
const ch = uuid().substr(0, 22);

const TABLE = `TestList${process.env.JEST_WORKER_ID}`;

beforeAll(async () => {
  const rds = setupRDSDatabase().getInstance();
  await rds.query(`DROP TABLE IF EXISTS ${TABLE};`)
  await rds.query(
    `CREATE TABLE ${TABLE} (
      id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
      bin BINARY(16) DEFAULT NULL,
      bit BIT(1) DEFAULT NULL,
      ts TIMESTAMP NULL DEFAULT NULL,
      dte DATETIME DEFAULT NULL,
      dt DATE DEFAULT NULL,
      ui INT(10) UNSIGNED DEFAULT NULL,
      i INT(11) DEFAULT NULL,
      txt TEXT,
      ch CHAR(22) DEFAULT NULL,
      vc VARCHAR(1024) DEFAULT NULL
    );`);
});

test('Insert row of different data types', async () => {
  const rds = setupRDSDatabase().getInstance();
  let results = await rds.query(
    `INSERT INTO ${TABLE} (id,bin,bit,ts,dte,dt,i,txt,ch,vc)
        VALUES(null,UNHEX(:uid),1,NOW(),:dte,:dt,:i,:txt,:ch,:vc)`,
    { uid, ts: format(d, 'yyyy-MM-dd HH:mm:ss'), dte: format(d, 'yyyy-MM-dd HH:mm:ss'), dt: format(d, 'yyyy-MM-dd'), i, txt, ch, vc },
  );

  expect(results.insertId).not.toBe(0);
  expect(results.numberOfRecordsUpdated).toBe(1);

  const pk = results.insertId;

  results = await rds.query(
    `SELECT id,HEX(bin) AS b58,bit,ts,dte,dt,ui,i,txt,ch,vc
            FROM ${TABLE}
            WHERE id = :pk`,
    { pk },
  );

  expect(results.data.length).toBe(1);
  expect(results.columns.length).toBe(11);
  expect(results.insertId).toBe(0);
  expect(results.numberOfRecordsUpdated).toBe(0);

  const row = results.data[0];
  expect(row.id.number).toBe(pk);
  expect((row.b58.string || '').toLowerCase()).toBe(uid.toLowerCase());
  expect(row.bit.boolean).toBe(true);
  // TODO: what the hell is wrong with this?
  // expect(row.ts.string).toBe(format(d, 'yyyy-MM-dd HH:mm:ss'));
  expect(row.dte.string).toBe(format(d, 'yyyy-MM-dd HH:mm:ss'));
  expect(row.dt.string).toBe(format(d, 'yyyy-MM-dd'));
  expect(row.i.number).toBe(i);
  expect(row.txt.string).toBe(txt);
  expect(row.ch.string).toBe(ch);
  expect(row.vc.string).toBe(vc);
});
