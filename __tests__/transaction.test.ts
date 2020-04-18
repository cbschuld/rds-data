import {setupRDSDatabase} from "./db";
import {v4 as uuid} from "uuid";

xtest('Simple Transaction', async () => {
    const rds = setupRDSDatabase().getInstance();
    const uuid1 = uuid();
    const uuid2 = uuid();
    const uuid3 = uuid();

    const startInfo = await rds.query("SELECT COUNT(id) AS cn FROM TestList");

    const results = await rds.transaction().then(async (transactionId) => {
        await rds.query("INSERT INTO TestList (uuid) VALUES (:uuid1)", {uuid1}, transactionId);
        await rds.query("INSERT INTO TestList (uuid) VALUES (:uuid2)", {uuid2}, transactionId);
        await rds.query("INSERT INTO TestList (uuid) VALUES (:uuid3)", {uuid3}, transactionId);
        const results = await rds.commit(transactionId);
        return results;
    });

    const endInfo = await rds.query("SELECT COUNT(id) AS cn FROM TestList");
    const startCount = (startInfo.data[0].cn.number ?? 0);
    const endCount = (endInfo.data[0].cn.number ?? 0);

    expect(results).toBe("Transaction Committed");
    expect(startCount).toBe(endCount - 3);
});

xtest('Rollback Transaction', async () => {
    const rds = setupRDSDatabase().getInstance();
    const uuid1 = uuid();
    const uuid2 = uuid();
    const uuid3 = uuid();

    const startInfo = await rds.query("SELECT COUNT(id) AS cn FROM TestList");

    const results = await rds.transaction().then(async (transactionId) => {
        await rds.query("INSERT INTO TestList (uuid) VALUES (:uuid1)", {uuid1}, transactionId);
        await rds.query("INSERT INTO TestList (uuid) VALUES (:uuid2)", {uuid2}, transactionId);
        await rds.query("INSERT INTO TestList (uuid) VALUES (:uuid3)", {uuid3}, transactionId);
        const results = await rds.rollback(transactionId);
        return results;
    });

    const endInfo = await rds.query("SELECT COUNT(id) AS cn FROM TestList");
    const startCount = (startInfo.data[0].cn.number ?? 0);
    const endCount = (endInfo.data[0].cn.number ?? 0);

    expect(results).toBe("Rollback Complete");
    expect(startCount).toBe(endCount);
});
