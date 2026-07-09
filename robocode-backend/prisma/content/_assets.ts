// Reusable inline SVG illustrations for courses. Keep them simple and labeled.
// All SVGs are self-contained, use plain hex colors, no external references.

export const SVG_ARDUINO_BOARD = `<svg viewBox="0 0 600 260" role="img" aria-label="Arduino UNO board with labeled pins" xmlns="http://www.w3.org/2000/svg">
  <!-- Board body -->
  <rect x="20" y="30" width="380" height="200" rx="12" ry="12" fill="#007acc" stroke="#005fa3" stroke-width="2"/>
  <!-- Board label -->
  <text x="60" y="60" font-family="monospace" font-size="14" fill="#ffffff" font-weight="bold">Arduino UNO</text>
  <!-- USB port -->
  <rect x="20" y="110" width="28" height="44" rx="4" fill="#c0c0c0" stroke="#888" stroke-width="1.5"/>
  <text x="24" y="168" font-family="monospace" font-size="9" fill="#ffffff">USB</text>
  <!-- Power jack -->
  <rect x="20" y="62" width="22" height="30" rx="4" fill="#333" stroke="#555" stroke-width="1"/>
  <text x="15" y="104" font-family="monospace" font-size="9" fill="#ffffff">PWR</text>
  <!-- Digital pins header -->
  <rect x="80" y="30" width="280" height="12" rx="2" fill="#1a1a1a"/>
  <text x="80" y="22" font-family="monospace" font-size="10" fill="#e5e7eb">DIGITAL PINS 0–13</text>
  <!-- Pin dots top row -->
  <circle cx="95"  cy="36" r="4" fill="#eab308"/>
  <circle cx="115" cy="36" r="4" fill="#eab308"/>
  <circle cx="135" cy="36" r="4" fill="#eab308"/>
  <circle cx="155" cy="36" r="4" fill="#eab308"/>
  <circle cx="175" cy="36" r="4" fill="#eab308"/>
  <circle cx="195" cy="36" r="4" fill="#eab308"/>
  <circle cx="215" cy="36" r="4" fill="#eab308"/>
  <circle cx="235" cy="36" r="4" fill="#2563ff"/>
  <circle cx="255" cy="36" r="4" fill="#2563ff"/>
  <circle cx="275" cy="36" r="4" fill="#2563ff"/>
  <circle cx="295" cy="36" r="4" fill="#2563ff"/>
  <circle cx="315" cy="36" r="4" fill="#ef4444"/>
  <circle cx="335" cy="36" r="4" fill="#ef4444"/>
  <circle cx="355" cy="36" r="4" fill="#16a34a"/>
  <!-- Pin 13 label -->
  <line x1="355" y1="42" x2="355" y2="70" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="340" y="82" font-family="monospace" font-size="10" fill="#16a34a">D13 (LED)</text>
  <!-- Analog pins header -->
  <rect x="80" y="218" width="200" height="12" rx="2" fill="#1a1a1a"/>
  <text x="80" y="246" font-family="monospace" font-size="10" fill="#e5e7eb">ANALOG IN A0–A5</text>
  <!-- Pin dots bottom row -->
  <circle cx="95"  cy="224" r="4" fill="#a855f7"/>
  <circle cx="115" cy="224" r="4" fill="#a855f7"/>
  <circle cx="135" cy="224" r="4" fill="#a855f7"/>
  <circle cx="155" cy="224" r="4" fill="#a855f7"/>
  <circle cx="175" cy="224" r="4" fill="#a855f7"/>
  <circle cx="195" cy="224" r="4" fill="#a855f7"/>
  <!-- Power pins -->
  <rect x="310" y="218" width="90" height="12" rx="2" fill="#1a1a1a"/>
  <text x="310" y="246" font-family="monospace" font-size="10" fill="#e5e7eb">POWER</text>
  <circle cx="320" cy="224" r="4" fill="#ef4444"/>
  <text x="308" y="210" font-family="monospace" font-size="9" fill="#ef4444">5V</text>
  <circle cx="340" cy="224" r="4" fill="#ef4444"/>
  <text x="328" y="210" font-family="monospace" font-size="9" fill="#ef4444">3.3V</text>
  <circle cx="360" cy="224" r="4" fill="#1f2937"/>
  <text x="350" y="210" font-family="monospace" font-size="9" fill="#9ca3af">GND</text>
  <!-- ATmega chip -->
  <rect x="160" y="110" width="100" height="60" rx="6" fill="#1a1a1a" stroke="#374151" stroke-width="1.5"/>
  <text x="178" y="136" font-family="monospace" font-size="9" fill="#9ca3af">ATmega328P</text>
  <text x="190" y="150" font-family="monospace" font-size="8" fill="#6b7280">16 MHz</text>
  <!-- On-board LED label -->
  <circle cx="420" cy="80" r="10" fill="#16a34a" stroke="#15803d" stroke-width="1.5"/>
  <text x="435" y="76" font-family="monospace" font-size="10" fill="#16a34a">Built-in</text>
  <text x="435" y="90" font-family="monospace" font-size="10" fill="#16a34a">LED (D13)</text>
  <line x1="420" y1="90" x2="420" y2="130" stroke="#16a34a" stroke-width="1" stroke-dasharray="3,2"/>
  <!-- Reset button -->
  <rect x="400" y="130" width="24" height="16" rx="4" fill="#ef4444" stroke="#dc2626" stroke-width="1"/>
  <text x="430" y="142" font-family="monospace" font-size="10" fill="#e5e7eb">RESET</text>
</svg>`;

