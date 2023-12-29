import * as THREE from 'three';
import { PackSender } from "../services/PackSender.js";
import { Client } from "../models/Client.js";
import { ObjectUpdateData } from "../data/Types.js";
import { Field } from "../objects/Field.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { Star } from "../objects/Star.js";
import { Fighter } from "../objects/Fighter.js";
import { GameObject } from "src/objects/GameObject.js";
import { FighterManager } from "../systems/FighterManager.js";

const SETTINGS = {
    tickRate: 1000 / 1, // 1000 / t - t ticks per sec
    beginTimer: 4, // in sec

    field: {
        size: {
            cols: 8,
            rows: 11,
            sectorWidth: 10,
            sectorHeight: 3 / 4 * 10
        },
    },

    stars: [
        {
            pos: { cx: 3, cy: 1 },
            radius: 5,
        },
        {
            pos: { cx: 3, cy: 9 },
            radius: 5,
        }
    ],

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
    }

}

export class Game implements ILogger {
    private _loopInterval: NodeJS.Timeout;
    private _objIdCounter = 0;
    private _objects: Map<number, GameObject>;
    private _clients: Client[];
    private _field: Field;
    private _fighterMng: FighterManager;

    constructor(aClientA: Client, aClientB: Client) {
        this._objects = new Map();
        this._clients = [aClientA, aClientB];
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

    private generateObjId(): number {
        this._objIdCounter++;
        return this._objIdCounter;
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
        const stars = SETTINGS.stars;
        for (let i = 0; i < stars.length; i++) {
            const starData = stars[i];
            let star = new Star({
                owner: this._clients[i].walletId,
                id: this.generateObjId(),
                position: this._field.cellPosToGlobal(starData.pos.cx, starData.pos.cy),
                radius: starData.radius,
                isTopStar: i == 0,
                hp: 1000
            });
            star.onFighterSpawn.add(this.onStarFighterSpawn, this);
            this._field.takeCell(starData.pos.cx, starData.pos.cy);
            PackSender.getInstance().starCreate(this._clients, star.getCreateData());
            this._objects.set(star.id, star);
        }

        // create planets

    }

    private onStarFighterSpawn(aStar: Star) {
        this.logDebug(`< onStarFighterSpawn >`);

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
                id: this.generateObjId(),
                radius: 3,
                hp: 100,
                position: this._field.cellPosToGlobal(cellPos.x, cellPos.y),
            });
            fighter.lookByDir(new THREE.Vector3(0, 0, yDir));

            this._field.takeCell(cellPos.x, cellPos.y);
            PackSender.getInstance().starCreate(this._clients, fighter.getCreateData());

            this._objects.set(fighter.id, fighter);
        }
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

    /**
     * 
     * @param dt delta time in sec
     */
    update(dt: number) {
        
        let updateData: ObjectUpdateData[] = [];
        let destroyList: number[] = [];

        this._objects.forEach((obj) => {
            if (obj instanceof Fighter) {
                this._fighterMng.updateShip(obj, dt);
            }
            obj.update(dt);
            updateData.push(obj.getUpdateData());
        });

        // this.sendUpdateObjects(updateList);
        updateData = updateData.filter((item) => {
            return item !== null && item !== undefined;
        });
        PackSender.getInstance().objectUpdate(this._clients, updateData);
        // this.sendDestroyObjects(destroyList);

    }
}