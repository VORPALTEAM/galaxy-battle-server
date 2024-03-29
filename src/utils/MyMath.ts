﻿import { InterpolationUtils } from "./InterpolateUtils.js";

export class Vec2 {

    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static getVec2(x = 0, y = 0): Vec2 {
        return new Vec2(x, y);
    }

    public get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public distanceTo(x: number, y: number): number {
        let dx = x - this.x;
        let dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

};

export class Vec3 {

    x: number;
    y: number;
    z: number;

    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static getVec3(x = 0, y = 0, z = 0): Vec3 {
        return new Vec3(x, y, z);
    }

    public get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    public distanceTo(x: number, y: number, z: number): number {
        let dx = x - this.x;
        let dy = y - this.y;
        let dz = z - this.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

};

export class RectABCD {
    a: Vec2;
    b: Vec2;
    c: Vec2;
    d: Vec2;
    constructor(a: Vec2, b: Vec2, c: Vec2, d: Vec2) {
        this.a = a; this.b = b; this.c = c; this.d = d;
    }
}

export class MyMath {

    public static randomInRange(min: number, max: number): number {
        if (min > max) throw new Error("MyMath.randomInRange(): Min > Max!");
        return Math.random() * Math.abs(max - min) + min;
    }

    public static randomIntInRange(min: number, max: number): number {
        if (min > max) throw new Error("MyMath.randomIntInRange(): Min > Max!");
        return Math.round(MyMath.randomInRange(min, max));
    }

    /**
     * Return -1 or 1 randomly
     */
    public static randomSign(): number {
        let res = this.randomInRange(-10, 10) < 0 ? -1 : 1;
        return res;
    }

    public static shuffleArray(mas: any[], factor = 2) {
        for (let i = 0; i < mas.length * factor; i++) {
            const id1 = this.randomIntInRange(0, mas.length - 1);
            const id2 = this.randomIntInRange(0, mas.length - 1);
            let item = mas[id1];
            mas[id1] = mas[id2];
            mas[id2] = item;
        }
    }

    /**
     * Function restricts a given value between an upper and lower bound.
     * @param x - target value
     * @param min - minimum value
     * @param max - maximum value
     * @returns Cutted value between [min..max]
     */
    public static clamp(x, min, max): number {
        return Math.min(Math.max(x, min), max);
    }

    /**
     * Saturation
     * @param x - Target value
     * @returns Cutted value between [0..1]
     */
    public static sat(x: number): number {
        return this.clamp(x, 0, 1);
    }

    /**
     * Re-maps a number from one range to another.
     * Example: map(25, 0, 100, 0, 1000) = 250 the number 25 is converted from a value in the range of 0 to 100 into a value that ranges from the left edge of the window (0) to the right edge (width).
     * @param value - value
     * @param min1 
     * @param max1 
     * @param min2 
     * @param max2 
     */
    public static map(value: number, min1: number, max1: number, min2: number, max2: number): number {
        let p = (value - min1) / (max1 - min1);
        return p * (max2 - min2);
    }

    /**
     * Liener Interpolated value
     * @param a - Start value
     * @param b - Finish value
     * @param t - Time in [0..1]
     * @returns Value by time
     */
    public static lerp(a: number, b: number, t: number): number {
        return InterpolationUtils.linear(a, b, t);
    }

    /**
     * Normal percent of value in range
     * example: v = 140, a = 100, b = 200, result = 0.4 (40%)
     */
    public static percentInRange(value: number, a: number, b: number): number {
        return (value - a) / (b - a);
    }

    /**
     * Degrees to Radians
     * @param deg - Angle in degrees
     * @returns Angle in radians
     */
    public static toRadian(deg: number): number {
        return deg * Math.PI / 180;
    }

    /**
     * Radians to Degrees
     * @param rad - Angle in radians
     * @returns Angle in degrees
     */
    public static toDeg(rad: number): number {
        return rad * 180 / Math.PI;
    }

