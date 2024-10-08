import { Socket } from "socket.io";
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { ClaimRewardData, DebugTestData, AcceptScreenData, PackTitle, PlanetLaserSkin,
    RewardType, SkillRequest, SearchGameData, DuelInfo,
    SignData,
    PlayerData,
    EmotionData,
    TGAuthData,
    ShopData,
} from "../data/Types.js";
import { Signal } from "../../monax/events/Signal.js";
import { RecordWinnerWithChoose } from "../../blockchain/boxes/boxes.js";
import { GameClientData } from "./clientData/GameClientData.js";
import { PackSender } from "../services/PackSender.js";
import { TGInitData } from "../data/TGTypes.js";

export class Client implements ILogger {
    protected _className: string;
    protected _socket: Socket;
    protected _connectionId: string;
    // protected _walletId: string;

    // player data
    private _gameData: GameClientData;
    
    // data
    private _laserSkin: PlanetLaserSkin;

    // flags
    protected _isSigned = false;
    protected _isSignPending = false;
    protected _isDisconnected = false;
    private _isWithBot = false;
    protected _isBot = false;
    protected _isFreeConnection = false;
    private _isDuelCreator = false;

    onSignRecv = new Signal();
    onStartSearchGame = new Signal();
    onStopSearchGame = new Signal();
    /**
     * Battle Scene loaded on client
     */
    onSceneLoaded = new Signal();
    onSkillRequest = new Signal();
    onShop = new Signal();
    onEmotion = new Signal();
    onExitGame = new Signal();
    onDisconnect = new Signal();
    onDebugTest = new Signal();

    onAcceptScreenPack = new Signal();
    onDuelPack = new Signal();

    constructor(aSocket: Socket) {
        this._className = "Client";
        this._socket = aSocket;
        this._laserSkin = "blue";
        this._gameData = new GameClientData();
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
        this._socket.on(PackTitle.startSearchGame, (aData?: SearchGameData) => {
            this._isWithBot = aData?.withBot;
            // this._isDuelMode = aData?.isChallenge;
            this._isFreeConnection = aData?.isFreeConnect;
            if (this._isFreeConnection) {
                // this._walletId = "0x0";
                this._gameData.walletId = "0x0";
            }
            if (this._isWithBot) {
                this.logDebug(`search game with bot request...`);
            } else {
                this.logDebug(`search game request...`);
            }

            // if (this._isDuelMode) {
            //     switch (aData.duelCmd) {
            //         case "create":
            //             this.logDebug(`challenge create game request...`);
            //             // this.onCreateChallengeGame.dispatch(this);
            //             // this._isDuelCreator = true;
            //             // this._duelId = MyMath.randomIntInRange(
            //             //     1,
            //             //     Number.MAX_SAFE_INTEGER
            //             // );
            //             // send code to client
            //             // this.sendDuelNumber(String(this._duelId));
            //             break;
            //         case "connect":
            //             this.logDebug(`challenge connect game request...`);
            //             // this._duelId = aData.duelNumber;
            //             // this.onConnectChallengeGame.dispatch(this);
            //             break;
            //     }
            // }

            this.onStartSearchGame.dispatch(this);
        });

        this._socket.on(PackTitle.stopSearchGame, () => {
            this.logDebug(`stop game searching request...`);
            this.onStopSearchGame.dispatch(this);
        });

        this._socket.on(PackTitle.battleSceneLoaded, () => {
            this.logDebug(`game scene loaded...`);
            this.onSceneLoaded.dispatch(this);
        });

        this._socket.on(PackTitle.skill, (aData: SkillRequest) => {
            this.onSkillRequest.dispatch(this, aData);
        });

        this._socket.on(PackTitle.shop, (aData: ShopData) => {
            this.onShop.dispatch(this, aData);
        });

        this._socket.on(PackTitle.emotion, (aData: EmotionData) => {
            this.onEmotion.dispatch(this, aData);
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
            } else {
                this.onSignRecv.addOnce(() => {
                    this.handleClaimRewardRequest(aData);
                }, this);
                this.sendSignRequest();
            }
        });

        this._socket.on(PackTitle.battleConfirmation, (aData: AcceptScreenData) => {
            this.logDebug(`onSocket battleConfirmation: ${aData}`);
            this.onAcceptScreenPack.dispatch(this, aData);
        });

        this._socket.on(PackTitle.duel, (aData: DuelInfo) => {
            this.logDebug(`onSocket duel: ${aData}`);
            this.onDuelPack.dispatch(this, aData);
        });

