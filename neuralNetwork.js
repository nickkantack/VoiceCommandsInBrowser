
class SpectrogramPreprocessor extends tf.layers.Layer {

    constructor(args) {
        super(args)
    }

    computeOutputShape(inputShape) {
        return inputShape;
    }

    call(input, kwargs) {
        const { mean, variance } = tf.moments(input);
        let standardDeviation = tf.sqrt(variance).add(1); // This 1 is technically 1 dB
        return input.sub(mean).div(standardDeviation);
    }

    getClassName() {
        return "SpectrogramPreprocessor";
    }

}

export { SpectrogramPreprocessor }
