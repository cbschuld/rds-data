import { RDSDataService } from 'aws-sdk';
import { SqlParametersList } from 'aws-sdk/clients/rdsdataservice';
import ColumnValue from './ColumnValue';

export interface RDSDataOptions {
  secretArn: string;
  resourceArn: string;
  database: string;
  region?: string;
  rdsConfig?: RDSDataService.Types.ClientConfiguration;
}

export interface DataColumn {
  name: string;
  tableName: string;
  type: string;
}

export interface RDSDataType {
  name: string;
  value: {
    [x: string]: string | boolean | Buffer | null;
  };
}
export type RDSDataTypes = 'stringValue' | 'booleanValue' | 'longValue' | 'isNull' | 'blobValue' | undefined;

export type ParameterValue = string | Buffer | boolean | number | null | undefined;
export interface RDSDataParameters {
  [key: string]: ParameterValue;
}
export type Row = { [key: string]: ColumnValue };

export interface ResponseData {
  [key: string]: ColumnValue;
}

export interface Response {
  columns: DataColumn[];
  data: ResponseData[];
  numberOfRecordsUpdated: number;
  insertId: number | undefined;
}

export class RDSData {
  private rds: RDSDataService | null = null;

  private config: RDSDataOptions = {
    region: '',
    secretArn: '',
    resourceArn: '',
    database: '',
  };

  constructor(options?: RDSDataOptions) {
    if (options) {
      this.config = options;
    }
  }

  private getConnection(): RDSDataService {
    if (!this.rds) {
      this.rds = new RDSDataService({
        apiVersion: '2018-08-01',
        region: this.config.region,
        // apply extra options
        // these override apiVersion and region
        ...this.config.rdsConfig,
      });
    }
    return this.rds;
  }

  public async query(sql: string, params?: RDSDataParameters, transactionId?: string): Promise<Response> {
    const parameters = RDSData.formatParameters(params);
    return new Promise((resolve, reject) => {
      let queryParameters: RDSDataService.Types.ExecuteStatementRequest = {
        secretArn: this.config.secretArn,
        resourceArn: this.config.resourceArn,
        database: this.config.database,
        includeResultMetadata: true,
        parameters,
        sql,
      };
      if (transactionId) {
        queryParameters = { ...queryParameters, transactionId };
      }

      this.getConnection()
        .executeStatement(queryParameters)
        .promise()
        .then((response) => {
          const result = RDSData.resultFormat(response);
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private static formatParameters(params?: RDSDataParameters): SqlParametersList {
    if (!params) {
      return [];
    }

    const getType = (val: ParameterValue): RDSDataTypes => {
      const t = typeof val;
      if (t === 'string') {
        return 'stringValue';
      }
      if (t === 'boolean') {
        return 'booleanValue';
      }
      if (t === 'number') {
        return 'longValue';
      }
      if (val === null) {
        return 'isNull';
      }
      if (Buffer.isBuffer(val)) {
        return 'blobValue';
      }
      return undefined;
    };

    const formatType = (name: string, value: ParameterValue, type: RDSDataTypes): RDSDataType => {
      if (!type) {
        throw new Error(`Invalid Type for name: ${name} value: ${value} type: ${type} typeof: ${typeof value}`);
      }
      const getValue = (t: RDSDataTypes): null | Buffer | boolean | string => {
        if (t === 'isNull') {
          return true;
        }
        if (t === 'blobValue') {
          return value as Buffer;
        }
        if (t === 'booleanValue') {
          return !!value;
        }
        return value?.toString() || '';
      };
      return {
        name,
        value: {
          [type]: getValue(type),
        },
      };
    };

    const parameters: SqlParametersList = Object.keys(params).map((key) =>
      formatType(key, params[key], getType(params[key])),
    );
    return parameters;
  }

  private static resultFormat(response: RDSDataService.Types.ExecuteStatementResponse): Response {
    const insertId =
      response.generatedFields && response.generatedFields.length > 0 ? response.generatedFields[0].longValue : 0;
    const columns: DataColumn[] = [];
    const data: { [key: string]: ColumnValue }[] = [];
    const numberOfRecordsUpdated = response.numberOfRecordsUpdated ?? 0;

    if (response && response.columnMetadata && response.records) {
      response.columnMetadata.map((column) => {
        return columns.push({
          name: column.label || '',
          tableName: column.tableName || '',
          type: column.typeName?.toUpperCase() || '',
        });
      });

      response.records.forEach((record) => {
        const row: Row = {};
        for (let c = 0; c < record.length; c += 1) {
          row[columns[c].name] = new ColumnValue(record[c]);
        }
        data.push(row);
      });
    }

    return { data, columns, numberOfRecordsUpdated, insertId };
  }

  public transaction(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getConnection()
        .beginTransaction({
          secretArn: this.config.secretArn,
          resourceArn: this.config.resourceArn,
          database: this.config.database,
        })
        .promise()
        .then((response) => {
          resolve(response.transactionId ?? '');
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public commit(transactionId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getConnection()
        .commitTransaction({
          resourceArn: this.config.resourceArn,
          secretArn: this.config.secretArn,
          transactionId,
        })
        .promise()
        .then((response) => {
          resolve(response.transactionStatus ?? '');
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public rollback(transactionId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.getConnection()
        .rollbackTransaction({
          resourceArn: this.config.resourceArn,
          secretArn: this.config.secretArn,
          transactionId,
        })
        .promise()
        .then((response) => {
          resolve(response.transactionStatus ?? '');
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}
