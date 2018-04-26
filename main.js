var svg, width, height, centerX, centerY,
    nodes, links,
    colors = ["lightgreen", "blue", "lightblue", "orange", "lightsalmon",
        "green", "red", "pink", "purple", "plum", "brown"];

//for initial layout
var initialRadius = 10,
    initialAngle = Math.PI * (3 - Math.sqrt(5));

//for calculating forces 
var repulsionConst = 30,
    attractionConstBase = 1,
    attractionConsts,
    attractionBias,
    defaultLinkLength = 30;

//for animation
var $circles,
    $lines,
    selected = null,
    animationFrames = [],
    velocityDecay = 0.6,
    paintInterval = 20,
    initialAlpha = 2,
    dragEndAlpha = 1,
    alpha,
    alphaMin = 0.003,
    alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
    alphaTarget = 0;

function init(graph) {
    svg = document.getElementById("svg");
    width = svg.scrollWidth;
    height = svg.scrollHeight;
    centerX = width / 2;
    centerY = height / 2;

    nodes = graph.nodes;
    links = graph.links;
    console.log("nodes: " + nodes.length);
    console.log("links: " + links.length);

    var nodeIds = {};
    nodes.forEach(function (node, index) {
        nodeIds[node.id] = index;
    });
    links.forEach(function (link) {
        link.source = nodes[nodeIds[link.source]];
        link.target = nodes[nodeIds[link.target]];
    });

    initializePos();
    initializeConsts();
    addToSVG();

    window.onmouseup = stopMovingElem;
    svg.onmousemove = moveElem;
    alpha = initialAlpha;
}

function initializePos() {
    var radius, angle;
    nodes.forEach(function (node, i) {
        radius = initialRadius * Math.sqrt(i),
            angle = i * initialAngle;
        node.x = radius * Math.cos(angle) + centerX;
        node.y = radius * Math.sin(angle) + centerY;
        node.netForce = new Vector(0, 0);
        node.index = i;
    });
}

function initializeConsts() {
    // var degreeCount = new Array(nodes.length),
    var degreeCount = [],
        index;

    links.forEach(function (link) {
        index = link.source.index;
        if (degreeCount[index] === undefined) {
            degreeCount[index] = 1;
        } else {
            degreeCount[index]++;
        }
        index = link.target.index;
        if (degreeCount[index] === undefined) {
            degreeCount[index] = 1;
        } else {
            degreeCount[index]++;
        }
    });

    // attractionConsts = new Array(links.length);
    // attractionBias = new Array(links.length);
    attractionConsts = [];
    attractionBias = [];
    links.forEach(function (link, index) {
        degree1 = degreeCount[link.source.index];
        degree2 = degreeCount[link.target.index];
        attractionConsts[index] = attractionConstBase / Math.min(degree1, degree2);
        attractionBias[index] = degree1 / (degree1 + degree2);
    });
}

function addToSVG() {
    var elemHTML = [];

    svg.innerHTML = '<g class="links">';
    links.forEach(function (link) {
        var node1 = link.source;
        var node2 = link.target;
        elemHTML.push('<line stroke-width="' + Math.sqrt(link.value) +
            '" x1="' + node1.x + '" y1="' + node1.y +
            '" x2="' + node2.x + '" y2="' + node2.y + '"></line>');
    });
    svg.innerHTML += elemHTML.join("") + '</g><g class="nodes">';

    elemHTML = [];
    nodes.forEach(function (node) {
        elemHTML.push('<circle r="5" fill="' + color(node.group) +
            '" cx="' + node.x + '" cy="' + node.y + '"><title>'
            + node.id + '</title></circle>');
    });
    svg.innerHTML += elemHTML.join("") + '</g>';

    $circles = $("circle");
    $lines = $("line");

    $circles.each(function (index, circle) {
        $(circle).mousedown(function (evt) {
            selected = nodes[index];
        });
    });
}

function moveElem(evt) {
    if (selected == null) return;

    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    pt = pt.matrixTransform(svg.getScreenCTM().inverse());
    selected.x = pt.x;
    selected.y = pt.y;
    animationFrames.forEach(function (animationFrame) {
        cancelAnimationFrame(animationFrame);
    });
    alpha = initialAlpha;
    run();
}

