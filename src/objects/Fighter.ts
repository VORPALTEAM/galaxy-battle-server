import * as THREE from 'three';
import { SpaceShip, SpaceShipParams } from './SpaceShip.js';
import { Config, ShipParams } from '../data/Config.js';
import { MyMath } from '../utils/MyMath.js';
import { LogMng } from '../utils/LogMng.js';

export type FighterParams = SpaceShipParams & {

}

export class Fighter extends SpaceShip {

    constructor(aParams: FighterParams) {
        super(aParams);
        this._type = 'FighterShip';
    }

    protected initParams() {
        let params = Config.fighterParams;
        this.initHp(params);
        this.initAttackPower(params);
    }
    
    private initHp(aParams: ShipParams) {
        const val = aParams.hp.value;
        const incByLvl = aParams.hp.incPercentByLevel;
        const level = this._shipParams.level;
        let p = 10;
        if (Array.isArray(val)) {
            const min = val[0];
            const max = val[1];
            p = MyMath.randomIntInRange(min, max);
            LogMng.debug(`Fighter.initHp:`, {
                isArray: true,
                min: min,
                max: max,
                p: p
            });
        }
        else {
            p = val;
            LogMng.debug(`Fighter.initHp:`, {
                isArray: false,
                p: p
            });
        }
        if (incByLvl > 0) {
            p += p * incByLvl * (level - 1);
            LogMng.debug(`Fighter.initHp:`, {
                incByLevel: true,
                p: p
            });
        }
        this._hp = p;
    }

    initAttackPower(aParams: ShipParams) {
        const val = aParams.attackPower.value;
        const incByLvl = aParams.attackPower.incPercentByLevel;
        const level = this._shipParams.level;
        if (Array.isArray(val)) {
            const min = val[0];
            const max = val[1];
            this._attackParams.minDamage = min;
            this._attackParams.maxDamage = max;
            LogMng.debug(`Fighter.initHp:`, {
                isArray: true,
                min: min,
                max: max
            });
        }
        else {
            this._attackParams.minDamage = val;
            this._attackParams.maxDamage = val;
            LogMng.debug(`Fighter.initHp:`, {
                isArray: false,
                val: val
            });
        }
        if (incByLvl > 0) {
            this._attackParams.minDamage += this._attackParams.minDamage * incByLvl * (level - 1);
            this._attackParams.maxDamage += this._attackParams.maxDamage * incByLvl * (level - 1);
            LogMng.debug(`Fighter.initHp:`, {
                incByLevel: true,
                attackParams: this._attackParams
            });
        }
    }

    

}