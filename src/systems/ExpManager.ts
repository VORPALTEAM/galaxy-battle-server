import { GameObject } from "../objects/GameObject.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { MyMath } from "../utils/MyMath.js";
import { Fighter } from "../objects/Fighter.js";
import { Linkor } from "../objects/Linkor.js";
import { ExpData, SkillData } from "../data/Types.js";

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
    },

    skills: [
        {
            name: 'laser',
            isActive: true, startFromLevel: 1, cd: [3000], damage: [
                { min: 30, max: 50 },
                { min: 35, max: 55 },
                { min: 40, max: 60 },
                { min: 50, max: 80 }
            ],
            critChancePercent: 3,
            critFactor: 1.75
        },
        {
            name: 'rocket',
            isActive: true, startFromLevel: 2, cd: [10000], damage: [
                { min: 45, max: 65 },
                { min: 50, max: 75 },
                { min: 60, max: 90 },
                { min: 80, max: 120 }
            ]
        },
        {
            name: 'slow',
            isActive: true, startFromLevel: 2,
            cd: [30000, 25000, 20000, 15000],
            speedFactor: [.50, .45, .35, .20],
            duration: [3, 3.5, 4, 5]
        },
        {
            name: 'ulta', isActive: false, startFromLevel: 6, cd: [60000]
        },
    ],

}

function levelByExp(aExp: number): number {
    const levels = CONFIG.levels;
    for (let i = 0; i < levels.length; i++) {
        const levelData = CONFIG.levels[i];
        const nextLevelData = CONFIG.levels[i + 1];
        if (aExp >= levelData.exp) {
            
            if (!nextLevelData) {
                return levelData.level;
            }
            else if (aExp < nextLevelData.exp) {
                return levelData.level;
            }

        }
    }
    this.logError(`levelByExp: unreal result for exp value = ${aExp}`);
    return 1;
}

class ExpRecord {
    private _exp = 0;
    private _skillPoints = 0;
    private _skillLevels = [1, 0, 0, 0];

    constructor() {

    }

    public get exp() {
        return this._exp;
    }

    public get skillPoints() {
        return this._skillPoints;
    }

    addExp(aExp: number) {
        let prevLevel = levelByExp(this._exp);
        this._exp += aExp;
        let level = levelByExp(this._exp);
        if (level > prevLevel) {
            this._skillPoints++;
        }
    }

    isSkillLevelUpAvailable(aSkillId: number) {
        let sd = CONFIG.skills[aSkillId];
        const currLevel = levelByExp(this._exp);
        const skillLvl = this._skillLevels[aSkillId];
        return sd.isActive
            && this._skillPoints > 0
            && currLevel >= sd.startFromLevel
            && skillLvl < 4;
    }

    getSkillCooldownDur(aSkillId: number): number {
        let level = this._skillLevels[aSkillId];
        let cds = CONFIG.skills[aSkillId].cd;
        let cd = cds[level - 1] ? cds[level - 1] : cds[0];
        return cd;
    }

    skillLevelUp(aSkillId: number) {
        if (this._skillPoints <= 0) return;
        if (!this.isSkillLevelUpAvailable(aSkillId)) return;
        let currSkillLevel = this._skillLevels[aSkillId];
        if (currSkillLevel >= 4) return;
        this._skillPoints--;
        this._skillLevels[aSkillId]++;
    }

    getSkills(): SkillData[] {
        let res: SkillData[] = [];
        for (let i = 0; i < CONFIG.skills.length; i++) {
            const sd = CONFIG.skills[i];
            res.push({
                level: this._skillLevels[i],
                levelUpAvailable: this.isSkillLevelUpAvailable(i),
                cooldown: {
                    duration: this.getSkillCooldownDur(i)
                }
            });
        }
        return res;
    }

