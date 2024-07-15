'use strict';

const kMsPerTick = 16.7

class DynamicObject {
  constructor() {
    this.v = new Two.Vector(0, 0);
    this.av = 0;
    this.group = new Two.Group();
  }

  static get gravity() { return 1.62/100000; }
  get friction() { return 0.998; }
  get angularFriction() { return 0.92; }

  get translation() { return this.group.translation; }
  set translation(t) { this.group.translation = t; }

  get rotation() { return this.group.rotation; }

  set rotation(r) {
    this.group.rotation = r;
    if (Math.abs(this.group.rotation) > Math.PI*2) {
      this.group.rotation -= Math.sign(this.group.rotation) * Math.PI*2;
    }
  }

  static clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  static clampV(vector, min, max) {
    vector.x = this.clamp(vector.x, min, max);
    vector.y = this.clamp(vector.y, min, max);
  }

  tick() {
    if (this.stopped) return;

    this.rotation += this.av * kMsPerTick;
    if (Math.abs(this.group.rotation) > Math.PI*2) {
      this.group.rotation -= Math.sign(this.group.rotation) * Math.PI*2;
    }
    this.av *= this.angularFriction;

    let r = this.group.rotation - Math.PI / 2.0
    let a = this.acceleration;

    this.v.addSelf(a.multiplyScalar(kMsPerTick));
    this.v.multiplyScalar(this.friction);
    DynamicObject.clampV(this.v, -Number.MAX_VALUE, Number.MAX_VALUE);

    let deltaP = this.v.clone().multiplyScalar(kMsPerTick);
    this.group.translation.addSelf(deltaP);
  }

  // return x,y components of F/m
  get acceleration() {
    return new Two.Vector(0, 0);
  }
}