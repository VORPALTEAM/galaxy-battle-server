import { IdGenerator } from "../../monax/game/IdGenerator";

export class GameObjectFactory {
    protected _objIdGen: IdGenerator;

    constructor(aIdGenerator: IdGenerator) {
        this._objIdGen = aIdGenerator;
    }

    

}