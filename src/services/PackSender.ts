import { Socket } from "socket.io";
import { FieldInitData, GameCompleteData, PlanetLaserData, ObjectType, ObjectUpdateData, PackTitle, StarCreateData, StartGameData, AttackType, DamageInfo, ExpData, ExplosionType, ExplosionData, SniperData } from "../data/Types.js";
import { Client } from "../models/Client.js";

export class PackSender {
    private static _instance: PackSender;

    private constructor() {
        if (PackSender._instance) throw new Error("Don't use PackSender.constructor(), it's SINGLETON, use getInstance() method");
    }

    static getInstance(): PackSender {
        if (!PackSender._instance) PackSender._instance = new PackSender();
        return PackSender._instance;
    }

    private sendData(aClients: Client[], aPackTitle: PackTitle, aData: any) {
        for (let i = 0; i < aClients.length; i++) {
            const client = aClients[i];
            client.sendPack(aPackTitle, aData);
        }
    }
    
    gameStart(aClients: Client[], aData: StartGameData) {
        aData.cmd = 'start';
        this.sendData(aClients, PackTitle.gameStart, aData);
    }

    gameComplete(aClient: Client, aData: GameCompleteData) {
        this.sendData([aClient], PackTitle.gameComplete, aData);
    }

    fieldInit(aClients: Client[], aData: FieldInitData) {
        this.sendData(aClients, PackTitle.fieldInit, aData);
    }

    objectCreate(aClients: Client[], aData: StarCreateData) {
        this.sendData(aClients, PackTitle.objectCreate, aData);
    }

    objectUpdate(aClients: Client[], aData: ObjectUpdateData[]) {
        this.sendData(aClients, PackTitle.objectUpdate, aData);
    }

    objectDestroy(aClients: Client[], aData: number[]) {
        this.sendData(aClients, PackTitle.objectDestroy, aData);
    }

    rotate(aClients: Client[], aData: {
        id: number,
        type: 'toPoint' | 'toDir',
        target: {x, y, z},
        duration: number
    }) {
        this.sendData(aClients, PackTitle.rotate, aData);
    }

    jump(aClients: Client[], aData: {
        id: number,
        pos: { x, y, z },
        duration: number
    }) {
        this.sendData(aClients, PackTitle.jump, aData);
    }

    attack(aClients: Client[], aData: {
        attackType: AttackType,
        idFrom: number,
        idTo: number,
        damage?: number,
        isMiss?: boolean,
        isCrit?: boolean
    }) {
        this.sendData(aClients, PackTitle.attack, aData);
    }

    rayStart(aClients: Client[], aData: {
        idFrom: number,
        idTo: number
    }) {
        this.sendData(aClients, PackTitle.rayStart, aData);
    }

    rayStop(aClients: Client[], aData: {
        idFrom: number
    }) {
        this.sendData(aClients, PackTitle.rayStop, aData);
    }

    damage(aClients: Client[], aData: {
        id: number,
        pos: { x: number, y: number, z: number },
        info: DamageInfo
    }) {
        this.sendData(aClients, PackTitle.damage, aData);
    }

    planetLaserAttack(aClients: Client[], aData: PlanetLaserData) {
        this.sendData(aClients, PackTitle.planetLaser, aData);
    }

    exp(aClient: Client, aData: ExpData) {
        this.sendData([aClient], PackTitle.exp, aData);
    }

    explosion(aClients: Client[], aData: ExplosionData) {
        this.sendData(aClients, PackTitle.explosion, aData);
    }

    sniper(aClients: Client[], aData: SniperData) {
        this.sendData(aClients, PackTitle.sniper, aData);
    }

}