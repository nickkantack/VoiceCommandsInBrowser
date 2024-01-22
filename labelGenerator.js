
import { ConfigUtil } from "./util.js";

class LabelGenerator {

    static MAXIMAL_TEMPLATE = {
        maxLabelSum: 4,
        minLabelSum: 1,
        keywords: [],
        nonKeyWords: ["[RANDOM WORD]"]
    };

    static MINIMAL_TEMPLATE = {
    };

    #config;

    constructor(args) {
        ConfigUtil.validateConfiguration({
            maximalTemplate: LabelGenerator.MAXIMAL_TEMPLATE,
            minimalTemplate: LabelGenerator.MINIMAL_TEMPLATE,
            configToValidate: args
        });
        this.#config = args;
    }

    listLabelCodes() {
        const result = [];
        // We want every combination of inclusion and exclusion for the 
        this.#recursivePopulateLabels("", result);
        return result;
    }

    #recursivePopulateLabels(currentLabel, labelList) {
        if (currentLabel.length === this.#config.keywords.length) {
            // Don't add the label if it would violate the min label sum requirement
            if (this.#config.minLabelSum !== null && currentLabel.split("").filter(x => x === "1").length < this.#config.minLabelSum) return;
            labelList.push(currentLabel);
            return;
        }
        for (let i = 0; i <= 1; i++) {
            // If we've exhausted the max allowed number of 1s in the label, then don't add another 1
            if (i === 1 && this.#config.maxLabelSum !== null && currentLabel.split("").filter(x => x === "1").length === this.#config.maxLabelSum) continue;
            const improvedLabel = currentLabel + i;
            this.#recursivePopulateLabels(improvedLabel, labelList);
        }
    }

    labelCodeToScript(labelCode) {
        let scriptWords = [];
        for (let i = 0; i < labelCode.length; i++) {
            const flag = parseInt(labelCode.substring(i, i + 1));
            if (flag > 0) scriptWords.push(this.#config.keywords[i]);
        }
        let script = "";
        for (let i = 0; i < scriptWords.length; i++) {
            script += scriptWords[i];
            if (i < scriptWords.length - 1) script += " ";
        }
        return script;
    }

}

export { LabelGenerator }