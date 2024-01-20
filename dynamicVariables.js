
import { SpectrogramBuilder } from "./spectrogramBuilder.js";

const spectrogramBuilder = new SpectrogramBuilder({ 
    millisBetweenConsecutiveSpectra: 50,
    numberOfSpectra: 60
 });

 export { spectrogramBuilder }