
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
        if (this.#spectra.length >= this.#config.numberOfSpectra) this.#_isFull = true;
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

}

export { SpectrogramBuilder }