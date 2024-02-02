import * as THREE from 'three';
import { PackSender } from "../services/PackSender.js";
import { Client } from "../models/Client.js";
import { GameCompleteData, PlanetLaserData, ObjectUpdateData, AttackType, DamageInfo } from "../data/Types.js";
import { Field } from "../objects/Field.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { Star } from "../objects/Star.js";
import { Fighter } from "../objects/Fighter.js";
import { GameObject } from "src/objects/GameObject.js";
import { FighterManager } from "../systems/FighterManager.js";
import { MyMath } from '../utils/MyMath.js';
import { Signal } from '../utils/events/Signal.js';
import { Planet } from '../objects/Planet.js';
import { StarManager } from '../systems/StarManager.js';
import { Linkor } from '../objects/Linkor.js';
import { BattleShipManager } from '../systems/BattleShipManager.js';
import { PlanetLaserManager } from '../systems/PlanetLaserManager.js';
import { SpaceShip } from '../objects/SpaceShip.js';
import { FighterFactory } from '../factory/FighterFactory.js';
import { LinkorFactory } from '../factory/LinkorFactory.js';

const SETTINGS = {
    tickRate: 1000 / 10, // 1000 / t - t ticks per sec
    beginTimer: 4, // in sec

    field: {
        size: {
            cols: 8,
            rows: 11,
            sectorWidth: 10,
            sectorHeight: 9
        },
    },

    starParams: {
        hp: 1000,
        radius: 5,
        attackRadius: 12,
        minDmg: 10,
        maxDmg: 20,
        minusHpPerSec: 1
    },
    stars: [
        {
            cellPos: { x: 3, y: 1 },
            fightersSpawnDeltaPos: [
                { x: -1, y: 1 },
                { x: 2, y: 1 },
                { x: 0, y: 2 },
            ],
            battleShipSpawnDeltaPos: [
                { x: -2, y: 1 }
            ]
        },
        {
            cellPos: { x: 3, y: 9 },
            fightersSpawnDeltaPos: [
                { x: -1, y: -1 },
                { x: 2, y: -1 },
                { x: 0, y: -2 }
            ],
            battleShipSpawnDeltaPos: [
                { x: 3, y: -1 }
            ]
        }
    ],

    planet: {
        radius: 1,
        orbitRadius: 15, // planet orbit radius
        orbitRotationPeriod: 60, // planet orbit rotation period in sec
        rotationPeriod: 5, // planet rotation period in sec
        laserDamage: 120
    },

    fighters: {
        radius: 3,
        attackRadius: 12,
        attackPeriod: 1,
        rotationTime: 1,
        prepareJumpTime: 0.5,
        jumpTime: 1
    },

    battleShips: {
        radius: 5,
        attackRadius: 36,
        attackPeriod: 1,
        rotationTime: 1,
        prepareJumpTime: 0.5,
        jumpTime: 1
    },

}

export class Game implements ILogger {
    private _inited = false;
    private _id: number; // game id
    private _loopInterval: NodeJS.Timeout;
    private _objIdCounter = 0;
    private _objects: Map<number, GameObject>;
    private _clients: Client[];
    private _field: Field;
    private _starMng: StarManager;
    private _fighterMng: FighterManager;
    private _battleShipMng: BattleShipManager;
    private _abilsMng: PlanetLaserManager;
    // events
    onGameComplete = new Signal();

