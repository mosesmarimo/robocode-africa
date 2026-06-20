# RoboCode.Africa — Documentation

Platform for primary and high school students to learn **Robotics, Coding and AI** through an
interactive 2D/3D electronics simulator and a Wokwi-style browser IDE (**RoboCode Studio**).

## Deliverables (v1.0 — 19 June 2026)

| Document | DOCX | PDF | Pages |
|---|---|---|---|
| **User Requirements Document (URD)** | `RoboCode.Africa - User Requirements Document.docx` | `….pdf` | 298 |
| **System Specification Document (SSD)** | `RoboCode.Africa - System Specification Document.docx` | `….pdf` | 418 |

- **URD** — 22 sections: vision, stakeholders & personas, role/permission matrix, user requirements
  for onboarding/approval, white-labelling, RoboCode Studio, simulation, coding, learning, teams &
  competitions, gamification, safety, administration, plus use cases, user stories, journey maps,
  non-functional expectations, assumptions and a glossary.
- **SSD** — 23 sections: architecture, technology stack, functional requirements for every module,
  the RoboCode Simulation Engine, the component & board library, data model, APIs & integrations,
  non-functional requirements, security & child-safety, infrastructure/DevOps, accessibility/i18n,
  observability, a traceability matrix and appendices (pin references, `board.json`, `diagram.json`).

Boards covered as first-class targets: **Arduino UNO R3** (avr8js), **ESP32** (ESP32 core sim) and
**Raspberry Pi Pico / RP2040** ([rp2040js](https://github.com/wokwi/rp2040js)), plus an extensible,
data-driven board library using the [wokwi-boards](https://github.com/wokwi/wokwi-boards)
`board.json` definition format for custom boards.

## Regenerating the documents

Source markdown lives in `_build/sections/` (one file per section). To re-render the DOCX + PDF:

```
bash _build/assemble.sh
```

Requires `pandoc` and `typst` (PDF engine). `_build/header.typ` makes tables/figures break across
pages and sets the code-block size; keep code-fence lines ≤ ~96 chars so they fit the page width.
The section authoring and board-integration workflows are in `_build/*.workflow.js`.
