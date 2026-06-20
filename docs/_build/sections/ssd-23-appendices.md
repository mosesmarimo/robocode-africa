# Appendices

This section collects normative and informative reference material that supports the body of the RoboCode.Africa System Specification Document (SSD). Each appendix is self-contained and cross-references the relevant functional, non-functional, data, and security requirements by identifier.

---

## Appendix A: Pin Reference Tables

The tables in this appendix provide the authoritative pin-reference data for the three first-class supported development boards: Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico. They complement the GPIO and pin summaries in Section 10 (Component and Sensor Library Specification) and are the definitive reference for requirements FR-SIM-001 through FR-SIM-050 and for all wiring validation logic in the RoboCode Simulation Engine (RSE).

### A.1 Arduino UNO R3 (ATmega328P) — Complete Pin Reference

Processor: ATmega328P (AVR 8-bit RISC). Clock: 16 MHz. Operating voltage: 5 V. Flash: 32 KB. SRAM: 2 KB. EEPROM: 1 KB. Simulated by `avr8js`.

| Pin Label | Port/Bit | Capabilities | Protocol Role | Notes |
|-----------|----------|--------------|---------------|-------|
| D0 | PD0 | Digital in/out, UART RX | UART0 RX | Shared with Serial; avoid for GPIO if Serial in use |
| D1 | PD1 | Digital in/out, UART TX | UART0 TX | Shared with Serial; avoid for GPIO if Serial in use |
| D2 | PD2 | Digital in/out, INT0 | External interrupt 0 | Rising/falling/change trigger |
| D3 | PD3 | Digital in/out, PWM, INT1 | Timer2 OC2B; INT1 | PWM ~490 Hz |
| D4 | PD4 | Digital in/out | — | General GPIO |
| D5 | PD5 | Digital in/out, PWM | Timer0 OC0B | PWM ~980 Hz |
| D6 | PD6 | Digital in/out, PWM | Timer0 OC0A | PWM ~980 Hz |
| D7 | PD7 | Digital in/out | — | General GPIO |
| D8 | PB0 | Digital in/out | ICP1 (input capture) | Timer1 input capture |
| D9 | PB1 | Digital in/out, PWM | Timer1 OC1A | PWM ~490 Hz |
| D10 | PB2 | Digital in/out, PWM, SS | Timer1 OC1B; SPI SS | SPI slave-select when SPI active |
| D11 | PB3 | Digital in/out, PWM, MOSI | Timer2 OC2A; SPI MOSI | PWM ~490 Hz; SPI data out |
| D12 | PB4 | Digital in/out, MISO | SPI MISO | SPI data in |
| D13 | PB5 | Digital in/out, SCK | SPI SCK | Onboard LED (active HIGH) |
| A0 | PC0 | Analog in / Digital in/out | ADC channel 0 | 10-bit ADC; 0–5 V range |
| A1 | PC1 | Analog in / Digital in/out | ADC channel 1 | 10-bit ADC |
| A2 | PC2 | Analog in / Digital in/out | ADC channel 2 | 10-bit ADC |
| A3 | PC3 | Analog in / Digital in/out | ADC channel 3 | 10-bit ADC |
| A4 | PC4 | Analog in / Digital in/out, SDA | ADC ch 4; I2C SDA | I2C data line |
| A5 | PC5 | Analog in / Digital in/out, SCL | ADC ch 5; I2C SCL | I2C clock line |
| VIN | — | Power input | — | 7–12 V DC via barrel jack |
| 5V | — | Regulated power output | — | 500 mA max from USB |
| 3.3V | — | Regulated power output | — | 50 mA max; from onboard regulator |
| GND | — | Ground reference | — | Multiple pins |
| RESET | — | Active-low MCU reset | — | Pulled HIGH internally |
| AREF | — | ADC voltage reference | — | External reference 0–5 V |
| IOREF | — | I/O voltage reference | — | Shields use this to adapt to 5 V |

**ADC resolution:** 10-bit (values 0–1023). **Default ADC reference:** AVCC (5 V). **PWM frequencies:** ~490 Hz on pins 3, 9, 10, 11; ~980 Hz on pins 5, 6. **I2C pull-ups:** external 4.7 kΩ to 5 V required (simulated by RSE when I2C component placed). **SPI maximum clock:** 8 MHz (F_CPU/2).

### A.2 ESP32 DevKit (ESP-WROOM-32) — Complete Pin Reference

Processor: Xtensa LX6 dual-core, 240 MHz. Operating voltage: 3.3 V (5 V tolerant VIN). Flash: 4 MB (SPI). SRAM: 520 KB. Wi-Fi: 802.11 b/g/n. BLE: 4.2.

| Pin Label | GPIO # | Capabilities | Protocol Role | Notes |
|-----------|--------|--------------|---------------|-------|
| GPIO0 | 0 | Digital, ADC2 CH1, Touch0 | Boot strapping | LOW at boot = download mode; avoid for output |
| GPIO1 | 1 | Digital, UART0 TX | UART0 TX | Console TX; avoid for GPIO |
| GPIO2 | 2 | Digital, ADC2 CH2, Touch2 | Onboard LED | Must be LOW or floating for boot |
| GPIO3 | 3 | Digital, UART0 RX | UART0 RX | Console RX; avoid for GPIO |
| GPIO4 | 4 | Digital, ADC2 CH0, Touch0 | General GPIO | |
| GPIO5 | 5 | Digital, SPI SS (VSPI) | Strapping pin | HIGH at boot |
| GPIO12 | 12 | Digital, ADC2 CH5, Touch5 | JTAG TDI; strapping | LOW at boot recommended (flash voltage) |
| GPIO13 | 13 | Digital, ADC2 CH4, Touch4 | JTAG TCK | |
| GPIO14 | 14 | Digital, ADC2 CH6, Touch6 | JTAG TMS | Outputs PWM at boot |
| GPIO15 | 15 | Digital, ADC2 CH3, Touch3 | JTAG TDO; strapping | Outputs PWM at boot |
| GPIO16 | 16 | Digital | UART2 RX | |
| GPIO17 | 17 | Digital | UART2 TX | |
| GPIO18 | 18 | Digital | VSPI CLK | SPI clock |
| GPIO19 | 19 | Digital | VSPI MISO | SPI data in |
| GPIO21 | 21 | Digital | I2C SDA (default) | Software-configurable |
| GPIO22 | 22 | Digital | I2C SCL (default) | Software-configurable |
| GPIO23 | 23 | Digital | VSPI MOSI | SPI data out |
| GPIO25 | 25 | Digital, ADC2 CH8, DAC1 | DAC output 1 | 8-bit DAC; 0–3.3 V |
| GPIO26 | 26 | Digital, ADC2 CH9, DAC2 | DAC output 2 | 8-bit DAC; 0–3.3 V |
| GPIO27 | 27 | Digital, ADC2 CH7, Touch7 | General GPIO | |
| GPIO32 | 32 | Digital, ADC1 CH4, Touch9 | General GPIO | |
| GPIO33 | 33 | Digital, ADC1 CH5, Touch8 | General GPIO | |
| GPIO34 | 34 | Input only, ADC1 CH6 | General input | No internal pull-up/down |
| GPIO35 | 35 | Input only, ADC1 CH7 | General input | No internal pull-up/down |
| GPIO36 (VP) | 36 | Input only, ADC1 CH0 | General input | No internal pull-up/down |
| GPIO39 (VN) | 39 | Input only, ADC1 CH3 | General input | No internal pull-up/down |
| 3.3V | — | Regulated power output | — | Max 600 mA from onboard LDO |
| GND | — | Ground reference | — | Multiple pins |
| VIN (5V) | — | Power input | — | 5 V via USB-micro or pin |
| EN | — | Chip enable | — | Active HIGH; LOW resets chip |

