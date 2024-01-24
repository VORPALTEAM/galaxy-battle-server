import { Socket } from "socket.io";
import { FieldInitData, GameCompleteData, PlanetLaserData, ObjectType, ObjectUpdateData, PackTitle, StarCreateData, StartGameData, AttackType } from "../data/Types.js";
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

    starCreate(aClients: Client[], aData: StarCreateData) {
        this.sendData(aClients, PackTitle.objectCreate, aData);
    }

    fieldInit(aClients: Client[], aData: FieldInitData) {
        this.sendData(aClients, PackTitle.fieldInit, aData);
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
        isMiss?: boolean
    }) {
        this.sendData(aClients, PackTitle.attack, aData);
    }

    rayStart(aClients: Client[], aData: {
        idFrom: number,
        idTo: number
    }) {
        this.sendData(aClients, PackTitle.rayStart, aData);
    }

    planetLaserAttack(aClients: Client[], aData: PlanetLaserData) {
        this.sendData(aClients, PackTitle.planetLaser, aData);
    }


    

    attackRay_OLD(aData: {
        idFrom: string,
        idTo: string,
        state: 'start' | 'end'
    }): string {
        return JSON.stringify({
            title: PackTitle.attack,
            type: 'ray',
            data: aData
        });
    }

}