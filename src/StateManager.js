const STATE = Symbol();
const fsPromises = require('fs').promises;

class StateManager {
    constructor(config = {}) {
        this[STATE] = {};

        this.config = Object.assign({
            path: '',
            initialStateSet : false,
            saveStateReadable : false,
        }, config);
    }

    /**
     * Load the state from a file.
     * Path of the file is specified in the config.
     */
    async loadState() {
        let { path } = this.config;

        if(!path)
            throw new Error('No path specified in config');

        let file = await fsPromises.readFile(path, {
            encoding: 'utf8'
        });

        let state = JSON.parse(file);
        this[STATE] = Object.assign(this[STATE], state);

    }

    /**
     * Save the state to a file.
     * Path of the file is specified in the config.
     */
    async saveState() {
        let { path, saveStateReadable} = this.config;
        let jsonString;

        if(!path)
            throw new Error('No path specified in config');

        if(saveStateReadable)
            jsonString = JSON.stringify(this[STATE], null, 2);
        else
            jsonString = JSON.stringify(this[STATE]);

        await fsPromises.writeFile(path, jsonString, {
            encoding: 'utf8'
        });
    }

    /**
     * Add new element to the state or change existing element of the state.
     * Only works with top level indexes.
     * 
     * @param {Object} newState 
     */
    async setState(newState) {
        let stateToUpdate = Object.assign(this[STATE], newState);

        let shouldUpdate = true;
        if (this.stateWillUpdate)
            shouldUpdate = await this.stateWillUpdate(this[STATE], stateToUpdate);

        if(shouldUpdate) {
            this[STATE] = stateToUpdate;

            if(this.config.path)
                await this.saveState();

            if (this.stateDidUpdate)
                this.stateDidUpdate(this[STATE], stateToUpdate);
        }
    }

    /**
     * Return the state for variable .state
     */
    get state() {
        return this[STATE];
    }

    /**
     * Set the initial state, only works once with .state = {};
     * After initial state setup use setState
     * 
     * @param {Object} newState 
     */
    set state(newState) {
        if(this.config.initialStateSet)
            throw new Error('Initial state is already set! Use setState to save new elements to the state.');

        this.config.initialStateSet = true;
        this[STATE] = newState;
    }
}

module.exports = StateManager;