**ADC resolution:** 12-bit (values 0–4095). ADC1 channels are safe to use with Wi-Fi active; ADC2 channels are shared with Wi-Fi and unavailable during Wi-Fi transmission. **PWM:** LEDC peripheral supports up to 16 channels, 1 Hz–40 MHz, 1–16 bit resolution. **Touch:** capacitive touch on 10 GPIO pins (T0–T9). **UART:** 3 hardware UARTs (UART0 = console, UART1, UART2). **SPI:** 4 SPI buses (VSPI and HSPI are the primary user-accessible ones). **I2C:** software-configurable on any GPIO; default pins GPIO21 (SDA) / GPIO22 (SCL).

### A.3 Raspberry Pi Pico (RP2040) — Complete Pin Reference

Processor: RP2040 (dual-core ARM Cortex-M0+). Clock: up to 133 MHz. Operating voltage: 3.3 V logic. SRAM: 264 KB. On-board QSPI Flash: 2 MB. 40-pin header; 26 multifunction GPIO (GP0–GP28). Simulated by `rp2040js` (github.com/wokwi/rp2040js). Supported languages: MicroPython, CircuitPython, C/C++ (Arduino-Pico core / Pico SDK). Accurate execution loads a UF2/ELF firmware image into rp2040js.

| Pin Label | GPIO # | Capabilities | Protocol Role | Notes |
|-----------|--------|--------------|---------------|-------|
| GP0 | 0 | Digital in/out, PWM CH0A | UART0 TX; I2C0 SDA; SPI0 RX | General GPIO; PWM capable |
| GP1 | 1 | Digital in/out, PWM CH0B | UART0 RX; I2C0 SCL; SPI0 CSn | General GPIO; PWM capable |
| GP2 | 2 | Digital in/out, PWM CH1A | UART0 CTS; I2C1 SDA; SPI0 SCK | General GPIO; PWM capable |
| GP3 | 3 | Digital in/out, PWM CH1B | UART0 RTS; I2C1 SCL; SPI0 TX | General GPIO; PWM capable |
| GP4 | 4 | Digital in/out, PWM CH2A | UART1 TX; I2C0 SDA; SPI0 RX | General GPIO; PWM capable |
| GP5 | 5 | Digital in/out, PWM CH2B | UART1 RX; I2C0 SCL; SPI0 CSn | General GPIO; PWM capable |
| GP6 | 6 | Digital in/out, PWM CH3A | UART1 CTS; I2C1 SDA; SPI0 SCK | General GPIO; PWM capable |
| GP7 | 7 | Digital in/out, PWM CH3B | UART1 RTS; I2C1 SCL; SPI0 TX | General GPIO; PWM capable |
| GP8 | 8 | Digital in/out, PWM CH4A | UART1 TX; I2C0 SDA; SPI1 RX | General GPIO; PWM capable |
| GP9 | 9 | Digital in/out, PWM CH4B | UART1 RX; I2C0 SCL; SPI1 CSn | General GPIO; PWM capable |
| GP10 | 10 | Digital in/out, PWM CH5A | UART1 CTS; I2C1 SDA; SPI1 SCK | General GPIO; PWM capable |
| GP11 | 11 | Digital in/out, PWM CH5B | UART1 RTS; I2C1 SCL; SPI1 TX | General GPIO; PWM capable |
| GP12 | 12 | Digital in/out, PWM CH6A | UART0 TX; I2C0 SDA; SPI1 RX | General GPIO; PWM capable |
| GP13 | 13 | Digital in/out, PWM CH6B | UART0 RX; I2C0 SCL; SPI1 CSn | Onboard LED (active HIGH) |
| GP14 | 14 | Digital in/out, PWM CH7A | UART0 CTS; I2C1 SDA; SPI1 SCK | General GPIO; PWM capable |
| GP15 | 15 | Digital in/out, PWM CH7B | UART0 RTS; I2C1 SCL; SPI1 TX | General GPIO; PWM capable |
| GP16 | 16 | Digital in/out, PWM CH0A | UART0 TX; I2C0 SDA; SPI0 RX | General GPIO; PWM capable |
| GP17 | 17 | Digital in/out, PWM CH0B | UART0 RX; I2C0 SCL; SPI0 CSn | General GPIO; PWM capable |
| GP18 | 18 | Digital in/out, PWM CH1A | UART0 CTS; I2C1 SDA; SPI0 SCK | General GPIO; PWM capable |
| GP19 | 19 | Digital in/out, PWM CH1B | UART0 RTS; I2C1 SCL; SPI0 TX | General GPIO; PWM capable |
| GP20 | 20 | Digital in/out, PWM CH2A | UART1 TX; I2C0 SDA; SPI0 RX | General GPIO; PWM capable |
| GP21 | 21 | Digital in/out, PWM CH2B | UART1 RX; I2C0 SCL; SPI0 CSn | General GPIO; PWM capable |
| GP22 | 22 | Digital in/out, PWM CH3A | UART1 CTS; I2C1 SDA; SPI0 SCK | General GPIO; PWM capable |
| GP26 | 26 | Digital in/out, ADC CH0, PWM CH5A | ADC input 0; UART1 CTS | 12-bit ADC; 0–3.3 V range |
| GP27 | 27 | Digital in/out, ADC CH1, PWM CH5B | ADC input 1; UART1 RTS | 12-bit ADC; 0–3.3 V range |
| GP28 | 28 | Digital in/out, ADC CH2, PWM CH6A | ADC input 2 | 12-bit ADC; 0–3.3 V range; ADC_VREF on pin 35 |
| ADC_TEMP | — | Internal temperature sensor | ADC CH4 | Read via ADC channel 4 in firmware |
| 3.3V (pin 36) | — | Regulated power output | — | 300 mA max; from onboard regulator |
| VSYS (pin 39) | — | USB VBUS / battery input | — | 1.8–5.5 V; fed to onboard regulator |
| GND | — | Ground reference | — | Multiple pins (pins 3, 8, 13, 18, 23, 28, 33, 38) |
| RUN (pin 30) | — | Active-low MCU reset | — | Pull LOW to reset; floating = running |
| USB DP/DM | — | USB 1.1 device | — | Used for firmware flashing (UF2 mass-storage) and CDC serial |

