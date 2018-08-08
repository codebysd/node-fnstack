/**
 * Symbol for Token to stop stack from executing any further.
 */
const SYM_NO_NEXT = Symbol('Token to stop stack from executing any further');

/**
 * Nil checker utility
 * @param {*} val value to test
 */
const isNil = (val) => val === null || val === undefined;

/**
 * Encapsulates a function as a middleware in stack.
 * @see invoke
 */
module.exports = class Fn {

    /**
     * Constructor.
     * @param {function} fn stack middleware function
     * @param {boolean} isCatcher mark function as error catching middleware in stack
     */
    constructor(fn, isCatcher = false) {
        this._fn = fn;
        this._isCatcher = isCatcher;
    }

    /**
     * Token to stop stack from executing any further.
     */
    static get NO_NEXT() {
        return SYM_NO_NEXT;
    }

    /**
     * Invoke middleware function (if applicable), updating output and error in given context.
     * @param {{output:any,error:Error}} context stack execution context
     * @param {...any} args middleware function arguments
     */
    async invoke(context, ...args) {

        // stop if previous output is abort token
        if (SYM_NO_NEXT === context.output) {
            return context;
        }

        // skip if fn is a catcher but no previous error
        if (isNil(context.error) && this._isCatcher) {
            return context;
        }

        // skip if previous error but fn is not a catcher
        if (!isNil(context.error) && !this._isCatcher) {
            return context;
        }

        // forward error if fn is a catcher, clear from context
        if (!isNil(context.error) && this._isCatcher) {
            // Previous error, function can catch
            args.unshift(context.error);
            delete context.error;
        }

        // invoke fn, update context with output or error
        try {
            context.output = await this._fn.apply(this._fn, args);
        } catch (err) {
            context.error = err;
        }

        // return updated context
        return context;
    }
};
