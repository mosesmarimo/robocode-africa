export const meta = {
  name: 'robocode-board-integration',
  description: 'Weave the Raspberry Pi Pico (rp2040js) and custom board definitions (wokwi-boards) consistently into the already-written RoboCode.Africa documentation sections',
  phases: [
    { title: 'Integrate boards', detail: 'edit each board-relevant section to add the Pico and custom board definitions' },
    { title: 'Reconcile', detail: 'per-document consistency critic' },
    { title: 'Fix', detail: 'apply the reconcile findings' },
  ],
}

// args: array of { file: absolutePath, role: string } (may arrive as a JSON string)
let parsedArgs = args
if (typeof parsedArgs === 'string') {
  try { parsedArgs = JSON.parse(parsedArgs) } catch (e) { parsedArgs = [] }
}
const targets = Array.isArray(parsedArgs) ? parsedArgs : (parsedArgs && parsedArgs.files) || []
log('Board integration targets: ' + targets.length)

const ADDENDUM = [
  'BOARD ADDENDUM (authoritative - the documentation must reflect ALL of this):',
  '',
  'RoboCode.Africa supports THREE first-class development boards plus an extensible, data-driven board library:',
  '1. Arduino UNO R3 (ATmega328P) - simulated with avr8js (runs real compiled AVR firmware).',
  '2. ESP32 DevKit (ESP-WROOM-32) - ESP32 core simulation; on-board Wi-Fi/BLE.',
  '3. Raspberry Pi Pico (RP2040) - simulated with the Wokwi rp2040js library (github.com/wokwi/rp2040js), which runs REAL RP2040 firmware in the browser. RP2040 specs: dual-core ARM Cortex-M0+ at 133 MHz, 264 KB SRAM, 2 MB on-board QSPI flash. Pico I/O: 26 multifunction GPIO exposed on a 40-pin header (GP0-GP28), 3 ADC-capable inputs (GP26/GP27/GP28) plus an internal temperature sensor, 2x UART, 2x SPI, 2x I2C, 16 PWM channels, 8 PIO state machines, USB 1.1, 3.3V logic. Supported languages: MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK). Accurate execution loads a UF2/ELF firmware image into rp2040js. Pico W (CYW43439 Wi-Fi/BLE) is a near-term roadmap variant.',
  '',
  'CUSTOM / EXTENSIBLE BOARDS: RoboCode Studio uses the Wokwi wokwi-boards definition format (github.com/wokwi/wokwi-boards) as its canonical board schema. Boards are data-driven: a board manifest (board.json) declares the board name and its pins (each pin has a name, a type such as power/ground/gpio/analog/i2c/spi/uart, and an x/y position) together with an SVG visual asset; NO code change is needed to add a board. The standard wokwi-boards library (Arduino Uno/Nano/Mega, the ESP32 family, the Raspberry Pi Pico, and more) ships built in. Platform admins - and approved advanced users/teachers - can upload CUSTOM board definitions in this manifest format. Custom-board uploads are validated (JSON schema, pin sanity, SVG/asset safety) and, for non-admins, pass through the standard approval/moderation workflow before becoming available to learners. Each board definition binds to an MCU core target (avr8js / rp2040js / ESP32 core) so the simulator knows how to execute firmware for that board.',
  '',
  'CONSISTENCY: wherever the documentation previously implied only two boards (e.g. phrases like "the two boards", "both boards", "Arduino UNO and ESP32"), it must now read as three first-class boards (Arduino UNO, ESP32 and Raspberry Pi Pico) plus the extensible board library. Use the exact names rp2040js, RP2040, Raspberry Pi Pico, and wokwi-boards.',
].join('\n')

const RULES = [
  'EDITING RULES:',
  '- Preserve the file structure: the FIRST line must remain exactly "# Title" with no manual numbering.',
  '- Keep the established formatting: requirement tables use ID | Requirement | Priority | Acceptance/Notes; diagrams are ASCII inside fenced code blocks (three backticks), never mermaid; tables stay at most 5 columns.',
  '- Reuse the section existing requirement-ID prefixes (FR-STU/FR-SIM/FR-CODE/FR-TEN, NFR-, IR-, DR-, SR-, UR-*, UC-, US-) and continue their numbering; do not renumber or collide existing IDs.',
  '- Make surgical, well-integrated edits - do not duplicate content already present, and do not rewrite unrelated parts.',
  '- Use the Edit tool for targeted changes or Write to replace the whole file if the edits are extensive. Do not rename the file or create new files.',
].join('\n')

