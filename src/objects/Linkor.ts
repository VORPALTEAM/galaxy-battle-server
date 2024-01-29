import * as THREE from 'three';
import { SpaceShip, SpaceShipParams } from './SpaceShip.js';
import { GameObject } from './GameObject.js';
import { AttackType } from '../data/Types.js';
import { Config, ShipParams } from '../data/Config.js';
import { MyMath } from '../utils/MyMath.js';

export type LinkorParams = SpaceShipParams & {

}

export class Linkor extends SpaceShip {

    constructor(aParams: LinkorParams) {
        super(aParams);
        this._type = 'BattleShip';
    }

    protected initParams() {
        let params = Config.linkorParams;
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
        }
        else {
            p = val;
        }
        if (incByLvl > 0) {
            p += p * incByLvl * (level - 1);
        }
        this._hp = p;
    }

    private initAttackPower(aParams: ShipParams) {
        const val = aParams.attackPower.value;
        const incByLvl = aParams.attackPower.incPercentByLevel;
        const level = this._shipParams.level;
        if (Array.isArray(val)) {
            const min = val[0];
            const max = val[1];
            this._attackParams.minDamage = min;
            this._attackParams.maxDamage = max;
        }
        else {
            this._attackParams.minDamage = val;
            this._attackParams.maxDamage = val;
        }
        if (incByLvl > 0) {
            this._attackParams.minDamage += this._attackParams.minDamage * incByLvl * (level - 1);
            this._attackParams.maxDamage += this._attackParams.maxDamage * incByLvl * (level - 1);
        }
    }

    attackTarget(aAttackObject: GameObject, aAttackType: AttackType) {
        this._state = 'fight';
        this._attackObject = aAttackObject;
        this._attackType = aAttackType;
        
        if (this._attackType == 'ray') {
            this.refreshAttackTimer();
            this._isRayCreated = false;

            // rotate to target
            let anDeg = Math.abs(this.getAngleToPointInDeg(this._attackObject.position));
            let t = this._shipParams.rotationTime * 1000;
            let rotateDur = anDeg >= 30 ? t : t * anDeg / 30;
            this.rotateToPoint(this._attackObject.position, rotateDur);
        }

    }

}