'use strict';

class Ship extends DynamicObject {
  constructor(two, x = 0, y = 0) {
    super();
    this.group = this.buildGroup();
    two.add(this.group);
    this.group.translation = new Two.Vector(x, y)
    this.scale = 0.2;

    // the LEM radius (defined below in buildGroup()) is 100px. here we scale it by 0.2, so the LEM is 20px with no zoom.
    // actual LEM radius is about 2 meters, so app units is 10px per meter, or 0.1 meters per px

    this.engineLevel = 0;
    this.v = new Two.Vector(0, 0);
    this.rotation = 0;
  }

  set scale(scale) {
    this.group.scale = scale
    this.group.linewidth = 1 / scale;
  }

  get engineLevel() {
    return this._engine;
  }

  set engineLevel(engineLevel) {
    const maxEngine = 12; // force = level/8*lunarG

    this._engine = DynamicObject.clamp(engineLevel, 0, maxEngine);
    const normalizedEngine = this._engine / maxEngine;

    this.flameTip.y = this.minFlameY + normalizedEngine * (this.maxFlameY - this.minFlameY);
    // set flame color from orange to red as engine level varies
    this.flame.fill = `rgb(255, ${Math.round(255 - (255 - 50) * normalizedEngine)}, 50)`;
  }

  get acceleration() {
    const r = this.group.rotation - Math.PI / 2.0
    const sinR = Math.sin(r);
    const cosR = Math.cos(r);

    const engineAcc = this.engineLevel / -8 * -DynamicObject.gravity;
    const ax = cosR * engineAcc;
    const ay = (sinR * engineAcc) + DynamicObject.gravity; 
    return new Two.Vector(ax, ay);
  }

  // return the ship's hull transformed into world coords
  wcHull() {
    const matrix = this.group.matrix;
    return this.hull.map(v => matrix.multiply(v.x, v.y, 1));
  }

  wcFeet() {
    const matrix = this.group.matrix;
    return this.feet.map(v => matrix.multiply(v.x, v.y, 1));
  }

  landable() {
    const vx = this.v.x;
    const vy = this.v.y;
    const rotation = this.rotation;
    const vxOkay = Math.abs(vx) < 0.007;
    const vyOkay = vy < 0.02;
    const rotationOkay = Math.abs(rotation) < 0.3;
    const allOkay = vxOkay && vyOkay && rotationOkay;
    return { vx, vy, rotation, vxOkay, vyOkay ,rotationOkay, allOkay };
  }

  hitTest(terrain) {
    const terrainInfo = terrain.terrainInfoNear(this.translation);
    if (terrainInfo.distance > 200.0) return 'flying';

    // transform hull and feet to world coords to test against the terrain
    const matrix = this.group.matrix;
    const xform = v => {
      const vworld = matrix.multiply(v.x, v.y, 1)
      return { x: vworld.x, y: vworld.y };
    };
    const hull = this.hull.map(xform);
    const feet = this.feet.map(xform);

    const polygon = terrainInfo.polygon;
    const padPolygon = terrainInfo.padPolygon;

    // land if the ship is landable and one or both feet touch the pad
    if (padPolygon && this.landable().allOkay) {
      if (feet.some(v => polyContainsPoint(padPolygon, v))) {
        return 'landing';
      }
    }

    this.hitAt = hull.find(v => polyContainsPoint(polygon, v))
      || feet.find(v => polyContainsPoint(polygon, v))
      || hull.find(v => polyContainsPoint(padPolygon, v));

    return this.hitAt ? 'crashing' : 'flying';
  }

  land(y) {
    if (this.stopped) return;

    // adjust rotation until zero'd
    if (Math.abs(this.rotation) < 0.005) this.rotation = 0;
    if (this.rotation > 0) this.rotation -= 0.005;
    if (this.rotation < 0) this.rotation += 0.005;

    // adjust engine level until zero'd
    if (this.engineLevel > 0) this.engineLevel -= 1;

    if (this.rotation === 0 && this.engineLevel === 0) {
      // set feet on top of y
      let feet = this.wcFeet();
      const setDown = Math.min(y - feet[0].y, y - feet[1].y) <= 2.0;

      if (setDown) {
        this.v = new Two.Vector(0, 0);
        this.stopped = true;
      } else {
        this.translation = this.translation.addSelf(0, 0.5);
      }
    }
  }

  launch() {
    this.stopped = false;
    this.translation.addSelf({x:0,y:-2})
    this.v.y = -0.1;
  }

  crash () {
    this.group.remove();
    const position = this.hitAt ? this.hitAt : this.translation;
    return new Debris(position, this.v);
  }

