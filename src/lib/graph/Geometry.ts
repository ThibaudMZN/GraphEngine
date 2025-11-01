import type { Vector2 } from "./GraphStore";

export type Rect = { x: number; y: number; w: number; h: number };

export const normalizeRect = (rect: Rect): Rect => {
  const x = rect.w < 0 ? rect.x + rect.w : rect.x;
  const y = rect.h < 0 ? rect.y + rect.h : rect.y;
  const w = Math.abs(rect.w);
  const h = Math.abs(rect.h);
  return { x, y, w, h };
};

export function isInside(pos: Vector2, rect: Rect): boolean {
  return (
    pos.x >= rect.x &&
    pos.x <= rect.x + rect.w &&
    pos.y >= rect.y &&
    pos.y <= rect.y + rect.h
  );
}
