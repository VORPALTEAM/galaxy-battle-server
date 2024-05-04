import { ObjectRace } from "../../data/Types";

export class GameClientData {
    private _race: ObjectRace;
    
    constructor() {}

    public get race(): ObjectRace {
        return this._race;
    }
    public set race(value: ObjectRace) {
        this._race = value;
    }

    
}