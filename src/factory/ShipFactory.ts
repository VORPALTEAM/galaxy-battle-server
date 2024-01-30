import { ShipParams } from "../data/Types.js";
import { DBShipParams, ShipType } from "../database/DBShipParams.js";
import { MyMath } from "../utils/MyMath.js";

export abstract class ShipFactory {
    protected _shipType: ShipType;

    private getHp(aLevel: number): number {
        let params = DBShipParams.getHpParams(this._shipType);
        let res = params.value;
        if (params.incPercentByLevel > 0) {
            res += params.value * (100 / params.incPercentByLevel) * (aLevel - 1);
        }
        return Math.trunc(res);
    }

    private getShield(aLevel: number): number {
        let params = DBShipParams.getShieldParams(this._shipType);
        let min = params.min;
        let max = params.max;
        if (params.incPercentByLevel > 0) {
            min += params.min * (100 / params.incPercentByLevel) * (aLevel - 1);
            max += params.max * (100 / params.incPercentByLevel) * (aLevel - 1);
        }
        return Math.trunc(MyMath.randomInRange(min, max));
    }

    getFighterParams(aLevel: number): ShipParams {
        let res: ShipParams = {
            hp: this.getHp(aLevel),
            shield: this.getShield(aLevel)
        };
        return res;
    }

}