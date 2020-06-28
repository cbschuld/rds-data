import { Agent } from 'http';
import * as AWS from 'aws-sdk';
import RDSDatabase from "../src/RDSDatabase";

AWS.config.logger = console;

function getConfig(provideRegion = true) {
    return {
        region: provideRegion ? process.env.RDS_DATA_API_CLIENT_REGION || "" : undefined,
        secretArn: process.env.RDS_DATA_API_CLIENT_SECRETARN || "",
        resourceArn: process.env.RDS_DATA_API_CLIENT_RESOURCE_ARN || "",
        database: process.env.RDS_DATA_API_CLIENT_DATABASE || "",
        rdsConfig: process.env.CI === 'true'
        ? {
              // we're in a test environment
              endpoint: 'http://localhost:8080',
              httpOptions: {
                  agent: new Agent(),
              },
          }
        : {
              // not in a test environment
          },
    }
}

export const setupRDSDatabase = (): RDSDatabase => new RDSDatabase(getConfig(true));

export const setupRDSDatabaseNoRegion = (): RDSDatabase => new RDSDatabase(getConfig(false));

test('RDS Instantiation', () => {
    const rds = setupRDSDatabase();
    expect(rds).toBeInstanceOf(RDSDatabase);
});
