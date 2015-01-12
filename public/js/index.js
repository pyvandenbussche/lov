  var h = 500;
	var w = 1200;
	var minimumBubbleSize = 10;
	var labelsWithinBubbles = true;
	var title = "Relative Sizes Of The Planets, In Order Of Size";
	var dataset = [{label : "Mercury", value: 1134, xPos: 0},
	{label: "Venus ", value: 7088, xPos: 0},
	{label: "Earth", value: 7853, xPos: 0},
	{label: "Mars", value: 2206, xPos: 0},
	{label: "Jupiter", value: 983415, xPos: 0},
	{label: "Uranus", value: 125660, xPos: 0},
	{label: "Neptune", value: 113408, xPos: 0},
	{label: "Saturn", value: 693957, xPos: 0}];
	var gapBetweenBubbles = 15;
	var xPadding = 50;
	var yPadding = 100;
	var scaling = 20;

	/* Sort the dataset to ensure the bubble are always ascending */
	dataset = dataset.sort(function (a, b) { return (a.value - b.value);});
	
	/* Scale the dataset */
	var factor = minimumBubbleSize / dataset[0].value;
	dataset.forEach(function(d) { d.value = d.value * factor; });

	/* Scaling */

	function getRadius(area) {
		return Math.sqrt(area / Math.PI);
	}

	function getLabelDivSideFromArea(area) {
		return Math.sqrt(Math.pow(2 * rScale(area), 2) / 2);
	}

	var rScale = function(input) {
		/* Magic number here is just to get a reasonable sized smallest bubble */
		return getRadius(input) * scaling;
	}

	/* For bubbles that are too big to centre their text, compute a better position */

	function getNewXPosition(leftBubble, rightBubble) {

	}

	function getNewYPosition(leftBubble, rightBubble) {

	}

	/* Create the chart */

	var svg = d3.select("#svg")
	.append("svg")
	.attr("width", w)
	.attr("height", h)

	/* Adjust left hand side to add on the radius of the first bubble */
	xPaddingPlusRadius = xPadding + rScale(dataset[0].value);
	dataset[0].xPos = xPaddingPlusRadius;

	var circles = svg.selectAll("circle")
	.data(dataset)
	.enter()
	.append("circle");

	var accumulator = xPaddingPlusRadius;
	
	circles.attr("cx", function(d, i) {

		if (i > 0) {

			var previousRadius = rScale(dataset[i-1].value);
			var currentRadius = rScale(d.value);

			var hypotenuseLength = previousRadius + currentRadius + gapBetweenBubbles;
			var yLength = currentRadius - previousRadius;

			var increment = Math.sqrt(Math.pow(hypotenuseLength, 2) - Math.pow(yLength, 2));
			accumulator += increment;
			d.xPos = accumulator;
			return accumulator;

		} else {
			return xPaddingPlusRadius;
		}

	})
	.attr("cy", function(d) {
		return h - rScale(d.value) - yPadding;
	})
	.attr("r", function(d) {
		return rScale(d.value);
	});

	/* Place text in the circles. Could try replacing this with foreignObject */

	svg.selectAll("foreignObject")
	.data(dataset)
	.enter()
	.append("foreignObject")
	.attr("x", function(d, i) {
		if (d.xPos > w) {
			/* Do the different thing */
			return d.xPos - (getLabelDivSideFromArea(d.value)/2);
		} else {
			return d.xPos - (getLabelDivSideFromArea(d.value)/2);
		}
	})
	.attr("y", function(d, i) {
		if (labelsWithinBubbles) {
			if ((h - rScale(d.value) - yPadding) < 0) {
				/* Do the different thing */
				return h - rScale(d.value) - yPadding - (getLabelDivSideFromArea(d.value)/2);
			} else {
				return h - rScale(d.value) - yPadding - (getLabelDivSideFromArea(d.value)/2);
			}
		} else {
			return h - yPadding + 20;
		}
	})
	.attr("width", function(d) { return getLabelDivSideFromArea(d.value); })
	.attr("height", function(d) { return getLabelDivSideFromArea(d.value); })
	.append("xhtml:body")
	.append("div")
	.attr("style", function(d) { return "width: " + getLabelDivSideFromArea(d.value) + "; height: " + getLabelDivSideFromArea(d.value); })
	.attr("class", "labelDiv")
	.html(function(d, i) { return "<p class='label'>" + d.label + "</p>"; });

	/* Draw the chart title */

	svg.append("text")
	.attr("x", xPadding)
	.attr("y", h - 40)
	.attr("class", "title")
	.text(title);