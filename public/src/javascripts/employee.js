var Salaries = Salaries || {Models: {}, Views: {}, Collections: {}, Routers: {}}
    ,FusionTable = FusionTable || {}
    ,util = util || {};
(function(app, db, util, $, _) {
    
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
        }
        ,url: function() { return db.buildUrl(db.query(this.settings)) + "&callback=?"; }
        ,parse: function(response) {
            // Convert array of arrays to array of objects with our keys/fields
            var self = this
                ,newRows = []
                ,newRow, i, key;;
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
                        newRow[key] = (key === "salary" ? parseInt(row[i]) : row[i]);
                    }
                    newRows.push(newRow);
                });
            }
            return newRows;
        }
    });
    
    app.Views.EmployeesView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, "onClickMore", "onSearch");
            this.collection = this.options.collection;
            this.template = _.template($("#tmpl-employees").html());
            this.collection.on("reset", this.render, this);
            this.collection.on("add", this.addRow, this);
            util.loading(true);
            this.collection.fetch({ // TODO: Need error handler
                complete: function() {util.loading(false);}
                ,error: function(model, xhr, options) { console.log(xhr, options); }
            });
        }
        ,events: {
            "click .more": "onClickMore"
            ,"submit .form-search": "onSearch"
        }
        ,onClickMore: function(e) {
            e.preventDefault();
            var limit = this.collection.settings.limit || 10
                ,offset = this.collection.settings.offset || 0
                ,button = $(e.target);
            button.button("loading");
            this.collection.settings.offset = offset + limit;
            this.collection.fetch({
                update: true
                ,success: function() {
                    button.button("reset");
                }
            });
        }
        ,onSearch: function(e) {
            e.preventDefault();
            var input = e.target.search.value
                ,fragment = app.router.buildFragment("employees", {search: input}, ["department"]);
            if(input) app.router.navigate(fragment, {trigger: true});
        }
        ,render: function() {
            var title, self = this;
            
            // Determine title
            if(this.collection.settings.department === undefined) {
                title = "All Employees";
            } else if(codes !== undefined && codes.department !== undefined && codes.department[this.collection.settings.department] !== undefined) {
                title = codes.department[this.collection.settings.department];
            } else {
                title = "Salaries"; // Intentionally vague
            }
            
            this.$el.html(this.template({
                rows: this.collection.toJSON()
                ,settings: this.collection.settings
                ,sortProps: util.getSortProps(this.collection.settings, "employees")
                ,title: title
            }));
            this.collection.each(function(model) {
                // TODO: Ideally I'd only call append() once to limit DOM insertions, but how do I append an array of el's?
                this.$("tbody").append((new app.Views.EmployeeView({model: model, collection: self.collection})).render().el);
            });
            this.checkMoreButton();
            return this;
        }
        ,addRow: function(model) {
            this.$("tbody").append((new app.Views.EmployeeView({model: model, collection: this.collection})).render().el);
            this.checkMoreButton();
        }
        ,checkMoreButton: function() {
            this.$(".more").toggle(this.collection.moreAvailable);
        }
    });
    
    app.Views.EmployeeView = Backbone.View.extend({
        tagName: "tr"
        ,initialize: function() {
            this.template = _.template($("#tmpl-employee").html());
        }
        ,render: function() {
            this.$el.html(this.template({row: this.model.toJSON(), settings: this.collection.settings}));
            return this;
        }
    });
    
})(Salaries, FusionTable, util, jQuery, _);