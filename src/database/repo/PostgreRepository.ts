import * as pg from "pg";
import { IRepository } from "./IRepository";

export class PostgreRepository implements IRepository {
    private _client: pg.Client;

    constructor(aParams: {
        host: string,
        database: string,
        user: string,
        password: string,
        port: number
    }) {
        const connectionData: pg.ClientConfig = {
            ...aParams
        };
        this._client = new pg.Client(connectionData);
    }

    readRecord(aId: string): string {
        return '';
    }

    writeRecord(aId: string) {
        
    }

}