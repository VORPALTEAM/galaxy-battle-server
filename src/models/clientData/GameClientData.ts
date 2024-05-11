import { ObjectRace } from "../../data/Types";

export class GameClientData {
    private _race: ObjectRace;
    private _tgNick: string;
    private _starName: string;
    
    constructor() {}

    public get race(): ObjectRace {
        return this._race;
    }
    public set race(value: ObjectRace) {
        this._race = value;
    }

    public get tgNick(): string {
        return this._tgNick;
    }
    public set tgNick(value: string) {
        this._tgNick = value;
    }

    public get starName(): string {
        return this._starName;
    }
    public set starName(value: string) {
        this._starName = value;
    }
    
    
}