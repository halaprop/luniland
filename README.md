
# LuniLand

A JavaSript homage to Atari's classic  Lunar Lander game.

## How To Play

A running version can be found at [luniland.halabe.com](https://luniland.halabe.com). To play, use the up / down arrows to control the ship's engine thrust and the left / right arrows to control the ship's orientation. Land on the flat pads; feet down, at a slow rate of descent and not too much lateral speed.

Just like a real moon landing, it takes a few tries to get the hang of it. If your crash, reload the page and try again. If you land, increase  engine thrust to take off again.  Make sure you manage your fuel state because when you are out of fuel - you drop like a lunar rock!

## How It Works

The app's main dependency is [Two.js](https://two.js.org), a 2D drawing API that can render WebGL, SVG and canvas. 

The app (app.js) instantiates a two instance, builds a ship (Ship.js) and a fractal terrain (Terrain.js), and starts a simple state machine that runs the game (with states like flying, landing, crashing).

On each render, the app performs physics on the ship, computing an acceleration vector from lunar gravity and engine thrust (DynamicObject.js and Ship.js). As the ship nears the terrain, the two objects perform hit testing, comparing points on the ship's hull to a small polygon of terrain near the ship.

## License

This project is licensed under an MIT License - see the LICENSE.md.

## Acknowledgments

* [Two.js](https://two.js.org)
* [seedrandom](https://github.com/davidbau/seedrandom)
* [gsap](https://greensock.com)
