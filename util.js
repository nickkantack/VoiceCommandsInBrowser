
class ConfigUtil {

    static validateConfiguration(args) {
        if (!args.maximalTemplate && !args.minimalTemplate) {
            throw new Error(`validateConfiguration must be given an input object that has either a maximalTemplate property or a minimalTemplate property. However, the input object had neither.`)
        }
        if (!args.configToValidate) {
            throw new Error(`validateConfiguration must be given an input object that has a configToValidate property. However, the input argument had no such property.`)
        }

        for (let key of Object.key(args.configToValidate)) {
            if (!maximalTemplate.hasOwnProperty(key)) {
                throw new Error(`Passed in config has unrecognized property ${key}`);
            }
        }

        // TODO add detection for when the minimal template contains keys not in the maximal template

        if (args.minimalTemplate) {
            for (let key of Object.keys(args.minimalTemplate)) {
                if (!args.configToValidate.hasOwnProperty(key)) {
                    throw new Error(`Passed in config is missing required ${key} key`);
                }
            }
        }

        // Copy over defaults from maximal template
        for (let key of Object.keys(args.maximalTemplate)) {
            if (!args.configToValidate.hasOwnProperty(key)) {
                configToValidate.key = args.maximalTemplate.key;
            }
        }

        return configToValidate;
    }

}

class Debouncer {

    static MAXIMAL_TEMPLATE = {
        debouncePeriodMs: null,
        onStateChange: null
    }

    static MINIMAL_TEMPLATE = {
        debouncePeriodMs: null
    }

    #internalState = null;
    #config = 0;
    #onStateChange = null;

    constructor(args) {
        ConfigUtil.validateConfiguration({minimalTemplate: Debouncer.MINIMAL_TEMPLATE,
            maximalTemplate: Debouncer.MAXIMAL_TEMPLATE,
            configToValidate: args});
        this.#config = args.configToValidate;
    }

    setState() {

    }

    getState() {

    }

    // TODO consider supporting an arbitrary number of callbacks, where this method returns a key
    // referring to this callback and where you've added another method that removes callbacks which
    // takes in the key and can remove the specific callback if needed
    onStateChange(callback) {
        this.#onStateChange = callback;
    }

}

export { ConfigUtil }