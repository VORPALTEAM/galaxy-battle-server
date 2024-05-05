import { Client } from "./Client.js";
import { AcceptScreenData, PackTitle } from "../data/Types.js";

export enum ClientState {
    idle = 'idle',
    search = 'search',
    game = 'game'
}

export class BotClient extends Client {
    
    constructor() {
        super(null);
        this._className = 'BotClient';
        this._isBot = true;
        this.sign(this.generateWalletId(10));
    }

    private generateId(aLength = 10): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < aLength; i++) {
            let randomIndex: number;
            do {
                randomIndex = Math.floor(Math.random() * chars.length);
            } while (randomIndex === chars.length); // Проверка на значение 1

            randomString += chars.charAt(randomIndex);
        }
        return randomString;
    }

    private generateWalletId(aLength = 10): string {
        let randomString = `0x${this.generateId(aLength)}-BOT`;
        return randomString;
    }

    private generateSocketId(aLength = 10): string {
        let randomString = `${this.generateId(aLength)}-BOT`;
        return randomString;
    }

    protected setIdBySocket() {
        this._connectionId = this.generateSocketId();
    }

    protected initListeners() {
        // clear
    }

    sendPack(aPackTitle: PackTitle, aData: any) {
        // skip this operation
    }

    sendAcceptScreenStart() {
        let data: AcceptScreenData = {
            action: 'accept',
            timer: 10
        }
        this.onAcceptScreenPack.dispatch(this, data);
    }

}