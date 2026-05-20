(function(){
  function makeRoundedRectPath(x,y,w,h,r){
    return `M ${x+r} ${y} H ${x+w-r} A ${r} ${r} 0 0 1 ${x+w} ${y+r} V ${y+h-r} A ${r} ${r} 0 0 1 ${x+w-r} ${y+h} H ${x+r} A ${r} ${r} 0 0 1 ${x} ${y+h-r} V ${y+r} A ${r} ${r} 0 0 1 ${x+r} ${y} Z`;
  }

  function updateAuthOrbits(){
    document.querySelectorAll('.auth-container').forEach(container => {
      const orbit = container.querySelector('.auth-orbit');
      if(!orbit) return;
      const svg = orbit.querySelector('.auth-orbit-svg');
      const img = svg && (svg.querySelector('.auth-orbit-img') || svg.querySelector('.auth-orbit-dot'));
      if(!svg || !img) return;

      const rect = svg.getBoundingClientRect();
      const w = Math.max(20, Math.round(rect.width));
      const h = Math.max(20, Math.round(rect.height));
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      const cs = window.getComputedStyle(container);
      let br = cs.borderRadius || '20px';
      let r = parseFloat(br);
      if(!r || isNaN(r)) r = Math.min(w,h)/12;
      r = Math.min(r, Math.min(w,h)/2 - 2);

      const pad = 6; // inner padding so path isn't clipped
      const x = pad;
      const y = pad;
      const W = Math.max(0, w - pad*2);
      const H = Math.max(0, h - pad*2);
      const R = Math.min(r, Math.min(W,H)/2);

      const d = makeRoundedRectPath(x,y,W,H,R);

      let path = svg.querySelector('path.authOrbitPath');
      if(!path){
        path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.classList.add('authOrbitPath');
        path.setAttribute('fill','none');
        path.setAttribute('stroke','rgba(255,140,0,0.12)');
        path.setAttribute('stroke-width','1.2');
        svg.insertBefore(path, svg.firstChild);
      }
      // ensure unique id per instance
      if(!path.id) path.id = 'authOrbitPath-' + Math.random().toString(36).slice(2,9);
      path.setAttribute('d', d);

      // configure moving element (image or legacy circle)
      const moveEl = img;
      const minDim = Math.min(W, H);
      const desired = Math.round(Math.min(48, Math.max(12, Math.floor(minDim * 0.07))));
      if(moveEl.tagName.toLowerCase() === 'image' || moveEl.tagName.toLowerCase() === 'svgimage'){
        moveEl.setAttribute('width', desired);
        moveEl.setAttribute('height', desired);
        // center the image on the motion path point
        moveEl.setAttribute('x', -desired/2);
        moveEl.setAttribute('y', -desired/2);
      } else {
        // legacy circle: adjust radius
        moveEl.setAttribute('r', Math.max(1.2, desired/6));
      }

      // create or restart a JS-driven animator per orbit to control snapping rotation
      // stop previous animator if present
      if(orbit._animator && typeof orbit._animator.stop === 'function'){
        orbit._animator.stop();
      }

      // ensure the moveEl is hidden until positioned to avoid corner artifact
      try{ moveEl.setAttribute('visibility','hidden'); } catch(e){}

      // Animator: moves element along path using getPointAtLength and RAF
      class OrbitAnimator {
        constructor(pathEl, el, durationSec){
          this.path = pathEl;
          this.el = el;
          this.duration = (durationSec || 8) * 1000;
          this.len = Math.max(1, this.path.getTotalLength());
          this._running = true;
          this._start = performance.now();
          this._desired = desired;
          this.frame = this.frame.bind(this);
          requestAnimationFrame(this.frame);
        }
        stop(){ this._running = false; }
        frame(now){
          if(!this._running) return;
          const t = ((now - this._start) % this.duration) / this.duration;
          const dist = t * this.len;
          const p = this.path.getPointAtLength(dist);
          const delta = Math.max(1, this.len * 0.001);
          const p1 = this.path.getPointAtLength((dist + delta) % this.len);
          const p0 = this.path.getPointAtLength((dist - delta + this.len) % this.len);
          const tx = p1.x - p0.x;
          const ty = p1.y - p0.y;
          let angle = Math.atan2(ty, tx) * 180 / Math.PI;
          // snap to nearest 90deg to rotate at corners
          const snapped = Math.round(angle / 90) * 90;

          // apply transform: translate to path point, rotate, then center image
          const cx = p.x;
          const cy = p.y;
          const trans = `translate(${cx} ${cy}) rotate(${snapped}) translate(${ -this._desired/2 } ${ -this._desired/2 })`;
          try{ this.el.setAttribute('transform', trans); this.el.setAttribute('visibility','visible'); } catch(e){}

          requestAnimationFrame(this.frame);
        }
      }

      orbit._animator = new OrbitAnimator(path, moveEl, 8);
    });
  }

  let resizeTimer = null;
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthOrbits();
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateAuthOrbits, 120);
    });
  });
})();