**ADC resolution:** 12-bit (values 0–4095). **ADC reference voltage:** 3.3 V (AVDD). **PWM:** 16 independent PWM channels (CH0A–CH7B), each configurable from ~8 Hz to 125 MHz; frequency and duty cycle set per channel. **PIO:** 2 PIO blocks, each with 4 state machines (8 total), providing hardware-programmable I/O for custom protocols. **I2C:** 2 hardware I2C controllers (I2C0 and I2C1); pins are flexible — any GP pin that lists I2C0/I2C1 in its Protocol Role column can carry the respective bus. **SPI:** 2 hardware SPI controllers (SPI0 and SPI1). **UART:** 2 hardware UARTs (UART0 and UART1). **USB:** USB 1.1 device/host; Pico uses USB mass-storage bootloader (UF2 drag-and-drop) for firmware flashing. **Logic level:** 3.3 V; GP pins are NOT 5 V tolerant.

### A.4 Protocol-to-Pin Mapping Quick Reference

| Protocol | Arduino UNO R3 Pins | ESP32 DevKit Pins (default) | Raspberry Pi Pico Pins (default) |
|----------|---------------------|-----------------------------|----------------------------------|
| I2C SDA | A4 | GPIO21 | GP4 (I2C0) / GP6 (I2C1) |
| I2C SCL | A5 | GPIO22 | GP5 (I2C0) / GP7 (I2C1) |
| SPI MOSI | D11 | GPIO23 | GP3 (SPI0 TX) / GP7 (SPI0 TX) |
| SPI MISO | D12 | GPIO19 | GP0 (SPI0 RX) / GP4 (SPI0 RX) |
| SPI SCK | D13 | GPIO18 | GP2 (SPI0 SCK) / GP6 (SPI0 SCK) |
| SPI SS | D10 | GPIO5 | GP1 (SPI0 CSn) / GP5 (SPI0 CSn) |
| UART TX | D1 | GPIO1 (GPIO17 for UART2) | GP0 (UART0) / GP4 (UART1) |
| UART RX | D0 | GPIO3 (GPIO16 for UART2) | GP1 (UART0) / GP5 (UART1) |
| PWM-capable | D3, D5, D6, D9, D10, D11 | All GPIO except 34, 35, 36, 39 | GP0–GP22, GP26–GP28 (16 channels) |
| Analog input | A0–A5 | GPIO32–36, 39, 25–27 (ADC) | GP26, GP27, GP28; internal temp sensor |
| DAC output | None | GPIO25, GPIO26 | None (use PWM for pseudo-analog) |
| Interrupt | D2 (INT0), D3 (INT1) | Any GPIO (configurable) | Any GP pin (configurable) |

---

## Appendix B: Component-Model and Board Manifest Schemas (JSON Examples)

### B.1 Component-Model Manifest Schema

The following fenced code block contains a complete, normative example of a component manifest JSON file. This schema governs every component loaded by the RoboCode Simulation Engine (RSE). For the full schema field descriptions see Section 10 (Component and Sensor Library Specification). All component manifests must validate against this schema before admission to the Component Registry (FR-SIM-101).

```json
{
  "$schema": "https://robocode.africa/schemas/component-manifest/v1.json",
  "id": "cmp-dht22",
  "displayName": "DHT22 Temperature & Humidity Sensor",
  "category": "sensors",
  "version": "1.2.0",
  "wokwiId": "wokwi-dht22",
  "assets": {
    "2d": "wokwi-dht22",
    "3d": "https://assets.robocode.africa/3d/components/dht22.glb"
  },
  "pins": [
    {
      "name": "VCC",
      "direction": "power",
      "signalType": "power",
      "defaultState": 3.3
    },
    {
      "name": "DATA",
      "direction": "inout",
      "signalType": "onewire",
      "defaultState": null
    },
    {
      "name": "NC",
      "direction": "in",
      "signalType": "digital",
      "defaultState": null
    },
    {
      "name": "GND",
      "direction": "gnd",
      "signalType": "gnd",
      "defaultState": 0
    }
  ],
  "electricalParams": {
    "supplyVoltage": "3.3-5.5",
    "supplyCurrentMa": 2.5,
    "outputType": "digital"
  },
  "behaviourHooks": {
    "onReset": "dht22_onReset",
    "onSimTick": null,
    "onPinChange": "dht22_onPinChange",
    "onUserInput": "dht22_onUserInput"
  },
  "configurableProps": [
    {
      "key": "temperature",
      "label": "Temperature (°C)",
      "type": "slider",
      "default": 25.0,
      "min": -40.0,
      "max": 80.0
    },
    {
      "key": "humidity",
      "label": "Relative Humidity (%)",
      "type": "slider",
      "default": 50.0,
      "min": 0.0,
      "max": 100.0
    },
    {
      "key": "errorMode",
      "label": "Simulate Read Error",
      "type": "toggle",
      "default": false
    }
  ],
  "datasheetRef": "https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf",
  "tags": ["sensor", "temperature", "humidity", "onewire", "dht"],
  "compatibleBoards": ["cmp-uno-r3", "cmp-esp32"],
  "minRSEVersion": "1.0.0"
}
```

**Schema notes:**

- The `id` field must be globally unique within the Component Registry and follow the pattern `cmp-<slug>` (lower-case, hyphen-separated).
- `wokwiId` is optional but strongly preferred when an upstream `wokwi-elements` web component exists; this field enables the RSE to delegate 2D rendering to the Wokwi component library (github.com/wokwi/wokwi-elements), reducing maintenance overhead.
- `behaviourHooks` values are function names exported by the component's sandboxed WASM behaviour module. Setting a hook to `null` means the RSE will not invoke it, which is valid for hooks that are not applicable to a particular component (e.g., a pure-output LED has no `onUserInput`).
- `configurableProps` of type `"slider"` are rendered as range inputs in the RoboCode Studio component inspector panel; `"toggle"` renders as a labelled switch; `"select"` renders as a drop-down, and requires a sibling `"options"` array.
- All manifests must be submitted with a SHA-256 checksum of every binary asset referenced in the `assets` block. The RSE manifest validator (FR-SIM-101) verifies checksums at registry load time.

### B.2 Custom Board Definition — wokwi-boards Format (board.json Example)

RoboCode Studio uses the `wokwi-boards` definition format (github.com/wokwi/wokwi-boards) as its canonical board schema. Boards are data-driven: a board manifest (`board.json`) declares the board name and its pins (each pin carries a `name`, a `type` such as `power`/`ground`/`gpio`/`analog`/`i2c`/`spi`/`uart`, and an `x`/`y` canvas position) together with an SVG visual asset. No code change is required to add a board. The standard `wokwi-boards` library (Arduino Uno/Nano/Mega, the ESP32 family, Raspberry Pi Pico, and more) ships built in. Platform admins — and approved advanced users/teachers — may upload custom board definitions in this format. Custom-board uploads are validated (JSON schema, pin sanity, SVG/asset safety) and, for non-admins, pass through the standard approval/moderation workflow before becoming available to learners. Each board definition binds to an MCU core target (`avr8js` / `rp2040js` / ESP32 core) so the simulator knows how to execute firmware for that board.

The example below shows a normative `board.json` for a small custom breakout board exposing a subset of Raspberry Pi Pico pins. It follows the `wokwi-boards` manifest schema exactly.

