export class EngineRuntime {
  private worker: Worker;
  private ctx: any;
  private canvas: HTMLCanvasElement;
  private lastTime = 0;
  private ready = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.worker = new Worker(new URL("./sandbox.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e) => {
      const { type, error, ctx } = e.data;
      if (type === "ready") this.ready = true;
      if (type === "inited") {
        this.ctx = ctx;
        this.start();
      }
      if (type === "updated") {
        this.ctx = ctx;
      }
      if (type === "error") console.error("Sandbox error:", error);
    };

    this.ctx = {
      objects: {
        player: { x: 50, y: 50, rotation: 0 },
        screen: { width: canvas.width, height: canvas.height },
      },
      input: { keys: {} },
    };

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
    this.ready = false;
    this.worker.postMessage({ type: "load", code: jsCode });
  }

  init() {
    this.worker.postMessage({ type: "init", ctx: this.ctx });
  }

  start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const delta = (time - this.lastTime) / 1000;
      this.lastTime = time;
      this.worker.postMessage({ type: "update", ctx: this.ctx, delta });
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const c = this.canvas.getContext("2d")!;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    c.fillStyle = "skyblue";
    const player = this.ctx.objects.player;
    c.save();
    c.translate(player.x + 25, player.y + 25);
    const radians = (player.rotation * Math.PI) / 180;
    c.rotate(radians);
    c.fillRect(-25, -25, 50, 50);
    c.restore();
  }
}
