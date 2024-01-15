/**
 * This class helps in writing more readable Javascript by allowing methods of other classes
 * to be called with an object that carries all input arguments as values of key value pairs.
 * This provides the opportunity to explicitly name every argument passed to the method.
 * Furthermore, this class supports (and indeed requires) some amount of input validation that
 * occurs through the help of a "maximalTemplate" and a "minimalTemplate". The maximalTemplate
 * has keys which are the set of all allowed arguments for the function (i.e. an input object
 * is not allowed to have keys that are not also keys in the maximalTemplate). The 
 * maximalTemplate also has values which are defaults in case the passed in object doesn't
 * specify a value for any key. The minimalTemplate has a set of keys which each must be
 * present in the passed in argument. If any of these requirements are not met, a descriptive
 * error is thrown.
 */
class ConfigUtil {

    static validateConfiguration(args) {
        if (!args.maximalTemplate && !args.minimalTemplate) {
            throw new Error(`validateConfiguration must be given an input object that has either a maximalTemplate property or a minimalTemplate property. However, the input object had neither.`)
        }
        if (!args.configToValidate) {
            throw new Error(`validateConfiguration must be given an input object that has a configToValidate property. However, the input argument had no such property.`)
        }

        for (let key of Object.keys(args.configToValidate)) {
            if (!args.maximalTemplate.hasOwnProperty(key)) {
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
                args.configToValidate.key = args.maximalTemplate.key;
            }
        }

        return args.configToValidate;
    }

}

/**
 * This class abstracts away the logic of "debounce" from an application. Debounce is a process
 * of filtering a noisy signal so that the internal state of the debouncer only changes values
 * once attempt to set its internal state have stabilized on a consistent value for some time.
 * If, for instance, some code logic flips a logical flag very sporadically, this debouncer
 * class can provide a more stable flag that only changes state when the sporadic setting code
 * has not attempted a flip within the last X milliseconds, where X is configurable on the 
 * debouncer. This class supports polling the stabilized value of the debouncer as well as 
 * configuring a listener to fire once the stabilized value changes.
 */
class Debouncer {

    static MAXIMAL_TEMPLATE = {
        debouncePeriodMs: null,
        onStateChange: null
    }

    static MINIMAL_TEMPLATE = {
        debouncePeriodMs: null
    }

    #candidateInternalState = null;
    #internalState = null;
    #config = 0;
    #onStateChangeListeners = {};
    #stateChangeTimeout = null;

    constructor(args) {
        ConfigUtil.validateConfiguration({minimalTemplate: Debouncer.MINIMAL_TEMPLATE,
            maximalTemplate: Debouncer.MAXIMAL_TEMPLATE,
            configToValidate: args});
        this.#config = args;
    }

    setState(value) {
        if (value != this.#candidateInternalState) {
            this.#candidateInternalState = value;
            clearTimeout(this.#stateChangeTimeout);
            this.#stateChangeTimeout = setTimeout(() => {
                this.#internalState = value;
                for (let callback of Object.values(this.#onStateChangeListeners)) {
                    callback(value);
                }
            }, this.#config.debouncePeriodMs);
        }
    }

    forceState(value) {
        this.#internalState = value;
    }

    getState() {
        return this.#internalState;
    }

    addOnStateChangeListener(callback) {
        let maxKey = -1;
        for (let key of Object.keys(this.#onStateChangeListeners)) {
            if (key > maxKey) maxKey = key;
        }
        const newKey = maxKey + 1;
        this.#onStateChangeListeners.newKey = callback;
        return newKey;
    }

    removeOnStateChangeListener(key) {
        if (this.#onStateChangeListeners.hasOwnProperty(key)) {
            delete this.#onStateChangeListeners.key;
        }
    }

    /**
     * This method doesn't check any assertions but prints a periodic sequence of logs that
     * should reveal the debounce working correctly. Specifically, it calls setState with 
     * alternating arguments of true and false (the alternation does not happen on each request,
     * as this would prevent the state from ever changing, but rather it calls a large cluster
     * of setState(true) calls before switching to setState(false) and vice versa). The expected
     * behavior is that you see the state resist changing until the debouncePeriodMs has expired,
     * after which you get a single call to the change listener and a flip in the value returned
     * by getState().
     */
    test() {
        const debouncer = new Debouncer({debouncePeriodMs: 1000});
        debouncer.forceState(false);
        debouncer.addOnStateChangeListener((state) => {
            console.log(`State changed listener called with state ${state}`);   
        });
        let setCallCount = 0;
        setInterval(() => {
            setCallCount++;
            debouncer.setState(setCallCount % 12 > 5);
            console.log(`Called debouncer.setState(${setCallCount %12 > 5}) and getState() returns ${debouncer.getState()}`);
        }, 250);
    }

}

export { ConfigUtil, Debouncer }