```json
{
  "$schema": "https://robocode.africa/schemas/board/v1.json",
  "name": "RoboCode Mini Pico Breakout",
  "id": "board-robocode-mini-pico",
  "version": "1.0.0",
  "mcuTarget": "rp2040js",
  "description": "Compact 14-pin breakout: GP0-GP5, GP26-GP28 (ADC), 3V3, GND, RUN.",
  "author": "RoboCode.Africa Platform Team",
  "assets": {
    "svg": "board-robocode-mini-pico.svg",
    "svgChecksum": "sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6ab12"
  },
  "pins": [
    { "name": "GND",  "type": "ground", "x": 10,  "y": 10  },
    { "name": "3V3",  "type": "power",  "x": 10,  "y": 30  },
    { "name": "RUN",  "type": "gpio",   "x": 10,  "y": 50  },
    { "name": "GP0",  "type": "gpio",   "x": 10,  "y": 70  },
    { "name": "GP1",  "type": "gpio",   "x": 10,  "y": 90  },
    { "name": "GP2",  "type": "gpio",   "x": 10,  "y": 110 },
    { "name": "GP3",  "type": "gpio",   "x": 10,  "y": 130 },
    { "name": "GP4",  "type": "i2c",    "x": 90,  "y": 70  },
    { "name": "GP5",  "type": "i2c",    "x": 90,  "y": 90  },
    { "name": "GP26", "type": "analog", "x": 90,  "y": 110 },
    { "name": "GP27", "type": "analog", "x": 90,  "y": 130 },
    { "name": "GP28", "type": "analog", "x": 90,  "y": 150 }
  ]
}
```

**Board manifest notes:**

- `mcuTarget` must be one of `avr8js` (for AVR/ATmega boards), `rp2040js` (for RP2040/Pico boards), or `esp32` (for ESP32-family boards). The RSE uses this field to select the correct simulation core when firmware is loaded.
- `pins[].type` is a controlled vocabulary: `power`, `ground`, `gpio`, `analog`, `i2c`, `spi`, `uart`. A pin may participate in multiple protocols on real hardware, but the type field should reflect its primary/labelled function on the custom breakout.
- `pins[].x` and `pins[].y` are pixel coordinates within the SVG canvas and determine where wire connection points appear in the RoboCode Studio circuit editor.
- The `assets.svg` field references an SVG file that must be uploaded alongside `board.json`. SVGs are sanitised server-side (script tags, external references, and embedded JavaScript are stripped) before storage.
- Custom boards uploaded by non-admin users enter the moderation queue and are visible only to the uploading user and platform moderators until approved.

---

## Appendix C: Example diagram.json Structure

RoboCode Studio serialises each project's circuit layout as a `diagram.json` file stored in S3-compatible object storage. This file is the canonical on-disk representation of a student's circuit — it is loaded when a project is opened and saved every time a meaningful canvas change occurs. The structure is inspired by the Wokwi `diagram.json` format to enable import/export compatibility. The example below shows a minimal but complete circuit: an Arduino UNO R3 driving a DHT22 sensor and a 16×2 LCD via I2C, with appropriate resistors and breadboard wiring.

```json
{
  "$schema": "https://robocode.africa/schemas/diagram/v1.json",
  "version": "1.0",
  "projectId": "proj-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tenantId": "ten-robocode-direct",
  "author": "student-uuid-0000-0000-0000-000000000001",
  "createdAt": "2025-09-01T08:00:00Z",
  "updatedAt": "2025-09-15T14:32:10Z",
  "board": {
    "id": "cmp-uno-r3",
    "attrs": {
      "position": { "x": 40, "y": 60 }
    }
  },
  "parts": [
    {
      "instanceId": "bb1",
      "componentId": "cmp-breadboard-full",
      "attrs": {
        "position": { "x": 200, "y": 60 }
      }
    },
    {
      "instanceId": "dht1",
      "componentId": "cmp-dht22",
      "attrs": {
        "position": { "x": 420, "y": 100 },
        "props": {
          "temperature": 22.5,
          "humidity": 60.0,
          "errorMode": false
        }
      }
    },
    {
      "instanceId": "lcd1",
      "componentId": "cmp-lcd-16x2-i2c",
      "attrs": {
        "position": { "x": 420, "y": 220 },
        "props": {
          "i2cAddress": "0x27",
          "backlightOn": true
        }
      }
    },
    {
      "instanceId": "r1",
      "componentId": "cmp-resistor",
      "attrs": {
        "position": { "x": 360, "y": 140 },
        "props": {
          "resistanceOhm": 10000
        }
      }
    }
  ],
  "connections": [
    {
      "id": "wire-001",
      "from": { "instanceId": "cmp-uno-r3", "pin": "5V" },
      "to":   { "instanceId": "bb1", "pin": "pwr-rail-top-pos" },
      "color": "red"
    },
    {
      "id": "wire-002",
      "from": { "instanceId": "cmp-uno-r3", "pin": "GND" },
      "to":   { "instanceId": "bb1", "pin": "pwr-rail-top-neg" },
      "color": "black"
    },
    {
      "id": "wire-003",
      "from": { "instanceId": "bb1", "pin": "pwr-rail-top-pos" },
      "to":   { "instanceId": "dht1", "pin": "VCC" },
      "color": "red"
    },
    {
      "id": "wire-004",
      "from": { "instanceId": "bb1", "pin": "pwr-rail-top-neg" },
      "to":   { "instanceId": "dht1", "pin": "GND" },
      "color": "black"
    },
    {
      "id": "wire-005",
      "from": { "instanceId": "dht1", "pin": "DATA" },
      "to":   { "instanceId": "r1", "pin": "term-a" },
      "color": "yellow"
    },
    {
      "id": "wire-006",
      "from": { "instanceId": "r1", "pin": "term-b" },
      "to":   { "instanceId": "bb1", "pin": "pwr-rail-top-pos" },
      "color": "yellow"
    },
    {
      "id": "wire-007",
      "from": { "instanceId": "dht1", "pin": "DATA" },
      "to":   { "instanceId": "cmp-uno-r3", "pin": "D2" },
      "color": "green"
    },
    {
      "id": "wire-008",
      "from": { "instanceId": "bb1", "pin": "pwr-rail-top-pos" },
      "to":   { "instanceId": "lcd1", "pin": "VCC" },
      "color": "red"
    },
    {
      "id": "wire-009",
      "from": { "instanceId": "bb1", "pin": "pwr-rail-top-neg" },
      "to":   { "instanceId": "lcd1", "pin": "GND" },
      "color": "black"
    },
    {
      "id": "wire-010",
      "from": { "instanceId": "cmp-uno-r3", "pin": "A4" },
      "to":   { "instanceId": "lcd1", "pin": "SDA" },
      "color": "blue"
    },
    {
      "id": "wire-011",
      "from": { "instanceId": "cmp-uno-r3", "pin": "A5" },
      "to":   { "instanceId": "lcd1", "pin": "SCL" },
      "color": "orange"
    }
  ],
  "simulationConfig": {
    "targetBoard": "cmp-uno-r3",
    "executionMode": "accurate",
    "firmwarePath": "s3://rce-projects/proj-a1b2c3d4/firmware/sketch.hex",
    "sourceLanguage": "arduino-cpp",
    "rseVersion": "1.4.2",
    "tickRateMs": 1
  },
  "metadata": {
    "title": "DHT22 + LCD Display Demo",
    "description": "Reads temperature and humidity and displays on 16x2 LCD.",
    "tags": ["dht22", "lcd", "i2c", "sensor"],
    "thumbnailUrl": "s3://rce-projects/proj-a1b2c3d4/thumbnail.png",
    "isPublic": false,
    "classId": "class-uuid-0000-0000-0000-000000000042",
    "taskId": null
  }
}
```

