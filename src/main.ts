import { Vector2D } from "./classes/Vector";
import { VectorLineSegment } from "./classes/VectorLineSegment";

let CANVAS_WIDTH: number;
let CANVAS_HEIGHT: number;
let origin: Vector2D;
const SCALE = 50;
let prevTimestamp = 0;
let deltaTime: number;
let vectorLineSegments: VectorLineSegment[] = [];
const pointer = new Vector2D(0, 0);
let isDrawing = false;
let selectedVector = -1;
let isHoldingCanvas = false;
let isResizing = false;
let lastIndex = -1;

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
let canvasRect = canvas.getBoundingClientRect();
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
const canvasWrapperEl = document.querySelector<HTMLDivElement>(".canvas-wrapper")!;
const sidebarEl = document.querySelector<HTMLDivElement>(".sidebar")!;

window.addEventListener("resize", resize);

function resize(): void {
  canvas.width = 1;
  canvas.height = 1;
  CANVAS_WIDTH = canvasWrapperEl.clientWidth;
  CANVAS_HEIGHT = canvasWrapperEl.clientHeight;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

function setup(): void {
  CANVAS_WIDTH = canvasWrapperEl.clientWidth;
  CANVAS_HEIGHT = canvasWrapperEl.clientHeight;
  origin = new Vector2D(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  canvas.style.setProperty("--x-origin", origin.x + "px")
  canvas.style.setProperty("--x-origin", origin.x + "px")

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

function drawCoordinateAxes(): void {
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(-CANVAS_WIDTH / 2, origin.y);
  ctx.lineTo(CANVAS_WIDTH, origin.y);
  ctx.moveTo(origin.x, -CANVAS_HEIGHT / 2);
  ctx.lineTo(origin.x, CANVAS_HEIGHT);
  ctx.stroke();
}

function isAroundOrigin(pointer: Vector2D): boolean {
  return origin.subtract(pointer).norm() <= 10;
}

function renderFromTemplate(lineSegment: VectorLineSegment): void {
  let id = lastIndex;
  const template = document.querySelector<HTMLTemplateElement>("#vector-template")!;
  const clone = template.content.cloneNode(true) as DocumentFragment;

  const vectorsEl = clone.querySelector<HTMLDivElement>(".vectors")!;
  const vectorIndexEl = clone.querySelector<HTMLLabelElement>(".vector-index")!;
  vectorIndexEl.setAttribute("for", `vector-${id}`);
  vectorIndexEl.innerText = String(id+1);

  const vectorInputEl = clone.querySelector<HTMLInputElement>(".vector-input")!;
  vectorInputEl.setAttribute("id", `vector-${id}`);
  let vectorX = Math.round(-lineSegment.vector.x/SCALE * 100) / 100
  let vectorY = Math.round(lineSegment.vector.y/SCALE * 100) / 100
  vectorInputEl.value = `[${vectorX}, ${vectorY}]`;

  vectorInputEl.addEventListener("change", () => {
    const parsedInput = JSON.parse(vectorInputEl.value);
    const newVector = new Vector2D(-parsedInput[0] * SCALE, parsedInput[1] * SCALE);
    lineSegment.vector = newVector;
  })

  vectorInputEl.addEventListener("focus", () => {
    selectedVector = id;
    vectorsEl.classList.add("vectors-is-focused");
    vectorIndexEl.classList.add("index-is-focused");
  })
  vectorInputEl.addEventListener("focusout", () => {
    selectedVector = -1;
    vectorsEl.classList.remove("vectors-is-focused");
    vectorIndexEl.classList.remove("index-is-focused");
  })

  clone.querySelector<HTMLSpanElement>(".vector-remove")?.addEventListener("click", () => {
    vectorsEl.remove();
    vectorLineSegments = vectorLineSegments.filter(lineSegment => lineSegment.id !== id)
  })

  sidebarEl.appendChild(clone);
}

function isAroundSidebar(x: number): boolean {
  const sidebarWidth = sidebarEl.clientWidth;
  const threshold = 10;
  return (
    x >= sidebarWidth - threshold &&
    x <= sidebarWidth + threshold
  )
}

window.addEventListener("pointermove", e => {
  pointer.x = e.clientX - canvasRect.x;
  pointer.y = e.clientY - canvasRect.y;

  if (isAroundSidebar(e.clientX)) {
    sidebarEl.style.cursor = "ew-resize";
    canvas.style.cursor = "ew-resize";
  } else {
    sidebarEl.style.cursor = "default";
  }

  if (isResizing) {
    sidebarEl.style.width = pointer.x + canvasRect.x + "px";
    canvasRect = canvas.getBoundingClientRect();
    sidebarEl.style.cursor = "ew-resize";
    canvas.style.cursor = "ew-resize";
    resize();
  }
})

window.addEventListener("pointerdown", e => {
  isResizing = isAroundSidebar(e.clientX);
})

window.addEventListener("pointerup", () => {
  isResizing = false;
  sidebarEl.style.cursor = "default";
})

canvas.addEventListener("pointermove", e => {
  let dPointer = new Vector2D(e.clientX - canvasRect.x - pointer.x, e.clientY - canvasRect.y - pointer.y)

  pointer.x = e.clientX - canvasRect.x;
  pointer.y = e.clientY - canvasRect.y;

  if (isHoldingCanvas) {
    origin.x += dPointer.x;
    origin.y += dPointer.y;
    canvas.style.cursor = "grabbing";
    return;
  }

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

canvas.addEventListener("pointerdown", e => {
  if (isAroundOrigin(pointer)) {
    isDrawing = true;
    canvas.style.cursor = "grabbing";
    return;
  }

  for (let i = 0; i < vectorLineSegments.length; i++) {
    const lineSegment = vectorLineSegments[i];

    if (lineSegment.isAroundVector(pointer)) {
      lineSegment.isHeld = true;
      selectedVector = lineSegment.id;
      canvas.style.cursor = "grabbing";
      break;
    }

    selectedVector = -1;
  }

  isHoldingCanvas = selectedVector === -1 && !isAroundSidebar(e.clientX);
})

canvas.addEventListener("pointerup", () => {
  if (isAroundOrigin(pointer)) {
    canvas.style.cursor = "grab";
  } else {
    canvas.style.cursor = "default";
  }

  if (isDrawing) {
    const lineSegment = new VectorLineSegment(lastIndex+1, origin, origin.subtract(pointer));
    vectorLineSegments.push(lineSegment);
    lastIndex += 1;
    renderFromTemplate(lineSegment);
  }
  isDrawing = false;
  isHoldingCanvas = false;

  vectorLineSegments.forEach(vectorLineSegment => {
    if (vectorLineSegment.isHeld) {
      vectorLineSegment.isHeld = false
    }
  })
})

function update(): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (isHoldingCanvas) {
    canvas.style.setProperty("--x-origin", origin.x + "px")
    canvas.style.setProperty("--y-origin", origin.y + "px")
  }

  if (isDrawing) {
    new VectorLineSegment(Infinity, origin, origin.subtract(pointer)).draw(ctx);
  }

  drawCoordinateAxes();

  vectorLineSegments.forEach(lineSegment => {
    lineSegment.color = selectedVector === lineSegment.id ? "cornflowerblue" : "black";

    const input = document.querySelector<HTMLInputElement>(`#vector-${lineSegment.id}`)!
    const vectorsEl = input.closest(".vectors")!;
    const vectorIndexEl = vectorsEl.childNodes[1] as HTMLLabelElement;
    if (selectedVector === lineSegment.id) {
      vectorsEl.classList.add("vectors-is-focused");
      vectorIndexEl.classList.add("index-is-focused");
    } else {
      vectorsEl.classList.remove("vectors-is-focused");
      vectorIndexEl.classList.remove("index-is-focused");
    }

    if (lineSegment.isHeld) {
      const vector = origin.subtract(pointer);
      lineSegment.vector = vector;
      const vectorInputEl = document.querySelector<HTMLInputElement>(`#vector-${lineSegment.id}`)!;
      vectorInputEl.value = `[${-vector.x/SCALE}, ${vector.y/SCALE}]`;
    }
    lineSegment.updateOrigin(origin);
    lineSegment.draw(ctx);
  })
}

function mainLoop(timestamp: number): void {
  requestAnimationFrame(mainLoop);

  deltaTime = timestamp - prevTimestamp;
  prevTimestamp = timestamp;

  update();
}

setup();
requestAnimationFrame(mainLoop);
