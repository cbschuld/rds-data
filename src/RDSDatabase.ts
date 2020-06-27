import { config } from 'aws-sdk';
import { RDSData, RDSDataOptions } from './RDSData';

export default class RDSDatabase {
  private static _instance: RDSData;

  private static _options: RDSDataOptions;

  constructor(options: RDSDataOptions) {
    this.setOptions(options);
  }

  public setOptions(options: RDSDataOptions): RDSDatabase {
    options.region = options.region ?? config.region;
    RDSDatabase._options = options;
    return this;
  }

  public getOptions(): RDSDataOptions {
    return RDSDatabase._options;
  }

  public getInstance(): RDSData {
    if (!RDSDatabase._instance) {
      RDSDatabase._instance = new RDSData(RDSDatabase._options);
    }
    return RDSDatabase._instance;
  }
}
