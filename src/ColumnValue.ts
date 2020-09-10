import { RDSDataService } from "aws-sdk";

class ColumnValue {
    public field: RDSDataService.Field;

    constructor(field: RDSDataService.Field) {
        this.field = field;
    }

    get isNull(): boolean {
        return !!this.field.isNull;
    }

    get date(): Date | null {
        if (this.isNull) return null;
        return new Date(this.field.stringValue!);
    }

    get string(): string | null {
        if (this.isNull) return null;
        return this.field.stringValue || null;
    }

    get number(): number | null {
        if (this.isNull) return null;
        return this.field.longValue || null;
    }

    get buffer(): Buffer | null {
        if (this.isNull) return null;
        return Buffer.isBuffer(this.field.blobValue) ? this.field.blobValue : Buffer.from(this.field.blobValue as Uint8Array);
    }

    get boolean(): boolean | null {
        if (this.isNull) return null;
        return this.field.booleanValue || null;
    }

}

export default ColumnValue;