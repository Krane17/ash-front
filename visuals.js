'use strict';
// Original runtime geometry and animation. Shared meshes keep memory bounded.
const AshVisuals=(()=>{
 const roundedCache=new Map(),sphere=new THREE.SphereGeometry(1,16,12),capsule=new THREE.CapsuleGeometry(1,1,4,10);
 function rounded(w,h,d,r=.02){const key=[w,h,d,r].join(',');if(roundedCache.has(key))return roundedCache.get(key);r=Math.min(r,w*.22,h*.22,d*.22);const g=new THREE.BoxGeometry(w,h,d,3,3,3),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),cx=THREE.MathUtils.clamp(x,-w/2+r,w/2-r),cy=THREE.MathUtils.clamp(y,-h/2+r,h/2-r),cz=THREE.MathUtils.clamp(z,-d/2+r,d/2-r),n=new THREE.Vector3(x-cx,y-cy,z-cz).normalize();a.setXYZ(i,cx+n.x*r,cy+n.y*r,cz+n.z*r)}g.computeVertexNormals();roundedCache.set(key,g);return g;}
 function mesh(g,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function rb(p,mat,x,y,z,w,h,d,r=.02){return mesh(rounded(w,h,d,r),mat,p,x,y,z)}
 function ell(p,mat,x,y,z,w,h,d){const m=mesh(sphere,mat,p,x,y,z);m.scale.set(w,h,d);return m;}
 function tube(p,mat,x,y,z,r1,r2,l,axis='y',segments=12){const m=mesh(new THREE.CylinderGeometry(r1,r2,l,segments),mat,p,x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return m;}
 function clothTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#6c7057';ctx.fillRect(0,0,256,256);let v=910;const rnd=()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296};for(let i=0;i<260;i++){ctx.fillStyle=['#3e4738','#888169','#535b45','#a6a084'][i%4];ctx.beginPath();const x=rnd()*256,y=rnd()*256;ctx.moveTo(x,y);for(let j=0;j<7;j++)ctx.lineTo(x+Math.cos(j*.9)*rnd()*24,y+Math.sin(j*.9)*rnd()*15);ctx.fill()}for(let i=0;i<256;i+=2){ctx.fillStyle='#ffffff0a';ctx.fillRect(0,i,256,1);ctx.fillStyle='#00000010';ctx.fillRect(i,0,1,256)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
 const cloth=new THREE.MeshStandardMaterial({map:clothTexture(),roughness:.95}),gear=new THREE.MeshStandardMaterial({color:0x555442,roughness:.88}),rubber=new THREE.MeshStandardMaterial({color:0x232824,roughness:.86}),skin=new THREE.MeshStandardMaterial({color:0xa38770,roughness:.8}),steel=new THREE.MeshStandardMaterial({color:0x53595a,metalness:.8,roughness:.38}),lens=new THREE.MeshStandardMaterial({color:0x20333b,metalness:.7,roughness:.12}),thread=new THREE.MeshStandardMaterial({color:0x8a846a,roughness:1});
 function soldier(e,hitParts){const root=e.g,torso=new THREE.Group();torso.position.y=.96;root.add(torso);e.rig={torso,legs:[],arms:[],last:root.position.clone(),walk:0,death:0};
 ell(torso,cloth,0,.25,0,.25,.34,.145);rb(torso,gear,0,.25,.11,.43,.45,.13,.04);rb(torso,gear,0,.23,-.15,.37,.43,.17,.055);
 for(let i=-1;i<=1;i++){rb(torso,gear,i*.115,.18,.2,.095,.2,.065,.015);rb(torso,thread,i*.115,.26,.237,.078,.016,.008,.004)}
 for(const x of [-.18,.18])rb(torso,gear,x,.49,.015,.065,.08,.3,.015);
 for(let y=.05;y<.45;y+=.075)rb(torso,thread,0,y,.184,.37,.012,.008,.004);
 rb(torso,rubber,0,-.01,0,.39,.09,.29);rb(torso,steel,0,-.015,.16,.07,.055,.02,.008);
 tube(torso,skin,0,.54,0,.065,.075,.12);ell(torso,skin,0,.69,.005,.126,.16,.119);ell(torso,skin,0,.65,.115,.034,.05,.035);
 const helmet=mesh(new THREE.SphereGeometry(.15,18,12,0,Math.PI*2,0,Math.PI*.58),gear,torso,0,.75,-.005);helmet.scale.set(1,1,1.1);
 rb(torso,rubber,0,.73,.115,.25,.067,.045,.015);for(const side of [-1,1]){rb(torso,lens,side*.062,.73,.142,.102,.045,.014,.01);ell(torso,rubber,side*.14,.66,0,.026,.062,.055);rb(torso,gear,side*.13,.81,0,.025,.035,.14,.006)}
 rb(torso,gear,0,.56,.07,.2,.09,.15,.02); // scarf under the face
 for(const side of [-1,1]){const hip=new THREE.Group();hip.position.set(side*.13,.9,0);root.add(hip);ell(hip,cloth,0,-.18,0,.105,.235,.105);const knee=new THREE.Group();knee.position.y=-.39;hip.add(knee);ell(knee,cloth,0,-.16,-.018,.085,.205,.085);rb(knee,gear,0,0,.08,.13,.13,.055,.025);ell(knee,rubber,0,-.37,.055,.095,.105,.16);rb(knee,rubber,0,-.43,.045,.18,.04,.3,.015);e.rig.legs.push({hip,knee});
 const shoulder=new THREE.Group();shoulder.position.set(side*.275,.4,0);torso.add(shoulder);shoulder.rotation.x=-.35;shoulder.rotation.z=side*.18;ell(shoulder,cloth,0,-.13,0,.085,.18,.09);const elbow=new THREE.Group();elbow.position.y=-.28;elbow.rotation.x=-1.13;shoulder.add(elbow);ell(elbow,cloth,0,-.12,0,.072,.155,.075);ell(elbow,rubber,0,-.27,.01,.065,.08,.065);e.rig.arms.push({shoulder,elbow});}
 const rifle=new THREE.Group();rifle.position.set(.06,.23,.27);rifle.rotation.x=.04;torso.add(rifle);rb(rifle,rubber,0,0,.12,.09,.105,.45,.008);tube(rifle,steel,0,0,.43,.02,.02,.35,'z');rb(rifle,rubber,0,-.11,.05,.065,.2,.08,.008);rb(rifle,gear,0,.06,.06,.065,.035,.17,.008);
 root.traverse(m=>{if(m.isMesh){m.geometry.computeBoundingBox();const sz=m.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(m.scale);m.userData.detail=Math.max(sz.x,sz.y,sz.z)<.21;m.userData.enemy=e;m.userData.head=m.parent===torso&&m.position.y>.52;hitParts.push(m)}});
 }
 function animateSoldier(e,dt,time){const r=e.rig;if(!r)return;if(e.dead){r.death=Math.min(1,r.death+dt*2.4);e.g.rotation.z=Math.sin(r.death*Math.PI/2)*1.45;e.g.position.y=(r.deathY??e.home.y)+.08*r.death;r.torso.rotation.x=-r.death*.18;return;}r.torso.rotation.x=0;const distance=e.g.position.distanceTo(r.last);r.last.copy(e.g.position);r.walk=THREE.MathUtils.lerp(r.walk,distance>dt*.12?1:0,Math.min(1,dt*8));const phase=e.phase*1.4;for(let i=0;i<2;i++){const swing=Math.sin(phase+i*Math.PI);r.legs[i].hip.rotation.x=swing*.42*r.walk;r.legs[i].knee.rotation.x=Math.max(0,-swing)*.65*r.walk;r.arms[i].shoulder.rotation.x=-.35+Math.sin(phase+i*Math.PI)*.06*r.walk;}r.torso.position.y=.96+Math.sin(time*2.2+e.phase)*.006+Math.abs(Math.sin(phase))*.016*r.walk;r.torso.rotation.z=Math.sin(phase)*.025*r.walk;}
 function weapon(g){const gunsteel=new THREE.MeshStandardMaterial({color:0x434c50,metalness:.8,roughness:.31}),poly=new THREE.MeshStandardMaterial({color:0x303936,roughness:.76}),tan=new THREE.MeshStandardMaterial({color:0x777665,roughness:.9}),edge=new THREE.MeshStandardMaterial({color:0x7a8180,metalness:.8,roughness:.4});
 const part=(x,y,z,w,h,d,m=gunsteel,r=.01)=>rb(g,m,x,y,z,w,h,d,r);
 part(0,0,0,.12,.16,.43);part(0,-.095,.045,.105,.09,.28);tube(g,gunsteel,0,.045,-.42,.052,.052,.4,'z',18);part(0,.012,-.36,.12,.13,.38,poly);
 for(let i=0;i<8;i++){part(-.063,.015,-.22-i*.042,.007,.045,.026,rubber,.003);part(.063,.015,-.22-i*.042,.007,.045,.026,rubber,.003);part(0,-.062,-.22-i*.042,.07,.006,.026,rubber,.003)}
 tube(g,gunsteel,0,.028,-.67,.022,.022,.26,'z',20);tube(g,poly,0,.028,-.825,.034,.03,.075,'z',16);for(let i=0;i<5;i++)part(.031,.028,-.8-i*.01,.005,.026,.005,rubber,.001);
 part(0,.09,-.17,.07,.024,.68);for(let i=0;i<17;i++)part(0,.108,.13-i*.039,.09,.012,.016,edge,.002);
 part(0,-.2,.15,.075,.23,.105,poly).rotation.x=-.28;
 const mag=new THREE.Group();mag.position.set(0,-.12,-.055);g.add(mag);rb(mag,poly,0,-.09,0,.075,.23,.125,.015).rotation.x=-.12;for(let i=0;i<4;i++)rb(mag,gunsteel,.039,-.08+i*.04,0,.005,.012,.1,.002);
 part(0,.01,.31,.075,.075,.27,poly);part(0,-.015,.445,.13,.17,.11,poly,.02);part(0,-.015,.51,.14,.18,.025,rubber,.008);
 // Trigger guard, selector, ejection port, receiver fasteners.
 part(.063,.02,.04,.006,.052,.115,rubber,.003);part(.068,-.012,.12,.012,.018,.035,edge,.004);for(const z of [-.1,.12])tube(g,edge,.065,-.035,z,.008,.008,.008,'x',10);
 part(0,-.185,.025,.07,.014,.12,poly);part(0,-.15,-.027,.07,.07,.012,poly);
 part(0,.178,-.12,.07,.13,.07,poly);
 part(-.085,.30,-.12,.012,.14,.025);part(.085,.30,-.12,.012,.14,.025);part(0,.375,-.12,.18,.012,.025);part(0,.225,-.12,.18,.012,.025);
 // Curved forearms, sleeves and individually shaped gloved fingers.
 const left=new THREE.Group(),right=new THREE.Group();g.add(left,right);
 const limb=(parent,a,b,rad,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),mid=av.clone().add(bv).multiplyScalar(.5);const m=tube(parent,mat,mid.x,mid.y,mid.z,rad*.85,rad,av.distanceTo(bv));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),av.sub(bv).normalize());};
 limb(right,[.1,-.20,.2],[.24,-.39,.53],.07,cloth);ell(right,rubber,.08,-.19,.16,.065,.1,.065);for(let i=0;i<4;i++)ell(right,tan,.035+i*.025,-.17,.115,.014,.035,.035);
 limb(left,[-.08,-.12,-.36],[-.27,-.35,.12],.075,cloth);ell(left,rubber,-.055,-.095,-.35,.075,.065,.085);for(let i=0;i<4;i++)ell(left,tan,-.055+i*.028,-.05,-.35,.014,.038,.05);
 const bolt=part(.075,.04,-.01,.014,.018,.07,edge);
 return {mag,left,right,bolt};
 }
 function animateWeapon(r,dt,reload,kick,aim,sprint,t){if(!r)return;const progress=reload>0?1-reload/2.35:0;const reach=reload>0?Math.sin(Math.min(1,progress*1.8)*Math.PI):0;r.left.position.set(.05*reach,-.17*reach,.3*reach);r.left.rotation.x=-.65*reach;r.mag.position.y=-.12-(reload>0?Math.pow(Math.sin(progress*Math.PI),2)*.35:0);r.mag.rotation.x=reload>0?Math.sin(progress*Math.PI)*.24:0;r.bolt.position.z=-.01+Math.min(.07,kick*1.6);}
 return {rounded,rb,ell,tube,soldier,animateSoldier,weapon,animateWeapon,cloth,gear};
})();
function applyAshSurfaces(renderer,scene,materials){
 if(!renderer.capabilities||typeof ASH_TEXTURES==='undefined')return;
 const loader=new THREE.TextureLoader(),sets={};
 for(const name of ['concrete','asphalt']){sets[name]={};for(const type of ['Diffuse','nor_gl','Rough']){const t=loader.load(ASH_TEXTURES[name+'_'+type]);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(type==='Diffuse')t.colorSpace=THREE.SRGBColorSpace;sets[name][type]=t;}}
 for(const [mat,kind]of materials){const data=sets[kind];mat.map=data.Diffuse;mat.normalMap=data.nor_gl;mat.normalScale=new THREE.Vector2(kind==='asphalt'?.45:.5,kind==='asphalt'?.45:.5);mat.roughnessMap=data.Rough;mat.roughness=kind==='asphalt'?.82:.97;mat.metalness=0;mat.color.lerp(new THREE.Color(0xffffff),.5);
 // Metric UVs on both ordinary and instanced architecture: no stretched wall textures.
 mat.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
 vec4 surfacePosition=vec4(transformed,1.0);
 vec3 surfaceNormal=objectNormal;
 #ifdef USE_INSTANCING
 surfacePosition=instanceMatrix*surfacePosition;
 surfaceNormal=mat3(instanceMatrix)*surfaceNormal;
 #endif
 surfacePosition=modelMatrix*surfacePosition;
 surfaceNormal=abs(normalize(mat3(modelMatrix)*surfaceNormal));
 vec2 metricUv=surfaceNormal.y>0.5?surfacePosition.xz:(surfaceNormal.x>0.5?surfacePosition.zy:surfacePosition.xy);
 metricUv*=0.45;
 #ifdef USE_MAP
 vMapUv=metricUv;
 #endif
 #ifdef USE_NORMALMAP
 vNormalMapUv=metricUv;
 #endif
 #ifdef USE_ROUGHNESSMAP
 vRoughnessMapUv=metricUv;
 #endif`);};mat.customProgramCacheKey=()=> 'ash-metric-pbr-v1';mat.needsUpdate=true;
 }
 const skyCanvas=document.createElement('canvas');skyCanvas.width=1024;skyCanvas.height=512;const ctx=skyCanvas.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#536878');grad.addColorStop(.48,'#b5bcb8');grad.addColorStop(.6,'#b0afa0');grad.addColorStop(1,'#414a48');ctx.fillStyle=grad;ctx.fillRect(0,0,1024,512);
 for(let i=0;i<46;i++){const x=(i*137)%1024,y=50+(i*53)%170;const cloud=ctx.createRadialGradient(x,y,1,x,y,90);cloud.addColorStop(0,'rgba(224,224,211,.25)');cloud.addColorStop(1,'rgba(224,224,211,0)');ctx.fillStyle=cloud;ctx.fillRect(x-90,y-90,180,180);}
 const sky=new THREE.CanvasTexture(skyCanvas);sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;scene.background=sky;const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromEquirectangular(sky);scene.environment=env.texture;scene.environmentIntensity=.45;pmrem.dispose();
 const wet=new THREE.MeshStandardMaterial({color:0x59676b,roughness:.12,metalness:.28,transparent:true,opacity:.46,depthWrite:false});for(let i=0;i<26;i++){const patch=new THREE.Mesh(new THREE.CircleGeometry(1,18),wet);patch.rotation.x=-Math.PI/2;patch.position.set(((i*17)%23)-11,.016,((i*23)%111)-53);patch.scale.set(1+(i%3),.3+(i%4)*.2,1);scene.add(patch);}
}
