import { PackSender } from "../services/PackSender.js";
import { Client } from "../models/Client.js";
import { Socket } from "socket.io";
import { ObjectUpdateData, PackTitle, StarCreateData } from "../data/Types.js";
import { Field } from "../objects/Field.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { Star } from "../objects/Star.js";
import { Vec2 } from "../utils/MyMath.js";

const SETTINGS = {
    tickRate: 1000 / 30, // 1000 / t - t ticks per sec
    beginTimer: 4, // in sec

    field: {
        size: {
            cols: 8,
            rows: 10,
            sectorWidth: 10,
            sectorHeight: 3 / 4 * 10
        },
    },

    star1: {
        pos: { cx: 3, cy: 1 },
        radius: 5,
    },

    star2: {
        pos: { cx: 3, cy: 8 },
        radius: 5,
    }

}

export class Game implements ILogger {
    private _loopInterval: NodeJS.Timeout;
    private _objIdCounter = 0;
    private _clients: Client[];
    private _field: Field;

    constructor(aClientA: Client, aClientB: Client) {
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

        // create stars

        let star1 = new Star({
            ownerWalletId: this._clients[0].walletId,
            id: this.generateObjId(),
            position: this._field.cellPosToCoordinates(3, 1),
            radius: SETTINGS.star1.radius
        });
        this._field.takeCell(3, 1);

        PackSender.getInstance().starCreate(this._clients, star1.getCreateData());

        // create planets

    }
    
    start() {
        PackSender.getInstance().gameStart([this._clients[0]], {
            timer: SETTINGS.beginTimer,
        });
        PackSender.getInstance().gameStart([this._clients[1]], {
            timer: SETTINGS.beginTimer,
        });

        PackSender.getInstance().fieldInit([this._clients[0]], {
            playerPosition: 'top'
        });
        PackSender.getInstance().fieldInit([this._clients[1]], {
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
            let c = this._field.cellPosToCoordinates(item.x, item.y);
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
            let c = this._field.coordinatesToCellPos(item.x, item.y);
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

        let updateList: ObjectUpdateData[] = [];
        let destroyList: number[] = [];

        // this._objects?.forEach((obj) => {
        //     obj.update(dt);
        //     updateList.push(this.getUpdateData(obj));
        // });

        // this.sendCreateObjects();
        // this.sendUpdateObjects(updateList);
        // this.sendDestroyObjects(destroyList);

    }
}