  buildGroup() {
    const capsuleRadius = 100;
    const nozzleRadius = 25;
    const nozzleWideRadius = 55;
    const nozzleHeight = 30;      // nozzle radial delta is 30 over a height delta of 30
    const legRadius = 45;
    const legWideRadius = 85;
    const legHeight = 40;         // leg radial delta is 40 over a height delta of 40
    const footRadius = 15;
    const flameInset = 15;
    const maxFlameHeight = 90;

    const capsule = new Two.Polygon(0, 0, capsuleRadius, 16);

    // body
    const bodyTL = new Two.Anchor(capsule._collection[2].x, capsule._collection[2].y);
    const bodyBL = new Two.Anchor(bodyTL.x, capsule._collection[0].y);
    const bodyTR = new Two.Anchor(capsule._collection[13].x, capsule._collection[13].y);
    const bodyBR = new Two.Anchor(bodyTR.x, capsule._collection[15].y);
    const body = new Two.Path([bodyTL, bodyTR, bodyBR, bodyBL], true);

    // the corners of the nozzle
    const nozTL = new Two.Anchor(-nozzleRadius, bodyBL.y);
    const nozTR = new Two.Anchor(nozzleRadius, bodyBR.y);
    const nozBL = new Two.Anchor(-nozzleWideRadius, bodyBL.y + nozzleHeight);
    const nozBR = new Two.Anchor(nozzleWideRadius, bodyBR.y + nozzleHeight);
    const nozzle = new Two.Path([nozTL, nozTR, nozBR, nozBL], true);

    // left foot
    const footTL = new Two.Anchor(-legRadius, bodyBL.y);
    const footBL = new Two.Anchor(-legWideRadius, bodyBL.y + legHeight);
    const footToeL = new Two.Anchor(footBL.x - footRadius, footBL.y);
    footToeL._luniFoot = true;
    const footHeelL = new Two.Anchor(footBL.x + footRadius, footBL.y);
    const leftFoot = new Two.Path([footTL, footBL, footToeL, footHeelL]);

    // right foot
    const footTR = new Two.Anchor(legRadius, bodyBR.y);
    const footBR = new Two.Anchor(legWideRadius, bodyBR.y + legHeight);
    const footToeR = new Two.Anchor(footBR.x + footRadius, footBR.y);
    footToeR._luniFoot = true;
    const footHeelR = new Two.Anchor(footBR.x - footRadius, footBR.y);
    const rightFoot = new Two.Path([footTR, footBR, footToeR, footHeelR]);

    // flame
    this.minFlameY = nozBL.y
    this.maxFlameY = this.minFlameY + maxFlameHeight;
    this.flameTip = new Two.Anchor(0, this.minFlameY);

    const flameTL = new Two.Anchor(nozBL.x + flameInset, this.minFlameY);
    const flameTR = new Two.Anchor(nozBR.x - flameInset, this.minFlameY);
    this.flame = new Two.Path([flameTL, flameTR, this.flameTip, flameTL]);

    // the hull, for hit testing
    const h0 = new Two.Vector(capsule._collection[3].x, capsule._collection[3].y);
    const h1 = new Two.Vector(capsule._collection[5].x, capsule._collection[5].y);
    const h2 = new Two.Vector(capsule._collection[7].x, capsule._collection[7].y);
    const h3 = new Two.Vector(capsule._collection[8].x, capsule._collection[8].y);
    const h4 = new Two.Vector(capsule._collection[10].x, capsule._collection[10].y);
    const h5 = new Two.Vector(capsule._collection[12].x, capsule._collection[12].y);

    this.hull = [bodyBL, h0, h1, h2, h3, h4, h5, bodyBR];
    this.feet = [footToeL, footToeR];

    return (new Two.Group()).add(capsule, body, nozzle, leftFoot, rightFoot, this.flame);
  }
}

//
// Ship debris, for after a crash
//

class Debris {
  constructor(position, v) {
    this.chunks = [];
    for (let i = 0; i < 28; i++) {
      let chunk = new Chunk(v);
      this.chunks.push(chunk);
    }
    this.group = new Two.Group(this.chunks.map(c => c.group));
    this.group.translation = new Two.Vector(position.x, position.y)
  }

  tick() {
    this.chunks = this.chunks.filter(chunk => {
      chunk.tick();
      if (chunk.lifetime <= 0) {
        chunk.group.remove();
        return false;
      }
      return true;
    });
  }
}

class Chunk extends DynamicObject {
  constructor(v) {
    super();
    const sides = 2 + Math.random() * 5;
    const dTheta = Math.PI * 2 / sides;

    let anchors = []
    for (let theta=0; theta<Math.PI*2; theta+= dTheta) {
      let magnitude = 2 + Math.random() * 8;
      let x = Math.cos(theta) * magnitude, y = Math.sin(theta)*magnitude;
      anchors.push(new Two.Anchor(x,y)); 
    }
    this.group = new Two.Path(anchors, true);

    // impart random velocity and spin related to the ships v
    const theta = Math.atan2(v.y, v.x) +  Math.PI * 3/4;
    const randTheta = theta + 0.5 * Math.PI * Math.random();
    const magnitude =  Math.min(Math.max(v.length()*2.0, 0.15), 0.5) * Math.random();

    this.v = new Two.Vector(-Math.cos(randTheta) * magnitude, -Math.sin(randTheta) * magnitude);
    this.av = Math.random() * 0.01;

    this.lifetime = 3000 + 2000 * Math.random();
  }

  get acceleration() {
    return new Two.Vector(0, DynamicObject.gravity);
  }

  tick() {
    super.tick();
    this.lifetime -= kMsPerTick;
  }

  get angularFriction() { return 1; }

}