// Kitchen Garden — Phase 0 pastel 3D proof controller.
// No grocery quantities, reservation requests, stock deductions or recipe actions here.
import { createTranslator } from './i18n.js';
import { createPastelWorld } from './world.js';

const el = id => document.getElementById(id);
const mount = el('threeMount');
const note = el('worldNote');
const fallback = el('fallback');
const selectBtn = el('selectTomatoBtn');
const overviewBtn = el('overviewBtn');
const fallbackSelectBtn = el('fallbackSelectBtn');
const sheet = el('ingredientSheet');
const backdrop = el('sheetBackdrop');
const closeBtn = el('closeSheetBtn');
const returnBtn = el('returnBtn');
const settingsBtn = el('settingsBtn');
const settingsSheet = el('settingsSheet');
const settingsBackdrop = el('settingsBackdrop');
const settingsCloseBtn = el('settingsCloseBtn');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const i18n = createTranslator();
let focusBeforeDialog = null;
let activeDialog = null;
let selectTomato = () => showDialog(sheet,backdrop,closeBtn);
let backToOverview = () => {};
let currentStateKey = 'farm.loading';

function showStatus(key) {
  currentStateKey = key;
  note.dataset.i18n = key;
  note.textContent = i18n.t(key);
}
document.addEventListener('kg:languagechange', () => showStatus(currentStateKey));

