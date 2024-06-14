import { Signal } from "../../monax/events/Signal.js";
import { Client } from "./Client.js";
import { AcceptScreenData } from "../data/Types.js";
import { PackSender } from "../services/PackSender.js";
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { BC_DuelInfo } from "../../blockchain/types.js";

export class ClientPair implements ILogger {
    private _id: number;
    private _clients: Map<string, Client>;
    private _accepts: Map<string, boolean>;
    private _loaded: Map<string, boolean>;
    private _duelInfo: BC_DuelInfo;
    onAllReady = new Signal();
    onBreak = new Signal();

    constructor(aId: number, aClientA: Client, aClientB: Client, aDuelInfo: BC_DuelInfo) {
        this._id = aId;
        this._duelInfo = aDuelInfo;
        this._clients = new Map();
        this._accepts = new Map();
        this._loaded = new Map();
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
        const battleAcceptTimer = 15; // in sec
        this._clients.set(aClient.connectionId, aClient);
        aClient.onAcceptScreenPack.add(this.onAcceptScreenPack, this);
        aClient.sendAcceptScreenStart(battleAcceptTimer);
    }

    private onAcceptScreenPack(aClient: Client, aData: AcceptScreenData) {
        let clients: Client[] = [];
        this._clients.forEach((client) => {
            clients.push(client);
        });

        switch (aData.action) {

            case 'accept':
                this.logDebug(`onAcceptScreenPack: accept recieved...`);

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
                    // send loading state
                    this._clients.forEach((client) => {
                        setTimeout(() => {
                            client.sendAcceptScreenLoading();
                        }, 1000);
                    });
                }

                break;

            case 'loading':
                this.logDebug(`onAcceptScreenPack: loading recieved...`);
                this._loaded.set(aClient.connectionId, true);
                aClient.setPlayerData({
                    starName: aData.loadingData?.starName
                });
                if (this._loaded.size >= this._clients.size) {
                    // all accepted
                    this.onAllReady.dispatch(this, this._duelInfo);
                }
                break;

            case 'closeClick':
                this.logDebug(`onAcceptScreenPack: closeClick recieved...`);

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
            this._accepts = null;
            this._loaded.clear();
            this._loaded = null;
            this.onAllReady.removeAll();
            this.onBreak.removeAll();
        } catch (error) {

        }
    }


}