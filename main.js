
import { Debouncer, Shuffler } from "./util.js";
import { GraphingUtil } from "./graphing.js";
import { SpectrogramBuilder } from "./spectrogramBuilder.js";
import { Database } from "./database.js";
import { Constants } from "./constants.js";
import { LabelGenerator } from "./labelGenerator.js";
import { spectrogramBuilder } from "./dynamicVariables.js";
import { SpectrogramPreprocessor } from "./neuralNetwork.js";

let audioContext;
let source;
let animationFrame;
let isRecordButtonPressed = false;
let doBuildSpectrum = false;

recordButton.addEventListener("click", () => {

    if (isRecordButtonPressed) {
        isRecordButtonPressed = false;
        cancelAnimationFrame(animationFrame);
        recordButton.innerHTML = Constants.START_RECORDING_MIC_AUDIO;
        statsDiv.innerHTML = "";
        return;
    }
    recordButton.innerHTML = Constants.STOP_RECORDING_MIC_AUDIO;
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

buildSpectrogramButton.addEventListener("click", () => {
    if (spectrogramBuilder.isFull()) spectrogramBuilder.reset();
    if (recordButton.innerHTML === Constants.START_RECORDING_MIC_AUDIO) recordButton.click();
    doBuildSpectrum = true;
    // Make the recording stop once the spectrogram collection is finished
    const listenerKey = spectrogramBuilder.addOnFullListener(() => {
        if (recordButton.innerHTML === Constants.STOP_RECORDING_MIC_AUDIO) recordButton.click();
        spectrogramBuilder.removeOnFullListener(listenerKey);
    });
});

// Create a neural network
// Define a model for linear regression. The script tag makes `tf` available
// as a global variable.

let model;
let database = new Database({ databaseName: "KeywordSpectra", objectStoreName: "KeywordSpectraStore" });

(async () => {

    try {
        model = await tf.loadLayersModel('indexeddb://my-model');
        console.log(`Succeeded in loading model`);
    } catch (e) {

        console.log(`Failed to load the model. Building from scratch`);
        console.error(e);

        model = tf.sequential();
        model.add(new SpectrogramPreprocessor({ inputShape: [60, 256] }));

        model.add(tf.layers.conv2d({ filters: 8, kernelSize: [3, 3], activation: "relu" }));
        model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.2 }));

        model.add(tf.layers.conv2d({ filters: 16, kernelSize: [3, 3], activation: "relu" }));
        model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.2 }));

        model.add(tf.layers.conv2d({ filters: 32, kernelSize: [3, 3], activation: "relu" }));
        model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.2 }));

        model.add(tf.layers.conv2d({ filters: 64, kernelSize: [3, 3], activation: "relu" }));
        model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.2 }));

        model.add(tf.layers.conv2d({ filters: 64, kernelSize: [1, 3], activation: "relu" }));
        model.add(tf.layers.maxPooling2d({ poolSize: [1, 2] }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.2 }));

        model.add(tf.layers.conv2d({ filters: 64, kernelSize: [1, 4], activation: "relu" }));
        model.add(tf.layers.maxPooling2d({ poolSize: [1, 3] }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.2 }));

        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({ units: 128, activation: "tanh" }));
        model.add(tf.layers.dense({ units: 4, activation: "tanh" }));

    }

    model.summary();

    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

    const randomInput = tf.randomNormal([1, 60, 256]);
    // randomInput.print();

    // new SpectrogramPreprocessor().apply(randomInput).print();

    const startTime = Date.now();
    model.predict(randomInput);
    const endTime = Date.now();
    console.log(`Did a forward pass in ${endTime - startTime} milliseconds`);

    /*
    // Generate some synthetic data for training.
    const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
    const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

    // Train the model using the data.
    model.fit(xs, ys, {epochs: 10}).then(() => {
        // Use the model to do inference on a data point the model hasn't seen before:
        model.predict(tf.tensor2d([5], [1, 1])).print();
        // Open the browser devtools to see the output
    });
    */

    // Save the model
    await model.save('indexeddb://my-model');

})();

trainModelButton.addEventListener("click", async () => {

    if (!model) {
        console.warn(`Can't train a null model. No training started.`);
        return;
    }

    if (!database) {
        console.warn(`Unable to train since the database object is null`);
        return;
    }

    const individualSpectrogramTrainingTensors = [];
    const individualLabelTrainingTensors = [];
    const individualSpectrogramValidationTensors = [];
    const individualLabelValidationTensors = [];

    for (let labelSpan of sampleCollectionDiv.querySelectorAll(`.labelSpan`)) {
        const labelPrefix = labelSpan.innerHTML;
        for (let i = 0; i < 100; i++) {
            const databaseKey = `${labelPrefix}${i}`;
            if (await database.hasKey(databaseKey)) {
                const inputTensor = tf.tensor(await database.read(databaseKey)).expandDims(0);
                const labelArray = /l([01]+)/.exec(labelPrefix)[1].split("").map(x => parseInt(x));
                const labelTensor = tf.tensor(labelArray).expandDims(0);

                if (/t/.test(labelPrefix)) {
                    individualSpectrogramTrainingTensors.push(inputTensor);
                    individualLabelTrainingTensors.push(labelTensor);
                } else {
                    individualSpectrogramValidationTensors.push(inputTensor);
                    individualLabelValidationTensors.push(labelTensor);
                }
            }
        }
    }

    // Create an array of randomized indices to allow us to shuffle the tensors collected before batching them
    // const randomIndicesOrder = Shuffler.getRandomIndicesListForLength(individualLabelTrainingTensors.length);
    // console.log(randomIndicesOrder);

    // Put all of the training data into a big tensor
    let oneBigSpectrogramTrainingTensor = null;
    let oneBigLabelTrainingTensor = null;
    for (let i = 0; i < individualSpectrogramTrainingTensors.length; i++) {
        if (!oneBigSpectrogramTrainingTensor) {
            oneBigSpectrogramTrainingTensor = individualSpectrogramTrainingTensors[i];
            oneBigLabelTrainingTensor = individualLabelTrainingTensors[i];
        } else {
            oneBigSpectrogramTrainingTensor = oneBigSpectrogramTrainingTensor.concat(individualSpectrogramTrainingTensors[i]);
            oneBigLabelTrainingTensor = oneBigLabelTrainingTensor.concat(individualLabelTrainingTensors[i]);
        }
    }
    console.log(`oneBigSpectrogramTrainingTensor has dimensions ${oneBigSpectrogramTrainingTensor.shape}`);
    console.log(`oneBigLabelTrainingTensor has dimensions ${oneBigLabelTrainingTensor.shape}`);

    // TODO do the same for the validation data

    // Run the fit
    const startTime = Date.now();
    model.fit(oneBigSpectrogramTrainingTensor, oneBigLabelTrainingTensor, { epochs: 10, batch_size: 1, shuffle: true }).then((result) => {
        console.log(`Model trained for ${oneBigSpectrogramTrainingTensor.shape[0]} samples and it tooks ${Date.now() - startTime} ms`);

        // Print the history
        console.log(result.history.loss);

        // Save the model
        model.save('indexeddb://my-model');
    });

   console.log(`Model training has started`);

});