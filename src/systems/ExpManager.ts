import { GameObject } from "src/objects/GameObject.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { MyMath } from "../utils/MyMath.js";
import { Signal } from "../utils/events/Signal.js";
import { Fighter } from "src/objects/Fighter.js";
import { Linkor } from "src/objects/Linkor.js";
import { ExpData } from "src/data/Types.js";

const CONFIG = {
    
    levels: [
        { level: 1, exp: 0 },
        { level: 2, exp: 50 },
        { level: 3, exp: 120 },
        { level: 4, exp: 200 },
        { level: 5, exp: 300 },
        { level: 6, exp: 450 },
        { level: 7, exp: 650 },
        { level: 8, exp: 900 },
        { level: 9, exp: 1200 },
        { level: 10, exp: 1550 },
        { level: 11, exp: 1950 },
        { level: 12, exp: 2400 },
        { level: 13, exp: 2900 },
        { level: 14, exp: 3450 },
        { level: 15, exp: 4050 }
    ],

    exp: {
        fighter: {
            passiveKill: {
                min: 20,
                max: 30
            },
            activeKill: {
                min: 40,
                max: 50
            }
        },
        linkor: {
            passiveKill: {
                min: 60,
                max: 80
            },
            activeKill: {
                min: 90,
                max: 120
            }
        },
    }

}

export class ExpManager implements ILogger {
    // current exp of players
    private _exp: Map<string, number>;
    /**
     * (aSender: ExpManager, aClientId: string, aExp: number, aLevel: number, aLevelExpPercent: number)
     */
    onExpChangeSignal = new Signal();

    constructor() {
        this._exp = new Map();
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`ExpManager: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`ExpManager: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`ExpManager: ${aMsg}`, aData);
    }

    private expForFighter(aActiveKill: boolean): number {
        let data = aActiveKill ?
            CONFIG.exp.fighter.activeKill :
            CONFIG.exp.fighter.passiveKill;
        return MyMath.randomIntInRange(data.min, data.max);
    }

    private expForLinkor(aActiveKill: boolean): number {
        let data = aActiveKill ?
            CONFIG.exp.linkor.activeKill :
            CONFIG.exp.linkor.passiveKill;
        return MyMath.randomIntInRange(data.min, data.max);
    }

    private levelByExp(aExp: number): number {
        const levels = CONFIG.levels;
        for (let i = 0; i < levels.length; i++) {
            const levelData = CONFIG.levels[i];
            const nextLevelData = CONFIG.levels[i + 1];
            if (!nextLevelData) {
                return levelData.level;
            }
            else if (aExp < nextLevelData.exp) {
                return levelData.level;
            }
        }
        this.logError(`levelByExp: unreal result for exp value = ${aExp}`);
        return 1;
    }

    private getLevelExpPercent(aExp: number): number {
        const levels = CONFIG.levels;
        for (let i = 0; i < levels.length; i++) {
            const levelData = CONFIG.levels[i];
            const nextLevelData = CONFIG.levels[i + 1];
            if (!nextLevelData) {
                return MyMath.percentInRange(aExp, levelData.exp, nextLevelData.exp);
            }
            else if (aExp < nextLevelData.exp) {
                return 0;
            }
        }
        this.logError(`getLevelExpPercent: unreal result for exp value = ${aExp}`);
        return 0;
    }

    private onExpChange(aClientId: string) {
        let expInfo = this.getExpInfo(aClientId);
        // const currExp = this._exp.get(aClientId) || 0;
        // const currLevel = this.levelByExp(currExp);
        // const levelExpPercent = this.getLevelExpPercent(currExp);
        this.onExpChangeSignal.dispatch(this, aClientId, expInfo.exp, expInfo.level, expInfo.levelExpPercent);
    }

    addExp(aClientId: string, aExp: number) {
        const currExp = this._exp.get(aClientId) || 0;
        const newExp = currExp + aExp;
        this._exp.set(aClientId, newExp);
        this.onExpChange(aClientId);
    }

    getExpInfo(aClientId: string): ExpData {
        const currExp = Math.trunc(this._exp.get(aClientId)) || 0;
        const currLevel = this.levelByExp(currExp);
        const levelExpPercent = this.getLevelExpPercent(currExp);
        return {
            exp: currExp,
            level: currLevel,
            levelExpPercent: levelExpPercent
        };
    }

    addExpForObject(aClientId: string, aObj: GameObject): ExpData {
        let exp = this._exp.get(aClientId) || 0;
        if (aObj instanceof Fighter) {
            exp += this.expForFighter(false);
        }
        else if (aObj instanceof Linkor) {
            exp += this.expForLinkor(false);
        }
        this._exp.set(aClientId, exp);
        return this.getExpInfo(aClientId);
    }

}