export class Vector2D {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  public subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  public norm(): number {
    return Math.sqrt(this.x**2 + this.y**2);
  }

  public scale(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }
}
