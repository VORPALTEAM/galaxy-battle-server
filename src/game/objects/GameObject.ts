import * as THREE from 'three';
import { IUpdatable } from "../../interfaces/IUpdatable.js";
import { DamageInfo, ObjectCreateData, ObjectType, ObjectUpdateData } from "../data/Types.js";
import { MyMath } from '../../monax/MyMath.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { LogMng } from '../../monax/LogMng.js';
import { Signal } from '../../monax/events/Signal.js';

type CritParams = {
    critChance: number,//[], // [min, max]
    critFactor: number//[] // [min, max]
}

type AttackParams = {
    radius: number,
    damage?: number[], // [min, max]
    hitPenetration?: number,//[], // [min, max]
    crit?: CritParams
}

export type AttackInfo = DamageInfo & {
    // attacker game object id
    attackerId?: number,
    attackerClientId?: string,
    attacketType?: ObjectType
}

export type GameObjectParams = {
    owner: string,
    id: number,
    radius: number,
    position?: THREE.Vector3 | { x: number, y: number },
    isImmortal?: boolean,
    hp?: number,
    shield?: number,
    attackParams?: AttackParams,
    evasion?: number,
}

export class GameObject implements IUpdatable, ILogger {

    protected _className: string;
    protected _mesh: THREE.Mesh;
    // owner wallet id
    private _owner: string;
    // game object id
    protected _id: number;
    protected _type: ObjectType;
    // object radius
    private _radius: number;
    protected _hp: number;
    protected _shield: number;
    protected _evasion: number;
    private _isImmortal = false;
    protected _attackParams: AttackParams;
    //
    protected _attackObject: GameObject;

    private _lastAttackInfo: AttackInfo;
    
    /**
     * (sender)
     */
    onDamage = new Signal();

    constructor(aParams: GameObjectParams) {

        this._radius = aParams.radius;
        this._owner = aParams.owner;
        this._id = aParams.id;

        this._hp = aParams.hp || 0;
        this._shield = aParams.shield || 0;
        this._isImmortal = aParams.isImmortal || false;
        this._attackParams = aParams.attackParams || null;
        this._evasion = aParams.evasion || 0;
            
        this.initMesh();

        if (aParams.position) {
            if (aParams.position instanceof THREE.Vector3) {
                this._mesh.position.copy(aParams.position);
            }
            else {
                let pos = new THREE.Vector3(aParams.position.x, 0, aParams.position.y);
                this._mesh.position.copy(pos);
            }
        }

    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`${this._className}: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`${this._className}: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`${this._className}: ${aMsg}`, aData);
    }

    protected initMesh() {
        let g = new THREE.SphereGeometry(this._radius || 1);
        this._mesh = new THREE.Mesh(g);
        this._mesh['ownerObject'] = this;
    }

    get owner(): string {
        return this._owner;
    }
    
    get id(): number {
        return this._id;
    }

    get radius(): number {
        return this._radius;
    }

    get hp(): number {
        return this._hp;
    }

    get shield(): number {
        return this._shield;
    }

    // set hp(value: number) {
    //     let newHp = Math.max(0, value);
    //     this._hp = newHp;
    // }

    get isImmortal() {
        return this._isImmortal;
    }

    get attackRadius() {
        return this._attackParams.radius;
    }

    get position(): THREE.Vector3 {
        return this._mesh.position.clone();
    }

    get mesh(): THREE.Mesh {
        return this._mesh;
    }

    get lastAttackInfo(): AttackInfo {
        return this._lastAttackInfo;
    }

    getEvasion(): number {
        let res = 0;
        try {
            res = this._evasion || 0;
        } catch (error) {
        }
        return res;
    }

    getHitPenetration(): number {
        let res = 0;
        try {
            res = this._attackParams.hitPenetration || 0;
        } catch (error) {
        }
        return res;
    }

    getCritChancePercent(): number {
        let res = 0;
        try {
            res = this._attackParams.crit.critChance || 0;
        } catch (error) {
        }
        return res;
    }

    getCritFactor(): number {
        let res = 1;
        try {
            if (this._attackParams?.crit?.critFactor != undefined) {
                res = this._attackParams.crit.critFactor;
            }
        } catch (error) {
        }
        return res;
    }

    getAttackDamage(aParams?: {
        noCrit?: boolean,
        noMiss?: boolean
    }): DamageInfo {

        let hit = this.getHitPenetration();
        let enemyEvasion = this._attackObject?.getEvasion() || 0;
        enemyEvasion = Math.max(0, enemyEvasion - hit);
        let isMiss = MyMath.randomInRange(0, 100) <= enemyEvasion;
        if (aParams?.noMiss) isMiss = false;

        if (isMiss) {
            // LogMng.debug(`miss:`, {
            //     hit: hit,
            //     enemyEvasion: this._attackObject?.getEvasion(),
            //     resEvasion: enemyEvasion
            // });
        }

        let critChance = this.getCritChancePercent();
        let isCrit = MyMath.randomInRange(0, 100) <= critChance;
        if (aParams?.noCrit) isCrit = false;
        let critFactor = isCrit ? this.getCritFactor() : 1;
        const dmgMin = this._attackParams.damage[0] * critFactor;
        const dmgMax = this._attackParams.damage[1] * critFactor;
        let damage = Math.trunc(MyMath.randomInRange(dmgMin, dmgMax));

        if (isCrit) {
            // LogMng.debug(`crit:`, {
            //     critChance: critChance,
            //     critFactor: critFactor,
            //     dmg: damage
            // });
        }

        return {
            damage: damage,
            isMiss: isMiss,
            isCrit: isCrit,
            critFactor: critFactor
        };
        
    }

    damage(aAtkInfo: AttackInfo) {
        const dmg = aAtkInfo.damage;
        if (this._hp <= 0) return;
        if (!aAtkInfo.isMiss) {
            let shieldDmg = Math.min(this._shield, dmg);
            let hpDmg = Math.min(this._hp, dmg - shieldDmg);
            this._shield -= shieldDmg;
            this._hp -= hpDmg;
        }
        this.onDamage.dispatch(this, aAtkInfo);
        this._lastAttackInfo = aAtkInfo;
    }

    lookAt(aTarget: THREE.Vector3) {
        this._mesh.lookAt(aTarget);
    }

    lookByDir(aDir: THREE.Vector3) {
        let p = this._mesh.position.clone().add(aDir);
        this._mesh.lookAt(p);
    }

    /**
     * 
     * @param aPosition target position
     * @param aDuration duration in ms
     */
    jumpTo(aPosition: THREE.Vector3, aDuration = 1000) {

    }

    getCreateData(): ObjectCreateData {
        return null;
    }

    getUpdateData(): ObjectUpdateData {
        return null;
    }

    update(dt: number) {
        
    }

    free() {
        this._mesh = null;
        this._attackParams = null;
    }

}