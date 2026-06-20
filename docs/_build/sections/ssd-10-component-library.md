# Component and Sensor Library Specification

## Overview

This section specifies the complete catalogue of hardware components that the RoboCode Simulation Engine (RSE) must simulate within RoboCode Studio. It defines per-component behavioural contracts, pin/interface mappings, the schema that every component model must satisfy, and the extensibility mechanism by which new components are added to the library. All component identifiers follow the pattern `CMP-<CATEGORY>-<nnn>` for internal reference.

Cross-references: see Section 8 (Functional Requirements: RoboCode Simulation Engine (RSE)) for the simulation execution model; see Section 9 (Functional Requirements: Code Authoring, Validation and Execution) for how compiled firmware or RoboCode Virtual Machine (RVM) instructions drive component pin states; see Section 3 (System Architecture) for the Wokwi open-source layer (wokwi-elements, avr8js) on which the RSE is built.

---

## Microcontroller Development Boards

The three first-class supported boards are the primary simulation targets: Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico. Every other component in the catalogue connects to one of these boards via breadboard wiring or direct header pins. An extensible, data-driven board library allows platform admins and approved users to add further boards without code changes; see the Board Definition Model subsection below.

### GPIO and Pin Summary: Arduino UNO R3 (ATmega328P)

| Pin Label | GPIO # | Capabilities | Notes |
|-----------|--------|-------------|-------|
| D0 | PD0 | Digital in/out, UART RX | Serial (hardware) |
| D1 | PD1 | Digital in/out, UART TX | Serial (hardware) |
| D2 | PD2 | Digital in/out, INT0 | External interrupt |
| D3 | PD3 | Digital in/out, PWM, INT1 | Timer 2 |
| D4 | PD4 | Digital in/out | |
| D5 | PD5 | Digital in/out, PWM | Timer 0 |
| D6 | PD6 | Digital in/out, PWM | Timer 0 |
| D7 | PD7 | Digital in/out | |
| D8 | PB0 | Digital in/out | |
| D9 | PB1 | Digital in/out, PWM | Timer 1 |
| D10 | PB2 | Digital in/out, PWM, SS | SPI slave-select |
| D11 | PB3 | Digital in/out, PWM, MOSI | SPI |
| D12 | PB4 | Digital in/out, MISO | SPI |
| D13 | PB5 | Digital in/out, SCK | SPI; onboard LED |
| A0 | PC0 | Analog in, Digital in/out | 10-bit ADC ch 0 |
| A1 | PC1 | Analog in, Digital in/out | 10-bit ADC ch 1 |
| A2 | PC2 | Analog in, Digital in/out | 10-bit ADC ch 2 |
| A3 | PC3 | Analog in, Digital in/out | 10-bit ADC ch 3 |
| A4 | PC4 | Analog in, Digital in/out, SDA | I2C data |
| A5 | PC5 | Analog in, Digital in/out, SCL | I2C clock |
| VIN | — | Power input | 7–12 V |
| 5V | — | Regulated output | 5 V supply rail |
| 3.3V | — | Regulated output | 3.3 V supply rail |
| GND | — | Ground | Multiple pins |
| RESET | — | Active-low reset | |
| AREF | — | ADC reference | Analog voltage ref |

ADC resolution: 10-bit (0–1023). PWM frequency: ~490 Hz on pins 5, 6; ~980 Hz on pins 3, 9, 10, 11. Clock: 16 MHz.

### GPIO and Pin Summary: ESP32 DevKit (ESP-WROOM-32)

| Pin Label | GPIO # | Capabilities | Notes |
|-----------|--------|-------------|-------|
| GPIO0 | 0 | Digital, ADC2_CH1, touch | Boot mode select |
| GPIO2 | 2 | Digital, ADC2_CH2, touch | Onboard LED |
| GPIO4 | 4 | Digital, ADC2_CH0, touch | |
| GPIO5 | 5 | Digital, SPI SS | Strapping pin |
| GPIO12 | 12 | Digital, ADC2_CH5, touch, JTAG | Strapping pin |
| GPIO13 | 13 | Digital, ADC2_CH4, touch, JTAG | |
| GPIO14 | 14 | Digital, ADC2_CH6, touch, JTAG | |
| GPIO15 | 15 | Digital, ADC2_CH3, touch, JTAG | Strapping pin |
| GPIO16 | 16 | Digital, UART2 RX | |
| GPIO17 | 17 | Digital, UART2 TX | |
| GPIO18 | 18 | Digital, SPI CLK | |
| GPIO19 | 19 | Digital, SPI MISO | |
| GPIO21 | 21 | Digital, I2C SDA | |
| GPIO22 | 22 | Digital, I2C SCL | |
| GPIO23 | 23 | Digital, SPI MOSI | |
| GPIO25 | 25 | Digital, ADC2_CH8, DAC1 | |
| GPIO26 | 26 | Digital, ADC2_CH9, DAC2 | |
| GPIO27 | 27 | Digital, ADC2_CH7, touch | |
| GPIO32 | 32 | Digital, ADC1_CH4, touch | |
| GPIO33 | 33 | Digital, ADC1_CH5, touch | |
| GPIO34 | 34 | Input only, ADC1_CH6 | No pull-up/down |
| GPIO35 | 35 | Input only, ADC1_CH7 | No pull-up/down |
| GPIO36 (VP) | 36 | Input only, ADC1_CH0 | |
| GPIO39 (VN) | 39 | Input only, ADC1_CH3 | |
| 3.3V | — | Regulated output | 3.3 V rail |
| GND | — | Ground | Multiple pins |
| VIN | — | Power input | 5 V |
| EN | — | Enable (active high) | Chip enable |

