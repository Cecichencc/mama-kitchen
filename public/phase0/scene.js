// Kitchen Garden — Phase 0 interactive WebGL proof.
// This isolated proof uses Three.js from a pinned CDN module while the Vite/R3F
// package migration awaits registry access. Visual interactions NEVER mutate stock.
const mount = document.getElementById('threeMount');
const note = document.getElementById('worldNote');
const fallback = document.getElementById('fallback');
const selectBtn = document.getElementById('selectTomatoBtn');
const overviewBtn = document.getElementById('overviewBtn');
const fallbackSelectBtn = document.getElementById('fallbackSelectBtn');
const sheet = document.getElementById('ingredientSheet');
const backdrop = document.getElementById('sheetBackdrop');
const closeBtn = document.getElementById('closeSheetBtn');
const returnBtn = document.getElementById('returnBtn');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let selectTomato = () => openSheet();
let backToOverview = () => {};
let lastFocus = null;

function openSheet() {
  lastFocus = document.activeElement;
  sheet.hidden = false;
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}
function closeSheet() {
  sheet.hidden = true;
  backdrop.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus?.focus) lastFocus.focus();
}
function showFallback(message) {
  fallback.hidden = false;
  note.textContent = message;
  note.hidden = false;
  selectBtn.disabled = false;
  overviewBtn.disabled = true;
}
closeBtn.addEventListener('click', closeSheet);
backdrop.addEventListener('click', closeSheet);
returnBtn.addEventListener('click', () => { closeSheet(); backToOverview(); });
selectBtn.addEventListener('click', () => selectTomato());
fallBackBind();
function fallBackBind() { fallbackSelectBtn.addEventListener('click', () => selectTomato()); }
overviewBtn.addEventListener('click', () => { closeSheet(); backToOverview(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); return; }
  if (e.key === 'Tab' && !sheet.hidden) {
    const focusables = [closeBtn, returnBtn];
    const idx = focusables.indexOf(document.activeElement);
    if (e.shiftKey && idx <= 0) { e.preventDefault(); returnBtn.focus(); }
    else if (!e.shiftKey && idx >= focusables.length - 1) { e.preventDefault(); closeBtn.focus(); }
  }
});

