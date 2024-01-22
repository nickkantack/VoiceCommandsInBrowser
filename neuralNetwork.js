
class SpectrogramPreprocessor extends tf.layers.Layer {

    // This static field must be defined or tensorflowjs cannot save and load models that use this
    // customer layer
    static className = "SpectrogramPreprocessor";

    constructor(args) {
        super(args)
    }

    computeOutputShape(inputShape) {
        // inputShape is an array of dimensions. Be sure not to modify inputShape because it refers to
        // an array in memory that is used elsewhere. Modifying inputShape can lead to some confusing
        // errors from withing the TensorflowJs library.
        let outputShape = [...inputShape];
        // The output of this layer adds a "channel" dimension in preparation for use in a convolutional
        // neural network.
        outputShape.push(1);
        return outputShape;
    }

    call(input, kwargs) {
        // the input argument can be an array with only one element, and in this case the element
        // is the tensor we want to process.
        let _input;
        if (Array.isArray(input)) {
            _input = input[0];
        } else {
            _input = input;
        }

        // Perform a check on dimensions because later in this method we will make assumptions about
        // the dimensions of the input tensor when we want to append a new "channel" dimension to the end.
        if (_input.shape.length !== 3) {
            throw new Error(`${this.getClassName()} cannot process non-4D dimensional data. Got input of shape ${_input.shape}`);
        }

        const { mean, variance } = tf.moments(_input);
        let standardDeviation = tf.sqrt(variance).add(1); // This 1 is technically 1 dB
        const result = _input.sub(mean).div(standardDeviation).expandDims(3);
        return result;
    }

    getClassName() {
        return "SpectrogramPreprocessor";
    }

}

tf.serialization.registerClass(SpectrogramPreprocessor);

export function spectrogramPreprocessor() {
    return new SpectrogramPreprocessor();
}

export { SpectrogramPreprocessor }
