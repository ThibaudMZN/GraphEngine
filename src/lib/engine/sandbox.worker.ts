import type { GameContext } from "./runtime";

let gameModule: any = null;

type RuntimeMessage = {
  type: "load" | "init" | "update";
  code: string;
  ctx: GameContext;
  delta: number;
};

const applyPhysics = (ctx: GameContext, delta: number) => {
  const gravity = ctx.constants.gravity ?? 0;

  for (const obj of Object.values(ctx.objects)) {
    if (obj.type === "Physics") {
      obj.acceleration.y += gravity;

      obj.velocity.x += obj.acceleration.x * delta;
      obj.velocity.y += obj.acceleration.y * delta;

      obj.position.x += obj.velocity.x * delta;
      obj.position.y += obj.velocity.y * delta;

      obj.acceleration.x = 0;
      obj.acceleration.y = 0;
    }
  }
};

self.onmessage = (e: MessageEvent<RuntimeMessage>) => {
  const { type, code, ctx, delta } = e.data;

  if (type === "load" && code) {
    try {
      const exports: any = {};
      const func = new Function("exports", code);
      func(exports);
      gameModule = exports;
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }

  if (type === "init" && gameModule?.init) {
    try {
      gameModule.init(ctx);
      self.postMessage({ type: "inited", ctx });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }

  if (type === "update" && gameModule?.update) {
    try {
      applyPhysics(ctx, delta);
      gameModule.update(ctx, delta);
      self.postMessage({ type: "updated", ctx });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }
};