    public static getVec2Length(x1: number, y1: number, x2: number, y2: number): number {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public static getVec3Length(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
        let dx = x2 - x1;
        let dy = y2 - y1;
        let dz = z2 - z1;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    public static normalizeVector(v: { x: number, y: number }): { x: number, y: number } {
        const length = this.getVec2Length(0, 0, v.x, v.y);
        return { x: v.x / length, y: v.y / length };
    }

    public static distanceBetween(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Convert angle to Vec2
     * @param aAngle angle in radians
     * @returns 
     */
    public static angleToVec2(aAngle: number): Vec2 {
        return new Vec2(Math.cos(aAngle), Math.sin(aAngle));
    }

    /**
     * Find the angle between 2 vectors (x1, y1) -> (x2, y2) via Math.atan2 function.
     * @param p1 - The first point.
     * @param p2 - The second point.
     * @return The angle in radians.
     */
    // public static angleBetweenATan(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
    //     return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    // }
    
    /**
     * Angle between 2 vectors (x1, y1) -> (x2, y2) via Math.acos function.
     * @param p1 - The first point.
     * @param p2 - The second point.
     * @return The angle in radians.
     */
    public static angleBetweenACos(p1: { x: number, y: number }, p2: { x: number, y: number }) {
        let scalar = p1.x * p2.x + p1.y * p2.y;
        let len1 = Math.sqrt(p1.x ** 2 + p1.y ** 2);
        let len2 = Math.sqrt(p2.x ** 2 + p2.y ** 2);
        return Math.acos(scalar / (len1 * len2));
    };

    /**
     * Angle between 2 vectors (x1, y1) -> (x2, y2) via Math.asin function.
     * @param p1 - The first point.
     * @param p2 - The second point.
     * @return The angle in radians.
     */
    public static angleBetweenASin(p1: { x: number, y: number }, p2: { x: number, y: number }) {
        let scalar = p1.x * p2.x + p1.y * p2.y;
        let len1 = Math.sqrt(p1.x ** 2 + p1.y ** 2);
        let len2 = Math.sqrt(p2.x ** 2 + p2.y ** 2);
        return Math.asin(scalar / (len1 * len2));
    };

    public static angleBetweenVectors(v1: { x: number, y: number }, v2: { x: number, y: number }): number {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const det = v1.x * v2.y - v1.y * v2.x;
        const angle = Math.atan2(det, dot);
        return angle;
    }

    public static isPointInTriangle(ax, ay, bx, by, cx, cy, px, py: number): boolean {
        let b0x, b0y, c0x, c0y, p0x, p0y: number;
        let m, l: number;
        let res = false;
        // move triangle А point to (0;0)
        b0x = bx - ax; b0y = by - ay;
        c0x = cx - ax; c0y = cy - ay;
        p0x = px - ax; p0y = py - ay;
        //
        m = (p0x * b0y - b0x * p0y) / (c0x * b0y - b0x * c0y);
        if (m >= 0 && m <= 1) {
            l = (p0x - m * c0x) / b0x;
            if (l >= 0 && (m + l) <= 1)
                res = true;
        }
        return res;
    }

    public static isPointInRect(rect: RectABCD, p: Vec2): boolean {
        return MyMath.isPointInTriangle(rect.a.x, rect.a.y, rect.b.x, rect.b.y, rect.c.x, rect.c.y, p.x, p.y) &&
            MyMath.isPointInTriangle(rect.c.x, rect.c.y, rect.d.x, rect.d.y, rect.a.x, rect.a.y, p.x, p.y);
    }

    public static isPointInCircle(x: number, y: number, cx: number, cy: number, r: number): boolean {
        return MyMath.getVec2Length(x, y, cx, cy) <= r;
    }

    public static isCirclesIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        return MyMath.getVec2Length(x1, y1, x2, y2) <= r1 + r2;
    }

    /**
     * Calculates the factorial of a given number for integer values greater than 0.
     * @param aValue - A positive integer to calculate the factorial of.
     * @return The factorial of the given number.
     */
    public static factorial(aValue: number): number {
        if (aValue === 0) return 1;
        let res = aValue;
        while (--aValue) res *= aValue;
        return res;
    };


}
