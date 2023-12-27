import { FieldCell } from "./FieldCell.js";

export type FieldParams = {
    size: {
        cols: number,
        rows: number,
        sectorWidth: number,
        sectorHeight: number
    }
}

export class Field {
    private _params: FieldParams;
    private _field: Map<string, any>;

    constructor(aParams: FieldParams) {
        this._params = aParams;
        this.createField();
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

    private getNeighbors(x: number, y: number): FieldCell[] {
        const neighbors: any[] = [];
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
        return neighbors.filter((neighbor) => neighbor !== undefined);
    }

    findPath(startX: number, startY: number, targetX: number, targetY: number): any[] | null {
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
            const neighbors = this.getNeighbors(currentNode.x, currentNode.y);

            neighbors.forEach((neighbor) => {
                if (closedList.has(neighbor) || !neighbor) {
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

        return null; // Путь не найден
    }

    private heuristic(start: { x, y }, end: { x, y }): number {
        // Эвристика: расстояние между точками по прямой (эвклидово расстояние)
        const dx = Math.abs(start.x - end.x);
        const dy = Math.abs(start.y - end.y);
        return Math.sqrt(dx * dx + dy * dy);
    }

    getCreateData(): FieldParams {
        return {
            size: this._params.size
        }
    }

    cellPosToCoordinates(cx: number, cy: number): { x, y } {
        const isEvenRow = cy % 2 === 0;
        let c = {
            x: cx * this._params.size.sectorWidth,
            y: cy * this._params.size.sectorHeight
        }
        if (!isEvenRow) c.x += this._params.size.sectorWidth / 2;
        return c;
    }

    coordinatesToCellPos(x: number, y: number): { x, y } {
        let c = {
            x: Math.trunc(x / this._params.size.sectorWidth),
            y: Math.trunc(y / this._params.size.sectorHeight)
        }
        const isEvenRow = y % 2 === 0;
        if (!isEvenRow) c.x = Math.trunc((x - this._params.size.sectorWidth / 2) / this._params.size.sectorWidth);
        return c;
    }

    isCellTaken(cx: number, cy: number): boolean {
        let cell = this.getCell(cx, cy);
        return !cell.isTaken;
    }

    takeCell(cx: number, cy: number) {
        let cell = this.getCell(cx, cy);
        if (cell) cell.isTaken = true;
    }

    freeCell(cx: number, cy: number) {
        let cell = this.getCell(cx, cy);
        if (cell) cell.isTaken = false;
    }


}