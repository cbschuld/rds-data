// eslint-disable-next-line import/no-extraneous-dependencies
import { v4 as uuid } from 'uuid';
// eslint-disable-next-line import/no-extraneous-dependencies
import { uuid58 } from 'uuid-base58';
// eslint-disable-next-line import/no-extraneous-dependencies
import { format, add } from 'date-fns';
import { setupRDSDatabase } from './db';

const getRandomArbitrary = (min: number, max: number): number => Math.random() * (max - min) + min;
const uid = uuid().replace(/-/gi, '');
const d = add(new Date(), { days: 10 });
const i = Math.floor(getRandomArbitrary(1024 * 1024, 0));
const iu = Math.floor(getRandomArbitrary(10240 * 10240, 0));
const txt = uuid() + uuid() + uuid() + uuid() + uuid() + uuid();
const ch = uuid58();
const vc = uuid58() + uuid58() + uuid58() + uuid58() + uuid58() + uuid58();
let pk = 0;

test('Insert row of unique types', async () => {
  const rds = setupRDSDatabase().getInstance();
  const results = await rds.query(
    `INSERT INTO TestType (id,bin,bit,ts,dte,dt,i,iu,txt,ch,vc)
        VALUES(null,UNHEX(:uid),1,NOW(),:dte,:dt,:i,:iu,:txt,:ch,:vc)`,
    { uid, dte: format(d, 'yyyy-MM-dd HH:mm:ss'), dt: format(d, 'yyyy-MM-dd'), i, iu, txt, ch, vc },
  );

  expect(results.insertId).not.toBe(0);
  expect(results.numberOfRecordsUpdated).toBe(1);

  pk = results.insertId || 0;
});

test('Read back the types and validate', async () => {
  const rds = setupRDSDatabase().getInstance();
  const results = await rds.query(
    `SELECT id,HEX(bin) AS b58,bit,ts,dte,dt,i,iu,txt,ch,vc
            FROM TestType
            WHERE id = :pk`,
    { pk },
  );

  expect(results.data.length).toBe(1);
  expect(results.columns.length).toBe(11);
  expect(results.insertId).toBe(0);
  expect(results.numberOfRecordsUpdated).toBe(0);

  expect(results.data[0].id.number).toBe(pk);
  expect((results.data[0].b58.string || '').toLowerCase()).toBe(uid.toLowerCase());
  expect(results.data[0].bit.boolean).toBe(true);
  expect(results.data[0].ts.string).not.toBe('');
  expect(format(results.data[0].dte.date || new Date(), 'yyyy-MM-dd HH:mm:ss')).toBe(format(d, 'yyyy-MM-dd HH:mm:ss'));
  expect(format(results.data[0].dt.date || new Date(), 'yyyy-MM-dd')).toBe(format(d, 'yyyy-MM-dd'));
  expect(results.data[0].i.number).toBe(i);
  expect(results.data[0].iu.number).toBe(iu);
  expect(results.data[0].txt.string).toBe(txt);
  expect(results.data[0].ch.string).toBe(ch);
  expect(results.data[0].vc.string).toBe(vc);
});
