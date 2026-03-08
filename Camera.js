'use strict';

class Camera {
  constructor(svgElement, transform = {}) {
    this.domElement = svgElement;
    this.setTranslation(transform.translation || { x: 0, y: 0 });
    this.setScale(transform.scale || 1);
  }

  get width() { return this.domElement.clientWidth; }
  get height() { return this.domElement.clientHeight; }

  setTranslation(translation, duration = 0) {
    this._translation = translation;
    const scale = this._scale || 1;
    const viewBox = this._calcViewBox(translation, scale);
    duration ? this._animate(viewBox, duration) : this.domElement.setAttribute("viewBox", viewBox);
  }

  setScale(scale, duration = 0) {
    this._scale = Math.round(scale * 100) / 100;
    const translation = this.translation;
    const viewBox = this._calcViewBox(translation, scale);
    duration ? this._animate(viewBox, duration) : this.domElement.setAttribute("viewBox", viewBox);
  }

  // combined translation and scale setter
  setTransform({ translation, scale }, duration = 0) {
    this._translation = translation;
    this._scale = Math.round(scale * 100) / 100;
    const viewBox = this._calcViewBox(translation, scale);
    duration ? this._animate(viewBox, duration) : this.domElement.setAttribute("viewBox", viewBox);
  }

  _calcViewBox(translation, scale) {
    const w = this.width / scale, h = this.height / scale;
    const x = translation.x - w / 2, y = translation.y - h / 2;
    return `${x} ${y} ${w} ${h}`;
  }

  _animate(viewBox, duration) {
    if (this.isTweening) this.tween.kill();
    this.tween = gsap.to(this.domElement, { attr: { viewBox }, duration });
  }

  get isTweening() {
    return this.tween && this.tween.isActive();
  }

  get translation() {
    if (!this.isTweening) return this._translation;
    const vbox = this.domElement.viewBox.baseVal;
    const scale = this.width / vbox.width;
    return { x: vbox.x + this.width / 2 / scale, y: vbox.y + this.height / 2 / scale };
  }

  get scale() {
    if (!this.isTweening) return this._scale;
    return this.width / this.domElement.viewBox.baseVal.width;
  }

}