//Simple
(function(Prom) {
	var prom1 = new Prom(function(f, r) {
		setTimeout(function() {
			console.log("--Fulfilling prom1--");
			f(10);
			console.log("--Fulfilled prom1--");
		}, 2000);
	});

	var prom2 = prom1.then(function(v) {
		console.log("In 1st prom1 onFF: " + v);
		var newProm = new Prom(function(f, r) {
			setTimeout(function() {
				console.log("--Fulfilling newProm--");
				f("new prom son");
				r("rejecting new prom immediately");
				f("trying to fulfill new prom");
				console.log("--Fulfilled newProm--");
			}, 2000);
		});
		return newProm;
	});

	var prom3 = prom2.then(function(v) {
		console.log("In 1st prom2 onFF: " + v);
	});


})(window.Prom);

//Little less simple
(function(Prom) {
	var prom1 = new Prom(function(f, r) {
		setTimeout(function() {
			console.log("--Fulfilling prom1--");
			f(10);
			console.log("--Fulfilled prom1--");
		}, 2000);
	});

	var prom1_5 = prom1.then(function(v) {
		console.log("In 1st prom1 onFF");
		return v;
	});

	var prom1_5_1 = prom1_5.then(function(v) {
		console.log("In onFF of promise retured by 1st prom1.then");
		return v;
	});

	var prom2 = prom1.then(function(v) {
		console.log("In 2nd prom1 onFF: " + v);
		var newProm = new Prom(function(f, r) {
			setTimeout(function() {
				console.log("--Fulfilling newProm--");
				f("new prom son");
				r("rejecting new prom immediately");
				f("trying to fulfill new prom");
				console.log("--Fulfilled newProm--");
			}, 2000);
		});

		newProm.then(function(v) {
			console.log("In newProm then. Value: " + v);
		});

		return newProm;
	});

	var prom3 = prom2.then(function(v) {
		console.log("In 1st prom2 onFF: " + v);
	});

	var prom4 = prom2.then(function(v) {
		console.log("In 2nd prom2 onFF: " + v);
	});

	var prom5 = prom1.then(function(v) {
		console.log("In 3rd prom1 onFF: " + v);
	});

	var prom6 = prom1.then(7);

	setTimeout(function() {
		console.log("prom1.value should be 10 and is: " + prom1.value());
		console.log("prom2.value should be 'new prom son' and is: " + prom2.value());
		console.log("prom3.value should be undefined and is: " + prom3.value());
	}, 6000);
})(window.Prom);

(function(Prom) {
	Prom.reject(123).then(23, function(v) {
		console.log("DENIED! Val: " + v);
		return Prom.reject(23);
	}).then(3, function(v) {
		console.log(v);
	});

	Prom.resolve(123).then(undefined, function(v) {
		console.log("DENIED! Val: " + v);
		return Prom.reject(23);
	}).then(function(v) {
		console.log(v);
	});
})(window.Prom);



// process.nextTick in browser test
// function test() {
//	console.log("1");
//	var x = setTimeout(y, 0);
//	console.log("2");
// }

// function y() {
//	console.log("3");
// }