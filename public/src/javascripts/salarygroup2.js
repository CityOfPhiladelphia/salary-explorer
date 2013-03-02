window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Backbone = window.Backbone || {};
window.Highcharts = window.Highcharts || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Collections: {}, Routers: {}};
window.FusionTable = window.FusionTable || {};
window.util = window.util || {};
(function(window, $, _, Backbone, Highcharts, app, db, util) {
    
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
    
    app.Views.SalaryGroupsView = Backbone.View.extend({
        initialize: function() {
            this.collection = this.options.collection;
            this.template = $("#tmpl-salarygroups2").html();
            this.collection.on("reset", this.render, this);
        }
        ,render: function() {
            this.$el.html(this.template);
            if(this.collection.length) this.buildChart(this.$(".salarygroup")[0]);
            return this;
        }
        ,buildChart: function(container) {
            var keyvals = {}, series = [], i, highestSalaryGroup;
            
            // Reformat data to key/value object {salarygroup: count, ...}
            this.collection.each(function(row) {
                keyvals[row.get("salarygroup")] = row.get("count");
                highestSalaryGroup = row.get("salarygroup"); // Will keep getting updated until the last record (only works since it's a sorted collection)
            });
            
            // From the highest salary group, work backwards every salary group and make sure a row exists for it
            for(i = highestSalaryGroup; i >= 0; i -= 10) {
                if(keyvals[i] === undefined) keyvals[i] = 0;
            }
            
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
                    renderTo: container
                    ,type: "bar"
                    ,zoomType: "y"
                    ,height: "200"
                    ,backgroundColor: "rgba(255, 255, 255, 0.1)"
                }
                ,title: {
                    text: "Salary Buckets"
                }
                ,subtitle: {
                    text: document.ontouchstart === undefined ? "Click and drag to zoom in" : "Drag your finger to zoom in"
                }
                ,xAxis: {
                    categories: ["Salary Bucket"]
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
    
})(window, window.jQuery, window._, window.Backbone, window.Highcharts, window.Salaries, window.FusionTable, window.util);