        this._socket.on("disconnect", () => {
            // this.onDisconnect(clientId);
            this._isDisconnected = true;
            this.onDisconnect.dispatch(this);
        });
    }

    private handleClaimRewardRequest(aData: ClaimRewardData) {
        
        let key = this._gameData.id;
        
        switch (aData.type) {
            
            case "reward":
                // client claim reward click
                this.logDebug(
                    `Claim Reward: RecordWinnerWithChoose call with (${key}, false)`
                );

                try {
                    console.log("Record winner: ", key)
                    RecordWinnerWithChoose(key, false).then(
                        () => {
                            // resolve
                            this.logDebug(`RecordWinnerWithChoose resolved`);
                            this.sendClaimRewardAccept();
                        },
                        (aReasone: any) => {
                            // rejected
                            this.logDebug(`RecordWinnerWithChoose rejected`);
                            this.logError(`RecordWinnerWithChoose: ${aReasone}`);
                            this.sendClaimRewardReject(aData.type, aReasone);
                        }
                    );

                } catch (error) {

                    this.sendClaimRewardReject(aData.type, error);
                    PackSender.getInstance().message([this], {
                        msg: `RecordWinnerWithChoose ERROR: ${error}`,
                        showType: 'popup'
                    });

                }
                
                break;

            case "box":
                // client claim reward click
                this.logDebug(
                    `Open Box: RecordWinnerWithChoose call with (${key}, true)`
                );

                try {

                    RecordWinnerWithChoose(key, true).then(
                        () => {
                            // resolve
                            this.logDebug(`RecordWinnerWithChoose resolved`);
                            this.sendClaimBoxAccept();
                        },
                        (aReasone: any) => {
                            // rejected
                            this.logDebug(`RecordWinnerWithChoose rejected`);
                            this.logError(`RecordWinnerWithChoose: ${aReasone}`);
                            this.sendClaimRewardReject(aData.type, aReasone);
                        }
                    );

                } catch (error) {

                    this.sendClaimRewardReject(aData.type, error);
                    PackSender.getInstance().message([this], {
                        msg: `RecordWinnerWithChoose ERROR: ${error}`,
                        showType: 'popup'
                    });

                }
                
                break;

            default:
                this.logWarn(
                    `handleClaimRewardRequest: unknown aData.type = ${aData.type}`
                );
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

    // get walletId(): string {
    //     return this._walletId;
    // }

    get gameData(): GameClientData {
        return this._gameData;
    }

    protected get starName(): string {
        return this._gameData.starName;
    }

    get isDisconnected() {
        return this._isDisconnected;
    }

    // get isDuelMode() {
    //     return this._isDuelMode;
    // }

    // get duelId() {
    //     return this._duelId;
    // }

    get isDuelCreator() {
        return this._isDuelCreator;
    }

    get isWithBot() {
        return this._isWithBot;
    }

    get isFreeConnection() {
        return this._isFreeConnection;
    }

    get isBot() {
        return this._isBot;
    }

    get laserSkin(): PlanetLaserSkin {
        return this._laserSkin;
    }
    set laserSkin(value: PlanetLaserSkin) {
        this._laserSkin = value;
    }

    sign(params: {
        walletId?: string,
        tgInitStr?: string,
        tgAuthData?: TGAuthData
    }) {
        this.logDebug(`sign params:`, params);
        this._gameData.walletId = params.walletId;
        this._gameData.setTgInitData(params.tgInitStr);
        this._gameData.tgAuthData = params.tgAuthData;
        this._isSigned = true;
    }

    sendPack(aPackTitle: PackTitle, aData: any) {
        if (this._isDisconnected) return;
        this._socket.emit(aPackTitle, aData);
    }

    async sendSignRequest() {
        let data: SignData = {
            fromServer: 'request'
        }
        this.sendPack(PackTitle.sign, data);
    }

    onSignSuccess(aWalletId: string) {
        let data: SignData = {
            fromServer: 'success',
            walletId: aWalletId
        }
        this.sendPack(PackTitle.sign, data);
        this.onSignRecv.dispatch({
            status: 'success'
        });
    }

    onSignReject(aMsg?: string) {
        let data: SignData = {
            fromServer: 'reject',
            message: aMsg
        }
        this.sendPack(PackTitle.sign, data);
        this.onSignRecv.dispatch({
            status: "reject",
        });
    }

    sendStartGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: "start",
        });
    }

    sendStopGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: "stop",
        });
    }

    sendClaimRewardAccept() {
        let data: ClaimRewardData = {
            type: "reward",
            action: "accept",
        };
        this.sendPack(PackTitle.claimReward, data);
    }

    sendClaimBoxAccept() {
        let data: ClaimRewardData = {
            type: "box",
            action: "accept",
        };
        this.sendPack(PackTitle.claimReward, data);
    }

    sendClaimRewardReject(aRewardType: RewardType, aReasone: any) {
        let data: ClaimRewardData = {
            type: aRewardType,
            action: "reject",
            reasone: aReasone,
        };
        this.sendPack(PackTitle.claimReward, data);
    }

    sendAcceptScreenStart(aTimer: number) {
        let data: AcceptScreenData = {
            action: "start",
            timer: aTimer
        };
        this.sendPack(PackTitle.battleConfirmation, data);
    }

    sendAcceptScreenLoading() {
        let data: AcceptScreenData = {
            action: 'loading'
        }
        this.sendPack(PackTitle.battleConfirmation, data);
    }

    // sendDuelNumber(aNum: number) {
    //     let data: DuelInfo = {
    //         cmd: 'number',
    //         challengeNumber: aNum,
    //     };
    //     this.sendPack(PackTitle.duel, data);
    // }

    sendDuelFound(aNumber: string, aEnemyNick: string) {
        let data: DuelInfo = {
            cmd: 'found',
            duelId: aNumber,
            enemyNick: aEnemyNick
        };
        this.sendPack(PackTitle.duel, data);
    }

    sendDuelNotFound() {
        let data: DuelInfo = {
            cmd: 'notFound',
        };
        this.sendPack(PackTitle.duel, data);
    }

    sendDuelCancel() {
        let data: DuelInfo = {
            cmd: 'cancel',
        };
        this.sendPack(PackTitle.duel, data);
    }

    setPlayerData(aData: {
        starName?: string
    }) {
        if (aData.starName) this._gameData.starName = aData.starName;
    }

    getPlayerData(): PlayerData {
        let isTg = this._gameData.isTg;
        return {
            name: this._gameData.nick,
            isNick: isTg,
            displayNick: this._gameData.nick,
            starName: this.starName,
            race: this._gameData.race
        }
    }

}
