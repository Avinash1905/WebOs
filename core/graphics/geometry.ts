/**
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
