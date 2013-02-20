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
        }
        ,url: function() { return db.buildUrl(db.query(this.settings)) + "&callback=?"; }
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
    
    app.Views.DepartmentsView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, "toggleRow");
            this.collection = this.options.collection;
            this.template = _.template($("#tmpl-departments").html());
            this.collection.on("reset", this.render, this);
            util.loading(true);
            this.collection.fetch({ // TODO: Need error handler
                complete: function() {util.loading(false);}
            });
        }
        ,events: {
            "click .toggle": "toggleRow"
        }
        ,toggleRow: function(e) {
            e.preventDefault(e);
            var button = $(e.currentTarget)
                ,row = button.parent().parent().next(".analysis");
            row.toggle();
            button.find("i").toggleClass("icon-plus").toggleClass("icon-minus");
            
            // Load salary groups
            var salaryGroups = new app.Collections.SalaryGroups(null, {settings: {department: row.data("department")}});
            salaryGroups.fetch();
            row.find("td").eq(0).append((new app.Views.SalaryGroupsView({collection: salaryGroups})).render().el);
        }
        ,render: function() {
            this.$el.html(this.template({
                rows: this.collection.toJSON()
                ,sum: this.collection.sum
                ,count: this.collection.count
                ,settings: this.collection.settings
                ,sortProps: util.getSortProps(this.collection.settings, "departments")
                //,arrows: util.getArrows(this.collection.settings)
            }));
            return this;
        }
    });
    
})(window, window.jQuery, window._, window.Backbone, window.Salaries, window.FusionTable, window.util);