'use strict';

class Camera {
  constructor(two, transform={}) {
    this.two = two;
    this.domElement = two.renderer.domElement;
    this.setTranslation(transform.translation || new Two.Vector(0, 0));
    this.setScale(transform.scale || 1);
  }

  setTranslation(translation, duration=0) {
    this._translation = translation;
    const scale = this.scale || 1;
    let w = this.two.width/scale, h = this.two.height/scale;
    let x = translation.x - w/2, y = translation.y - h/2;

    let viewBox = `${x} ${y} ${w} ${h}`;
    if (duration) this.animate(viewBox, duration);
    else this.domElement.setAttribute("viewBox", viewBox);
  }

  setScale(scale, duration=0) {
    this._scale = Math.round(scale * 100)/100;
    const translation = this.translation || { x:0, y:0};
    let w = this.two.width/scale, h = this.two.height/scale;
    let x = translation.x - w/2, y = translation.y - h/2;

    let viewBox = `${x} ${y} ${w} ${h}`;
    if (duration) this.animate(viewBox, duration);
    else this.domElement.setAttribute("viewBox", viewBox);
  }

  animate(viewBox, duration) {
    if (this.isTweening) this.tween.kill();
    this.tween = gsap.to(this.domElement, { attr: { viewBox }, duration });
  }

  get isTweening() {
    return this.tween && this.tween.isActive();
  }

  get translation() {
    if (!this.isTweening) return this._translation;
    else {
      let vbox = this.domElement.viewBox.baseVal;
      let scale = this.two.width / vbox.width;
      return new Two.Vector(vbox.x + this.two.width/2/scale, vbox.y + this.two.height/2/scale);
    }
  }
  
  get scale() {
    if (!this.isTweening) return this._scale;
    else {
      let vbox = this.domElement.viewBox.baseVal;
      return this.two.width / vbox.width;
    }
  }

}