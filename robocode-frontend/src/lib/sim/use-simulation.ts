"use client";

import * as React from "react";
import { useStudio } from "@/lib/studio/store";
import { createEngine, SimUnsupportedEngineError } from "@/lib/sim/engine";
import type { SimEngine } from "@/lib/sim/engine";
import { getBoard } from "@/lib/domain/boards";
import { setActiveEngine } from "@/lib/sim/active";
import { recordSimulationRun } from "@/lib/studio/actions";

export function useSimulation(projectId: string) {
  const engineRef = React.useRef<SimEngine | null>(null);

  const stop = React.useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setActiveEngine(null);
    useStudio.getState().setRunning(false);
  }, []);

  const start = React.useCallback(() => {
    // No engine leak on double-Run: a rapid double-click on Run must not orphan a
    // live engine — for Pico that's a Web Worker running a full emulator that
    // nothing else can stop.
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    const st = useStudio.getState();
    st.resetSim();
    st.clearSerial();
    st.setRunning(true);
    const board = getBoard(useStudio.getState().board);
    try {
      // createEngine AND eng.start() share one try/catch: either can throw (a bad
      // board, a malformed diagram/code, a construction-time failure inside a real
      // engine), and both failure modes need the exact same cleanup so the Studio
      // never ends up "running" with no live engine behind it.
      const eng = createEngine(board, st.toDiagram(), st.sketchContent(), {
        onSerial: (l) => useStudio.getState().appendSerial(l),
        onError: (m) => useStudio.getState().appendSerial(m),
        onStop: () => {
          engineRef.current = null;
          setActiveEngine(null);
          useStudio.getState().setRunning(false);
        },
      });
      engineRef.current = eng;
      setActiveEngine(eng);
      const ok = eng.start();
      if (ok && projectId !== "new") {
        recordSimulationRun(projectId).catch(() => {});
      }
    } catch (e) {
      const message =
        e instanceof SimUnsupportedEngineError ? e.message : `⛔ ${e instanceof Error ? e.message : String(e)}`;
      useStudio.getState().appendSerial(message);
      useStudio.getState().setRunning(false);
      setActiveEngine(null);
      engineRef.current = null;
    }
  }, [projectId]);

  React.useEffect(() => () => stop(), [stop]);

  return { start, stop };
}
