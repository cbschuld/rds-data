import { RDSDataService } from "aws-sdk";
import { SqlParametersList } from "aws-sdk/clients/rdsdataservice";

export interface RDSDataOptions {
  secretArn: string;
  resourceArn: string;
  database: string;
  region?: string;
}

// COLUMNS & PARAMETERS -------------------------
export interface RDSDataColumn {
  name: string;
  tableName: string;
  type: string;
}

export type RDSDataTypes = "stringValue" | "booleanValue" | "longValue" | "isNull" | "blobValue" | undefined;
export type RDSDataParameterValue = string | Buffer | boolean | number;
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
  private _rds: RDSDataService | null = null;
  private _config: RDSDataOptions = {
    region: "",
    secretArn: "",
    resourceArn: "",
    database: "",
  };

  constructor(options?: RDSDataOptions) {
    if (options) {
      this._config = options;
    }
  }

  private getConnection() {
    if (!this._rds) {
      this._rds = new RDSDataService({
        apiVersion: "2018-08-01",
        region: this._config.region,
      });
    }
    return this._rds;
  }

  public async query(sql: string, params?: RDSDataParameters, transactionId?: string): Promise<RDSDataResponse> {
    const parameters = this.formatParameters(params);
    return new Promise((resolve, reject) => {
      let queryParameters: RDSDataService.Types.ExecuteStatementRequest = {
        secretArn: this._config.secretArn,
        resourceArn: this._config.resourceArn,
        database: this._config.database,
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
          const result = this.resultFormat(response);
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private formatParameters(params?: RDSDataParameters): SqlParametersList {
    if (!params) {
      return [];
    }

    const getType = (val: RDSDataParameterValue) =>
      typeof val === "string"
        ? "stringValue"
        : typeof val === "boolean"
        ? "booleanValue"
        : typeof val === "number"
        ? "longValue"
        : val === null
        ? "isNull"
        : Buffer.isBuffer(val)
        ? "blobValue"
        : undefined;

    const formatType = (name: string, value: RDSDataParameterValue, type: RDSDataTypes) => {
      if (!type) {
        throw new Error(
          "Invalid Type for name: " + name + " value: " + value + " type: " + type + " typeof: " + typeof value,
        );
      }
      return {
        name,
        value: {
          [type]:
            type === "isNull"
              ? null
              : type === "blobValue"
              ? (value as Buffer)
              : type === "booleanValue"
              ? value
                ? true
                : false
              : value.toString(),
        },
      };
    };

    const parameters: SqlParametersList = [];
    for (const key of Object.keys(params)) {
      parameters.push(formatType(key, params[key], getType(params[key])));
    }
    return parameters;
  }

  private resultFormat(response: RDSDataService.Types.ExecuteStatementResponse) {
    const insertId =
      response.generatedFields && response.generatedFields.length > 0 ? response.generatedFields[0].longValue : 0;
    const columns: RDSDataColumn[] = [];
    const data: { [key: string]: RDSDataResponseValue }[] = [];
    const numberOfRecordsUpdated = response.numberOfRecordsUpdated ?? 0;

    if (response && response.columnMetadata && response.records) {
      response.columnMetadata.map((column) => {
        return columns.push({
          name: column.label || "",
          tableName: column.tableName || "",
          type: column.typeName || "",
        });
      });

      for (const record of response.records) {
        const row: RDSDataRow = {};
        for (let c = 0; c < record.length; c++) {
          /* tslint:disable:no-string-literal */
          const isNull = record[c]["isNull"] ?? false;
          const v: RDSDataResponseValue = { isNull };
          switch (columns[c].type) {
            case "BINARY":
              v.buffer = isNull ? undefined : Buffer.from((record[c]["blobValue"] || "").toString());
              v.string = isNull ? undefined : v.buffer?.toString("base64");
              break;
            case "BIT":
              v.boolean = isNull ? undefined : record[c]["booleanValue"];
              v.number = v.boolean ? 1 : 0;
              break;
            case "TIMESTAMP":
            case "DATETIME":
            case "DATE":
              v.date = isNull ? undefined : new Date(record[c]["stringValue"] ?? "");
              v.string = isNull ? undefined : record[c]["stringValue"];
              v.number = v.date ? v.date.getTime() : 0;
              break;
            case "INT":
            case "INT UNSIGNED":
            case "BIGINT":
            case "BIGINT UNSIGNED":
              v.number = isNull ? undefined : record[c]["longValue"];
              break;
            case "TEXT":
            case "CHAR":
            case "VARCHAR":
              v.string = isNull ? undefined : record[c]["stringValue"];
              break;
            default:
              throw new Error("Missing type: " + columns[c].type);
          }
          /* tslint:enable:no-string-literal */
          row[columns[c].name] = v;
        }
        data.push(row);
      }
    }

    return { data, columns, numberOfRecordsUpdated, insertId };
  }

  public transaction() {
    return new Promise<string>((resolve, reject) => {
      this.getConnection()
        .beginTransaction({
          secretArn: this._config.secretArn,
          resourceArn: this._config.resourceArn,
          database: this._config.database,
        })
        .promise()
        .then((response) => {
          resolve(response.transactionId ?? "");
        })
        .catch(() => {
          reject("");
        });
    });
  }

  public commit(transactionId: string) {
    return new Promise<string>((resolve, reject) => {
      this.getConnection()
        .commitTransaction({
          resourceArn: this._config.resourceArn,
          secretArn: this._config.secretArn,
          transactionId,
        })
        .promise()
        .then((response) => {
          resolve(response.transactionStatus ?? "");
        })
        .catch(() => {
          reject("");
        });
    });
  }

  public rollback(transactionId: string) {
    return new Promise<string>((resolve, reject) => {
      this.getConnection()
        .rollbackTransaction({
          resourceArn: this._config.resourceArn,
          secretArn: this._config.secretArn,
          transactionId,
        })
        .promise()
        .then((response) => {
          resolve(response.transactionStatus ?? "");
        })
        .catch(() => {
          reject("");
        });
    });
  }
}
