
# LuniLand

A JavaSript homage to Atari's classic  Lunar Lander game.

## How To Play

A running version is hosted at [luniland.halabe.com](https://luniland.halabe.com). To play, use the up and down arrows to control the ship's engine. Use the the left and right arrows to control the ship's rotation. Try to land on the flat pads; feet down with a slow descent and not too much lateral speed. The speed and rotation values turn red when speed and rotation will cause a crash.

It takes a few tries to get the hang of it. If your crash, reload the page and try again. If you land, turn up engine thrust to take off again.

## How It Works

The app's main dependency is [Two.js](https://two.js.org), a 2D drawing API that can render WebGL, SVG and canvas.  

The app (app.js) instantiates a two instance, builds a ship (Ship.js) and a fractal terrain (Terrain.js), and starts a state machine that computes game state (like flying, landing, crashing, etc.)

It subscribes to the two update method. On each render, it performs physics on the ship by applying lunar gravity in the y direction, and the x and y components of the ship's thrust (DynamicObject.js and Ship.js). When the ship nears the terrain, the app test several points on the ship's hull for inclusion in a polygon formed by a small section of the terrain's surface.

## License

This project is licensed under the [NAME HERE] License - see the LICENSE.md file for details

## Acknowledgments

* [Two.js](https://two.js.org)
* [seedrandom](https://github.com/davidbau/seedrandom)
* [gsap](https://greensock.com)
