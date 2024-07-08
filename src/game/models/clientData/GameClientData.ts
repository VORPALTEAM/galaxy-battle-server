import { decodeParams } from "src/blockchain/utils";
import { ObjectRace, TGAuthData, TGAuthWebAppData } from "../../data/Types";

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
    set tgAuthData(value: string) {
        console.log("Auth data: ", value)
        const entry: TGAuthData = decodeParams(value)
        this._tgAuthData = entry.user || entry;
        console.log("Saved data: ", entry)
    }

    get tgNick(): string {
        return this._tgAuthData?.username || this._tgAuthData?.first_name || 'Anonimous';
    }

    get tgId(): string {
        console.log("Auth data get: ", this._tgAuthData)
        return String(this._tgAuthData?.id || this._tgAuthData?.id || '');
    }

}