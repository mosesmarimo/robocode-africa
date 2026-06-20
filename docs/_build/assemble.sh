#!/usr/bin/env bash
# Assemble RoboCode.Africa documentation section files into a single markdown
# source per document, then render .docx and .pdf with pandoc (typst PDF engine).
set -euo pipefail

ROOT="/Users/marimo/Dev/robocode/docs"
SEC="$ROOT/_build/sections"
DATE_HUMAN="19 June 2026"
VERSION="1.0"
MAINFONT="Helvetica Neue"
MONOFONT="DejaVu Sans Mono"

render_doc () {
  local prefix="$1"      # urd | ssd
  local title="$2"
  local subtitle="$3"
  local author="$4"
  local outbase="$5"     # output file base name (no extension)

  local src="$ROOT/${outbase}.md"
  local meta="$ROOT/_build/${prefix}-meta.yaml"

  # Metadata / front matter block
  cat > "$meta" <<EOF
---
title: "$title"
subtitle: "$subtitle"
author: "$author"
date: "$DATE_HUMAN"
version: "$VERSION"
lang: en
toc: true
toc-depth: 3
numbersections: true
papersize: us-letter
fontsize: 10pt
margin:
  x: 1.5cm
  y: 1.8cm
---
EOF

  # Assemble: metadata first, then every section file in numeric order.
  {
    cat "$meta"
    echo
    local f
    for f in $(ls "$SEC"/${prefix}-*.md | sort); do
      cat "$f"
      echo
      echo
    done
  } > "$src"

  echo ">> $outbase: assembled $(wc -w < "$src" | tr -d ' ') words from $(ls "$SEC"/${prefix}-*.md | wc -l | tr -d ' ') sections"

  # DOCX
  pandoc "$src" \
    --from=gfm+yaml_metadata_block \
    --toc --toc-depth=3 --number-sections \
    -o "$ROOT/${outbase}.docx"
  echo ">> wrote ${outbase}.docx ($(du -h "$ROOT/${outbase}.docx" | cut -f1))"

  # PDF via typst
  pandoc "$src" \
    --from=gfm+yaml_metadata_block \
    --toc --toc-depth=3 --number-sections \
    --pdf-engine=typst \
    -H "$ROOT/_build/header.typ" \
    -V mainfont="$MAINFONT" -V monofont="$MONOFONT" \
    -o "$ROOT/${outbase}.pdf"
  echo ">> wrote ${outbase}.pdf ($(du -h "$ROOT/${outbase}.pdf" | cut -f1))"
}

render_doc "urd" \
  "RoboCode.Africa — User Requirements Document" \
  "Learn Robotics, Coding and AI" \
  "RoboCode.Africa Product Team" \
  "RoboCode.Africa - User Requirements Document"

render_doc "ssd" \
  "RoboCode.Africa — System Specification Document" \
  "Platform, Simulator and RoboCode Studio" \
  "RoboCode.Africa Engineering Team" \
  "RoboCode.Africa - System Specification Document"

echo "ALL DONE"
ls -lh "$ROOT"/*.docx "$ROOT"/*.pdf
