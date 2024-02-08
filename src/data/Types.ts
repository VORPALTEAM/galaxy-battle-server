
export type ShipParams = {
    hp: number,
    shield: number,
    damage: number[], // [min, max]
    hitPenetration: number, // [min, max]
    evasion: number, // [min, max]
    critChance: number, // [min, max]
    critFactor: number, // [min, max]
}

// net

export enum PackTitle {
    // for lobby
    sign = 'sign',
    startSearchGame = 'startSearchGame', // request
    stopSearchGame = 'stopSearchGame', // request
    gameSearching = 'gameSearching', // status, update, info
    exitGame = 'exitGame',
    gameStart = 'gameStart',
    gameComplete = 'gameComplete',
    // for game
    fieldInit = 'fieldInit',
    objectCreate = 'objectCreate',
    objectUpdate = 'objectUpdate',
    objectDestroy = 'objectDestroy',
    rotate = 'rotate',
    jump = 'jump',
    attack = 'attack',
    rayStart = 'rayStart',
    rayStop = 'rayStop',
    planetLaser = 'planetLaser',
    damage = 'damage'
}

export type ObjectType = 'Star' | 'Planet' | 'Tower' | 'FighterShip' | 'BattleShip' | 'Homing';
export type AttackType = 'laser' | 'ray';
export type RaceType = 'Humans' | 'Waters' | 'Insects' | 'Lizards';

export type StartGameData = {
    cmd?: 'start',
    timer: number,
    playerWallet: string,
    enemyWallet: string
}

export type FieldInitData = {
    fieldParams: any,
    playerPosition: 'top' | 'bot'
}

export type GameCompleteData = {
    status: 'win' | 'lose' | 'draw'
}

export type DamageInfo = {
    damage: number,
    isMiss?: boolean,
    isCrit?: boolean,
    critFactor?: number
}

export type ObjectUpdateData = {
    id: number,
    hp?: number,
    shield?: number,
    pos?: {
        x: number,
        y: number,
        z: number
    },
    q?: {
        x: number,
        y: number,
        z: number,
        w: number
    },
}

export type ObjectCreateData = ObjectUpdateData & {
    type: ObjectType,
    owner?: string, // owner id
    radius?: number,
    hp?: number,
    attackRadius?: number,
    lookDir?: { x, y, z }
}

export type StarCreateData = ObjectCreateData & {

}

export type FighterCreateData = ObjectCreateData & {
    shield: number
}

export type PlanetLaserData = {
    planetId: number,
    pos: { x, y, z },
    dir: { x, y, z },
    length: number
}

