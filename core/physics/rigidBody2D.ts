/**
 * WebOS 2D Rigid Body Physics Engine
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface RigidBody2DConfig {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  mass: number;
  radius: number;
  restitution: number;
  friction: number;
  isStatic?: boolean;
}

export class RigidBody2DWorld {
  private bodies: Map<string, RigidBody2DConfig> = new Map();
  public gravity: Vector2 = { x: 0, y: 980.0 }; // 9.8m/s in px
  private bounds = { width: 1920, height: 1080 };

  public addBody(body: RigidBody2DConfig): void {
    this.bodies.set(body.id, {
      vx: 0,
      vy: 0,
      isStatic: false,
      ...body,
    });
  }

  public removeBody(id: string): boolean {
    return this.bodies.delete(id);
  }

  public step(dt: number): void {
    const clampedDt = Math.min(dt, 0.05);

    // Integrate forces & velocities
    for (const body of this.bodies.values()) {
      if (body.isStatic) continue;

      body.vx = (body.vx || 0) + this.gravity.x * clampedDt;
      body.vy = (body.vy || 0) + this.gravity.y * clampedDt;

      body.x += (body.vx || 0) * clampedDt;
      body.y += (body.vy || 0) * clampedDt;

      // Boundary collisions
      if (body.y + body.radius >= this.bounds.height) {
        body.y = this.bounds.height - body.radius;
        body.vy = -(body.vy || 0) * body.restitution;
        body.vx = (body.vx || 0) * (1 - body.friction * clampedDt);
      }
      if (body.x - body.radius <= 0) {
        body.x = body.radius;
        body.vx = -(body.vx || 0) * body.restitution;
      } else if (body.x + body.radius >= this.bounds.width) {
        body.x = this.bounds.width - body.radius;
        body.vx = -(body.vx || 0) * body.restitution;
      }
    }
  }

  public getBodies(): RigidBody2DConfig[] {
    return Array.from(this.bodies.values());
  }
}

export const physicsWorld = new RigidBody2DWorld();
