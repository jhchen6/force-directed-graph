# force-directed-graph
hand coded force-directed graph, a coding practice

the first version (visible in the commit history) was almost wild, with awkward design and implementation, and did not support interaction nor animation

the current version is more cultivated, adopted many techniques from the [d3-force](https://github.com/d3/d3-force) repository, including: 

1. force formula and constants
2. velocity decay
3. initial layout method

but I don't quite understand the quadTree used to calculate attraction force...

problems remaining:
1. use of json...
    * I tried to load local .json file. 
      * it works in Edge but not in Chrome.
    * then I came across a not so elegant way to do it: 
      * I used a service provided by [myjson.com](http://myjson.com/).
2. adding elements to svg
    * the `.append()` method does not work...
      * the innerHTML of svg is truly modified,
      * but nothing is displayed = =.
    * then anyhow I found out that:
      * directly editing the innerHTML of svg works.
        * I hope it's not too slow
        * as I remember manipulating long strings will take quite a while..
3. animation
    * I used `.setInterval()`
    * also `.requestAnimationFrame()`
      * it seems smoother
      * but when dragging nodes around it is called repeatly
      * so that maybe many animation frames run together, which is slow.
    * anyway I logged all of the frames when they are called 
    * and cancle all of the previous frames when new one is called
      * -_-

