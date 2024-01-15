
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

}

export { GraphingUtil }