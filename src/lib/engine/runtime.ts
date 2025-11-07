import type { Vector2 } from "../graph/GraphStore";
import { get, type Writable, writable } from "svelte/store";

type BaseGameObject = {
  position: Vector2;
  size: { width: number; height: number };
  rotation: number;
  collidable?: boolean;
};

type StaticGameObject = BaseGameObject & { type: "Static" };

type PhysicsGameObject = BaseGameObject & {
  velocity: Vector2;
  acceleration: Vector2;
  type: "Physics";
};

export type GameObject = StaticGameObject | PhysicsGameObject;

type Timer = { elapsed: number; active: boolean };

type Text = {
  value: string;
  x: number;
  y: number;
  size: number;
  color: string;
};

export type GameContext = {
  objects: Record<string, GameObject>;
  constants: {
    screen: {
      width: number;
      height: number;
    };
    gravity: number;
  };
  input: {
    keys: Record<string, boolean>;
    pressed: Record<string, boolean>;
  };
  timers: Record<string, Timer>;
  texts: Record<string, Text>;
  collisions: Record<string, Set<string>>;
  variables: Record<string, any>;
};

type WorkerMessage = {
  type: "inited" | "updated" | "error" | "end";
  error?: Error;
  ctx: GameContext;
};

export class EngineRuntime {
  private ctx: GameContext;
  private worker: Worker;
  private canvas: HTMLCanvasElement;
  private lastTime = 0;
  private running = false;
  private canvasContext: CanvasRenderingContext2D | null = null;
  public fps: Writable<number> = writable<number>(60);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.worker = new Worker(new URL("./sandbox.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, error, ctx } = e.data;
      if (type === "inited") {
        this.ctx = ctx;
        this.start();
      }
      if (type === "updated") {
        this.ctx = ctx;
        this.resetKeyPressed();
      }
      if (type === "end") {
        this.running = false;
      }
      if (type === "error") console.error("Sandbox error:", error);
    };

    this.ctx = this.initContext();

    window.addEventListener("keydown", (e) => {
      if (!this.ctx.input.keys[e.key]) {
        this.ctx.input.pressed[e.key] = true;
      }
      this.ctx.input.keys[e.key] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.ctx.input.keys[e.key] = false;
    });
  }

  async loadScript(jsCode: string) {
    this.worker.postMessage({ type: "load", code: jsCode });
  }

  init() {
    this.initContext();
    this.worker.postMessage({ type: "init", ctx: this.ctx });
  }

  private resetKeyPressed() {
    for (const k in this.ctx.input.pressed) this.ctx.input.pressed[k] = false;
  }

  initContext() {
    this.ctx = {
      objects: {
        player: {
          position: { x: 50, y: 50 },
          rotation: 0,
          size: { width: 50, height: 50 },
          velocity: { x: 0, y: 0 },
          acceleration: { x: 0, y: 0 },
          type: "Physics",
          collidable: true,
        },
        wall: {
          type: "Static",
          position: { x: 400, y: 500 },
          rotation: 0,
          size: { width: 50, height: 300 },
          collidable: true,
        },
      },
      constants: {
        screen: { width: this.canvas.width, height: this.canvas.height },
        gravity: 1000,
      },
      input: { keys: {}, pressed: {} },
      timers: {},
      texts: {},
      collisions: {},
      variables: {},
    };
    return this.ctx;
  }

  start() {
    this.lastTime = performance.now();
    this.running = true;
    this.canvasContext = this.canvas.getContext("2d")!;
    const loop = (time: number) => {
      const delta = (time - this.lastTime) / 1000;
      const currentFPS = 1 / delta;
      const fps = get(this.fps);
      this.fps.set(fps + (currentFPS - fps) * 0.1);
      this.lastTime = time;
      this.worker.postMessage({ type: "update", ctx: this.ctx, delta });
      this.render();
      if (this.running) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  render() {
    if (!this.canvasContext) return;
    const c = this.canvasContext;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    c.fillStyle = "skyblue";
    for (const entity of Object.values(this.ctx.objects)) {
      c.save();
      c.translate(entity.position.x, entity.position.y);
      const radians = (entity.rotation * Math.PI) / 180;
      c.rotate(radians);
      c.fillRect(
        -entity.size.width / 2,
        -entity.size.height / 2,
        entity.size.width,
        entity.size.height,
      );
      c.restore();
    }

    c.textAlign = "center";
    c.textBaseline = "middle";
    for (const t of Object.values(this.ctx.texts)) {
      c.fillStyle = t.color;
      c.font = `${t.size}px "Open Sans"`;
      c.fillText(t.value, t.x, t.y);
    }
  }
}
