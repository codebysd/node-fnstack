const Fn = require('./Fn');

/**
 * Stack of middleware functions.
 */
module.exports = class FnStack {

    /**
     * Constructor.
     */
    constructor() {
        // init functions array
        this._fns = [];
    }

    /**
     * Add one or more middleware function(s) to stack.
     * @param {...function} fns middleware function(s)
     */
    use(...fns) {
        this._fns.push(...(fns.map(f => new Fn(f, false))));
    }

    /**
     * Add one or more error catching middleware function(s) to stack.
     * @param {...function} fns error catching middleware function(s)
     */
    catch(...fns) {
        this._fns.push(...(fns.map(f => new Fn(f, true))));
    }

    /**
     * Token to stop stack from executing any further.
     */
    static get NO_NEXT() {
        return Fn.NO_NEXT;
    }

    /**
     * @type {function(...*)}
     * The stack as a single async function.
     */
    get fn() {
        // execute logic
        return async (...args) => {
            // stack context
            let context = {};

            // invoke all stack functions
            for (let fn of this._fns) {
                context = await fn.invoke(context, ...args);
                if (Fn.NO_NEXT === context.output) {
                    break;
                }
            }

            // throw any error collected
            if (context.error) {
                throw context.error;
            } else {
                return context.output;
            }
        };
    }
};
