window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Collections: {}, Routers: {}};
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
    
    /*util.getSortProps = function(settings) {
        var sortProps = {}, i = 0;
        for(i in settings.fields) {
            sortProps[settings.fields[i]] = {
                href: (settings.department !== undefined ? "department=" + settings.department : "")
                    + "&orderby=" + settings.fields[i]
                    + "&dir=" + (settings.orderby === settings.fields[i] ? (settings.dir === "asc" ? "desc" : "asc") : "asc")
                    + (settings.search !== undefined && settings.search ? "&search=" + settings.search : "")
                ,arrow: settings.orderby === settings.fields[i] ? settings.dir : null
            };
        }
        return sortProps;
    };*/
    
    util.getSortProps = function(settings, route) {
        var sortProps = {}, i = 0;
        for(i in settings.fields) {
            sortProps[settings.fields[i]] = {
                href: app.router.buildFragment(route, {orderby: settings.fields[i], dir: (settings.orderby === settings.fields[i] ? (settings.dir === "asc" ? "desc" : "asc") : "asc")}, ["department", "search"])
                ,arrow: settings.orderby === settings.fields[i] ? settings.dir : null
            };
        }
        return sortProps;
    };
    
    /*util.getArrows = function(settings) {
        var arrows = {}, i = 0;
        for(i in settings.fields) {
            arrows[settings.fields[i]] = settings.orderby === settings.fields[i] ? settings.dir : null;
        }
        return arrows;
    }
    
    util.reverseDir = function(dir) {
        return dir === "asc" ? "desc" : "asc";
    }*/
    
})(window, window.jQuery, window._, window.Salaries, window.util);