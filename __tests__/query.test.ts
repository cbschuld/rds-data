import {setupRDSDatabase} from "./db";

xtest('Read Query of a Single Integer check return payload', async () => {
    const rds = setupRDSDatabase().getInstance();
    const results = await rds.query("SELECT id FROM TestList WHERE id = 1 LIMIT 1");
    
    expect(results.data.length).toBe(1);
    expect(results.columns.length).toBe(1);
    expect(results.insertId).toBe(0);
    expect(results.numberOfRecordsUpdated).toBe(0);
    expect(results.data[0].id.number).toBe(1);
});

xtest('Read Query of a Single Integer check return payload', async () => {
    const rds = setupRDSDatabase().getInstance();
    const results = await rds.query("SELECT id FROM TestList WHERE id = 1 LIMIT 1");
    
    expect(results.data.length).toBe(1);
    expect(results.columns.length).toBe(1);
    expect(results.insertId).toBe(0);
    expect(results.numberOfRecordsUpdated).toBe(0);
    expect(results.data[0].id.number).toBe(1);
});