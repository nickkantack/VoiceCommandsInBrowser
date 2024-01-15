
import { Debouncer } from "./util.js";
import { GraphingUtil } from "./graphing.js";
import { SpectrogramBuilder } from "./spectrogramBuilder.js";
import { Database } from "./database.js";

let audioContext;
let source;
let animationFrame;
let isRecordButtonPressed = false;
recordButton.addEventListener("click", () => {

    if (isRecordButtonPressed) {
        isRecordButtonPressed = false;
        cancelAnimationFrame(animationFrame);
        recordButton.innerHTML = `Start analyzing mic audio`;
        statsDiv.innerHTML = "";
        return;
    }
    recordButton.innerHTML = `Stop analyzing mic audio`;
    isRecordButtonPressed = true;

    // Lots inspired by https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
    audioContext = new AudioContext();

    // Create the analyzer
    const analyzer = audioContext.createAnalyser({
        sampleRate: 44000,
    });
    analyzer.fftSize = 512;

    const frameFunction = () => {
        animationFrame = requestAnimationFrame(frameFunction);
        const dataArray = new Float32Array(parseInt(analyzer.fftSize / 2));
        analyzer.getFloatFrequencyData(dataArray);
        GraphingUtil.graphArray(graph, dataArray);
        if (doBuildSpectrum) {
            spectrogramBuilder.updateSpectrum(dataArray);
            if (spectrogramBuilder.isFull()) {
                doBuildSpectrum = false;
                GraphingUtil.plotSpectrogram(spectrogramCanvas, spectrogramBuilder.getSpectra());
            }
        }
    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyzer);
        // Start the animation frame that regularly updates the data
        setTimeout(frameFunction, 1000)
    });
});

let doBuildSpectrum = false;
const spectrogramBuilder = new SpectrogramBuilder({ 
    millisBetweenConsecutiveSpectra: 50,
    numberOfSpectra: 60
 });
buildSpectrogramButton.addEventListener("click", () => {
    if (spectrogramBuilder.isFull()) spectrogramBuilder.reset();
    if (recordButton.innerHTML == `Start analyzing mic audio`) recordButton.click();
    doBuildSpectrum = true;
});