function roleGuidance(role) {
  switch (role) {
    case 'board-library':
      return 'This section is the HOME for the board catalogue. Add the Raspberry Pi Pico to the boards table. Add a dedicated Raspberry Pi Pico (RP2040) GPIO pin-summary table. Add or expand a subsection on the BOARD-DEFINITION model: the wokwi-boards manifest format (board.json pins with name/type/x-y plus SVG), the built-in board library, the custom-board upload + validation + approval flow, and how each board binds to an MCU core (avr8js / rp2040js / ESP32 core). Add data/interface requirement rows as appropriate.'
    case 'appendix':
      return 'In the pin-reference appendix, ADD a Raspberry Pi Pico (RP2040) pin reference table alongside the UNO and ESP32 tables. In the example-structures appendix, ADD an example board.json in the wokwi-boards format (board name, a few pins with name/type/x/y, and an SVG reference) for a small custom board. If there is a glossary appendix, add RP2040, Raspberry Pi Pico, UF2, PIO, CircuitPython, and wokwi-boards.'
    case 'simulation':
      return 'Add the RP2040 path (rp2040js running real RP2040 firmware) to the microcontroller execution model alongside avr8js (UNO) and the ESP32 core. Add a board-target abstraction that binds the active board definition (wokwi-boards format) to the correct MCU core. Update any pipeline/ASCII diagram and the FR-SIM requirement table to cover the Pico and board definitions.'
    case 'code':
      return 'Add MicroPython, CircuitPython and C/C++ (Arduino-Pico / Pico SDK) support for the Raspberry Pi Pico, and describe loading UF2/ELF firmware into rp2040js on the accurate path. Update the FR-CODE table and any language list accordingly.'
    case 'studio':
      return 'Add board selection from the board library (Arduino UNO, ESP32, Raspberry Pi Pico and additional/custom boards from wokwi-boards definitions) and the custom-board-definition import flow. Update the requirement table (FR-STU or UR-STU) accordingly.'
    case 'tech-stack':
      return 'Add rp2040js (Raspberry Pi Pico / RP2040 simulation) and the wokwi-boards board-definition library to the relevant technology rows, each with a one-line rationale.'
    case 'glossary':
      return 'Add alphabetical entries for: CircuitPython, PIO (Programmable I/O), Raspberry Pi Pico, RP2040, UF2, and wokwi-boards (board-definition format). Keep the existing entries.'
    default:
      return 'Wherever this section references boards, microcontrollers, firmware, or supported languages, ensure the Raspberry Pi Pico (RP2040, simulated with rp2040js) appears alongside the Arduino UNO and ESP32, and mention the extensible/custom board library (wokwi-boards) where relevant. Replace any wording that implies only two boards.'
  }
}

function editPrompt(t) {
  return [
    'You are a senior technical writer updating one section of the official RoboCode.Africa documentation to add Raspberry Pi Pico support and custom board definitions.',
    '',
    ADDENDUM,
    '',
    'Read this file with the Read tool, then edit it in place: ' + t.file,
    '',
    'SECTION-SPECIFIC TASK: ' + roleGuidance(t.role),
    '',
    RULES,
    '',
    'After editing, return the structured result.',
  ].join('\n')
}

const EDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['file', 'changed', 'summary'],
  properties: {
    file: { type: 'string' },
    changed: { type: 'boolean' },
    summary: { type: 'string' },
  },
}

const CRITIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['doc', 'issues', 'assessment'],
  properties: {
    doc: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'issue', 'severity'],
        properties: {
          file: { type: 'string' },
          issue: { type: 'string' },
          severity: { type: 'string' },
        },
      },
    },
    assessment: { type: 'string' },
  },
}

const FIX_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['doc', 'summary'],
  properties: {
    doc: { type: 'string' },
    filesModified: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
}

// ---- Phase 1: edit each target file ----
phase('Integrate boards')
const edited = await parallel(targets.map(t => () =>
  agent(editPrompt(t), {
    label: 'board:' + (t.file.split('/').pop()),
    phase: 'Integrate boards',
    schema: EDIT_SCHEMA,
    agentType: 'general-purpose',
    model: 'sonnet',
    effort: 'high',
  })
))
const okEdits = edited.filter(Boolean)
log('Edited ' + okEdits.length + '/' + targets.length + ' sections for board support')

// ---- Phase 2 + 3: per-document reconcile + fix ----
const byDoc = { URD: [], SSD: [] }
for (const t of targets) {
  if (t.file.includes('/urd-')) byDoc.URD.push(t.file)
  else if (t.file.includes('/ssd-')) byDoc.SSD.push(t.file)
}

function criticPrompt(doc, files) {
  const full = doc === 'URD' ? 'User Requirements Document' : 'System Specification Document'
  return [
    'You are a QA reviewer verifying that Raspberry Pi Pico support and custom board definitions were integrated CONSISTENTLY across the RoboCode.Africa ' + full + '.',
    '',
    ADDENDUM,
    '',
    'Read each of these recently edited section files (Read tool) and check for: (a) any remaining wording implying only two boards; (b) the Raspberry Pi Pico (RP2040 / rp2040js) missing where boards are discussed; (c) the custom board definition / wokwi-boards capability missing where it belongs; (d) broken formatting (first line not "# Title", tables over 5 columns, mermaid, duplicated content, or colliding requirement IDs introduced by the edits).',
    'Files:',
    files.join('\n'),
    '',
    'Report concrete, actionable issues with file and severity. Return the structured report.',
  ].join('\n')
}

function fixPrompt(doc, report) {
  const full = doc === 'URD' ? 'User Requirements Document' : 'System Specification Document'
  return [
    'You are a senior technical writer fixing the RoboCode.Africa ' + full + ' after a board-integration QA review.',
    '',
    ADDENDUM,
    '',
    'QA report (JSON):',
    JSON.stringify(report),
    '',
    RULES,
    '',
    'Address every high/medium issue by editing the named files in place. Return a summary of the fixes.',
  ].join('\n')
}

const docSets = [
  { doc: 'URD', files: byDoc.URD },
  { doc: 'SSD', files: byDoc.SSD },
].filter(d => d.files.length > 0)

const reconciled = await pipeline(
  docSets,
  d => agent(criticPrompt(d.doc, d.files), {
    label: 'reconcile:' + d.doc,
    phase: 'Reconcile',
    schema: CRITIC_SCHEMA,
    agentType: 'general-purpose',
    effort: 'high',
  }),
  (report, d) => (report && report.issues && report.issues.length)
    ? agent(fixPrompt(d.doc, report), {
        label: 'fix:' + d.doc,
        phase: 'Fix',
        schema: FIX_SCHEMA,
        agentType: 'general-purpose',
        effort: 'high',
      })
    : { doc: d.doc, summary: 'No issues to fix' }
)

return {
  edited: okEdits,
  reconciled: reconciled.filter(Boolean),
}
