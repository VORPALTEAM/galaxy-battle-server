import * as THREE from 'three';
import { SpaceShip, SpaceShipParams } from './SpaceShip.js';
import { GameObject } from './GameObject.js';
import { AttackType } from 'src/data/Types.js';

export type BattleShipParams = SpaceShipParams & {

}

export class BattleShip extends SpaceShip {

    constructor(aParams: BattleShipParams) {
        super(aParams);
        this._type = 'BattleShip';
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