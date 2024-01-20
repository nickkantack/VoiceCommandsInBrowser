
class SpectrogramPreprocessor extends tf.layers.Layer {

    constructor(args) {
        super(args)
    }

    computeOutputShape(inputShape) {
        let outputShape = [...inputShape];
        outputShape.push(1);
        return outputShape;
    }

    call(input, kwargs) {
        // the input argument can be an array with only one element, and in this case the element
        // is the tensor we want to process.
        let _input;
        if (Array.isArray(input)) {
            console.log(input);
            _input = input[0];
        } else {
            _input = input;
        }
        const { mean, variance } = tf.moments(_input);
        let standardDeviation = tf.sqrt(variance).add(1); // This 1 is technically 1 dB
        return _input.sub(mean).div(standardDeviation).expandDims(2);
    }

    getClassName() {
        return "SpectrogramPreprocessor";
    }

}

export { SpectrogramPreprocessor }
