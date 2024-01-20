
import { ConfigUtil } from "./util.js";

class LabelGenerator {

    static MAXIMAL_TEMPLATE = {
        numberOfSamplesPerLabel: 5,
        keywords: null,
        nonKeyWords: null
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
        if (!args.keywords) this.#config.keywords = [];
        if (!args.nonKeyWords) this.#config.nonKeyWords = ["[RANDOM WORD]"];
    }

    listLabelCodes() {
        const result = [];
        // We want every combination of inclusion and exclusion for the 
        this.#recursivePopulateLabels("", result);
        return result;
    }

    #recursivePopulateLabels(currentLabel, labelList) {
        if (currentLabel.length === this.#config.keywords.length) {
            labelList.push(currentLabel);
            return;
        }
        for (let i = 0; i <= 1; i++) {
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