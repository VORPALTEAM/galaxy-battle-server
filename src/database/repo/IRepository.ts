import { DB_KEY } from "../Types";

export interface IRepository {
    // get rec
    readRecord(aId: DB_KEY): string;
    writeRecord(aId: DB_KEY, aVal: string | number);
}