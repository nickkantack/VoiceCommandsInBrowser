
import { ConfigUtil } from "./util.js";

class SpectrogramBuilder {

    static MAXIMAL_TEMPLATE = {
        millisBetweenConsecutiveSpectra: null,
        numberOfSpectra: null
    };

    static MINIMAL_TEMPLATE = {
        millisBetweenConsecutiveSpectra: null,
        numberOfSpectra: null
    }

    #config;

    #spectra;
    #millisSinceEpochToPostNextSpectrum;
    #_isFull;
    #onFullListeners = {};

    constructor(args) {
        ConfigUtil.validateConfiguration({
            maximalTemplate: SpectrogramBuilder.MAXIMAL_TEMPLATE,
            minimalTemplate: SpectrogramBuilder.MINIMAL_TEMPLATE,
            configToValidate: args
        });
        this.#config = args;
        this.reset();
    }

    updateSpectrum(spectrum) {
        if (this.#_isFull || Date.now() < this.#millisSinceEpochToPostNextSpectrum) return;
        this.#millisSinceEpochToPostNextSpectrum = Date.now() + this.#config.millisBetweenConsecutiveSpectra;
        this.#spectra.push(spectrum);
        if (this.#spectra.length >= this.#config.numberOfSpectra) {
            this.#_isFull = true;
            console.log(`Dispatching ${Object.keys(this.#onFullListeners).length} listeners`);
            for (let listener of Object.values(this.#onFullListeners)) listener();
        }
    }

    getSpectra() {
        return this.#spectra;
    }

    reset() {
        this.#spectra = [];
        this.#_isFull = false;
        this.#millisSinceEpochToPostNextSpectrum = 0;
    }

    isFull() {
        return this.#_isFull;
    }

    addOnFullListener(callback) {
        let maxKey = -1;
        for (let key of Object.keys(this.#onFullListeners)) {
            if (key > maxKey) maxKey = key;
        }
        const newKey = maxKey + 1;
        this.#onFullListeners[newKey] = callback;
        return newKey;
    }

    removeOnFullListener(key) {
        if (this.#onFullListeners.hasOwnProperty(key)) {
            delete this.#onFullListeners.key;
        }
    }

}

export { SpectrogramBuilder }