window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Backbone = window.Backbone || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Layouts: {}, Collections: {}, Routers: {}};
window.FusionTable = window.FusionTable || {};
window.util = window.util || {};
(function(window, $, _, Backbone, app, db, util) {
    
    app.Views.Breadcrumbs = Backbone.Layout.extend({
        template: "breadcrumbs.html"
        ,serialize: function() {
            
            return {
                settings: this.collection.settings
                ,title: this.options.title
            };
        }
    });
    
    /**
     * Sort dropdown for narrow screens. Hidden on desktop.
     */
    app.Views.Sort = Backbone.Layout.extend({
        serialize: function() {
            return {
                settings: this.collection.settings
                ,sortProps: this.collection.sortProps
            };
        }
    });
    app.Views.SortDepartments = app.Views.Sort.extend({template: "sort-departments.html"});
    app.Views.SortEmployees = app.Views.Sort.extend({template: "sort-employees.html"});
    
    app.Views.Search = Backbone.Layout.extend({
        template: "search.html"
        ,serialize: function() {
            return {
                settings: this.collection.settings
                ,title: this.options.title
            };
        }
        ,events: {
            "submit .form-search": "onSearch"
        }
        ,onSearch: function(e) {
            e.preventDefault();
            var input = e.currentTarget.search.value
                ,fragment = app.router.buildFragment(null, {search: input});
            if(input) app.router.navigate(fragment, {trigger: true});
        }
    });
    
    app.Views.Departments = Backbone.Layout.extend({
        template: "departments.html"
        ,initialize: function() {
            this.collection.on("reset", this.render, this);
        }
        ,serialize: function() {
            return {
                rows: this.collection.toJSON()
                ,sum: this.collection.sum
                ,count: this.collection.count
                ,settings: this.collection.settings
                ,sortProps: this.collection.sortProps
            };
        }
    });
    
    app.Views.Employees = Backbone.Layout.extend({
        template: "employees.html"
        ,initialize: function() {
            _.bindAll(this, "onClickMore");
            this.collection.on("reset", this.render, this);
            this.collection.on("add", this.addRow, this);
        }
        ,serialize: function() {
            return {
                rows: this.collection.toJSON()
                ,settings: this.collection.settings
                ,sortProps: this.collection.sortProps
                ,moreAvailable: this.collection.moreAvailable
                ,title: this.options.title
            };
        }
        ,beforeRender: function() {
            this.collection.each(function(model) {
                this.insertView("tbody", new app.Views.Employee({model: model, collection: this.collection}));
            }, this);
        }
        ,addRow: function(model, render) {
            var view = this.insertView("tbody", new app.Views.Employee({model: model, collection: this.collection}));
            view.render();
            this.checkMoreButton();
        }
        ,events: {
            "click .more": "onClickMore"
        }
        ,onClickMore: function(e) {
            e.preventDefault();
            var limit = this.collection.settings.limit || 10
                ,offset = this.collection.settings.offset || 0
                ,button = $(e.currentTarget);
            button.button("loading");
            this.collection.settings.offset = offset + limit;
            this.collection.fetch({
                update: true
                ,success: function() {
                    button.button("reset");
                }
                ,error: function() {
                    button.button("reset").button("error");
                }
            });
        }
        ,checkMoreButton: function() {
            this.$(".more").toggle(this.collection.moreAvailable);
        }
    });
    
    app.Views.Employee = Backbone.Layout.extend({
        tagName: "tr"
        ,template: "employee.html"
        ,serialize: function() {
            return {
                row: this.model.toJSON()
                ,settings: this.collection.settings
            };
        }
    });
    
})(window, window.jQuery, window._, window.Backbone, window.Salaries, window.FusionTable, window.util);