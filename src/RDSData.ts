import { RDSDataService } from 'aws-sdk';
import { SqlParametersList } from 'aws-sdk/clients/rdsdataservice';

export interface RDSDataOptions {
  secretArn: string;
  resourceArn: string;
  database: string;
  region?: string;
  rdsConfig?: RDSDataService.Types.ClientConfiguration;
}

// COLUMNS & PARAMETERS -------------------------
export interface RDSDataColumn {
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
export type RDSDataTypes = 'stringValue' | 'booleanValue' | 'longValue' | 'isNull' | 'blobValue' | 'doubleValue' |undefined;

export type RDSDataParameterValue = string | Buffer | boolean | number | null | undefined;
export interface RDSDataParameters {
  [key: string]: RDSDataParameterValue;
}
export type RDSDataRow = { [key: string]: RDSDataResponseValue };

// RESPONSE TYPES -------------------------------
export interface RDSDataResponseValue {
  isNull: boolean;
  string?: string;
  date?: Date;
  boolean?: boolean;
  buffer?: Buffer;
  number?: number;
}

export interface RDSDataResponseData {
  [key: string]: RDSDataResponseValue;
}

export interface RDSDataResponse {
  columns: RDSDataColumn[];
  data: RDSDataResponseData[];
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

  public async query(sql: string, params?: RDSDataParameters, transactionId?: string): Promise<RDSDataResponse> {
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

    const getType = (val: RDSDataParameterValue): RDSDataTypes => {
      const t = typeof val;
      if (t === 'string') {
        return 'stringValue';
      }
      if (t === 'boolean') {
        return 'booleanValue';
      }
      if (t === 'number') {
        if (val && val as number % 1 !== 0) {
          return 'doubleValue';
        }
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

    const formatType = (name: string, value: RDSDataParameterValue, type: RDSDataTypes): RDSDataType => {
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

  private static resultFormat(response: RDSDataService.Types.ExecuteStatementResponse): RDSDataResponse {
    const insertId =
      response.generatedFields && response.generatedFields.length > 0 ? response.generatedFields[0].longValue : 0;
    const columns: RDSDataColumn[] = [];
    const data: { [key: string]: RDSDataResponseValue }[] = [];
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
        const row: RDSDataRow = {};
        for (let c = 0; c < record.length; c += 1) {
          /* tslint:disable:no-string-literal */
          const isNull = record[c].isNull ?? false;
          const v: RDSDataResponseValue = { isNull };
          switch (columns[c].type) {
            case 'BINARY':
              v.buffer = isNull ? undefined : Buffer.from((record[c].blobValue || '').toString());
              v.string = isNull ? undefined : v.buffer?.toString('base64');
              break;
            case 'BOOL':
            case 'BIT':
              v.boolean = isNull ? undefined : record[c].booleanValue;
              v.number = v.boolean ? 1 : 0;
              break;
            case 'TIMESTAMP':
            case 'DATETIME':
            case 'DATE':
              v.date = isNull ? undefined : new Date(record[c].stringValue ?? '');
              v.string = isNull ? undefined : record[c].stringValue;
              v.number = v.date ? v.date.getTime() : 0;
              break;
            case 'INTEGER':
            case 'INTEGER UNSIGNED':
            case 'INT':
            case 'INT4':
            case 'INT8':
            case 'INT UNSIGNED':
            case 'BIGINT':
            case 'BIGINT UNSIGNED':
            case 'SERIAL':
              v.number = isNull ? undefined : record[c].longValue;
              break;
            case 'DECIMAL':
              v.number = isNull ? undefined : parseFloat(record[c].stringValue!);
              break;
            case 'UUID':
            case 'TEXT':
            case 'CHAR':
            case 'BPCHAR':
            case 'VARCHAR':
              v.string = isNull ? undefined : record[c].stringValue;
              break;
            default:
              throw new Error(`Missing type: ${columns[c].type}`);
          }
          /* tslint:enable:no-string-literal */
          row[columns[c].name] = v;
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