**Structure notes:**

- `board` declares the primary microcontroller development board. Only one board is permitted per diagram in v1.0; multi-board support is a roadmap item.
- `parts` lists every component instance placed on the canvas. Each `instanceId` must be unique within the document. The `componentId` references the component manifest registry (Appendix B). The `props` sub-object within `attrs` sets the initial values of `configurableProps` defined in the component manifest.
- `connections` encodes the wiring netlist. Each connection is a directed or undirected edge between a pin on one instance and a pin on another. The `color` field is cosmetic only; the RSE resolves electrical connectivity from the graph topology, not from colours.
- `simulationConfig.executionMode` may be `"accurate"` (compile firmware → avr8js) or `"simplified"` (RoboCode Virtual Machine / RVM interpreted path).
- `firmwarePath` is populated by the RSE after compilation; it points to the compiled HEX/ELF artifact in S3.
- The RSE resolves breadboard connectivity by mapping breadboard `pin` identifiers such as `"pwr-rail-top-pos"` and `"row-a-01"` to internal netlist nodes according to the standard 830 tie-point breadboard topology.

---

## Appendix D: Glossary and Acronyms

This appendix is an SSD-focused summary. The authoritative and exhaustive glossary and acronym table are maintained in the User Requirements Document (URD) Section 22 (Glossary and Acronyms). This appendix records terms and acronyms that are specific to the System Specification Document, are introduced in the SSD but not in the URD, or whose SSD-specific meaning requires clarification beyond the URD definition.

### D.1 SSD-Specific Terms

| Term | SSD-Specific Definition |
|------|------------------------|
| Behaviour Hook | A named JavaScript or WASM function exported by a component manifest that the RSE invokes at defined lifecycle events (`onReset`, `onSimTick`, `onPinChange`, `onUserInput`). Defined in Section 10 and Appendix B. |
| CircuitPython | Adafruit's beginner-friendly Python dialect derived from MicroPython, supported on the Raspberry Pi Pico (RP2040). RoboCode Studio accepts CircuitPython `.py` source files for Pico projects; firmware is compiled to a UF2 image and loaded into `rp2040js` for accurate simulation. |
| Component Registry | The PostgreSQL-backed service that stores all component manifests and associated S3 asset references. Exposed to RoboCode Studio via the RSE component-loader API. Supports per-tenant scoping and versioning. |
| Design-Rule Check (DRC) | An automated validation pass performed by the RSE netlist solver that identifies electrically or logically invalid connections (e.g., output-to-output short, incompatible `signalType` pairing) and emits canvas warnings. Referenced in FR-SIM-105. |
| diagram.json | The canonical JSON serialisation of a student's RoboCode Studio project circuit layout, netlist, component configuration, and simulation parameters. Stored in S3-compatible object storage. Schema illustrated in Appendix C. |
| Execution Mode | One of two code-execution paths available in RoboCode Studio: `"accurate"` (compiles firmware and runs it on `avr8js` / ESP32 core / `rp2040js` simulator depending on the target board) or `"simplified"` (RVM-interpreted). Declared in `simulationConfig.executionMode` of `diagram.json`. |
| Instance | A specific placed occurrence of a component on the RoboCode Studio canvas, identified by `instanceId` in `diagram.json`. Multiple instances of the same `componentId` may coexist in one diagram. |
| Manifest | A `manifest.json` file conforming to the Component Manifest Schema (Appendix B) that fully describes a simulated component's appearance, pins, electrical parameters, behaviour hooks, and configurable properties. |
| Net | A named set of electrically connected pins in the circuit netlist. The RSE builds a net list from the `connections` array in `diagram.json` and from breadboard internal topology. Signals propagate within a net instantaneously (ideal conductor model). |
| PIO (Programmable I/O) | A hardware subsystem unique to the RP2040 microcontroller consisting of 2 PIO blocks each containing 4 state machines (8 total). PIO state machines execute small programs stored in a shared instruction memory and can implement custom digital I/O protocols (WS2812, UART, SPI, I2S, etc.) entirely in hardware at up to 125 MHz, independent of the CPU cores. `rp2040js` simulates PIO execution for accurate protocol emulation. |
| Raspberry Pi Pico | The first-party RP2040-based development board produced by Raspberry Pi Ltd. Features a 40-pin header exposing 26 multifunction GPIO (GP0–GP28), 3 ADC-capable inputs (GP26/GP27/GP28 plus an internal temperature sensor), 2× UART, 2× SPI, 2× I2C, 16 PWM channels, 8 PIO state machines, and USB 1.1. One of the three first-class boards supported by RoboCode.Africa; simulated via `rp2040js`. |
| RP2040 | The microcontroller at the heart of the Raspberry Pi Pico. Dual-core ARM Cortex-M0+ running at up to 133 MHz, 264 KB on-chip SRAM, no on-chip flash (external 2 MB QSPI flash on the Pico), 30 GPIO pins (26 exposed on the Pico header), 12-bit ADC, 16 PWM channels, 8 PIO state machines, USB 1.1 device/host. Simulated in-browser by `rp2040js`. |
| Row-Level Security (RLS) | PostgreSQL feature enforcing per-row access control. All multi-tenant tables in RoboCode.Africa carry a `tenant_id` column protected by RLS policies, ensuring strict data isolation between School Tenants. |
| RSE Tick | One simulation time step. Default granularity: 1 millisecond. The RSE invokes `onSimTick` hooks on registered components at every tick. Timing-sensitive protocols (DHT22 1-Wire, WS2812 bit-banging) depend on sub-millisecond accuracy modelled by `avr8js` at the instruction level. |
| Sandboxed Hook Runtime | A WASM-based execution environment in which component behaviour hooks run, isolated from the host browser context. Prevents arbitrary host API access or DOM manipulation by third-party component code. Required by FR-SIM-104. |
| Tenant | A School organisation subscribed to the RoboCode.Africa platform, identified by a unique subdomain (`<school>.robocode.africa`) or custom domain, and isolated by PostgreSQL Row-Level Security. Synonymous with "School" throughout the SSD. |
| UF2 | USB Flashing Format — a firmware binary container format developed by Microsoft and adopted by the Raspberry Pi Foundation for the RP2040/Pico. A UF2 file appears as a mass-storage device over USB; copying the file onto the Pico bootloader drive flashes the firmware. `rp2040js` accepts UF2 images for accurate simulation loading. |
| wokwi-boards | An open-source board-definition library and schema (github.com/wokwi/wokwi-boards) that describes development boards as data (`board.json` + SVG), without requiring code changes to add a new board. RoboCode Studio uses the `wokwi-boards` format as its canonical board schema. The standard library ships built in; platform admins and approved users may upload custom board definitions in this format. See Appendix B.2. |

### D.2 SSD Acronym Supplement