ADC: 12-bit (0–4095), two SAR ADC units. PWM: LEDC peripheral, up to 16 channels, configurable frequency and resolution. Clock: 240 MHz dual-core Xtensa LX6. Wi-Fi 802.11 b/g/n and BLE 4.2 simulated at protocol interface level.

### GPIO and Pin Summary: Raspberry Pi Pico (RP2040)

| Pin Label | GPIO # | Capabilities | Notes |
|-----------|--------|-------------|-------|
| GP0 | 0 | Digital in/out, UART0 TX, SPI0 RX, I2C0 SDA, PWM0A | Multifunction |
| GP1 | 1 | Digital in/out, UART0 RX, SPI0 CSn, I2C0 SCL, PWM0B | Multifunction |
| GP2 | 2 | Digital in/out, UART0 CTS, SPI0 SCK, I2C1 SDA, PWM1A | Multifunction |
| GP3 | 3 | Digital in/out, UART0 RTS, SPI0 TX, I2C1 SCL, PWM1B | Multifunction |
| GP4 | 4 | Digital in/out, UART1 TX, SPI0 RX, I2C0 SDA, PWM2A | Multifunction |
| GP5 | 5 | Digital in/out, UART1 RX, SPI0 CSn, I2C0 SCL, PWM2B | Multifunction |
| GP6 | 6 | Digital in/out, UART1 CTS, SPI0 SCK, I2C1 SDA, PWM3A | Multifunction |
| GP7 | 7 | Digital in/out, UART1 RTS, SPI0 TX, I2C1 SCL, PWM3B | Multifunction |
| GP8 | 8 | Digital in/out, UART1 TX, SPI1 RX, I2C0 SDA, PWM4A | Multifunction |
| GP9 | 9 | Digital in/out, UART1 RX, SPI1 CSn, I2C0 SCL, PWM4B | Multifunction |
| GP10 | 10 | Digital in/out, UART1 CTS, SPI1 SCK, I2C1 SDA, PWM5A | Multifunction |
| GP11 | 11 | Digital in/out, UART1 RTS, SPI1 TX, I2C1 SCL, PWM5B | Multifunction |
| GP12 | 12 | Digital in/out, UART0 TX, SPI1 RX, I2C0 SDA, PWM6A | Multifunction |
| GP13 | 13 | Digital in/out, UART0 RX, SPI1 CSn, I2C0 SCL, PWM6B | Multifunction |
| GP14 | 14 | Digital in/out, UART0 CTS, SPI1 SCK, I2C1 SDA, PWM7A | Multifunction |
| GP15 | 15 | Digital in/out, UART0 RTS, SPI1 TX, I2C1 SCL, PWM7B | Multifunction |
| GP16 | 16 | Digital in/out, UART0 TX, SPI0 RX, I2C0 SDA, PWM0A | Multifunction |
| GP17 | 17 | Digital in/out, UART0 RX, SPI0 CSn, I2C0 SCL, PWM0B | Multifunction |
| GP18 | 18 | Digital in/out, UART0 CTS, SPI0 SCK, I2C1 SDA, PWM1A | Multifunction |
| GP19 | 19 | Digital in/out, UART0 RTS, SPI0 TX, I2C1 SCL, PWM1B | Multifunction |
| GP20 | 20 | Digital in/out, UART1 TX, SPI0 RX, I2C0 SDA, PWM2A | Multifunction |
| GP21 | 21 | Digital in/out, UART1 RX, SPI0 CSn, I2C0 SCL, PWM2B | Multifunction |
| GP22 | 22 | Digital in/out, UART1 CTS, SPI0 SCK, I2C1 SDA, PWM3A | Multifunction |
| GP26 | 26 | Digital in/out, ADC ch 0 | ADC-capable |
| GP27 | 27 | Digital in/out, ADC ch 1 | ADC-capable |
| GP28 | 28 | Digital in/out, ADC ch 2 | ADC-capable |
| ADC_TEMP | — | Internal temperature sensor | ADC ch 4 (internal) |
| 3V3(OUT) | — | Regulated output | 3.3 V supply rail |
| VSYS | — | Power input / output | 1.8–5.5 V |
| VBUS | — | USB bus voltage sense | 5 V from USB |
| GND | — | Ground | Multiple pins |
| RUN | — | Active-low reset | |
| SWDIO / SWCLK | — | SWD debug interface | Debug and programming |

ADC resolution: 12-bit (0–4095) on GP26–GP28 and internal temperature sensor. PWM: 16 channels across 8 slices (PWM0–PWM7), each slice has A/B outputs; configurable frequency and wrap value. PIO: 2x PIO blocks, 4 state machines each (8 total), used to bit-bang arbitrary protocols. Clock: dual-core ARM Cortex-M0+ at up to 133 MHz. Logic levels: 3.3 V only. GP23–GP25 are used by the Pico's on-board components (power-save control, VBUS sense, and onboard LED respectively); GP24 and GP25 are not exposed on header pins.

