pimp
====

A simple (P)romise/A+ spec compliant (imp)lementation that I wrote to wrap my head around it.   
It passes all the tests that are part of the [Promises/A+ Compliance Test Suite](https://github.com/promises-aplus/promises-tests).

##Constructor

###Pimp(function)
The constructor returns a `Promise`.   
It accepts a `function` as a parameter and provides the `function` with two parameters, `resolve` and `reject`.     
They can be used to resolve/fulfill or reject the `Promise` that was returned by the constructor.

Example:
```javascript
var prom1 = new Pimp(function(fulfill, reject) {
        setTimeout(function() {
            console.log("--Fulfilling prom1--");
            fulfill(10);
            console.log("--Fulfilled prom1--");
        }, 2000);
    });

prom1.then(function(v){
    console.log(v); //logs 10
});
```

##Public methods

###then(onFulfilled, onRejected)
It returns a `Promise`.   
If/when the returned `Promise` fulfills, it runs the `onFulfilled` handler.   
If/when the returned `Promise` gets rejected, it runs the `onRejected` handler.  
You can call `then` on a Promise as many times you want.   
Also, You can chain as many `then` calls as you want.      
All registered handlers will be run in sequence when the Promise resolves.   

It basically does all that a Promises/A+ compliant method should do.    
Read more [here](http://promises-aplus.github.io/promises-spec/#the__method).

Example:
```javascript
var prom1 = new Pimp(function(f, r) {
    setTimeout(function() {
        console.log("--Fulfilling prom1--");
        f(10);
        console.log("--Fulfilled prom1--");
    }, 2000);
});

prom1.then(function(v) {
    console.log(v); //logs 10
});

prom1.then(function(v) {
    console.log("omg not %o again",v); //logs omg not 10 again
});
```

##Static methods

###Pimp.resolve(value)
Returns a `Promise` that is *resolved* to the value passed to it. The value can be any value as specified [here](http://promises-aplus.github.io/promises-spec/#terminology).    
If it's a `thenable` then the returned `Promise` resolves to it as per the [Promises/A+ Resolution Procedure](http://promises-aplus.github.io/promises-spec/#the_promise_resolution_procedure).

Example:
```javascript
Pimp.resolve(10).then(function(v){
    console.log(v); //logs 10
});
```

###Pimp.reject(reason)
Returns a `Promise` whose state is *rejected* and value is the reason provided.

Example:
```javascript
Pimp.reject("DENIED!").then(function(v) {
    console.log("yo %o", v); //this handler doesn't run as the Promise is rejected
}, function(v) {
    console.log(v); //logs DENIED!
});
```

###Pimp.cast(value)
Casts the value to a `Promise` and returns the `Promise`.

Example:
```javascript
Pimp.cast(";-;").then(function(v){
    console.log(v); //logs ;-;
})
```

###Pimp.all(iterable)
Returns a `Promise` which resolves when all elements in the iterable resolve.   
Its value is an Array of the values returned by each element in the iterable.

Example:
```javascript
var p1 = new Pimp(function(resolve, reject) {
    setTimeout(resolve, 5500, "one");
});
var p2 = new Pimp(function(resolve, reject) {
    setTimeout(resolve, 6200, "two");
});

Pimp.all([45, true, p1, p2]).then(function(values) {
    //logs Values resulting from Pimp.all: [45, true, "one", "two"]
    console.log("Values resulting from Pimp.all: %o", values);
});
```

####Note:
- If any value in the iterable is not `thenable` then it is first cast to a `Promise` using `Pimp.cast` internally

###Pimp.race(iterable)
Returns a `Promise` that adopts the state of the first item in the iterable that resolves.   

Example:
```javascript
var p1 = new Pimp(function(resolve, reject) {
    setTimeout(resolve, 500, "one");
});
var p2 = new Pimp(function(resolve, reject) {
    setTimeout(resolve, 400, "two");
});
var p3 = new Pimp(function(resolve, reject) {
    setTimeout(resolve, 1000, "three");
});
var p4 = new Pimp(function(resolve, reject) {
    setTimeout(resolve, 200, "four");
});

var racer = Pimp.race([p1, p2, p3, p4]);
racer.then(function(value) {
    //logs Value resulting from Pimp.race: "four"
    console.log("Value resulting from Pimp.race: %o", value);
});
```

