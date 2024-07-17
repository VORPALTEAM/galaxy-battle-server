import * as THREE from 'three';
import { FieldCell } from "./FieldCell.js";
import { LogMng } from '../../monax/LogMng.js';
import { ILogger } from '../../interfaces/ILogger.js';

export type FieldParams = {
    size: {
        cols: number,
        rows: number,
        sectorWidth: number,
        sectorHeight: number
    }
}

type ObjectCellData = {
    cx: number,
    cy: number,
    cell: FieldCell
}

export class Field implements ILogger {
    private _params: FieldParams;
    private _field: Map<string, FieldCell>;
    private _objectCells: Map<number, ObjectCellData>;

    constructor(aParams: FieldParams) {
        this._params = aParams;
        this.initField();
        this._objectCells = new Map();
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`Field: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`Field: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`Field: ${aMsg}`, aData);
    }

    private getCellKey(x: number, y: number): string {
        return `${x}_${y}`;
    }

    private createCell(x: number, y: number) {
        const key = this.getCellKey(x, y);
        const cell = new FieldCell({ x: x, y: y, w: this._params.size.sectorWidth, h: this._params.size.sectorHeight });
        this._field.set(key, cell);
    }

    private initField() {
        this._field = new Map();
        for (let x = 0; x < this._params.size.cols; x++) {
            for (let y = 0; y < this._params.size.rows; y++) {
                this.createCell(x, y);
            }
        }
    }

    private getCell(x: number, y: number): FieldCell | undefined {
        const key = this.getCellKey(x, y);
        return this._field.get(key);
    }

    getNeighbors(aCellPos: { x: number, y: number }, aOnlyFree = false): FieldCell[] {
        const x = aCellPos.x;
        const y = aCellPos.y;
        const neighbors: FieldCell[] = [];
        const isEvenRow = y % 2 === 0;

        if (isEvenRow) {
            // left right
            neighbors.push(this.getCell(x - 1, y));
            neighbors.push(this.getCell(x + 1, y));
            // top
            neighbors.push(this.getCell(x - 1, y - 1));
            neighbors.push(this.getCell(x, y - 1));
            // bot
            neighbors.push(this.getCell(x - 1, y + 1));
            neighbors.push(this.getCell(x, y + 1));
        }
        else {
            // left right
            neighbors.push(this.getCell(x - 1, y));
            neighbors.push(this.getCell(x + 1, y));
            // top
            neighbors.push(this.getCell(x, y - 1));
            neighbors.push(this.getCell(x + 1, y - 1));
            // bot
            neighbors.push(this.getCell(x, y + 1));
            neighbors.push(this.getCell(x + 1, y + 1));
        }

        // remove undefined
        return neighbors.filter((neighbor) => {
            let res = aOnlyFree ?
                neighbor !== undefined && !neighbor.isTaken :
                neighbor !== undefined;
            return res;
        });
    }

    findPath(startX: number, startY: number, targetX: number, targetY: number): FieldCell[] | null {
        const startCell = this.getCell(startX, startY);
        const targetCell = this.getCell(targetX, targetY);

        if (!startCell || !targetCell) {
            return null;
        }

        const openList: FieldCell[] = []; // List for open cells
        const closedList: Set<FieldCell> = new Set(); // Set for closed cells

        openList.push(startCell);

        while (openList.length > 0) {
            let currentNode = openList[0];
            let currentIndex = 0;

            // Find the cell with the smallest cost f in openList
            openList.forEach((cell, index) => {
                if (cell.pathFinding.f < currentNode.pathFinding.f) {
                    currentNode = cell;
                    currentIndex = index;
                }
            });

            // remove current cell from openList and add to closedList
            openList.splice(currentIndex, 1);
            closedList.add(currentNode);

            // If we reach the target cell, we return the path
            if (currentNode === targetCell) {
                const path = [];
                let current = currentNode;
                while (current !== startCell) {
                    path.push(current);
                    current = current.pathFinding.parent;
                }
                return path.reverse();
            }

            // get all neighbors for this cell
            const neighbors = this.getNeighbors(currentNode);

            neighbors.forEach((neighbor) => {
                if (closedList.has(neighbor) || !neighbor || neighbor.isTaken) {
                    return;
                }

                const gScore = currentNode.pathFinding.g + 1; // temporary gScore

                // If the neighbor is not in openList, add it there
                if (!openList.includes(neighbor)) {
                    openList.push(neighbor);
                }
                else if (gScore >= neighbor.pathFinding.g) {
                    return;
                }

                neighbor.pathFinding.g = gScore;
                neighbor.pathFinding.h = this.heuristic(neighbor, targetCell);
                neighbor.pathFinding.f = neighbor.pathFinding.g + neighbor.h;
                neighbor.pathFinding.parent = currentNode;
            });
        }

        return null; // path not found
    }

    private heuristic(start: { x: number, y: number }, end: { x: number, y: number }): number {
        // heuristic: distance between 2 points
        const p1 = this.cellPosToGlobalVec3(start);
        const p2 = this.cellPosToGlobalVec3(end);
        return p1.distanceTo(p2);
    }

    getCreateData(): FieldParams {
        return {
            size: this._params.size
        }
    }

    cellPosToGlobal(cell: { x: number, y: number }): { x: number, y: number } {
        const isEvenRow = cell.y % 2 === 0;
        let c = {
            x: cell.x * this._params.size.sectorWidth,
            y: cell.y * this._params.size.sectorHeight
        }
        if (!isEvenRow) c.x += this._params.size.sectorWidth / 2;
        return c;
    }

    cellPosToGlobalVec3(cell: { x: number, y: number }): THREE.Vector3 {
        const isEvenRow = cell.y % 2 === 0;
        let v3 = new THREE.Vector3(
            cell.x * this._params.size.sectorWidth,
            0,
            cell.y * this._params.size.sectorHeight
        );
        if (!isEvenRow) v3.x += this._params.size.sectorWidth / 2;
        return v3;
    }

    globalToCellPos(x: number, y: number): { x: number, y: number } {
        const sw = this._params.size.sectorWidth;
        const sh = this._params.size.sectorHeight;
        let c = {
            x: Math.trunc(x / sw),
            y: Math.trunc(y / sh)
        }
        const isEvenRow = c.y % 2 === 0;
        if (!isEvenRow) c.x = Math.trunc((x - sw / 2) / sw);
        return c;
    }

    globalVec3ToCellPos(aVec3: THREE.Vector3): { x: number, y: number } {
        const x = aVec3.x;
        const y = aVec3.z;
        const sw = this._params.size.sectorWidth;
        const sh = this._params.size.sectorHeight;
        let c = {
            x: Math.trunc(x / sw),
            y: Math.trunc(y / sh)
        }
        const isEvenRow = c.y % 2 === 0;
        if (!isEvenRow) c.x = Math.trunc((x - sw / 2) / sw);
        return c;
    }

    isPosOnCell(aPosition: THREE.Vector3, aCell: { x: number, y: number }): boolean {
        let cp = this.globalVec3ToCellPos(aPosition);
        return cp.x == aCell.x && cp.y == aCell.y;
    }

    isCellTaken(aCell: { x: number, y: number }): boolean {
        let cell = this.getCell(aCell.x, aCell.y);
        if (!cell) return false;
        return cell.isTaken;
    }

    // takeCell(cx: number, cy: number) {
    //     let cell = this.getCell(cx, cy);
    //     if (cell) {
    //         cell.isTaken = true;
    //     }
    //     else {
    //         this.logWarn(`takeCell !cell for (${cx}, ${cy})`);
    //     }
    // }

    // takeOffCell(aCellPos: { x: number, y: number }) {
    //     let cell = this.getCell(aCellPos.x, aCellPos.y);
    //     if (cell) {
    //         cell.isTaken = false;
    //     }
    //     else {
    //         this.logWarn(`takeOffCell !cell for (${aCellPos.x}, ${aCellPos.y})`);
    //     }
    // }

    takeCellByObject(aObjectId: number, pos: { x: number, y: number }) {
        let oldCell = this._objectCells.get(aObjectId);
        if (oldCell && oldCell.cell) {
            oldCell.cell.isTaken = false;
        }
        let newCell = this.getCell(pos.x, pos.y);
        if (newCell) {
            newCell.isTaken = true;
            this._objectCells.set(aObjectId, {
                cx: pos.x,
                cy: pos.y,
                cell: newCell
            });
        }
        else {
            this.logWarn(`takeCellByObject !cell for (${pos.x}, ${pos.y})`);
        }
    }

    takeOffCellByObject(aObjectId: number) {
        let cell = this._objectCells.get(aObjectId);
        this._objectCells.delete(aObjectId);
        if (cell && cell.cell) {
            cell.cell.isTaken = false;
        }
        else {
            this.logWarn(`takeOffCellByObject !cell for objId=${aObjectId}`);
        }
    }

    free() {
        this._params = null;
        this._field.clear();
        this._field = null;
    }
    
}