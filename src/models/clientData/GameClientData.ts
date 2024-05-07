import { ObjectRace } from "../../data/Types";

export class GameClientData {
    private _race: ObjectRace;
    private _displayName: string;
    private _starName: string;
    
    constructor() {}

    public get race(): ObjectRace {
        return this._race;
    }
    public set race(value: ObjectRace) {
        this._race = value;
    }

    public get displayName(): string {
        return this._displayName;
    }
    public set displayName(value: string) {
        this._displayName = value;
    }

    public get starName(): string {
        return this._starName;
    }
    public set starName(value: string) {
        this._starName = value;
    }
    
    
}