import RDSDatabase from "../src/RDSDatabase";

export const setupRDSDatabase = () => new RDSDatabase({
    region: process.env.RDS_DATA_API_CLIENT_REGION || "",
    secretArn: process.env.RDS_DATA_API_CLIENT_SECRETARN || "",
    resourceArn: process.env.RDS_DATA_API_CLIENT_RESOURCE_ARN || "",
    database: process.env.RDS_DATA_API_CLIENT_DATABASE || ""
});

export const setupRDSDatabaseNoRegion = () => new RDSDatabase({
    secretArn: process.env.RDS_DATA_API_CLIENT_SECRETARN || "",
    resourceArn: process.env.RDS_DATA_API_CLIENT_RESOURCE_ARN || "",
    database: process.env.RDS_DATA_API_CLIENT_DATABASE || ""
});

test('RDS Instantiation', () => {
    const rds = setupRDSDatabase();
    expect(rds).toBeInstanceOf(RDSDatabase);
});
