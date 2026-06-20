"use client";

import * as React from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useStudio } from "@/lib/studio/store";
import { Loader2 } from "lucide-react";
import { parse, ParseError } from "@/lib/sim/parser";

const LANG_MAP: Record<string, string> = { arduino: "cpp", micropython: "python", circuitpython: "python" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export function CodeEditor() {
  const code = useStudio((s) => s.code);
  const language = useStudio((s) => s.language);
  const setCode = useStudio((s) => s.setCode);

  const monacoRef = React.useRef<any>(null);
  const editorRef = React.useRef<any>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSyntax = React.useCallback(
    (value: string) => {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      if (!monaco || !editor) return;
      const model = editor.getModel();
      if (!model) return;
      if (language !== "arduino") {
        monaco.editor.setModelMarkers(model, "robocode", []);
        return;
      }
      try {
        parse(value);
        monaco.editor.setModelMarkers(model, "robocode", []);
      } catch (e) {
        if (e instanceof ParseError) {
          monaco.editor.setModelMarkers(model, "robocode", [
            {
              startLineNumber: Math.max(1, e.line),
              startColumn: 1,
              endLineNumber: Math.max(1, e.line),
              endColumn: 400,
              message: e.message,
              severity: monaco.MarkerSeverity.Error,
            },
          ]);
        }
      }
    },
    [language],
  );

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    checkSyntax(editor.getValue());
  };

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={LANG_MAP[language] ?? "cpp"}
      value={code}
      onMount={onMount}
      onChange={(v) => {
        const val = v ?? "";
        setCode(val);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => checkSyntax(val), 400);
      }}
      loading={
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
      options={{
        fontSize: 13,
        fontFamily: "var(--font-mono), monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        padding: { top: 14 },
        lineNumbersMinChars: 3,
        renderLineHighlight: "all",
        tabSize: 2,
      }}
    />
  );
}
