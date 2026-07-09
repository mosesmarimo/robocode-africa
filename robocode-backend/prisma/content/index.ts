import type { CourseModule } from "./types";
import { introRobotics } from "./intro-robotics";
import { codingArduino } from "./coding-arduino";
import { aiFoundations } from "./ai-foundations";
import { langPython } from "./lang-python";
import { langJavascript } from "./lang-javascript";
import { langTypescript } from "./lang-typescript";
import { langHtml } from "./lang-html";
import { langCss } from "./lang-css";
import { langGo } from "./lang-go";
import { langRust } from "./lang-rust";
import { langCpp } from "./lang-cpp";
import { langCsharp } from "./lang-csharp";
import { langSql } from "./lang-sql";
import { langArduino } from "./lang-arduino";
import { langMicropython } from "./lang-micropython";
import { roboEsp32 } from "./robo-esp32";
import { roboSensors } from "./robo-sensors";
import { roboPico } from "./robo-pico";
import { roboRaspberryPi } from "./robo-raspberry-pi";
import { roboPiArduino } from "./robo-pi-arduino";
import { aiModels } from "./ai-models";
import { aiJunior } from "./ai-junior";
import { pythonTutorialCourse } from "./tutorials-python";
import { javascriptTutorialCourse } from "./tutorials-javascript";
import { typescriptTutorialCourse } from "./tutorials-typescript";
import { sqlTutorialCourse } from "./tutorials-sql";
import { htmlTutorialCourse } from "./tutorials-html";
import { cssTutorialCourse } from "./tutorials-css";
import { goTutorialCourse } from "./tutorials-go";
import { rustTutorialCourse } from "./tutorials-rust";
import { cppTutorialCourse } from "./tutorials-cpp";
import { csharpTutorialCourse } from "./tutorials-csharp";
import { arduinoTutorialCourse } from "./tutorials-arduino";
import { micropythonTutorialCourse } from "./tutorials-micropython";

// Re-export individual modules so seed.ts can import by name
export { introRobotics } from "./intro-robotics";
export { codingArduino } from "./coding-arduino";
export { aiFoundations } from "./ai-foundations";
export { langPython } from "./lang-python";
export { langJavascript } from "./lang-javascript";
export { langTypescript } from "./lang-typescript";
export { langHtml } from "./lang-html";
export { langCss } from "./lang-css";
export { langGo } from "./lang-go";
export { langRust } from "./lang-rust";
export { langCpp } from "./lang-cpp";
export { langCsharp } from "./lang-csharp";
export { langSql } from "./lang-sql";
export { langArduino } from "./lang-arduino";
export { langMicropython } from "./lang-micropython";
export { roboEsp32 } from "./robo-esp32";
export { roboSensors } from "./robo-sensors";
export { roboPico } from "./robo-pico";
export { roboRaspberryPi } from "./robo-raspberry-pi";
export { roboPiArduino } from "./robo-pi-arduino";
export { aiModels } from "./ai-models";
export { aiJunior } from "./ai-junior";
export { pythonTutorialCourse } from "./tutorials-python";
export { javascriptTutorialCourse } from "./tutorials-javascript";
export { typescriptTutorialCourse } from "./tutorials-typescript";
export { sqlTutorialCourse } from "./tutorials-sql";
export { htmlTutorialCourse } from "./tutorials-html";
export { cssTutorialCourse } from "./tutorials-css";
export { goTutorialCourse } from "./tutorials-go";
export { rustTutorialCourse } from "./tutorials-rust";
export { cppTutorialCourse } from "./tutorials-cpp";
export { csharpTutorialCourse } from "./tutorials-csharp";
export { arduinoTutorialCourse } from "./tutorials-arduino";
export { micropythonTutorialCourse } from "./tutorials-micropython";

export const DEMO_MODULES: CourseModule[] = [introRobotics, codingArduino, aiFoundations];

// Language tutorial courses — Python, JavaScript, TypeScript, HTML, CSS, Go, Rust, C/C++, C#, SQL, Arduino, MicroPython
export const LANG_MODULES: CourseModule[] = [langPython, langJavascript, langTypescript, langHtml, langCss, langGo, langRust, langCpp, langCsharp, langSql, langArduino, langMicropython];

// Robotics deep-dive courses — ESP32, Sensors, Raspberry Pi Pico, Raspberry Pi, Pi+MCU integration
export const ROBOTICS_MODULES: CourseModule[] = [roboEsp32, roboSensors, roboPico, roboRaspberryPi, roboPiArduino];

// AI deep-dive courses — Know Your Models, AI Appreciation for Junior School
export const AI_MODULES: CourseModule[] = [aiModels, aiJunior];

// W3Schools-style language tutorial courses (5+ lessons each, live Try it Yourself examples)
export const TUTORIAL_MODULES: CourseModule[] = [
  pythonTutorialCourse,
  javascriptTutorialCourse,
  typescriptTutorialCourse,
  sqlTutorialCourse,
  htmlTutorialCourse,
  cssTutorialCourse,
  goTutorialCourse,
  rustTutorialCourse,
  cppTutorialCourse,
  csharpTutorialCourse,
  arduinoTutorialCourse,
  micropythonTutorialCourse,
];

export const CONTENT_MODULES: CourseModule[] = [...DEMO_MODULES, ...LANG_MODULES, ...ROBOTICS_MODULES, ...AI_MODULES, ...TUTORIAL_MODULES];
