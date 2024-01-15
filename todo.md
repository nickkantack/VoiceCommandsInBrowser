
### IndexedDB
1. Add functionality to save the latest spectrogram to IndexedBD as well as load from it.
1. Create a datastore plan so that you can keep spectrograms organized by their label. Think of some key words and let the database keys be a stringified version of the label, which is a binary code of whether or not each key word was said in the audio.
1. On page load assess the current state of the database.
1. Add a table to the UI that enumerates all permutations of three key words. The table should indicate how many samples are in the dataset right now and give the option to add more as well as clear all samples.
1. Have the UI facilitate the creation of a training and validation split.

### TensorflowJS
1. Create the architecture for a classification model.
1. Do some evaluation of how long a forward pass take.
1. Create a training loop that uses an in-memory copy of the saved dataset.
1. Train and see a monotonically decreasing loss for the training set and the validation dataset.