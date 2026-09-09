/**
 * WebOS Graphics Engine - 3D Vector, Matrix, and Quaternion Math
 */

export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  public set(x: number, y: number): this {
    this.x = x; this.y = y; return this;
  }

  public add(v: Vector2): this {
    this.x += v.x; this.y += v.y; return this;
  }

  public sub(v: Vector2): this {
    this.x -= v.x; this.y -= v.y; return this;
  }

  public scale(s: number): this {
    this.x *= s; this.y *= s; return this;
  }

  public dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  public length(): number {
    return Math.hypot(this.x, this.y);
  }

  public normalize(): this {
    const l = this.length();
    if (l > 0) {
      this.x /= l; this.y /= l;
    }
    return this;
  }

  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

export class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  public set(x: number, y: number, z: number): this {
    this.x = x; this.y = y; this.z = z; return this;
  }

  public add(v: Vector3): this {
    this.x += v.x; this.y += v.y; this.z += v.z; return this;
  }

  public sub(v: Vector3): this {
    this.x -= v.x; this.y -= v.y; this.z -= v.z; return this;
  }

  public scale(s: number): this {
    this.x *= s; this.y *= s; this.z *= s; return this;
  }

  public dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  public cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  public length(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  public normalize(): this {
    const l = this.length();
    if (l > 0) {
      this.x /= l; this.y /= l; this.z /= l;
    }
    return this;
  }

  public distanceTo(v: Vector3): number {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  public clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }
}

export class Matrix4 {
  public elements: Float32Array = new Float32Array(16);

  constructor() {
    this.identity();
  }

  public identity(): this {
    const e = this.elements;
    e.fill(0);
    e[0] = 1; e[5] = 1; e[10] = 1; e[15] = 1;
    return this;
  }

  public clone(): Matrix4 {
    const m = new Matrix4();
    m.elements.set(this.elements);
    return m;
  }

  public multiply(m: Matrix4): this {
    const ae = this.elements;
    const be = m.elements;
    const te = new Float32Array(16);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        te[i * 4 + j] =
          ae[i * 4 + 0] * be[0 * 4 + j] +
          ae[i * 4 + 1] * be[1 * 4 + j] +
          ae[i * 4 + 2] * be[2 * 4 + j] +
          ae[i * 4 + 3] * be[3 * 4 + j];
      }
    }
    this.elements.set(te);
    return this;
  }

  public makeTranslation(x: number, y: number, z: number): this {
    this.identity();
    this.elements[12] = x;
    this.elements[13] = y;
    this.elements[14] = z;
    return this;
  }

  public makePerspective(fovRad: number, aspect: number, near: number, far: number): this {
    this.identity();
    const e = this.elements;
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1 / (near - far);

    e[0] = f / aspect;
    e[5] = f;
    e[10] = (far + near) * nf;
    e[11] = -1;
    e[14] = (2 * far * near) * nf;
    e[15] = 0;
    return this;
  }

  public makeLookAt(eye: Vector3, target: Vector3, up: Vector3): this {
    const z = eye.clone().sub(target).normalize();
    const x = up.cross(z).normalize();
    const y = z.cross(x).normalize();

    const e = this.elements;
    e[0] = x.x; e[4] = x.y; e[8] = x.z; e[12] = -x.dot(eye);
    e[1] = y.x; e[5] = y.y; e[9] = y.z; e[13] = -y.dot(eye);
    e[2] = z.x; e[6] = z.y; e[10] = z.z; e[14] = -z.dot(eye);
    e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
    return this;
  }
}

export class Quaternion {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0, public w: number = 1) {}

  public identity(): this {
    this.x = 0; this.y = 0; this.z = 0; this.w = 1; return this;
  }

  public setFromAxisAngle(axis: Vector3, angleRad: number): this {
    const half = angleRad / 2;
    const s = Math.sin(half);
    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(half);
    return this;
  }
}
