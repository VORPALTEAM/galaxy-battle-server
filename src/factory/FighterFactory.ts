import { ShipFactory } from "./ShipFactory.js";

export class FighterFactory extends ShipFactory {

    constructor() {
        super();
        this._shipType = 'fighter';
    }

}