### Board Component Table

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| Arduino UNO R3 | ATmega328P | USB-B, headers | Full AVR firmware execution via avr8js; GPIO, ADC, PWM, UART, SPI, I2C | 16 MHz; 32 KB flash; 2 KB SRAM |
| ESP32 DevKit | ESP-WROOM-32 | USB-micro, headers | ESP32 core simulation; GPIO, ADC, DAC, PWM, UART, SPI, I2C, Wi-Fi/BLE protocol | 240 MHz; 4 MB flash; 520 KB SRAM |
| Raspberry Pi Pico | RP2040 | USB-micro, 40-pin header | Full RP2040 firmware execution via rp2040js; GPIO, ADC, PWM, PIO, UART, SPI, I2C, USB 1.1 | 133 MHz dual-core; 264 KB SRAM; 2 MB QSPI flash |

### Board Definition Model

RoboCode Studio uses the **wokwi-boards** definition format (github.com/wokwi/wokwi-boards) as its canonical, data-driven board schema. Adding a board requires no code change to the RSE; it is a purely data-driven operation.

#### Board Manifest Format

A board is described by a **board.json** manifest file accompanied by an SVG visual asset. The manifest structure is:

```
Board Manifest Schema (wokwi-boards format)
────────────────────────────────────────────────────────────────────
Field               Type            Required   Description
────────────────────────────────────────────────────────────────────
name                string          Yes        Human-readable board name
               e.g. "My Custom ESP32-S3 Board"
mcuCore             enum            Yes        Simulator binding:
                                               avr8js | rp2040js | esp32-core
pins[]              array           Yes        Ordered list of pin descriptors
  .name             string          Yes        Pin label, e.g. "GP0", "D13", "GND"
  .type             enum            Yes        gpio | analog | i2c | spi | uart |
                                               power | ground
  .x                number          Yes        X position of pin on SVG canvas (px)
  .y                number          Yes        Y position of pin on SVG canvas (px)
assets.svg          string (path)   Yes        Path to SVG board illustration
────────────────────────────────────────────────────────────────────
```

Each pin's `type` tells the RSE and DRC subsystem what signal class the pin carries. The `x`/`y` coordinates position the interactive pin node on the rendered 2D canvas. The `mcuCore` field binds the board to its simulator engine: `avr8js` for AVR-based boards (e.g. Arduino UNO/Nano/Mega), `rp2040js` for RP2040-based boards (e.g. Raspberry Pi Pico), and `esp32-core` for ESP32-family boards.

#### Built-In Board Library

The standard wokwi-boards library ships built in to RoboCode Studio and includes, at minimum:

```
Built-in board library (wokwi-boards)
──────────────────────────────────────────────────────────────────
  Board                        MCU Core Target
  ───────────────────────────  ───────────────
  Arduino UNO R3 (ATmega328P)  avr8js
  Arduino Nano (ATmega328P)    avr8js
  Arduino Mega 2560            avr8js
  ESP32 DevKit (ESP-WROOM-32)  esp32-core
  ESP32-S2 DevKit              esp32-core
  ESP32-S3 DevKit              esp32-core
  Raspberry Pi Pico (RP2040)   rp2040js
  (additional Wokwi boards)    (per manifest)
──────────────────────────────────────────────────────────────────
```

#### Custom Board Upload, Validation, and Approval

Platform admins and approved advanced users or teachers may upload custom board definitions. The upload and activation flow is:

```
Custom Board Definition Flow
──────────────────────────────────────────────────────────────────
  Platform Admin / Approved Teacher
         │
         ▼
  Upload board.json + SVG asset bundle
         │
         ▼
  ┌─────────────────────────────────────────────────┐
  │  Board Definition Validator (RSE)               │
  │  - JSON schema check (wokwi-boards schema)      │
  │  - Pin sanity check (names unique, type enum    │
  │    valid, x/y within SVG viewport)              │
  │  - SVG/asset safety scan (no scripts, no        │
  │    external references)                         │
  │  - mcuCore value must be a supported target     │
  └───────────────┬─────────────────────────────────┘
                  │
          ┌───────┴───────┐
          │ Admin upload? │
          └───────┬───────┘
         Yes      │        No (non-admin)
          │       │              │
          ▼       │              ▼
  Activate        │   Enters moderation queue
  immediately     │   (standard approval workflow)
                  │              │
                  │              ▼
                  │   Reviewed by Platform Admin
                  │              │
                  │         Approved
                  │              │
                  └──────────────┘
                         │
                         ▼
  Board available in Studio board selector,
  bound to its mcuCore simulation engine
──────────────────────────────────────────────────────────────────
```

Non-admin uploads pass through the standard approval and moderation workflow before becoming available to learners. Rejected manifests receive a structured validation report identifying which checks failed.

