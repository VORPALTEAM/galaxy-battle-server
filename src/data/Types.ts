
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
    damage = 'damage',
    exp = 'exp',
    skill = 'skill',

    claimReward = 'claimReward',
    // openBox = 'openBox',
    
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
    status: 'win' | 'loss',
    showBoxClaim?: boolean,
    boxLevel?: number
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

export type PlanetLaserSkin = 'blue' | 'red' | 'green' | 'violet';

export type PlanetLaserData = {
    planetId: number,
    pos: { x: number, y: number, z: number },
    dir: { x: number, y: number, z: number },
    length: number,
    skin: PlanetLaserSkin
}

export type SkillData = {
    level: number,
    levelUpAvailable: boolean,
    cooldown: {
        duration: number
    }
}

export type ExpData = {
    exp: number,
    level: number,
    levelExpPercent: number,
    skills: SkillData[]
}

export type SkillRequest = {
    action: 'levelUp' | 'click',
    skillId: number
}

export type RewardType = 'reward' | 'box';

export type ClaimRewardData = {
    type: RewardType,
    action?: 'request' | 'accept' | 'reject',
    reasone?: any
}