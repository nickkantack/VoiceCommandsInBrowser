
# Voice Commands in Browser
This project enables the training of an in-browser convolutional neural network for identifying the presence and absense of keywords in recordings of short phrases. The use case explored in this project is giving voice commands to drive automated actions in the browser.

## Database Management
The data for training and testing the model is stored in an IndexedDB database. The keys for the entries contain information about the label for the sample, whether it is training or validation, and which "collection" it belongs to, where collection is a term I coined to refer to data that is from the same generation of this application. For instance, the first day that I ever attempted to train a model using this project would use data from the first collection. A week later I might make changes to the number of bins in the Fourier Transform or the length of the samples, and this would warrant creating new data that is part of a new collection.

Each key in the database will follow this convention:
```
c{collection_number}_l{label_code}_s{sample_number}_{property_string}
```
* `{collection_number}` is an integer indicating to which collection this sample belongs.
* `{label_code}` is a string that, when parsed, indicates which key words are present in the sample.
* `{sample_number}` is an integer indicating which arbitrary index this particular sample has among other samples that belong to the same collection and have the same label and properties.
* `{property_string}` is a string that, when parsed, indicates additional properties about the sample, like whether it is earmarked for training or for validation.

An example key would be the following:
```
c2_l0010_s3_t
```
This key indicates that is belongs to collection 2, the label is 0010 (could indicate there are 4 keyword categories and keyword 3 was preent while the other keywords were not), this is the 3rd sample, and this is a sample for training (vs. validation).