function stopMovingElem() {
    if (selected == null) return;
    
    selected = null;
    animationFrames.forEach(function (animationFrame) {
        cancelAnimationFrame(animationFrame);
    });
    alpha = dragEndAlpha;
    run();
}

function updateSVG() {
    $lines.each(function (index, line) {
        var link = links[index];
        var node1 = link.source;
        var node2 = link.target;
        $(line).attr({
            x1: node1.x,
            y1: node1.y,
            x2: node2.x,
            y2: node2.y
        });
    });

    $circles.each(function (index, circle) {
        var node = nodes[index];
        $(circle).attr({
            cx: node.x,
            cy: node.y
        });
    });
}

function run() {
    function loop() {
        alpha += (alphaTarget - alpha) * alphaDecay;
        for (var j = 0; j < paintInterval; j++) {
            calForce();
            moveNodes();
        }
        updateSVG();

        if (alpha > alphaMin) {
            animationFrames.push(requestAnimationFrame(loop));
        }
    }
    animationFrames.push(requestAnimationFrame(loop));
}

function restart() {
    initializePos();
    alpha = initialAlpha;
    run();
}

function calForce() {
    links.forEach(function (link, index) {
        var node1 = link.source;
        var node2 = link.target;
        var force = calAttractionForce(node1, node2, index);
        node1.netForce.add(force.multiply(1 - attractionBias[index]));
        node2.netForce.add(force.multiply(-attractionBias[index]));
    });
    nodes.forEach(function (node1, index1) {
        nodes.forEach(function (node2, index2) {
            if (index2 === index1) return false;
            var force = calRepulsionForce(node1, node2);
            node1.netForce.add(force);
            node2.netForce.add(force.multiply(-1));
        });
    });
}

function moveNodes() {
    var xSum = 0,
        ySum = 0,
        xShift,
        yShift;

    //move nodes according to force
    nodes.forEach(function (node) {
        if (node === selected) {
            node.netForce.reset();
            return true;
        }
        node.netForce = node.netForce.multiply(velocityDecay);
        node.x += node.netForce.x;
        if (node.x < 0) {
            node.x = 0;
        } else if (node.x > width) {
            node.x = width;
        }
        node.y += node.netForce.y;
        if (node.y < 0) {
            node.y = 0;
        } else if (node.y > height) {
            node.y = height;
        }

        xSum += node.x;
        ySum += node.y;
    });

    //center the layout
    xShift = xSum / nodes.length - centerX;
    yShift = ySum / nodes.length - centerY;
    nodes.forEach(function (node) {
        if (node === selected) return true;
        node.x -= xShift;
        node.y -= yShift;
    });
}

function Vector(x, y) {
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
    this.reset = function () {
        this.x = 0;
        this.y = 0;
    }
    this.multiply = function (multiplier) {
        var x = this.x * multiplier;
        var y = this.y * multiplier;
        return new Vector(x, y);
    }
}

function calRepulsionForce(node1, node2) {
    var dx = node1.x - node2.x;
    var dy = node1.y - node2.y;
    if (dx === 0) dx = jiggle();
    if (dy === 0) dy = jiggle();

    var force = new Vector(dx, dy);
    force.scale(repulsionConst / (dx * dx + dy * dy) * alpha);
    return force;
}

function calAttractionForce(node1, node2, i) {
    var dx = node1.x + node1.netForce.x - node2.x - node2.netForce.x,
        dy = node1.y + node1.netForce.y - node2.y - node2.netForce.y;
    if (dx === 0) dx = jiggle();
    if (dy === 0) dy = jiggle();
    var r = Math.sqrt(dx * dx + dy * dy);

    var force = new Vector(-dx, -dy);
    var magnitude = attractionConsts[i] * (1 - defaultLinkLength / r) * alpha;
    force.scale(magnitude);
    return force;
}

function jiggle() {
    return (Math.random() - 0.5) * 1e-6;
}

function color(group) {
    return colors[group];
}
