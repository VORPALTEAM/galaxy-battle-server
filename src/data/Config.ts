
type SimpleParameter = {
    value: number | number[],
    incPercentByLevel?: number
}

export type ShipParams = {
    hp: SimpleParameter,
    shield: SimpleParameter,
    attackPower: SimpleParameter,
    attackSpeedPersSec: SimpleParameter,
    hitPenetrationPercent: SimpleParameter,
    evasionPercent: SimpleParameter,
    critChancePercent: SimpleParameter,
    critPowerPercent: SimpleParameter,
    rotationSpeedFactor: SimpleParameter,
    jumpDelayInSec: SimpleParameter,
    jumpResetInSec: SimpleParameter,
    jumpRadius: SimpleParameter,
    suckRadius: SimpleParameter,
    suckPowerInSec: SimpleParameter,
    explosionDamage: SimpleParameter,
    explosionRadius: SimpleParameter,
}

type ConfigType = {
    fighterParams: ShipParams,
    linkorParams: ShipParams,
    tests: boolean,
}

export const Config: ConfigType = {
    fighterParams: null,
    linkorParams: null,
    tests: false,
};