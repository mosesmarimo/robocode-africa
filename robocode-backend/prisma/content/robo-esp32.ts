import { md, code, mermaid, svg, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson 1: Meet the ESP32
// ---------------------------------------------------------------------------

const SVG_ESP32_BOARD = `<svg viewBox="0 0 640 290" role="img" aria-label="ESP32 development board with labeled pins, antenna, USB, and buttons" xmlns="http://www.w3.org/2000/svg">
  <!-- Board body -->
  <rect x="20" y="20" width="400" height="250" rx="12" ry="12" fill="#1a5276" stroke="#154360" stroke-width="2"/>
  <!-- Board label -->
  <text x="60" y="52" font-family="monospace" font-size="15" fill="#ffffff" font-weight="bold">ESP32 DevKit</text>
  <!-- USB-C / Micro-USB port -->
  <rect x="20" y="115" width="30" height="44" rx="4" fill="#c0c0c0" stroke="#888" stroke-width="1.5"/>
  <text x="18" y="172" font-family="monospace" font-size="9" fill="#aed6f1">USB</text>
  <!-- EN (enable/reset) button -->
  <rect x="66" y="220" width="36" height="20" rx="5" fill="#ef4444" stroke="#dc2626" stroke-width="1.5"/>
  <text x="69" y="234" font-family="monospace" font-size="9" fill="#ffffff">EN</text>
  <!-- BOOT button -->
  <rect x="116" y="220" width="44" height="20" rx="5" fill="#374151" stroke="#1f2937" stroke-width="1.5"/>
  <text x="122" y="234" font-family="monospace" font-size="9" fill="#ffffff">BOOT</text>
  <!-- Wi-Fi / Bluetooth antenna (PCB trace) -->
  <rect x="352" y="22" width="66" height="22" rx="4" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
  <text x="356" y="37" font-family="monospace" font-size="9" fill="#1a1a1a" font-weight="bold">Wi-Fi/BT</text>
  <text x="362" y="50" font-family="monospace" font-size="8" fill="#d97706">antenna</text>
  <!-- Antenna radiating lines -->
  <line x1="418" y1="33" x2="432" y2="20" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="418" y1="33" x2="438" y2="33" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="418" y1="33" x2="432" y2="46" stroke="#f59e0b" stroke-width="1.5"/>
  <!-- ESP32 chip -->
  <rect x="160" y="108" width="110" height="70" rx="6" fill="#1a1a1a" stroke="#374151" stroke-width="2"/>
  <text x="173" y="132" font-family="monospace" font-size="9" fill="#9ca3af">ESP32-WROOM</text>
  <text x="182" y="148" font-family="monospace" font-size="8" fill="#6b7280">240 MHz</text>
  <text x="178" y="163" font-family="monospace" font-size="8" fill="#6b7280">dual-core</text>
  <!-- LEFT GPIO pin header -->
  <rect x="42" y="32" width="14" height="186" rx="3" fill="#111827"/>
  <!-- Left pin dots + labels -->
  <circle cx="49" cy="48"  r="4" fill="#ef4444"/><text x="60" y="52"  font-family="monospace" font-size="8" fill="#fca5a5">3V3</text>
  <circle cx="49" cy="66"  r="4" fill="#1f2937"/><text x="60" y="70"  font-family="monospace" font-size="8" fill="#9ca3af">GND</text>
  <circle cx="49" cy="84"  r="4" fill="#eab308"/><text x="60" y="88"  font-family="monospace" font-size="8" fill="#fef08a">GPIO15</text>
  <circle cx="49" cy="102" r="4" fill="#eab308"/><text x="60" y="106" font-family="monospace" font-size="8" fill="#fef08a">GPIO2</text>
  <line x1="49" y1="108" x2="49" y2="130" stroke="#eab308" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="60" y="124" font-family="monospace" font-size="8" fill="#eab308">← onboard LED</text>
  <circle cx="49" cy="120" r="4" fill="#eab308"/><text x="60" y="124" font-family="monospace" font-size="8" fill="#fef08a">GPIO4</text>
  <circle cx="49" cy="138" r="4" fill="#a855f7"/><text x="60" y="142" font-family="monospace" font-size="8" fill="#d8b4fe">GPIO34 ADC</text>
  <circle cx="49" cy="156" r="4" fill="#a855f7"/><text x="60" y="160" font-family="monospace" font-size="8" fill="#d8b4fe">GPIO35 ADC</text>
  <circle cx="49" cy="174" r="4" fill="#2563ff"/><text x="60" y="178" font-family="monospace" font-size="8" fill="#93c5fd">GPIO21 SDA</text>
  <circle cx="49" cy="192" r="4" fill="#2563ff"/><text x="60" y="196" font-family="monospace" font-size="8" fill="#93c5fd">GPIO22 SCL</text>
  <circle cx="49" cy="210" r="4" fill="#16a34a"/><text x="60" y="214" font-family="monospace" font-size="8" fill="#86efac">GPIO1 TX</text>
  <!-- RIGHT GPIO pin header -->
  <rect x="374" y="32" width="14" height="186" rx="3" fill="#111827"/>
  <circle cx="381" cy="48"  r="4" fill="#ef4444"/><text x="342" y="52"  font-family="monospace" font-size="8" fill="#fca5a5">VIN 5V</text>
  <circle cx="381" cy="66"  r="4" fill="#1f2937"/><text x="342" y="70"  font-family="monospace" font-size="8" fill="#9ca3af">GND</text>
  <circle cx="381" cy="84"  r="4" fill="#eab308"/><text x="330" y="88"  font-family="monospace" font-size="8" fill="#fef08a">GPIO13</text>
  <circle cx="381" cy="102" r="4" fill="#eab308"/><text x="330" y="106" font-family="monospace" font-size="8" fill="#fef08a">GPIO12</text>
  <circle cx="381" cy="120" r="4" fill="#eab308"/><text x="330" y="124" font-family="monospace" font-size="8" fill="#fef08a">GPIO14</text>
  <circle cx="381" cy="138" r="4" fill="#a855f7"/><text x="320" y="142" font-family="monospace" font-size="8" fill="#d8b4fe">GPIO32 ADC</text>
  <circle cx="381" cy="156" r="4" fill="#a855f7"/><text x="320" y="160" font-family="monospace" font-size="8" fill="#d8b4fe">GPIO33 ADC</text>
  <circle cx="381" cy="174" r="4" fill="#2563ff"/><text x="330" y="178" font-family="monospace" font-size="8" fill="#93c5fd">GPIO25 DAC</text>
  <circle cx="381" cy="192" r="4" fill="#2563ff"/><text x="330" y="196" font-family="monospace" font-size="8" fill="#93c5fd">GPIO26 DAC</text>
  <circle cx="381" cy="210" r="4" fill="#16a34a"/><text x="330" y="214" font-family="monospace" font-size="8" fill="#86efac">GPIO3 RX</text>
  <!-- Legend -->
  <rect x="460" y="60" width="160" height="130" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
  <text x="476" y="80"  font-family="sans-serif" font-size="11" fill="#e2e8f0" font-weight="bold">Pin legend</text>
  <circle cx="472" cy="97"  r="5" fill="#ef4444"/><text x="482" y="101" font-family="monospace" font-size="10" fill="#fca5a5">Power (3V3 / 5V)</text>
  <circle cx="472" cy="115" r="5" fill="#1f2937" stroke="#6b7280" stroke-width="1"/><text x="482" y="119" font-family="monospace" font-size="10" fill="#9ca3af">GND</text>
  <circle cx="472" cy="133" r="5" fill="#eab308"/><text x="482" y="137" font-family="monospace" font-size="10" fill="#fef08a">Digital GPIO / PWM</text>
  <circle cx="472" cy="151" r="5" fill="#a855f7"/><text x="482" y="155" font-family="monospace" font-size="10" fill="#d8b4fe">ADC / DAC</text>
  <circle cx="472" cy="169" r="5" fill="#2563ff"/><text x="482" y="173" font-family="monospace" font-size="10" fill="#93c5fd">I2C / SPI</text>
  <circle cx="472" cy="187" r="5" fill="#16a34a"/><text x="482" y="191" font-family="monospace" font-size="10" fill="#86efac">UART (serial)</text>
</svg>`;

const SVG_ESP32_GPIO2_LED = `<svg viewBox="0 0 620 210" role="img" aria-label="ESP32 GPIO2 wired through a 330-ohm resistor to an LED and GND" xmlns="http://www.w3.org/2000/svg">
  <!-- ESP32 board box -->
  <rect x="20" y="60" width="120" height="90" rx="8" fill="#1a5276" stroke="#154360" stroke-width="2"/>
  <text x="30" y="85"  font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">ESP32</text>
  <text x="30" y="103" font-family="monospace" font-size="10" fill="#aed6f1">GPIO 2</text>
  <text x="30" y="120" font-family="monospace" font-size="10" fill="#9ca3af">GND</text>
  <!-- GPIO 2 wire (top) -->
  <line x1="140" y1="100" x2="230" y2="100" stroke="#eab308" stroke-width="3"/>
  <!-- GND wire (bottom) -->
  <line x1="140" y1="117" x2="530" y2="117" stroke="#374151" stroke-width="2.5"/>
  <!-- Resistor -->
  <rect x="230" y="84" width="80" height="32" rx="6" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
  <rect x="242" y="84" width="6" height="32" fill="#ef4444" opacity="0.8"/>
  <rect x="256" y="84" width="6" height="32" fill="#ef4444" opacity="0.8"/>
  <rect x="270" y="84" width="6" height="32" fill="#1a1a1a" opacity="0.8"/>
  <rect x="283" y="84" width="6" height="32" fill="#c0c0c0" opacity="0.8"/>
  <text x="236" y="134" font-family="monospace" font-size="11" fill="#92400e">330 Ω</text>
  <!-- Wire resistor to LED -->
  <line x1="310" y1="100" x2="390" y2="100" stroke="#eab308" stroke-width="3"/>
  <!-- LED symbol -->
  <polygon points="390,78 390,122 430,100" fill="#2563ff" stroke="#1d4ed8" stroke-width="2"/>
  <line x1="430" y1="78" x2="430" y2="122" stroke="#1d4ed8" stroke-width="3"/>
  <!-- LED glow rays -->
  <line x1="446" y1="80" x2="460" y2="66" stroke="#93c5fd" stroke-width="1.5"/>
  <line x1="450" y1="92" x2="466" y2="82" stroke="#93c5fd" stroke-width="1.5"/>
  <!-- LED lens outline -->
  <circle cx="440" cy="100" r="14" fill="none" stroke="#2563ff" stroke-width="1.5" stroke-dasharray="4,2"/>
  <circle cx="440" cy="100" r="5" fill="#2563ff"/>
  <!-- Anode / Cathode labels -->
  <text x="380" y="74" font-family="monospace" font-size="10" fill="#9ca3af">A (+)</text>
  <text x="424" y="74" font-family="monospace" font-size="10" fill="#9ca3af">K (–)</text>
  <!-- Wire LED cathode to GND rail -->
  <line x1="454" y1="100" x2="530" y2="100" stroke="#374151" stroke-width="2.5"/>
  <line x1="530" y1="100" x2="530" y2="117" stroke="#374151" stroke-width="2.5"/>
  <!-- GND box -->
  <rect x="530" y="60" width="70" height="90" rx="8" fill="#374151" stroke="#1f2937" stroke-width="2"/>
  <text x="543" y="110" font-family="monospace" font-size="11" fill="#e5e7eb" font-weight="bold">GND</text>
  <!-- 3.3V warning label -->
  <rect x="130" y="168" width="320" height="26" rx="6" fill="#451a03" stroke="#92400e" stroke-width="1"/>
  <text x="145" y="185" font-family="monospace" font-size="11" fill="#fbbf24">ESP32 GPIO = 3.3 V logic — use 330 Ω or higher, not 220 Ω</text>
</svg>`;

const SVG_ADC_WIRING = `<svg viewBox="0 0 640 220" role="img" aria-label="Potentiometer wired between 3.3V and GND with wiper connected to ESP32 GPIO34 ADC pin" xmlns="http://www.w3.org/2000/svg">
  <!-- ESP32 board box -->
  <rect x="20" y="70" width="130" height="100" rx="8" fill="#1a5276" stroke="#154360" stroke-width="2"/>
  <text x="32" y="96"  font-family="monospace" font-size="11" fill="#ffffff" font-weight="bold">ESP32</text>
  <text x="32" y="114" font-family="monospace" font-size="10" fill="#fca5a5">3V3</text>
  <text x="32" y="132" font-family="monospace" font-size="10" fill="#d8b4fe">GPIO34</text>
  <text x="32" y="150" font-family="monospace" font-size="10" fill="#9ca3af">GND</text>
  <!-- 3V3 wire -->
  <line x1="150" y1="111" x2="260" y2="111" stroke="#ef4444" stroke-width="2.5"/>
  <!-- GPIO34 (wiper) wire -->
  <line x1="150" y1="129" x2="370" y2="129" stroke="#a855f7" stroke-width="3"/>
  <!-- GND wire -->
  <line x1="150" y1="147" x2="260" y2="147" stroke="#374151" stroke-width="2.5"/>
  <!-- Potentiometer body -->
  <rect x="260" y="95" width="100" height="68" rx="8" fill="#3b1f6e" stroke="#6d28d9" stroke-width="2"/>
  <text x="268" y="120" font-family="monospace" font-size="10" fill="#e9d5ff">10kΩ pot</text>
  <!-- End-terminal dots -->
  <circle cx="272" cy="111" r="5" fill="#ef4444"/>
  <circle cx="272" cy="147" r="5" fill="#374151" stroke="#9ca3af" stroke-width="1"/>
  <!-- Wiper dot + wire to GPIO34 -->
  <circle cx="360" cy="129" r="5" fill="#a855f7"/>
  <line x1="360" y1="129" x2="370" y2="129" stroke="#a855f7" stroke-width="3"/>
  <!-- Knob / dial -->
  <circle cx="310" cy="129" r="26" fill="#4c1d95" stroke="#7c3aed" stroke-width="2"/>
  <line x1="310" y1="129" x2="310" y2="106" stroke="#e9d5ff" stroke-width="2.5" stroke-linecap="round"/>
  <text x="298" y="180" font-family="monospace" font-size="9" fill="#c4b5fd">turn me</text>
  <!-- Serial monitor -->
  <rect x="460" y="60" width="160" height="100" rx="8" fill="#111827" stroke="#374151" stroke-width="1.5"/>
  <text x="480" y="82"  font-family="monospace" font-size="10" fill="#6b7280">Serial Monitor</text>
  <text x="472" y="100" font-family="monospace" font-size="11" fill="#4ade80">ADC: 1024</text>
  <text x="472" y="116" font-family="monospace" font-size="11" fill="#4ade80">ADC: 2048</text>
  <text x="472" y="132" font-family="monospace" font-size="11" fill="#4ade80">ADC: 4095</text>
  <text x="472" y="148" font-family="monospace" font-size="11" fill="#6b7280">0–4095 (12-bit)</text>
  <!-- Arrow from pot to serial -->
  <line x1="370" y1="129" x2="450" y2="110" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="5,3"/>
  <polygon points="446,104 460,109 450,116" fill="#a855f7"/>
</svg>`;

// ---------------------------------------------------------------------------
// Sketch code strings
// ---------------------------------------------------------------------------

const BLINK_ESP32_SKETCH = `// ESP32 blink — on-board LED is on GPIO 2
#define LED_PIN 2

void setup() {
  // Configure GPIO 2 as a digital output
  pinMode(LED_PIN, OUTPUT);

  // Start the serial port at 115200 baud (ESP32 default)
  Serial.begin(115200);
  Serial.println("ESP32 blink ready");
}

void loop() {
  // Turn the LED on (HIGH = 3.3 V on ESP32)
  digitalWrite(LED_PIN, HIGH);
  delay(500);   // 500 ms on

  // Turn the LED off
  digitalWrite(LED_PIN, LOW);
  delay(500);   // 500 ms off
}`;

const WIFI_CONNECT_SKETCH = `#include <WiFi.h>

// Replace with your own network credentials
const char* SSID     = "YourNetworkName";
const char* PASSWORD = "YourPassword";

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.print("Connecting to ");
  Serial.println(SSID);

  // Tell the Wi-Fi radio which network to join
  WiFi.begin(SSID, PASSWORD);

  // Wait until the connection succeeds
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());   // e.g. 192.168.1.42
}

void loop() {
  // Nothing to do here yet — Wi-Fi stays connected automatically.
  // In a real project you would send sensor data or serve a web page.
  delay(10000);

  // Check whether the link is still alive
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi lost — reconnecting...");
    WiFi.reconnect();
  }
}`;

const ADC_SKETCH = `// Read a potentiometer (or LDR) on GPIO 34
// ESP32 ADC is 12-bit: values from 0 to 4095

#define ADC_PIN 34   // GPIO34 is an input-only ADC pin — safe choice

void setup() {
  Serial.begin(115200);

  // GPIO34/35/36/39 are input-only; no pinMode needed,
  // but setting it explicitly doesn't hurt.
  pinMode(ADC_PIN, INPUT);

  Serial.println("ADC reader ready");
}

void loop() {
  // Read the raw 12-bit ADC value (0 = 0 V, 4095 = 3.3 V)
  int raw = analogRead(ADC_PIN);

  // Map the 0–4095 range to a percentage (0–100 %)
  int percent = map(raw, 0, 4095, 0, 100);

  Serial.print("Raw ADC: ");
  Serial.print(raw);
  Serial.print("  |  Percent: ");
  Serial.print(percent);
  Serial.println(" %");

  delay(200);   // Read five times per second
}`;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const roboEsp32: CourseModule = {
  meta: {
    title: "ESP32 — Wi-Fi & Bluetooth Microcontroller",
    slug: "robo-esp32",
    track: "robotics",
    level: "high",
    description:
      "The powerful Wi-Fi + Bluetooth board: GPIO, sensors, and your first connected projects.",
    coverImage: "/covers/robotics.svg",
    order: 30,
  },

  lessons: [
    // -----------------------------------------------------------------------
    // Lesson 1 — Meet the ESP32
    // -----------------------------------------------------------------------
    {
      title: "Meet the ESP32",
      slug: "esp32-intro",
      contentType: "markdown",
      estMinutes: 10,
      body: body(
        md(`## What is the ESP32?

The **ESP32** is a microcontroller made by Espressif Systems. It packs an enormous amount of hardware onto a single chip:

- A **dual-core 32-bit processor** running at up to 240 MHz — roughly 15× faster than the Arduino UNO's ATmega328P.
- Built-in **Wi-Fi** (802.11 b/g/n, 2.4 GHz) so it can join your home network or act as an access point.
- Built-in **Bluetooth Classic and BLE** so it can talk to phones, headsets, and other Bluetooth devices.
- **34 programmable GPIO pins** (though not all are available on every dev board).
- A **12-bit ADC** on multiple pins — that means it reads analogue voltages with 4 096 distinct levels instead of just 1 024.
- Hardware **SPI, I²C, UART, DAC, touch sensing, and PWM** — almost every communication protocol you will ever need.

All of this for roughly the same price as an Arduino UNO — which is why the ESP32 has become the default board for connected projects around the world.`),
        svg(SVG_ESP32_BOARD, "ESP32 DevKit development board with labeled GPIO pins, antenna, USB port, EN and BOOT buttons"),
        md(`## ESP32 vs Arduino UNO — at a glance

| Feature | Arduino UNO | ESP32 DevKit |
|---|---|---|
| CPU cores | 1 | 2 |
| Clock speed | 16 MHz | up to 240 MHz |
| Flash memory | 32 KB | 4 MB (typical) |
| RAM | 2 KB | 520 KB |
| ADC resolution | 10-bit (0–1023) | 12-bit (0–4095) |
| Wi-Fi | ✗ | ✓ built-in |
| Bluetooth | ✗ | ✓ built-in |
| Logic voltage | 5 V | **3.3 V** |
| GPIO count | 14 digital + 6 analogue | up to 34 |
| Programming language | Arduino C++ | Arduino C++ (same!) |

The most important thing to notice: the ESP32 runs at **3.3 V logic**. That means its GPIO pins can only handle 3.3 V signals. Connecting a 5 V sensor directly to an ESP32 GPIO pin can permanently damage the chip — always check your sensor's voltage first.

The good news: you program the ESP32 with the exact same Arduino C++ you already know. \`setup()\`, \`loop()\`, \`digitalWrite()\`, \`Serial.println()\` — they all work the same way.`),
        mermaid(
          `mindmap
  root((ESP32))
    Wireless
      Wi-Fi 802.11 b/g/n
      Bluetooth Classic
      Bluetooth LE
    Processing
      Dual-core 240 MHz
      520 KB RAM
      4 MB Flash
    I/O
      Up to 34 GPIO
      12-bit ADC
      DAC output
      PWM on any pin
      Touch sensing
    Protocols
      UART / Serial
      I2C
      SPI
      CAN bus`,
          "ESP32 capability map — everything built into one chip",
        ),
        callout("info", "The two buttons on the ESP32 DevKit board are EN (Enable / Reset — resets the chip, like pulling the power) and BOOT (hold it down while pressing EN to enter the firmware upload mode). You will mainly press EN to restart your program during testing."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 2 — Blink & GPIO
    // -----------------------------------------------------------------------
    {
      title: "Blink & GPIO",
      slug: "esp32-blink",
      contentType: "markdown",
      estMinutes: 12,
      body: body(
        md(`## Digital output on the ESP32

GPIO stands for **General-Purpose Input/Output**. Each GPIO pin on the ESP32 can be configured as either an *output* (the board drives a voltage onto the pin) or an *input* (the board reads the voltage on the pin). You choose with \`pinMode()\`.

The ESP32 DevKit has a tiny on-board LED connected to **GPIO 2**. This means we can make it blink without connecting any extra hardware — the perfect first sketch.

The two functions you will use for digital output are exactly the same as on an Arduino:

- \`pinMode(pin, OUTPUT)\` — declare that pin as an output.
- \`digitalWrite(pin, HIGH)\` — set the pin to 3.3 V (LED on).
- \`digitalWrite(pin, LOW)\` — set the pin to 0 V (LED off).
- \`delay(ms)\` — pause for a number of milliseconds.`),
        svg(SVG_ESP32_GPIO2_LED, "ESP32 GPIO2 wired through a 330-ohm resistor to an LED and GND"),
        md(`## The blink sketch

Open the sketch below in RoboCode Studio and click **Run**. The on-board LED (and any external LED you have wired to GPIO 2) should flash twice per second.

Line-by-line explanation:

- \`#define LED_PIN 2\` — gives the number 2 the name \`LED_PIN\`. Use a name so you only have to change one line if you move to a different pin later.
- \`pinMode(LED_PIN, OUTPUT)\` — tells the ESP32 that GPIO 2 will be an output.
- \`Serial.begin(115200)\` — starts the serial port at 115 200 baud. The ESP32 defaults to 115200, unlike the Arduino UNO's 9600.
- \`Serial.println("ESP32 blink ready")\` — sends a startup message to the Serial Monitor — handy for knowing the board is alive.
- \`digitalWrite(LED_PIN, HIGH)\` — drives GPIO 2 to 3.3 V, lighting the LED.
- \`delay(500)\` — holds that state for 500 ms (half a second).
- \`digitalWrite(LED_PIN, LOW)\` — drops GPIO 2 to 0 V, turning the LED off.`),
        code("arduino", BLINK_ESP32_SKETCH, { filename: "blink.ino", openInStudio: true }),
        callout("warning", "The ESP32 uses 3.3 V logic, not 5 V. When you wire an external LED, use a resistor of at least 330 Ω (not the 220 Ω you might use with an Arduino UNO). Using too small a resistor risks exceeding the 12 mA maximum current per GPIO pin and damaging the chip."),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 3 — Connect to Wi-Fi
    // -----------------------------------------------------------------------
    {
      title: "Connect to Wi-Fi",
      slug: "esp32-wifi",
      contentType: "markdown",
      estMinutes: 18,
      body: body(
        md(`## Your first connected device

One of the most exciting things about the ESP32 is that it can join a Wi-Fi network and talk to the internet. This turns a simple microcontroller into an **IoT device** (Internet of Things) — something that can send sensor readings to the cloud, receive commands from a phone app, or serve a tiny web page.

Espressif ships a full Wi-Fi library called \`WiFi.h\` for the ESP32. You include it at the top of your sketch and use three functions to get started:

| Function | What it does |
|---|---|
| \`WiFi.begin(ssid, password)\` | Start connecting to a network |
| \`WiFi.status()\` | Returns the current connection state |
| \`WiFi.localIP()\` | Returns the IP address the router assigned |

The constant \`WL_CONNECTED\` means the connection succeeded. We poll \`WiFi.status()\` in a \`while\` loop until the board is online.`),
        mermaid(
          `sequenceDiagram
  participant E as ESP32
  participant R as Wi-Fi Router
  participant I as Internet
  E->>R: WiFi.begin(ssid, password)
  R-->>E: Authentication OK
  R-->>E: IP address assigned (e.g. 192.168.1.42)
  Note over E: WiFi.status() == WL_CONNECTED
  E->>I: HTTP GET request
  I-->>E: HTTP 200 response
  Note over E: Serial.println(WiFi.localIP())`,
          "ESP32 Wi-Fi connection sequence: authenticate with the router, receive an IP, then reach the internet",
        ),
        md(`## Connecting in code

The sketch below connects to a network and prints the assigned IP address. Once you see the IP in the Serial Monitor, your ESP32 is a live node on your network — ready to send sensor data, fetch web pages, or respond to commands.

Paste your own network name and password into \`SSID\` and \`PASSWORD\` before uploading.`),
        code("arduino", WIFI_CONNECT_SKETCH, { filename: "wifi_connect.ino", openInStudio: true }),
        callout("tip", "You can find the IP address the router gave your ESP32 in the Serial Monitor — look for a line like 'IP address: 192.168.1.42'. Type that address into a browser on the same network and — if you build a web server sketch — your ESP32 will answer back. That is how most home automation projects start!"),
      ),
    },

    // -----------------------------------------------------------------------
    // Lesson 4 — Reading the world (ADC)
    // -----------------------------------------------------------------------
    {
      title: "Reading the world (ADC)",
      slug: "esp32-analog-sensor",
      contentType: "markdown",
      estMinutes: 15,
      body: body(
        md(`## Analogue-to-Digital Conversion

The real world is analogue: temperature, light, sound, and position vary *continuously*, not in steps of HIGH and LOW. To read these values we need an **ADC** (Analogue-to-Digital Converter). The ADC measures the voltage on a pin and converts it to a number the CPU can work with.

The ESP32's ADC is **12-bit**, which means it divides the full input range into 2¹² = **4 096** steps, from 0 to 4095. For comparison, the Arduino UNO's ADC is only 10-bit (0–1023). More bits means finer resolution — you can detect smaller changes.

The input range is **0 V to 3.3 V** (not 0–5 V like the Arduino UNO). Here is the mapping:

| Voltage on pin | \`analogRead()\` result |
|---|---|
| 0.0 V | 0 |
| 0.825 V | ~1023 |
| 1.65 V | ~2047 |
| 3.3 V | 4095 |

Not every GPIO pin on the ESP32 has an ADC. Pins with ADC capability are labelled **ADC1** or **ADC2** in the datasheet. A reliable rule: **GPIO 32–39** all support ADC1 and work well. Avoid ADC2 pins (GPIO 0, 2, 4, 12–15, 25–27) when Wi-Fi is active — the Wi-Fi radio uses ADC2 internally and interferes with readings.

The best practice for beginner projects: use **GPIO 34 or GPIO 35** — they are input-only ADC1 pins that never conflict with anything.`),
        svg(SVG_ADC_WIRING, "Potentiometer wired between 3.3V and GND with the wiper connected to ESP32 GPIO34 ADC pin"),
        md(`## Wiring a potentiometer

A **potentiometer** (pot) is a variable resistor with three legs:

1. **Left leg** → 3.3 V
2. **Right leg** → GND
3. **Wiper (middle leg)** → GPIO 34

Turn the knob and the wiper moves between the two ends, outputting any voltage from 0 V to 3.3 V. This maps directly to an ADC reading of 0–4095. Potentiometers are perfect for testing ADC code because you can vary the input smoothly and see the Serial Monitor update in real time.

An **LDR** (Light-Dependent Resistor) works just as well: build a voltage divider by putting a 10 kΩ fixed resistor in series with the LDR between 3.3 V and GND, and connect the junction to GPIO 34. More light → lower LDR resistance → higher voltage → higher ADC reading.`),
        code("arduino", ADC_SKETCH, { filename: "adc_read.ino", openInStudio: true }),
        callout("warning", "Never apply more than 3.3 V to an ESP32 GPIO pin. A 5 V sensor output connected directly will damage the chip. If you need to interface a 5 V sensor, use a resistor voltage divider (two resistors) or a dedicated level-shifter module to bring the signal down to a safe range before it reaches the ESP32."),
      ),
    },
  ],

  // -------------------------------------------------------------------------
  // Tasks / challenges
  // -------------------------------------------------------------------------
  tasks: [
    {
      title: "Challenge: ESP32 heartbeat",
      slug: "challenge-esp32",
      description:
        "Print 'esp32 ready' to Serial in setup, then blink GPIO 2 forever.",
      track: "robotics",
      difficulty: "beginner",
      points: 50,
      boardType: "esp32",
      starterCode:
        "void setup() {\n  Serial.begin(115200);\n  // print: esp32 ready\n  pinMode(2, OUTPUT);\n}\nvoid loop() {\n  // blink GPIO 2\n}\n",
      checks: {
        rules: [{ type: "serial_contains", value: "esp32 ready" }],
      },
    },
  ],
};
