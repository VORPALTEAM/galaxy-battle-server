import { LocalDB } from "../LocalDB.js";
import { DB_KEY } from "../Types.js";
import { IRepository } from "./IRepository.js";

export class LocalRepository implements IRepository {

    readRecord(aId: DB_KEY): string {
        return LocalDB[aId];
    }

    writeRecord(aId: DB_KEY, aVal: string | number) {
        LocalDB[aId] = aVal;
    }

}