window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Backbone = window.Backbone || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Layouts: {}, Collections: {}, Routers: {}};
window.FusionTable = window.FusionTable || {};
window.util = window.util || {};
(function(window, $, _, Backbone, app, db, util) {
    
    /**
     * Config
     */
    window.DEBUG = false; // Global
    _.templateSettings.variable = "data";
    $.ajaxSetup({cache: true}); // Cache ajax requests
    // https://github.com/tbranyen/backbone.layoutmanager/wiki/Template-rendering
    Backbone.Layout.configure({
        prefix: "src/templates/",
        fetch: function(path) {
            var JST = window.JST || {};
            
            if (JST[path]) {
                return JST[path];
            }
            var done = this.async();
            
            $.get(path, function(contents) {
                done(_.template(contents));
            }, "text");
        }
    });
    
    app.Views.HomeView = Backbone.Layout.extend({template: "home.html"});
    
    app.Views.ToolsView = Backbone.Layout.extend({template: "tools.html"});
    
    app.Routers.AppRouter = Backbone.Router.extend({
        routes: {
            "": "home"
            ,"departments": "departments"
            ,"employees": "employees"
            ,"visualize": "visualize"
            ,"browse": "browseDepartments"
            ,"browse/:department": "browseEmployees"
            ,"*path": "home"
        }
        ,currentView: null
        ,initialize: function() {
            this.params = {};
            app.toolsView = new app.Views.ToolsView();
        }
        ,home: function(params) {
            this.saveRoute("", params);
            app.homeView = new app.Views.HomeView({title: "Salaries"});
            this.showView(app.homeView);
        }
        ,browseDepartments: function(params) {
            this.saveRoute("browse", params);
            
            // Fetch departments
            app.departments = new app.Collections.Departments(null, {settings: params});
            util.loading(true);
            app.departments.fetch({ // TODO: Need error handler
                complete: function() {util.loading(false);}
            });
            
            // Instantiate layout
            var layout = new Backbone.Layout({
                template: "browse.html"
                ,title: "Departments"
                ,views: {
                    ".breadcrumbs": new app.Views.Breadcrumbs({collection: app.departments})
                    ,".sort": new app.Views.SortDepartments({collection: app.departments})
                    ,".results": new app.Views.Departments({collection: app.departments})
                }
            });
            
            // Show layout
            this.showView(layout);
        }
        ,browseEmployees: function(department, params) {
            this.saveRoute("browse/" + department, params);
            params = params || {};
            if(department !== "all") params.department = department;
            app.employees = new app.Collections.Employees(null, {settings: params});
            
            // Fetch employees
            app.employees = new app.Collections.Employees(null, {settings: params});
            util.loading(true);
            app.employees.fetch({ // TODO: Need error handler
                complete: function() {util.loading(false);}
            });
            
            var title = util.getDepartmentTitle(department);
            
            // Instantiate layout
            var layout = new Backbone.Layout({
                template: "browse.html"
                ,title: title
                ,views: {
                    ".breadcrumbs": new app.Views.Breadcrumbs({collection: app.employees, title: title})
                    ,".sort": new app.Views.SortEmployees({collection: app.employees})
                    ,".search": new app.Views.Search({collection: app.employees, title: title})
                    ,".results": new app.Views.Employees({collection: app.employees, title: title})
                }
                ,serialize: function() {
                    return {
                        title: title
                    };
                }
            });
            
            // Show layout
            this.showView(layout);
        }
        ,visualize: function(params) {
            this.saveRoute("visualize", params);
            
            // If chart is specified
            var visualization;
            if(typeof params === "object" && params.chart !== undefined) {
            
                // Fetch departments
                if(app.departments === undefined) {
                    app.departments = new app.Collections.Departments(null, {settings: params});
                    util.loading(true);
                    app.departments.fetch({ // TODO: Need error handler
                        complete: function() {util.loading(false);}
                    });
                }
                
                // Which chart is being rendered
                switch(params.chart) {
                    case "sizeVsDollarsBar": visualization = new app.Views.Charts.SizeVsDollarsBar({collection: app.departments}); break;
                    case "sizeVsDollarsLine": visualization = new app.Views.Charts.SizeVsDollarsLine({collection: app.departments}); break;
                    case "dollarsPie": visualization = new app.Views.Charts.DollarsPie({collection: app.departments}); break;
                    case "salaryGroups": visualization = new app.Views.SalaryGroups({collection: app.departments}); break;
                }
            }
            // Otherwise go to landing page
            if( ! visualization) {
                visualization = new app.Views.VisualizeLanding();
            }
            
            var layout = new Backbone.Layout({
                template: "visualize.html"
                ,title: "Visualize"
                ,views: {
                    ".visualization": visualization
                }
            });
            
            // Show layout
            this.showView(layout);
        }
        /*
         * Switch pages while preserving events
         * See: http://coenraets.org/blog/2012/01/backbone-js-lessons-learned-and-improved-sample-app/
         * @param view The view being switched to
         */
        ,showView: function(view) {
            if(this.currentView) {
                this.currentView.$el.detach();
            }
            // Content
            $("#main").empty().append(view.el);
            view.render();
            
            // Tools navbar
            $("#tools").empty().append(app.toolsView.el);
            app.toolsView.render();
            
            // <title>
            document.title = view.options.title !== undefined && view.options.title ? view.options.title : $("title").text();
            
            this.currentView = view;
        }
        /*
         * Build URL fragment with params and option of preserving current params
         * @param route Base route string, e.g. "home"
         * @param add Object of new params/values
         * @param preserve Array of params to preserve in current params
         */
        ,buildFragment: function(route, add, preserve) {
            //return _.defaults(add || {}, remove !== undefined && remove.length ? _.omit(this.params, remove) : this.params);
            var newParams = preserve !== undefined && preserve.length && this.params !== undefined ? _.extend(add, _.pick(this.params, preserve)) : add;
            return (route || this.route) + ( ! _.isEmpty(newParams) ? "?" + $.param(newParams) : "");
        }
        /*
         * Save route & params on the router object to build URLs with. Clone it so it doesn't get modified by the app
         * @param params Object of URL's querystring params
         */
        ,saveRoute: function(route, params) {
            this.route = route;
            this.params = typeof params === "object" ? _.clone(params) : {};
        }
    });
    
    /**
     * Initiate application
     */
    $(document).ready(function() {
        app.router = new app.Routers.AppRouter();
        Backbone.history.start();
    });
    
    /*
     * Allow <a> tags with data-replace="true" to navigate without creating an entry in browser history
     * Useful for sorting, when you want to update the URL but not mess up the back button
     */
    $(document).on("click", "[data-replace=\"true\"]", function(e) {
        e.preventDefault();
        app.router.navigate($(e.currentTarget).attr("href").replace(/^.*#/, ""), {trigger: true, replace: true});
    });
    
})(window, window.jQuery, window._, window.Backbone, window.Salaries, window.FusionTable, window.util);