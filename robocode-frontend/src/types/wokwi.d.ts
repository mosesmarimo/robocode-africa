import type React from "react";

// Minimal typing for @wokwi/elements custom elements used in the Studio.
type WokwiProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  [attr: string]: unknown;
};

export interface ElementPin {
  name: string;
  x: number;
  y: number;
  signals: unknown[];
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "wokwi-arduino-uno": WokwiProps;
      "wokwi-arduino-nano": WokwiProps;
      "wokwi-arduino-mega": WokwiProps;
      "wokwi-esp32-devkit-v1": WokwiProps;
      "wokwi-nano-rp2040-connect": WokwiProps;
      "wokwi-led": WokwiProps;
      "wokwi-rgb-led": WokwiProps;
      "wokwi-led-bar-graph": WokwiProps;
      "wokwi-neopixel": WokwiProps;
      "wokwi-led-ring": WokwiProps;
      "wokwi-buzzer": WokwiProps;
      "wokwi-ks2e-m-dc5": WokwiProps;
      "wokwi-lcd1602": WokwiProps;
      "wokwi-lcd2004": WokwiProps;
      "wokwi-ssd1306": WokwiProps;
      "wokwi-7segment": WokwiProps;
      "wokwi-ili9341": WokwiProps;
      "wokwi-pushbutton": WokwiProps;
      "wokwi-slide-switch": WokwiProps;
      "wokwi-tilt-switch": WokwiProps;
      "wokwi-potentiometer": WokwiProps;
      "wokwi-slide-potentiometer": WokwiProps;
      "wokwi-analog-joystick": WokwiProps;
      "wokwi-membrane-keypad": WokwiProps;
      "wokwi-ky-040": WokwiProps;
      "wokwi-hc-sr04": WokwiProps;
      "wokwi-pir-motion-sensor": WokwiProps;
      "wokwi-dht22": WokwiProps;
      "wokwi-ntc-temperature-sensor": WokwiProps;
      "wokwi-photoresistor-sensor": WokwiProps;
      "wokwi-small-sound-sensor": WokwiProps;
      "wokwi-gas-sensor": WokwiProps;
      "wokwi-flame-sensor": WokwiProps;
      "wokwi-mpu6050": WokwiProps;
      "wokwi-ir-receiver": WokwiProps;
      "wokwi-servo": WokwiProps;
      "wokwi-stepper-motor": WokwiProps;
      "wokwi-ds1307": WokwiProps;
      "wokwi-microsd-card": WokwiProps;
      "wokwi-hx711": WokwiProps;
      "wokwi-resistor": WokwiProps;
    }
  }
}
