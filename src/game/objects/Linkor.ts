import * as THREE from 'three';
import { SpaceShip, SpaceShipParams } from './SpaceShip.js';
import { AttackInfo, GameObject } from './GameObject.js';
import { AttackType, DamageInfo } from '../data/Types.js';

export type LinkorParams = SpaceShipParams & {

}

export class Linkor extends SpaceShip {

    constructor(aParams: LinkorParams) {
        super(aParams);
        this._objectType = 'BattleShip';
    }

    attack(aAttackObject: GameObject, aAttackType: AttackType) {
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