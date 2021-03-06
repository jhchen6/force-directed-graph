# force-directed-graph

This is a new coder's coding practice, following [Mike Bostock](https://bost.ocks.org/mike/)'s [Force-Directed Graph](https://bl.ocks.org/mbostock/4062045) example.

## current version

The current version uses [d3.js](https://d3js.org/) (this is the first time I use d3.js (by the way, it's not been long since the first time I coded)), which is handy and lovely. A lot of thanks to Mike Bostock.

Notes of using d3 are included as comments in "index.html".

## old version

An old hand-coded version without using d3.js is archived as "index_old.html", which cites "main.js" and "main.css". (that's why I pay a lot of thanks to Mike Bostock. Suffering from the hard and you know things are valuable.)

The old version adopted many techniques from the [d3-force](https://github.com/d3/d3-force) repository, including:

- initial layout method
- force formula and constants
- velocity decay

## on using local file

Directly opening "index.html" that `get`s local files fires cross origin error.

A solution: https://stackoverflow.com/a/21608670/9897117
