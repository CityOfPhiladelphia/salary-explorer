window.jQuery = window.jQuery || {};
window._ = window._ || {};
window.Backbone = window.Backbone || {};
window.Salaries = window.Salaries || {Models: {}, Views: {}, Collections: {}, Routers: {}};
window.FusionTable = window.FusionTable || {};
window.util = window.util || {};
(function(window, $, _, Backbone, app, db, util) {
    
    app.Collections.SalaryGroups = Backbone.Collection.extend({
        defaultSettings: {
            fields: ["count", "salarygroup"]
            ,group: true
            ,orderby: "salarygroup"
            ,dir: "asc"
        }
        ,initialize: function(models, options) {
            this.settings = _.defaults(options.settings || {}, this.defaultSettings);
            this.count = 0;
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
                    object[key] = (key === "salarygroup" || key === "count" ? parseInt(row[i]) : row[i]);
                }
                objects.push(object);
                
                // Add to the total
                self.count += object["count"] || 0;
            });
            return objects;
        }
    });
    
    app.Views.SalaryGroupsView = Backbone.View.extend({
        settings: {
            bucketMinPercentage: 0
            ,bucketSize: 9
        }
        ,initialize: function() {
            this.collection = this.options.collection;
            this.template = _.template($("#tmpl-salarygroups").html());
            this.collection.on("reset", this.render, this);
        }
        ,render: function() {            
            // Determine title
            if(this.collection.settings.department === undefined) {
                title = "All Employees";
            } else if(codes !== undefined && codes.department !== undefined && codes.department[this.collection.settings.department] !== undefined) {
                title = codes.department[this.collection.settings.department];
            } else {
                title = "Salaries"; // Intentionally vague
            }
            
            this.$el.html(this.template({rows: this.collection.toJSON(), count: this.collection.count, settings: this.collection.settings, title: title, buckets: this.buildBuckets()}));
            this.$("[rel=\"tooltip\"]").tooltip();
            return this;
        }
        ,buildBuckets: function() {
            var totalCount = this.collection.count
                ,buckets = []
                ,self = this
                ,percentage, salarygroup, count;
            
            // Loop through each salarygroup model
            this.collection.each(function(model) {
                count = model.get("count")
                percentage = Math.round(count/totalCount*100*10000)/10000;
                salarygroup = model.get("salarygroup");
                
                // If no buckets exist yet, or this bucket meets minPercentage and the previous bucket did as well
                if( ! buckets.length || (percentage >= self.settings.bucketMinPercentage && buckets[buckets.length-1].percentage >= self.settings.bucketMinPercentage)) {
                    buckets.push({
                        percentage: percentage
                        ,min: model.get("salarygroup")
                        ,max: model.get("salarygroup") + self.settings.bucketSize
                        ,count: model.get("count")
                    });
                // Otherwise add it to the last bucket and increase the last buckets details with this one's
                } else {
                    buckets[buckets.length-1].percentage += percentage;
                    buckets[buckets.length-1].count += count;
                    buckets[buckets.length-1].max = salarygroup + self.settings.bucketSize;
                }
            });
            return buckets;
        }
    });
    
})(window, window.jQuery, window._, window.Backbone, window.Salaries, window.FusionTable, window.util);