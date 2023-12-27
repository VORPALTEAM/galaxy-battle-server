
export class FieldCell {
    private _x: number;
    private _y: number;
    private _w: number;
    private _h: number;

    pathFinding = {
        g: 0,
        h: 0,
        f: 0,
        parent: null
    }
    
    isTaken = false;

    constructor(aParams: {
        x: number,
        y: number,
        w: number,
        h: number
    }) {
        this._x = aParams.x;
        this._y = aParams.y;
        this._w = aParams.w;
        this._h = aParams.h;
    }

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public get w(): number {
        return this._w;
    }
    
    public get h(): number {
        return this._h;
    }

}