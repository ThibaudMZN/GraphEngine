import type { GameContext, GameObject } from "./runtime";

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

const isAABBColliding = (a: GameObject, b: GameObject) => {
  const aLeft = a.position.x - a.size.width / 2;
  const aRight = a.position.x + a.size.width / 2;
  const aTop = a.position.y - a.size.height / 2;
  const aBottom = a.position.y + a.size.height / 2;

  const bLeft = b.position.x - b.size.width / 2;
  const bRight = b.position.x + b.size.width / 2;
  const bTop = b.position.y - b.size.height / 2;
  const bBottom = b.position.y + b.size.height / 2;

  return !(
    aRight < bLeft ||
    aLeft > bRight ||
    aBottom < bTop ||
    aTop > bBottom
  );
};

const detectCollisions = (ctx: GameContext) => {
  const objs = ctx.objects;
  const newCollisions: Record<string, Set<string>> = {};

  const ids = Object.keys(objs);

  for (let i = 0; i < ids.length; i++) {
    const a = objs[ids[i]];
    if (!a.collidable) continue;
    for (let j = i + 1; j < ids.length; j++) {
      const b = objs[ids[j]];
      if (!b.collidable) continue;

      if (isAABBColliding(a, b)) {
        if (!newCollisions[ids[i]]) newCollisions[ids[i]] = new Set();
        if (!newCollisions[ids[j]]) newCollisions[ids[j]] = new Set();
        newCollisions[ids[i]].add(ids[j]);
        newCollisions[ids[j]].add(ids[i]);
      }
    }
  }

  return newCollisions;
};

self.onmessage = (e: MessageEvent<RuntimeMessage>) => {
  const { type, code, ctx, delta } = e.data;

  if (type === "load" && code) {
    try {
      const exports: any = {};
      const game = {
        end: () => self.postMessage({ type: "end" }),
      };
      const func = new Function("exports", "game", code);
      func(exports, game);

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

      const previous = ctx.collisions || {};
      ctx.collisions = detectCollisions(ctx);
      for (const id in ctx.collisions) {
        for (const other of ctx.collisions[id]) {
          if (!previous[id] || !previous[id].has(other)) {
            gameModule.onCollision?.(ctx, id, other);
          }
        }
      }

      gameModule.update(ctx, delta);
      self.postMessage({ type: "updated", ctx });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }
};