#### Functional Requirements: Board Definition Model

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-213 | RoboCode Studio shall support three first-class boards: Arduino UNO R3 (avr8js), ESP32 DevKit (ESP32 core), and Raspberry Pi Pico (rp2040js); all three shall be available in the board selector without any additional configuration | Must | All three boards verified in simulation integration tests |
| FR-SIM-214 | The RSE shall use the wokwi-boards manifest format (board.json with name, mcuCore, pins[].name/type/x/y, and SVG asset) as the canonical board definition schema | Must | CI schema validator rejects malformed board manifests |
| FR-SIM-215 | The built-in board library shall ship with the full standard wokwi-boards set, including at minimum the Arduino UNO/Nano/Mega, ESP32 DevKit family, and Raspberry Pi Pico | Must | Verified at build time; board manifest count asserted in CI |
| FR-SIM-216 | Platform admins shall be able to upload custom board definitions (board.json + SVG) via the Studio admin UI; valid uploads shall be activated immediately without code deployment | Must | Admin upload flow tested end-to-end; no RSE restart required |
| FR-SIM-217 | Non-admin uploads of custom board definitions shall enter the platform moderation queue and require explicit admin approval before becoming visible to learners | Must | Moderation queue entry and approval UI tested; unapproved boards not surfaced in learner board selector |
| FR-SIM-218 | The board definition validator shall enforce: JSON schema conformance, unique pin names, valid pin type enum values, x/y coordinates within SVG viewport bounds, a recognised mcuCore value, and SVG asset safety (no embedded scripts, no external URL references) | Must | Validator rejects each invalid case; structured error report returned |
| FR-SIM-219 | Each board definition shall declare its mcuCore binding (avr8js, rp2040js, or esp32-core); the RSE shall instantiate the correct simulator engine for firmware execution based solely on this field | Must | Incorrect mcuCore value rejected at validation; engine selection tested per board type |
| DR-BOARD-001 | The board manifest store shall record: board id, display name, mcuCore target, pin definitions (name/type/x/y), SVG asset reference, uploader identity, approval status, approval timestamp, and RSE version compatibility | Must | Schema defined in Section 15 (Data Architecture) |

---

## Prototyping and Wiring Components

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| Full breadboard | 830 tie-point | N/A | Node-based netlist connectivity; power rails auto-split | 63 rows, 2 power rails |
| Half breadboard | 400 tie-point | N/A | Same netlist model, smaller canvas footprint | 30 rows, 2 power rails |
| Jumper wire (M-M) | Generic | N/A | Zero-resistance conductor; connects two nodes | Colours selectable |
| Jumper wire (M-F) | Generic | N/A | As above; pin to socket | Colours selectable |
| Jumper wire (F-F) | Generic | N/A | As above; socket to socket | Colours selectable |
| Breadboard PSU module | Generic 3.3V/5V | DC barrel / USB | Supplies 3.3 V or 5 V to power rails; toggle switch simulated | Output: 3.3 V or 5 V, up to 700 mA |
| USB cable | USB-A to USB-B/Micro | USB | Power and serial passthrough to board | USB 2.0 simulated |
| Battery holder | AA × 4 | Wires | 6 V supply source; internal resistance modelled | 4 × 1.5 V AA |

---

## LEDs and Display Components

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| Single LED (red/green/blue/yellow) | Generic 5mm | Anode, cathode | Illuminates when forward voltage met; brightness scales with current via PWM duty | Vf ≈ 2.0–3.4 V; If ≈ 20 mA |
| RGB LED | Common anode / cathode | R, G, B, common | Each channel independently driven; additive colour mixing rendered | Per-channel Vf 2.0–3.4 V |
| LED bar graph | 10-segment bar | 10 anodes, common | Segments light independently; useful for level/progress display | Standard 2 V forward drop |
| 7-segment (1 digit) | Generic | 7 segment + DP | Decodes a–g segments; decimal point; common anode or cathode | Multiplexed or direct |
| 7-segment (4 digit) | TM1637 / direct | I2C (TM1637) or 12 pins | TM1637 variant receives I2C commands; direct variant multiplexes digits | BCD or raw segment |
| 8×8 LED matrix | MAX7219 | SPI (DIN/CLK/CS) | Receives SPI frames; renders 64-pixel bitmap | Cascade-able; intensity control |
| LCD 16×2 | HD44780 | 4-bit/8-bit parallel or I2C (PCF8574) | Renders characters in CGROM; custom characters; cursor/blink | 5×8 dot matrix characters |
| LCD 20×4 | HD44780 | 4-bit/8-bit parallel or I2C | As above; 4 lines × 20 chars | Extended row/column model |
| OLED 0.96" | SSD1306 | I2C (0x3C/0x3D) or SPI | 128×64 pixel monochrome buffer; graphics and text rendering via Adafruit/U8g2 API | 3.3 V / 5 V |
| WS2812 NeoPixel ring | WS2812B | Single-wire (DIN) | Addressable per-LED RGB; receives 24-bit GRB protocol pulses; renders full colour | 5 V; 60 mA/LED max |
| WS2812 NeoPixel strip | WS2812B | Single-wire (DIN) | As ring; configurable LED count (8, 16, 30, 60 per metre) | Cascade-able |

---

