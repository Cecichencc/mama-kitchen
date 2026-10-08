// Kitchen Garden Phase 0 — original lightweight, procedural Three.js clay-world assets.
// Presentation only. Physical groceries never live in this module.
export const WORLD_COLORS = Object.freeze({
  sky:'#C9EAE6', grass:'#A8C896', distantHills:'#B9D5A7', barn:'#DB91A6',
  barnRoof:'#BD758F', ivory:'#FFFCF7', cream:'#FAF5EA', flowers:'#F2D98D',
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
    grass:mat(WORLD_COLORS.grass), grassLight:mat('#C5DBA9'), grassDeep:mat('#83B780'),
    hill:mat(WORLD_COLORS.distantHills), hill2:mat('#ADD1B7'),
    island:mat('#BEA77B'), soil:mat('#9E7358'), soilSoft:mat('#BA8A64'),
    path:mat('#FFF1D4'), stone:mat('#E8DEBB'),
    barn:mat(WORLD_COLORS.barn), roof:mat(WORLD_COLORS.barnRoof), barnTrim:mat('#FFEFE5'),
    door:mat('#9C6277'), fence:mat('#F4E9D4'), wood:mat('#B59070'),
    trunk:mat('#92705D'), leaf:mat('#78B386'), leafLight:mat('#9CC99B'),
    leafDark:mat('#5E9D76'), tomato:mat('#E85A4D'), tomatoLight:mat('#F2745B'),
    stem:mat('#4D986F'), white:mat('#FFFBF3'), eye:mat('#36504B'),
    coral:mat('#E87867'), yellow:mat('#F6BD70'), flower:mat(WORLD_COLORS.flowers),
    flowerPink:mat('#F7D0CD'), water:mat(WORLD_COLORS.water)
  };
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

  // Softly beveled, floating grassy island; soil is only visible around its edge.
  roundedPlatform(8.12,6.55,.55,M.island,0,-.58,0,1.22);
  roundedPlatform(8.08,6.52,.22,M.grass,0,.12,0,1.24);
  // Rounded hillside mounds around the back, visible from an isometric camera.
  for(const [x,z,sx,sy,sz] of [[-3.3,-2.25,1.05,.45,1.05],[3.15,-2.0,1.18,.50,1.15],[-.1,-2.63,1.0,.32,.60]]){
    sphere(1,M.grassLight,root,x,.30,z,sx,sy,sz);
  }

  // Winding cream stepping stones connect barn, vegetables and chicken companion.
  const steps=[[-.05,-.8],[.15,-.42],[.33,-.05],[.33,.38],[.44,.82],[.76,1.21],[1.00,1.49],[1.25,1.64]];
  for(let i=0;i<steps.length;i++){
    const [x,z]=steps[i];const stone=sphere(.22,i%3===0?M.stone:M.path,root,x,.42,z,1.20,.20,.78);
    stone.rotation.y=(i%4-.5)*.16;stone.castShadow=false;
  }

  // Vegetable patch, thin curved timber borders and shallow planting furrows.
  roundedPlatform(3.08,2.02,.12,M.soil,-1.55,.41,1.12,.34);
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

  // Blush-pink toy barn: soft roof, ivory frames, a little dormer and chimney.
  const barn=new THREE.Group();root.add(barn);barn.position.set(1.58,.42,-1.12);
  softBox(1.65,1.27,1.47,M.barn,barn,0,.72,0);
  const roofA=softBox(1.18,.18,1.77,M.roof,barn,-.455,1.59,0);roofA.rotation.z=.51;
  const roofB=softBox(1.18,.18,1.77,M.roof,barn,.455,1.59,0);roofB.rotation.z=-.51;
  softBox(.60,.84,.075,M.barnTrim,barn,0,.49,.75);
  softBox(.47,.73,.08,M.door,barn,0,.47,.80);
  box(.06,.63,.1,M.barnTrim,barn,0,.45,.86);
  box(.44,.06,.10,M.barnTrim,barn,0,.47,.86);
  sphere(.19,M.barnTrim,barn,0,1.22,.795,1,1,.26);
  sphere(.12,M.door,barn,0,1.22,.85,1,1,.20);
  softBox(.24,.40,.23,M.barn,barn,-.38,1.79,-.36);
  softBox(.68,.48,.06,M.barnTrim,barn,.84,.84,.18);
  softBox(.49,.30,.08,M.water,barn,.85,.84,.22);
  box(.065,.37,.10,M.barnTrim,barn,.85,.84,.27);
  box(.49,.055,.1,M.barnTrim,barn,.85,.84,.28);

  // Rounded clay trees built from reusable spheres. Colors and scales vary softly.
  function tree(x,z,size=1,variation=0){
    const g=new THREE.Group();root.add(g);g.position.set(x,.39,z);g.scale.setScalar(size);
    cyl(.135,.205,1.07,M.trunk,g,0,.56,0);
    const clusters=[[0,1.37,0,.55],[-.37,1.13,.14,.43],[.34,1.18,.13,.44],[0,1.10,-.35,.42]];
    clusters.forEach(([xx,yy,zz,r],i)=>sphere(r,[M.leaf,M.leafLight,M.leafDark][(i+variation)%3],g,xx,yy,zz,1.07,1,.97));
    return g;
  }
  tree(-3.24,-1.66,1.02);tree(3.18,-1.73,.91,1);tree(3.16,.82,.76,2);
  tree(-.18,-2.22,.63,1);

  // Soft, curved tomato vines with oversized recognisable produce.
  function stem(points,material,r=.038,parent=root){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve,10,r,6,false),material,parent,0,0,0);
  }
  function tomato(x,y,z,r=.27,material=M.tomato){
    const group=new THREE.Group();group.position.set(x,y,z);root.add(group);
    sphere(r,material,group,0,0,0,1.06,.95,1.05);
    cyl(.026,.029,.16,M.stem,group,0,r+.038,0,6);
    for(let i=0;i<5;i++){
      const a=i*2*Math.PI/5;
      const leaf=sphere(r*.53,M.stem,group,Math.cos(a)*r*.36,r*.78,Math.sin(a)*r*.36,.85,.21,.45);
      leaf.rotation.y=-a;
    }
    return group;
  }
  function vine(x,z,variant=0){
    stem([[x,.56,z],[x+.06,.92,z+.05],[x-.02,1.28,z+.03],[x-.06,1.63,z]],M.stem,.05);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2+.35, y=.83+(i%2)*.27;
      const leaf=sphere(.21,i%2?M.leaf:M.leafDark,root,x+Math.cos(a)*.23,y,z+Math.sin(a)*.23,1.3,.19,.53);
      leaf.rotation.y=a;
    }
  }
  vine(-2.42,.95);vine(-1.52,1.10);vine(-.67,1.03);
  const fruits=[
    tomato(-2.43,1.39,.99,.275,M.tomatoLight),
    tomato(-1.56,1.54,1.10,.34,M.tomato),
    tomato(-.68,1.40,1.04,.295,M.tomatoLight),
    tomato(-2.19,.95,1.51,.20,M.tomato),
    tomato(-.88,.99,1.52,.22,M.tomato)
  ];
  const colliders=fruits.map((f,i)=>{
    const c=new THREE.Mesh(new THREE.SphereGeometry(i===1?.54:.47,12,9),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
    c.position.copy(f.position);c.userData.ingredient='tomato';c.userData.fruitIndex=i;root.add(c);return c;
  });

  // White hen companion (not a required control): wings, comb, eyes, beak and feet.
  const hen=new THREE.Group();root.add(hen);hen.position.set(2.46,.39,1.28);
  sphere(.32,M.white,hen,0,.35,0,1.23,.95,.98);
  sphere(.22,M.white,hen,0,.67,.12);
  sphere(.14,M.white,hen,-.31,.38,-.01,.64,.95,1.17);
  sphere(.14,M.white,hen,.31,.38,-.01,.64,.95,1.17);
  sphere(.15,M.white,hen,0,.36,-.35,.58,.82,.82);
  for(const [xx,yy,zz] of [[-.12,.91,.04],[0,.98,.07],[.12,.91,.04]])sphere(.087,M.coral,hen,xx,yy,zz,.9,1.1,.85);
  const beak=mesh(new THREE.ConeGeometry(.125,.21,5),M.yellow,hen,0,.60,.36);beak.rotation.x=Math.PI/2;
  const eyes=[sphere(.038,M.eye,hen,-.096,.72,.296,1,1,.6),sphere(.038,M.eye,hen,.096,.72,.296,1,1,.6)];
  for(const x of [-.19,.19]){sphere(.082,M.yellow,hen,x,.08,.12,1.0,.45,1.35);}

  // Decorations: small grass clumps, limited flower stems and little stones.
  const positions=Array.from({length:30},(_,i)=>{
    const x=-3.6+((i*41)%97)/97*7.2,z=-2.79+((i*31)%89)/89*5.58;
    return [x,z];
  }).filter(([x,z])=> !((x>-3.15&&x<.1&&z>-.15&&z<2.35)||(x>.5&&x<2.8&&z>-.8&&z<1.9)));
  positions.forEach(([x,z],i)=>{
    const grass=new THREE.Group();root.add(grass);grass.position.set(x,.40,z);
    for(let j=-1;j<=1;j++)sphere(.09,j===0?M.leaf:M.grassDeep,grass,j*.11,.09,0,.68,1.55,.45);
    if(i%3===0){cyl(.018,.02,.20,M.stem,root,x,.54,z,8);sphere(.085,i%2?M.flower:M.flowerPink,root,x,.68,z,.9,.65,.9);sphere(.036,M.yellow,root,x,.72,z,.7,.6,.7);}
  });
  for(let i=0;i<12;i++){
    const x=2.2+((i*17)%41)/41*1.5,z=-.27+((i*11)%37)/37*1.3;
    sphere(.115,M.stone,root,x,.43,z,1,.47,.72).castShadow=false;
  }

  function update(elapsed,reduced,focused,selectedIndex=1){
    if(reduced) {hen.position.y=.39;eyes.forEach(e=>{e.scale.y=.038});return;}
    hen.position.y=.39+Math.sin(elapsed*1.7)*.022;
    hen.rotation.y=Math.sin(elapsed*.68)*.07;
    const blink=Math.sin(elapsed*.72)>0.992 ? .16 : 1;
    eyes.forEach(e=>{e.scale.y=.038*blink;});
    fruits.forEach((fruit,i)=>{
      fruit.rotation.y=Math.sin(elapsed*1.4+i*.9)*(i===selectedIndex&&focused?.09:.027);
      const sc=(i===selectedIndex&&focused?1.045:1);
      fruit.scale.setScalar(sc);
    });
  }
  return {root,colliders,fruitPositions:fruits.map(f=>f.position.clone()),update};
}
