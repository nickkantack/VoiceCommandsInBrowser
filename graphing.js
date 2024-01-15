
class GraphingUtil {

    static graphArray(graph, array) {
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

    static plotSpectrogram(canvas, spectra) {
        setTimeout(() => {
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = `rbg(255, 255, 255)`;
            ctx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);

            let maxValue = Number.NEGATIVE_INFINITY;
            let minValue = Number.POSITIVE_INFINITY;
            for (let spectrum of spectra) {
                for (let element of spectrum) {
                    if (element > maxValue) maxValue = element;
                    if (element < minValue) minValue = element;
                }
            }
            for (let s = 0; s < spectra.length; s++) {
                const spectrum = spectra[s];
                for (let i = 0; i < spectrum.length; i++) {
                    let element = spectrum[i];
                    const colorScore = parseInt(255 * ((element - minValue) / 
                        (maxValue - minValue + 1E-4)));
                    const dilation = 2;
                    ctx.fillStyle = `rgb(${colorScore}, ${colorScore}, ${colorScore})`;
                    ctx.fillRect(dilation * s, dilation * i, dilation, dilation);
                }
            }
        }, 0);
    }

}

export { GraphingUtil }