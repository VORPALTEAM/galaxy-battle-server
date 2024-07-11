import { TGInitData } from "../../data/TGTypes.js";
import { ObjectRace, TGAuthData } from "../../data/Types";
import { ILogger } from "../../../interfaces/ILogger.js";
import { LogMng } from "../../../monax/LogMng.js";
import { decodeTgInitString } from "../../../blockchain/utils.js";

const DEFAULT_ID = 'null_id';
const DEFAULT_NICK = 'Anonimous';

export class GameClientData implements ILogger {
    private _walletId: string;
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

    get walletId(): string {
        return this._walletId;
    }
    set walletId(value: string) {
        this._walletId = value;
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

    get isTg(): boolean {
        return this._tgAuthData != null || this._tgInitData != null;
    }

    get id(): string {
        let id = DEFAULT_ID;
        if (this._tgAuthData || this._tgInitData) {
            id = String(this._tgAuthData?.id || this._tgInitData?.user?.id);
        }
        else if (this._walletId) {
            id = this._walletId;
        }
        return id;
    }

    // get tgId(): string {
    //     return String(this._tgAuthData?.id || this._tgInitData?.user?.id || DEFAULT_ID);
    // }

    // get tgNick(): string {
    //     return this._tgAuthData?.username || this._tgAuthData?.first_name || DEFAULT_NICK;
    // }

    get nick(): string {
        let nick = DEFAULT_NICK;
        if (this._tgAuthData || this._tgInitData) {
            nick = this._tgAuthData?.username || this._tgAuthData?.first_name;
        }
        else if (this._walletId) {
            nick = this._walletId;
        }
        return nick;
    }
    
    setTgInitData(aTgInitData: string) {
        this._tgInitDataStr = aTgInitData;
        this._tgInitData = decodeTgInitString(aTgInitData);
        // this._tgInitData = JSON.parse(aTgInitData);
        this.logDebug(`setTgInitData:`, this._tgInitData);
    }

}