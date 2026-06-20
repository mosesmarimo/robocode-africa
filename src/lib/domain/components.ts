// Component catalogue for RoboCode Studio. Each entry maps a robotics-kit part to a
// @wokwi/elements tag plus the simulation role used by the RoboCode Simulation Engine.

export type ComponentCategory =
  | "output"
  | "display"
  | "input"
  | "sensor"
  | "actuator"
  | "module"
  | "passive"
  | "prototype";

export interface ComponentDef {
  id: string;
  name: string;
  category: ComponentCategory;
  /** @wokwi/elements tag, or "rc-breadboard" for our custom breadboard. */
  tag: string;
  simRole: string;
  description: string;
  defaultProps?: Record<string, string | number | boolean>;
  keywords?: string[];
}

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  output: "Lights & Output",
  display: "Displays",
  input: "Buttons & Inputs",
  sensor: "Sensors",
  actuator: "Motors & Actuators",
  module: "Modules",
  passive: "Passives",
  prototype: "Prototyping",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "prototype",
  "output",
  "display",
  "input",
  "sensor",
  "actuator",
  "module",
  "passive",
];

export const COMPONENTS: ComponentDef[] = [
  // Prototyping
  { id: "breadboard", name: "Breadboard", category: "prototype", tag: "rc-breadboard", simRole: "breadboard", description: "830-point solderless breadboard with power rails.", keywords: ["protoboard", "wire"] },
  { id: "breadboard-mini", name: "Mini Breadboard", category: "prototype", tag: "rc-breadboard-mini", simRole: "breadboard", description: "Compact half-size breadboard.", keywords: ["protoboard"] },

  // Output
  { id: "led", name: "LED", category: "output", tag: "wokwi-led", simRole: "led", description: "Light-emitting diode. Wire through a resistor.", defaultProps: { color: "red" }, keywords: ["light", "lamp"] },
  { id: "rgb-led", name: "RGB LED", category: "output", tag: "wokwi-rgb-led", simRole: "rgb", description: "Three-colour LED for mixing any colour.", keywords: ["color", "light"] },
  { id: "led-bar", name: "LED Bar Graph", category: "output", tag: "wokwi-led-bar-graph", simRole: "ledbar", description: "Row of 10 LEDs for levels and meters.", keywords: ["meter", "level"] },
  { id: "neopixel", name: "NeoPixel (WS2812)", category: "output", tag: "wokwi-neopixel", simRole: "neopixel", description: "Addressable RGB pixel.", keywords: ["ws2812", "addressable"] },
  { id: "led-ring", name: "NeoPixel Ring", category: "output", tag: "wokwi-led-ring", simRole: "neopixel", description: "Ring of addressable RGB LEDs.", defaultProps: { pixels: 16 }, keywords: ["ring", "ws2812"] },
  { id: "buzzer", name: "Buzzer", category: "output", tag: "wokwi-buzzer", simRole: "buzzer", description: "Piezo buzzer for tones and alarms.", keywords: ["sound", "beep", "piezo"] },
  { id: "relay", name: "Relay Module", category: "output", tag: "wokwi-ks2e-m-dc5", simRole: "relay", description: "Electromechanical relay to switch larger loads.", keywords: ["switch", "mains"] },

  // Displays
  { id: "lcd1602", name: "LCD 16x2", category: "display", tag: "wokwi-lcd1602", simRole: "lcd", description: "16x2 character LCD (HD44780).", defaultProps: { pins: "i2c" }, keywords: ["screen", "text", "hd44780"] },
  { id: "lcd2004", name: "LCD 20x4", category: "display", tag: "wokwi-lcd2004", simRole: "lcd", description: "20x4 character LCD.", defaultProps: { pins: "i2c" }, keywords: ["screen", "text"] },
  { id: "ssd1306", name: "OLED 0.96\"", category: "display", tag: "wokwi-ssd1306", simRole: "oled", description: "128x64 OLED display (SSD1306).", keywords: ["oled", "graphics", "screen"] },
  { id: "7segment", name: "7-Segment Display", category: "display", tag: "wokwi-7segment", simRole: "7seg", description: "Single-digit 7-segment display.", keywords: ["digit", "number"] },
  { id: "ili9341", name: "TFT 2.4\" (ILI9341)", category: "display", tag: "wokwi-ili9341", simRole: "tft", description: "Colour TFT touch display.", keywords: ["color", "tft", "graphics"] },

  // Inputs
  { id: "pushbutton", name: "Push Button", category: "input", tag: "wokwi-pushbutton", simRole: "pushbutton", description: "Momentary tactile push button.", defaultProps: { color: "green" }, keywords: ["button", "switch"] },
  { id: "slide-switch", name: "Slide Switch", category: "input", tag: "wokwi-slide-switch", simRole: "switch", description: "Two-position slide switch.", keywords: ["toggle"] },
  { id: "tilt-switch", name: "Tilt Switch", category: "input", tag: "wokwi-tilt-switch", simRole: "switch", description: "Ball tilt switch detects orientation.", keywords: ["ball", "orientation"] },
  { id: "potentiometer", name: "Potentiometer", category: "input", tag: "wokwi-potentiometer", simRole: "potentiometer", description: "Rotary analog dial (0-1023).", keywords: ["knob", "dial", "analog"] },
  { id: "slide-pot", name: "Slide Potentiometer", category: "input", tag: "wokwi-slide-potentiometer", simRole: "potentiometer", description: "Linear slide analog control.", keywords: ["fader", "analog"] },
  { id: "joystick", name: "Analog Joystick", category: "input", tag: "wokwi-analog-joystick", simRole: "joystick", description: "Two-axis joystick with button.", keywords: ["xy", "thumb"] },
  { id: "keypad", name: "Membrane Keypad 4x4", category: "input", tag: "wokwi-membrane-keypad", simRole: "keypad", description: "16-key matrix keypad.", keywords: ["matrix", "keys"] },
  { id: "ky-040", name: "Rotary Encoder", category: "input", tag: "wokwi-ky-040", simRole: "encoder", description: "Rotary encoder with push.", keywords: ["encoder", "rotate"] },

  // Sensors
  { id: "ultrasonic", name: "Ultrasonic HC-SR04", category: "sensor", tag: "wokwi-hc-sr04", simRole: "ultrasonic", description: "Distance sensor (2-400 cm).", keywords: ["distance", "sonar", "range"] },
  { id: "pir", name: "PIR Motion Sensor", category: "sensor", tag: "wokwi-pir-motion-sensor", simRole: "pir", description: "Passive infrared motion detector.", keywords: ["motion", "movement"] },
  { id: "dht22", name: "DHT22 Temp/Humidity", category: "sensor", tag: "wokwi-dht22", simRole: "dht", description: "Temperature and humidity sensor.", keywords: ["temperature", "humidity", "weather"] },
  { id: "ntc", name: "NTC Thermistor", category: "sensor", tag: "wokwi-ntc-temperature-sensor", simRole: "ntc", description: "Analog temperature sensor.", keywords: ["temperature", "thermistor"] },
  { id: "photoresistor", name: "Photoresistor (LDR)", category: "sensor", tag: "wokwi-photoresistor-sensor", simRole: "ldr", description: "Light-dependent resistor.", keywords: ["light", "ldr", "lux"] },
  { id: "sound", name: "Sound Sensor", category: "sensor", tag: "wokwi-small-sound-sensor", simRole: "sound", description: "Microphone sound-level sensor.", keywords: ["mic", "noise", "clap"] },
  { id: "gas", name: "Gas Sensor (MQ-2)", category: "sensor", tag: "wokwi-gas-sensor", simRole: "gas", description: "Smoke / combustible gas sensor.", keywords: ["smoke", "mq2"] },
  { id: "flame", name: "Flame Sensor", category: "sensor", tag: "wokwi-flame-sensor", simRole: "flame", description: "Infrared flame detector.", keywords: ["fire", "ir"] },
  { id: "mpu6050", name: "MPU6050 IMU", category: "sensor", tag: "wokwi-mpu6050", simRole: "imu", description: "Accelerometer + gyroscope.", keywords: ["gyro", "accel", "motion"] },
  { id: "ir-receiver", name: "IR Receiver", category: "sensor", tag: "wokwi-ir-receiver", simRole: "ir", description: "Infrared remote receiver.", keywords: ["remote", "infrared"] },

  // Actuators
  { id: "servo", name: "Servo Motor (SG90)", category: "actuator", tag: "wokwi-servo", simRole: "servo", description: "Micro servo, 0-180 degrees.", keywords: ["motor", "angle", "sg90"] },
  { id: "stepper", name: "Stepper Motor", category: "actuator", tag: "wokwi-stepper-motor", simRole: "stepper", description: "28BYJ-48 stepper motor.", keywords: ["motor", "step", "28byj"] },

  // Modules
  { id: "ds1307", name: "RTC DS1307", category: "module", tag: "wokwi-ds1307", simRole: "rtc", description: "Real-time clock module.", keywords: ["clock", "time"] },
  { id: "microsd", name: "microSD Card", category: "module", tag: "wokwi-microsd-card", simRole: "sd", description: "SD card storage module.", keywords: ["storage", "sd"] },
  { id: "hx711", name: "HX711 Load Cell", category: "module", tag: "wokwi-hx711", simRole: "loadcell", description: "Weight / load-cell amplifier.", keywords: ["weight", "scale"] },

  // Passives
  { id: "resistor", name: "Resistor", category: "passive", tag: "wokwi-resistor", simRole: "resistor", description: "Current-limiting resistor.", defaultProps: { value: "220" }, keywords: ["ohm", "passive"] },
];

export const COMPONENT_BY_ID: Record<string, ComponentDef> = Object.fromEntries(
  COMPONENTS.map((c) => [c.id, c]),
);

export function searchComponents(query: string): ComponentDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMPONENTS;
  return COMPONENTS.filter((c) =>
    [c.name, c.description, ...(c.keywords ?? [])].join(" ").toLowerCase().includes(q),
  );
}