## Passives and Discrete Components

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| Resistor | Generic (E24 series) | 2 terminals | Ohm's-law voltage divider in netlist; colour-band label | 220 Ω, 330 Ω, 1 kΩ, 10 kΩ etc. |
| Rotary potentiometer | 10 kΩ / B10K | Wiper, 2 ends | Wiper position (0–100 %) mapped to resistance ratio; draggable UI knob | 10 kΩ linear; 270° rotation |
| Capacitor (ceramic/electrolytic) | Generic | 2 terminals | Charge/discharge modelled for RC circuits; polarity enforced on electrolytic | 100 nF, 10 µF, 100 µF values |
| Diode | 1N4007 | Anode, cathode | Forward drop ~0.7 V; reverse blocking; polarity warning | Vf = 0.7 V; Vr = 1000 V |
| NPN transistor | 2N2222 / BC547 | B, C, E | Saturation/cutoff switching model; current gain (hFE) applied | hFE ≈ 100–300 |
| PNP transistor | 2N3906 / BC557 | B, C, E | Complementary switching model | hFE ≈ 100–300 |
| Photoresistor (LDR) | GL5528 | 2 terminals | Resistance varies with simulated ambient light level (0–100 klux slider) | Dark ~1 MΩ; bright ~1 kΩ |
| Thermistor (NTC) | 10 kΩ NTC | 2 terminals | Resistance follows Steinhart–Hart equation with configurable temperature | 10 kΩ at 25 °C; B = 3950 K |

---

## Input Sensors

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| Push button | Tactile switch | 2 / 4 pins | Momentary NO contact; pull-up or pull-down configurable; bounce model optional | 6×6 mm standard |
| Tilt / ball switch | SW-200D | 2 pins | Binary state toggled via canvas orientation control | 5 V; active-low / active-high |
| PIR motion sensor | HC-SR501 | VCC, OUT, GND | OUT goes HIGH on simulated motion event; sensitivity and hold-time sliders | 3–7 V; trigger delay configurable |
| Ultrasonic distance | HC-SR04 | VCC, Trig, Echo, GND | Echo pulse width = 2 × distance / 340 m s-1; distance slider 2–400 cm | 5 V; 40 kHz |
| IR receiver | VS1838B + NEC remote | DATA, VCC, GND | Decodes NEC protocol frames from virtual remote button presses | 38 kHz carrier |
| IR obstacle sensor | FC-51 | VCC, GND, OUT | OUT LOW when obstacle within detection range; range slider | 3.3–5 V; 2–30 cm |
| Line-tracking sensor | TCRT5000 | VCC, GND, DO, AO | Digital and analog outputs; surface reflectivity slider (white/black) | 5 V |
| DHT11 | DHT11 | DATA, VCC, GND | Outputs 1-wire encoded temperature (0–50 °C) and humidity (20–90 % RH); sliders | ±2 °C; ±5 % RH accuracy |
| DHT22 | AM2302 | DATA, VCC, GND | Higher accuracy 1-wire sensor; -40–80 °C; 0–100 % RH sliders | ±0.5 °C; ±2 % RH |
| LM35 temperature | LM35 | VCC, VOUT, GND | Analog output: 10 mV/°C; temperature slider | 0–100 °C range |
| DS18B20 temperature | DS18B20 | VCC, DQ, GND | 1-Wire; 12-bit resolution; temperature slider; multi-drop address | -55–125 °C; ±0.5 °C |
| MPU6050 accel/gyro | MPU-6050 | I2C (0x68/0x69) | Returns 16-bit accel/gyro register values; orientation sliders (X/Y/Z tilt) | 6-DOF; 3.3–5 V |
| Sound/microphone sensor | KY-038 | VCC, GND, DO, AO | AO proportional to sound amplitude; DO threshold trigger; amplitude slider | 5 V |
| Water-level sensor | Generic | S, +, - | Analog output proportional to immersion depth; depth slider 0–100 % | 3.3–5 V |
| Soil moisture sensor | Generic capacitive | AOUT, DOUT, VCC, GND | Analog output inversely proportional to moisture; moisture slider | 3.3–5 V |
| Gas sensor | MQ-2 | AOUT, DOUT, VCC, GND | Analog output proportional to gas concentration; ppm slider (LPG/smoke/H2) | 5 V; warm-up simulated |
| Flame sensor | IR flame module | DO, AO, VCC, GND | DO LOW when flame wavelength (760–1100 nm) detected; flame toggle | 3.3–5 V |
| Hall sensor | A3144 / KY-024 | VCC, GND, DO, AO | DO LOW when magnetic field exceeds threshold; field strength slider | 5 V |
| Rotary encoder | KY-040 | CLK, DT, SW, VCC, GND | Quadrature outputs on rotation; button on SW; step count configurable | 20 pulses/revolution |
| Analog joystick | KY-023 | VRx, VRy, SW, VCC, GND | X and Y axes produce 0–1023 ADC values; interactive on-canvas joystick widget | 5 V |
| 4×4 membrane keypad | Generic | 8 lines (4 row + 4 col) | Matrix scanning; key press simulation via on-canvas keyboard UI | Standard ASCII layout |
| RFID reader | RC522 | SPI (MOSI/MISO/SCK/SS) + RST/IRQ | Emulates card read; configurable UID returned on virtual card tap | 13.56 MHz; 3.3 V |

---

