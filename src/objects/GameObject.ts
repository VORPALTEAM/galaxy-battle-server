import { IUpdatable } from "../interfaces/IUpdatable.js";
import { ObjectCreateData, ObjectUpdateData } from "../data/Types.js";
import { Vec2 } from "../utils/MyMath.js";

export type GameObjectParams = {
    ownerWalletId: string,
    id: number,
    cellPos: Vec2,
    radius: number
    
}

export class GameObject implements IUpdatable {
    ownerWalletId: string;
    id: number;
    cellPos: Vec2;
    radius: number;

    constructor(aParams: GameObjectParams) {
        this.ownerWalletId = aParams.ownerWalletId;
        this.id = aParams.id;
        this.cellPos = aParams.cellPos;
        this.radius = aParams.radius;
    }

    getCreateData(): ObjectCreateData {
        return null;
    }

    getUpdateData(): ObjectUpdateData {
        return null;
    }

    update(dt: number) {
        
    }

}