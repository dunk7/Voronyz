declare module "d3-delaunay" {
  export class Delaunay<P = [number, number]> {
    static from(
      points: Iterable<P>,
      fx?: (p: P) => number,
      fy?: (p: P) => number
    ): Delaunay<P>;
    points: Float64Array;
    find(x: number, y: number, i?: number): number;
    render(context: CanvasPath): void;
    voronoi(bounds?: [number, number, number, number]): Voronoi<P>;
  }

  export class Voronoi<P = [number, number]> {
    delaunay: Delaunay<P>;
    render(context: CanvasPath): void;
    renderCell(i: number, context: CanvasPath): void;
    update(): void;
  }
}
