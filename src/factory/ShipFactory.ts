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

    private getDamage(aLevel: number): number[] {
        let params = DBShipParams.getDamageParams(this._shipType);
        let min = params.min;
        let max = params.max;
        if (params.incPercentByLevel > 0) {
            min += params.min * (100 / params.incPercentByLevel) * (aLevel - 1);
            max += params.max * (100 / params.incPercentByLevel) * (aLevel - 1);
        }
        return [min, max];
    }

    private getHitPenetration(aLevel: number): number[] {
        let params = DBShipParams.getHitPenetration(this._shipType);
        let min = params.min;
        let max = params.max;
        if (params.incPercentByLevel > 0) {
            min += params.min * (100 / params.incPercentByLevel) * (aLevel - 1);
            max += params.max * (100 / params.incPercentByLevel) * (aLevel - 1);
        }
        return [min, max];
    }

    private getCritChance(aLevel: number): number[] {
        let params = DBShipParams.getCritChance(this._shipType);
        let min = params.min;
        let max = params.max;
        if (params.incPercentByLevel > 0) {
            min += params.min * (100 / params.incPercentByLevel) * (aLevel - 1);
            max += params.max * (100 / params.incPercentByLevel) * (aLevel - 1);
        }
        return [min, max];
    }

    private getCritFactor(aLevel: number): number[] {
        let params = DBShipParams.getCritFactor(this._shipType);
        let min = params.min;
        let max = params.max;
        if (params.incPercentByLevel > 0) {
            min += params.min * (100 / params.incPercentByLevel) * (aLevel - 1);
            max += params.max * (100 / params.incPercentByLevel) * (aLevel - 1);
        }
        return [min, max];
    }

    private getEvasion(aLevel: number): number[] {
        let params = DBShipParams.getEvasion(this._shipType);
        let min = params.min;
        let max = params.max;
        if (params.incPercentByLevel > 0) {
            min += params.min * (100 / params.incPercentByLevel) * (aLevel - 1);
            max += params.max * (100 / params.incPercentByLevel) * (aLevel - 1);
        }
        return [min, max];
    }

    getShipParams(aLevel: number): ShipParams {
        let res: ShipParams = {
            hp: this.getHp(aLevel),
            shield: this.getShield(aLevel),
            damage: this.getDamage(aLevel),
            hitPenetration: this.getHitPenetration(aLevel),
            critChance: this.getCritChance(aLevel),
            critFactor: this.getCritFactor(aLevel),
            evasion: this.getEvasion(aLevel),
        };
        return res;
    }

}