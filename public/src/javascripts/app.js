window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Backbone = window.Backbone || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Collections: {}, Routers: {}};
window.FusionTable = window.FusionTable || {};
window.util = window.util || {};
(function(window, $, _, Backbone, app, db, util) {
    
    /**
     * Config
     */
    window.DEBUG = false; // Global
    _.templateSettings.variable = "data";
    $.ajaxSetup({cache: false}); // Cache ajax requests
    
    app.Views.HomeView = Backbone.View.extend({
        initialize: function() {
            this.template = $("#tmpl-home").html();
        }
        ,render: function() {
            this.$el.html(this.template);
            return this;
        }
    });
    
    app.Views.VisualizeView = Backbone.View.extend({
        initialize: function() {
            this.template = _.template($("#tmpl-visualize").html());
            this.collection.on("reset", this.buildChart, this);
            util.loading(true);
            this.collection.fetch({ // TODO: Need error handler
                complete: function() {util.loading(false);}
            });
        }
        ,render: function() {
            this.$el.html(this.template(this.collection.toJSON()));
            ////this.buildChart();
            return this;
        }
        ,buildChart: function() {
            var series = [];
            this.collection.each(function(row) {
                series.push({
                    name: row.get("department")
                    ,data: [row.get("count"), row.get("salaries")]
                });
            });
            new Highcharts.Chart({
                chart: {
                    renderTo: "stacked"
                    ,type: "bar"
                    ,zoomType: "y"
                    ,height: "300"
                }
                ,title: {
                    text: "Salary Dollars vs # of Employees per Department (Percentage of City)"
                }
                ,subtitle: {
                    text: document.ontouchstart === undefined ? "Click and drag to zoom in" : "Drag your finger to zoom in"
                }
                ,xAxis: {
                    categories: ["# of Employees", "Salary Dollars"]
                }
                ,yAxis: {
                    min: 0
                    ,title: {
                        text: "Percentage of City"
                    }
                }
                ,tooltip: {
                    formatter: function() {
                        return this.series.name + ": " + (this.key === "Salary Dollars" ? "$" : "") + util.formatNumber(this.y) +' ('+ Math.round(this.percentage*100)/100 +'%)';
                    }
                }
                ,plotOptions: {
                    series: {
                        stacking: "percent"
                    }
                }
                ,legend: { enabled: false }
                ,series: series
            });
            
            var categories = [], employees = [], salaries = [];
            this.collection.each(function(row) {
                categories.push(row.get("department"));
                employees.push(row.get("count"));
                salaries.push(row.get("salaries"));
            });
                
            new Highcharts.Chart({
                chart: {
                    renderTo: "combined"
                    ,zoomType: "x"
                    ,height: "300"
                }
                ,title: {
                    text: "Salary Dollars vs # of Employees per Department"
                }
                ,subtitle: {
                    text: document.ontouchstart === undefined ? "Click and drag to zoom in" : "Drag your finger to zoom in"
                }
                ,xAxis: [{
                    categories: categories
                    ,labels: {enabled: false}
                }]
                ,yAxis: [
                    { // Primary yAxis
                        title: {
                            text: "# of Employees"
                            ,style: {color: "#4572A7"}
                        }
                        ,labels: {
                            formatter: function() {
                                return util.formatNumber(this.value);
                            }
                            ,style: {color: "#4572A7"}
                        }
                    }
                    ,{ // Secondary yAxis
                        title: {
                            text: "Salary Dollars",
                            style: {color: "#89A54E"}
                        }
                        ,labels: {
                            formatter: function() {
                                return "$" + util.formatNumber(this.value);
                            }
                            ,style: {color: "#89A54E"}
                        }
                        ,opposite: true
                        ,min: 0
                    }
                ]
                ,tooltip: {
                    formatter: function() {
                        return this.x + ": " + (this.series.name === "Salary Dollars" ? "$" : "") + util.formatNumber(this.y);
                    }
                }
                ,legend: {
                    enabled: false
                    /*layout: 'vertical',
                    align: 'left',
                    x: 120,
                    verticalAlign: 'top',
                    y: 100,
                    floating: true,
                    backgroundColor: '#FFFFFF'*/
                }
                ,series: [
                    {
                        name: '# of Employees'
                        ,color: '#4572A7'
                        ,type: 'column'
                        ,data: employees
                    }
                    ,{
                        name: 'Salary Dollars'
                        ,color: '#89A54E'
                        ,type: 'spline'
                        ,yAxis: 1
                        ,data: salaries
                    }
                ]
            });
        }
    });
    
    app.Routers.AppRouter = Backbone.Router.extend({
        routes: {
            "": "home"
            ,"departments": "departments"
            ,"employees": "employees"
            ,"visualize": "visualize"
        }
        ,currentView: null
        ,initialize: function() {
            this.params = {};
        }
        ,home: function(params) {
            this.setParams(params);
            app.homeView = new app.Views.HomeView();
            this.showView(app.homeView);
        }
        ,departments: function(params) {
            this.setParams(params);
            app.departments = new app.Collections.Departments(null, {settings: params});
            //app.departments.fetch(); // TODO: Need an error handler
            app.departmentsView = new app.Views.DepartmentsView({collection: app.departments});
            this.showView(app.departmentsView);
        }
        ,employees: function(params) {
            this.setParams(params);
            app.employees = new app.Collections.Employees(null, {settings: params});
            //app.employees.fetch();
            app.employeesView = new app.Views.EmployeesView({collection: app.employees});
            this.showView(app.employeesView);
        }
        ,visualize: function(params) {
            this.setParams(params);
            app.departments = new app.Collections.Departments(null, {settings: params});
            app.visualizeView = new app.Views.VisualizeView({collection: app.departments});
            this.showView(app.visualizeView);
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
            $("#main").empty().append(view.render().el);
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
            return (route || "") + ( ! _.isEmpty(newParams) ? "?" + $.param(newParams) : "");
        }
        /*
         * Save params on the router object to build URLs with. Clone it so it doesn't get modified by the app
         * @param params Object of URL's querystring params
         */
        ,setParams: function(params) {
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