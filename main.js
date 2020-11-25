var ingredients = []
var nIngredients = 0
var squareMatrix = []
var connections = [];
var items = [];
var whitelist = [];

function matrix(m, n) {
    var result = []
    for(var i = 0; i < n; i++) {
        result.push(new Array(m).fill(0))
    }
    return result
}

function main() {
	d3.csv("./data/PP_recipes.csv", 
		function (data) {
			ingredients.push(JSON.parse(data.ingredient_ids))
	}).then( function () {
		var counts = {};
		for (let i = 0; i < ingredients.length; i++) {
			for (var j = 0; j < ingredients[i].length - 1; j++) {
				var num = ingredients[i][j]
				counts[num] = counts[num] ? counts[num] + 1 : 1;
			}
		}
		items = Object.keys(counts).map(function(key) {
		  return [key, counts[key]];
		});

		// Sort the array based on the second element
		items.sort(function(first, second) {
		  return second[1] - first[1];
		});
		
		items = items.slice(0, 20);
		console.log(items)
		whitelist = items.map(x => parseInt(x[0]))
		connections = matrix(20, 20);
		for (var recipe of ingredients) {
			matches = recipe.filter(value => whitelist.includes(value))
			if (matches.length > 1) {
				for (var i = 0; i < matches.length - 1; i++) {
					for (var j = i+1; j < matches.length; j++) {
						connections[whitelist.indexOf(matches[i])][whitelist.indexOf(matches[j])] += 1;
					}
				}
			}
		}
		
		var res = d3.chord()
		.padAngle(0.05)     // padding between entities (black arc)
		.sortSubgroups(d3.descending)
		(connections)
		
		// add the groups on the inner part of the circle
		svg
		  .datum(res)
		  .append("g")
		  .selectAll("g")
		  .data(function(d) { return d.groups; })
		  .enter()
		  .append("g")
		  .append("path")
			.style("fill", "grey")
			.style("stroke", "black")
			.attr("d", d3.arc()
			  .innerRadius(200)
			  .outerRadius(210)
			)

		// Add the links between groups
		svg
		  .datum(res)
		  .append("g")
		  .selectAll("path")
		  .data(function(d) { return d; })
		  .enter()
		  .append("path")
			.attr("d", d3.ribbon()
			  .radius(200)
			)
			.style("fill", "#69b3a2")
			.style("stroke", "black");
	})
	
	var svg = d3.select("#visualization")
	  .append("svg")
		.attr("width", 800)
		.attr("height", 800)
	  .append("g")
		.attr("transform", "translate(400,400)")

	/*
	d3.csv("./data/PP_recipes.csv", function(data) {
		console.log(data);
	});
	*/
}