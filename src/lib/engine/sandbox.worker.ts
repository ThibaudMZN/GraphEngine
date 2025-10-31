let gameModule: any = null;

self.onmessage = (e) => {
  const { type, code, ctx, delta } = e.data;

  if (type === "load") {
    // console.log("👷‍♂️ Load");
    try {
      const exports: any = {};
      const func = new Function("exports", code);
      func(exports);
      gameModule = exports;
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }

  if (type === "init" && gameModule?.init) {
    // console.log("👷‍♂️ Init");
    try {
      gameModule.init(ctx);
      self.postMessage({ type: "inited", ctx });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }

  if (type === "update" && gameModule?.update) {
    // console.log("👷‍♂️ Update");
    try {
      gameModule.update(ctx, delta);
      self.postMessage({ type: "updated", ctx });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }
};
