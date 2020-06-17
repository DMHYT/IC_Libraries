LIBRARY({
	name: "Vector",
	version: 2,
	shared: false,
	api: "AdaptedScript"
});

class Vector3 implements Vector {
	static UP: Vector3 = new Vector3(0, 1, 0);
	static DOWN: Vector3 = new Vector3(0, -1, 0);
	x: number
	y: number
	z: number
	constructor(vx: number, vy: number, vz: number)
	constructor(vx: Vector)
	constructor(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			this.x = vx;
			this.y = vy;
			this.z = vz;
		}
		else {
			var v = vx;
			this.x = v.x;
			this.y = v.y;
			this.z = v.z;
		}
	}

	copy(dst?: Vector3): Vector3 {
		if (dst) {
			return dst.set(this);
		}
        return new Vector3(this);
    }
	
	set(vx: number, vy: number, vz: number): Vector3
	set(vx: Vector): Vector3
	set(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			this.x = vx;
			this.y = vy;
			this.z = vz;
			return this;
		}
		var v = vx;
		return this.set(v.x, v.y, v.z);
    }

    add(vx: number, vy: number, vz: number): Vector3
    add(vx: Vector): Vector3
    add(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			this.x += vx;
			this.y += vy;
			this.z += vz;
			return this;
		}
		var v = vx;
		return this.add(v.x, v.y, v.z);
    }
	
    addScaled(v: Vector, scale: number): Vector3 {
        return this.add(v.x * scale, v.y * scale, v.z * scale);
    }

    sub(vx: number, vy: number, vz: number): Vector3
    sub(vx: Vector): Vector3
    sub(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			this.x -= vx;
			this.y -= vy;
			this.z -= vz;
			return this;
		}
		var v = vx;
		return this.sub(v.x, v.y, v.z);
    }

    cross(vx: number, vy: number, vz: number): Vector3
    cross(vx: Vector): Vector3
    cross(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			return this.set(this.y * vz - this.z * vy, this.z * vx - this.x * vz, this.x * vy - this.y * vx);
		}
		var v = vx;
		return this.cross(v.x, v.y, v.z);
    }
	
	dot(vx: number, vy: number, vz: number): Vector3
	dot(vx: any): Vector3
	dot(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			return this.x * vx + this.y * vy + this.z * vz;
		}
		var v = vx;
		return this.dot(v.x, v.y, v.z);
    }

    normalize(): Vector3 {
        var len = this.length();
        this.x /= len;
        this.y /= len;
        this.z /= len;
        return this;
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    length(): number {
        return Math.sqrt(this.lengthSquared());
    }

    negate(): Vector3 {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    distanceSquared(vx: number, vy: number, vz: number): number
    distanceSquared(vx: Vector): number
    distanceSquared(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			var dx = vx - this.x;
			var dy = vy - this.y;
			var dz = vz - this.z;
			return dx * dx + dy * dy + dz * dz;
		}
		var v = vx;
		return this.distanceSquared(v.x, v.y, v.z);
    }
	
	distance(vx: number, vy: number, vz: number): number
	distance(vx: Vector): number
	distance(vx: any, vy?: number, vz?: number) {
		if (typeof(vx) == "number") {
			return Math.sqrt(this.distanceSquared(vx, vy, vz));
		}
		var v = vx;
		return this.distance(v.x, v.y, v.z);
    }
	
    scale(factor: number): Vector3 {
        this.x *= factor;
        this.y *= factor;
        this.z *= factor;
        return this;
    }

    scaleTo(len: number): Vector3 {
        var factor = len / this.length();
        return this.scale(factor);
    }

    toString() {
        return "[ " + this.x + ", " + this.y + ", " + this.z + " ]";
    }
}

EXPORT("Vector3", Vector3);