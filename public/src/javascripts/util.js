window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Layouts: {}, Collections: {}, Routers: {}};
window.util = window.util || {};
(function(window, $, _, app, util) {
    
    util.loading = function(status) {
        $("body").toggleClass("loading", status);
    };
    
    util.currency = function(sSymbol, vValue, decimals) {
        var aDigits = vValue.toFixed(decimals || 0).split(".");
        aDigits[0] = aDigits[0].split("").reverse().join("").replace(/(\d{3})(?=\d)/g, "$1,").split("").reverse().join("");
        return sSymbol + aDigits.join(".");
	};
    
    /**
     * Add commas to numbers in thousands place etc.
     * http://stackoverflow.com/a/2901298/633406
     */
    util.formatNumber = function(x, decimals) {
        if(isNaN(x) || x === null) return x;
        if(decimals !== undefined) x = x.toFixed(decimals);
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    util.getSortProps = function(settings, route) {
        var sortProps = {}, i = 0;
        for(i in settings.fields) {
            sortProps[settings.fields[i]] = {
                href: app.router.buildFragment(route || app.router.route, {orderby: settings.fields[i], dir: (settings.orderby === settings.fields[i] ? (settings.dir === "asc" ? "desc" : "asc") : "asc")}, ["department", "search"])
                ,arrow: settings.orderby === settings.fields[i] ? settings.dir : null
            };
        }
        return sortProps;
    };
    
    util.getDepartmentTitle = function(department) {
        var title;
        if(department === "all") {
            title = "All Employees";
        } else if(window.codes !== undefined && window.codes.department !== undefined && window.codes.department[department] !== undefined) {
            title = window.codes.department[department];
        } else {
            title = "Salaries"; // Intentionally vague
        }
        return title;
    }
    
})(window, window.jQuery, window._, window.Salaries, window.util);