| Acronym | Expansion | Notes |
|---------|-----------|-------|
| CDN | Content Delivery Network | Cloudflare / CloudFront edge layer serving static assets and firmware binaries. |
| CRDT | Conflict-free Replicated Data Type | Yjs CRDT used for real-time collaborative project editing. |
| DRC | Design-Rule Check | Automated netlist validation in the RSE; see FR-SIM-105. |
| FR | Functional Requirement | SSD identifier prefix: `FR-<MODULE>-<nnn>`. Modules: AUTH, TEN, STU, SIM, CODE, LRN, TEAM, GAM, COMM, MOD, ADM. |
| GLTF/GLB | GL Transmission Format | Binary 3D asset format used for component 3D models consumed by Three.js / React Three Fiber. |
| IR | Interface Requirement | SSD identifier prefix: `IR-<nnn>`. Covers APIs, integration points, and external system interfaces. |
| MCU | Microcontroller Unit | The simulated microcontroller: ATmega328P (Arduino UNO R3) via `avr8js`; ESP32 via ESP32 core simulation; or RP2040 (Raspberry Pi Pico) via `rp2040js`. |
| NFR | Non-Functional Requirement | SSD identifier prefix: `NFR-<CAT>-<nnn>`. Categories (per Section 1 and as used in Section 17): PERF (Performance), SCAL (Scalability), AVAIL/REL (Availability and Reliability), SEC (Security), PRIV (Privacy), MAINT (Maintainability), PORT (Portability), ACC (Accessibility), I18N (Internationalisation), BW/LBW (Low-Bandwidth), COMP (Compliance). Section 17 also uses INF (Infrastructure), LOG, TRC, MET, SLO, AUD, ERR, ANL, SUP for observability/infra sub-categories. |
| PIO | Programmable I/O | RP2040-specific hardware subsystem; 2 blocks × 4 state machines = 8 PIO state machines. Simulated by `rp2040js`. See D.1 for full definition. |
| RSE | RoboCode Simulation Engine | The subsystem executing component behavioural simulation within RoboCode Studio. |
| RLS | Row-Level Security | PostgreSQL per-row access-control mechanism enforcing multi-tenant data isolation. |
| RVM | RoboCode Virtual Machine | The simplified interpreted code-execution layer; alternative to the accurate firmware compilation path. |
| SR | Security Requirement | SSD identifier prefix: `SR-<nnn>`. Covers authentication, authorisation, data protection, and child safety controls. |
| UF2 | USB Flashing Format | Firmware container format used for Raspberry Pi Pico / RP2040 programming; accepted by `rp2040js` for accurate simulation loading. See D.1 for full definition. |
| SSD | System Specification Document | This document. Companion to the User Requirements Document (URD). |

### D.3 Cross-Reference to URD Glossary

The following terms are fully defined in URD Section 22 and are used without redefinition in this SSD: Arduino UNO R3, ATmega328P, avr8js, Badge, Block-Based Mode, Breadboard, Canvas, Child Safeguarding, Class, Component Catalogue, Custom Domain, Data Minimisation, ESP32, Firmware, GPIO, Guest/Visitor, I2C, IDE, Jumper Wire, LCD, LDR, LED, Leaderboard, MicroPython, Monaco Editor, MoSCoW, Netlist, NeoPixel, OLED, Parent/Guardian, PIR Sensor, Platform Moderator, Project, PWM, RBAC, RoboCode Studio, RoboCode Simulation Engine (RSE), RoboCode Virtual Machine (RVM), RoboPoints, School Admin, Season, Simulation, SPI, SSO, Student, Super Admin, Teacher/Educator, Team, Tenant, UART, White-Label, Wokwi, wokwi-elements, Yjs.

The following terms are introduced in this SSD and are defined in Appendix D.1 above (not in the URD at the time of this specification version): CircuitPython, PIO (Programmable I/O), Raspberry Pi Pico, RP2040, UF2 (USB Flashing Format), wokwi-boards.

---

## Appendix E: Standards and References

### E.1 Standards Applied

| Standard | Title | Application in this SSD |
|----------|-------|--------------------------|
| ISO/IEC/IEEE 29148:2018 | Systems and software engineering — Life cycle processes — Requirements engineering | Requirements elicitation, structuring, and traceability methodology for the entire SSD. |
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications | SRS document structure and requirement quality attributes (unambiguous, complete, verifiable, consistent, ranked, modifiable, traceable). |
| WCAG 2.2 (W3C) | Web Content Accessibility Guidelines 2.2, Level AA | Accessibility baseline for all user-facing surfaces of RoboCode.Africa. Referenced in NFR-ACCESS series and Section 20. |
| COPPA (15 U.S.C. §§ 6501–6506) | Children's Online Privacy Protection Act (USA) | Verifiable parental consent for users under 13; data minimisation; no behavioural advertising. Applied globally as a baseline. |
| GDPR (EU) 2016/679 | General Data Protection Regulation | Lawful processing basis; data subject rights; breach notification; Data Protection Officer requirement. |
| GDPR-K / UK Children's Code | ICO Age-Appropriate Design Code | Heightened consent for under-16s (EU) / under-13s (UK); high privacy defaults; no profiling; age-appropriate design. |
| POPIA Act 4 of 2013 | Protection of Personal Information Act (South Africa) | Lawful processing conditions; mandatory breach notification to the Information Regulator. |
| Nigeria NDPR 2019 | Nigeria Data Protection Regulation 2019 (the canon instrument; note the Nigeria Data Protection Act 2023 now supersedes it and applies where in force) | Consent and lawful basis; data subject rights; mandatory Data Protection / Privacy Impact Assessments. |
| Kenya Data Protection Act 2019 | Kenya Data Protection Act | Registration with Data Protection Commissioner; data subject rights; cross-border transfer controls. |
| Zimbabwe CDPA 2021 | Cyber and Data Protection Act (Zimbabwe) | Registration with POTRAZ; cross-border transfer restrictions; lawful processing. |
| RFC 8555 | ACME — Automatic Certificate Management Environment | Protocol for automated TLS certificate provisioning for custom tenant domains via Let's Encrypt. |
| RFC 6238 | TOTP — Time-Based One-Time Password Algorithm | Two-factor authentication for staff and admin accounts. |
| RFC 9110 | HTTP Semantics | REST API design; HTTP status codes; caching directives. |
| OpenTelemetry v1.x | OpenTelemetry Specification | Distributed tracing, metrics, and logs schema used throughout the observability stack. |
| JSON Schema Draft-07 | JSON Schema: A Vocabulary for Structural Validation of JSON | Component manifest schema validation (Appendix B); diagram.json schema validation (Appendix C). |

### E.2 Open-Source Libraries and Projects Referenced