function showDialog(dialog,overlay,closeControl) {
  if(activeDialog) hideDialog(false);
  focusBeforeDialog = document.activeElement;
  dialog.hidden = false;
  overlay.hidden = false;
  document.body.classList.add('modal-open');
  activeDialog = {dialog,overlay};
  closeControl.focus();
}
function hideDialog(restoreFocus=true) {
  if(!activeDialog) return;
  const {dialog,overlay}=activeDialog;
  dialog.hidden=true;overlay.hidden=true;
  document.body.classList.remove('modal-open');
  activeDialog=null;
  if(restoreFocus && focusBeforeDialog?.focus) focusBeforeDialog.focus();
}
closeBtn.addEventListener('click',()=>hideDialog());
backdrop.addEventListener('click',()=>hideDialog());
returnBtn.addEventListener('click',()=>{hideDialog();backToOverview();});
settingsBtn.addEventListener('click',()=>showDialog(settingsSheet,settingsBackdrop,settingsCloseBtn));
settingsCloseBtn.addEventListener('click',()=>hideDialog());
settingsBackdrop.addEventListener('click',()=>hideDialog());
selectBtn.addEventListener('click',()=>selectTomato());
fallbackSelectBtn.addEventListener('click',()=>selectTomato());
overviewBtn.addEventListener('click',()=>{hideDialog();backToOverview();});
document.querySelectorAll('input[name="language"]').forEach(radio=>{
  radio.addEventListener('change',e=>i18n.setLocale(e.target.value));
});
document.addEventListener('keydown',e=>{
  if(!activeDialog) return;
  if(e.key==='Escape') {e.preventDefault();hideDialog();return;}
  if(e.key!=='Tab')return;
  const nodes=[...activeDialog.dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),summary,[href]')].filter(n=>n.getClientRects().length);
  if(!nodes.length){e.preventDefault();activeDialog.dialog.focus();return;}
  const first=nodes[0],last=nodes[nodes.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});

function showFallback(key){
  fallback.hidden=false;
  showStatus(key);
  overviewBtn.hidden=true;
  selectBtn.disabled=false;
}

async function boot() {
  showStatus('farm.loading');
  let THREE;
  try {
    // Fixed Three.js version; this keeps Phase 0 compatible with the existing Vite repo.
    // Integrate a locally installed module with React Three Fiber when the package registry is available.
    THREE=await import('https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js');
  } catch(error) {
    console.warn('Kitchen Garden 3D module was unavailable',error);
    showFallback('farm.loadFailed');
    return;
  }

  let renderer,scene,camera,observer;
  try {
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setClearColor(0xffffff,0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.22;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-label',i18n.t('farm.viewLabel'));
    renderer.domElement.style.touchAction='pan-y';
    mount.appendChild(renderer.domElement);

    scene=new THREE.Scene();
    const skyLight=new THREE.HemisphereLight(0xfffcf2,0x7c9b8d,1.6);scene.add(skyLight);
    const sunlight=new THREE.DirectionalLight(0xfff4df,2.05);
    // A higher key light keeps cast shadows close to objects rather than
    // making them appear to float beside their own silhouettes.
    sunlight.position.set(-3.6,11.5,5.1);sunlight.castShadow=true;
    sunlight.target.position.set(0,.58,0);scene.add(sunlight.target);
    // Map coverage is concentrated on the playable island; 1024px on a
    // ~12-unit frustum is substantially sharper than the old 512px / 18.
    sunlight.shadow.mapSize.set(1024,1024);
    sunlight.shadow.camera.left=-6.2;sunlight.shadow.camera.right=6.2;
    sunlight.shadow.camera.top=6.2;sunlight.shadow.camera.bottom=-6.2;
    sunlight.shadow.camera.near=.5;sunlight.shadow.camera.far=28;
    sunlight.shadow.camera.updateProjectionMatrix();
    // Use only enough bias to prevent acne. Excess normalBias detaches feet.
    sunlight.shadow.normalBias=.006;sunlight.shadow.bias=-.00005;
    sunlight.shadow.radius=1.6;
    scene.add(sunlight);
    const farm=createPastelWorld(THREE,scene);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const overviewTarget=new THREE.Vector3(-.16,.68,.10),desired=overviewTarget.clone(),current=desired.clone();
    const cameraOffset=new THREE.Vector3(7.4,9.4,12.0);
    const homeZoom=1;
    let zoomTarget=homeZoom,focused=false,selectedIndex=1;
    camera=new THREE.OrthographicCamera(-4,4,7,-7,.1,90);
    camera.position.copy(current).add(cameraOffset);camera.lookAt(current);

    function resize(){
      const rect=mount.getBoundingClientRect();
      if(rect.width<2||rect.height<2)return;
      const aspect=rect.width/rect.height;
      // Mobile uses a tighter portrait crop of the playable barn/tomato area.
      // Desktop shows the full small island and surrounding hills.
      const visibleWidth=aspect<.56?7.05:aspect<.80?8.0:aspect<1.2?9.7:11.3;
      camera.left=-visibleWidth/2;camera.right=visibleWidth/2;
      camera.top=visibleWidth/(2*aspect);camera.bottom=-visibleWidth/(2*aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(Math.max(1,Math.floor(rect.width)),Math.max(1,Math.floor(rect.height)),false);
    }
    if('ResizeObserver' in window){observer=new ResizeObserver(resize);observer.observe(mount);}else{window.addEventListener('resize',resize);}
    resize();

    function inspect(index=1){
      selectedIndex=index;focused=true;
      const target=farm.fruitPositions[index]||farm.fruitPositions[1];
      // Aim slightly in front of the fruit to leave it visible above the ingredient sheet.
      desired.set(target.x,.77,target.z+.55);
      zoomTarget=1.56;
      overviewBtn.hidden=false;
      showStatus('farm.focused');
      showDialog(sheet,backdrop,closeBtn);
    }
    function overview(){
      focused=false;desired.copy(overviewTarget);zoomTarget=homeZoom;
      overviewBtn.hidden=true;showStatus('farm.ready');
    }
    selectTomato=()=>inspect(1);
    backToOverview=overview;
    selectBtn.disabled=false;
    showStatus('farm.ready');

    let pointerDown=null;
    renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY,time:performance.now()};});
    renderer.domElement.addEventListener('pointercancel',()=>{pointerDown=null;});
    renderer.domElement.addEventListener('pointerup',e=>{
      const start=pointerDown;pointerDown=null;
      if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>13)return;
      const rect=renderer.domElement.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));
      raycaster.setFromCamera(pointer,camera);
      const intersections=raycaster.intersectObjects(farm.colliders,false);
      if(intersections.length)inspect(intersections[0].object.userData.fruitIndex);
    });

    let disposed=false,lastFrame=0;
    const clock=new THREE.Clock();
    function animate(){
      if(disposed)return;
      const t=clock.getElapsedTime();
      if(t-lastFrame<1/32)return;
      lastFrame=t;
      const rate=prefersReduced.matches?1:.11;
      current.lerp(desired,rate);
      camera.position.lerp(current.clone().add(cameraOffset),rate);
      camera.zoom+=(zoomTarget-camera.zoom)*rate;
      camera.updateProjectionMatrix();camera.lookAt(current);
      farm.update(t,prefersReduced.matches,focused,selectedIndex);
      renderer.render(scene,camera);
    }
    renderer.setAnimationLoop(animate);
    const onLanguage=()=>renderer.domElement.setAttribute('aria-label',i18n.t('farm.viewLabel'));
    document.addEventListener('kg:languagechange',onLanguage);
    renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();showFallback('farm.contextLost');renderer.setAnimationLoop(null);
    });
    window.addEventListener('pagehide',()=>{
      disposed=true;renderer.setAnimationLoop(null);observer?.disconnect();
      document.removeEventListener('kg:languagechange',onLanguage);
      const geometries=new Set(),materials=new Set();
      scene.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry);
        if(object.material)Array.isArray(object.material)?object.material.forEach(m=>materials.add(m)):materials.add(object.material);
      });
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
      renderer.dispose();
    },{once:true});
  }catch(error){
    console.error('Kitchen Garden 3D initialization failed',error);
    renderer?.setAnimationLoop(null);renderer?.dispose();
    showFallback('farm.loadFailed');
  }
}
boot();