    getSkillDamage(aSkillId: number): number {
        const level = this._skillLevels[aSkillId];
        if (CONFIG.skills[aSkillId].damage) {
            const minDmg = CONFIG.skills[aSkillId].damage[level - 1].min;
            const maxDmg = CONFIG.skills[aSkillId].damage[level - 1].max;
            return MyMath.randomIntInRange(minDmg, maxDmg);
        }
        else {
            return 0;
        }
    }

    getSkillLevel(aSkillId: number): number {
        return this._skillLevels[aSkillId];
    }

    getSniperSpeedFactor(): number {
        const aSkillId = 2;
        const level = this._skillLevels[aSkillId];
        if (CONFIG.skills[aSkillId].speedFactor) {
            return CONFIG.skills[aSkillId].speedFactor[level - 1];
        }
        else {
            return 1;
        }
    }

    getSniperDuration(): number {
        const aSkillId = 2;
        const level = this._skillLevels[aSkillId];
        if (CONFIG.skills[aSkillId].duration) {
            return CONFIG.skills[aSkillId].duration[level - 1];
        }
        else {
            return 3;
        }
    }

}

export class ExpManager implements ILogger {
    // current exp of players
    private _exp: Map<string, ExpRecord>;

    constructor() {
        this._exp = new Map();
        this.getLevelPercentTest();
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

    private getLevelPercentTest() {
        const tests = [0, 25, 650, 1000, 3700, 4040, 4500];
        for (let i = 0; i < tests.length; i++) {
            const val = tests[i];
            this.logDebug(`exp perc ${val}: ${this.getLevelExpPercent(val)}`);
        }
    }

    private getExpRecord(aKey: string): ExpRecord {
        let rec = this._exp.get(aKey);
        if (!rec) {
            rec = new ExpRecord();
            this._exp.set(aKey, rec);
        }
        return rec;
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

    private getLevelExpPercent(aExp: number): number {
        const levels = CONFIG.levels;
        for (let i = 0; i < levels.length; i++) {
            const levelData = CONFIG.levels[i];
            const nextLevelData = CONFIG.levels[i + 1];

            if (aExp >= levelData.exp) {
                if (!nextLevelData) {
                    return 100;
                }
                else {
                    if (aExp < nextLevelData.exp) {
                        return MyMath.percentInRange(aExp, levelData.exp, nextLevelData.exp) * 100;
                    }
                }
            }
            
        }
        this.logError(`getLevelExpPercent: unreal result for exp value = ${aExp}`);
        return 0;
    }

    getExpInfo(aClientId: string): ExpData {
        let exp = this.getExpRecord(aClientId);
        const currExp = Math.trunc(exp.exp);
        const currLevel = levelByExp(currExp);
        const levelExpPercent = this.getLevelExpPercent(currExp);
        return {
            exp: currExp,
            level: currLevel,
            levelExpPercent: levelExpPercent,
            skills: exp.getSkills()
        };
    }

    addExp(aClientId: string, aExp: number) {
        let expRec = this.getExpRecord(aClientId);
        expRec.addExp(aExp);
    }

    addExpForObject(aClientId: string, aObj: GameObject): ExpData {
        let exp = this.getExpRecord(aClientId);
        if (aObj instanceof Fighter) {
            exp.addExp(this.expForFighter(false));
        }
        else if (aObj instanceof Linkor) {
            exp.addExp(this.expForLinkor(false));
        }
        return this.getExpInfo(aClientId);
    }

    upSkillLevel(aClientId: string, aSkillId: number): ExpData {
        let exp = this.getExpRecord(aClientId);
        exp.skillLevelUp(aSkillId);
        return this.getExpInfo(aClientId);
    }

    getSkillDamage(aClientId: string, aSkillId: number): number {
        let exp = this.getExpRecord(aClientId);
        return exp.getSkillDamage(aSkillId);
    }

    getSniperSpeedFactor(aClientId: string): number {
        let exp = this.getExpRecord(aClientId);
        return exp.getSniperSpeedFactor();
    }

    getSniperDuration(aClientId: string): number {
        let exp = this.getExpRecord(aClientId);
        return exp.getSniperDuration();
    }

}