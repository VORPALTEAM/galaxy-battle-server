
export class IdGenerator {
    private _lastId = -1;

    nextId(): number {
        this._lastId += 1;
        return this._lastId;
    }

}