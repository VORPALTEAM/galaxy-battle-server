
const DEBUG = 'DEBUG';
const INFO = 'INFO';
const NETWORK = 'NETWORK';
const WARNING = 'WARNING';
const ERROR = 'ERROR';

export class LogMng {
    static readonly MODE_DEBUG = 'MODE_DEBUG';
    static readonly MODE_RELEASE = 'MODE_RELEASE';

    // current mode
    static mode = LogMng.MODE_DEBUG;
    // available levels
    static levels = [DEBUG, INFO, NETWORK, WARNING, ERROR];

    public static setMode(aMode: string) {
        LogMng.mode = aMode;
        switch (LogMng.mode) {
            case LogMng.MODE_DEBUG:
                LogMng.levels = [DEBUG, INFO, NETWORK, WARNING, ERROR];
                break;
            case LogMng.MODE_RELEASE:
                LogMng.levels = [WARNING, ERROR];
                break;
        }
    }

    public static getMode(): string {
        return this.mode;
    }

    private static getLink(color: string): string {
        return 'background: ' + color + ';' +
            'background-repeat: no-repeat;' +
            'font-size: 12px;' +
            'color: #446d96;' +
            'line-height: 14px';
    };

    private static log(aMsg: any, aLevel: string = DEBUG, aData?: any): boolean {
        console.log("Logmng log called");
        if (LogMng.levels.indexOf(aLevel) < 0) return false;
        const str = `${aLevel}: ${aMsg}`;
        aData ?
            console.log(str, aData) :
            console.log(str);
        
        return true;

    };

    public static system(aMsg: any, aLink: string = '') {
        console.log(`system: `, aMsg);
    }

    public static debug(aMsg: any, aData?: any): boolean {
        console.log("Logmng debug called");
        return LogMng.log(aMsg, DEBUG, aData);
    }

    public static info(aMsg: any, aData?: any): boolean {
        return LogMng.log(aMsg, INFO, aData);
    }

    public static net(aMsg: any, aData?: any): boolean {
        return LogMng.log(aMsg, NETWORK, aData);
    }

    public static warn(aMsg: any, aData?: any): boolean {
        return LogMng.log(aMsg, WARNING, aData);
    }

    public static error(aMsg: any, aData?: any): boolean {
        return LogMng.log(aMsg, ERROR, aData);
    }

}