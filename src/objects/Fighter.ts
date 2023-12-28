import { Signal } from "../utils/events/Signal.js";
import { FighterCreateData, ObjectUpdateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type FighterParams = GameObjectParams & {
}

export class Fighter extends GameObject {
    protected _timerShot: number;
    
    constructor(aParams: FighterParams) {
        super(aParams);
        this._timerShot = 3;
    }

    getCreateData(): FighterCreateData {
        return {
            type: 'FighterShip',
            owner: this.owner,
            hp: this.hp,
            id: this.id,
            pos: this.position,
            radius: this.radius
        };
    }

    getUpdateData(): ObjectUpdateData {
        return null;
    }

    update(dt: number) {
        
    }

}