const sinon = require('sinon');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const it = require('mocha').it;

describe('Fn', () => {

    const Fn = require('../lib/Fn');

    describe('Constructor', () => {

        it('Creates a new instance', () => {
            const fn = new Fn(sinon.spy(), true);
            expect(fn).to.be.instanceof(Fn);
        });

    });

    describe('NO_NEXT', () => {

        it('Is a symbol', () => {
            expect(Fn.NO_NEXT).to.be.a('symbol');
        });

    });

    describe('invoke', () => {

        it('Calls wrapped function with given args', async () => {
            const wrapped = sinon.stub().resolves();
            const fn = new Fn(wrapped);
            const args = ['a', 1, true];
            const context = {};

            await fn.invoke(context, ...args);

            sinon.assert.calledOnce(wrapped);
            sinon.assert.calledWith(wrapped, ...args);
        });

        it('Captures wrapped function output in context', async () => {
            const output = 'test output';
            const wrapped = sinon.stub().resolves(output);
            const fn = new Fn(wrapped);
            const args = ['a', 1, true];
            const context = {};

            await fn.invoke(context, ...args);

            expect(context.output).to.be.equal(output);
        });

        it('Captures wrapped function error in context', async () => {
            const err = new Error('test error');
            const wrapped = sinon.stub().rejects(err);
            const fn = new Fn(wrapped);
            const args = ['a', 1, true];
            const context = {};

            await fn.invoke(context, ...args);

            expect(context.error).to.be.equal(err);
        });

        it('Does not call any wrapped function if previous output is NO_NEXT', async () => {
            const wrapped1 = sinon.stub().resolves();
            const wrapped2 = sinon.stub().resolves();

            const fn1 = new Fn(wrapped1);
            const fn2 = new Fn(wrapped2, true);

            const args = ['a', 1, true];
            const context = { output: Fn.NO_NEXT };

            await fn1.invoke(context, ...args);
            sinon.assert.notCalled(wrapped1);

            context.error = new Error('test error');
            await fn2.invoke(context, ...args);
            sinon.assert.notCalled(wrapped2);
        });

        it('Does not call wrapped function if an existing error is in context', async () => {
            const output = 'test output';
            const err = new Error('test error');
            const wrapped = sinon.stub().resolves(output);
            const fn = new Fn(wrapped);
            const args = ['a', 1, true];
            const context = { error: err };

            await fn.invoke(context, ...args);

            sinon.assert.notCalled(wrapped);
            expect(context.output).to.be.not.equal(output);
            expect(context.error).to.be.equal(err);
        });

        it('Calls wrapped catcher function with existing error from context, clears context error', async () => {
            const output = 'test output';
            const err = new Error('test error');
            const wrapped = sinon.stub().resolves(output);
            const fn = new Fn(wrapped, true);
            const args = ['a', 1, true];
            const context = { error: err };

            await fn.invoke(context, ...args);

            sinon.assert.calledOnce(wrapped);
            sinon.assert.calledWith(wrapped, err, ...args);
            expect(context.output).to.be.equal(output);
            expect(context).to.not.haveOwnProperty('error');
        });

        it('Does not call wrapped catcher function if no existing error in context', async () => {
            const output = 'test output';
            const wrapped = sinon.stub().resolves(output);
            const fn = new Fn(wrapped, true);
            const args = ['a', 1, true];
            const context = {};

            await fn.invoke(context, ...args);

            sinon.assert.notCalled(wrapped);
            expect(context.output).to.be.not.equal(output);
            expect(context).to.not.haveOwnProperty('error');
        });
    });
});
