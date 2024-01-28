
import json
import matplotlib.pyplot as plt
import tensorflow as tf
import keras

class Preprocessor(tf.keras.layers.Layer):

  def __init__(self):
    super(Preprocessor, self).__init__()


  def build(self, input_shape):
    super().build(input_shape)


  def call(self, inputs):
    mean, var = tf.nn.moments(inputs, [1, 2], keepdims=True)
    minimum = tf.math.reduce_min(inputs, [1, 2], keepdims=True)
    result = tf.divide(tf.subtract(inputs, minimum), tf.sqrt(var))
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
        # tf.keras.layers.Normalization(input_shape=(60, 256, 1)),

        tf.keras.layers.Conv2D(8, (3, 3)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((1, 2)),

        tf.keras.layers.Conv2D(12, (2, 3)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((1, 2)),

        tf.keras.layers.Conv2D(16, (2, 3)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((2, 2)),

        tf.keras.layers.Conv2D(20, (2, 3)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((2, 2)),

        tf.keras.layers.Conv2D(24, (2, 3)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.LeakyReLU(),
        tf.keras.layers.MaxPooling2D((2, 2)),

        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(36, activation='relu'),
        tf.keras.layers.Dense(4, activation='sigmoid'),
    ])

    model.build(input_shape=(1, 60, 256, 1))

    model.summary()

    model.compile(optimizer=tf.keras.optimizers.legacy.RMSprop(),
                loss=tf.keras.losses.MeanSquaredError(),
                metrics=['mean_squared_error'])

    # train the model
    history = model.fit(train_dataset, epochs=20, 
                        validation_data=test_dataset)

    plt.plot(history.history["loss"], label="training_loss")
    plt.plot(history.history["val_loss"], label="validation_loss")
    plt.legend()
    plt.show()


    print("Done")


if __name__ == "__main__":
    main()
