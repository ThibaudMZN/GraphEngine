type GameObject = {
  x: number;
  y: number;
  rotation: number;
};

export type GameContext = {
  objects: Record<string, GameObject>;
  constants: {
    screen: {
      width: number;
      height: number;
    };
  };
  input: { keys: Record<string, boolean> };
  timers: {};
};

type WorkerMessage = {
  type: "inited" | "updated" | "error";
  error?: Error;
  ctx: GameContext;
};

export class EngineRuntime {
  private ctx: GameContext;
  private worker: Worker;
  private canvas: HTMLCanvasElement;
  private lastTime = 0;
  private running = false;

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
      }
      if (type === "error") console.error("Sandbox error:", error);
    };

    this.ctx = this.initContext();

    window.addEventListener(
      "keydown",
      (e) => (this.ctx.input.keys[e.key] = true),
    );
    window.addEventListener(
      "keyup",
      (e) => (this.ctx.input.keys[e.key] = false),
    );
  }

  async loadScript(jsCode: string) {
    this.worker.postMessage({ type: "load", code: jsCode });
  }

  init() {
    this.initContext();
    this.worker.postMessage({ type: "init", ctx: this.ctx });
  }

  private initContext() {
    this.ctx = {
      objects: {
        player: { x: 50, y: 50, rotation: 0 },
      },
      constants: {
        screen: { width: this.canvas.width, height: this.canvas.height },
      },
      input: { keys: {} },
      timers: {},
    };
    return this.ctx;
  }

  start() {
    this.lastTime = performance.now();
    this.running = true;
    const loop = (time: number) => {
      const delta = (time - this.lastTime) / 1000;
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
    const c = this.canvas.getContext("2d")!;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    c.fillStyle = "skyblue";
    const player = this.ctx.objects.player;
    c.save();
    c.translate(player.x, player.y);
    const radians = (player.rotation * Math.PI) / 180;
    c.rotate(radians);
    c.fillRect(-25, -25, 50, 50);
    c.restore();
  }
}
