export type Point = { x: number; y: number };
export type MapSize = { width: number; height: number };
export type MapTransform = Point & { scale: number };

export const fullMap: MapTransform = { x: 0, y: 0, scale: 1 };
export const maxMapScale = 8;
export const mapZoomStep = 1.5;

export function constrainMap(transform: MapTransform, size: MapSize, aspect: number): MapTransform {
  "worklet";
  const { scale } = transform;
  const fittedWidth = Math.min(size.width, size.height * aspect);
  const fittedHeight = Math.min(size.height, size.width / aspect);
  const limitX = Math.max(0, (fittedWidth * scale - size.width) / 2);
  const limitY = Math.max(0, (fittedHeight * scale - size.height) / 2);
  return {
    scale,
    x: Math.max(-limitX, Math.min(limitX, transform.x)),
    y: Math.max(-limitY, Math.min(limitY, transform.y)),
  };
}

export function zoomMap(
  current: MapTransform,
  targetScale: number,
  size: MapSize,
  aspect: number,
  from: Point = { x: 0, y: 0 },
  to: Point = from,
) {
  "worklet";
  const scale = Math.max(1, Math.min(maxMapScale, targetScale));
  const ratio = scale / current.scale;
  return constrainMap({
    scale,
    x: to.x + (current.x - from.x) * ratio,
    y: to.y + (current.y - from.y) * ratio,
  }, size, aspect);
}
