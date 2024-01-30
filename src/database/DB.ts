import { IRepository } from "./repo/IRepository.js";
import { LocalRepository } from "./repo/LocalRepository.js";
import { PostgreRepository } from "./repo/PostgreRepository.js";

export class DB {
    static repo: IRepository;

    static init(aParams: {
        host: string,
        database: string,
        user: string,
        password: string,
        port: number
    }) {
        if (aParams.host && aParams.database) {
            // postgre db
            this.repo = new PostgreRepository(aParams);
            console.log(`DB pg inited:`, aParams);
        }
        else {
            // local db
            this.repo = new LocalRepository();
            console.log(`DB local inited...`);
        }
    }

}