import { Socket } from "socket.io";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { ClaimRewardData, DebugTestData, PackTitle, RewardType, SkillRequest } from "../data/Types.js";
import { Signal } from "../utils/events/Signal.js";
import { RecordWinnerWithChoose } from "../blockchain/boxes/boxes.js";
import { WINSTREAKS } from "src/database/DB.js";

export class Client implements ILogger {

    protected _className: string;
    protected _socket: Socket;
    protected _connectionId: string;
    protected _walletId: string;

    // flags
    protected _isSigned = false;
    protected _isSignPending = false;
    protected _isDisconnected = false;
    private _isWithBot = false;
    protected _isBot = false;
    protected _isFreeConnection = false;
    
    onSignRecv = new Signal();
    onStartSearchGame = new Signal();
    onStopSearchGame = new Signal();
    // onLaser = new Signal();
    onSkillRequest = new Signal();
    onExitGame = new Signal();
    onDisconnect = new Signal();
    onDebugTest = new Signal();


    constructor(aSocket: Socket) {
        this._className = 'Client';
        this._socket = aSocket;
        this.setIdBySocket();
        this.initListeners();
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`${this._className}: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`${this._className}: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`${this._className}: ${aMsg}`, aData);
    }

    protected setIdBySocket() {
        this._connectionId = this._socket.id;
    }

    protected initListeners() {

        this._socket.on(PackTitle.startSearchGame, (aData?: {
            isFreeConnect?: boolean
            withBot?: boolean
        }) => {
            this._isWithBot = aData?.withBot;
            this._isFreeConnection = aData?.isFreeConnect;
            if (this._isFreeConnection) {
                this._walletId = '0x0';
            }
            if (this._isWithBot) {
                this.logDebug(`search game with bot request...`);
            }
            else {
                this.logDebug(`search game request...`);
            }
            // this.onStartSearchGame(client);
            this.onStartSearchGame.dispatch(this);
        });

        this._socket.on(PackTitle.stopSearchGame, () => {
            this.logDebug(`stop game searching request...`);
            this.onStopSearchGame.dispatch(this);
        });

        // this._socket.on(PackTitle.planetLaser, () => {
        //     // laser click event
        //     this.onLaser.dispatch(this);
        // });

        this._socket.on(PackTitle.skill, (aData: SkillRequest) => {
            this.onSkillRequest.dispatch(this, aData);
        });

        this._socket.on(PackTitle.exitGame, () => {
            // client click exit
            this.onExitGame.dispatch(this);
        });

        this._socket.on(PackTitle.debugTest, (aData: DebugTestData) => {
            this.onDebugTest.dispatch(this, aData);
        });

        this._socket.on(PackTitle.claimReward, (aData: ClaimRewardData) => {
            this.logDebug(`onSocket claimReward: ${aData}`);

            if (this._isSigned) {
                this.handleClaimRewardRequest(aData);
            }
            else {
                this.onSignRecv.addOnce(() => {
                    this.handleClaimRewardRequest(aData);
                }, this);
                this.signRequest();
            }
            
        });

        this._socket.on('disconnect', () => {
            // this.onDisconnect(clientId);
            this._isDisconnected = true;
            this.onDisconnect.dispatch(this);
        });

    }

    private handleClaimRewardRequest(aData: ClaimRewardData) {
        switch (aData.type) {
            case 'reward':
                // client claim reward click
                this.logDebug(`Claim Reward: RecordWinnerWithChoose call with (${this._walletId}, false)`);
                RecordWinnerWithChoose(this._walletId, false).then(() => {
                    // resolve
                    this.logDebug(`RecordWinnerWithChoose resolved`);
                    this.sendClaimRewardAccept();
                }, (aReasone: any) => {
                    // rejected
                    this.logDebug(`RecordWinnerWithChoose rejected`);
                    this.logError(`RecordWinnerWithChoose: ${aReasone}`);
                    this.sendClaimRewardReject(aData.type, aReasone);
                })
                break;

            case 'box':
                // client claim reward click
                this.logDebug(`Open Box: RecordWinnerWithChoose call with (${this._walletId}, true)`);
                RecordWinnerWithChoose(this._walletId, true).then(() => {
                    // resolve
                    this.logDebug(`RecordWinnerWithChoose resolved`);
                    this.sendClaimBoxAccept();
                }, (aReasone: any) => {
                    // rejected
                    this.logDebug(`RecordWinnerWithChoose rejected`);
                    this.logError(`RecordWinnerWithChoose: ${aReasone}`);
                    this.sendClaimRewardReject(aData.type, aReasone);
                })
                break;

            default:
                this.logWarn(`handleClaimRewardRequest: unknown aData.type = ${aData.type}`);
                break;
        }
    }

    get socket(): Socket {
        return this._socket;
    }

    get connectionId(): string {
        return this._connectionId;
    }

    get isSigned() {
        return this._isSigned;
    }

    get isSignPending() {
        return this._isSignPending;
    }

    set isSignPending(value) {
        this._isSignPending = value;
    }

    get walletId(): string {
        return this._walletId;
    }

    get isDisconnected() {
        return this._isDisconnected;
    }

    get isWithBot() {
        return this._isWithBot;
    }

    get isFreeConnection() {
        return this._isFreeConnection;
    }

    public get isBot() {
        return this._isBot;
    }

    sign(aPublicKey: string) {
        this._walletId = aPublicKey;
        this._isSigned = true;
        this.logDebug(`signed...`);
    }

    sendPack(aPackTitle: PackTitle, aData: any) {
        if (this._isDisconnected) return;
        this._socket.emit(aPackTitle, aData);
    }

    async signRequest() {
        this.sendPack(PackTitle.sign, {
            cmd: 'request'
        });
    }

    signSuccess(aWalletId: string) {
        this.sendPack(PackTitle.sign, {
            cmd: 'success',
            walletId: aWalletId
        });
        this.onSignRecv.dispatch({
            status: 'success'
        });
    }

    signReject(aMsg?: string) {
        this.sendPack(PackTitle.sign, {
            cmd: 'reject',
            message: aMsg
        });
        this.onSignRecv.dispatch({
            status: 'reject'
        });
    }

    sendStartGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: 'start'
        });
    }

    sendStopGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: 'stop'
        });
    }

    sendClaimRewardAccept() {
        let data: ClaimRewardData = {
            type: 'reward',
            action: 'accept'
        }
        this.sendPack(PackTitle.claimReward, data);
    }

    sendClaimBoxAccept() {
        let data: ClaimRewardData = {
            type: 'box',
            action: 'accept'
        }
        this.sendPack(PackTitle.claimReward, data);
    }

    sendClaimRewardReject(aRewardType: RewardType, aReasone: any) {
        let data: ClaimRewardData = {
            type: aRewardType,
            action: 'reject',
            reasone: aReasone
        }
        this.sendPack(PackTitle.claimReward, data);
    }

}