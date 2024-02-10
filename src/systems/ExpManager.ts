
const CONFIG = {
    levels: [
        { level: 1, exp: 100 },
        { level: 2, exp: 200 },
        { level: 3, exp: 400 },
        { level: 4, exp: 700 },
        { level: 5, exp: 1000 },
        { level: 6, exp: 1500 },
        { level: 7, exp: 2000 },
        { level: 8, exp: 2500 },
        { level: 9, exp: 3000 },
        { level: 10, exp: 4000 },
        { level: 11, exp: 5000 },
        { level: 12, exp: 6000 },
        { level: 13, exp: 7000 },
        { level: 14, exp: 8000 },
        { level: 15, exp: 10000 }
    ]
}

export class ExpManager {
    // current exp of players
    private _exp: Map<number, number>;

    constructor() {
        this._exp = new Map();
    }

}