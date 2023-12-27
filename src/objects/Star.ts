import { ObjectUpdateData, StarCreateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type StarParams = GameObjectParams & {

}

export class Star extends GameObject {
    
    constructor(aParams: StarParams) {
        super(aParams);

    }

    getCreateData(): StarCreateData {
        return {
            type: 'Star',
            owner: this.ownerWalletId,
            hp: 1000,
            id: this.id,
            pos: { x: 0, y: 0, z: 0 },
            radius: 5
        };
    }

    getUpdateData(): ObjectUpdateData {
        return null;
    }

}