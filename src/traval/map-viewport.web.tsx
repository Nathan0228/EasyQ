import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { constrainMap, fullMap, zoomMap, type MapTransform, type Point } from "./map-transform";
import { MapZoomControls, type MapViewportProps } from "./map-zoom-controls";

type Gesture =
  | { kind: "drag"; start: Point; transform: MapTransform }
  | { kind: "pinch"; center: Point; distance: number; transform: MapTransform };

export function MapGestureRoot({ children }: { children: ReactNode }) {
  return children;
}

function centeredPoint(clientX: number, clientY: number, rect: DOMRect) {
  return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
}

function pinchPosition([first, second]: Point[]) {
  return {
    center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
  };
}

export function MapViewport({ aspect, water, legend, children }: MapViewportProps) {
  const frame = useRef<HTMLDivElement>(null);
  const current = useRef(fullMap);
  const [transform, setTransform] = useState(fullMap);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const frameAspect = Math.max(1.22, Math.min(2.05, aspect));

  const update = useCallback((next: MapTransform) => {
    current.current = next;
    setTransform(next);
  }, []);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const previous = current.current;
      const adjusted = constrainMap(previous, element.getBoundingClientRect(), aspect);
      if (previous.x !== adjusted.x || previous.y !== adjusted.y) update(adjusted);
    });
    observer.observe(element);

    const wheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.deltaY) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const point = centeredPoint(event.clientX, event.clientY, rect);
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      const factor = Math.exp(-event.deltaY * units * 0.003);
      update(zoomMap(current.current, current.current.scale * factor, rect, aspect, point));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", wheel);
    };
  }, [aspect, update]);

  function begin(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || pointers.current.size >= 2) return;
    const element = event.currentTarget;
    const point = centeredPoint(event.clientX, event.clientY, element.getBoundingClientRect());
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) {
      suppressClick.current = false;
      gesture.current = { kind: "drag", start: point, transform: current.current };
      return;
    }
    suppressClick.current = true;
    gesture.current = { kind: "pinch", ...pinchPosition([...pointers.current.values()]), transform: current.current };
    for (const pointer of pointers.current.keys()) element.setPointerCapture(pointer);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const point = centeredPoint(event.clientX, event.clientY, rect);
    pointers.current.set(event.pointerId, point);
    if (start.kind === "pinch") {
      const { center, distance } = pinchPosition([...pointers.current.values()]);
      update(zoomMap(start.transform, start.transform.scale * distance / start.distance, rect, aspect, start.center, center));
      return;
    }
    const dx = point.x - start.start.x;
    const dy = point.y - start.start.y;
    if (!suppressClick.current && Math.hypot(dx, dy) < 5) return;
    suppressClick.current = true;
    if (start.transform.scale <= 1) return;
    if (!element.hasPointerCapture(event.pointerId)) element.setPointerCapture(event.pointerId);
    update(constrainMap({ scale: start.transform.scale, x: start.transform.x + dx, y: start.transform.y + dy }, rect, aspect));
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.delete(event.pointerId)) return;
    const [remaining] = pointers.current.values();
    gesture.current = remaining ? { kind: "drag", start: remaining, transform: current.current } : null;
  }

  return (
    <>
      <div ref={frame} className="traval-map-viewport"
        style={{ width: "100%", aspectRatio: frameAspect, maxHeight: 465, backgroundColor: water,
          overflow: "hidden", touchAction: transform.scale > 1 ? "none" : "pan-y",
          cursor: transform.scale > 1 ? "grab" : undefined, userSelect: "none" }}
        onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
        onPointerLeave={event => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) end(event);
        }}
        onClickCapture={event => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}>
        <div style={{ width: "100%", height: "100%",
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
          {children}
        </div>
      </div>
      <MapZoomControls scale={transform.scale} legend={legend} onReset={() => {
        pointers.current.clear();
        gesture.current = null;
        update(fullMap);
      }} onZoom={factor => {
        if (!frame.current) return;
        update(zoomMap(current.current, current.current.scale * factor, frame.current.getBoundingClientRect(), aspect));
      }} />
    </>
  );
}
