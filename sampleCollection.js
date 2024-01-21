
import { Constants } from "./constants.js";
import { Database } from "./database.js";
import { LabelGenerator } from "./labelGenerator.js";
import { spectrogramBuilder } from "./dynamicVariables.js";

(async () => {

    const labelGenerator = new LabelGenerator({
        keywords: ["LARS", "LPCS", "IAD", "CELL-1", "CELL-2", "NRT"]
    });

    // Instantiate a connection to the database
    const database = new Database({ databaseName: "KeywordSpectra", objectStoreName: "KeywordSpectraStore" });
    await database.waitForDatabaseToLoad();

    // Generate label codes and script, and create a row in the table for each.
    for (let labelCode of labelGenerator.listLabelCodes()) {
        for (let propertyString of ["t", "v"]) {
            const script = labelGenerator.labelCodeToScript(labelCode);
            const divInTable = sampleDivTemplate.content.cloneNode(true).querySelector(`div`);
            sampleCollectionDiv.appendChild(divInTable);
            const labelPrefix = `c1_l${labelCode}_${propertyString}_s`;
            divInTable.querySelector(`.labelSpan`).innerHTML = labelPrefix;
            divInTable.querySelector(`.scriptSpan`).innerHTML = `"${randomlyReorderWords(script)}"`;

            // Initialize the sample count in the UI
            const existingSampleCount = await getExistingSampleCount(database, labelPrefix);
            divInTable.querySelector(`.countSpan`).innerHTML = `${existingSampleCount} samples stored`;

            // Configure the listener for collecting a sample
            divInTable.querySelector(`.collectButton`).addEventListener("click", async () => {
                console.log(`Collect button clicked`);
                // Generate the next key
                const existingSampleCount = await getExistingSampleCount(database, labelPrefix);
                const nextKey = `${labelPrefix}${existingSampleCount}`;

                // Collect a spectrogram and save the result in the database
                const listener = spectrogramBuilder.addOnFullListener(() => {
                    console.log(`Got this listener started`);
                    spectrogramBuilder.removeOnFullListener(listener);
                    database.write({ key: nextKey, value: spectrogramBuilder.getSpectra() });
                    console.log(`database write initiated`);

                    // Update the UI to reflect the new data saved
                    getExistingSampleCount(database, labelPrefix).then((newExistingSampleCount) => {
                        divInTable.querySelector(`.countSpan`).innerHTML = `${newExistingSampleCount} samples stored`;
                    });
                });

                if (recordButton.innerHTML === Constants.START_RECORDING_MIC_AUDIO) buildSpectrogramButton.click();
                
            });

            // Configure the listener for deleting the last sample
            divInTable.querySelector(`.clearLatestSampleButton`).addEventListener("click", async () => {
                // Find the last key for this labelPrefix in the database
                getExistingSampleCount(database, labelPrefix).then((currentSampleCount) => {
                    // Action is only needed if there is any sample saved under this labelPrefix
                    if (currentSampleCount > 0) {
                        // Once we have the key to delete, delete the database entry
                        database.delete(`${labelPrefix}${currentSampleCount - 1}`).then(
                            // Once the delete is finished, update the countSpan
                            getExistingSampleCount(database, labelPrefix).then((newExistingSampleCount) => {
                                divInTable.querySelector(`.countSpan`).innerHTML = `${newExistingSampleCount} samples stored`;
                            })
                        );
                    }
                });
            });
        }
    }

})();

async function getExistingSampleCount(database, labelPrefix) {
    let existingSampleCount = 0;
    // Use a for loop in place of a while(true) to limit the number of samples we can bring
    // in to 100.
    for (let i = 0; i < 100; i++) {
        const speculativeKey = `${labelPrefix}${existingSampleCount}`;
        if (await database.hasKey(speculativeKey)) {
            existingSampleCount++;
        } else {
            break;
        }
    }
    return existingSampleCount;
}

function randomlyReorderWords(stringWithSpaceDelimitedWords) {
    let words = stringWithSpaceDelimitedWords.split(" ");
    let shuffledWords = "";
    while (words.length > 0) {
        if (shuffledWords !== "") shuffledWords += " ";
        const randomIndex = parseInt(Math.random() * words.length);
        shuffledWords += words[randomIndex];
        words.splice(randomIndex, 1);
    }
    return shuffledWords;
}