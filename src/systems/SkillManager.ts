import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { MyMath } from "../utils/MyMath.js";

const CONFIG = {
    
    skills: [
        { name: 'laser', startFromLevel: 1 },
        { name: 'rocket', startFromLevel: 2 },
        { name: 'slow', startFromLevel: 2 },
        { name: 'ulta', startFromLevel: 6 },
    ],

}

class ClientSkills {
    levels = [1, 0, 0, 0];
    constructor() {
        
    }
}

export class SkillManager implements ILogger {
    // current exp of players
    private _exp: Map<string, ClientSkills>;

    constructor() {
        this._exp = new Map();
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`SkillManager: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`SkillManager: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`SkillManager: ${aMsg}`, aData);
    }

}