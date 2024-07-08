import { ObjectRace, TGAuthData } from "../../data/Types";

export class GameClientData {
    private _race: ObjectRace;
    private _starName: string;
    private _tgAuthData: TGAuthData;
    
    constructor() {}

    get race(): ObjectRace {
        return this._race;
    }
    set race(value: ObjectRace) {
        this._race = value;
    }

    get starName(): string {
        return this._starName;
    }
    set starName(value: string) {
        this._starName = value;
    }
    
    get tgAuthData(): TGAuthData {
        return this._tgAuthData;
    }
    set tgAuthData(value: TGAuthData) {
        this._tgAuthData = value;
    }

    get tgNick(): string {
        return this._tgAuthData?.username || this._tgAuthData?.first_name || 'Anonimous';
    }

    get tgId(): string {
        return String(this._tgAuthData?.id || '');
    }

}