| Library / Project | Source / Repository | Usage in RoboCode.Africa |
|-------------------|---------------------|--------------------------|
| avr8js | github.com/wokwi/avr8js | ATmega328P MCU simulation in the RSE; runs real compiled AVR firmware in-browser. |
| rp2040js | github.com/wokwi/rp2040js | RP2040 (Raspberry Pi Pico) MCU simulation in the RSE; runs real compiled RP2040 firmware (UF2/ELF) in-browser. Supports MicroPython, CircuitPython, and C/C++ (Arduino-Pico / Pico SDK) firmware images. |
| wokwi-boards | github.com/wokwi/wokwi-boards | Data-driven board-definition library used as RoboCode Studio's canonical board schema. Boards are declared as a `board.json` manifest plus SVG asset; no code change is needed to add a board. Standard library ships built in; platform admins and approved users may upload custom definitions. See Appendix B.2. |
| wokwi-elements | github.com/wokwi/wokwi-elements | 2D web components for simulated electronics parts on the RoboCode Studio canvas. |
| Monaco Editor | github.com/microsoft/monaco-editor | Code editing surface in RoboCode Studio; provides syntax highlighting, diagnostics, autocomplete. |
| React 18 | github.com/facebook/react | Client-side UI framework for RoboCode Studio and the marketing/app shell. |
| Next.js (App Router) | github.com/vercel/next.js | Framework for marketing site and app shell; SSR, routing, API routes. |
| Three.js | github.com/mrdoob/three.js | WebGL2/WebGPU 3D rendering engine for the 3D simulation view in RoboCode Studio. |
| React Three Fiber | github.com/pmndrs/react-three-fiber | React renderer for Three.js; enables declarative 3D scene composition. |
| Yjs | github.com/yjs/yjs | CRDT framework for real-time collaborative project editing by Teams. |
| NestJS | github.com/nestjs/nest | Node.js framework for backend microservices and the API gateway. |
| Redux Toolkit | github.com/reduxjs/redux-toolkit | State management for the RoboCode Studio SPA and app shell. |
| Tailwind CSS | github.com/tailwindlabs/tailwindcss | Utility-first CSS; design-token theming for white-label multi-tenancy. |
| shadcn/ui (Radix UI) | github.com/shadcn-ui/ui | Accessible, themable React component primitives; customised for RoboCode.Africa brand. |
| Socket.IO | github.com/socketio/socket.io | WebSocket server and client for real-time collaborative features and live simulation events. |
| Terraform | github.com/hashicorp/terraform | Infrastructure as Code for cloud resource provisioning (AWS/GCP/Azure). |
| OpenTelemetry JS | github.com/open-telemetry/opentelemetry-js | Distributed tracing and metrics instrumentation for Node.js services. |
| Sentry | sentry.io | Error tracking and performance monitoring for frontend and backend. |

### E.3 Further Reading and Reference Documentation

| Resource | Description |
|----------|-------------|
| Wokwi Documentation (wokwi.com/docs) | Reference for Wokwi diagram.json format, wokwi-elements API, avr8js and rp2040js integration patterns, and the wokwi-boards board-definition schema. |
| Arduino Language Reference (docs.arduino.cc) | Definitive reference for Arduino C/C++ API surface used in the code editor's autocomplete and lint rules. |
| MicroPython Documentation (docs.micropython.org) | Reference for the MicroPython API used for ESP32 and Raspberry Pi Pico projects in RoboCode Studio. |
| CircuitPython Documentation (docs.circuitpython.org) | Reference for the CircuitPython API supported on Raspberry Pi Pico (RP2040) projects in RoboCode Studio. |
| Raspberry Pi Pico Python SDK (datasheets.raspberrypi.com) | Official MicroPython SDK guide for the RP2040; informs Pico language support and `rp2040js` simulation fidelity requirements. |
| Raspberry Pi Pico C/C++ SDK (datasheets.raspberrypi.com) | Official Pico SDK reference; covers GPIO, ADC, PWM, PIO, I2C, SPI, UART, USB, and multicore APIs used for C/C++ firmware targeting the RP2040. |
| RP2040 Datasheet (datasheets.raspberrypi.com) | Authoritative RP2040 hardware reference; informs `rp2040js` simulation fidelity and Appendix A.3 pin-reference data. |
| ESP-IDF Programming Guide (docs.espressif.com) | Espressif ESP32 hardware reference; informs ESP32 core simulation fidelity requirements. |
| Keyestudio ESP32 Learning Kit documentation | Source of ESP32 component catalogue items included in the RoboCode.Africa simulation library. |
| Robotlinking Starter Kit documentation | Source of Arduino UNO component catalogue items included in the RoboCode.Africa simulation library. |

---

## Appendix F: Open Issues and Future Roadmap

