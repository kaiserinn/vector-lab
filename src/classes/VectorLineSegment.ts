import { Vector2D } from './Vector';

export class VectorLineSegment {
  public vector: Vector2D;
  public headPos: Vector2D;
  public origin: Vector2D;
  public color: string;
  public isHeld: boolean;

  public constructor(origin: Vector2D, vector: Vector2D, { color }: { color: string } = { color: "black" }) {
    this.vector = vector;
    this.origin = origin;
    this.headPos = origin.subtract(this.vector);
    this.color = color;
    this.isHeld = false;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const headlen = 10;
    const angle = Math.atan2(this.vector.y, this.vector.x);
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.moveTo(this.origin.x, this.origin.y);
    ctx.lineTo(this.headPos.x, this.headPos.y);
    ctx.stroke();
    ctx.moveTo(this.headPos.x, this.headPos.y);
    ctx.lineTo(this.headPos.x + headlen * Math.cos(angle - Math.PI / 6), this.headPos.y + headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(this.headPos.x + headlen * Math.cos(angle + Math.PI / 6), this.headPos.y + headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();
  }

  public isAroundVector(pointer: Vector2D): boolean {
    return this.headPos.subtract(pointer).norm() <= 10;
  }

  public updateOrigin(origin: Vector2D): void {
    this.headPos = origin.subtract(this.vector);
    this.origin = origin;
  }
}
