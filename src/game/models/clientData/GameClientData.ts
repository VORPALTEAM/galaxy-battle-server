import { TGInitData } from "../../data/TGTypes.js";
import { ObjectRace, TGAuthData } from "../../data/Types";
import { ILogger } from "../../../interfaces/ILogger.js";
import { LogMng } from "../../../monax/LogMng.js";
import { decodeTgInitString } from "../../../blockchain/utils.js";

export class GameClientData implements ILogger {
    private _race: ObjectRace;
    private _starName: string;
    private _tgInitDataStr: string;
    private _tgInitData: TGInitData;
    private _tgAuthData: TGAuthData;
    
    constructor() { }
    
    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`GameClientData: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`GameClientData: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`GameClientData: ${aMsg}`, aData);
    }

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
    
    get tgInitDataStr(): string {
        return this._tgInitDataStr;
    }

    get tgInitData(): TGInitData {
        return this._tgInitData;
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
        this.logDebug(`get tgId: `, this._tgAuthData);
        return String(this._tgAuthData?.id || this._tgAuthData?.id || '');
    }

    setTgInitData(aTgInitData: string) {
        this._tgInitDataStr = aTgInitData;
        this._tgInitData = decodeTgInitString(aTgInitData);
        // this._tgInitData = JSON.parse(aTgInitData);
        this.logDebug(`setTgInitData:`, this._tgInitData);
    }

}