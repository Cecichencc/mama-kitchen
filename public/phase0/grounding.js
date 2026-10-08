// Shared, numeric ground-contact contract for the procedural Phase 0 diorama.
// A roundedPlatform extrudes upward and adds 0.09 units of bevel thickness.
// This is presentation geometry only: it never reads or mutates household stock.
export const GROUND_LEVELS = Object.freeze({
  grass: 0.12 + 0.22 + 0.09,
  tomatoSoil: 0.41 + 0.12 + 0.09,
});

// Visible grassy mounds use ellipsoid geometry, not level platforms. Their
// surfaces must be considered before placing tree trunks and contact shadows.
export const GRASS_MOUNDS = Object.freeze([
  Object.freeze({x:-3.3, z:-2.25, y:0.30, rx:1.05, ry:0.45, rz:1.05}),
  Object.freeze({x: 3.15,z:-2.0,  y:0.30, rx:1.18, ry:0.50, rz:1.15}),
  Object.freeze({x:-0.10,z:-2.63, y:0.30, rx:1.00, ry:0.32, rz:0.60}),
]);

export function grassSurfaceY(x,z) {
  let y=GROUND_LEVELS.grass;
  for (const mound of GRASS_MOUNDS) {
    const dx=(x-mound.x)/mound.rx;
    const dz=(z-mound.z)/mound.rz;
    const radial=dx*dx+dz*dz;
    if (radial < 1) y=Math.max(y,mound.y+mound.ry*Math.sqrt(1-radial));
  }
  return y;
}

/** Position a model root so its scaled lowest solid point meets terrain.
 * `embed` is a deliberately tiny penetration, avoiding a bright seam.
 */
export function groundedRootY(surfaceY,localLowestY,scale=1,embed=0.012){
  return surfaceY-localLowestY*scale-embed;
}
