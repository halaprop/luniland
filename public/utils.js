
// simplified underscore debounce
function debounce(func, wait) {
  let timeout, previous;

  const now = () => new Date().getTime();
  const later = () => {
    let passed = now() - previous;
    if (wait > passed) {
      timeout = setTimeout(later, wait - passed);
    } else {
      timeout = null;
      func.apply(this);
    }
  };

  const debounced = () => {
    previous = now();
    if (!timeout) timeout = setTimeout(later, wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = null
  };
  return debounced;
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
function polyContainsPoint(poly=[], point) {
  for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
    ((poly[i].y <= point.y && point.y < poly[j].y) || (poly[j].y <= point.y && point.y < poly[i].y))
      && (point.x < (poly[j].x - poly[i].x) * (point.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
      && (c = !c);
  return c;
}

const seed = new Math.seedrandom(new Date().getTime());

function randomAnchors(xPos, stride, samples, amplitude) {
  const rand = () => seed() - 0.5;
  let anchors = [];
  for (let i = 0, x = xPos; i < samples; i++, x += stride) {
    let anchor = new Two.Anchor(x, rand() * amplitude);
    anchors.push(anchor)
  }
  return anchors;
}

function perlinPath(xPos, width, amplitude, octaves=4) {
  let samples = Math.round(width / 256);

  let stride;
  let paths = [];
  for (let octave = 0; octave < octaves; octave++) {
    amplitude /= Math.pow(2, octave);
    samples *= Math.pow(2, octave);
    stride = width / samples;

    let anchors = randomAnchors(xPos, stride, samples, amplitude);
    paths.push(new Two.Path(anchors, false, true));
  }

  let anchors = [];
  for (let i = 0, x = xPos; i < samples; i++, x += stride) {
    let u = i / samples; // normalized position
    let sumY = paths.reduce((acc, p) => {
      let point = p.getPointAt(u);
      return acc + point.y
    }, 0);
    let anchor = new Two.Anchor(x, sumY);
    anchors.push(anchor)
  }
  return { anchors, stride }
}

let debugShapes = {};

function debugDraw(id, points, color, opacity=0.2) {
  let obj;
  if (Array.isArray(points)) {
    let anchors = points.map(p => new Two.Anchor(p.x,p.y));
    obj = new Two.Path(anchors, true);
  } else {
    obj = new Two.Circle(points.x, points.y, 4);
  }
  obj.fill = color;
  obj.opacity = opacity;
  debugShapes[id]?.remove();
  debugShapes[id] = obj;
  luniTwo.two.add(obj);
}

class Label {
  constructor(id, options={}) {
    this.div = document.getElementById(id);
    this.labelDiv = this.div.getElementsByClassName('lg-label')[0] || this.div;
    this.valueDiv = this.div.getElementsByClassName('lg-value')[0];
    this.signDiv = this.div.getElementsByClassName('lg-sign')[0];

    this.plusSign = options.plusSign || '+';
    this.minusSign = options.minusSign || '-';
    this.roundTo = options.roundTo === undefined ? 2 : options.roundTo;
    
    if (options.label) this.labelDiv.innerHTML = options.label;
    this.theme = options.theme;
  }

  set theme(theme) {
    this._theme = theme;
    this.div.style.color = theme.label.color;
  }

  get theme() {
    return this._theme;
  }

  setLabel(text) {
    this.labelDiv.innerText = text;
  }

  setNumber(number, nominal=true) {
    if (this.signDiv) {
      this.valueDiv.innerText = Math.abs(number).toFixed(this.roundTo);
      this.signDiv.innerText = number > 0 ? this.plusSign : this.minusSign;
    } else {
      this.valueDiv.innerText = number.toFixed(this.roundTo);
    }
    this.div.style.color = nominal ? this.theme.label.color : this.theme.label.danger;
  }

  showHTML(html, hideAfter=null) {
    clearTimeout(this.timer);
    this.div.style.opacity = 1.0;
    this.labelDiv.innerHTML = html;
    if (hideAfter) this.hideHTML(hideAfter);
  }

  // after delay ms, set opacity to 0 tweening for duration ms (gsap time unit is seconds)
  hideHTML(delay, duration=500) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      gsap.to(this.div.style, { opacity: 0, duration: duration/1000, ease: 'power.in' });
    }, delay);
  }

}