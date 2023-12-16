import { Socket } from "socket.io";
import { PackTitle } from "../data/Packages.js";

export class PackSender {
    private static _instance: PackSender;

    private constructor() {
        if (PackSender._instance) throw new Error("Don't use PackSender.constructor(), it's SINGLETON, use getInstance() method");
    }

    static getInstance(): PackSender {
        if (!PackSender._instance) PackSender._instance = new PackSender();
        return PackSender._instance;
    }

    signRequest(aSocket: Socket) {
        aSocket.emit(PackTitle.sign, {
            cmd: 'request'
        });
    }

    signReject(aSocket: Socket, aMsg?: string) {
        aSocket.emit(PackTitle.sign, {
            cmd: 'reject',
            message: aMsg
        });
    }

    signSuccess(aSocket: Socket, aWalletId: string) {
        aSocket.emit(PackTitle.sign, {
            cmd: 'success',
            walletId: aWalletId
        });
    }

    startGameSearch(aSocket: Socket) {
        aSocket.emit(PackTitle.gameSearching, {
            cmd: 'start'
        });
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