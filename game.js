'use strict';
const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
let seed=8271;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}const range=(a,b)=>a+rand()*(b-a);
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.autoClear=false;
const scene=new THREE.Scene();scene.background=new THREE.Color('#8a999c');scene.fog=new THREE.FogExp2('#89989a',.008);const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.08,260);camera.rotation.order='YXZ';const gunScene=new THREE.Scene(),gunCamera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.01,12);gunScene.add(new THREE.HemisphereLight(0xc5d4dc,0x41433d,2.8));const gl=new THREE.DirectionalLight(0xffebc8,3);gl.position.set(-3,5,2);gunScene.add(gl);
scene.add(new THREE.HemisphereLight(0xc5d2d8,0x393b31,1.7));const sun=new THREE.DirectionalLight(0xffe6bd,2.2);sun.position.set(-35,65,-20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:160});sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);
function tex(kind){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=kind==='road'?'#353b3a':kind==='metal'?'#59625c':'#85867b';x.fillRect(0,0,256,256);for(let i=0;i<15000;i++){let v=range(20,170)|0;x.fillStyle=`rgba(${v},${v},${v},${range(.03,.22)})`;x.fillRect(rand()*256,rand()*256,range(1,4),range(1,3))}if(kind==='concrete'){for(let i=0;i<10;i++){x.strokeStyle='#282e2933';x.lineWidth=rand()*2;x.beginPath();let a=rand()*256,b=rand()*256;x.moveTo(a,b);for(let j=0;j<6;j++){a+=range(-20,20);b+=range(5,24);x.lineTo(a,b)}x.stroke()}x.fillStyle='#22281e28';x.fillRect(0,230,256,26)}if(kind==='metal'){for(let i=0;i<256;i+=16){x.fillStyle='#19272044';x.fillRect(i,0,3,256);x.fillStyle='#b4b9a633';x.fillRect(i+3,0,2,256)}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}
const concrete=new THREE.MeshStandardMaterial({map:tex('concrete'),roughness:.98,color:0xb2b3a4}),road=new THREE.MeshStandardMaterial({map:tex('road'),roughness:.7,color:0x999b96}),metal=new THREE.MeshStandardMaterial({map:tex('metal'),roughness:.76,metalness:.45}),dark=new THREE.MeshStandardMaterial({color:0x202a2b,roughness:.65,metalness:.4}),glass=new THREE.MeshStandardMaterial({color:0x26383c,metalness:.65,roughness:.24}),rust=new THREE.MeshStandardMaterial({color:0x635341,roughness:.9}),sand=new THREE.MeshStandardMaterial({color:0x76715c,roughness:1}),black=new THREE.MeshStandardMaterial({color:0x141b1c,roughness:.9});
const colliders=[],solidMeshes=[],enemies=[],enemyParts=[],effects=[],bullets=[],smokes=[];
const boxGeo=new THREE.BoxGeometry(1,1,1);function box(x,y,z,w,h,d,mat=concrete,solid=true,parent=scene){const m=new THREE.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(solid){colliders.push({x,z,w:w/2,d:d/2,top:y+h/2,bottom:y-h/2});solidMeshes.push(m)}return m}
function cyl(x,y,z,r,h,mat=dark,parent=scene){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function label(text,x,y,z,w=5,h=1,bg='#252f2e',fg='#d7d2b8'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.font='bold 58px Arial';ctx.textAlign='center';ctx.fillStyle=fg;ctx.fillText(text,256,85);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(c),roughness:1}));m.position.set(x,y,z);scene.add(m);return m}
// Connected district: three north/south routes, four cross streets, sixteen interiors.
const buildings=[],supplies=[],walkSurfaces=[],cabinets=[];
const FLOOR=3.6;
const floorMat=new THREE.MeshStandardMaterial({map:tex('concrete'),color:0x96927d,roughness:.92});
const interiorMat=new THREE.MeshStandardMaterial({map:tex('concrete'),color:0xb6b6a4,roughness:.95,emissive:0x282c24,emissiveIntensity:.3});
const stripeMat=new THREE.MeshStandardMaterial({color:0xaca68a,roughness:1});
box(0,-.25,3,144,.5,140,road,false);road.map.repeat.set(32,32);
for(const x of [-39,0,39])for(let z=-57;z<66;z+=9)box(x,.008,z,.13,.012,3.8,stripeMat,false);
for(const z of [-29,-1,27,57])for(let x=-63;x<68;x+=8)box(x,.012,z,3,.014,.13,stripeMat,false);
function slab(x,z,w,d,y,mat=floorMat){box(x,y-.1,z,w,.2,d,mat,y>0);walkSurfaces.push({x,z,w:w/2,d:d/2,y});}
function house(x,z,id,w,d){
 const t=.35,door=2.8,sx=x+w/2-2.2;
 const facade=interiorMat.clone();facade.color.setHex([0xa7aaa0,0x9b9483,0x868f8a,0xb2a590][id%4]);
 const b={id,x,z,w,d,sx,spawnTimer:75+range(0,25),visited:false,slots:[],supplySlots:[],points:[],supplyAnchors:[]};buildings.push(b);
 for(let f=0;f<3;f++){
 const y=f*FLOOR;
 if(f===0)slab(x,z,w,d,0);else{
 // A real stairwell opening, with north/south landings and a continuous western corridor.
 const left=x-w/2,right=sx-1.6;
 slab((left+right)/2,z,right-left,d,y);
 slab((sx-1.6+x+w/2)/2,z-d/2+(d/2-5.8)/2,x+w/2-(sx-1.6),d/2-5.8,y);
 slab((sx-1.6+x+w/2)/2,z+5.8+(d/2-5.8)/2,x+w/2-(sx-1.6),d/2-5.8,y);
 }
 // Ground floor doors; upper storeys have open windows with solid sills and lintels.
 for(const side of [-1,1]){
 if(f===0){for(const dz of [-1,1])box(x+side*w/2,y+1.7,z+dz*(d+door)/4,t,3.4,(d-door)/2,facade);box(x+side*w/2,y+3,z,t,.8,door,facade);}
 else{box(x+side*w/2,y+.55,z,t,1.1,d,facade);box(x+side*w/2,y+3.05,z,t,1.1,d,facade);for(let zz=z-d/2;zz<=z+d/2;zz+=3.5)box(x+side*w/2,y+1.8,zz,t,1.4,.6,facade);}
 }
 if(f===0){box(x,y+1.7,z-d/2,w,3.4,t,facade);for(const side of [-1,1])box(x+side*(w+door)/4,y+1.7,z+d/2,(w-door)/2,3.4,t,facade);box(x,y+3,z+d/2,door,.8,t,facade);}
 else for(const side of [-1,1]){box(x,y+.55,z+side*d/2,w,1.1,t,facade);box(x,y+3.05,z+side*d/2,w,1.1,t,facade);for(let xx=x-w/2;xx<x+w/2;xx+=3.4)box(xx,y+1.8,z+side*d/2,.65,1.4,t,facade);}
 // Different room division on each floor, preserving the central route to stairs.
 const cut=z+((id+f)%3-1)*1.4,roomLeft=x-w/2+.3,roomRight=sx-3.4;
 const gap=x-1+(id%2)*1.5;
 for(const [lo,hi]of [[roomLeft,gap-1.4],[gap+1.4,roomRight]])if(hi>lo)box((lo+hi)/2,y+1.6,cut,hi-lo,3.2,.22,facade);
 const tx=x-w/2+1.6,tz=z-d/2+2;
 box(tx,y+.85,tz,2,.1,1.1,(id+f)%2?rust:sand);
 for(const dx of [-.8,.8])for(const dz of [-.4,.4])box(tx+dx,y+.4,tz+dz,.09,.8,.09,dark);
 b.supplyAnchors.push({pos:new THREE.Vector3(tx,y+.9,tz),floor:y,cabinet:null});
 const cx=x-w/2+1.2,cz=z+d/2-2.3;
 box(cx-.5,y+.9,cz,.1,1.8,1.4,dark);
 for(const zz of [-.65,.65])box(cx,y+.9,cz+zz,1.1,1.8,.1,dark);
 for(const yy of [.05,.7,1.75])box(cx,y+yy,cz,1.1,.1,1.4,dark);
 // Cabinet body blocks walking; the opening remains clear for sight and pickup rays.
 colliders.push({x:cx,z:cz,w:.55,d:.7,top:y+1.8,bottom:y});
 const pivot=new THREE.Group();pivot.position.set(cx+.57,y,cz-.65);scene.add(pivot);
 const doorMesh=box(0,.9,.65,.07,1.7,1.3,metal,false,pivot);solidMeshes.push(doorMesh);
 box(.06,.9,1.12,.05,.16,.07,sand,false,pivot);
 const cabinet={pivot,open:false,angle:0,front:new THREE.Vector3(cx+.95,y,cz),floor:y,item:null};cabinets.push(cabinet);
 b.supplyAnchors.push({pos:new THREE.Vector3(cx+.08,y+.75,cz),floor:y,cabinet});
 for(const dz of [-4,4])box(x-1,y+3.36,z+dz,2,.05,.3,new THREE.MeshBasicMaterial({color:f===1?0xd4dfd6:0xe0d2a5}),false);
 label('F'+(f+1)+' / '+String(id).padStart(2,'0'),x-1,y+2.5,z-d/2+.22,2.6,.55);
 for(const dx of [-2,1])for(const dz of [-4,4])b.points.push(new THREE.Vector3(x+dx,y,z+dz));
 if(f<2){
 walkSurfaces.push({x:sx,z,w:1.45,d:5.8,y,ramp:true});
 for(let k=0;k<20;k++){const height=(k+1)*FLOOR/20;const step=box(sx,y+height-.08,z+5.8-(k+.5)*.58,2.9,.16,.58,concrete,false);solidMeshes.push(step);}
 // Waist-high rails and explicit stair signs help make the route legible.
 for(const side of [-1,1]){const rail=box(sx+side*1.5,y+FLOOR/2+.85,z,.06,.06,12.15,dark,false);rail.rotation.x=Math.atan(FLOOR/11.6);for(const zz of [-5.5,0,5.5])cyl(sx+side*1.5,y+(5.8-zz)/11.6*FLOOR+.42,z+zz,.035,.85,dark);}
 const sign=label('STAIRS ↑ F'+(f+2),sx,y+2.6,z+6.3,2.8,.55,'#354d49','#dfdfb5');
 }
 }
 box(x,10.95,z,w+.4,.3,d+.4,concrete);
 for(const side of [-1,1])box(x+side*w/2,11.4,z,.2,.7,d,dark,false);
 label('BLOCK '+String(id).padStart(2,'0'),x,2.9,z+d/2+.2,3.4,.55);
 // Structural bands, sill caps, drainpipes and balcony depth give facades scale.
 for(const side of [-1,1]){
  for(const yy of [3.5,7.1,10.7])box(x,yy,z+side*(d/2+.06),w+.18,.13,.18,dark,false);
  cyl(x+side*(w/2-.4),5.3,z+d/2+.24,.06,10.6,metal);
  for(const yy of [4.65,8.25])for(let xx=x-w/2+1.8;xx<x+w/2;xx+=3.4){box(xx,yy,z+side*(d/2+.12),2.6,.11,.28,concrete,false);}
 }
 // Recessed canopies and roof equipment vary the silhouettes.
 box(x+(id%3-1)*2,3.15,z+d/2+.9,5+(id%3),.18,1.8,metal,false);
 box(x-2,11.45,z-2,2+id%3,.8,1.8,dark,false);
 return b;
}
// Hand-shaped uneven parcels: offset facades, narrow alleys, and wider pocket courtyards.
const parcels=[[-55,-45,17,22],[-52,-15,20,20],[-57,14,15,23],[-52,45,20,24],[-25,-43,19,21],[-24,-12,16,23],[-22,17,17,20],[-25,45,18,22],[24,-44,18,22],[27,-13,20,20],[23,16,16,23],[27,45,20,23],[54,-43,19,23],[57,-12,16,21],[53,17,20,22],[57,47,16,22]];
for(const [x,z,w,d]of parcels)house(x,z,buildings.length+1,w,d);
// Small pocket squares, loading bays and rubble make the cross streets less repetitive.
for(const [x,z]of [[-39,0],[41,31],[-38,59],[42,-29]]){box(x,.4,z,3,.8,1.1,concrete);box(x+3,.55,z+2,1.1,1.1,1.1,rust);}
box(0,2.6,-62,144,5.2,1);label('SECTOR 07',0,3.5,-61.45,9,1.8);
box(-71,3,3,1,6,140);box(71,3,3,1,6,140);box(0,3,72,144,6,1);
for(const x of [-39,39])for(const z of [-29,-1,27,57]){label('CROSS / '+(z+30),x,2.9,z-4,3,.6);cyl(x,1.3,z-4,.05,2.6,dark);}
// Warehouse, corrugated containers, concrete checkpoints.
for(const [x,z,c] of [[-7,-31,0x667568],[8,-10,0x475e62],[-8,13,0x68644f]]){const mat=metal.clone();mat.color.setHex(c);box(x,1.4,z,4.1,2.8,9,mat);box(x,2.85,z,4.2,.12,9.1,dark);for(let off of [-1,1])box(x+off*1.15,1.4,z+4.52,.07,2.4,.1,dark,false)}
for(const [x,z] of [[2,27],[-4,2],[5,-26],[-2,-43],[9,43]]){box(x,.65,z,4,1.3,.9,concrete);for(let a=-1;a<=1;a++)box(x+a*1.15,1.32,z,1,.08,.9,sand,false)}
for(let i=0;i<48;i++){const x=(rand()<.5?-1:1)*range(10,13),z=range(-55,55);let m=box(x,.15,z,range(.15,.7),range(.15,.5),range(.2,.9),rand()<.6?concrete:rust,false);m.rotation.y=rand()*6.28}
for(const [x,z] of [[6,14],[-6,42],[-6,-49]]){
 const car=new THREE.Group();car.position.set(x,0,z);scene.add(car);
 colliders.push({x,z,w:1.2,d:2.4,top:1.8,bottom:0});
 const bodyMat=new THREE.MeshStandardMaterial({color:0x5e635c,metalness:.65,roughness:.52});
 const carPart=(px,py,pz,w,h,d,m=bodyMat)=>{const q=AshVisuals.rb(car,m,px,py,pz,w,h,d,.08);solidMeshes.push(q);return q;};
 carPart(0,.67,0,2.2,.65,4.65);carPart(0,1.15,-.2,1.93,.6,2.3);carPart(0,1.52,-.26,1.85,.12,2.05);carPart(0,1.32,.99,1.73,.36,.04,glass).rotation.x=.22;
 for(const side of [-1,1]){carPart(side*.97,1.32,-.22,.04,.37,1.9,glass);carPart(side*1.08,.72,-.2,.035,.025,2.5,dark);carPart(side*1.14,1.18,.7,.22,.13,.32,dark);for(const zz of [-1.45,1.45]){const tire=new THREE.Mesh(new THREE.TorusGeometry(.36,.125,8,18),black);tire.rotation.y=Math.PI/2;tire.position.set(side*1.1,.46,zz);car.add(tire);AshVisuals.tube(car,metal,side*1.13,.46,zz,.24,.24,.14,'x',16);}}
 carPart(0,.58,2.36,2.1,.16,.16,dark);carPart(0,.82,2.34,.9,.22,.04,dark);for(const side of [-1,1])carPart(side*.77,.89,2.34,.4,.2,.045,glass);
 car.updateMatrixWorld(true);
}
for(let z=-50;z<60;z+=23){cyl(12.5,3.6,z,.08,7.2,dark);box(11.5,7.2,z,2.1,.12,.13,dark,false);box(10.7,7.1,z,.8,.12,.4,new THREE.MeshStandardMaterial({color:0xd5d7b7,emissive:0xaca779,emissiveIntensity:.5}),false)}
for(let i=0;i<14;i++){let x=range(-80,80),z=range(-120,-75),h=range(15,45);box(x,h/2,z,range(10,18),h,range(10,20),concrete,false)}
// Communication equipment and rooftop antenna.
box(5,1.2,-49,2.2,2.4,1.1,dark);box(5,1.6,-48.43,1.5,.9,.04,metal,false);const led=box(5.5,1.9,-48.39,.09,.09,.04,new THREE.MeshBasicMaterial({color:0xdca14e}),false);cyl(7,6,-52,.1,12,dark);for(let y=8;y<12;y+=1.2)box(7,y,-52,2.4,.05,.06,dark,false);label('RELAY / 07',5,2.8,-48.35,3,.65);
const extractMat=new THREE.MeshBasicMaterial({color:0x96c5ad,transparent:true,opacity:.16,depthWrite:false});const extract=new THREE.Mesh(new THREE.RingGeometry(2.8,3,40),extractMat);extract.rotation.x=-Math.PI/2;extract.position.set(-3,.025,55);scene.add(extract);label('EVAC',-3,1.1,59,2.2,.7);
// Atmospheric smoke uses soft transparent billboards, not opaque geometry.
const smokeCanvas=document.createElement('canvas');smokeCanvas.width=smokeCanvas.height=128;const sc=smokeCanvas.getContext('2d'),grad=sc.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(85,91,88,.28)');grad.addColorStop(.45,'rgba(75,80,78,.18)');grad.addColorStop(1,'rgba(75,80,78,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);const smokeTex=new THREE.CanvasTexture(smokeCanvas);
for(let i=0;i<24;i++){let m=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,transparent:true,depthWrite:false}));m.position.set(-18+rand()*5,range(2,26),-32+rand()*4);m.scale.setScalar(range(6,13));scene.add(m);smokes.push(m)}
// Batch static architecture to keep the larger three-storey district affordable to render.
// Collision/raycast source meshes retain their world matrices and are never animated.
const staticBatches=new Map();
for(const m of [...scene.children]){if(!m.isMesh||m.geometry!==boxGeo||m===led)continue;m.updateMatrixWorld(true);if(!staticBatches.has(m.material))staticBatches.set(m.material,[]);staticBatches.get(m.material).push(m);}
for(const [mat,meshes]of staticBatches){const batch=new THREE.InstancedMesh(boxGeo,mat,meshes.length);meshes.forEach((m,i)=>{batch.setMatrixAt(i,m.matrixWorld);scene.remove(m)});batch.castShadow=true;batch.receiveShadow=true;batch.computeBoundingSphere();scene.add(batch);}
// Original stylized soldier meshes, with separately animated limbs and hit zones.
function soldier(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const e={g,health:100,home:new THREE.Vector3(x,0,z),cool:range(1,3),alert:0,phase:rand()*6,limbs:[],dead:false};AshVisuals.soldier(e,enemyParts);enemies.push(e);return e;}
for(const [x,z] of [[-3,19],[7,0],[-7,-13],[2,-32],[-7,-44],[10,-46],[3,-53]])soldier(x,z);
// Gameplay randomness changes on every deployment; architecture remains stable.
seed=(Math.random()*4294967296)>>>0;
const ammoMat=new THREE.MeshStandardMaterial({color:0x78824a,roughness:.75}),medMat=new THREE.MeshStandardMaterial({color:0xbdc3b1,roughness:.8});
function randomPoint(b,used=[]){const choices=b.points.filter(p=>canStand(p.x,p.z,p.y)&&!used.some(q=>q.distanceTo(p)<1.8));return choices.length?choices[Math.floor(rand()*choices.length)].clone():null;}
function supply(b,pos,type,anchor){const g=new THREE.Group();g.position.copy(pos);scene.add(g);box(0,.23,0,.75,.46,.48,type==='ammo'?ammoMat:medMat,false,g);box(0,.48,0,.78,.05,.5,dark,false,g);const mark=new THREE.MeshBasicMaterial({color:type==='ammo'?0xe1d294:0xb44a3f});box(0,.513,0,.4,.014,.1,mark,false,g);if(type==='med')box(0,.515,0,.1,.014,.32,mark,false,g);const item={g,type,active:true,building:b,anchor,cabinet:anchor?.cabinet||null};if(item.cabinet){item.cabinet.item=item;g.visible=false;}supplies.push(item);b.supplySlots.push(item);}
for(const b of buildings){const occupied=[];for(let i=0,n=3;i<n;i++){const pos=randomPoint({...b,points:b.points.filter(p=>p.y===i*FLOOR)},occupied);occupied.push(pos);const e=soldier(pos.x,pos.z);e.g.position.y=pos.y;e.home.copy(pos);e.building=b;e.g.rotation.y=range(0,6.28);b.slots.push(e);}for(let i=0,n=6;i<n;i++){const anchor=b.supplyAnchors[i];supply(b,anchor.pos.clone(),rand()<.5?'ammo':'med',anchor);}}
let collected=0,interactReleased=true;
function updateDistrict(dt){
 const inside=buildings.find(b=>Math.abs(player.pos.x-b.x)<b.w/2&&Math.abs(player.pos.z-b.z)<b.d/2);
 if(inside)inside.visited=true;
 $('location').textContent=(inside?'建筑 '+String(inside.id).padStart(2,'0')+' · '+(Math.floor((player.pos.y+.15)/FLOOR)+1)+' 层':'街区 · '+(player.pos.x < -32?'西侧街道':player.pos.x>32?'东侧街道':'中央街道'))+' / 已探索 '+buildings.filter(b=>b.visited).length+' / '+buildings.length;
 if(!keys.KeyE)interactReleased=true;
 for(const c of cabinets){c.angle=lerp(c.angle,c.open?Math.PI*.55:0,Math.min(1,dt*10));c.pivot.rotation.y=c.angle;c.pivot.updateMatrixWorld(true);if(c.item)c.item.g.visible=c.open&&c.item.active;}
 const cabinet=cabinets.filter(c=>Math.abs(player.pos.y-c.floor)<1&&c.front.distanceTo(player.pos)<1.9&&!obstruct(camera.position,c.front.clone().add(new THREE.Vector3(.1,1.3,0)))).sort((a,b)=>a.front.distanceTo(player.pos)-b.front.distanceTo(player.pos))[0];
 const item=supplies.filter(i=>i.active&&(!i.cabinet||i.cabinet.open&&i.cabinet.angle>1.2)&&Math.abs(player.pos.y-i.anchor.floor)<1&&Math.hypot(i.g.position.x-player.pos.x,i.g.position.z-player.pos.z)<2&&!obstruct(camera.position,i.g.position.clone().add(new THREE.Vector3(0,.3,0)))).sort((a,b)=>a.g.position.distanceTo(player.pos)-b.g.position.distanceTo(player.pos))[0];
 const ready=keys.KeyE&&interactReleased;
 if(!$('prompt').textContent){
 if(cabinet&&!cabinet.open){$('prompt').textContent='E 打开补给柜';if(ready){interactReleased=false;cabinet.open=true;sound('reload');}}
 else if(item){$('prompt').textContent=item.type==='ammo'?'E 拾取弹药 · +60 发':'E 拾取急救包 · +1';if(ready){interactReleased=false;if(item.type==='ammo'&&player.reserve>=300)message('备弹已满 · 最多 300 发');else if(item.type==='med'&&player.med>=3)message('急救包已满 · 最多 3 个');else{if(item.type==='ammo')player.reserve=Math.min(300,player.reserve+60);else player.med++;item.active=false;item.g.visible=false;collected++;sound('reload');message(item.type==='ammo'?'弹药已补充':'已拾取急救包 · H 使用',2);}}}
 else if(cabinet&&cabinet.open){$('prompt').textContent=cabinet.item?.active?'补给柜已打开 · 靠近物资按 E 拾取':'E 关闭空补给柜';if(ready&&!cabinet.item?.active){interactReleased=false;cabinet.open=false;sound('reload');}}
 }
 // No enemies or items pop into the player's room or visible doorway.
 for(const b of buildings){if(!b.slots.some(e=>e.dead)&&!b.supplySlots.some(i=>!i.active))continue;b.spawnTimer-=dt;if(b.spawnTimer>0||Math.hypot(player.pos.x-b.x,player.pos.z-b.z)<24)continue;
 const missing=b.slots.filter(e=>e.dead),used=b.slots.filter(e=>!e.dead).map(e=>e.g.position).concat(b.supplySlots.filter(i=>i.active).map(i=>i.g.position));let refreshed=false;
 for(const e of missing){const pos=randomPoint(b,used);if(!pos||!obstruct(camera.position,pos.clone().add(new THREE.Vector3(0,1.5,0))))continue;used.push(pos);e.g.position.copy(pos);e.g.rotation.set(0,range(0,6.28),0);if(e.rig){e.rig.death=0;e.rig.last.copy(pos);}e.health=100;e.dead=false;e.alert=0;e.cool=2;e.home.copy(pos);refreshed=true;}
 for(const item of b.supplySlots.filter(i=>!i.active)){const pos=item.anchor.pos;if(!obstruct(camera.position,pos.clone().add(new THREE.Vector3(0,.35,0))))continue;item.g.position.copy(pos);item.active=true;item.g.visible=!item.cabinet||item.cabinet.open;refreshed=true;}
 b.spawnTimer=refreshed?75+range(0,25):5;
 }
}
const gun=new THREE.Group();gunScene.add(gun);const weaponRig=AshVisuals.weapon(gun);
const muzzle=new THREE.Mesh(new THREE.ConeGeometry(.095,.32,6),new THREE.MeshBasicMaterial({color:0xffd090,transparent:true,opacity:.9}));muzzle.rotation.x=-Math.PI/2;muzzle.position.set(0,.02,-1.02);gun.add(muzzle);muzzle.visible=false;
const flash=new THREE.PointLight(0xffad51,0,4);flash.position.set(0,0,-.9);gun.add(flash);
const player={pos:new THREE.Vector3(-3,0,53),yaw:0,pitch:0,hp:100,stamina:100,ammo:30,reserve:150,med:1,vy:0,crouch:false};let hadPointerLock=false;let state='menu',started=false,keys={},aim=false,firing=false,step=0,reload=0,shotCD=0,kick=0,hurt=0,hit=0,flashTime=0,elapsed=0,kills=0,shots=0,shotHits=0,objective=0,interact=0,messageTime=0,footCD=0,ads=0,settingFrom='menu',sensitivity=1,volume=.5,audio=null,ambient=null;
function message(s,t=3){$('message').textContent=s;messageTime=t}function sound(type){if(!audio||audio.state!=='running'||volume===0)return;let duration=type==='shot'?.17:type==='step'?.09:type==='reload'?.16:.45;const b=audio.createBuffer(1,audio.sampleRate*duration,audio.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*(type==='shot'?9:5));const src=audio.createBufferSource();src.buffer=b;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='shot'?2400:type==='step'?260:1100;const gain=audio.createGain();gain.gain.value=volume*(type==='shot'?.55:type==='step'?.1:.24);src.connect(filter).connect(gain).connect(audio.destination);src.start();}
function initAudio(){if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();const buf=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.1;let s=audio.createBufferSource();s.buffer=buf;s.loop=true;let f=audio.createBiquadFilter();f.type='lowpass';f.frequency.value=280;ambient=audio.createGain();ambient.gain.value=.2*volume;s.connect(f).connect(ambient).connect(audio.destination);s.start()}audio.resume()}
const ray=new THREE.Raycaster();function obstruct(a,b){let dir=b.clone().sub(a),dist=dir.length();ray.set(a,dir.normalize());ray.far=dist;return ray.intersectObjects(solidMeshes,false).length>0}
function canStand(x,z,y=0,height=1.75){return !colliders.some(c=>y<c.top-.025&&y+height>c.bottom+.025&&Math.abs(x-c.x)<c.w+.28&&Math.abs(z-c.z)<c.d+.28)}
function groundAt(x,z,maxY){let floor=0;for(const q of walkSurfaces){const margin=q.ramp?0:.29;if(Math.abs(x-q.x)>q.w+margin||Math.abs(z-q.z)>q.d+margin)continue;const y=q.ramp?q.y+(q.z+5.8-z)/11.6*FLOOR:q.y;if(y<=maxY+.025)floor=Math.max(floor,y);}return floor;}
function move(dx,dz){const n=Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.12)||1;for(let i=0;i<n;i++)for(const [ax,delta]of [['x',dx/n],['z',dz/n]]){if(!delta)continue;const x=player.pos.x+(ax==='x'?delta:0),z=player.pos.z+(ax==='z'?delta:0);const floor=groundAt(x,z,player.pos.y+.22);let y=player.pos.y;if(player.vy<=0&&Math.abs(floor-y)<.25)y=floor;if(canStand(x,z,y,player.crouch?1.05:1.75)){player.pos[ax]+=delta;player.pos.y=y;}}player.pos.x=clamp(player.pos.x,-69,69);player.pos.z=clamp(player.pos.z,-60,70);}
function verticalStep(dt){const oldY=player.pos.y;player.vy-=12*dt;let next=oldY+player.vy*dt;const floor=groundAt(player.pos.x,player.pos.z,oldY+.03);if(player.vy<=0&&next<=floor){next=floor;player.vy=0;}if(player.vy>0&&!canStand(player.pos.x,player.pos.z,next,player.crouch?1.05:1.75)){next=oldY;player.vy=0;}player.pos.y=next;}
function onGround(){return Math.abs(player.pos.y-groundAt(player.pos.x,player.pos.z,player.pos.y+.03))<.04&&player.vy<=0;}
function startReload(){if(reload||player.ammo===30||player.reserve<=0)return;reload=2.35;aim=false;sound('reload');message('更换弹匣',2)}
function shoot(){if(reload||shotCD>0||state!=='playing'||(keys.ShiftLeft&&player.stamina>1&&!aim&&!player.crouch))return;if(player.ammo<=0){startReload();return}player.ammo--;shots++;shotCD=.103;flashTime=.055;kick+=.035;player.pitch=clamp(player.pitch+.009,-1.3,1.3);player.yaw+=range(-.002,.002);sound('shot');const dir=new THREE.Vector3();camera.getWorldDirection(dir);const spread=aim?.0016:.013;dir.x+=range(-spread,spread);dir.y+=range(-spread,spread);dir.z+=range(-spread,spread);dir.normalize();const start=camera.position.clone().addScaledVector(dir,.3);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,start.clone().addScaledVector(dir,-.9)]),new THREE.LineBasicMaterial({color:0xe9c985,transparent:true,opacity:.55}));scene.add(line);bullets.push({pos:start,vel:dir.multiplyScalar(190),life:1.2,line});for(const e of enemies)if(!e.dead&&e.g.position.distanceTo(player.pos)<38)e.alert=8;}
function impact(pos,enemy=false){const mesh=new THREE.Mesh(new THREE.SphereGeometry(enemy?.07:.035,5,5),new THREE.MeshBasicMaterial({color:enemy?0xbdb49a:0xd9c59a}));mesh.position.copy(pos);scene.add(mesh);effects.push({m:mesh,life:.16,max:.16})}
function kill(e){e.dead=true;kills++;if(e.rig){e.rig.death=0;e.rig.deathY=e.g.position.y;}message(`威胁解除 · 累计 ${kills}`,1.7)}
function damage(amount){player.hp=Math.max(0,player.hp-amount);hurt=.65;sound('hurt');if(player.hp<=0)finish(false)}
function finish(won){state='end';setGameCursor(false);document.exitPointerLock?.();keys={};firing=false;aim=false;$('end').classList.remove('hidden');$('hud').classList.add('hidden');$('pause').classList.add('hidden');$('endlabel').textContent=won?'EXTRACTION CONFIRMED':'OPERATOR DOWN';$('endtitle').textContent=won?'成功撤离':'行动中断';$('endtext').textContent=(won?'干扰已解除，你已抵达撤离点。':'你倒在了工业区。利用掩体和侧翼路线，避免在开阔街道停留。')+` 用时 ${Math.floor(elapsed/60)} 分 ${Math.floor(elapsed%60)} 秒 · 击倒 ${kills} · 命中率 ${shots?Math.round(shotHits/shots*100):0}%。`;if(audio)audio.suspend()}
function setGameCursor(hidden){$('world').style.cursor=hidden?'none':'default';$('hud').style.cursor=hidden?'none':'default';}
async function capture(){try{await $('world').requestPointerLock()}catch{message('移动鼠标即可转向 · 触及窗口边缘时可用方向键继续转向',6)}}
function play(){initAudio();setGameCursor(true);if(!started){if($('deployment').value!=='street'){const b=buildings[$('deployment').value==='west'?7:11];player.pos.set(b.x,0,b.z+b.d/2-1);}}started=true;state='playing';$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('hud').classList.remove('hidden');keys={};firing=false;capture();message('房屋可穿行 · E 拾取补给 · 离开建筑后会随机补充守卫与物资',7)}
function pause(){if(state!=='playing')return;state='paused';setGameCursor(false);keys={};aim=false;firing=false;$('pause').classList.remove('hidden');if(audio)audio.suspend()}
function reset(){location.reload()}
$('start').onclick=play;$('resume').onclick=play;$('restart').onclick=reset;$('restartPause').onclick=reset;
function settings(from){settingFrom=from;$(from).classList.add('hidden');$('settings').classList.remove('hidden')}$('settingsButton').onclick=()=>settings('menu');$('pauseSettings').onclick=()=>settings('pause');$('backSettings').onclick=()=>{$('settings').classList.add('hidden');$(settingFrom).classList.remove('hidden')};$('sensitivity').oninput=e=>sensitivity=+e.target.value;$('volume').oninput=e=>{volume=+e.target.value;if(ambient)ambient.gain.value=volume*.2};$('quality').onchange=e=>{renderer.setPixelRatio(Math.min(devicePixelRatio,+e.target.value));renderer.shadowMap.enabled=+e.target.value>=1};
$('world').onclick=()=>{if(state==='playing'&&document.pointerLockElement!==$('world'))capture()};document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement)hadPointerLock=true;else if(hadPointerLock){hadPointerLock=false;pause()}});document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();document.exitPointerLock?.()}});window.addEventListener('blur',()=>{pause();document.exitPointerLock?.()});
document.addEventListener('mousemove',e=>{if(state==='playing'&&(document.pointerLockElement||e.target===$('world'))){let s=.002*sensitivity*(aim?.55:1);player.yaw-=(e.movementX||0)*s;player.pitch=clamp(player.pitch-(e.movementY||0)*s,-1.35,1.35)}});document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('mousedown',e=>{if(state==='playing'&&e.target===$('world')){if(e.button===0)firing=true;if(e.button===2&&!reload)aim=true}});document.addEventListener('mouseup',e=>{if(e.button===0)firing=false;if(e.button===2)aim=false});
document.addEventListener('keydown',e=>{if(['Space','Tab','KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(state!=='playing')return;keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyR')startReload();if(e.code==='KeyC'&&(player.crouch?canStand(player.pos.x,player.pos.z,player.pos.y,1.75):true))player.crouch=!player.crouch;if(e.code==='Space'&&onGround()&&!player.crouch){player.vy=4.4;player.stamina=Math.max(0,player.stamina-12)}if(e.code==='KeyH'&&player.med&&player.hp<100){player.med--;player.hp=Math.min(100,player.hp+55);message('已使用急救包 · 恢复 55 生命',3);sound('reload')}if(e.code==='Escape'){pause();document.exitPointerLock?.()}});document.addEventListener('keyup',e=>keys[e.code]=false);
function updateAI(dt){for(const e of enemies){if(e.dead)continue;let to=player.pos.clone().sub(e.g.position),dist=to.length();let from=e.g.position.clone().add(new THREE.Vector3(0,1.5,0)),target=camera.position.clone(),visible=elapsed>4&&dist<32&&!obstruct(from,target);if(visible)e.alert=5;else e.alert=Math.max(0,e.alert-dt);if(e.alert>0){e.g.rotation.y=Math.atan2(to.x,to.z);if(dist>12&&dist<42){const speed=.85,dx=to.x/dist*dt*speed,dz=to.z/dist*dt*speed;const ex=e.g.position.x+dx,ez=e.g.position.z+dz,ey=groundAt(ex,ez,e.g.position.y+.2);if(Math.abs(ey-e.g.position.y)<.25&&canStand(ex,ez,ey))e.g.position.set(ex,ey,ez);e.phase+=dt*7}else for(let l of e.limbs)l.rotation.x=0;e.cool-=dt;if(visible&&e.cool<0&&dist>1){e.cool=range(.7,1.5);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([from,target.clone().add(new THREE.Vector3(range(-.6,.6),range(-.3,.4),0))]),new THREE.LineBasicMaterial({color:0xe6bc6b,transparent:true,opacity:.55}));scene.add(line);effects.push({m:line,life:.07,max:.07});let chance=(player.crouch?.22:.38)*(dist<20?1: .65);if(rand()<chance)damage(range(9,15));else if(rand()<.35){hurt=Math.max(hurt,.1);message('遭到火力压制 · 寻找掩体',1)}}}else{e.phase+=dt*.6;e.g.rotation.y=Math.sin(e.phase)*.6+Math.PI;}}}
function updateBullets(dt){for(let i=bullets.length-1;i>=0;i--){const b=bullets[i],old=b.pos.clone();b.vel.y-=9.81*dt;const delta=b.vel.clone().multiplyScalar(dt);ray.set(old,delta.clone().normalize());ray.far=delta.length();const targets=solidMeshes.concat(enemyParts.filter(p=>!p.userData.enemy.dead));const hits=ray.intersectObjects(targets,false);b.life-=dt;if(hits.length){const h=hits[0],e=h.object.userData.enemy;impact(h.point,!!e);if(e){e.health-=h.object.userData.head?110:36;e.alert=10;hit=.13;shotHits++;if(e.health<=0)kill(e)}b.life=0}b.pos.add(delta);const positions=b.line.geometry.attributes.position;positions.setXYZ(0,b.pos.x,b.pos.y,b.pos.z);const tail=b.pos.clone().addScaledVector(b.vel,-.006);positions.setXYZ(1,tail.x,tail.y,tail.z);positions.needsUpdate=true;b.line.geometry.computeBoundingSphere();if(b.life<=0||b.pos.y<0){scene.remove(b.line);b.line.geometry.dispose();b.line.material.dispose();bullets.splice(i,1)}}}
function hud(){const dir=((player.yaw*-180/Math.PI)%360+360)%360;$('compass').textContent=`${['N','NE','E','SE','S','SW','W','NW'][Math.round(dir/45)%8]}  ${Math.round(dir).toString().padStart(3,'0')}°`;$('hp').textContent=Math.ceil(player.hp).toString().padStart(3,'0');$('healthbar').style.width=player.hp+'%';$('healthbar').style.background=player.hp<35?'#ca725d':'#cfdbbd';$('stamina').style.width=player.stamina+'%';$('ammo').textContent=player.ammo.toString().padStart(2,'0');$('reserve').textContent=' / '+player.reserve;$('med').textContent='生命 / 急救 × '+player.med;$('weaponstate').textContent=reload?`换弹中 ${reload.toFixed(1)}s`:player.crouch?'CROUCHED':aim?'ADS / 瞄准':'AUTO / 连发';$('cross').style.opacity=aim?0:.55;$('reddot').style.opacity=aim&&!reload?1:0;$('hit').style.opacity=hit>0?1:0;$('hurt').style.opacity=hurt;$('distance').textContent=(objective?'撤离点':'通讯站')+' ◇ '+Math.round(player.pos.distanceTo(objective?extract.position:new THREE.Vector3(5,0,-49)))+' m';const ctx=$('map').getContext('2d');ctx.clearRect(0,0,200,200);ctx.fillStyle='#263334';for(const c of colliders){const fy=Math.floor((player.pos.y+.15)/FLOOR)*FLOOR;if(c.bottom>fy+2||c.top<=fy+.05)continue;ctx.fillRect(100+(c.x-c.w)*1.3,96+(c.z-c.d)*1.3,c.w*2.6,c.d*2.6)}for(const b of buildings){ctx.fillStyle=b.visited?'#709a7955':'#647c6a22';ctx.fillRect(100+(b.x-7)*1.3,96+(b.z-8)*1.3,18,21)}ctx.strokeStyle='#bcc9b933';ctx.strokeRect(12,7,176,186);ctx.fillStyle='#dbc892';let t=objective?extract.position:{x:5,z:-49};ctx.fillRect(97+t.x*1.3,93+t.z*1.3,6,6);ctx.fillStyle='#d59870';for(let e of enemies)if(!e.dead&&e.alert>0&&e.g.position.distanceTo(player.pos)<25)ctx.fillRect(98+e.g.position.x*1.3,94+e.g.position.z*1.3,4,4);ctx.save();ctx.translate(100+player.pos.x*1.3,96+player.pos.z*1.3);ctx.rotate(-player.yaw);ctx.fillStyle='#e5e9dc';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-4,4);ctx.lineTo(4,4);ctx.fill();ctx.restore();ctx.fillStyle='#b5c5ba';ctx.font='10px monospace';ctx.fillText('N',96,12)}
const architecturalMaps=new Set([concrete.map,interiorMat.map,floorMat.map]);
const pbrMaterials=[];for(const mat of new Set([...staticBatches.keys(),concrete,interiorMat,floorMat,road])){if(mat===road)pbrMaterials.push([mat,'asphalt']);else if(architecturalMaps.has(mat.map))pbrMaterials.push([mat,'concrete']);}
applyAshSurfaces(renderer,scene,pbrMaterials);
let last=performance.now();function loop(now){requestAnimationFrame(loop);let dt=Math.min((now-last)/1000,.04);last=now;if(state==='playing'){elapsed+=dt;player.yaw+=((keys.ArrowLeft?1:0)-(keys.ArrowRight?1:0))*dt*1.4;player.pitch=clamp(player.pitch+((keys.ArrowUp?1:0)-(keys.ArrowDown?1:0))*dt,-1.35,1.35);shotCD-=dt;flashTime-=dt;hit-=dt;hurt=Math.max(0,hurt-dt*.8);messageTime-=dt;if(messageTime<=0)$('message').textContent='';if(reload>0){reload-=dt;if(reload<=0){reload=0;const add=Math.min(30-player.ammo,player.reserve);player.ammo+=add;player.reserve-=add;sound('reload')}}ads=lerp(ads,aim?1:0,Math.min(1,dt*12));let forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),right=(keys.KeyD?1:0)-(keys.KeyA?1:0);let moving=!!(forward||right),sprinting=keys.ShiftLeft&&moving&&!aim&&!player.crouch&&player.stamina>1;player.stamina=clamp(player.stamina+dt*(sprinting?-20:12),0,100);const speed=player.crouch?1.65:aim?2.1:sprinting?6:3.6;const len=Math.hypot(forward,right)||1;move((-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*right)/len*speed*dt,(-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*right)/len*speed*dt);verticalStep(dt);step+=dt*(moving?sprinting?13:9:1);footCD-=dt;if(moving&&footCD<0&&onGround()){sound('step');footCD=sprinting?.3:.48}let bob=moving?Math.sin(step)*.026*(aim?.25:1):Math.sin(step)*.006;camera.position.set(player.pos.x,player.pos.y+(player.crouch?1.06:1.7)+bob,player.pos.z);camera.rotation.set(player.pitch+kick*.18,player.yaw,0);camera.fov=lerp(76,51,ads);camera.updateProjectionMatrix();if(firing)shoot();kick=lerp(kick,0,Math.min(dt*14,1));gun.position.set(lerp(.26,0,ads)+Math.sin(step*.5)*.003*(1-ads),lerp(-.24,-.30,ads)+bob*.3*(1-ads)-kick*.28+Math.sin(elapsed*1.8)*.0015,lerp(-.43,-.65,ads)+kick);gun.rotation.set(kick*.8+(sprinting?.2:0),sprinting?-.2:0,-kick*.5+(sprinting?-.15:0));if(reload>0){gun.rotation.x=-.55*Math.sin((2.35-reload)/2.35*Math.PI);gun.position.y-=.25*Math.sin((2.35-reload)/2.35*Math.PI)}muzzle.visible=flashTime>0;flash.intensity=flashTime>0?3:0;updateBullets(dt);updateAI(dt);for(const e of enemies){AshVisuals.animateSoldier(e,dt,elapsed);const distance=e.g.position.distanceTo(player.pos);e.g.visible=distance<75;e.g.traverse(m=>{if(m.userData.detail)m.visible=distance<22;});}AshVisuals.animateWeapon(weaponRig,dt,reload,kick,aim,sprinting,elapsed);const near=player.pos.distanceTo(new THREE.Vector3(5,0,-49))<3.4;if(!objective&&near){$('prompt').textContent='按住 E 关闭干扰设备';if(keys.KeyE){interact+=dt;$('progress').classList.remove('hidden');$('progressFill').style.width=Math.min(100,interact/4*100)+'%';if(interact>=4){objective=1;led.material.color.setHex(0x91d2a3);$('task').textContent='抵达南侧撤离点';$('sub').textContent='通讯已恢复 · 沿街区返回撤离标记';$('prompt').textContent='';$('progress').classList.add('hidden');message('通讯恢复。撤离车辆正在南侧等候。',6)}}else{interact=0;$('progress').classList.add('hidden')}}else{interact=0;$('prompt').textContent='';$('progress').classList.add('hidden')}updateDistrict(dt);if(objective&&player.pos.distanceTo(extract.position)<3)finish(true);hud();}else if(state==='menu'){if($('deployment').value==='west'||$('deployment').value==='east'){const b=buildings[$('deployment').value==='west'?7:11];camera.position.set(b.x,1.7,b.z+b.d/2-1);camera.rotation.set(0,0,0)}else{camera.position.set(-9,4.2,48);camera.rotation.set(-.055,-.12+Math.sin(now*.00008)*.035,0)}}for(const s of smokes){if(state==='playing'||state==='menu'){s.position.y+=dt*.48;s.position.x+=dt*.12;if(s.position.y>28){s.position.y=2;s.position.x=-18+rand()*4}}}if(state==='playing')for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.m.material.opacity=Math.max(0,e.life/e.max);e.m.material.transparent=true;if(e.life<=0){scene.remove(e.m);e.m.geometry.dispose();e.m.material.dispose();effects.splice(i,1)}}renderer.clear();renderer.render(scene,camera);if(started&&state!=='end'){renderer.clearDepth();renderer.render(gunScene,gunCamera)}}requestAnimationFrame(loop);
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;gunCamera.aspect=camera.aspect;camera.updateProjectionMatrix();gunCamera.updateProjectionMatrix()});
// Read-only diagnostics for confirming the renderer and initial mission state.
window.gameDiagnostics=()=>({state,renderer:renderer.info.render,enemyCount:enemies.length,alive:enemies.filter(e=>!e.dead).length,health:player.hp,ammo:player.ammo,position:player.pos.toArray(),objective,buildings:buildings.length,supplies:supplies.filter(i=>i.active).length,collected,errors:$('error').textContent});
