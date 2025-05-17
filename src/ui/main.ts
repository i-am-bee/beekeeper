import { Logger } from "beeai-framework";
import { Monitor } from "./monitor.js";

new Monitor("Bee Supervisor Monitor", Logger.root).start("./output");
