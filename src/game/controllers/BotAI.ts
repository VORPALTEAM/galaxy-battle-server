import { Client } from '../models/Client.js';
import { ExpManager } from '../systems/ExpManager.js';
import { AbilityManager } from '../systems/AbilityManager.js';
import { MissileController } from './MissileController.js';
import { IUpdatable } from '../../interfaces/IUpdatable.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { LogMng } from '../../monax/LogMng.js';
import { MyMath } from '../../monax/MyMath.js';

enum TimerNames {
    laser = 'laser',
    rocket = 'rocket',
    levelUp = 'levelUp',
}

const TimeDefault: { [key in TimerNames]: number } = {
    'laser': 3,
    'rocket': 10,
    'levelUp': 5
}

export class BotAI implements IUpdatable, ILogger {
    private _className = 'BotAI';
    private _client: Client;
    private _expMng: ExpManager;
    private _abilsMng: AbilityManager;
    private _missilesController: MissileController;
    // private _skillLevelUpInterval: NodeJS.Timeout | null = null;
    // private _laserAttackInterval: NodeJS.Timeout | null = null;
    // private _missileLaunchInterval: NodeJS.Timeout | null = null;
    private _timers: { [key in TimerNames]: number };
    private _active = false;
    
    constructor(params: {
        client: Client;
        expMng: ExpManager;
        abilsMng: AbilityManager;
        missilesController: MissileController;
    }) {
        this._client = params.client;
        this._expMng = params.expMng;
        this._abilsMng = params.abilsMng;
        this._missilesController = params.missilesController;

        this._timers = {
            'laser': TimeDefault['laser'],
            'rocket': TimeDefault['rocket'],
            'levelUp': TimeDefault['levelUp']
        }

        this._active = true;
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`${this._className}: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`${this._className}: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`${this._className}: ${aMsg}`, aData);
    }

    public get active() {
        return this._active;
    }

    public set active(value) {
        this._active = value;
    }

    stop() {
        // if (this._skillLevelUpInterval) {
        //     clearInterval(this._skillLevelUpInterval);
        //     this._skillLevelUpInterval = null;
        // }
        // if (this._laserAttackInterval) {
        //     clearInterval(this._laserAttackInterval);
        //     this._laserAttackInterval = null;
        // }
        // if (this._missileLaunchInterval) {
        //     clearInterval(this._missileLaunchInterval);
        //     this._missileLaunchInterval = null;
        // }

        this.active = false;

    }

    private updateLaserSkill() {
        const dmg = this._expMng.getSkillDamage(this._client.walletId, 0);
        this._abilsMng?.laserAttack(this._client, dmg);
    }

    private updateRocketSkill() {
        const dmg = this._expMng.getSkillDamage(this._client.walletId, 1);
        this._missilesController.launchMissile({
            client: this._client,
            damage: dmg
        });
    }

    private updateLevelUp() {
        let skill1 = this._expMng.getExpInfo(this._client.walletId).skills[0];
        let skill2 = this._expMng.getExpInfo(this._client.walletId).skills[1];
        if (skill1.level < skill2.level && skill1.levelUpAvailable) {
            this._expMng.upSkillLevel(this._client.walletId, 0);
            this.logDebug(`level up Laser Skill`);
        }
        else if (skill1.level >= skill2.level && skill2.levelUpAvailable) {
            this._expMng.upSkillLevel(this._client.walletId, 1);
            this.logDebug(`level up Rocket Skill`);
        }
    }

    update(dt: number) {
        if (!this._active) return;

        for (const key in this._timers) {
            this._timers[key] -= dt;
            if (this._timers[key] <= 0) {
                switch (key) {
                    case TimerNames.laser:
                        this._timers[key] = MyMath.randomInRange(3, 5);
                        this.updateLaserSkill();
                        break;
                    case TimerNames.rocket:
                        this._timers[key] = MyMath.randomInRange(10, 14);
                        this.updateRocketSkill();
                        break;
                    case TimerNames.levelUp:
                        this.updateLevelUp();
                        break;
                }
            }
        }

    }

}