This appendix records known open issues that are unresolved at the time of this specification version, and the confirmed future-roadmap capabilities that are explicitly excluded from the v1.0 release (labelled Won't — this release in MoSCoW priority). These items are tracked in the product backlog and will be addressed in subsequent specification amendments.

### F.1 Open Issues

| Issue ID | Description | Affected Sections | Status |
|----------|-------------|-------------------|--------|
| OI-001 | ESP32 ADC2 unavailability during active Wi-Fi transmission not yet modelled in the RSE. The simulator currently allows ADC2 readings during simulated Wi-Fi operations, which is inaccurate. | Section 8 (RSE), Appendix A | Open — RSE engineering team to implement Wi-Fi/ADC2 mutex model in RSE v1.2. |
| OI-002 | Precise boot-strapping pin behaviour for ESP32 (GPIO0, GPIO2, GPIO5, GPIO12, GPIO15) during simulated power-on is partially implemented. Incorrect strapping pin states may produce misleading boot-mode errors in some sketches. | Section 8, Appendix A | Open — scheduled for RSE v1.1. |
| OI-003 | The ACME/Let's Encrypt DNS-01 challenge path for custom domain TLS is specified but not fully validated against all major African DNS registrar APIs (e.g., ZOL Zimbabwe, Africa Online). | Section 6 (Multi-Tenancy) | Open — integration testing against additional registrars required in beta phase. |
| OI-004 | Jurisdiction detection for minor users (COPPA vs. GDPR-K threshold) currently relies solely on tenant registered country. IP-based geolocation as a secondary signal is not yet specified in FR-AUTH. | Section 5 (FR-AUTH), Section 18 (Security/Privacy) | Open — legal review in progress; amendment to FR-AUTH planned. |
| OI-005 | The `diagram.json` schema version (`"version": "1.0"`) does not yet define a formal migration path for breaking schema changes. A versioned migration service specification is required before production launch. | Section 15 (Data Architecture), Appendix C | Open — data architecture team to define migration strategy. |
| OI-006 | Leaderboard privacy controls for minors (restricting full-name visibility across global leaderboards) are referenced in FR-GAM but the specific visibility rules for primary-school students vs. high-school students vs. direct-signup students are not fully codified. | Section 12 (FR-GAM), Section 18 | Open — product and legal review required. |

### F.2 Confirmed Future Roadmap Items

The following capabilities are confirmed product roadmap items explicitly excluded from the v1.0 release. Each entry references the relevant SSD requirement area and carries a Won't (this release) MoSCoW priority.

#### F.2.1 Real-Hardware Firmware Export

| ID | Description | Priority | Notes |
|----|-------------|----------|-------|
| ROAD-001 | Export compiled firmware (AVR HEX for Arduino UNO R3; binary for ESP32) from RoboCode Studio to flash directly onto physical hardware via WebUSB or a downloadable `.hex`/`.bin` file. | Won't (v1.0) | Requires WebUSB browser API integration and avr-dude/esptool.py wrappers. Planned for v1.2. |
| ROAD-002 | Real-hardware serial monitor: connect a physical Arduino UNO R3 or ESP32 via USB and view its Serial output in the RoboCode Studio Serial Monitor pane alongside the simulation. | Won't (v1.0) | Depends on ROAD-001 WebUSB integration. |
| ROAD-003 | Over-the-Air (OTA) firmware update for ESP32: deploy a student's compiled MicroPython or Arduino-ESP32 sketch to a physical ESP32 via Wi-Fi from within RoboCode Studio. | Won't (v1.0) | Requires school network configuration and security review. |

#### F.2.2 Additional Development Boards

| ID | Description | Priority | Notes |
|----|-------------|----------|-------|
| ROAD-010 | Arduino Nano (ATmega328P, 3.3 V / 5 V variants): same core simulation as UNO R3 via `avr8js`; requires a new board manifest, pin table, and 2D/3D assets. | Won't (v1.0) | Planned for v1.1. High demand from Keyestudio kit users. |
| ROAD-011 | ESP8266 NodeMCU: single-core Wi-Fi SoC; requires a new ESP8266 simulation core or protocol-level stub; new manifest and pin table. | Won't (v1.0) | Planned for v1.2. Popular in lower-cost African robotics kits. |
| ROAD-012 | Raspberry Pi Pico (RP2040): dual-core ARM Cortex-M0+ at 133 MHz; MicroPython, CircuitPython, and C/C++ (Arduino-Pico / Pico SDK) support; `rp2040js` simulation engine; 8 PIO state machines; UF2/ELF firmware loading. **Promoted to first-class supported board in v1.0** — see Appendix A.3 for pin reference and Appendix B.2 for `wokwi-boards` board definition format. Near-term variant: Pico W (CYW43439 Wi-Fi/BLE) is a roadmap item. | Delivered (v1.0) | Promoted from roadmap to first-class support. Pico W variant planned for v1.1. |
| ROAD-013 | BBC micro:bit v2 (nRF52833): popular in African primary-school coding programmes; MakeCode block editor compatibility. | Won't (v1.0) | Under evaluation for v2.0; requires MakeCode/PXT integration assessment. |
| ROAD-014 | Raspberry Pi Pico W (RP2040 + CYW43439): Wi-Fi (802.11 b/g/n) and BLE variant of the Pico; requires CYW43439 radio emulation layer on top of `rp2040js`. | Won't (v1.0) | Planned for v1.1 as a near-term variant of the Pico (ROAD-012). |

#### F.2.3 AI Tutor

| ID | Description | Priority | Notes |
|----|-------------|----------|-------|
| ROAD-020 | AI Tutor integration within RoboCode Studio: a context-aware, in-IDE tutoring assistant that can answer student questions about their code, suggest fixes for simulation errors, explain component behaviour, and guide project completion. | Won't (v1.0) | Requires LLM API integration, child-safety content filtering, rate limiting, and data-minimisation review. Planned for v1.3. |
| ROAD-021 | Automated code review and marking: AI-assisted grading of student sketch submissions against Teacher-defined rubrics; generates formative feedback for students and a summary report for Teachers. | Won't (v1.0) | Depends on ROAD-020 AI integration. Requires teacher consent workflow. |
| ROAD-022 | Adaptive learning pathways: AI-driven recommendation of next tasks and projects based on a Student's skill graph, completion history, and RoboPoints profile. | Won't (v1.0) | Planned for v2.0. Requires skill-graph data model (FR-LRN extension). |

#### F.2.4 Community Project Marketplace

| ID | Description | Priority | Notes |
|----|-------------|----------|-------|
| ROAD-030 | Community Project Gallery: a curated, moderated public gallery of shared student and teacher projects that visitors and students can browse, fork, and remix within RoboCode Studio. | Won't (v1.0) | Requires moderation pipeline, age-gating for minor-authored content, and licensing framework. Planned for v1.2. |
| ROAD-031 | Component Marketplace: a submission portal through which verified educators and partner organisations can publish new component manifests (Appendix B) and 3D model assets for inclusion in the community component library, subject to Super Admin approval. | Won't (v1.0) | Requires manifest validator CI pipeline, trust/verification model for publishers, and revenue-sharing or attribution framework. |
| ROAD-032 | Teacher Resource Marketplace: a library of community-contributed lesson plans, project briefs, and assessment rubrics that teachers can import and adapt into their classes. | Won't (v1.0) | Requires Creative Commons or equivalent licensing metadata per resource. |
| ROAD-033 | General-purpose offline editing of arbitrary projects: extend the v1.0 scoped PWA (which already caches simulation assets, lesson content, and the most recent 10 projects with an offline edit-and-queue path — see Section 20 NFR-LBW-013 through NFR-LBW-018, in scope for v1.0) to allow full offline editing of any project regardless of prior caching, with Yjs CRDT reconciliation across long offline periods. | Won't (v1.0) | The scoped PWA is delivered in v1.0; only the unbounded general-purpose offline-editing extension is deferred to v2.0. |

#### F.2.5 Parent Portal

| ID | Description | Priority | Notes |
|----|-------------|----------|-------|
| ROAD-040 | Full Parent / Guardian Portal: a dedicated dashboard allowing parents to view their child's project gallery, RoboPoints history, badges, class assignments and grades, and to manage consent preferences and data-download requests. | Won't (v1.0) | v1.0 provides only a read-only progress summary page. Full portal planned for v1.2. |

### F.3 Roadmap Timeline Summary

```
 v1.0  (GA launch)
  │  Core platform: RoboCode Studio, RSE, Arduino UNO R3 + ESP32
  │    + Raspberry Pi Pico (RP2040 / rp2040js) — three first-class boards
  │  Extensible wokwi-boards board-definition library (custom boards)
  │  Full component catalogue; LMS; gamification; multi-tenancy;
  │  child safety controls; WCAG 2.2 AA; African CDN delivery.
  │
 v1.1  (Target: 3 months post-GA)
  │  Arduino Nano board support (ROAD-010)
  │  Raspberry Pi Pico W (CYW43439 Wi-Fi/BLE) board variant (ROAD-014)
  │  ESP32 ADC2/Wi-Fi mutex fix (OI-001); boot-strapping fix (OI-002)
  │  Leaderboard minor-privacy codification (OI-006)
  │
 v1.2  (Target: 6 months post-GA)
  │  Real-hardware firmware export via WebUSB (ROAD-001, ROAD-002)
  │  Community Project Gallery (ROAD-030)
  │  Component Marketplace (ROAD-031)
  │  Full Parent Portal (ROAD-040)
  │  ESP8266 board support (ROAD-011)
  │
 v1.3  (Target: 9 months post-GA)
  │  AI Tutor integration (ROAD-020)
  │  Automated AI-assisted marking (ROAD-021)
  │  Teacher Resource Marketplace (ROAD-032)
  │
 v2.0  (Target: 18 months post-GA)
  │  BBC micro:bit v2 simulation (ROAD-013)
  │  Adaptive learning pathways (ROAD-022)
  │  General-purpose offline editing of arbitrary projects (ROAD-033;
  │    the scoped PWA itself ships in v1.0)
  │
 Beyond
     OTA firmware deployment (ROAD-003)
     Additional African localisation and language support
     Hardware integration SDK for school robotics kits
```

---

*End of Appendices.*
