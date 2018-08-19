const sinon = require('sinon');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const it = require('mocha').it;

describe('FnStack', () => {

    const FnStack = require('../lib/FnStack');

    describe('Constructor', () => {

        it('Creates a new instance', () => {
            const stack = new FnStack(sinon.spy(), true);
            expect(stack).to.be.instanceof(FnStack);
        });

    });

    describe('use', () => {
        it('Adds middleware function to stack', async () => {
            const stack = new FnStack();
            const fn1 = sinon.stub().resolves();
            const fn2 = sinon.stub().resolves();

            stack.use(fn1, fn2);

            await stack.fn('arg1', 'arg2');

            sinon.assert.calledOnce(fn1);
            sinon.assert.calledOnce(fn2);

            sinon.assert.calledWith(fn1, 'arg1', 'arg2');
            sinon.assert.calledWith(fn2, 'arg1', 'arg2');

            sinon.assert.callOrder(fn1, fn2);
        });
    });

    describe('catch', () => {
        it('Adds error handler middleware function to stack', async () => {
            const stack = new FnStack();

            const err = new Error('crash');

            const fn1 = sinon.stub().resolves();
            const fn2 = sinon.stub().rejects(err);
            const fn3 = sinon.stub().resolves();
            const fn4 = sinon.stub().resolves();
            const fn5 = sinon.stub().resolves();
            const fn6 = sinon.stub().resolves();

            stack.use(fn1);
            stack.use(fn2);
            stack.use(fn3);
            stack.catch(fn4);
            stack.catch(fn5);
            stack.use(fn6);

            await stack.fn('arg1', 'arg2');

            sinon.assert.calledOnce(fn1);
            sinon.assert.calledOnce(fn2);
            sinon.assert.notCalled(fn3);
            sinon.assert.calledOnce(fn4);
            sinon.assert.notCalled(fn5);
            sinon.assert.calledOnce(fn6);

            sinon.assert.calledWith(fn1, 'arg1', 'arg2');
            sinon.assert.calledWith(fn2, 'arg1', 'arg2');
            sinon.assert.calledWith(fn4, err);
            sinon.assert.calledWith(fn6, 'arg1', 'arg2');

            sinon.assert.callOrder(fn1, fn2, fn4, fn6);
        });
    });

    describe('fn', () => {
        it('is the stack as an async function', () => {
            const stack = new FnStack();
            expect(stack.fn).to.be.a('function');
        });

        it('throws un handled errors from stack', async () => {
            const stack = new FnStack();

            const err = new Error('crash');

            const fn1 = sinon.stub().throws(err);
            const fn2 = sinon.stub().resolves();

            stack.use(fn1, fn2);

            let thrown;
            try {
                await stack.fn();
            } catch (e) {
                thrown = e;
            }

            expect(thrown).to.be.equal(err);
            sinon.assert.calledOnce(fn1);
            sinon.assert.notCalled(fn2);
        });

        it('returns last middleware result', async () => {
            const stack = new FnStack();

            const fn1 = sinon.stub().resolves(100);
            const fn2 = sinon.stub().resolves(200);

            stack.use(fn1, fn2);

            const res = await stack.fn();

            expect(res).to.be.equal(200);
        });
    });

    describe('NO_NEXT', () => {
        it('is a symbol', () => {
            expect(FnStack.NO_NEXT).to.be.a('symbol');
        });

        it('Aborts stack execution when returned from a middleware', async () => {
            const stack = new FnStack();

            const fn1 = sinon.stub().resolves(FnStack.NO_NEXT);
            const fn2 = sinon.stub().resolves();

            stack.use(fn1, fn2);

            await stack.fn();

            sinon.assert.calledOnce(fn1);
            sinon.assert.notCalled(fn2);
        });
    });
});
