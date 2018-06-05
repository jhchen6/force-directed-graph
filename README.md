# force-directed-graph

This is a new coder's coding practice, following [Mike Bostock](https://bost.ocks.org/mike/)'s [Force-Directed Graph](https://bl.ocks.org/mbostock/4062045) example.

The newer version uses [d3.js](https://d3js.org/) (this is the first time I use d3.js (by the way, it's not been long since the first time I coded)), which is handy and lovely. A lot of thanks to Mike Bostock.

Notes of using d3 are included as comments in "index.html".

An old hand-coded version without using d3.js is archived as "index_old.html", which cites "main.js" and "main.css". (that's why I pay a lot of thanks to Mike Bostock. Suffering from the hard and you know things are valuable.)

## on using local file

Directly opening "index.html" that asks for local files via `GET` fires cross origin error.

A solution: https://stackoverflow.com/a/21608670/9897117