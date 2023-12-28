import { ObjectCreateData, PackTitle } from "../data/Types";

export class PackFactory {
    private static _instance: PackFactory;

    private constructor() {
        if (PackFactory._instance) throw new Error("Don't use PacketFactory.constructor(), it's SINGLETON, use getInstance() method");
    }

    static getInstance(): PackFactory {
        if (!PackFactory._instance) PackFactory._instance = new PackFactory();
        return PackFactory._instance;
    }

    objectCreate(aList: ObjectCreateData[]): string {
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