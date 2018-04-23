var svg, width, height, centerX, centerY;
var start, stop, step;
const colors = ["lightgreen", "blue", "lightblue", "orange", "lightsalmon",
    "green", "red", "pink", "purple", "plum", "brown"];

var repulsionConst = 800,
    attractionConstBase = 20,
    defaultLinkLength = 50,
    movementRatio = 0.3,
    iterations = 2500,
    initialRadius = 10,
    initialAngle = Math.PI * (3 - Math.sqrt(5));

window.onload = function () {
    svg = document.getElementById("svg");
    width = svg.scrollWidth;
    height = svg.scrollHeight;
    centerX = width / 2;
    centerY = height / 2;

    start = document.getElementById("start");
    // stop = document.getElementById("stop");
    step = document.getElementById("step");

    $.getJSON("miserables.json", function (graph) {
        var nodes = graph.nodes,
            links = graph.links,
            attractionConsts,
            nodeIds = {};
            // stopFlag;

        nodes.forEach(function (node, index) {
            nodeIds[node.id] = index;
        });
        links.forEach(function (link) {
            link.source = nodes[nodeIds[link.source]];
            link.target = nodes[nodeIds[link.target]];
        });

        initializePos();
        initializeAttractionConsts();
        addToSVG();

        start.addEventListener("click", function () {
            var i;
            // stopFlag = false;
            iterations = document.getElementById("iterations").value;
            console.log("started " + iterations + " iterations");
        
            initializePos();
            for (i = 0; i < iterations; i++) {
                calForce();
                moveNodes();
                // if (stopFlag == true) {
                //     break;
                // }
            }
            addToSVG();
            // if (i == iterations) {
                console.log("finished");
            // } else {
            //     console.log("stopped after " + i + " iterations");
            // }
        });
        
        // stop.addEventListener("click", function () {
        //     stopFlag = true;
        // });

        step.addEventListener("click", function () {
            calForce();
            moveNodes();
            addToSVG();
        });

        function initializePos() {
            var radius, angle;
            nodes.forEach(function (node, i) {
                radius = initialRadius * Math.sqrt(i),
                    angle = i * initialAngle;
                node.x = radius * Math.cos(angle) + centerX;
                node.y = radius * Math.sin(angle) + centerY;
                node.netFroce = new Force(0, 0);
                node.index = i;
            });
        }

        function initializeAttractionConsts() {
            var degreeCount = new Array(nodes.length),
                index;

            links.forEach(function (link) {
                index = link.source.index;
                if (degreeCount[index] == undefined) {
                    degreeCount[index] = 1;
                } else {
                    degreeCount[index]++;
                }
                index = link.target.index;
                if (degreeCount[index] == undefined) {
                    degreeCount[index] = 1;
                } else {
                    degreeCount[index]++;
                }
            });

            attractionConsts = new Array(links.length);
            links.forEach(function (link, index) {
                degree1 = degreeCount[link.source.index];
                degree2 = degreeCount[link.target.index];
                attractionConsts[index] = attractionConstBase / Math.min(degree1, degree2);
            });
        }

        function addToSVG() {
            svg.innerHTML = '<g class="links">';
            links.forEach(function (link) {
                var node1 = link.source;
                var node2 = link.target;
                svg.innerHTML += '<line stroke-width="' + Math.sqrt(link.value) + '" x1="' + node1.x +
                    '" y1="' + node1.y + '" x2="' + node2.x + '" y2="' + node2.y + '"></line>';
            });
            svg.innerHTML += '</g><g class="nodes">';
            nodes.forEach(function (node) {
                svg.innerHTML += '<circle r="5" fill="' + color(node.group) + '" cx="' + node.x +
                    '" cy="' + node.y + '"><title>' + node.id + '</title></circle>';
            });
            svg.innerHTML += '</g>';
        }

        function calForce() {
            nodes.forEach(function (node1, index1) {
                nodes.forEach(function (node2, index2) {
                    if (index2 < index1) {
                        var force = calRepulsionForce(node1, node2);
                        node1.netFroce.add(force);
                        node2.netFroce.add(force.reverse());
                    }
                });
            });
            links.forEach(function (link, index) {
                var node1 = link.source;
                var node2 = link.target;
                var force = calAttractionForce(node1, node2, attractionConsts[index]);
                node1.netFroce.add(force);
                node2.netFroce.add(force.reverse());
            });
        }

        function moveNodes() {
            var xSum = 0,
                ySum = 0,
                xShift,
                yShift;

            nodes.forEach(function (node) {
                node.x += movementRatio * node.netFroce.x;
                if (node.x < 0) {
                    node.x = 0;
                } else if (node.x > width) {
                    node.x = width;
                }
                node.y += movementRatio * node.netFroce.y;
                if (node.y < 0) {
                    node.y = 0;
                } else if (node.y > height) {
                    node.y = height;
                }

                node.netFroce.reset();
            });

            nodes.forEach(function (node) {
                xSum += node.x;
                ySum += node.y;
            });
            xShift = xSum / nodes.length - centerX;
            yShift = ySum / nodes.length - centerY;

            nodes.forEach(function (node) {
                node.x -= xShift;
                node.y -= yShift;
            });
        }
    });
}



function Force(x, y) {
    this.x = x;
    this.y = y;
    this.add = function (force) {
        this.x += force.x;
        this.y += force.y;
    }
    this.scale = function (magnitude) {
        var multiplier = magnitude / Math.sqrt(this.x * this.x + this.y * this.y);
        this.x *= multiplier;
        this.y *= multiplier;
    }
    this.reverse = function () {
        return new Force(-this.x, -this.y);
    }
    this.reset = function () {
        this.x = 0;
        this.y = 0;
    }
}

function calRepulsionForce(node1, node2) {
    var dx = node1.x - node2.x;
    var dy = node1.y - node2.y;
    var force = new Force(dx, dy);
    if (force.x !== 0 || force.y !== 0) {
        force.scale(repulsionConst / (dx * dx + dy * dy));
    }
    return force;
}

function calAttractionForce(node1, node2, attractionConst) {
    var dx = node1.x - node2.x,
        dy = node1.y - node2.y,
        r = Math.sqrt(dx * dx + dy * dy),
        force = new Force(-dx, -dy),
        magnitude;

    if (force.x !== 0 || force.y !== 0) {
        // magnitude = attractionConst * Math.log(r / defaultLinkLength);
        // magnitude = attractionConst * (r - defaultLinkLength);
        magnitude = attractionConst * (1 - defaultLinkLength / r);
        force.scale(magnitude);
    }

    return force;
}

function color(group) {
    return colors[group];
}
