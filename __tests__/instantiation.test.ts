/**
 * lib instantiation tests
 *
 * @group pg
 * @group mysql
 */

import { config } from 'aws-sdk';
import { setupRDSDatabase, setupRDSDatabaseNoRegion } from './db';

test('RDS Instantiation', () => {
  const rds = setupRDSDatabase();
  expect(process.env.RDS_DATA_API_CLIENT_DATABASE).not.toBe('');
  expect(process.env.RDS_DATA_API_CLIENT_RESOURCE_ARN).not.toBe('');
  expect(process.env.RDS_DATA_API_CLIENT_SECRETARN).not.toBe('');
  expect(process.env.RDS_DATA_API_CLIENT_REGION).not.toBe('');
  expect(rds.getOptions().database).toBe(process.env.RDS_DATA_API_CLIENT_DATABASE);
  expect(rds.getOptions().resourceArn).toBe(process.env.RDS_DATA_API_CLIENT_RESOURCE_ARN);
  expect(rds.getOptions().secretArn).toBe(process.env.RDS_DATA_API_CLIENT_SECRETARN);
  expect(rds.getOptions().region).toBe(process.env.RDS_DATA_API_CLIENT_REGION);
});

test('RDS Instantiation - no region', () => {
  config.region = process.env.RDS_DATA_API_CLIENT_REGION;
  const rds = setupRDSDatabaseNoRegion();
  expect(process.env.RDS_DATA_API_CLIENT_DATABASE).not.toBe('');
  expect(process.env.RDS_DATA_API_CLIENT_RESOURCE_ARN).not.toBe('');
  expect(process.env.RDS_DATA_API_CLIENT_SECRETARN).not.toBe('');
  expect(process.env.RDS_DATA_API_CLIENT_REGION).not.toBe('');
  expect(rds.getOptions().database).toBe(process.env.RDS_DATA_API_CLIENT_DATABASE);
  expect(rds.getOptions().resourceArn).toBe(process.env.RDS_DATA_API_CLIENT_RESOURCE_ARN);
  expect(rds.getOptions().secretArn).toBe(process.env.RDS_DATA_API_CLIENT_SECRETARN);
  expect(rds.getOptions().region).toBe(process.env.RDS_DATA_API_CLIENT_REGION);
});
