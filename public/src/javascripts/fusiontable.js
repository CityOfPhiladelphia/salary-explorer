window.FusionTable = window.FusionTable || {};
window.DEBUG = window.DEBUG || false;
(function(window, db) {
    
    db.settings = {
        apiHost: "https://www.googleapis.com/fusiontables/v1/"
        ,exportHost: "https://www.google.com/fusiontables/exporttable"
        ,apiKey: "AIzaSyCmJ45zmFdmbe_j7QtgAXLUTNl1gRFzJl4"
        ,tableId: "1rgusPubWssFR9bb4dcJjPD2TAxQfsH5B8NJXv5E"
        ,timeout: 15000
        ,fields: {
            id: "ROWID"
            ,departmentid: "Dept"
            ,department: "'Department Title'"
            ,lastname: "'Last Name'"
            ,firstname: "'First Name'"
            ,middleinitial: "'Middle Initial'"
            ,fullname: "'Full Name'"
            ,title: "'Pay Class Title'"
            ,salaries: "SUM('Annual Salary')"
            ,salary: "'Annual Salary'"
            ,salarygroup: "'Salary Group'"
            ,count: "COUNT()"
        }
    };
    
    
    db.buildUrl = function(sql) {
        return this.settings.apiHost + "query?typed=true&key=" + this.settings.apiKey + (sql ? "&sql=" + encodeURIComponent(sql) : "");
    };
    
    db.buildExportUrl = function(sql) {
        return this.settings.exportHost + "?query=" + encodeURIComponent(sql);
    };
    
    db.buildFields = function(select, noAggregates) {
        var parts = []
            ,field
            ,i = 0;
        for(i in select) {
            field = this.settings.fields[select[i]] || null;
            // If whether it's an aggregate doesn't matter, or if there's no parenthesis in the string
            if(field && ( ! noAggregates || field.indexOf("(") === -1)) {
                parts.push(field);
            }
        }
        return parts.join(", ");
    };
    
    db.query = function(options, successCallback, errorCallback) {
        if(typeof options.fields !== "object" || ! options.fields.length) errorCallback("No fields provided"); // Ensure array of fields was provided
        
        var sql = [], where = [];
        
        // SELECT
        sql.push("SELECT " + this.buildFields(options.fields));
        
        // FROM
        sql.push("FROM " + this.settings.tableId);
        
        // WHERE
        if(options.department !== undefined && options.department) {
            where.push(this.settings.fields.departmentid + " = " + options.department);
        }
        if(options.search !== undefined && options.search.length > 2) {
            where.push(this.settings.fields.fullname + " CONTAINS IGNORING CASE '" + options.search + "'");
        }
        if(where.length) sql.push("WHERE " + where.join(" AND "));
        
        // GROUP BY
        if(options.group !== undefined && options.group) {
            sql.push("GROUP BY " + this.buildFields(options.fields, true));
        }
        
        // ORDER BY
        if(options.orderby !== undefined && this.settings.fields[options.orderby] !== undefined) {
            sql.push("ORDER BY " + this.settings.fields[options.orderby] + (options.dir !== undefined && options.dir === "desc" ? " DESC" : ""));
        }
        
        // OFFSET
        if(options.offset !== undefined) {
            sql.push("OFFSET " + options.offset);
        }
        
        // LIMIT
        if(options.limit !== undefined) {
            sql.push("LIMIT " + (parseInt(options.limit, 0) + 1));
        }
        
        // Return the sql if no callbacks specified
        if(successCallback === undefined) return sql.join(" ");
        
        // Execute query
        if(window.DEBUG) console.log(sql.join("\n"));
        $.jsonp({
            url: this.buildUrl(sql.join(" "))
            ,callbackParameter: "callback"
            ,cache: true
            ,timeout: this.settings.timeout
            ,success: function(response) {
                if(response.error || response.columns === undefined) errorCallback(response.error || "Invalid response from server");
                else successCallback(response);
            }
            ,error: function(xOptions, textStatus) { errorCallback(textStatus); }
        });
    };
    
})(window, window.FusionTable);