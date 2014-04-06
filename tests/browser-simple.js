//Simple
(function(Pimp) {
    var prom1 = new Pimp(function(f, r) {
        setTimeout(function() {
            console.log("--Fulfilling prom1--");
            f(10);
            console.log("--Fulfilled prom1--");
        }, 2000);
    });

    var prom2 = prom1.then(function(v) {
        console.log("In 1st prom1 onFF: " + v);
        var newProm = new Pimp(function(f, r) {
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


})(window.Pimp);

//Little less simple
(function(Pimp) {
    var prom1 = new Pimp(function(f, r) {
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
        var newProm = new Pimp(function(f, r) {
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

})(window.Pimp);

(function(Pimp) {

    console.log("Pimp.rejected test:");
    console.log("--------------------------------------------------------------------");
    Pimp.rejected("1st Pimp.rejected call was made")
        .then(23, function(v) {
            console.log("DENIED! Val: %o", v);
            return Pimp.rejected(23);
        })
        .then(3, function(v) {
            console.log("2nd chained then to Pimp.rejected. Val: %o", v);
        });

    Pimp.rejected("2nd Pimp.rejected call was made")
        .then(23, function(v) {
            console.log("DENIED! Val: %o", v);
            return Pimp.rejescted(23); //deliberate typo
        })
        .then(3, function(v) {
            console.log("2nd chained then to Pimp.rejected. Val: %o", v);
        });
})(window.Pimp);

(function(Pimp) {

    console.log("Pimp.resolved test:");
    console.log("--------------------------------------------------------------------");
    Pimp.resolved("1st Pimp.resolved call was made")
        .then(undefined, function(v) {
            console.log("DENIED! Val: " + v);
            return Pimp.rejected(23);
        })
        .then(function(v) {
            console.log("2nd chained then to Pimp.resolved. Val: %o", v);
        });
    Pimp.resolved("2nd Pimp.resolved call was made")
        .then(undefined, function(v) {
            console.log("DENIED! Val: " + v);
            return Pimp.resjected(23); //deliberate typo
        })
        .then(function(v) {
            console.log("2nd chained then to Pimp.resolved. Val: %o", v);
        });

})(window.Pimp);
