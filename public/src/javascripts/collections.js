window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Backbone = window.Backbone || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Collections: {}, Routers: {}};
window.FusionTable = window.FusionTable || {};
window.util = window.util || {};
(function(window, $, _, Backbone, app, db, util) {
    
    // TODO: Since this is not paginated, sorting should be done with javascript
    app.Collections.Departments = Backbone.Collection.extend({
        defaultSettings: {
            fields: ["departmentid", "department", "salaries", "count"]
            ,group: true
            ,orderby: "salaries"
            ,dir: "desc"
        }
        ,initialize: function(models, options) {
            this.settings = _.defaults(options.settings || {}, this.defaultSettings);
            this.sum = 0;
            this.count = 0;
            this.sortProps = util.getSortProps(this.settings);
        }
        ,url: function() { return db.buildUrl(db.query(this.settings)) + "&callback=?"; }
        ,export: function() { return db.buildExportUrl(db.query(_.omit(this.settings, ["limit", "offset"]))); }
        ,parse: function(response) {
            // Convert array of arrays to array of objects with our keys/fields
            var objects = [], object, i, key, self = this;
            if(response.rows !== undefined && response.rows.length) {
                _.each(response.rows, function(row) {
                    object = {};
                    i = 0;
                    for(i in row) {
                        key = self.settings.fields[i];
                        object[key] = (key === "salaries" || key === "count" ? parseInt(row[i], 0) : row[i]);
                    }
                    objects.push(object);
                    
                    // Add to the totals
                    self.count += object.count || 0;
                    self.sum += object.salaries || 0;
                });
            }
            return objects;
        }
    });
    
    app.Collections.Employees = Backbone.Collection.extend({
        defaultSettings: {
            fields: ["departmentid", "department", "lastname", "firstname", "middleinitial", "title", "salary", "salarygroup", "id"]
            ,group: false
            ,orderby: "salary"
            ,dir: "desc"
            ,limit: 30
            ,offset: 0
        }
        ,initialize: function(models, options) {
            this.settings = _.defaults(options.settings || {}, this.defaultSettings); // Incorporate any URL parameters
            this.moreAvailable = false; // Initialize this property
            this.sortProps = util.getSortProps(this.settings);
        }
        ,url: function() { return db.buildUrl(db.query(this.settings)) + "&callback=?"; }
        ,export: function() { return db.buildExportUrl(db.query(_.omit(this.settings, ["limit", "offset"]))); }
        ,parse: function(response) {
            // Convert array of arrays to array of objects with our keys/fields
            var self = this
                ,newRows = []
                ,newRow, i, key;
            if(response.rows !== undefined && response.rows.length) {
                // If we received our limit + 1, we know there's another page available, and we remove that +1 from the collection
                if(response.rows.length > this.settings.limit) {
                    this.moreAvailable = true;
                    response.rows.pop();
                } else {
                    this.moreAvailable = false;
                }
                // Add keys/field names to each row
                _.each(response.rows, function(row) {
                    newRow = {};
                    i = 0;
                    for(i in row) {
                        key = self.settings.fields[i];
                        newRow[key] = (key === "salary" ? parseInt(row[i], 0) : row[i]);
                    }
                    newRows.push(newRow);
                });
            }
            return newRows;
        }
    });
    
    app.Collections.SalaryGroups = Backbone.Collection.extend({
        defaultSettings: {
            fields: ["count", "salarygroup"]
            ,group: true
            ,orderby: "salarygroup"
            ,dir: "asc"
        }
        ,initialize: function(models, options) {
            this.settings = _.defaults(options.settings || {}, this.defaultSettings);
            //this.count = 0;
        }
        ,comparator: function(model) {
            return model.get("salarygroup");
        }
        ,sync: function(method, model, options) {
            if(method !== "read") options.error("Invalid request method");
            else db.query(this.settings, options.success, options.error);
        }
        ,parse: function(response) {
            // Convert array of arrays to array of objects with our keys/fields
            var objects = [], object, i, key, self = this;
            _.each(response.rows, function(row) {
                object = {};
                i = 0;
                for(i in row) {
                    key = self.settings.fields[i];
                    object[key] = parseInt(row[i], 0);
                }
                objects.push(object);
                
                // Add to the total
                self.count += object.count || 0;
            });
            return objects;
        }
    });
    
})(window, window.jQuery, window._, window.Backbone, window.Salaries, window.FusionTable, window.util);