export const SVG_LED_CIRCUIT = `<svg viewBox="0 0 600 200" role="img" aria-label="LED in series with a 220-ohm resistor connected to Arduino pin 13 and GND" xmlns="http://www.w3.org/2000/svg">
  <!-- Arduino pin label box -->
  <rect x="20" y="70" width="100" height="60" rx="8" fill="#007acc" stroke="#005fa3" stroke-width="2"/>
  <text x="35" y="96" font-family="monospace" font-size="12" fill="#ffffff" font-weight="bold">Arduino</text>
  <text x="42" y="114" font-family="monospace" font-size="11" fill="#ffffff">Pin 13</text>
  <!-- Wire from pin 13 to resistor -->
  <line x1="120" y1="100" x2="220" y2="100" stroke="#16a34a" stroke-width="3"/>
  <!-- Resistor body -->
  <rect x="220" y="84" width="80" height="32" rx="6" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
  <!-- Resistor color bands -->
  <rect x="232" y="84" width="6" height="32" fill="#ef4444" opacity="0.8"/>
  <rect x="244" y="84" width="6" height="32" fill="#ef4444" opacity="0.8"/>
  <rect x="256" y="84" width="6" height="32" fill="#1a1a1a" opacity="0.8"/>
  <rect x="270" y="84" width="6" height="32" fill="#f59e0b" opacity="0.6"/>
  <text x="228" y="136" font-family="monospace" font-size="11" fill="#92400e">220 Ω</text>
  <!-- Wire from resistor to LED anode -->
  <line x1="300" y1="100" x2="380" y2="100" stroke="#16a34a" stroke-width="3"/>
  <!-- LED body (triangle + bar symbol) -->
  <polygon points="380,78 380,122 420,100" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
  <line x1="420" y1="78" x2="420" y2="122" stroke="#dc2626" stroke-width="3"/>
  <!-- LED lens -->
  <circle cx="430" cy="100" r="14" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2"/>
  <!-- Anode / Cathode labels -->
  <text x="370" y="74" font-family="monospace" font-size="10" fill="#9ca3af">A (+)</text>
  <text x="414" y="74" font-family="monospace" font-size="10" fill="#9ca3af">K (–)</text>
  <!-- Wire from LED cathode to GND label -->
  <line x1="444" y1="100" x2="560" y2="100" stroke="#1f2937" stroke-width="3"/>
  <!-- GND box -->
  <rect x="480" y="70" width="100" height="60" rx="8" fill="#374151" stroke="#1f2937" stroke-width="2"/>
  <text x="500" y="96" font-family="monospace" font-size="12" fill="#e5e7eb" font-weight="bold">Arduino</text>
  <text x="508" y="114" font-family="monospace" font-size="11" fill="#e5e7eb">GND</text>
  <!-- LED glow indicator -->
  <circle cx="430" cy="100" r="6" fill="#ef4444"/>
  <line x1="450" y1="78" x2="462" y2="66" stroke="#fca5a5" stroke-width="1.5"/>
  <line x1="456" y1="88" x2="470" y2="80" stroke="#fca5a5" stroke-width="1.5"/>
  <!-- Caption area -->
  <text x="160" y="175" font-family="sans-serif" font-size="12" fill="#6b7280">Current flows: Pin 13 → 220Ω Resistor → LED anode → LED cathode → GND</text>
</svg>`;

