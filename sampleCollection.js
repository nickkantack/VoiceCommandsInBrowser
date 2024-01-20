
import { Database } from "./database.js";
import { LabelGenerator } from "./labelGenerator.js";

(async () => {

    const labelGenerator = new LabelGenerator({
        keywords: ["LARS", "LPCS", "IAD", "CELL 1", "CELL 2", "NRT"]
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

            // Initialize the sample count in the UI
            const existingSampleCount = await getExistingSampleCount(database, labelPrefix);
            divInTable.querySelector(`.countSpan`).innerHTML = `${existingSampleCount} samples stored`;

            divInTable.querySelector(`.collectButton`).addEventListener("click", async () => {
                // Generate the next key
                const existingSampleCount = await getExistingSampleCount(database, labelPrefix);
                const nextKey = `${labelPrefix}${existingSampleCount}`;

                // Collect a spectrogram and save the result in the database
                const listener = spectrogramBuilder.addOnFullListener(() => {
                    spectrogramBuilder.removeOnFullListener(listener);
                    database.write({ key: nextKey, value: spectrogramBuilder.getSpectra() });
                });

                // Update the UI to reflect the new data saved
                const newExistingSampleCount = await getExistingSampleCount(database, labelPrefix);
                divInTable.querySelector(`.countSpan`).innerHTML = `${newExistingSampleCount} samples stored`;
                
            });
            divInTable.querySelector(`.clearLatestSampleButton`).addEventListener("click", async () => {
                // TODO find the last key for this labelPrefix in the database
                // TODO delete the database entry
                // TODO update the countSpan
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