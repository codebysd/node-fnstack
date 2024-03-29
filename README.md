[![npm downloads](https://img.shields.io/npm/dt/node-fnstack.svg)](https://www.npmjs.com/package/node-fnstack)
[![Open issues](https://img.shields.io/github/issues/codebysd/node-fnstack.svg)](https://github.com/codebysd/node-fnstack/issues)
[![Pull requests](https://img.shields.io/github/issues-pr/codebysd/node-fnstack.svg)](https://github.com/codebysd/node-fnstack/pulls)

# node-fnstack
Async middleware function stack inspired by ExpressJS

## Why ?
This is a standalone, simple and async version of middleware function stack popularized by [ExpressJS](https://expressjs.com/en/guide/using-middleware.html). It can be used for setting up arbitrary function stacks.

In itself, it is a powerful concept of building a one way processing pipeline composed of functions, 
all working sequentially on the same data.

## Quick Tour

Install:

```bash
npm install node-fnstack --save
```

A typical stack:

```javascript
// import
const FnStack = require('node-fnstack');

// create one
const stack = new FnStack();

// setup async middleware
stack.use( cors );
stack.use( bodyParser );
stack.use( dbConnect );
stack.use( session );

// your custom async function
stack.use( fn );

// error handlers as well
stack.catch( errorHandler );
```

Calling the stack:

```javascript
// the entire stack as a single async function
const fn = stack.fn;

// call as an async function, 
// arguments will be offered to each middleware
// any error will be offered to the next catch middleware
await fn(arg1, arg2);
```

Going meta level:

```javascript
// since the entire stack is also a single async function
const fn = stack.fn;

// it can be used as an async middleware too
const parentStack = new FnStack();
parentStack.use(fn);

// and it will be called from parent
await parentStack.fn(arg1, arg2);
```

## API

A single class `FnStack` is exported.

### `FnStack`

Represents the async middleware stack.

#### Methods

#### `use(...fns)`

Add one or more async middleware function to the stack. When stack is invoked, these functions are 
invoked in the same order they were added, and with same arguments as the stack is invoked with.

Example:

```javascript
const FnStack = require('node-fnstack');

const stack = new FnStack();

stack.use(  
           async (x) => console.log('fn1',x), 
           async (x) => console.log('fn2',x)
         );
stack.use(async (x) => console.log('fn3',x));

const run = async () => await stack.fn(10);

run();
```

Output:
```
fn1 10
fn2 10
fn3 10
```

#### `catch(...fns)`

Add one or more async error handler function to the stack. When an error is thrown by any stack 
middleware, the normal middleware are skipped and instead the next error handler function in stack 
is called with error. Error handler functions are NOT called if there is no error propagating 
along the stack.

Example:

```javascript
const FnStack = require('node-fnstack');

const stack = new FnStack();

stack.use(async (x) => {throw new Error('crash');});
stack.use(async (x) => console.log('fn1',x));
stack.catch(async (e) => console.log('caught'));
stack.use(async (x) => console.log('fn2',x));

const run = async () => await stack.fn(10);

run();
```

Output:

```
caught
fn2 10
```

#### Properties

#### `fn`

This property represents the entire stack as a single async middleware function.

Example:

```javascript
const FnStack = require('node-fnstack');

const stack = new FnStack();
stack.use(async () => console.log('fn11'));
stack.use(async () => console.log('fn12'));

const parentStack = new FnStack();
parentStack.use(async () => console.log('fn1'));

parentStack.use(stack.fn); // <-- child stack

parentStack.use(async () => console.log('fn2'));

const run = async () => await parentStack.fn(10);

run();
```

Output:

```
fn1
fn11
fn12
fn2
```

#### `NO_NEXT`

Sometimes its required to abort the stack execution. That is, no further middleware functions 
should be invoked. For this a middleware function can return or resolve a special value:
`FnStack.NO_NEXT`

Example:

```javascript
const FnStack = require('node-fnstack');

const stack = new FnStack();

stack.use(async (x) => console.log('fn1',x));
stack.use(async (x) => FnStack.NO_NEXT);
stack.use(async (x) => console.log('fn2',x));

const run = async () => await stack.fn(10);

run();
```

Output:

```
fn1 10
```

