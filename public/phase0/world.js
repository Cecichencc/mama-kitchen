// Kitchen Garden Phase 0 — original lightweight, procedural Three.js clay-world assets.
// Presentation only. Physical groceries never live in this module.
import {GROUND_LEVELS,GRASS_MOUNDS,grassSurfaceY,groundedRootY} from './grounding.js';
export const WORLD_COLORS = Object.freeze({
  sky:'#C9EAE6', grass:'#B7D9A8', distantHills:'#B9D5A7', barn:'#E89CB0', house:'#E89CB0', houseRoof:'#D16B84', tomato:'#FF6B5B', tomatoLeaf:'#7CC67A', soil:'#A67C52', white:'#FFFFFF',
  barnRoof:'#D16B84', ivory:'#FFFCF7', cream:'#FFF8EC', flowers:'#F2D98D',
  water:'#91D5DD', text:'#315A50', action:'#EB8068'
});

export function createPastelWorld(THREE, scene) {
  const root = new THREE.Group();
  root.name = 'Kitchen Garden — interactive 3D diorama';
  scene.add(root);
  // Keep the CSS sky/cloud gradient visible through the transparent WebGL canvas.
  scene.fog = new THREE.Fog(WORLD_COLORS.sky, 23, 51);

  const mat = hex => new THREE.MeshStandardMaterial({color:hex,roughness:.91,metalness:0});
  const M = {
    grass:mat(WORLD_COLORS.grass), grassLight:mat('#C9E3B5'), grassDeep:mat('#83B780'),
    hill:mat(WORLD_COLORS.distantHills), hill2:mat('#ADD1B7'),
    island:mat('#BEA77B'), soil:mat('#A67C52'), soilSoft:mat('#BA8A64'),
    path:mat('#FFF1D4'), stone:mat('#E8DEBB'),
    barn:mat(WORLD_COLORS.barn), roof:mat(WORLD_COLORS.barnRoof), barnTrim:mat('#FFF8EC'),
    door:mat('#9C6277'), fence:mat('#FFF9EF'), wood:mat('#B59070'),
    trunk:mat('#92705D'), leaf:mat('#78B386'), leafLight:mat('#9CC99B'),
    leafDark:mat('#5E9D76'), tomato:mat('#FF6B5B'), tomatoLight:mat('#FF8069'),
    stem:mat('#7CC67A'), white:mat('#FFFFFF'), eye:mat('#36504B'),
    coral:mat('#E87867'), yellow:mat('#F6BD70'), flower:mat(WORLD_COLORS.flowers),
    flowerPink:mat('#F7D0CD'), water:mat(WORLD_COLORS.water)
  };
  // One tiny reusable alpha texture makes gentle, *tight* ground-contact
  // occlusion. It supplements real shadow maps instead of offset opaque discs.
  // The canvas/texture is shared by every object; no expensive AO pass needed.
  const shadowCanvas=document.createElement('canvas');
  shadowCanvas.width=shadowCanvas.height=64;
  const shadowCtx=shadowCanvas.getContext('2d');
  let contactGeometry=null,contactMaterial=null;
  if(shadowCtx){
    const g=shadowCtx.createRadialGradient(32,32,2,32,32,31);
    g.addColorStop(0,'rgba(55,69,50,0.20)');
    g.addColorStop(.38,'rgba(55,69,50,0.12)');
    g.addColorStop(.75,'rgba(55,69,50,0.035)');
    g.addColorStop(1,'rgba(55,69,50,0)');
    shadowCtx.fillStyle=g;shadowCtx.fillRect(0,0,64,64);
    const texture=new THREE.CanvasTexture(shadowCanvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    contactGeometry=new THREE.PlaneGeometry(2,2);
    contactMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  }
  function contactShadow(x,y,z,rx,rz){
    if(!contactGeometry)return;
    const plane=new THREE.Mesh(contactGeometry,contactMaterial);
    plane.name='Grounded contact shadow (cosmetic)';
    plane.position.set(x,y+0.006,z);
    plane.rotation.x=-Math.PI/2;
    plane.scale.set(rx,rz,1);
    plane.castShadow=false;
    plane.receiveShadow=false;
    plane.renderOrder=1;
    root.add(plane);
  }
  const sphereGeom = new THREE.SphereGeometry(1,16,12);
  const boxGeomCache = new Map();
  const cylGeomCache = new Map();
  function mesh(geom, material, parent=root, x=0,y=0,z=0, cast=true) {
    const m = new THREE.Mesh(geom,material);
    m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
  }
  function sphere(r,material,parent=root,x=0,y=0,z=0,sx=1,sy=1,sz=1){
    const s=mesh(sphereGeom,material,parent,x,y,z);
    s.scale.set(r*sx,r*sy,r*sz);return s;
  }
  function box(w,h,d,material,parent=root,x=0,y=0,z=0){
    const key=[w,h,d].join('|');let g=boxGeomCache.get(key);
    if(!g){g=new THREE.BoxGeometry(w,h,d);boxGeomCache.set(key,g);}
    return mesh(g,material,parent,x,y,z);
  }
  function cyl(top,bottom,height,material,parent=root,x=0,y=0,z=0,sides=10){
    const key=[top,bottom,height,sides].join('|');let g=cylGeomCache.get(key);
    if(!g){g=new THREE.CylinderGeometry(top,bottom,height,sides);cylGeomCache.set(key,g);}
    return mesh(g,material,parent,x,y,z);
  }
  function roundedShape(w,h,r){
    const s=new THREE.Shape();const x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
  }
  function roundedPlatform(w,d,depth,material,x,y,z,rad=.8) {
    const geo=new THREE.ExtrudeGeometry(roundedShape(w,d,rad),{
      depth,steps:1,bevelEnabled:true,bevelSize:.1,bevelThickness:.09,bevelSegments:2,curveSegments:6
    });geo.rotateX(-Math.PI/2);
    return mesh(geo,material,root,x,y,z);
  }
  function softBox(w,h,d,material,parent,x=0,y=0,z=0) {
    const geometry=new THREE.ExtrudeGeometry(roundedShape(w,h,Math.min(.12,w/6,h/6)),{
      depth:d-.07,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1,curveSegments:4
    });geometry.translate(0,0,-(d-.07)/2);
    return mesh(geometry,material,parent,x,y,z);
  }

  // Atmospheric hills are genuine distant meshes. They are never selectable.
  for(const [x,z,sx,sy,sz,m] of [[-8,-10,5,2.7,2,M.hill],[1,-13,7,3.1,2,M.hill2],[9,-10,5.5,2.5,1.8,M.hill]]){
    const hill=sphere(1,m,root,x,-1.48,z,sx,sy,sz);hill.castShadow=false;hill.receiveShadow=false;
  }

  // Softly beveled miniature island. Surface y=GROUND_LEVELS.grass.
  const earthBase=roundedPlatform(8.28,6.58,.55,M.island,0,-.58,0,1.32);
  const grassTop=roundedPlatform(8.22,6.52,.22,M.grass,0,.12,0,1.32);
  earthBase.castShadow=false; // never throw a giant offset shadow on the ground
  grassTop.castShadow=false;
  grassTop.receiveShadow=true;
  // Rounded hillside mounds around the back, visible from an isometric camera.
  for(const mound of GRASS_MOUNDS){
    const m=sphere(1,M.grassLight,root,mound.x,mound.y,mound.z,mound.rx,mound.ry,mound.rz);
    m.castShadow=false;m.receiveShadow=true;
  }

  // Winding cream stepping stones connect barn, vegetables and chicken companion.
  const steps=[[-.05,-.8],[.15,-.42],[.33,-.05],[.33,.38],[.44,.82],[.76,1.21],[1.00,1.49],[1.25,1.64]];
  for(let i=0;i<steps.length;i++){
    const [x,z]=steps[i];const stone=sphere(.22,i%3===0?M.stone:M.path,root,x,.42,z,1.20,.20,.78);
    stone.rotation.y=(i%4-.5)*.16;stone.castShadow=false;
  }

  // Vegetable patch receives actual directional shadows at the soil surface.
  const tomatoBed=roundedPlatform(3.08,2.02,.12,M.soil,-1.55,.41,1.12,.34);
  tomatoBed.receiveShadow=true;
  for(let k=0;k<3;k++){
    const furrow=softBox(.06,.035,1.66,M.soilSoft,root,-2.55+k*.95,.58,1.13);
    furrow.castShadow=false;
  }
  function fenceLine(x0,z0,x1,z1,n=6){
    for(let i=0;i<n;i++){
      const t=i/(n-1);const x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;
      const post=softBox(.105,.40,.11,M.fence,root,x,.64,z);post.castShadow=false;
    }
    const dx=x1-x0,dz=z1-z0;
    const rail=softBox(Math.hypot(dx,dz),.078,.082,M.fence,root,(x0+x1)/2,.62,(z0+z1)/2);
    rail.rotation.y=-Math.atan2(dz,dx);rail.castShadow=false;
  }
  fenceLine(-3.08,.02,-.06,.02,7);
  fenceLine(-3.08,2.22,-.40,2.22,6);
  fenceLine(-3.13,.15,-3.13,2.03,5);

  // Pink farmhouse: actual extruded gable, beveled pitched roof and modeled doors/windows.
  const house=new THREE.Group(); house.name='Farmhouse';root.add(house);
  // Wall bevel extends 0.035 beyond the wall's rectangular bounds.
  house.position.set(1.58,groundedRootY(GROUND_LEVELS.grass,.68-1.27/2-.035),-1.12);
  contactShadow(1.58,GROUND_LEVELS.grass,-1.12,.97,.80);
  const w=1.65,depth=1.47,wallY=1.30,ridgeY=1.95;
  softBox(w,1.27,depth,M.barn,house,0,.68,0);
  const gable=new THREE.Shape();
  gable.moveTo(-w/2,0);gable.lineTo(0,ridgeY-wallY);gable.lineTo(w/2,0);gable.closePath();
  const gableGeo=new THREE.ExtrudeGeometry(gable,{depth:depth-.04,steps:1,bevelEnabled:false});
  gableGeo.translate(0,0,-(depth-.04)/2);mesh(gableGeo,M.barn,house,0,wallY,0);
  const slope=Math.atan2(ridgeY-wallY,w/2);
  for(const side of [-1,1]){
    const roof=softBox(Math.hypot(w/2+.16,ridgeY-wallY+.05),.15,depth+.24,M.roof,house,side*(w/4+.05),(wallY+ridgeY)/2,0);
    roof.rotation.z=side===-1?slope:-slope;
  }
  // Rounded arched door relief, not a painted facade.
  function archPanel(width,height,z,material){
    const radius=width/2,sh=new THREE.Shape();
    sh.moveTo(-radius,0);sh.lineTo(-radius,height-radius);
    sh.absarc(0,height-radius,radius,Math.PI,0,true);sh.lineTo(radius,0);sh.closePath();
    return mesh(new THREE.ExtrudeGeometry(sh,{depth:.07,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:10}),material,house,0,.03,z);
  }
  archPanel(.65,.97,depth/2+.015,M.barnTrim);
  archPanel(.53,.85,depth/2+.095,M.door);
  box(.05,.73,.05,M.barnTrim,house,0,.47,depth/2+.18);
  box(.47,.06,.05,M.barnTrim,house,0,.46,depth/2+.18);
  mesh(new THREE.TorusGeometry(.165,.04,8,20),M.barnTrim,house,0,1.50,depth/2+.028);
  sphere(.115,M.water,house,0,1.50,depth/2+.018,1,1,.20);
  box(.035,.28,.04,M.barnTrim,house,0,1.50,depth/2+.09);
  box(.27,.036,.04,M.barnTrim,house,0,1.50,depth/2+.09);
  const sideFrame=softBox(.52,.45,.06,M.barnTrim,house,w/2+.045,.87,-.10);
  sideFrame.rotation.y=Math.PI/2;
  const sidePane=softBox(.40,.32,.07,M.water,house,w/2+.095,.87,-.10);
  sidePane.rotation.y=Math.PI/2;
  box(.05,.38,.05,M.barnTrim,house,w/2+.15,.87,-.10);
  box(.05,.05,.40,M.barnTrim,house,w/2+.15,.87,-.10);
  softBox(.28,.39,.30,M.barn,house,.39,1.91,-.31);
  softBox(.34,.09,.36,M.roof,house,.39,2.15,-.31);

  // Rounded trees are modest in height to avoid occluding the island on iPhone.
  function tree(x,z,size=1,variation=0){
    const g=new THREE.Group();root.add(g);
    // Ellipsoid hills rise above the grass plate: place trunk feet on the true
    // local surface, not on the flat platform far below the visible hill.
    const footY=grassSurfaceY(x,z);
    g.position.set(x,groundedRootY(footY,.45-.87/2,size),z);g.scale.setScalar(size);
    contactShadow(x,footY,z,.22*size,.19*size);
    cyl(.13,.18,.87,M.trunk,g,0,.45,0);
    sphere(.54,[M.leaf,M.leafLight][variation%2],g,0,1.18,0,1.06,1.02,1.06);
    sphere(.23,M.leafLight,g,-.31,1.13,.12);
    sphere(.20,M.leafDark,g,.32,1.04,-.14);
    return g;
  }
  tree(-3.05,-1.72,.89);tree(3.25,-1.78,.75,1);tree(3.22,.78,.67);

  // Soil-resting collectible tomato asset: no stalks or tall tomato plants.
  function tomato(r=.25,material=M.tomato){
    const group=new THREE.Group();group.name='Reusable Tomato';
    sphere(r,material,group,0,0,0,1.07,.87,1.03);
    for(let i=0;i<5;i++){
      const a=i*2*Math.PI/5;
      const leaf=sphere(r*.41,M.stem,group,Math.cos(a)*r*.38,r*.79,Math.sin(a)*r*.38,1.25,.22,.69);
      leaf.rotation.y=-a;
    }
    cyl(r*.10,r*.11,r*.19,M.stem,group,0,r*.87,0,8);
    return group;
  }
  const tomatoSpots=[[-2.43,.94,.25],[-1.55,1.10,.32],[-.68,1.06,.28],[-2.19,1.65,.21],[-.89,1.65,.235]];
  const fruits=tomatoSpots.map(([x,z,r],i)=>{
    const g=tomato(r,i%2?M.tomatoLight:M.tomato);
    // Body's lowest point is radius*0.87; sink it just 0.012 into soil.
    g.position.set(x,groundedRootY(GROUND_LEVELS.tomatoSoil,-r*.87),z);
    g.rotation.y=(i%3-1)*.27;root.add(g);
    contactShadow(x,GROUND_LEVELS.tomatoSoil,z,r*.95,r*.87);return g;
  });
  const colliders=fruits.map((f,i)=>{
    const c=new THREE.Mesh(new THREE.SphereGeometry(.42+(i===1?.08:0),12,9),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
    c.position.copy(f.position);c.userData.ingredient='tomato';c.userData.fruitIndex=i;root.add(c);return c;
  });
  for(const [x,z] of [[-2.9,1.46],[-1.8,1.1],[-.40,1.52],[-2.8,.8]]){
    for(const a of [0,2.09,4.18]){const l=sphere(.10,M.leaf,root,x+Math.cos(a)*.10,.56,z+Math.sin(a)*.10,1,.3,.8);l.rotation.y=-a;}
  }

  // Articulated three-view coherent chicken: pear body, rounded head, wings and feet.
  const hen=new THREE.Group();hen.name='White chicken companion';root.add(hen);
  // Keep the feet rooted: only the head/wings breathe, never animate the
  // entire body vertically (that previously lifted contact shadows).
  const henGround=grassSurfaceY(2.46,1.28);
  hen.position.set(2.46,groundedRootY(henGround,.06-.068*.50,.76),1.28);hen.scale.setScalar(.76);
  contactShadow(2.46,henGround,1.28,.36,.27);
  sphere(.35,M.white,hen,0,.42,0,1.0,1.10,.96);
  const head=new THREE.Group();hen.add(head);head.position.set(0,.77,.12);
  sphere(.25,M.white,head);
  const wings=[sphere(.17,M.white,hen,-.33,.44,.04,.60,.91,1.12),sphere(.17,M.white,hen,.33,.44,.04,.60,.91,1.12)];
  sphere(.14,M.white,hen,0,.42,-.33,.78,1,.84);
  for(const xx of [-.17,.17])sphere(.068,M.yellow,hen,xx,.06,.11,1.08,.50,1.38);
  for(const [xx,yy] of [[-.10,.26],[0,.32],[.10,.26]])sphere(.075,M.coral,head,xx,yy,-.03,1,1,.82);
  sphere(.055,M.coral,head,0,-.10,.24,.82,1.12,.77);
  const beak=mesh(new THREE.ConeGeometry(.115,.20,8),M.yellow,head,0,-.09,.28);beak.rotation.x=Math.PI/2;
  const eyes=[sphere(.041,M.eye,head,-.108,.018,.22,1,1,.65),sphere(.041,M.eye,head,.108,.018,.22,1,1,.65)];

  // Small wooden tomato crate, rooted to the flat grass and containing
  // decorative miniature fruits. It never represents physical grocery stock.
  const crate=new THREE.Group();crate.name='Decorative tomato crate';root.add(crate);
  crate.position.set(3.18,groundedRootY(GROUND_LEVELS.grass,.14-.24/2-.035),1.27);
  contactShadow(3.18,GROUND_LEVELS.grass,1.27,.46,.34);
  softBox(.72,.24,.52,M.wood,crate,0,.14,0);
  for(const x of [-.30,.30])softBox(.055,.23,.58,M.trunk,crate,x,.17,0);
  for(const z of [-.22,.22])softBox(.73,.065,.055,M.trunk,crate,0,.23,z);
  for(const [x,z] of [[-.19,-.07],[.07,.10],[.18,-.10]]){
    const fruit=tomato(.105,M.tomato);fruit.position.set(x,.29,z);crate.add(fruit);
  }

  // Phase 1 egg resource: a small, actually three-dimensional nest by the hen.
  // Eggs represent eligible household stock; this is NOT a biological growth timer.
  const nest=new THREE.Group();nest.name='Chicken coop egg resource';root.add(nest);
  const nestX=2.45,nestZ=2.17;
  const nestY=grassSurfaceY(nestX,nestZ);
  nest.position.set(nestX,nestY,nestZ);
  const nestBase=cyl(.39,.41,.13,M.wood,nest,0,.066,0,12);
  nestBase.castShadow=true;
  const nestRim=mesh(new THREE.TorusGeometry(.32,.075,8,20),M.trunk,nest,0,.16,0);
  nestRim.rotation.x=-Math.PI/2;
  contactShadow(nestX,nestY,nestZ,.47,.36);
  const eggs=[[-.17,-.035],[.14,-.045],[0,.15]].map(([x,z])=>{
    const egg=new THREE.Group();egg.name='Harvestable egg';
    sphere(.17,M.cream,egg,0,0,0,.75,1.1,.83);
    egg.position.set(x,.28,z);nest.add(egg);return egg;
  });
  const eggCollider=new THREE.Mesh(
    new THREE.SphereGeometry(.50,12,9),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false})
  );
  eggCollider.position.set(nestX,nestY+.26,nestZ);
  eggCollider.userData.ingredient='egg';eggCollider.userData.fruitIndex=0;
  root.add(eggCollider);
  colliders.push(eggCollider);

  // Restock markers are actual 3D meshes. The invisible ingredient colliders
  // remain usable when stock is zero, and the UI handles the grocery form.
  function restockMarker(x,y,z,label){
    const group=new THREE.Group();group.name=label+' empty-plot restock marker';
    group.position.set(x,y,z);root.add(group);
    const ring=mesh(new THREE.TorusGeometry(.24,.043,10,28),M.leaf,group,0,.025,0);
    ring.rotation.x=-Math.PI/2;ring.castShadow=false;
    const disc=mesh(new THREE.CylinderGeometry(.215,.215,.035,24),M.cream,group,0,.018,0);
    disc.castShadow=false;
    const plusMat=new THREE.MeshStandardMaterial({color:'#2F7D46',roughness:.91,metalness:0});
    for(const [w,d] of [[.23,.052],[.052,.23]]){
      const bar=mesh(new THREE.BoxGeometry(w,.018,d),plusMat,group,0,.055,0);
      bar.castShadow=false;
    }
    group.userData.isRestockMarker=true;
    return group;
  }
  const restockMarkers={
    tomato:restockMarker(-1.70,GROUND_LEVELS.tomatoSoil+.055,1.03,'Tomato'),
    egg:restockMarker(nestX,nestY+.21,nestZ,'Egg')
  };
  restockMarkers.tomato.visible=false;restockMarkers.egg.visible=false;
  // Large invisible hit volumes make the empty-plot + easy to tap on phones.
  for(const id of ['tomato','egg']){
    const p=restockMarkers[id].position;
    const hit=new THREE.Mesh(new THREE.SphereGeometry(.47,12,9),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
    hit.position.copy(p);hit.userData.ingredient=id;hit.userData.fruitIndex=0;
    root.add(hit);colliders.push(hit);
  }

  // Presentation derives from available physical stock after any basket holds.
  // Keep colliders active even if the visual resource is empty, so tapping can
  // open a useful restock action. Decorative crate fruit is never an ingredient.
  const available={tomato:0,egg:0};
  const harvestEffect={tomato:-100,egg:-100};
  let latestElapsed=0;
  function setAvailability(counts){
    for(const id of ['tomato','egg']) {
      const num=Number(counts[id]??0);
      const next=Number.isFinite(num)?Math.max(0,num):0;
      // Newly restocked resources gently reappear; this never generates stock.
      if(available[id]===0&&next>0)harvestEffect[id]=latestElapsed-.45;
      available[id]=next;
      restockMarkers[id].visible=next===0;
    }
  }
  function playHarvest(id){if(id==='tomato'||id==='egg')harvestEffect[id]=latestElapsed;}
  function resourceFactor(id,elapsed,reduced){
    if(available[id]===0)return 0;
    const elapsedSince=elapsed-harvestEffect[id];
    if(reduced)return 1;
    if(elapsedSince>=0&&elapsedSince<.45)return 0;
    if(elapsedSince>=.45&&elapsedSince<1.05){
      const t=Math.min(1,(elapsedSince-.45)/.6);
      return .22+.78*(1-(1-t)**3);
    }
    return 1;
  }

  // Decorations: small grass clumps, limited flower stems and little stones.
  const positions=Array.from({length:30},(_,i)=>{
    const x=-3.6+((i*41)%97)/97*7.2,z=-2.79+((i*31)%89)/89*5.58;
    return [x,z];
  }).filter(([x,z])=> !((x>-3.15&&x<.1&&z>-.15&&z<2.35)||(x>.5&&x<2.8&&z>-.8&&z<1.9)));
  positions.forEach(([x,z],i)=>{
    const grass=new THREE.Group();root.add(grass);grass.position.set(x,.40,z);
    for(let j=-1;j<=1;j++){
      const tuft=sphere(.09,j===0?M.leaf:M.grassDeep,grass,j*.11,.09,0,.68,1.55,.45);
      tuft.castShadow=false; // dozens of tiny shadows add noise, not grounding
    }
    if(i%3===0){
      for(let k=0;k<5;k++){
        const a=k*2*Math.PI/5;
        const petal=sphere(.069,M.white,root,x+Math.cos(a)*.074,.455,z+Math.sin(a)*.074,1,.35,.78);
        petal.rotation.y=-a;petal.castShadow=false;
      }
      sphere(.043,M.yellow,root,x,.455,z,1,.5,1).castShadow=false;
    }
  });
  for(let i=0;i<12;i++){
    const x=2.2+((i*17)%41)/41*1.5,z=-.27+((i*11)%37)/37*1.3;
    sphere(.115,M.stone,root,x,.43,z,1,.47,.72).castShadow=false;
  }

  function update(elapsed,reduced,focused,selectedIndex=1,selectedIngredient='tomato'){
    latestElapsed=elapsed;
    head.position.y=.77+(reduced?0:Math.sin(elapsed*1.7)*.006);
    head.rotation.z=reduced?0:Math.sin(elapsed*.7)*.04;
    const blink=!reduced&&Math.sin(elapsed*.72)>0.992?.16:1;
    eyes.forEach(e=>{e.scale.y=.041*blink;});
    wings.forEach((w,i)=>{w.rotation.z=reduced?0:(i?1:-1)*Math.sin(elapsed*1.2)*.04;});
    const tomatoFactor=resourceFactor('tomato',elapsed,reduced);
    fruits.forEach((fruit,i)=>{
      fruit.rotation.y=(i%3-1)*.27+(reduced?0:Math.sin(elapsed*.9+i)*.015);
      fruit.visible=tomatoFactor>0;
      fruit.scale.setScalar(tomatoFactor*(i===selectedIndex&&focused&&selectedIngredient==='tomato'?1.045:1));
    });
    const eggFactor=resourceFactor('egg',elapsed,reduced);
    eggs.forEach(egg=>{egg.visible=eggFactor>0;egg.scale.setScalar(eggFactor);});
  }
  
  return {root,colliders,fruitPositions:fruits.map(f=>f.position.clone()),resourcePositions:{tomato:fruits.map(f=>f.position.clone()),egg:[eggCollider.position.clone()]},setAvailability,playHarvest,update,assets:{island:root,tomato:fruits[1],eggs,nest,house,chicken:hen,restockMarkers}};
}
