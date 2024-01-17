import * as THREE from 'three';
import { SpaceShip, SpaceShipParams } from './SpaceShip.js';

export type FighterParams = SpaceShipParams & {

}

export class Fighter extends SpaceShip {

    constructor(aParams: FighterParams) {
        super(aParams);
        this._lookDir = aParams.lookDir;
        this.lookByDir(this._lookDir);
        this._attackTimer = 3;
        this._atkTimer = 0;
        this._state = 'idle';
    }

}