## Actuators and Output Components

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| Active buzzer | Generic 5 V | VCC, GND | Produces tone at fixed frequency when energised; visual and WebAudio output | 2400 Hz fixed; 5 V |
| Passive buzzer | Generic | Signal, GND | Tone frequency follows PWM signal frequency; pitch varies; WebAudio output | 1–20 kHz range |
| DC motor | Generic / FA-130 | M+, M- | Speed proportional to PWM duty; direction from H-bridge polarity; animated | 3–6 V; stall current modelled |
| L293D motor driver | L293D | 16-pin DIP | Dual H-bridge; enables bidirectional drive of 2 DC motors; enable/logic inputs | 4.5–36 V; 600 mA/ch |
| L298N motor driver | L298N module | IN1/2/3/4, ENA, ENB | Dual H-bridge module; higher current capacity; PWM speed + direction control | 5–35 V; 2 A/ch |
| SG90 servo | Tower Pro SG90 | Signal, VCC, GND | Angle 0–180° maps to 1–2 ms PWM pulse width; visual rotation on canvas | 5 V; 50 Hz PWM |
| 28BYJ-48 stepper | 28BYJ-48 | 4 coil pins | Half-step / full-step sequence; animated rotation; step counter | 5 V unipolar |
| ULN2003 driver | ULN2003A | 7 Darlington pairs | Drives 28BYJ-48 coils from logic-level GPIO; flyback diodes included | 50 V; 500 mA/ch |
| Relay module | SRD-05VDC-SL-C | IN, VCC, GND; NO, NC, COM | Coil driven by GPIO; simulated switching of load circuit; click sound; LED indicator | 5 V coil; 10 A/250 VAC load |
| Fan (DC) | Generic 5 V | VCC, GND | Speed proportional to voltage/PWM; animated blade rotation | 5 V; current proportional to speed |

---

## Communications and Interface Modules

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| HC-05 Bluetooth | HC-05 | UART (TX/RX), STATE, EN | AT command mode and data-pass-through mode; virtual serial terminal | v2.0 Classic BT; 9600–115200 baud |
| HC-06 Bluetooth | HC-06 | UART (TX/RX) | Slave-only BT serial; data echoed to virtual terminal | v2.0 Classic BT |
| ESP32 Wi-Fi/BLE | On-board ESP-WROOM-32 | Internal | HTTP/WebSocket requests route to simulated server stub; BLE GATT service | 802.11 b/g/n; BLE 4.2 |
| nRF24L01 | nRF24L01+ | SPI + CE/CSN | Simulated packet transmission between two nRF24 instances on same canvas | 2.4 GHz; 250 kbps–2 Mbps |
| RTC DS1307 | DS1307 | I2C (0x68) | Returns simulated date/time; settable via canvas clock widget; battery-backed | 3.3–5 V; 56-byte NV RAM |
| RTC DS3231 | DS3231 | I2C (0x68) | High-accuracy TCXO; temperature-compensated; temperature register readable | ±2 ppm; -40–85 °C |
| MicroSD module | Generic SPI | SPI + CS | File read/write operations logged to in-browser virtual FAT32 filesystem | 3.3 V logic; SPI mode |
| 74HC595 shift register | 74HC595 | SPI-like (DATA/CLK/LATCH) | 8-bit serial-in parallel-out; cascade-able; 8 output pins driven from 3 MCU pins | 2–6 V; 70 mA total |

---

## Power Components

| Component | Part / Model | Interface | Simulated Behaviour | Key Parameters |
|-----------|-------------|-----------|--------------------|--------------------|
| 9 V battery | 6F22 | Snap connector | 9 V DC source; internal resistance 1–2 Ω; capacity slider for drain simulation | 9 V; ~500 mAh |
| AA battery holder | 4 × AA | Wire terminals | 6 V from four 1.5 V cells; capacity proportional to current draw | 6 V; ~2500 mAh |
| 3.7 V Li-ion cell | 18650 | Wire terminals | LiPo/Li-ion source; discharge curve modelled; low-voltage cutoff warning | 3.7 V nominal; 2000–3000 mAh |
| Breadboard PSU | MB102 | DC barrel or USB | Supplies 3.3 V and/or 5 V rails simultaneously via onboard regulators | 6.5–12 V in; 700 mA out |

---

## Component Model Schema

Every simulated component is described by a JSON manifest that the RSE loads at startup or when a new component is installed. The schema below is normative.

```
Component Manifest Schema
─────────────────────────────────────────────────────────────────────
Field               Type            Required   Description
────────────────────────────────────────────────────────────────────
id                  string          Yes        Unique identifier, e.g. "cmp-dht11"
displayName         string          Yes        Human-readable label shown in UI
category            enum            Yes        boards | wiring | leds | passives |
                                               sensors | actuators | comms | power
version             semver string   Yes        Manifest version (e.g. "1.0.0")
wokwiId             string          No         Wokwi element tag if reusing upstream
                                               component (e.g. "wokwi-dht22")
assets.2d           string (URL)    Yes        Path to SVG or wokwi-element web
                                               component tag name
assets.3d           string (URL)    No         Path to GLTF/GLB model; omit for
                                               2D-only components
pins[]              array           Yes        Ordered list of pin descriptors
  .name             string          Yes        Pin name (e.g. "VCC", "DATA", "A0")
  .direction        enum            Yes        in | out | inout | power | gnd
  .signalType       enum            Yes        digital | analog | pwm | i2c_sda |
                                               i2c_scl | spi_mosi | spi_miso |
                                               spi_clk | spi_cs | uart_tx | uart_rx |
                                               onewire | power | gnd
  .defaultState     number | null   No         Voltage level at reset (V)
electricalParams    object          No         Datasheet-derived parameters:
  .supplyVoltage    string          No         e.g. "3.3-5.5"
  .supplyCurrentMa  number          No         Typical supply current in mA
  .forwardVoltagV   number          No         LED Vf in volts
  .resistanceOhm    number          No         For resistors/potentiometers
  .outputType       enum            No         analog | digital | pwm
behaviourHooks      object          Yes        Entry points for RSE integration
  .onPinChange      string          No         JS/WASM function called on pin event
  .onSimTick        string          No         Called every simulation tick (ms)
  .onReset          string          No         Called on simulator reset
  .onUserInput      string          No         Called on interactive UI event
                                               (knob turn, slider move, button press)
configurableProps[] array           No         User-adjustable properties exposed
                                               in the component inspector panel
  .key              string          Yes        Property key (e.g. "temperature")
  .label            string          Yes        UI label (e.g. "Temperature (°C)")
  .type             enum            Yes        slider | toggle | select | number |
                                               color | text
  .default          any             Yes        Default value
  .min / .max       number          No         Bounds for slider/number
  .options[]        string[]        No         Options list for select type
datasheetRef        string (URL)    No         Link to manufacturer datasheet or
                                               Wokwi component documentation
tags[]              string[]        No         Search/filter tags (e.g. "i2c","sensor")
compatibleBoards[]  string[]        Yes        List of board ids this component works
                                               with (e.g. ["cmp-uno-r3","cmp-esp32",
                                               "cmp-pico"])
minRSEVersion       semver string   Yes        Minimum RSE version required
────────────────────────────────────────────────────────────────────
```

