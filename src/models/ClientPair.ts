import { Signal } from "../utils/events/Signal.js";
import { Client } from "./Client.js";
import { AcceptScreenData, PackTitle } from "../data/Types.js";
import { PackSender } from "../services/PackSender.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";

export class ClientPair implements ILogger {
    private _id: number;
    private _clients: Map<string, Client>;
    private _accepts: Map<string, boolean>;
    onAllReady = new Signal();
    onBreak = new Signal();
    
    constructor(aId: number, aClientA: Client, aClientB: Client) {
        this._id = aId;
        this._clients = new Map();
        this._accepts = new Map();
        this.addClient(aClientA);
        this.addClient(aClientB);
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`ClientPair: ${aMsg}`, aData);
    }

    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`ClientPair: ${aMsg}`, aData);
    }

    logError(aMsg: string, aData?: any): void {
        LogMng.error(`ClientPair: ${aMsg}`, aData);
    }

    private addClient(aClient: Client) {
        this._clients.set(aClient.connectionId, aClient);
        aClient.onAcceptScreenPack.add(this.onAcceptScreenPack, this);
        aClient.sendAcceptScreenStart();
    }

    private onAcceptScreenPack(aClient: Client, aData: AcceptScreenData) {
        let clients: Client[] = [];
        this._clients.forEach((client) => {
            clients.push(client);
        });

        switch (aData.action) {

            case 'accept':
                this._accepts.set(aClient.connectionId, true);
                this._clients.forEach((client) => {
                    let isAccepted = this._accepts.get(client.connectionId) == true;
                    if (isAccepted) {
                        PackSender.getInstance().sendBattleAcceptState([client], {
                            action: 'update',
                            state: {
                                current: this._accepts.size,
                                max: this._clients.size
                            }
                        });
                    }
                });

                if (this._accepts.size >= this._clients.size) {
                    // all accepted
                    this.onAllReady.dispatch(this);
                }

                break;
            
            case 'closeClick':
                PackSender.getInstance().sendBattleAcceptState(clients, {
                    action: 'cancel'
                });
                this.onBreak.dispatch(this);
                break;
            
            default:
                this.logWarn(`onInitScreenPack: unknown aData.action:`, aData);
                break;
            
        }

    }

    public get id(): number {
        return this._id;
    }

    get clients(): Map<string, Client> {
        return this._clients;
    }

    free() {
        try {
            this._clients.forEach((client) => {
                client.onAcceptScreenPack.remove(this.onAcceptScreenPack, this);
            });
            this._clients.clear();
            this._clients = null;
            this._accepts.clear();
            this.onAllReady.removeAll();
            this.onBreak.removeAll();
        } catch (error) {
            
        }
    }


}