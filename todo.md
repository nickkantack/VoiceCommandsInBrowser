
### Rough outline of tasks
1. Figure out how to record audio and collect the fourier transform data that would be needed to create a spectrogram. This should just involve creating an array of short term Fourier transforms where a new entry is made to the top level array on each animation frame request or by an Interval.
1. Consider plotting the spectrogram in the browser to see what you are working with. Just try drawing rectangles of pixel dimension 1 on a canvas.
1. Create an automatic trimming algorithm and use the visualization to show that it indeed trims appropriately.
1. Consider exploring how to save spectrograms off the canvas as images since this will allow you to test training a Tensorflow model in Python rather than having to set everything up in the browser.