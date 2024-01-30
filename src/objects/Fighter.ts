import * as THREE from 'three';
import { SpaceShip, SpaceShipParams } from './SpaceShip.js';

export type FighterParams = SpaceShipParams & {

}

export class Fighter extends SpaceShip {

    constructor(aParams: FighterParams) {
        super(aParams);
        this._type = 'FighterShip';
    }
    

}