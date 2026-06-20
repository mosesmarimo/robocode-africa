"use client";

import * as React from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { parse, ParseError } from "@/lib/sim/parser";

/* eslint-disable @typescript-eslint/no-explicit-any */
function monacoLang(name: string): string {
  if (name.endsWith(".ino") || name.endsWith(".h") || name.endsWith(".cpp") || name.endsWith(".c")) return "cpp";
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".json")) return "json";
  return "plaintext";
}

export function CodeEditor() {
  const activeFile = useStudio((s) => s.activeFile);
  const files = useStudio((s) => s.files);
  const setFileContent = useStudio((s) => s.setFileContent);
  const toDiagram = useStudio((s) => s.toDiagram);

  const isDiagram = activeFile === "diagram.json";
  const file = files.find((f) => f.name === activeFile);
  const content = isDiagram ? JSON.stringify(toDiagram(), null, 2) : file?.content ?? "";
  const readOnly = isDiagram || !!file?.readonly;
  const language = isDiagram ? "json" : monacoLang(activeFile);

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
      if (!activeFile.endsWith(".ino")) {
        monaco.editor.setModelMarkers(model, "robocode", []);
        return;
      }
      try {
        parse(value);
        monaco.editor.setModelMarkers(model, "robocode", []);
      } catch (e) {
        if (e instanceof ParseError) {
          monaco.editor.setModelMarkers(model, "robocode", [
            { startLineNumber: Math.max(1, e.line), startColumn: 1, endLineNumber: Math.max(1, e.line), endColumn: 400, message: e.message, severity: monaco.MarkerSeverity.Error },
          ]);
        }
      }
    },
    [activeFile],
  );

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    checkSyntax(editor.getValue());
  };

  return (
    <Editor
      key={activeFile}
      height="100%"
      theme="vs-dark"
      language={language}
      value={content}
      onMount={onMount}
      onChange={(v) => {
        if (readOnly) return;
        const val = v ?? "";
        setFileContent(activeFile, val);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => checkSyntax(val), 400);
      }}
      loading={<div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>}
      options={{
        readOnly,
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
