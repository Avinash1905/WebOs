/**
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
