/**
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
