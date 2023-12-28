import { Client } from "./Client.js";
import { PackTitle } from "src/data/Types.js";

export enum ClientState {
    idle = 'idle',
    search = 'search',
    game = 'game'
}

export class BotClient extends Client {
    
    constructor() {
        super(null);
        this._className = 'BotClient';
        this.sign(this.generateWalletId(8));
    }

    private generateWalletId(length: number): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';

        for (let i = 0; i < length; i++) {
            let randomIndex: number;
            do {
                randomIndex = Math.floor(Math.random() * chars.length);
            } while (randomIndex === chars.length); // Проверка на значение 1

            randomString += chars.charAt(randomIndex);
        }

        randomString = `0x${randomString}bot`;

        return randomString;
    }

    sendPack(aPackTitle: PackTitle, aData: any) {
        // skip this operation
    }

}