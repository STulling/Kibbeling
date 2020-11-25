var ingredients = []
var nIngredients = 0
var squareMatrix = []
var connections = [];

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
		var tmp = ingredients.map(x => Math.max(...x))
		for (let i = 0; i < tmp.length; i++) {
		  if (tmp[i] > nIngredients) {
			nIngredients = tmp[i];
		  }
		}
		connections = matrix(nIngredients, nIngredients);
		for (let i = 0; i < ingredients.length; i++) {
			if (ingredients[i].length > 1) {
				for (var j = 0; j < ingredients[i].length - 1; j++) {
					for (var k = j+1; k < ingredients[i].length; k++) {
						connections[j][k] += 1;
					}
				}
			}
		}
	})
	
	var svg = d3.select("#visualization")
	  .append("svg")
		.attr("width", 800)
		.attr("height", 800)
	  .append("g")
		.attr("transform", "translate(400,400)")


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

	/*
	d3.csv("./data/PP_recipes.csv", function(data) {
		console.log(data);
	});
	*/
}