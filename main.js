
import { Debouncer } from "./util.js";
import { GraphingUtil } from "./graphing.js";
import { SpectrogramBuilder } from "./spectrogramBuilder.js";

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
            console.log(`Added spectrum. Spectrograph has ${spectrogramBuilder.getSpectra().length}`);
            if (spectrogramBuilder.isFull()) {
                doBuildSpectrum = false;
                // TODO graph the spectrogram
                setTimeout(() => {
                    const ctx = spectrogramCanvas.getContext("2d");
                    ctx.fillStyle = `rbg(255, 255, 255)`;
                    ctx.fillRect(0, 0, 120, 512);

                    let maxValue = Number.NEGATIVE_INFINITY;
                    let minValue = Number.POSITIVE_INFINITY;
                    for (let spectrum of spectrogramBuilder.getSpectra()) {
                        for (let element of spectrum) {
                            if (element > maxValue) maxValue = element;
                            if (element < minValue) minValue = element;
                        }
                    }
                    for (let s = 0; s < spectrogramBuilder.getSpectra().length; s++) {
                        const spectrum = spectrogramBuilder.getSpectra()[s];
                        for (let i = 0; i < spectrum.length; i++) {
                            console.log(`${parseInt(100 * (s * spectrogramBuilder.getSpectra().length + i) / (spectrogramBuilder.getSpectra().length * spectrogramBuilder.getSpectra()[0].length))}% done drawing.`);
                            let element = spectrum[i];
                            const colorScore = parseInt(255 * ((element - minValue) / (maxValue - minValue + 1E-4)));
                            console.log(colorScore);
                            const dilation = 2;
                            ctx.fillStyle = `rgb(${colorScore}, ${colorScore}, ${colorScore})`;
                            ctx.fillRect(dilation * s, dilation * i, dilation, dilation);
                        }
                    }
                }, 0);
            }
        }
    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyzer);
        // Start the animation frame that regularly updates the data
        setTimeout(() => {
            frameFunction();
        }, 1000)
    });
});

let doBuildSpectrum = false;
const spectrogramBuilder = new SpectrogramBuilder({ 
    millisBetweenConsecutiveSpectra: 50,
    numberOfSpectra: 30
 });
buildSpectrogramButton.addEventListener("click", () => {
    if (spectrogramBuilder.isFull()) spectrogramBuilder.reset();
    if (recordButton.innerHTML == `Start analyzing mic audio`) recordButton.click();
    doBuildSpectrum = true;
});