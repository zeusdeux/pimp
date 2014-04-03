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

	console.log("Prom.rejected test:");
	console.log("--------------------------------------------------------------------");
	Prom.rejected("1st Prom.rejected call was made")
		.then(23, function(v) {
			console.log("DENIED! Val: %o", v);
			return Prom.rejected(23);
		})
		.then(3, function(v) {
			console.log("2nd chained then to Prom.rejected. Val: %o", v);
		});

		Prom.rejected("2nd Prom.rejected call was made")
		.then(23, function(v) {
			console.log("DENIED! Val: %o", v);
			return Prom.rejescted(23); //deliberate typo
		})
		.then(3, function(v) {
			console.log("2nd chained then to Prom.rejected. Val: %o", v);
		});
})(window.Prom);

(function(Prom) {

	console.log("Prom.resolved test:");
	console.log("--------------------------------------------------------------------");
	Prom.resolved("1st Prom.resolved call was made")
		.then(undefined, function(v) {
			console.log("DENIED! Val: " + v);
			return Prom.rejected(23);
		})
		.then(function(v) {
			console.log("2nd chained then to Prom.resolved. Val: %o", v);
		});
		Prom.resolved("2nd Prom.resolved call was made")
		.then(undefined, function(v) {
			console.log("DENIED! Val: " + v);
			return Prom.resjected(23); //deliberate typo
		})
		.then(function(v) {
			console.log("2nd chained then to Prom.resolved. Val: %o", v);
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