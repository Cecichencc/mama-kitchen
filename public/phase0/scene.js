// Kitchen Garden Phase 1 — 3D presentation + independent inventory UI.
// 3D taps dispatch selection intents. They NEVER change physical stock themselves.
import {createTranslator} from './i18n.js';
import {createPastelWorld} from './world.js';
import {createGameUI} from './game-ui.js';

const el=id=>document.getElementById(id);
const mount=el('threeMount');
const note=el('worldNote');
const fallback=el('fallback');
const overviewBtn=el('overviewBtn');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const i18n=createTranslator();
let currentStatus='farm.loading';
let selectResource=()=>{},backToOverview=()=>{};
const game=createGameUI({i18n,onReturnToFarm:()=>backToOverview()});
// The accessible ingredient buttons work even when the WebGL engine fails.
selectResource=id=>game.openIngredient(id);
function status(key){currentStatus=key;note.dataset.i18n=key;note.textContent=i18n.t(key);}
function showFallback(key){
  fallback.hidden=false;mount.closest('.farm-stage')?.classList.add('is-fallback');
  status(key);overviewBtn.hidden=true;
}
document.addEventListener('kg:languagechange',()=>status(currentStatus));
for(const [id,ingredient] of [['selectTomatoBtn','tomato'],['selectEggBtn','egg'],['fallbackSelectBtn','tomato'],['fallbackEggBtn','egg']]){
  el(id).addEventListener('click',()=>selectResource(ingredient));
}
overviewBtn.addEventListener('click',()=>backToOverview());

async function boot(){
  status('farm.loading');
  let THREE;
  try {
    // Pinned Three.js for the existing lightweight Vite proof. Migrate to a
    // bundled R3F dependency once package install/deployment access is available.
    THREE=await import('https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js');
  }catch(error){console.warn('Three.js could not load',error);showFallback('farm.loadFailed');return;}
  let renderer,observer;
  try {
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setClearColor(0xffffff,0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.22;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction='pan-y';
    renderer.domElement.setAttribute('aria-label',i18n.t('farm.viewLabel'));
    mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfffcf2,0x7c9b8d,1.6));
    const sunlight=new THREE.DirectionalLight(0xfff4df,2.05);
    sunlight.position.set(-3.6,11.5,5.1);sunlight.castShadow=true;
    sunlight.target.position.set(0,.58,0);scene.add(sunlight.target);
    sunlight.shadow.mapSize.set(1024,1024);
    sunlight.shadow.camera.left=-6.2;sunlight.shadow.camera.right=6.2;
    sunlight.shadow.camera.top=6.2;sunlight.shadow.camera.bottom=-6.2;
    sunlight.shadow.camera.near=.5;sunlight.shadow.camera.far=28;
    sunlight.shadow.camera.updateProjectionMatrix();
    sunlight.shadow.normalBias=.006;sunlight.shadow.bias=-.00005;
    sunlight.shadow.radius=1.6;scene.add(sunlight);

    const farm=createPastelWorld(THREE,scene);
    const camera=new THREE.OrthographicCamera(-4,4,7,-7,.1,90);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const overviewTarget=new THREE.Vector3(-.16,.68,.10);
    const desired=overviewTarget.clone(),current=desired.clone();
    const offset=new THREE.Vector3(7.4,9.4,12.0);
    const homeZoom=1;
    let zoomTarget=homeZoom,focused=false,selectedIndex=1,selectedIngredient='tomato';
    camera.position.copy(current).add(offset);camera.lookAt(current);

    function resize(){
      const rect=mount.getBoundingClientRect();
      if(rect.width<2||rect.height<2)return;
      const aspect=rect.width/rect.height;
      const visibleWidth=aspect<.56?7.05:aspect<.80?8:aspect<1.2?9.7:11.3;
      camera.left=-visibleWidth/2;camera.right=visibleWidth/2;
      camera.top=visibleWidth/(2*aspect);camera.bottom=-visibleWidth/(2*aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(Math.max(1,Math.floor(rect.width)),Math.max(1,Math.floor(rect.height)),false);
    }
    if('ResizeObserver' in window){observer=new ResizeObserver(resize);observer.observe(mount);}else window.addEventListener('resize',resize);
    resize();
    function focus(id='tomato',index=1){
      selectedIngredient=id;selectedIndex=index;focused=true;
      const target=farm.resourcePositions?.[id]?.[index]||farm.resourcePositions?.[id]?.[0]||farm.fruitPositions[1];
      desired.set(target.x,.77,target.z+.55);
      zoomTarget=1.56;
      overviewBtn.hidden=false;
      status('farm.focused');
      game.openIngredient(id);
    }
    function overview(){focused=false;desired.copy(overviewTarget);zoomTarget=homeZoom;overviewBtn.hidden=true;status('farm.ready');}
    backToOverview=overview;
    selectResource=id=>focus(id,id==='tomato'?1:0);
    game.onAvailabilityChanged(available=>farm.setAvailability(available));
    game.onHarvestEffect(id=>{farm.playHarvest(id);overview();});
    status('farm.ready');

    let pointerDown=null;
    renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
    renderer.domElement.addEventListener('pointercancel',()=>pointerDown=null);
    renderer.domElement.addEventListener('pointerup',e=>{
      const from=pointerDown;pointerDown=null;
      if(!from||Math.hypot(e.clientX-from.x,e.clientY-from.y)>13)return;
      const rect=renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return;
      pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));
      raycaster.setFromCamera(pointer,camera);
      const intersections=raycaster.intersectObjects(farm.colliders,false);
      if(intersections.length){const data=intersections[0].object.userData;focus(data.ingredient||'tomato',data.fruitIndex??0);}
    });
    const onLanguage=()=>renderer.domElement.setAttribute('aria-label',i18n.t('farm.viewLabel'));
    document.addEventListener('kg:languagechange',onLanguage);
    renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();showFallback('farm.contextLost');renderer.setAnimationLoop(null);
    });

    let disposed=false,last=0;
    const clock=new THREE.Clock();
    function animate(){
      if(disposed)return;
      const t=clock.getElapsedTime();if(t-last<1/32)return;last=t;
      const rate=reduced.matches?1:.11;
      current.lerp(desired,rate);
      camera.position.lerp(current.clone().add(offset),rate);
      camera.zoom+=(zoomTarget-camera.zoom)*rate;
      camera.updateProjectionMatrix();camera.lookAt(current);
      farm.update(t,reduced.matches,focused,selectedIndex,selectedIngredient);
      renderer.render(scene,camera);
    }
    renderer.setAnimationLoop(animate);
    window.addEventListener('pagehide',()=>{
      disposed=true;renderer.setAnimationLoop(null);observer?.disconnect();
      document.removeEventListener('kg:languagechange',onLanguage);
      const geometries=new Set(),materials=new Set(),textures=new Set();
      scene.traverse(object=>{
        if(object.geometry)geometries.add(object.geometry);
        const ms=Array.isArray(object.material)?object.material:[object.material].filter(Boolean);
        ms.forEach(m=>materials.add(m));
      });
      for(const m of materials){if(m.map)textures.add(m.map);m.dispose();}
      for(const geo of geometries)geo.dispose();
      for(const tex of textures)tex.dispose();
      renderer.dispose();
    },{once:true});
  } catch(error) {
    console.error('Kitchen Garden WebGL initialization failed',error);
    renderer?.setAnimationLoop(null);renderer?.dispose();showFallback('farm.loadFailed');
  }
}
boot();