async function boot() {
  const canvasTest = document.createElement('canvas');
  let gl = null;
  try { gl = canvasTest.getContext('webgl2') || canvasTest.getContext('webgl'); }
  catch (e) { /* Browser blocked WebGL */ }
  if (!gl) { showFallback('此浏览器无法使用 WebGL'); return; }

  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js');
  } catch (e) {
    console.error('Three.js module unavailable', e);
    showFallback('3D 资源加载失败 · 可使用普通交互');
    return;
  }
  let renderer, scene, camera;
  try {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.44;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-label','真实 3D 农场：番茄可点击');
    mount.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xfff4df, 0x617b52, 2.15); scene.add(light);
    const sun = new THREE.DirectionalLight(0xfff3d3, 3.0);
    sun.position.set(-5, 10, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024);
    sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;
    sun.shadow.normalBias=0.027;sun.shadow.bias=-0.0001;sun.shadow.radius=4;
    scene.add(sun);
    const world = new THREE.Group(); scene.add(world);
    const matte = (hex) => new THREE.MeshStandardMaterial({color:hex,roughness:.94,metalness:0});
    const M = {
      ground:matte(0x86b96a), soil:matte(0x936034), brown:matte(0x805037), red:matte(0xd16c4f),
      roof:matte(0xb44b37), green:matte(0x4e954d), leaf:matte(0x6ba949), leaf2:matte(0x418344),
      tomato:matte(0xe94931), white:matte(0xffe8c6), yellow:matte(0xf0b24a), gold:matte(0xffcc65),
      door:matte(0x7d4328), coop:matte(0xd79e5f), fence:matte(0xe0ad73), water:matte(0x6cbbcc)
    };
    const put = (geometry, material, parent=world, x=0,y=0,z=0) => {
      const mesh=new THREE.Mesh(geometry,material); mesh.position.set(x,y,z); mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    };
    const box=(w,h,d,ma,parent=world,x=0,y=0,z=0)=>put(new THREE.BoxGeometry(w,h,d),ma,parent,x,y,z);
    const ball=(radius,ma,parent=world,x=0,y=0,z=0, seg=16)=>put(new THREE.SphereGeometry(radius,seg,12),ma,parent,x,y,z);
    const cylinder=(rt,rb,h,ma,parent,x,y,z)=>put(new THREE.CylinderGeometry(rt,rb,h,10),ma,parent,x,y,z);
    function roundedShape(w,d,r){const s=new THREE.Shape();const a=-w/2,b=-d/2;
      s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+d-r);
      s.quadraticCurveTo(a+w,b+d,a+w-r,b+d);s.lineTo(a+r,b+d);s.quadraticCurveTo(a,b+d,a,b+d-r);
      s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);return s;}
    function platform(w,d,h,ma,x,y,z,r=.65){
      const g=new THREE.ExtrudeGeometry(roundedShape(w,d,r),{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelThickness:.12,bevelSize:.13,curveSegments:5});
      g.rotateX(-Math.PI/2);
      return put(g,ma,world,x,y,z);
    }
    platform(8.1,5.65,.65,matte(0xb58a53),0,-.55,0,.9);
    platform(8.0,5.55,.25,M.ground,0,.12,0,.87);
    // Soil plot: functional selection prop is placed here.
    box(2.9,.14,1.75,M.soil,world,-1.55,.53,.95);
    for(let i=0;i<3;i++){
      const plot=box(.06,.025,1.5,matte(0xae7745),world,-2.57+i*.98,.62,.95);
      plot.castShadow=false;
    }
    // Decorative vegetation and stones use seeded positions, never randomness at runtime.
    for(let i=0;i<22;i++){
      const x=-3.4+((i*13)%71)/71*6.8;
      const z=-2.15+((i*17)%61)/61*4.3;
      if((x>-3&&x<-.1&&z>-.1&&z<1.95)||(x>1&&x<2.8&&z>-1.9&&z<-.15))continue;
      const tuft=new THREE.Group();world.add(tuft);tuft.position.set(x,.41,z);
      for(let j=0;j<3;j++){
        const blade=ball(.065,j===1?M.leaf2:M.leaf,tuft,(j-1)*.09,.05+(j%2)*.05,0,8);
        blade.scale.set(.75,1.8,.9);
      }
    }
    // Barn and pitched roof, with warm clay materials.
    const barn=new THREE.Group();world.add(barn);barn.position.set(1.7,.40,-1.10);
    box(1.60,1.20,1.34,M.red,barn,0,.67,0);
    box(.54,.85,.035,M.door,barn,0,.47,.69);
    box(.085,.78,.07,M.fence,barn,0,.47,.72);
    box(.54,.07,.08,M.fence,barn,0,.43,.75);
    const roofLeft=box(1.18,.15,1.55,M.roof,barn,-.45,1.55,0);roofLeft.rotation.z=.55;
    const roofRight=box(1.18,.15,1.55,M.roof,barn,.45,1.55,0);roofRight.rotation.z=-.55;
    box(.30,.30,.08,M.white,barn,0,1.20,.70);
    box(.20,.20,.09,M.door,barn,0,1.20,.76);
    // Chickens and tiny coop.
    function chicken(x,z,scale=1){const g=new THREE.Group();world.add(g);g.position.set(x,.45,z);g.scale.setScalar(scale);
      ball(.34,M.white,g,0,.31,0).scale.set(1.15,.82,.90);
      ball(.21,M.white,g,0,.62,.14);
      const beak=put(new THREE.ConeGeometry(.11,.25,4),M.yellow,g,0,.57,.34);beak.rotation.x=Math.PI/2;
      ball(.034,M.door,g,-.095,.68,.29,8);ball(.034,M.door,g,.095,.68,.29,8);
      ball(.08,M.red,g,0,.85,.05,10);
      return g;
    }
    chicken(2.5,1.30,.95);chicken(1.35,1.48,.76);
    for(let i=0;i<5;i++)ball(.16,M.white,world,.85+i*.20,.49,1.84+(i%2)*.21,12).scale.set(.82,1.05,.72);
    // Tree cluster, provides depth and character without an external GLB.
    function tree(x,z,s=1){const g=new THREE.Group();world.add(g);g.position.set(x,.43,z);g.scale.setScalar(s);
      cylinder(.13,.22,1.22,M.door,g,0,.65,0);
      for(const [dx,dy,dz,r] of [[0,1.35,0,.55],[-.42,1.1,.08,.46],[.40,1.1,0,.43],[0,1.05,.35,.4]]){
        ball(r,dy>1.2?M.leaf:M.green,g,dx,dy,dz,12);
      }
      for(const [dx,dy,dz] of [[.18,1.17,.34],[-.25,1.35,.2]]) ball(.10,M.tomato,g,dx,dy,dz,10);
    }
    tree(-3.14,-1.45,1.13);tree(3.10,-1.65,.85);tree(3.20,.75,.84);
    // Wooden posts define the garden. No physics engine needed for Phase 0.
    for(let i=0;i<5;i++){
      const x=-2.85+i*.68;
      box(.10,.37,.10,M.fence,world,x,.55,-.15);
      if(i<4)box(.66,.08,.08,M.fence,world,x+.33,.54,-.15);
    }
    // Multiple genuine 3D tomatoes, including one larger tappable target.
    function tomato(x,y,z,scale=1){const g=new THREE.Group();world.add(g);g.position.set(x,y,z);g.scale.setScalar(scale);
      ball(.27,M.tomato,g,0,0,0,18).scale.set(1.07,.96,1.04);
      cylinder(.035,.035,.23,M.leaf2,g,0,.30,0);
      for(let a=0;a<5;a++){
        const ang=a*Math.PI*2/5;
        const leaf=ball(.16,M.leaf2,g,Math.cos(ang)*.13,.21,Math.sin(ang)*.13,9);
        leaf.scale.set(.85,.28,.42);leaf.rotation.y=-ang;
      }
      return g;
    }
    // Stems + leaves are intentionally more legible than botanically accurate.
    function plant(x,z){cylinder(.055,.072,.80,M.green,world,x,.91,z);
      for(let j=0;j<4;j++){
        const a=j*Math.PI/2, y=.82+(j%2)*.25;
        const leaf=ball(.24,j%2?M.leaf:M.leaf2,world,x+Math.cos(a)*.24,y,z+Math.sin(a)*.25,10);
        leaf.scale.set(1.25,.28,.60);leaf.rotation.y=a;
      }
    }
    plant(-2.23,.47);plant(-1.30,.5);plant(-.51,.58);
    const selectedTomato=tomato(-1.48,1.56,1.02,1.35);
    tomato(-2.34,1.38,.66,.92);tomato(-.55,1.35,.96,1.03);
    tomato(-2.1,.99,1.4,.65);tomato(-.87,.99,1.44,.65);
    // Touch collider is larger than model and invisible but still raycastable.
    const collider=new THREE.Mesh(new THREE.SphereGeometry(.57,12,10),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    collider.position.copy(selectedTomato.position);collider.userData.ingredient='tomato';world.add(collider);
    const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
    const desired=new THREE.Vector3(0,.65,.08);const current=desired.clone();
    const targetOffset=new THREE.Vector3(7.7,8.5,11.5);
    const widthWorld=9.2;let targetZoom=1,focused=false;
    camera=new THREE.OrthographicCamera(-4.6,4.6,6,-6,.1,100);
    camera.position.copy(current).add(targetOffset);camera.lookAt(current);
    function resize(){
      const rect=mount.getBoundingClientRect(); if(rect.width<2||rect.height<2)return;
      const aspect=rect.width/rect.height;
      camera.left=-widthWorld/2;camera.right=widthWorld/2;
      camera.top=widthWorld/(2*aspect);camera.bottom=-widthWorld/(2*aspect);camera.updateProjectionMatrix();
      renderer.setSize(Math.floor(rect.width),Math.floor(rect.height),false);
    }
    const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    const onSelect=()=>{
      focused=true;desired.set(-1.50,1.1,1.04);targetZoom=1.54;overviewBtn.disabled=false;
      note.textContent='番茄已选中 · 镜头正在靠近';
      openSheet();
    };
    const onOverview=()=>{focused=false;desired.set(0,.65,.08);targetZoom=1;overviewBtn.disabled=true;note.textContent='3D 农场已就绪 · 点击番茄探索';};
    selectTomato=onSelect;backToOverview=onOverview;
    selectBtn.disabled=false;overviewBtn.disabled=true;note.textContent='3D 农场已就绪 · 点击番茄探索';
    let pointerStart=null;
    renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
    renderer.domElement.addEventListener('pointerup',e=>{
      if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>12)return;
      pointerStart=null;
      const r=renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
      raycaster.setFromCamera(pointer,camera);
      if(raycaster.intersectObject(collider,false).length)onSelect();
    });
    renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;});
    const clock=new THREE.Clock();let lastRender=0,disposed=false;
    function animate(){
      if(disposed)return;
      const t=clock.getElapsedTime();if(t-lastRender<1/32)return;lastRender=t;
      const k=prefersReduced.matches?1:.12;
      current.lerp(desired,k);camera.position.lerp(current.clone().add(targetOffset),k);
      camera.zoom+=(targetZoom-camera.zoom)*k;camera.updateProjectionMatrix();camera.lookAt(current);
      if(!prefersReduced.matches){selectedTomato.rotation.y=Math.sin(t*1.4)*.065;}
      renderer.render(scene,camera);
    }
    renderer.setAnimationLoop(animate);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showFallback('WebGL 中断 · 请稍后重试');renderer.setAnimationLoop(null);});
    window.addEventListener('pagehide',()=>{disposed=true;renderer.setAnimationLoop(null);observer.disconnect();renderer.dispose();});
  }catch(e){console.error('3D scene initialization failed',e);renderer?.dispose();showFallback('3D 启动失败 · 仍可查看番茄');}
}
boot();
