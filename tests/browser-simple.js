(function(Prom) {
	var prom1 = new Prom(function(f, r) {
		setTimeout(function() {
			console.log("--Fulfilling prom1--");
			f(10);
			console.log("--Fulfilled prom1--");
		}, 2000);
	});

	var prom2 = prom1.then(function(v) {
		console.log("In prom1 onFF: " + v);
		var newProm = new Prom(function(f, r) {
			setTimeout(function() {
				console.log("--Fulfilling newProm--");
				f("new prom son");
				console.log("--Fulfilled newProm--");
			}, 2000);
		});
		return newProm;
	});

	var prom3 = prom2.then(function(v) {
		console.log("In prom2 onFF: " + v);
	});

	setTimeout(function() {
		console.log("prom1.value should be 10 and is: " + prom1.value());
		console.log("prom2.value should be 'new prom son' and is: " + prom2.value());
		console.log("prom3.value should be undefined and is: " + prom3.value());
	}, 6000);
})(window.Prom);

// process.nextTick in browser test
// function test() {
// 	console.log("1");
// 	var x = setTimeout(y, 0);
// 	console.log("2");
// }

// function y() {
// 	console.log("3");
// }