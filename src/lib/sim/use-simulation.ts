"use client";

import * as React from "react";
import { useStudio } from "@/lib/studio/store";
import { SimEngine } from "@/lib/sim/engine";
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
    const st = useStudio.getState();
    st.resetSim();
    st.clearSerial();
    st.setRunning(true);
    const eng = new SimEngine(st.toDiagram(), st.code, {
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
  }, [projectId]);

  React.useEffect(() => () => stop(), [stop]);

  return { start, stop };
}
