import * as THREE from 'three';
import { SpaceShip, SpaceShipParams } from './SpaceShip.js';
import { GameObject } from './GameObject.js';

export type BattleShipParams = SpaceShipParams & {

}

export class BattleShip extends SpaceShip {

    constructor(aParams: BattleShipParams) {
        super(aParams);
        this._type = 'BattleShip';
    }

    attackTarget(aAttackObject: GameObject) {
        this._state = 'fight';
        this._attackObject = aAttackObject;
    }

}