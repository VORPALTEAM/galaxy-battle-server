import { IUpdatable } from "../interfaces/IUpdatable.js";
import { ObjectCreateData, ObjectUpdateData } from "../data/Types.js";
import { Vec2 } from "../utils/MyMath.js";

export type GameObjectParams = {
    ownerWalletId: string,
    id: number,
    position: Vec2 | { x: number, y: number },
    radius: number
    
}

export class GameObject implements IUpdatable {
    ownerWalletId: string;
    id: number;
    position: Vec2;
    radius: number;

    constructor(aParams: GameObjectParams) {
        this.ownerWalletId = aParams.ownerWalletId;
        this.id = aParams.id;
        if (aParams.position instanceof Vec2) {
            this.position = aParams.position;
        }
        else {
            this.position = Vec2.getVec2(aParams.position.x, aParams.position.y);
        }
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