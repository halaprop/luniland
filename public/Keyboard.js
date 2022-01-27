'use strict'

class KeyboardController {
  constructor(keys, repeat) {
    this.keys = keys;
    this.repeat = repeat;
    this.timers = {};

    document.onkeydown = event => this.keydown(event);
    document.onkeyup = event => this.keyup(event);
    window.onblur = () => this.blur;
  }

  keydown(event) {
    event.stopPropagation();
    const code = event.code;
    if (!(code in this.keys)) return true;
    if (!(code in this.timers)) {
      this.timers[code] = null;
      this.keys[code]();
      if (this.repeat) this.timers[code] = setInterval(this.keys[code], this.repeat);
    }
    return false;
  }

  keyup(event) {
    const code = event.code;
    if (code in this.timers) {
      if (this.timers[code]) clearInterval(this.timers[code]);
      delete this.timers[code];
    }
  }

  blur() {
    for (let key in this.timers)
      if (this.timers[key]) clearInterval(this.timers[key]);
    this.timers = {};
  }
}

class TouchController {
  constructor(gestures) {
    this.gestures = gestures;
    document.ontouchstart = event => this.touchstart(event);
    document.ontouchmove = event => this.touchmove(event);
  }

  touchstart(event) {
    const touch = event.touches[0];
    this.x = touch.clientX;
    this.y = touch.clientY;
  }

  touchmove(event) {
    if (!this.x || !this.y) return

    const dx = this.x - event.touches[0].clientX;
    const dy = this.y - event.touches[0].clientY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        this.gestures.right(event);
      } else {
        this.gestures.left(event);
      }
    } else {
      if (dy < 0) {
        console.log(dy)
        this.gestures.down(event);
      } else {
        this.gestures.up(event);
      }
    }
    this.x = null;
    this.y = null;
  }
}