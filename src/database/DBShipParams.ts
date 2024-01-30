import { DB } from "./DB.js";

type SimpleNumValue = {
    value: number,
    incPercentByLevel?: number
}

type RangeValue = {
    min: number,
    max: number,
    incPercentByLevel?: number
}

export type ShipType = 'fighter' | 'linkor';

/**
 * Facade for ShipParams from DB
 */
export class DBShipParams {

    static getHpParams(aShipType: ShipType): SimpleNumValue {
        let res: SimpleNumValue = {
            value: Number(DB.repo.readRecord(`${aShipType}_hp`) || '10'),
            incPercentByLevel: Number(DB.repo.readRecord(`${aShipType}_hp_incPercentByLevel`) || '0')
        };
        return res;
    }

    static getShieldParams(aShipType: ShipType): RangeValue {
        let res: RangeValue = {
            min: Number(DB.repo.readRecord(`${aShipType}_shield_min`) || '50'),
            max: Number(DB.repo.readRecord(`${aShipType}_shield_max`) || '90'),
            incPercentByLevel: Number(DB.repo.readRecord(`${aShipType}_shield_incPercentByLevel`) || '0')
        };
        return res;
    }

    static getDamageParams(aShipType: ShipType): RangeValue {
        let res: RangeValue = {
            min: Number(DB.repo.readRecord(`${aShipType}_attackPower_min`) || '10'),
            max: Number(DB.repo.readRecord(`${aShipType}_attackPower_max`) || '15'),
            incPercentByLevel: Number(DB.repo.readRecord(`${aShipType}_attackPower_incPercentByLevel`) || '0')
        };
        return res;
    }

}