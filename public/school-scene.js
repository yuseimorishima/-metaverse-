import * as THREE from './vendor/three.js';
import {SOLIDS,DECOR,ROOMS} from './school-map.js?v=6';
import {createSpawnGuide} from './spawn-guide.js?v=6';
import {createSchoolMaterials} from './school-materials.js?v=6';
export function createSchool(scene){
 const group=new THREE.Group();scene.add(group);const materials=createSchoolMaterials(),batches=new Map();
 const unitBox=new THREE.BoxGeometry(1,1,1).toNonIndexed(),unitCylinder=new THREE.CylinderGeometry(1,1,1,10).toNonIndexed(),unitSphere=new THREE.IcosahedronGeometry(1,2).toNonIndexed();
 function add(kind,x,y,z,w,h,d,shape=unitBox){if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push({x,y,z,w,h,d,shape});}
 const box=(x,y,z,w,h,d,kind='plaster')=>add(kind,x,y,z,w,h,d);
 const pole=(x,y,z,r,h,kind='metal')=>add(kind,x,y,z,r,h,r,unitCylinder);
 function sign(text,x,y,z,rotation=0,width=3,height=.45,bg='#e8e7df',color='#293d3a'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,256);c.strokeStyle='#7c877d';c.lineWidth=8;c.strokeRect(6,6,1012,244);c.fillStyle=color;c.textAlign='center';c.font='600 76px sans-serif';c.fillText(text,512,154);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:texture,roughness:.7,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;group.add(m);
 }
 // Textures use metre-based UVs; surfaces retain their real grain size across boxes.
 box(0,-.32,14,148,.5,132,'grass');box(-12,-.04,-20,85,.16,31,'floor');box(-39.5,-.04,15,30,.16,40,'floor');box(51.5,-.04,-2.5,27,.16,45,'floor');
 box(1,-.02,15,60,.12,44,'tile');box(0,-.01,45,7,.12,60,'concrete');box(-12,.07,-8.5,84,.05,7,'tile');box(-28.5,.07,15,7,.05,40,'tile');
 function windowPanel(x,z,w,d,height=3.8){
  const alongX=w>d,length=Math.max(w,d),sections=Math.max(1,Math.round(length/3)),span=length/sections;
  for(let i=0;i<sections;i++){
   const a=-length/2+span*(i+.5),px=x+(alongX?a:0),pz=z+(alongX?0:a),width=span-.2;
   box(px,.46,pz,alongX?span:d,.92,alongX?d:span);box(px,height-.3,pz,alongX?span:d,.6,alongX?d:span);
   box(px,1,pz,alongX?span+.06:d+.1,.1,alongX?d+.1:span+.06,'concrete');
   box(px,2,pz,alongX?width:.05,1.9,alongX?.05:width,'glass');
   for(const offset of [-span/2+.06,0,span/2-.06])box(px+(alongX?offset:0),2,pz+(alongX?0:offset),alongX?.065:d+.07,2.05,alongX?d+.07:.065,'metal');
   for(const y of [1,2.15,3.02])box(px,y,pz,alongX?span:d+.07,.065,alongX?d+.07:span,'metal');
  }
 }
 function wall(b){const exterior=Math.abs(b.z+35)<.1||Math.abs(b.z+5)<.1||Math.abs(b.x+54)<.1||Math.abs(b.x-30)<.1;
  if(exterior&&Math.max(b.w,b.d)>2.5)windowPanel(b.x,b.z,b.w,b.d,b.h);else{box(b.x,b.y,b.z,b.w,b.h,b.d);box(b.x,.52,b.z,b.w+.025,1.04,b.d+.025,'paint');}
  box(b.x,.085,b.z,b.w+.04,.17,b.d+.04,'blackMetal');box(b.x,b.h+.05,b.z,b.w+.12,.12,b.d+.12,'concrete');
 }
 // Furniture is modelled as a top, steel frame, and individual legs, rather than a cube.
 function desk(b){const topY=b.h-.04;box(b.x,topY,b.z,b.w,.08,b.d,'wood');box(b.x,.56,b.z,b.w-.12,.09,b.d-.12,'metal');
  for(const dx of [-1,1])for(const dz of [-1,1]){pole(b.x+dx*(b.w/2-.1),.35,b.z+dz*(b.d/2-.1),.025,.7,'blackMetal');box(b.x+dx*(b.w/2-.1),.035,b.z+dz*(b.d/2-.1),.075,.05,.075,'blackMetal');}
 }
 function chair(b){box(b.x,.45,b.z,b.w,.065,b.d,'wood');box(b.x,.73,b.z+b.d/2-.05,b.w,.45,.06,'wood');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*(b.w/2-.06),.23,b.z+dz*(b.d/2-.07),.022,.46,'metal');}
 function shelf(b){for(const dz of [-1,1])box(b.x,1.2,b.z+dz*(b.d/2-.05),b.w,2.4,.1,'wood');box(b.x,1.2,b.z,.05,2.4,b.d,'wood');for(const y of [.12,.69,1.26,1.83,2.36])box(b.x,y,b.z,b.w,.06,b.d,'wood');
  for(const y of [.16,.73,1.3,1.87])for(let z=b.z-b.d/2+.2;z<b.z+b.d/2-.1;z+=.19){const index=Math.abs(Math.floor(z*31+y*9)),bookKind=['paint','dark','wood','chalk'][index%4],height=.25+(index%5)*.025;for(const side of [-1,1])box(b.x+side*b.w*.25,y+height/2,z,b.w*.4,height,.15,bookKind);}
 }
 for(const b of SOLIDS){
  if(b.kind==='notice-board'){box(b.x,b.y,b.z,b.w,b.h,b.d,'blackMetal');for(const dx of [-1.35,1.35])pole(b.x+dx,1.65,b.z,.065,3.3,'metal');continue;}
  if(b.color==='#e8e1ce'){wall(b);continue;}
  if(b.color==='#688d91'){chair(b);continue;}
  if(b.color==='#a97e59'&&b.z===-28){shelf(b);continue;}
  if(['#d9ac73','#b0c2bb','#c89c72'].includes(b.color)){desk(b);continue;}
  if(b.color==='#a97e59'&&b.h<1){box(b.x,.53,b.z,b.w,.08,b.d,'wood');for(const dx of [-1,1])box(b.x+dx*b.w*.35,.25,b.z,.12,.5,b.d*.8,'blackMetal');continue;}
  box(b.x,b.y,b.z,b.w,b.h,b.d,b.color==='#3b4351'?'dark':'concrete');
 }
 for(const b of DECOR)box(b.x,b.y,b.z,b.w,b.h,b.d);
 // Door casings, recessed panels, ceiling fixtures, skirting and noticeboards.
 for(const room of ROOMS.slice(0,4)){
  box(room.x,3.93,room.z,room.w,.22,room.d,'plaster');
  const door=room.doorX;
  for(const dx of [-1.86,1.86])box(door+dx,1.55,-12,.13,3.1,.55,'metal');box(door,3.13,-12,3.9,.12,.6,'metal');
  // Sliding leaves parked to the sides of the clear opening.
  for(const dx of [-2.65,2.65]){box(door+dx,.65,-11.75,1.45,1.3,.08,'wood');box(door+dx,2,-11.75,1.4,1.35,.04,'glass');for(const y of [1.3,2.75])box(door+dx,y,-11.75,1.5,.05,.12,'metal');}
  sign(room.name.replace('（仮）',''),door,3.4,-11.7,0,2.1,.38);sign(room.name.replace('（仮）',''),door,3.4,-12.3,Math.PI,2.1,.38);
  for(const x of [-5,5])for(const z of [-5,5]){box(room.x+x,3.78,room.z+z,1.4,.08,.24,'metal');box(room.x+x,3.73,room.z+z,1.28,.025,.17,'lamp');}
  box(room.x,1.8,-34.63,7.6,1.65,.08,'wood');box(room.x,1.8,-34.55,7.35,1.43,.04,'dark');box(room.x,.98,-34.42,7.6,.055,.2,'metal');
  sign(room.kind==='classroom'?'今日の予定：自由探索':room.name.replace('（仮）',''),room.x,1.9,-34.5,0,4.7,.5,'#31483d','#e9e5d1');
  // Warm indirect fill from the ceiling; the fixtures themselves have emissive faces.
  const fill=new THREE.PointLight('#fff1d6',24,25,2);fill.position.set(room.x,3.3,room.z);group.add(fill);
 }
 for(const [x,z,w,d] of [[-12,-8.5,84,7],[-43,15,22,40],[-28.5,15,7,40]])box(x,3.95,z,w,.2,d);
 for(let x=-50;x<29;x+=5){if(Math.abs(x)<3)continue;box(x,3.72,-8.5,1.2,.07,.25,'metal');box(x,3.67,-8.5,1.1,.035,.16,'lamp');}
 for(const x of [-52,28]){pole(x,1.9,-4.58,.065,3.8,'metal');box(x,3.75,-4.58,.3,.12,.3,'metal');}
 sign('竹早中学校',0,3.42,-4.57,0,3.5,.45);sign('校舎  ←　 /　 体育館  →',0,2.78,-4.57,0,3.6,.32);
 for(const room of ROOMS.slice(4,6))sign(room.name.replace('（仮）',''),-31.7,3,room.z,Math.PI/2,2,.35);
 // Shoe shelves flank the entrance; shared collision volumes are defined in school-map.js.
 for(const x of [-5,5]){for(const y of [.1,.45,.8,1.15,1.5])box(x,y,-8.4,2,.045,.48,'metal');for(const dx of [-1,0,1])box(x+dx,.8,-8.4,.04,1.5,.48,'metal');}
 // The gym has varnished timber, structural steel trusses and modest court markings.
 box(51.5,9,-2.5,28,.25,46,'concrete');for(const z of [-25,20]){windowPanel(51.5,z,27,.45,3.8);box(51.5,6.25,z,27,5,.45);}
 for(const x of [38,65]){box(x,6,-2.5,.45,4,45);for(let z=-23;z<20;z+=7)box(x+(x<50?.3:-.3),4.5,z,.2,9,.2,'blackMetal');}
 for(let z=-21;z<20;z+=8)box(51.5,8.5,z,27,.17,.18,'metal');
 for(const x of [40,63])box(x,.06,-2.5,.055,.012,38,'chalk');for(const z of [-21,16,-2.5])box(51.5,.06,z,23,.012,.055,'chalk');
 const centreRing=new THREE.Mesh(new THREE.TorusGeometry(2,.035,5,48),materials.chalk);centreRing.rotation.x=-Math.PI/2;centreRing.position.set(51.5,.07,-2.5);group.add(centreRing);
 for(const z of [-22,17]){box(51.5,3,z,2.2,1.25,.1,'chalk');const hoop=new THREE.Mesh(new THREE.TorusGeometry(.38,.035,6,24),materials.blackMetal);hoop.rotation.x=Math.PI/2;hoop.position.set(51.5,2.8,z+(z<0?.55:-.55));group.add(hoop);}
 sign('体育館',37.7,3.3,8,-Math.PI/2,2,.4);
 // Gravel schoolyard and worn track lines.
 box(22,-.03,55,76,.12,36,'track');box(22,.02,55,63,.035,25,'grass');for(const z of [39,41,69,71])box(22,.048,z,72,.008,.055,'chalk');
 for(const x of [-12,56])box(x,.05,55,.045,.01,29,'chalk');box(22,.05,55,.045,.01,25,'chalk');
 for(const x of [-8,52]){pole(x,1.2,55,.055,2.4,'chalk');pole(x,1.2,49,.055,2.4,'chalk');box(x,2.4,52,.1,.1,6,'chalk');}
 // Rounded tree crowns and bark replace the old cubic trees. No assumed fountain.
 for(const [x,z] of [[-15,23],[24,27],[30,-1],[-59,-26],[-59,12],[68,30],[12,14]]){
  pole(x,2,z,.2,4,'trunk');for(const [dx,dy,dz,r] of [[0,4.4,0,2.5],[-1.2,3.6,.5,1.8],[1.2,4.2,-.6,2],[.3,5.8,.1,1.8]])add(dy>5?'leafLight':'leaf',x+dx,dy,z+dz,r,r*.8,r,unitSphere);
 }
 // Contact shading adds weight at ground intersections even on lower shadow settings.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d'),radial=sc.createRadialGradient(32,32,3,32,32,32);radial.addColorStop(0,'#00000044');radial.addColorStop(1,'#00000000');sc.fillStyle=radial;sc.fillRect(0,0,64,64);const shadowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const contactPositions=[],contactUvs=[];for(const b of SOLIDS.filter(b=>b.h<2.5)){for(const [u,v] of [[0,0],[0,1],[1,0],[0,1],[1,1],[1,0]]){contactPositions.push(b.x+(u-.5)*(b.w+1),.095,b.z+(v-.5)*(b.d+1));contactUvs.push(u,v);}}const contactGeometry=new THREE.BufferGeometry();contactGeometry.setAttribute('position',new THREE.Float32BufferAttribute(contactPositions,3));contactGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(contactUvs,2));const contacts=new THREE.Mesh(contactGeometry,shadowMaterial);group.add(contacts);
 // Chain-link boundary: slender posts, horizontal wire and a small supporting curb.
 for(const x of [-71,71]){for(let z=-45;z<78;z+=5)pole(x,1.1,z,.04,2.2,'metal');for(const y of [.35,1.2,2.1])box(x,y,15,.025,.025,124,'metal');}
 // Bake static geometry per material. World-scale UVs prevent giant stretched textures.
 for(const [kind,items] of batches){const positions=[],normals=[],uvs=[];for(const b of items){const p=b.shape.getAttribute('position'),n=b.shape.getAttribute('normal');for(let i=0;i<p.count;i++){const x=p.getX(i)*b.w+b.x,y=p.getY(i)*b.h+b.y,z=p.getZ(i)*b.d+b.z,nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);positions.push(x,y,z);normals.push(nx,ny,nz);if(Math.abs(ny)>.6)uvs.push(x*.5,z*.5);else if(Math.abs(nx)>.6)uvs.push(z*.5,y*.5);else uvs.push(x*.5,y*.5);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.castShadow=kind!=='glass'&&kind!=='lamp';mesh.receiveShadow=true;group.add(mesh);
 }
 group.add(createSpawnGuide());
 unitBox.dispose();unitCylinder.dispose();unitSphere.dispose();return group;
}
