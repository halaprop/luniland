'use strict';

const kPathWidth = 2048;
const kPadWidth = 80;
const kPadHeight = 4

class Terrain {

  constructor(two, xPos, width, amplitude, padCount) {
    this.xPos = xPos;
    this.width = width;

    const perlin = perlinPath(xPos, width, amplitude);
    this.stride = perlin.stride;
    this.anchors = perlin.anchors;

    // compute a radius for hit testing form a polygon whose sensitive surface
    // is ~50px in each direction from the terrain point nearest the center of the ship
    this.hitTestRadius = Math.ceil(50/this.stride);

    // close the path with points not in our anchor collection
    const bl = new Two.Anchor(this.anchors[0].x, amplitude * 2);
    const br = new Two.Anchor(this.anchors[this.anchors.length-1].x, amplitude * 2);
    this.path = new Two.Path([...this.anchors, br, bl], true);
    this.path.fill = 'rgb(240,240,240)'

    const group = new Two.Group(this.path);    
    this.createPadsAndHorizon(padCount, group);

    two.add(group);
  }

  indexNear(translation, truncate=Math.floor) {
    const index = truncate((translation.x - this.xPos) / this.stride);
    return Math.max(0, Math.min(this.path.vertices.length-1, index));
  }

  vertexNear(translation) {
    const vertices = this.path.vertices;
    let index = Math.floor((translation.x - this.xPos) / this.stride);
    index = Math.max(0, Math.min(vertices.length-1, index)); // clamp
    return vertices[index];
  }

  createPadsAndHorizon(count, group) {
    const newPad = (x,y) => {
      const shape = new Two.Rectangle(x, y+0.5*kPadHeight, kPadWidth, kPadHeight);
      shape.fill = 'grey';
      shape.stroke = 'yellow'
      return shape;
    }
    const padStride = this.width / (count+1);
    const padWidth2 = kPadWidth/2;
    this.padStride = padStride;

    const anchor0 = this.anchors[0];
    const anchorN = this.anchors[this.anchors.length-1];
    const horizonAnchors = [new Two.Anchor(anchor0.x, anchor0.y)];

    this.pads = [];
    for (let i=0, x = padStride + this.xPos; i<count; i++, x += padStride) {
      let indexL = this.indexNear({ x: x-padWidth2 }, Math.floor);
      let indexR = this.indexNear({ x: x+padWidth2 }, Math.ceil);
      let y =this.vertexNear({ x }).y
      for (let i=indexL; i<=indexR; i++) {
        this.anchors[i].y = y;
        this.anchors[i]._luniPad = true;
      }
      group.add(newPad(x,y));
      let horizonAnchor = new Two.Anchor(x, y);
      horizonAnchors.push(horizonAnchor);
      }
      horizonAnchors.push(new Two.Anchor(anchorN.x, anchorN.y));
      this.horizon = new Two.Path(horizonAnchors, false, true);
      this.horizon.opacity = 0.0; // debug with 0.2;
      group.add(this.horizon);
  }

  // Two.Path.pointAt() produces a point in a normalized progress domain
  // to get a point at x, binary search that domain
  horizonAtX(x) {
    const epsilon = 0.5, maxIterations = 32;
    let iterations = 0, low = 0.0, high = 1.0;
    let center, point;
    while (iterations++ < maxIterations) {
      center = low + (high-low)/2.0;
      point = this.horizon.getPointAt(center);
      let delta = x - point.x;
      if (Math.abs(delta) < epsilon) break;
      if (delta > 0) low = center;
      else if (delta < 0) high = center;
    }
    //debugDraw('p', point, 'red');
    return point;
  }

  terrainInfoNear(translation) {
    const anchors = this.anchors;
    let index = Math.floor((translation.x - this.xPos) / this.stride);
    index = Math.max(0, Math.min(anchors.length-1, index)); // clamp

    const radius = this.hitTestRadius;
    const fromIndex = Math.max(index-radius, 0);
    const toIndex = Math.min(index+radius, anchors.length-1);

    let polygon = [];
    let padPolygon = [];
    let maxY = -Number.MAX_SAFE_INTEGER;
    let minDistance = Number.MAX_SAFE_INTEGER;

    for (let index = fromIndex; index <= toIndex; index++) {
      let anchor = this.anchors[index];
      if (!anchor) continue;

      if (anchor.y > maxY) maxY = anchor.y
      let distance = Two.Vector.distanceBetweenSquared(translation, anchor);
      if (distance < minDistance) minDistance = distance;
      polygon.push(anchor);
      if (anchor._luniPad) padPolygon.push(anchor);
    }

    const closePolygon = polygon => {
      const bl = { x: polygon[0].x, y: maxY + 50 };
      const br = { x: polygon[polygon.length-1].x, y: maxY + 50 };
      polygon.unshift(bl)
      polygon.push(br)
    }

    if (polygon.length) closePolygon(polygon);
    if (padPolygon.length > 3) closePolygon(padPolygon); else padPolygon = [];
    //debugDraw('ter', polygon, 'blue') 

    return { polygon, distance: Math.sqrt(minDistance), padPolygon }
  }
}

//
// Pad for landing
//

class Pad {
  constructor(x, y, width, height) {
    this.center = new Two.Vector(x, y);
    this.width = width;
    this.height = height;

    const shape = new Two.Rectangle(x, y, width, height);
    shape.fill = 'grey';
    shape.stroke = 'yellow'

    this.group = new Two.Group(shape);
  }

  get y() {
    return this.center.y - this.height / 2.0;
  }

}
