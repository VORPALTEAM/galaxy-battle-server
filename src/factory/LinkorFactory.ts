import { ShipFactory } from "./ShipFactory.js";

export class LinkorFactory extends ShipFactory {

    constructor() {
        super();
        this._shipType = 'linkor';
    }

}