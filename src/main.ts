import { Vector2D } from "./classes/Vector";
import { VectorLineSegment } from "./classes/VectorLineSegment";

let CANVAS_WIDTH: number;
let CANVAS_HEIGHT: number;
let origin: Vector2D;
const SCALE = 50;
let prevTimestamp = 0;
let deltaTime: number;
const vectorLineSegments: VectorLineSegment[] = [];
const pointer = new Vector2D(0, 0);
let isDrawing = false;
let selectedVector = -1;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
let canvasRect = canvas.getBoundingClientRect();
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const canvasWrapperEl = document.querySelector(".canvas-wrapper") as HTMLDivElement;

window.addEventListener("resize", () => {
  canvas.width = 1;
  canvas.height = 1;
  CANVAS_WIDTH = canvasWrapperEl.clientWidth;
  CANVAS_HEIGHT = canvasWrapperEl.clientHeight;
  origin = new Vector2D(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
})

function setup() {
  CANVAS_WIDTH = canvasWrapperEl.clientWidth;
  CANVAS_HEIGHT = canvasWrapperEl.clientHeight;
  origin = new Vector2D(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

function drawCoordinateAxes() {
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(-CANVAS_WIDTH / 2, origin.y);
  ctx.lineTo(CANVAS_WIDTH, origin.y);
  ctx.moveTo(origin.x, -CANVAS_HEIGHT / 2);
  ctx.lineTo(origin.x, CANVAS_HEIGHT);
  ctx.stroke();
}

function isAroundOrigin(pointer: Vector2D) {
  return origin.subtract(pointer).norm() <= 10;
}

canvas.addEventListener("pointermove", e => {
  pointer.x = e.clientX - canvasRect.x;
  pointer.y = e.clientY - canvasRect.y;

  for (let vectorLineSegment of vectorLineSegments) {
    let cursorStyle = 
      vectorLineSegment.isHeld ? "grabbing" :
      vectorLineSegment.isAroundVector(pointer) ? "grab" :
      null;

    if (cursorStyle) {
      canvas.style.cursor = cursorStyle;
      return;
    }
  }

  if (isDrawing) {
    canvas.style.cursor = "grabbing";;
  } else if (isAroundOrigin(pointer)) {
    canvas.style.cursor = "grab";
  } else {
    canvas.style.cursor = "default";
  }
})

canvas.addEventListener("pointerdown", () => {
  if (isAroundOrigin(pointer)) {
    isDrawing = true;
    canvas.style.cursor = "grabbing";
  }

  vectorLineSegments.forEach((vectorLineSegment, i) => {
    if (vectorLineSegment.isAroundVector(pointer)) {
      if (selectedVector !== -1) {
        vectorLineSegments[selectedVector].color = "black";
      }
      vectorLineSegment.isHeld = true;
      selectedVector = i;
      vectorLineSegment.color = "red";
      canvas.style.cursor = "grabbing";
    } else {
      vectorLineSegment.color = "black";
    }
  })
})

canvas.addEventListener("pointerup", () => {
  if (isAroundOrigin(pointer)) {
    canvas.style.cursor = "grab";
  } else {
    canvas.style.cursor = "default";
  }

  if (isDrawing) {
    vectorLineSegments.push(new VectorLineSegment(origin, origin.subtract(pointer)));
  }
  isDrawing = false;

  vectorLineSegments.forEach(vectorLineSegment => {
    if (vectorLineSegment.isHeld) {
      vectorLineSegment.isHeld = false
    }
  })
})

function update() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawCoordinateAxes();

  if (isDrawing) {
    new VectorLineSegment(origin, origin.subtract(pointer)).draw(ctx);
  }

  vectorLineSegments.forEach(vectorLineSegment => {
    if (vectorLineSegment.isHeld) {
      vectorLineSegment.updateVector(origin.subtract(pointer));
    }
    vectorLineSegment.updateOrigin(origin);
    vectorLineSegment.draw(ctx);
  })
}

function mainLoop(timestamp: number) {
  requestAnimationFrame(mainLoop);

  deltaTime = timestamp - prevTimestamp;
  prevTimestamp = timestamp;

  update();
}

setup();
requestAnimationFrame(mainLoop);
