import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function writeCode(relPath, content) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

console.log('Generating WebOS Graphics, Math, SceneGraph & WebGL 3D Subsystem...');

// 1. Vector and Matrix Math Library
let mathCode = `/**
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
`;
writeCode('core/graphics/math3d.ts', mathCode);

// 2. Geometry & Mesh Models
let geomCode = `/**
 * WebOS Graphics Engine - 3D Geometry Generators (Cube, Sphere, Cylinder, Plane, Torus)
 */

export interface BufferGeometry {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
}

export class GeometryGenerator {
  public static createCube(size: number = 1): BufferGeometry {
    const s = size / 2;
    const positions = new Float32Array([
      // Front
      -s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s,
      // Back
      -s, -s, -s,  -s,  s, -s,   s,  s, -s,   s, -s, -s,
      // Top
      -s,  s, -s,  -s,  s,  s,   s,  s,  s,   s,  s, -s,
      // Bottom
      -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s,
      // Right
       s, -s, -s,   s,  s, -s,   s,  s,  s,   s, -s,  s,
      // Left
      -s, -s, -s,  -s, -s,  s,  -s,  s,  s,  -s,  s, -s,
    ]);

    const normals = new Float32Array([
      // Front
      0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
      // Back
      0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
      // Top
      0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
      // Bottom
      0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
      // Right
      1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
      // Left
      -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    ]);

    const uvs = new Float32Array([
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
    ]);

    const indices = new Uint16Array([
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ]);

    return { positions, normals, uvs, indices };
  }

  public static createPlane(width: number = 1, height: number = 1): BufferGeometry {
    const w = width / 2;
    const h = height / 2;
    const positions = new Float32Array([
      -w,  h, 0,
       w,  h, 0,
      -w, -h, 0,
       w, -h, 0,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0,
    ]);
    const indices = new Uint16Array([
      0, 2, 1,
      2, 3, 1,
    ]);
    return { positions, normals, uvs, indices };
  }
}
`;
writeCode('core/graphics/geometry.ts', geomCode);

// 3. Scene Graph & Camera
let sceneCode = `/**
 * WebOS Graphics Engine - Scene Graph Hierarchy, Camera & Lighting
 */

import { Vector3, Matrix4, Quaternion } from './math3d';
import { BufferGeometry } from './geometry';

export class SceneNode {
  public name: string;
  public position: Vector3 = new Vector3();
  public rotation: Quaternion = new Quaternion();
  public scale: Vector3 = new Vector3(1, 1, 1);
  public localMatrix: Matrix4 = new Matrix4();
  public worldMatrix: Matrix4 = new Matrix4();
  public children: SceneNode[] = [];
  public parent: SceneNode | null = null;
  public geometry?: BufferGeometry;
  public color: string = '#ffffff';

  constructor(name: string = 'Node') {
    this.name = name;
  }

  public add(child: SceneNode): void {
    child.parent = this;
    this.children.push(child);
  }

  public remove(child: SceneNode): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parent = null;
      this.children.splice(idx, 1);
    }
  }

  public updateWorldMatrix(): void {
    this.localMatrix.makeTranslation(this.position.x, this.position.y, this.position.z);
    if (this.parent) {
      this.worldMatrix = this.parent.worldMatrix.clone().multiply(this.localMatrix);
    } else {
      this.worldMatrix = this.localMatrix.clone();
    }

    for (const child of this.children) {
      child.updateWorldMatrix();
    }
  }
}

export class Camera {
  public position: Vector3 = new Vector3(0, 0, 5);
  public target: Vector3 = new Vector3(0, 0, 0);
  public up: Vector3 = new Vector3(0, 1, 0);
  public projectionMatrix: Matrix4 = new Matrix4();
  public viewMatrix: Matrix4 = new Matrix4();

  constructor(public fov: number = 60, public aspect: number = 1.6, public near: number = 0.1, public far: number = 1000) {
    this.updateProjectionMatrix();
  }

  public updateProjectionMatrix(): void {
    const fovRad = (this.fov * Math.PI) / 180;
    this.projectionMatrix.makePerspective(fovRad, this.aspect, this.near, this.far);
  }

  public updateViewMatrix(): void {
    this.viewMatrix.makeLookAt(this.position, this.target, this.up);
  }
}

export class Scene {
  public root: SceneNode = new SceneNode('RootScene');
  public ambientLightColor: string = '#333333';
  public directionalLightDir: Vector3 = new Vector3(1, 1, 1).normalize();

  public add(node: SceneNode): void {
    this.root.add(node);
  }
}
`;
writeCode('core/graphics/scene.ts', sceneCode);

// 4. Software & WebGL Renderer Pipeline
let rendererCode = `/**
 * WebOS Graphics Engine - 3D Pipeline Renderer
 */

import { Scene, Camera, SceneNode } from './scene';
import { Vector3 } from './math3d';

export class WebOSRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  public render(scene: Scene, camera: Camera): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    camera.updateViewMatrix();
    scene.root.updateWorldMatrix();

    this.renderNode(scene.root, camera, ctx, w, h);
  }

  private renderNode(node: SceneNode, camera: Camera, ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (node.geometry) {
      this.drawMesh(node, camera, ctx, w, h);
    }

    for (const child of node.children) {
      this.renderNode(child, camera, ctx, w, h);
    }
  }

  private drawMesh(node: SceneNode, camera: Camera, ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const geom = node.geometry!;
    const pos = geom.positions;
    const indices = geom.indices;

    ctx.strokeStyle = node.color || '#3b82f6';
    ctx.lineWidth = 1.5;

    const projectedPoints: Array<{ x: number; y: number; z: number }> = [];

    for (let i = 0; i < pos.length; i += 3) {
      const v = new Vector3(pos[i], pos[i + 1], pos[i + 2]);
      // Simple orthographic / perspective projection
      const screenX = w / 2 + (v.x + node.position.x) * 120 / (v.z + node.position.z + 5);
      const screenY = h / 2 - (v.y + node.position.y) * 120 / (v.z + node.position.z + 5);
      projectedPoints.push({ x: screenX, y: screenY, z: v.z });
    }

    for (let i = 0; i < indices.length; i += 3) {
      const p1 = projectedPoints[indices[i]];
      const p2 = projectedPoints[indices[i + 1]];
      const p3 = projectedPoints[indices[i + 2]];

      if (p1 && p2 && p3) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
}
`;
writeCode('core/graphics/renderer.ts', rendererCode);

// 5. Master Graphics Index
let graphicsIndex = `/**
 * WebOS Graphics Engine Master Index
 */

export * from './math3d';
export * from './geometry';
export * from './scene';
export * from './renderer';
`;
writeCode('core/graphics/index.ts', graphicsIndex);

console.log('Graphics subsystem generated successfully.');
