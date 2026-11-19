import { lazy, Suspense } from "react";
import { Loading } from "@/components/portal-ui";
import { Screen } from "@/components/ui";
import { MapGestureRoot } from "@/traval/map-viewport";

const TravalScreen = lazy(() => import("@/traval/screen"));

export default function Traval() {
  return (
    <MapGestureRoot>
      <Suspense fallback={<Screen><Loading /></Screen>}><TravalScreen /></Suspense>
    </MapGestureRoot>
  );
}
