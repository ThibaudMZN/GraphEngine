import type { GameContext } from "./runtime";

let gameModule: any = null;

type RuntimeMessage = {
  type: "load" | "init" | "update";
  code?: string;
  ctx: GameContext;
  delta?: number;
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
      gameModule.update(ctx, delta);
      self.postMessage({ type: "updated", ctx });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }
};
