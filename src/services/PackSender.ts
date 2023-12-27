import { Socket } from "socket.io";
import { ObjectType, PackTitle, StarCreateData } from "../data/Types.js";
import { Client } from "src/models/Client.js";

export type StartGameData = {
    cmd?: 'start',
    timer: number,
    playerPosition: 'top' | 'bot'
}


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

    starCreate(aClients: Client[], aData: StarCreateData) {
        this.sendData(aClients, PackTitle.objectCreate, aData);
    }

    objectCreate(aList: {

        // common params
        id: string,
        owner: string,
        // type: ObjectType,
        radius?: number,
        position?: { x: number, y: number },
        rotation?: number,
        hp?: number,

        /**
         * special data for planets
         */
        planetData?: {
            orbitRadius?: number,
            orbitCenter?: { x: number, y: number },
            startOrbitAngle?: number,
            year?: number,
            rotationSpeed?: number,
            orbitSpeed?: number,
        }

    }[]): string {
        return JSON.stringify({
            title: PackTitle.objectCreate,
            list: aList
        });
    }

    /**
     * Universal packet for object parameters update
     * @param aList List of objects id and data
     * @returns 
     */
    objectUpdate(aList: {
        id: string,
        event?: string,
        position?: { x: number, y: number },
        rotation?: number,
        hp?: number,
        /**
         * Any other data
         */
        data?: any
    }[]): string {
        return JSON.stringify({
            title: PackTitle.objectUpdate,
            list: aList
        });
    }

    attackLaser(aData: {
        idFrom: string,
        idTo: string,
        damage?: number,
        isMiss?: boolean
    }): string {
        return JSON.stringify({
            title: PackTitle.attack,
            type: 'laser',
            data: aData
        });
    }

    attackRay(aData: {
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