### Pin Descriptor Detail

Each element of `pins[]` represents one physical or logical pin on the component. Pins must be ordered to match the physical pin-numbering convention of the component (left-to-right, top-to-bottom on the 2D canvas). The `signalType` field is used by the RSE netlist validator (see Section 8) to enforce compatibility: connecting an `i2c_sda` pin to an `analog` pin generates a design-rule-check (DRC) warning in RoboCode Studio.

### Behaviour Hooks

Behaviour hooks are the integration points between the component manifest and the RSE execution engine. The RSE calls these hooks at defined lifecycle events:

- `onReset` — invoked when the user presses the simulator reset button or at first power-on. The component should initialise all internal state and drive pin outputs to their default values.
- `onSimTick` — invoked at each simulation time step (configurable granularity, typically 1 ms). Used for sensors that must update analog outputs continuously (e.g. thermistor, LDR).
- `onPinChange` — invoked whenever a connected pin changes state (voltage level or direction). The hook receives the pin name, old value, and new value. The component model uses this to update internal registers or trigger protocol state machines (e.g. DHT11 timing FSM, SPI shift register clocking).
- `onUserInput` — invoked when a student interacts with a configurable property in the inspector panel (e.g. moves a temperature slider). The hook updates the component's internal simulation parameters and may immediately drive output pins to reflect the new condition.

---

## Component Extensibility: Manifest Registry

The RSE loads components from a registry. The built-in library ships with all components defined in this specification. Third-party and future components can be added via the Component Manifest Extensibility Model.

```
Manifest Registry Flow
──────────────────────────────────────────────────────────────────
  Platform Admin / Developer
         │
         ▼
  Submit manifest.json + asset bundle
  (SVG, GLTF, behaviour hook JS/WASM)
         │
         ▼
  ┌─────────────────────────────────────────────────┐
  │  Manifest Validator (RSE)                       │
  │  - Schema validation (JSON Schema draft-07)     │
  │  - Pin compatibility checks                     │
  │  - Asset integrity (SHA-256 checksums)          │
  │  - Behaviour hook sandbox (WASM runtime)        │
  └─────────────────┬───────────────────────────────┘
                    │ Pass
                    ▼
  ┌─────────────────────────────────────────────────┐
  │  Component Registry (PostgreSQL + S3)           │
  │  - Stored per tenant or global scope            │
  │  - Versioned; rollback supported                │
  │  - Published to RSE component cache (Redis)     │
  └─────────────────┬───────────────────────────────┘
                    │
                    ▼
  Available in RoboCode Studio component palette
──────────────────────────────────────────────────────────────────
```

