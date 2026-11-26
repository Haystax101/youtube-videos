// Staging helpers for flat 2D card characters in three.js sets (make-set-video skill, "Characters move like 3D").
// Pulled together from the Darwin's-chair continuity pass so every new set page gets them for free:
//   - walkAlong(): position on a route plus a walk phase driven by DISTANCE, so feet never slide when the walk
//     eases in and out, and the legs stop when the character stops (chars2d/people2d pose.walk = steps taken).
//   - seat anchors: anchorSeat() records where a chair's seat is and which way it faces; seatOn() puts a card on
//     it (just in front of the seat, toward the camera, so the bent legs hang over the edge) and faceCam() turns
//     the chair to the camera, because a flat character can't be seen from behind.
//   - makeSetCheck(): builds window.SETCHECK(t) for tools/set_check.cjs (cards walking through furniture, chairs
//     seen from behind while someone sits in them, moving props hitting things, teleports).
// Import in a set page:  import { walkAlong, anchorSeat, seatOn, faceCam, makeSetCheck } from '/web/lib/stage2d.js';
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// ---------- routes ----------
export function routeLength(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return L; }
// point at fraction k (0..1) of the route's length
export function along(pts, k) {
  let d = clamp(k) * routeLength(pts);
  for (let i = 1; i < pts.length; i++) { const L = pts[i].distanceTo(pts[i - 1]); if (d <= L || i === pts.length - 1) return pts[i - 1].clone().lerp(pts[i], L ? clamp(d / L) : 0); d -= L; }
  return pts[0].clone();
}
// k = 0..1 progress along the route (ease it however you like). step = metres per step at the card's scale.
// Returns { p, walk, dir }: walk is the number of steps taken so far (0 when standing still), dir the heading.
export function walkAlong(pts, k, step = 0.42) {
  const L = routeLength(pts), kk = clamp(k), p = along(pts, kk), ahead = along(pts, Math.min(1, kk + 0.01));
  const dir = ahead.sub(p); dir.y = 0; if (dir.lengthSq() > 1e-9) dir.normalize();
  return { p, walk: kk > 0 && kk < 1 ? Math.max(1e-3, (kk * L) / step) : 0, dir };
}

// ---------- seats ----------
// Call once per chair: seatY = seat height (m, in the chair's local space), front = local direction the seat faces
// (default +z), fwdObj = the part that swivels (for swivel chairs), lift = extra card height when seated.
export function anchorSeat(chairRoot, { seatY = 0.5, front = V(0, 0, 1), fwdObj = null, lift = 0 } = {}) {
  chairRoot.userData.seat = { seatY, front: front.clone().normalize(), lift }; if (fwdObj) chairRoot.userData.fwdObj = fwdObj;
  return chairRoot;
}
// yaw (radians, for chairRoot.rotation.y) that turns the chair's front toward the camera, plus an optional wobble
export function faceCam(chairRoot, camera, wobble = 0) {
  const p = chairRoot.getWorldPosition(V()), d = camera.position.clone().sub(p);
  const f = (chairRoot.userData.seat && chairRoot.userData.seat.front) || V(0, 0, 1);
  return Math.atan2(d.x, d.z) - Math.atan2(f.x, f.z) + wobble;
}
// put card c (an object with .pos in the chair's parent space) on the chair: just in front of the seat toward the
// camera, so the legs hang over the edge; marks c.seatedOn so the set check allows the overlap. Use pose.sit = 1.
export function seatOn(c, chairRoot, camera, fwd = 0.3) {
  const p = chairRoot.getWorldPosition(V()), d = camera.position.clone().sub(p); d.y = 0; d.normalize();
  c.seatedOn = chairRoot; c.pos.copy(chairRoot.position).addScaledVector(d, fwd); c.pos.y = (chairRoot.userData.seat && chairRoot.userData.seat.lift) || 0;
  return c;
}

// ---------- self-check for tools/set_check.cjs ----------
// sets: { name: THREE.Group }, cards: [{ m (card mesh), blob?, pos, G (its set), on, kind, seatedOn? }],
// movers: [Object3D] moving props to test against furniture, render(t): poses everything for time t without
// drawing, shotSet(): name of the set being filmed, fastOK(t): true where fast moves are intended (rewinds).
// Ignores floor-level things (< 7 cm), things above head height (> 1.5 m) and anything bigger than `big` m.
export function makeSetCheck({ sets, cards, movers = [], camera, render, shotSet, fastOK = () => false, cardR = 0.17, big = 3.2, shot = () => window.__shot }) {
  return (t) => {
    render(t);
    const hits = [], filmed = shotSet(), bb = new THREE.Box3();
    for (const [name, G] of Object.entries(sets)) {
      const obs = []; G.updateMatrixWorld(true);
      G.traverse(m => {
        if (!m.isMesh || m.userData.isHull || m.userData.noCheck || cards.some(c => c.m === m || c.blob === m)) return;
        for (let a = m; a && a !== G; a = a.parent) if (!a.visible) return;
        let o = m; while (o.parent && o.parent !== G) o = o.parent;
        bb.setFromObject(m); if (bb.isEmpty()) return; const sz = bb.getSize(V());
        if (bb.max.y < G.position.y + 0.07 || bb.min.y > G.position.y + 1.5 || sz.x > big || sz.z > big) return;
        obs.push({ o, box: bb.clone() });
      });
      const label = o => o.name || new THREE.Box3().setFromObject(o).getCenter(V()).sub(G.position).toArray().map(v => v.toFixed(1)).join(',');
      for (const c of cards) {
        if (c.G !== G || !c.on) continue; const wp = c.pos.clone().add(G.position);
        for (const { o, box } of obs) {
          if (o === c.seatedOn || movers.includes(o) && o === c.carrying) continue;
          const dx = Math.max(box.min.x - wp.x, 0, wp.x - box.max.x), dz = Math.max(box.min.z - wp.z, 0, wp.z - box.max.z);
          if (dx * dx + dz * dz < cardR * cardR && box.min.y < wp.y + 1.2 && box.max.y > wp.y + 0.05) hits.push(`${name}: card ${c.kind} in [${label(o)}]`);
        }
      }
      if (name === filmed) for (const c of cards) {   // a seated flat card faces the camera, so its chair must too
        if (c.G !== G || !c.on || !c.seatedOn) continue; const ch = c.seatedOn, fo = ch.userData.fwdObj || ch;
        const front = (ch.userData.seat && ch.userData.seat.front) || V(0, 0, 1);
        const f = front.clone().applyQuaternion(fo.getWorldQuaternion(new THREE.Quaternion())); f.y = 0; f.normalize();
        const d = camera.position.clone().sub(ch.getWorldPosition(V())); d.y = 0; d.normalize();
        if (f.dot(d) < 0.25) hits.push(`${name}: camera sees the back of ${ch.name || 'a chair'} while ${c.kind} sits in it`);
      }
      for (const m of movers) {
        if (!G.children.includes(m)) continue; const mb = new THREE.Box3().setFromObject(m).expandByScalar(-0.04);
        for (const { o, box } of obs) if (o !== m && mb.intersectsBox(box) && Math.min(mb.max.y, box.max.y) - Math.max(mb.min.y, box.min.y) > 0.06) hits.push(`${name}: ${label(m)} hits [${label(o)}]`);
      }
    }
    return { set: filmed, fastOK: fastOK(t), shot: shot(), hits: [...new Set(hits)],
      cards: cards.filter(c => c.on && c.G === sets[filmed]).map(c => [c.kind + '#' + cards.indexOf(c), c.pos.x, c.pos.y, c.pos.z]) };
  };
}
