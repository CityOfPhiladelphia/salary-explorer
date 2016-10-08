window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Backbone = window.Backbone || {};
window.Highcharts = window.Highcharts || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Collections: {}, Routers: {}};
window.FusionTable = window.FusionTable || {};
window.util = window.util || {};
(function(window, $, _, Backbone, Highcharts, app, db, util) {
    
    app.Views.Charts = app.Views.Charts || {};
    
    app.Views.VisualizeLanding = Backbone.Layout.extend({
        template: "visualize-landing.html"
    });
    
    app.Views.SalaryGroups = Backbone.Layout.extend({
        template: "salarygroups.html"
        ,charts: {}
        ,initialize: function() {
            _.bindAll(this, "toggleDepartment");
            this.collection.on("reset", this.render, this);
        }
        ,serialize: function() {
            return {
                departments: _.sortBy(this.collection.toJSON(), "department")
            };
        }
        ,events: {
            "click .department": "toggleDepartment"
        }
        ,toggleDepartment: function(e) {
            e.preventDefault();
            
            var department = $(e.currentTarget).data("value")
                ,title = $(e.currentTarget).text();
                
            // Set link to active
            $(e.currentTarget).parent("li").toggleClass("active");
            
            // If chart already exists, show/hide it; otherwise, create it
            if(this.charts[department] !== undefined) {
                this.charts[department].$el.toggle();
            } else {
                // Fetch salary groups
                var salarygroups = new app.Collections.SalaryGroups(null, {settings: {department: department}});
                util.loading(true);
                salarygroups.fetch({ // TODO: Need error handler
                    success: function() {util.loading(false);} // Why doesn't complete work for this?
                    ,error: function() {util.loading(false);}
                });
                
                this.charts[department] = this.insertView(".charts", new app.Views.Charts.SalaryGroups({collection: salarygroups, title: title}));
                this.charts[department].render();
            }
            $(window).scrollTop(this.charts[department].$el.offset().top - 80);
        }
    });
    
    app.Views.Charts.SalaryGroups = Backbone.Layout.extend({
        initialize: function() {
            this.collection.on("reset", this.render, this);
        }
        ,afterRender: function() {
            var keyvals = {}, series = [], i, highestSalaryGroup;
            
            // Reformat data to key/value object {salarygroup: count, ...}
            this.collection.each(function(row) {
                keyvals[row.get("salarygroup")] = row.get("count");
                highestSalaryGroup = row.get("salarygroup"); // Will keep getting updated until the last record (only works since it's a sorted collection)
            });
            
            // From the highest salary group, work backwards every salary group and make sure a row exists for it
            for(i = highestSalaryGroup; i >= 0; i -= 10) {
                if(keyvals[i] === undefined) keyvals[i] = 0;
            } // TODO: This doesn't seem to be ordering right in iOS; colors don't match up
            
            // Prepare data for Highcharts
            _.each(keyvals, function(val, key) {
               series.push({
                   name: key
                   ,data: [val]
               });
            });
            
            // Render chart
            this.chart = new Highcharts.Chart({
                chart: {
                    renderTo: this.el
                    ,type: "bar"
                    ,zoomType: "y"
                    ,height: "200"
                    ,backgroundColor: "rgba(255, 255, 255, 0.1)"
                }
                ,title: {
                    text: this.options.title
                }
                ,subtitle: {
                    text: document.ontouchstart === undefined ? "Click and drag to zoom in" : "Drag your finger to zoom in"
                }
                ,xAxis: {
                    labels: {enabled: false}
                }
                ,yAxis: {
                    min: 0
                    ,title: {
                        text: "Percentage of Employees"
                    }
                    ,labels: {
                        formatter: function() {
                            return Math.abs(this.value - 100) + "%";
                        }
                    }
                    ,reversed: true
                    //,labels: {enabled: false}
                }
                ,tooltip: {
                    formatter: function() {
                        return "$" + this.series.name + "-" + (parseInt(this.series.name, 0) + 9) + "k: " + util.formatNumber(this.y) +' ('+ Math.round(this.percentage) +'%)';
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
        }
    });
    
    app.Views.Charts.SizeVsDollarsBar = Backbone.Layout.extend({
        initialize: function() {
            this.collection.on("reset", this.render, this);
        }
        ,afterRender: function() {
            var series = [];
            this.collection.each(function(row) {
                series.push({
                    name: row.get("department")
                    ,data: [row.get("count"), row.get("salaries")]
                });
            });
            this.chart = new Highcharts.Chart({
                chart: {
                    renderTo: this.el
                    ,type: "bar"
                    ,zoomType: "y"
                    ,height: "300"
                    ,backgroundColor: "rgba(255, 255, 255, 0.1)"
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
        }
    });
    
    app.Views.Charts.SizeVsDollarsLine = Backbone.Layout.extend({
        initialize: function() {
            this.collection.on("reset", this.render, this);
        }
        ,afterRender: function() {
            var categories = [], employees = [], salaries = [];
            this.collection.each(function(row) {
                categories.push(row.get("department"));
                employees.push(row.get("count"));
                salaries.push(row.get("salaries"));
            });
                
            new Highcharts.Chart({
                chart: {
                    renderTo: this.el
                    ,zoomType: "x"
                    ,height: "300"
                    ,backgroundColor: "rgba(255, 255, 255, 0.1)"
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
    
    app.Views.Charts.DollarsPie = Backbone.Layout.extend({
        initialize: function() {
            this.collection.on("reset", this.render, this);
        }
        ,afterRender: function() {
            var data = [];
            this.collection.each(function(row) {
                data.push([row.get("department"), row.get("salaries")]);
            });
            
            new Highcharts.Chart({
                chart: {
                    renderTo: this.el
                    ,backgroundColor: "rgba(255, 255, 255, 0.1)"
                },
                title: {
                    text: "Salaries by Department"
                },
                tooltip: {
                    formatter: function() {
                        return this.key + ": <b>$" + util.formatNumber(this.y) + "</b> (" + Math.round(this.percentage*100)/100 + "%)";
                    }
                    ,percentageDecimals: 1
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            color: '#000000',
                            connectorColor: '#000000',
                            formatter: function() {
                                return '<b>'+ this.point.name +'</b>: '+ this.percentage.toFixed(2) +' %';
                            }
                        }
                    }
                    ,series: {
                        cropThreshold: 10
                    }
                },
                series: [{
                    type: 'pie'
                    ,name: 'Salaries'
                    ,data: data
                    /*,point: {
                        events: {
                            click: function() {
                                alert("clicked");
                            }
                        }
                    }*/
                }]
            });
        }
    });
    
})(window, window.jQuery, window._, window.Backbone, window.Highcharts, window.Salaries, window.FusionTable, window.util);