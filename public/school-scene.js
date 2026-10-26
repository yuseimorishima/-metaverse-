import * as THREE from './vendor/three.js';
import {SOLIDS,DECOR,ROOMS,BOUNDS} from './school-map.js';
export function createSchool(scene){
 const group=new THREE.Group();scene.add(group);const batches=new Map(),geometry=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 function box(x,y,z,w,h,d,color){if(!batches.has(color))batches.set(color,[]);batches.get(color).push({x,y,z,w,h,d});}
 function sign(text,x,y,z,rotation=0,width=5,bg='#294b55'){
   const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,768,192);c.fillStyle='#fff2d7';c.textAlign='center';c.font='bold 64px sans-serif';c.fillText(text,384,118);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;group.add(m);
 }
 box(0,-.3,14,148,.5,132,'#8aaa7b');box(-12,-.02,-20,85,.12,31,'#e5d8bd');box(-39.5,-.02,15,30,.12,40,'#e5d8bd');box(51.5,-.02,-2.5,27,.12,45,'#cca573');
 box(1,-.04,15,60,.1,44,'#d9d2bd');box(0,-.03,45,7,.12,60,'#d9d2bd');
 for(const b of [...SOLIDS,...DECOR])box(b.x,b.y,b.z,b.w,b.h,b.d,b.color);
 // Wainscot and window panels create a recognisable Japanese school corridor.
 for(let x=-50;x<30;x+=5){box(x,1,-34.72,3.7,1.9,.08,'#a8d7dc');box(x,2.85,-34.64,4,.08,.12,'#f3eedf');if(Math.abs(x)>4&&(x<-33||x>-24))box(x,1.1,-4.76,3.2,1.7,.08,'#a7ccce');}
 // Keep the actual entrance openings unobstructed by decorative windows.
 for(const x of [-48,-38,-18,-8,8,18,28]){if(Math.abs(x)<4)continue;box(x,.65,-4.7,3,.14,.12,'#739c9a');}
 for(const room of ROOMS.slice(0,4)){
   box(room.x,3.9,room.z,room.w,.15,room.d,'#f7f0dd');
   box(room.x,1.95,-34.55,10,1.55,.12,'#31574d');sign(room.kind==='library'?'READ • DISCOVER':room.kind==='science'?'SCIENCE LAB':room.kind==='art'?'CREATE SOMETHING':'WELCOME TO CLASS',room.x,2,-34.45,0,7,'#31574d');
   sign(room.name,room.doorX,3,-11.74,0,3);sign(room.name,room.doorX,3,-12.3,Math.PI,3);
   box(room.doorX-1.9,1.6,-12,.15,3.2,.65,'#a97e59');box(room.doorX+1.9,1.6,-12,.15,3.2,.65,'#a97e59');
   // Ceiling lights and plank seams.
   for(const x of [-5,5])for(const z of [-5,5])box(room.x+x,3.74,room.z+z,2.4,.06,.5,'#fffbeb');
   for(let z=-33;z<-13;z+=2)box(room.x,.055,z,room.w-.5,.015,.025,'#c7bda4');
 }
 box(-12,3.95,-8.5,84,.15,7,'#f7f0dd');box(-43,3.9,15,22,.15,40,'#f7f0dd');box(-28.5,3.9,15,7,.15,40,'#f7f0dd');
 sign('NEON CAMPUS',0,3.4,-4.65,0,6);sign('← 教室 / 図書室　　体育館 →',0,2.65,-4.65,0,5.0);
 for(const room of ROOMS.slice(4,6)){sign(room.name,-31.72,2.9,room.z,Math.PI/2,3);box(-28.5,.04,room.z,5,.05,.18,'#87b7b0');}
 // Shelves with individually coloured books; all geometry is batched by material.
 for(const shelf of SOLIDS.filter(b=>b.color==='#a97e59'&&b.z===-28))for(const y of [.65,1.35,2.05])for(let z=-31;z<-24;z+=.45)box(shelf.x+.6,y,z,.1,.5,.25,['#7e9c94','#bf816c','#ccaf6a'][Math.floor((z+32)*3)%3]);
 // Gym hall, markings and two basketball hoops.
 for(const z of [-25,20])box(51.5,6,z,27,4,.45,'#d5e2dd');for(const x of [38,65])box(x,8.5,-2.5,.45,1,45,'#31565b');box(51.5,9,-2.5,28,.3,46,'#758f8a');
 for(const x of [40,63])box(x,.08,-2.5,.08,.025,38,'#fff0ce');for(const z of [-21,16,-2.5])box(51.5,.08,z,23,.025,.08,'#fff0ce');
 for(const z of [-22,17]){box(51.5,3,z,3,1.7,.15,'#edf0dd');box(51.5,2.75,z+(z<0?1:-1),1,.06,1,'#c78360');}
 sign('体育館 / GYM',37.72,3.2,8,-Math.PI/2,5);
 // Schoolyard: running track and football field, all reachable from the courtyard.
 box(22,.01,55,76,.06,36,'#c08b73');box(22,.06,55,63,.04,25,'#9eae71');
 for(const z of [39,41,69,71])box(22,.075,z,72,.015,.08,'#f1dbc2');
 for(const x of [-12,56])box(x,.09,55,.08,.03,29,'#eee6d0');box(22,.09,55,.08,.03,25,'#eee6d0');
 for(const x of [-8,52]){box(x,1.2,55,.18,2.4,.18,'#e9e8d6');box(x,1.2,49,.18,2.4,.18,'#e9e8d6');box(x,2.4,52,.18,.18,6,'#e9e8d6');}
 sign('校庭 / PLAYGROUND',22,2.8,37,0,6);
 // Fountain, benches, art easels and leafy courtyard trees.
 box(12,.7,14,4.6,.08,4.6,'#8ecbd3');box(12,1.3,14,.8,1.5,.8,'#d6d2c2');box(12,2.1,14,2.7,.15,2.7,'#a5d7d9');
 for(const [x,z] of [[-15,23],[24,27],[30,-1],[-59,-26],[-59,12],[68,30]]){
   box(x,2,z,.6,4,.6,'#917659');box(x,4,z,5,3.5,5,'#70966c');box(x+1,5.7,z,3.4,1.7,3.4,'#86aa7c');
 }
 for(const x of [14,23]){box(x,1.6,-30,2.4,2,.12,'#f4e3c1');box(x,1.6,-29.9,1.6,1.4,.05,'#96b8ae');}
 for(let z=-45;z<78;z+=5){box(-71,1,z,.12,2,.12,'#7e9a8b');box(71,1,z,.12,2,.12,'#7e9a8b');}
 for(const z of [-49,77])box(0,1,z,143,.1,.15,'#7e9a8b');
 // Flush all static boxes as instanced meshes (small draw-call count on mobile).
 for(const [color,items] of batches){const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshLambertMaterial({color}),items.length);items.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.receiveShadow=true;mesh.castShadow=true;group.add(mesh);}
 return group;
}