### Functional Requirements: Component Library

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-200 | The RSE shall simulate all boards (Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico), wiring, LED/display, passive, sensor, actuator, comms, and power components listed in this section | Must | All items in catalogue tables above verified in simulation integration tests |
| FR-SIM-201 | Every component shall have a conforming manifest.json satisfying the schema defined in this section | Must | CI schema validator rejects malformed manifests |
| FR-SIM-202 | Component 2D assets shall use wokwi-elements web components where available, with custom SVG fallbacks for components not in the upstream library | Must | Wokwi element tag referenced in `wokwiId`; custom SVG supplied otherwise |
| FR-SIM-203 | Component 3D assets shall be GLTF/GLB models consumed by Three.js via React Three Fiber; components without 3D assets shall gracefully render in 2D mode only | Should | No broken canvas if 3D model absent |
| FR-SIM-204 | The RSE shall invoke `onReset`, `onSimTick`, `onPinChange`, and `onUserInput` hooks as specified; hooks shall execute inside a sandboxed WASM runtime to prevent arbitrary code execution | Must | Hook sandbox tested with malicious input; no host API escape |
| FR-SIM-205 | The DRC subsystem shall emit a warning when pins of incompatible `signalType` are connected | Should | Warnings displayed inline in the canvas wiring layer; does not block simulation |
| FR-SIM-206 | The component registry shall support tenant-scoped custom components uploaded by a School Admin | Could | Uploaded component assets stored in S3 with tenant prefix and served via CDN |
| FR-SIM-207 | Component manifests shall include a `minRSEVersion` field; the RSE shall refuse to load a component whose minimum version exceeds the running RSE version | Must | Version comparison performed at registry load time |
| FR-SIM-208 | Configurable properties defined in `configurableProps[]` shall be exposed in the component inspector panel within RoboCode Studio; changes shall take effect without restarting the simulation | Must | See Section 7 (RoboCode Studio IDE) for inspector panel spec |
| FR-SIM-209 | The RSE shall model electrical supply limits: components drawing current beyond their rated maximum shall display an over-current warning and optionally halt simulation | Should | Modelled per `supplyCurrentMa` in `electricalParams` |
| FR-SIM-210 | Power simulation shall track the cumulative current draw on each supply rail (5 V, 3.3 V) and warn when the board's regulator output current is exceeded | Should | Arduino UNO 5 V rail: 500 mA max from USB; ESP32 3.3 V rail: 600 mA max; Raspberry Pi Pico 3.3 V rail: 300 mA max (RT6150 regulator) |
| FR-SIM-211 | The platform shall ship a Component Library Browser in RoboCode Studio allowing students to search, filter by category/tag/board, and preview components before placing them on the canvas | Must | Filters use `tags[]` and `compatibleBoards[]` from manifest |
| FR-SIM-212 | Interactive simulation controls (sliders, toggles, joystick, keypad buttons) for each component shall be accessible via keyboard and meet WCAG 2.2 AA; see Section 20 | Must | See Section 20 (Accessibility) |

---

## Wokwi Open-Source Integration Notes

The RSE is built on top of the Wokwi open-source ecosystem (https://github.com/wokwi). Specifically:

- **wokwi-elements**: web components providing pixel-accurate 2D renderings of hardware components. Where a wokwi-element exists for a component in this catalogue, the RSE uses it directly (referenced via `wokwiId` in the manifest) rather than duplicating a custom SVG. This ensures visual fidelity with the reference implementation and reduces maintenance burden.
- **avr8js**: JavaScript/WASM library that emulates the ATmega328P at the instruction level. The RSE runs the student's compiled Arduino C/C++ sketch as real firmware inside avr8js, which then drives GPIO pin states that are fed into the component behaviour hooks. This provides cycle-accurate simulation of timing-sensitive protocols (DHT11 1-Wire, WS2812 bit-banging, servo PWM).
- **rp2040js** (github.com/wokwi/rp2040js): JavaScript/WASM library that runs real RP2040 firmware in the browser. The RSE loads a UF2 or ELF firmware image (MicroPython, CircuitPython, or C/C++ compiled with the Arduino-Pico core or the Pico SDK) into rp2040js, which executes it on a dual-core ARM Cortex-M0+ emulator at up to 133 MHz. GPIO pin states produced by rp2040js are fed into the component behaviour hook pipeline identically to the avr8js path, enabling accurate simulation of PIO state machines, multi-core workloads, and RP2040-specific peripherals. The near-term Pico W variant (CYW43439 Wi-Fi/BLE) is a planned roadmap addition to rp2040js integration.
- **wokwi-boards**: the board definition library (github.com/wokwi/wokwi-boards) that ships built-in board manifests for Arduino UNO/Nano/Mega, the ESP32 family, the Raspberry Pi Pico, and more. This library is the canonical source for the RSE board catalogue; custom boards uploaded by admins or approved teachers extend it using the same manifest format. See the Board Definition Model subsection above.
- **ESP32 core simulation**: a complementary simulation layer for the ESP32. The RSE integrates the available Wokwi ESP32 core or an equivalent open-source ESP32 simulation library. Where full core simulation is not available for a peripheral, the RSE falls back to protocol-level simulation (the component's `onPinChange` hook interprets the signal independently of the MCU simulation).

Platform engineers must monitor the upstream Wokwi repositories for new component releases and incorporate them into the RSE manifest registry using the defined schema. The `wokwiId` field in the manifest creates a direct link between the platform's component record and the upstream element, simplifying future updates.

---

## Cross-References

- Section 7 — RoboCode Studio IDE: canvas drag-and-drop, component palette, wiring layer, inspector panel, and component preview.
- Section 8 — Functional Requirements: RoboCode Simulation Engine (RSE): netlist solver, simulation tick loop, pin-state propagation, DRC subsystem, and 2D/3D rendering pipeline.
- Section 9 — Functional Requirements: Code Authoring, Validation and Execution: how compiled AVR firmware (avr8js), RP2040 firmware (rp2040js), ESP32 firmware, and RVM instructions drive pin states that flow into component behaviour hooks.
- Section 15 — Data Architecture and Database Design: component manifest storage schema in PostgreSQL; board manifest store schema (DR-BOARD-001); asset storage in S3.
- Section 17 — Non-Functional Requirements: performance targets for simulation tick rate (FR-SIM-200 through FR-SIM-219 above), asset loading latency, and concurrency.
- Section 20 — Accessibility, Internationalisation and Low-Bandwidth Design: WCAG 2.2 AA requirements for interactive component controls; progressive asset loading for low-bandwidth African networks.