    constructor(aGameId: number, aClientA: Client, aClientB: Client) {
        this._inited = false;
        this._id = aGameId;
        this._objects = new Map();
        this._clients = [aClientA, aClientB];
        this.initClientListeners();
        this.startLoop();
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`Game: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`Game: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`Game: ${aMsg}`, aData);
    }

    private initClientListeners() {
        for (let i = 0; i < this._clients.length; i++) {
            const client = this._clients[i];
            client.onDisconnect.add(this.onClientDisconnect, this);
            client.onLaser.add(this.onClientLaser, this);
            client.onExitGame.add(this.onClientExitGame, this);
        }
    }

    private onClientDisconnect(aClient: Client) {
        this.logDebug(`client (${aClient.walletId}) disconnect`);

        let winner: Client;
        for (let i = 0; i < this._clients.length; i++) {
            const client = this._clients[i];
            if (client.id != aClient.id) {
                winner = client;
                break;
            }
        }
        this.completeGame(winner);
    }

    private onClientLaser(aClient: Client) {
        this._abilsMng?.laserAttack(aClient);
    }

    private onClientExitGame(aClient: Client) {
        let aWinner = this._clients[0] == aClient ? this._clients[1] : this._clients[0];
        this.completeGame(aWinner);
    }

    private completeGame(aWinner: Client) {
        this.logDebug(`completeGame: winner client: (${aWinner?.walletId})`);

        for (let i = 0; i < this._clients.length; i++) {
            const client = this._clients[i];
            let data: GameCompleteData = {
                status: 'draw'
            };
            if (aWinner) data.status = client.id == aWinner.id ? 'win' : 'lose';
            PackSender.getInstance().gameComplete(client, data);
        }
        this.onGameComplete.dispatch(this);
    }

    private generateObjectId(): number {
        return this._objIdCounter++;
    }

    private startLoop() {
        this._loopInterval = setInterval(() => {
            this.update(SETTINGS.tickRate * 0.001);
        }, SETTINGS.tickRate);
    }

    private stopLoop() {
        if (this._loopInterval) {
            clearInterval(this._loopInterval);
            this._loopInterval = null;
        }
    }

    private init() {

        // create field
        this._field = new Field(SETTINGS.field);

        this._starMng = new StarManager(this._objects);
        this._fighterMng = new FighterManager(this._field, this._objects);
        this._battleShipMng = new BattleShipManager(this._field, this._objects);

        this._abilsMng = new PlanetLaserManager(this._objects);
        this._abilsMng.onLaserAttack.add(this.onPlanetLaserAttack, this);

        // create stars
        const starParams = SETTINGS.starParams;
        const starsData = SETTINGS.stars;
        let stars: Star[] = [];
        for (let i = 0; i < starsData.length; i++) {
            const starData = starsData[i];

            let star = new Star({
                id: this.generateObjectId(),
                owner: this._clients[i].walletId,
                position: this._field.cellPosToGlobalVec3(starData.cellPos),
                radius: starParams.radius,
                hp: starParams.hp,
                attackParams: {
                    radius: starParams.attackRadius,
                    damage: [starParams.minDmg, starParams.maxDmg],
                },
                isTopStar: starData.cellPos.y < SETTINGS.field.size.rows / 2,
                fightersSpawnDeltaPos: starData.fightersSpawnDeltaPos,
                battleShipSpawnDeltaPos: starData.battleShipSpawnDeltaPos,
                minusHpPerSec: starParams.minusHpPerSec
            });

            star.onFighterSpawn.add(this.onStarFighterSpawn, this);
            star.onLinkorSpawn.add(this.onStarLinkorSpawn, this);
            star.onDamage.add(this.onObjectDamage, this);

            this._field.takeCell(starData.cellPos.x, starData.cellPos.y);
            PackSender.getInstance().starCreate(this._clients, star.getCreateData());
            this._objects.set(star.id, star);
            stars.push(star);
            this._starMng.addStar(star);

        }

        // create planets
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            const isTopStar = star.position.z < (SETTINGS.field.size.rows * SETTINGS.field.size.sectorHeight) / 2;
            const planetParams = SETTINGS.planet;

            let planet = new Planet({
                id: this.generateObjectId(),
                owner: star.owner,
                isImmortal: true,
                radius: planetParams.radius,
                orbitCenter: star.position.clone(),
                orbitRadius: planetParams.orbitRadius,
                orbitRotationPeriod: planetParams.orbitRotationPeriod,
                rotationPeriod: planetParams.rotationPeriod,
                startAngle: MyMath.randomInRange(0, Math.PI * 2),
                startOrbitAngle: isTopStar ? Math.PI / 2 : -Math.PI / 2,
                laserDamage: planetParams.laserDamage
            });

            PackSender.getInstance().starCreate(this._clients, planet.getCreateData());
            this._objects.set(planet.id, planet);
        }

        this._inited = true;

    }

    private getClientByWallet(aWalletId: string): Client | null {
        for (let i = 0; i < this._clients.length; i++) {
            const client = this._clients[i];
            if (client.walletId == aWalletId) return client;
        }
        return null;
    }

    private onStarFighterSpawn(aStar: Star, aCellDeltaPos: { x: number, y: number }) {
        const level = 1;
        const shipParams = SETTINGS.fighters;
        const shipFactoryParams = new FighterFactory().getShipParams(level);
        const yDir = aStar.isTopStar ? 1 : -1;
        let cellPos = this._field.globalToCellPos(aStar.position.x, aStar.position.z);
        cellPos.x += aCellDeltaPos.x;
        cellPos.y += aCellDeltaPos.y;


        let fighter = new Fighter({
            owner: aStar.owner,
            id: this.generateObjectId(),
            position: this._field.cellPosToGlobal(cellPos),
            radius: shipParams.radius,
            level: level,
            hp: shipFactoryParams.hp,
            shield: shipFactoryParams.shield,
            attackParams: {
                radius: shipParams.attackRadius,
                damage: shipFactoryParams.damage,
                hitPenetration: shipFactoryParams.hitPenetration,
                crit: {
                    critChance: shipFactoryParams.critChance,
                    critFactor: shipFactoryParams.critFactor
                }
            },
            evasion: shipFactoryParams.evasion,
            lookDir: new THREE.Vector3(0, 0, yDir),
            attackPeriod: shipParams.attackPeriod,
            rotationTime: shipParams.rotationTime,
            prepareJumpTime: shipParams.prepareJumpTime,
            jumpTime: shipParams.jumpTime
        });

        fighter.onRotate.add(this.onShipRotate, this);
        fighter.onJump.add(this.onShipJump, this);
        fighter.onAttack.add(this.onShipAttack, this);
        fighter.onRayStart.add(this.onShipRayStart, this);
        fighter.onDamage.add(this.onObjectDamage, this);

        this._field.takeCell(cellPos.x, cellPos.y);
        PackSender.getInstance().starCreate(this._clients, fighter.getCreateData());

        this._objects.set(fighter.id, fighter);
    }

    private onStarLinkorSpawn(aStar: Star, aCellDeltaPos: { x: number, y: number }) {
        const level = 1;
        const shipParams = SETTINGS.battleShips;
        const shipFactoryParams = new LinkorFactory().getShipParams(level);
        const yDir = aStar.isTopStar ? 1 : -1;
        let cellPos = this._field.globalToCellPos(aStar.position.x, aStar.position.z);
        cellPos.x += aCellDeltaPos.x;
        cellPos.y += aCellDeltaPos.y;

        let linkor = new Linkor({
            owner: aStar.owner,
            id: this.generateObjectId(),
            position: this._field.cellPosToGlobalVec3(cellPos),
            radius: shipParams.radius,
            level: level,
            hp: shipFactoryParams.hp,
            shield: shipFactoryParams.shield,
            attackParams: {
                radius: shipParams.attackRadius,
                damage: shipFactoryParams.damage,
                hitPenetration: shipFactoryParams.hitPenetration,
                crit: {
                    critChance: shipFactoryParams.critChance,
                    critFactor: shipFactoryParams.critFactor
                }
            },
            evasion: shipFactoryParams.evasion,
            lookDir: new THREE.Vector3(0, 0, yDir),
            attackPeriod: shipParams.attackPeriod,
            rotationTime: shipParams.rotationTime,
            prepareJumpTime: shipParams.prepareJumpTime,
            jumpTime: shipParams.jumpTime
        });

        linkor.onRotate.add(this.onShipRotate, this);
        linkor.onJump.add(this.onShipJump, this);
        linkor.onAttack.add(this.onShipAttack, this);
        linkor.onRayStart.add(this.onShipRayStart, this);
        linkor.onDamage.add(this.onObjectDamage, this);

        this._field.takeCell(cellPos.x, cellPos.y);
        PackSender.getInstance().starCreate(this._clients, linkor.getCreateData());

        this._objects.set(linkor.id, linkor);
    }
    
    private onShipRotate(aShip: SpaceShip, aPoint: THREE.Vector3, aDur: number) {
        PackSender.getInstance().rotate(this._clients, {
            id: aShip.id,
            type: 'toPoint',
            target: aPoint,
            duration: aDur
        });
    }

    private onShipJump(aShip: SpaceShip, aPosition: THREE.Vector3, aDur: number) {
        PackSender.getInstance().jump(this._clients, {
            id: aShip.id,
            pos: aPosition,
            duration: aDur
        });
    }

    private onShipAttack(aShip: SpaceShip, aEnemy: GameObject, aType: AttackType) {
        const dmg = aShip.getAttackDamage({
            noCrit: aType == 'ray',
            noMiss: aType == 'ray'
        });
        PackSender.getInstance().attack(this._clients, {
            attackType: aType,
            idFrom: aShip.id,
            idTo: aEnemy.id,
            damage: dmg.damage,
            isMiss: dmg.isMiss,
            isCrit: dmg.isCrit
        });

        aEnemy.damage(dmg);
        
    }

    onShipRayStart(aShip: SpaceShip, aEnemy: GameObject) {
        PackSender.getInstance().rayStart(this._clients, {
            idFrom: aShip.id,
            idTo: aEnemy.id
        });
    }

    private onObjectDamage(aSender: GameObject, aAttackInfo: DamageInfo) {
        PackSender.getInstance().damage(this._clients, {
            id: aSender.id,
            pos: aSender.position,
            info: aAttackInfo
        });
    }

    private onPlanetLaserAttack(aMng: PlanetLaserManager, aData: PlanetLaserData) {
        PackSender.getInstance().planetLaserAttack(this._clients, aData);
    }

    protected getAllStars(): Star[] {
        let stars: Star[] = [];
        this._objects.forEach((obj) => {
            if (obj instanceof Star) stars.push(obj);
        });
        return stars;
    }

    protected checkWinner(dt: number) {

        let stars: Star[] = this.getAllStars();
        // check Stars count and winner
        if (stars.length < 2) {
            if (stars.length == 1) {
                // we have a winner
                let winnerStar = stars[0];
                let client = this.getClientByWallet(winnerStar.owner);
                this.completeGame(client);
            }
            else {
                // draw
                this.completeGame(null);
            }
        }

    }

    get id(): number {
        return this._id;
    }

    start() {
        PackSender.getInstance().gameStart([this._clients[0]], {
            timer: SETTINGS.beginTimer,
            playerWallet: this._clients[0].walletId,
            enemyWallet: this._clients[1].walletId
        });
        PackSender.getInstance().gameStart([this._clients[1]], {
            timer: SETTINGS.beginTimer,
            playerWallet: this._clients[1].walletId,
            enemyWallet: this._clients[0].walletId
        });

        PackSender.getInstance().fieldInit([this._clients[0]], {
            fieldParams: SETTINGS.field,
            playerPosition: 'top'
        });
        PackSender.getInstance().fieldInit([this._clients[1]], {
            fieldParams: SETTINGS.field,
            playerPosition: 'bot'
        });

        setTimeout(() => {
            this.init();
        }, SETTINGS.beginTimer * 1000);

    }

    tests() {
        // create field
        if (!this._field) this._field = new Field(SETTINGS.field);

        // field tests
        const cellPoses = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ];
        const cellPosesRes = [];

        for (let i = 0; i < cellPoses.length; i++) {
            const item = cellPoses[i];
            let c = this._field.cellPosToGlobal(item);
            cellPosesRes.push(c);
        }
        this.logDebug(`TEST cx to coords`, {
            cellPoses: cellPoses,
            res: cellPosesRes
        });

        const globalPoses = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 5, y: 7.5 },
            { x: 15, y: 7.5 },
            { x: 15, y: 20 },
        ];
        const globalPosesRes = [];

        for (let i = 0; i < globalPoses.length; i++) {
            const item = globalPoses[i];
            let c = this._field.globalToCellPos(item.x, item.y);
            globalPosesRes.push(c);
        }
        this.logDebug(`TEST coords to cx`, {
            globalPoses: globalPoses,
            res: globalPosesRes
        });


    }

    /**
     * 
     * @param dt delta time in sec
     */
    update(dt: number) {

        if (!this._inited) return;

        let updateData: ObjectUpdateData[] = [];
        let destroyList: number[] = [];

        this._objects.forEach((obj) => {

            if (!obj.isImmortal && obj.hp <= 0) {
                destroyList.push(obj.id);
                this._objects.delete(obj.id);
                // free the field cell
                this._field.takeOffCell(this._field.globalVec3ToCellPos(obj.position));
                obj.free();
                return;
            }

            if (obj instanceof Fighter) {
                this._fighterMng.updateShip(obj);
            }

            if (obj instanceof Linkor) {
                this._battleShipMng.updateShip(obj);
            }

            obj.update(dt);
            updateData.push(obj.getUpdateData());

        });

        updateData = updateData.filter((item) => {
            return item !== null && item !== undefined;
        });
        PackSender.getInstance().objectUpdate(this._clients, updateData);

        if (destroyList.length > 0) {
            PackSender.getInstance().objectDestroy(this._clients, destroyList);
        }

        this.checkWinner(dt);

    }

    free() {
        this.stopLoop();
        this._loopInterval = null;
        this.onGameComplete.removeAll();
        this._starMng.free();
        this._fighterMng.free();
        this._battleShipMng.free();
        this._field.free();
        this._objects.clear();
        this._objects = null;
        this._clients = [];
    }


}