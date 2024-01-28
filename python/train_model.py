
import json
import matplotlib.pyplot as plt
import tensorflow as tf
import keras
from pprint import pprint

LOAD_MODEL = True
TRAIN_MODEL = False

@keras.saving.register_keras_serializable('my_package')
class Preprocessor(tf.keras.layers.Layer):

  def __init__(self):
    super(Preprocessor, self).__init__()


  def build(self, input_shape):
    super().build(input_shape)


  def call(self, inputs):
    mean, var = tf.nn.moments(inputs, [1, 2], keepdims=True)
    minimum = tf.math.reduce_min(inputs, [1, 2], keepdims=True)
    result = tf.divide(tf.subtract(inputs, minimum + tf.sqrt(var)), 3 * tf.sqrt(var))
    return result


def main():

    # Read the saved file of data into an input tensor and a label tensor. Partition along training and validation
    lines = []
    with open("spectraData.txt", "r") as file:
        lines = file.readlines()

    print(f"Got {len(lines)} lines")

    training_inputs = None
    training_labels = None
    validation_inputs = None
    validation_labels = None

    for line in lines:

        parsedLine = json.loads(line)
        spectraData = []
        # 1000 is just a safe max, and should be longer than the second dimension of the 2D array
        for listAsObject in parsedLine["data"]:
            listForSpectraData = []
            for i in range(1000):
                if not str(i) in listAsObject.keys():
                    break
                listForSpectraData.append(listAsObject[str(i)])
            spectraData.append(listForSpectraData)

        input_tensor = tf.expand_dims(tf.constant(spectraData), 0)

        # Make the label tensor
        text_label = parsedLine["label"].split("_")[1][1:]
        label_as_array = list(map(lambda x: int(x), text_label))
        label_tensor = tf.expand_dims(tf.constant(label_as_array), 0)

        if "t" in parsedLine["label"]:
            if training_inputs is None:
                training_inputs = input_tensor
                training_labels = label_tensor
            else:
                training_inputs = tf.concat([training_inputs, input_tensor], 0)
                training_labels = tf.concat([training_labels, label_tensor], 0)
        else:
            if validation_inputs is None:
                validation_inputs = input_tensor
                validation_labels = label_tensor
            else:
                validation_inputs = tf.concat([validation_inputs, input_tensor], 0)
                validation_labels = tf.concat([validation_labels, label_tensor], 0)


    # Add a channel dimension
    training_inputs = tf.expand_dims(training_inputs, 3)
    validation_inputs = tf.expand_dims(validation_inputs, 3)

    # Create a dataloader or dataset or whatever tensorflow uses
    train_dataset = tf.data.Dataset.from_tensor_slices((training_inputs, training_labels))
    test_dataset = tf.data.Dataset.from_tensor_slices((validation_inputs, validation_labels))
    BATCH_SIZE = 64
    SHUFFLE_BUFFER_SIZE = 100

    train_dataset = train_dataset.shuffle(SHUFFLE_BUFFER_SIZE).batch(BATCH_SIZE)
    test_dataset = test_dataset.batch(BATCH_SIZE)

    # Create a model using the same architecture as the end of conversation detection
    model = tf.keras.Sequential([

        Preprocessor(),

        tf.keras.layers.Conv2D(8, (3, 3)),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((1, 2)),

        tf.keras.layers.Conv2D(16, (2, 3)),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((1, 2)),

        tf.keras.layers.Conv2D(24, (2, 3)),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((2, 2)),

        tf.keras.layers.Conv2D(32, (2, 3)),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((2, 2)),

        tf.keras.layers.Conv2D(48, (2, 3)),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.BatchNormalization(),

        tf.keras.layers.Conv2D(64, (3, 3)),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.AveragePooling2D((3, 3)),

        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(4, activation='sigmoid'),
    ])

    if LOAD_MODEL:
        print("Scrapping newly initialized model for a saved one")
        model = tf.keras.models.load_model("model.keras")

    model.build(input_shape=(1, 60, 256, 1))

    # Make the intermediate model for looking at activations
    print(f"There are {len(model.layers)} total layers")

    model.summary()

    model.compile(optimizer=tf.keras.optimizers.legacy.Adam(learning_rate=1E-4),
                loss=tf.keras.losses.MeanSquaredError(),
                metrics=['mean_squared_error'])

    if TRAIN_MODEL:
        history = model.fit(train_dataset, epochs=600, 
                            validation_data=test_dataset)
        model.save("model.keras")


        plt.plot(history.history["loss"], label="training_loss")
        plt.plot(history.history["val_loss"], label="validation_loss")
        plt.legend()
        plt.show()

    # inspect_intermediate_layer(model, validation_inputs, index_of_layer_to_inspect=18)
    # model.save("model_for_browser_conversion")

    print("Done")


def inspect_intermediate_layer(model, training_inputs, index_of_layer_to_inspect):

    XX = model.input 
    YY = model.layers[index_of_layer_to_inspect].output
    # pprint(vars(model.layers[0])) # Prints attributes of the layer to help identify it
    print(model.layers[index_of_layer_to_inspect]._initial_weights) # Shows a weights tensor shape to help identify the layer
    new_model = tf.keras.models.Model(XX, YY)

    Xresult = new_model.predict(training_inputs[:2])

    print(Xresult.shape)
    _, axes = plt.subplots(8)
    for i in range(8):
        axes[i].imshow(Xresult[0, :, :, i])
    plt.show()


if __name__ == "__main__":
    main()