export const SVG_INPUT_PROCESS_OUTPUT = `<svg viewBox="0 0 600 160" role="img" aria-label="Input, process, output pipeline showing data flow from sensor to model to decision" xmlns="http://www.w3.org/2000/svg">
  <!-- INPUT box -->
  <rect x="20" y="40" width="140" height="80" rx="10" fill="#2563ff" stroke="#1d4ed8" stroke-width="2"/>
  <text x="58" y="75" font-family="sans-serif" font-size="15" fill="#ffffff" font-weight="bold">INPUT</text>
  <text x="32" y="96" font-family="monospace" font-size="11" fill="#bfdbfe">sensor readings</text>
  <text x="42" y="111" font-family="monospace" font-size="11" fill="#bfdbfe">images, text</text>
  <!-- Arrow INPUT -> PROCESS -->
  <line x1="160" y1="80" x2="220" y2="80" stroke="#6b7280" stroke-width="3"/>
  <polygon points="220,74 234,80 220,86" fill="#6b7280"/>
  <!-- PROCESS box -->
  <rect x="230" y="40" width="140" height="80" rx="10" fill="#7c3aed" stroke="#6d28d9" stroke-width="2"/>
  <text x="254" y="75" font-family="sans-serif" font-size="15" fill="#ffffff" font-weight="bold">PROCESS</text>
  <text x="246" y="96" font-family="monospace" font-size="11" fill="#ddd6fe">AI model</text>
  <text x="243" y="111" font-family="monospace" font-size="11" fill="#ddd6fe">pattern match</text>
  <!-- Arrow PROCESS -> OUTPUT -->
  <line x1="370" y1="80" x2="430" y2="80" stroke="#6b7280" stroke-width="3"/>
  <polygon points="430,74 444,80 430,86" fill="#6b7280"/>
  <!-- OUTPUT box -->
  <rect x="440" y="40" width="140" height="80" rx="10" fill="#16a34a" stroke="#15803d" stroke-width="2"/>
  <text x="467" y="75" font-family="sans-serif" font-size="15" fill="#ffffff" font-weight="bold">OUTPUT</text>
  <text x="455" y="96" font-family="monospace" font-size="11" fill="#bbf7d0">decision</text>
  <text x="452" y="111" font-family="monospace" font-size="11" fill="#bbf7d0">action, label</text>
  <!-- Example labels below boxes -->
  <text x="35" y="145" font-family="sans-serif" font-size="11" fill="#9ca3af">e.g. temperature 32°C</text>
  <text x="232" y="145" font-family="sans-serif" font-size="11" fill="#9ca3af">e.g. threshold rule</text>
  <text x="447" y="145" font-family="sans-serif" font-size="11" fill="#9ca3af">e.g. turn fan ON</text>
</svg>`;
