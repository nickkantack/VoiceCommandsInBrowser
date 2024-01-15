
import { Debouncer } from "./util.js";

let audioContext;
let source;
let animationFrame;
let isRecordButtonPressed = false;
let frameCount = 0;
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
    analyzer.fftSize = 2048;

    const frameFunction = () => {
        animationFrame = requestAnimationFrame(frameFunction);
        const dataArray = new Float32Array(parseInt(analyzer.fftSize / 2));
        analyzer.getFloatFrequencyData(dataArray);
        graphArray(dataArray);
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

function graphArray(array) {
    for (let child of graph.querySelectorAll("path")) graph.removeChild(child);

    let maxAbsInArray = 0;
    for (let element of array) {
        if (Math.abs(element) > maxAbsInArray) maxAbsInArray = Math.abs(element);
        if (isNaN(parseFloat(statsDiv.innerHTML)) || element > parseFloat(statsDiv.innerHTML)) statsDiv.innerHTML = element;
    }
    
    for (let i = 0; i < array.length - 1; i++) {
        if (isNaN(array[i]) || isNaN(array[i + 1])) continue;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute(`stroke-width`, `0.5`);
        path.setAttribute(`stroke`, `#000`);
        path.setAttribute(`d`, `M${i / array.length * 100} ${50 - 50 / maxAbsInArray * array[i]} L${(i + 1) / array.length * 100} ${50 - 50 / maxAbsInArray * array[i + 1]}`);
        graph.appendChild(path);
    }
}

// Run the debounce test