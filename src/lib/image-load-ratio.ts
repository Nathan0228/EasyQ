function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// React Native sends source dimensions; RN Web sends a browser load event.
export function imageLoadRatio(event: unknown): number | undefined {
  if (!isObject(event) || !isObject(event.nativeEvent)) return;
  const { source, target } = event.nativeEvent;
  const sizes = [
    isObject(source) ? [source.width, source.height] : [],
    isObject(target) ? [target.naturalWidth, target.naturalHeight] : [],
  ];
  for (const [width, height] of sizes) {
    if (typeof width !== "number" || typeof height !== "number"
      || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) continue;
    const ratio = width / height;
    if (Number.isFinite(ratio) && ratio > 0) return ratio;
  }
}
