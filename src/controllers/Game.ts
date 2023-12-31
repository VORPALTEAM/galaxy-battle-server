import * as THREE from 'three';
import { PackSender } from "../services/PackSender.js";
import { Client } from "../models/Client.js";
import { GameCompleteData, ObjectUpdateData } from "../data/Types.js";
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

    stars: {
        hp: 1000,
        radius: 5,
        positions: [
            {
                pos: { cx: 3, cy: 1 },
            },
            {
                pos: { cx: 3, cy: 9 },
            }
        ],
    },

    // TODO: move this data to Star class
    spawn: {
        fightersTop: [
            { dx: -1, dy: 1 },
            { dx: 2, dy: 1 },
            { dx: 0, dy: 2 },
        ],
        fightersBot: [
            { dx: -1, dy: -1 },
            { dx: 2, dy: -1 },
            { dx: 0, dy: -2 },
        ]
    },

    planet: {
        radius: 1,
        orbitRadius: 15, // planet orbit radius
        orbitRotationPeriod: 60, // planet orbit rotation period in sec
        rotationPeriod: 8, // planet rotation period in sec
    },

    fighters: {
        hp: 100,
        attackRadius: 12,
        minDmg: 10,
        maxDmg: 20
    },

}

export class Game implements ILogger {
    private _id: number; // game id
    private _loopInterval: NodeJS.Timeout;
    private _objIdCounter = 0;
    private _objects: Map<number, GameObject>;
    private _clients: Client[];
    private _field: Field;
    private _fighterMng: FighterManager;
    onGameComplete = new Signal();

    constructor(aGameId: number, aClientA: Client, aClientB: Client) {
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
            client.onDisconnect.add(this.onDisconnect, this);
        }
    }

    private onDisconnect(aClient: Client) {
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
        this._fighterMng = new FighterManager(this._field, this._objects);

        // create stars
        const starsData = SETTINGS.stars;
        let stars: Star[] = [];
        for (let i = 0; i < starsData.positions.length; i++) {
            const posData = starsData.positions[i];
            let star = new Star({
                id: this.generateObjectId(),
                owner: this._clients[i].walletId,
                position: this._field.cellPosToGlobal(posData.pos.cx, posData.pos.cy),
                radius: starsData.radius,
                isTopStar: posData.pos.cy < SETTINGS.field.size.rows / 2,
                hp: starsData.hp
            });
            star.onFighterSpawn.add(this.onStarFighterSpawn, this);
            this._field.takeCell(posData.pos.cx, posData.pos.cy);
            PackSender.getInstance().starCreate(this._clients, star.getCreateData());
            this._objects.set(star.id, star);
            stars.push(star);
        }

        // create planets
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            const isTopStar = star.position.z < (SETTINGS.field.size.rows * SETTINGS.field.size.sectorHeight) / 2;

            let planet = new Planet({
                id: this.generateObjectId(),
                owner: star.owner,
                isImmortal: true,
                radius: SETTINGS.planet.radius,
                orbitCenter: star.position.clone(),
                orbitRadius: SETTINGS.planet.orbitRadius,
                orbitRotationPeriod: SETTINGS.planet.orbitRotationPeriod,
                rotationPeriod: SETTINGS.planet.rotationPeriod,
                startAngle: MyMath.randomInRange(0, Math.PI * 2),
                startOrbitAngle: isTopStar ? Math.PI / 2 : -Math.PI / 2,
            });

            PackSender.getInstance().starCreate(this._clients, planet.getCreateData());
            this._objects.set(planet.id, planet);
        }

    }

    private getClientByWallet(aWalletId: string): Client | null {
        for (let i = 0; i < this._clients.length; i++) {
            const client = this._clients[i];
            if (client.walletId == aWalletId) return client;
        }
        return null;
    }

    private onStarFighterSpawn(aStar: Star) {
        // this.logDebug(`< onStarFighterSpawn >`);

        let spawnData = aStar.isTopStar ? SETTINGS.spawn.fightersTop : SETTINGS.spawn.fightersBot;
        const yDir = aStar.isTopStar ? 1 : -1;
        for (let i = 0; i < spawnData.length; i++) {
            const data = spawnData[i];
            // this.logDebug(`data:`, data);

            let cellPos = this._field.globalToCellPos(aStar.position.x, aStar.position.z);
            // this.logDebug(`starCellPos:`, cellPos);

            cellPos.x += data.dx;
            cellPos.y += data.dy;
            // this.logDebug(`cellPos:`, cellPos);

            let fighter = new Fighter({
                owner: aStar.owner,
                id: this.generateObjectId(),
                position: this._field.cellPosToGlobal(cellPos.x, cellPos.y),
                radius: 3,
                hp: SETTINGS.fighters.hp,
                attackParams: {
                    radius: SETTINGS.fighters.attackRadius,
                    minDamage: SETTINGS.fighters.minDmg,
                    maxDamage: SETTINGS.fighters.maxDmg
                },
            });
            fighter.lookByDir(new THREE.Vector3(0, 0, yDir));
            fighter.onAttack.add(this.onFighterAttack, this);

            this._field.takeCell(cellPos.x, cellPos.y);
            PackSender.getInstance().starCreate(this._clients, fighter.getCreateData());

            this._objects.set(fighter.id, fighter);
        }
    }

    private onFighterAttack(aFighter: Fighter, aEnemy: GameObject) {
        const dmg = aFighter.getAttackDamage();
        const isMiss = MyMath.randomIntInRange(0, 10) > 9;
        PackSender.getInstance().attack(this._clients, {
            attackType: 'laser',
            idFrom: aFighter.id,
            idTo: aEnemy.id,
            damage: dmg,
            isMiss: isMiss
        });

        if (!isMiss) {
            aEnemy.hp -= dmg;
        }

    }

    get id(): number {
        return this._id;
    }

    start() {
        PackSender.getInstance().gameStart([this._clients[0]], {
            timer: SETTINGS.beginTimer,
        });
        PackSender.getInstance().gameStart([this._clients[1]], {
            timer: SETTINGS.beginTimer,
        });

        PackSender.getInstance().fieldInit([this._clients[0]], {
            fieldParams: SETTINGS.field,
            playerPosition: 'top'
        });
        PackSender.getInstance().fieldInit([this._clients[1]], {
            fieldParams: SETTINGS.field,
            playerPosition: 'bot'
        });

        this.init();

        setTimeout(() => {

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
            let c = this._field.cellPosToGlobal(item.x, item.y);
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

    free() {
        this.stopLoop();
        this._loopInterval = null;
        this.onGameComplete.removeAll();
        this._fighterMng.free();
        this._field.free();
        this._objects.clear();
        this._objects = null;
        this._clients = [];
    }

    /**
     * 
     * @param dt delta time in sec
     */
    update(dt: number) {
        
        let updateData: ObjectUpdateData[] = [];
        let destroyList: number[] = [];
        let stars: Star[] = [];

        this._objects.forEach((obj) => {

            if (!obj.isImmortal && obj.hp <= 0) {
                destroyList.push(obj.id);
                this._objects.delete(obj.id);
                // free the field cell
                this._field.takeOffCell(this._field.globalVec3ToCellPos(obj.position));
                return;
            }

            if (obj instanceof Fighter) {
                this._fighterMng.updateShip(obj, dt);
            }

            if (obj instanceof Star) {
                stars.push(obj);
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


}