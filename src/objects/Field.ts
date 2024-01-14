import * as THREE from 'three';
import { FieldCell } from "./FieldCell.js";
import { LogMng } from '../utils/LogMng.js';
import { ILogger } from '../interfaces/ILogger.js';

export type FieldParams = {
    size: {
        cols: number,
        rows: number,
        sectorWidth: number,
        sectorHeight: number
    }
}

export class Field implements ILogger {
    private _params: FieldParams;
    private _field: Map<string, any>;

    constructor(aParams: FieldParams) {
        this._params = aParams;
        this.createField();
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

    private createField() {
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

        const openList: FieldCell[] = []; // Список для открытых ячеек
        const closedList: Set<FieldCell> = new Set(); // Множество для закрытых ячеек

        openList.push(startCell);

        while (openList.length > 0) {
            let currentNode = openList[0];
            let currentIndex = 0;

            // Находим ячейку с наименьшей стоимостью f в openList
            openList.forEach((cell, index) => {
                if (cell.pathFinding.f < currentNode.pathFinding.f) {
                    currentNode = cell;
                    currentIndex = index;
                }
            });

            // Удаляем текущую ячейку из openList и добавляем в closedList
            openList.splice(currentIndex, 1);
            closedList.add(currentNode);

            // Если достигли целевой ячейки - возвращаем путь
            if (currentNode === targetCell) {
                const path = [];
                let current = currentNode;
                while (current !== startCell) {
                    path.push(current);
                    current = current.pathFinding.parent;
                }
                return path.reverse();
            }

            // Получаем всех соседей текущей ячейки
            const neighbors = this.getNeighbors(currentNode);

            neighbors.forEach((neighbor) => {
                if (closedList.has(neighbor) || !neighbor || neighbor.isTaken) {
                    return;
                }

                const gScore = currentNode.pathFinding.g + 1; // Временное gScore

                // Если сосед не входит в openList, добавляем его туда
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
        // Эвристика: расстояние между точками по прямой
        const p1 = this.cellPosToGlobalVec3(start.x, start.y);
        const p2 = this.cellPosToGlobalVec3(end.x, end.y);
        return p1.distanceTo(p2);
    }

    getCreateData(): FieldParams {
        return {
            size: this._params.size
        }
    }

    cellPosToGlobal(cx: number, cy: number): { x: number, y: number } {
        const isEvenRow = cy % 2 === 0;
        let c = {
            x: cx * this._params.size.sectorWidth,
            y: cy * this._params.size.sectorHeight
        }
        if (!isEvenRow) c.x += this._params.size.sectorWidth / 2;
        return c;
    }

    cellPosToGlobalVec3(cx: number, cy: number): THREE.Vector3 {
        const isEvenRow = cy % 2 === 0;
        let v3 = new THREE.Vector3(
            cx * this._params.size.sectorWidth,
            0,
            cy * this._params.size.sectorHeight
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

    isCellTaken(aCell: { x: number, y: number }): boolean {
        let cell = this.getCell(aCell.x, aCell.y);
        if (!cell) return false;
        return cell.isTaken;
    }

    takeCell(cx: number, cy: number) {
        let cell = this.getCell(cx, cy);
        if (cell) {
            cell.isTaken = true;
        }
        else {
            this.logWarn(`takeCell !cell for (${cx}, ${cy})`);
        }
    }

    takeOffCell(aCellPos: { x: number, y: number }) {
        let cell = this.getCell(aCellPos.x, aCellPos.y);
        if (cell) {
            cell.isTaken = false;
        }
        else {
            this.logWarn(`takeOffCell !cell for (${aCellPos.x}, ${aCellPos.y})`);
        }
    }

    free() {
        this._params = null;
        this._field.clear();
        this._field = null;
    }
    
}