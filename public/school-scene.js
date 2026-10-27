import * as THREE from './vendor/three.js';
import {SOLIDS,DECOR,ROOMS,DOORS,CORRIDORS,PILOTI,COURTYARD,YARD,WALKWAYS,TREES} from './school-map.js?v=7';
import {createSpawnGuide} from './spawn-guide.js?v=7';
import {createSchoolMaterials} from './school-materials.js?v=7';

export function createSchool(scene){
 const group=new THREE.Group();group.name='takehaya-school';scene.add(group);const materials=createSchoolMaterials(),batches=new Map();
 const unitBox=new THREE.BoxGeometry(1,1,1).toNonIndexed(),unitCylinder=new THREE.CylinderGeometry(1,1,1,12).toNonIndexed(),unitSphere=new THREE.IcosahedronGeometry(1,2).toNonIndexed();
 function add(kind,x,y,z,w,h,d,shape=unitBox){if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push({x,y,z,w,h,d,shape});}
 const box=(x,y,z,w,h,d,kind='plaster')=>add(kind,x,y,z,w,h,d);
 const pole=(x,y,z,r,h,kind='metal')=>add(kind,x,y,z,r,h,r,unitCylinder);
 function sign(text,x,y,z,rotation=0,width=2,height=.34,bg='#eeeae0',color='#293d3a'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,256);c.strokeStyle='#7c877d';c.lineWidth=8;c.strokeRect(6,6,1012,244);c.fillStyle=color;c.textAlign='center';c.font='600 76px sans-serif';c.fillText(text,512,154);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:texture,roughness:.7,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;group.add(m);
 }
 // All floor, ceiling and passage extents come from the shared map.
 box(0,-.26,-26,148,.36,132,'grass');
 for(const r of WALKWAYS)box(r.x,-.025,r.z,r.w,.08,r.d,'concrete');
 box(COURTYARD.x,-.025,COURTYARD.z,COURTYARD.w,.08,COURTYARD.d,'concrete');
 for(const r of CORRIDORS){box(r.x,0,r.z,r.w,.09,r.d,'tile');box(r.x,3.9,r.z,r.w,.2,r.d);}
 box(PILOTI.x,0,PILOTI.z,PILOTI.w,.09,PILOTI.d,'tile');box(PILOTI.x,3.9,PILOTI.z,PILOTI.w,.2,PILOTI.d);
 for(const r of ROOMS){box(r.x,-.01,r.z,r.w,.08,r.d,r.kind==='gym'||r.kind==='music'||r.kind==='workshop'?'floor':'tile');if(r.kind!=='gym')box(r.x,3.9,r.z,r.w,.2,r.d);}
 // The SUGOI room's white desks and blue/yellow carpet follow its official photo.
 const sugoi=ROOMS.find(r=>r.kind==='sugoi');box(sugoi.x,.043,sugoi.z,10.8,.016,8.5,'carpet');
 for(const [dx,dz] of [[-3,-2],[3,2]])box(sugoi.x+dx,.054,sugoi.z+dz,2.1,.01,2.1,dx<0?'carpetBlue':'carpetYellow');
 function windowPanel(x,z,w,d,height=3.8,base=0){
  const alongX=w>d,length=Math.max(w,d),sections=Math.max(1,Math.round(length/2.4)),span=length/sections;
  for(let i=0;i<sections;i++){
   const a=-length/2+span*(i+.5),px=x+(alongX?a:0),pz=z+(alongX?0:a);
   box(px,base+.4,pz,alongX?span:w,.8,alongX?d:span,'facade');box(px,base+height-.3,pz,alongX?span:w,.6,alongX?d:span,'facade');
   box(px,base+1.92,pz,alongX?span-.12:.045,2.1,alongX?.045:span-.12,'glass');
   for(const offset of [-span/2+.04,0,span/2-.04])box(px+(alongX?offset:0),base+1.94,pz+(alongX?0:offset),alongX?.055:w+.04,2.22,alongX?d+.04:.055,'blackMetal');
   for(const y of [.85,1.85,3.05])box(px,base+y,pz,alongX?span:w+.04,.055,alongX?d+.04:span,'blackMetal');
  }
 }
 function wall(b){if(b.windows&&Math.max(b.w,b.d)>1.4)windowPanel(b.x,b.z,b.w,b.d,b.h);else{box(b.x,b.y,b.z,b.w,b.h,b.d);box(b.x,.45,b.z,b.w+.02,.9,b.d+.02,'wood');}box(b.x,.07,b.z,b.w+.025,.14,b.d+.025,'blackMetal');}
 function desk(b,modern=false){box(b.x,b.h-.035,b.z,b.w,.07,b.d,modern?'white':'laminate');box(b.x,b.h-.085,b.z,b.w+.015,.035,b.d+.015,'wood');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*(b.w/2-.08),b.h/2-.03,b.z+dz*(b.d/2-.08),.022,b.h-.06,'metal');}
 function chair(b,modern=false){box(b.x,.45,b.z,b.w,.065,b.d,modern?'white':'wood');box(b.x,.72,b.z+b.d/2-.04,b.w,.42,.055,modern?'white':'wood');for(const dx of [-1,1])for(const dz of [-1,1]){pole(b.x+dx*(b.w/2-.06),.23,b.z+dz*(b.d/2-.06),.02,.46,'metal');if(modern)pole(b.x+dx*(b.w/2-.06),.04,b.z+dz*(b.d/2-.06),.035,.045,'blackMetal');}}
 for(const b of SOLIDS){
  switch(b.kind){
   case 'wall':wall(b);break;
   case 'column':box(b.x,b.y,b.z,b.w,b.h,b.d,'facade');break;
   case 'notice-board':box(b.x,b.y,b.z,b.w,b.h,b.d,'blackMetal');for(const dx of [-1.35,1.35])pole(b.x+dx,1.65,b.z,.065,3.3);break;
   case 'desk':case 'modern-desk':desk(b,b.kind==='modern-desk');break;
   case 'chair':case 'modern-chair':chair(b,b.kind==='modern-chair');break;
   case 'stool':pole(b.x,.46,b.z,.21,.055,'wood');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*.13,.23,b.z+dz*.13,.024,.46,'wood');break;
   case 'workbench':box(b.x,.8,b.z,b.w,.1,b.d,'wood');for(const dx of [-1,1])for(const dz of [-1,1])box(b.x+dx*.82,.4,b.z+dz*.45,.13,.8,.13,'wood');box(b.x,.24,b.z,1.8,.1,.95,'wood');box(b.x+.8,.9,b.z+.6,.3,.2,.22,'blackMetal');pole(b.x+.8,2.7,b.z,.018,1.9);box(b.x+.8,1.8,b.z,.09,.19,.07,'white');break;
   case 'piano':case 'upright-piano':{
    box(b.x,.69,b.z,b.w,.64,b.d,'piano');box(b.x,.97,b.z+b.d/2+.01,b.w*.9,.09,.18,'white');for(let i=0;i<16;i++)if(i%7!==2&&i%7!==6)box(b.x-b.w*.43+i*b.w*.054,1.025,b.z+b.d/2-.01,.035,.03,.11,'blackMetal');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*(b.w/2-.12),.25,b.z+dz*(b.d/2-.12),.035,.5,'piano');break;
   }
   case 'sofa':box(b.x,.4,b.z,b.w,.4,b.d,'fabric');box(b.x,.75,b.z-.32,b.w,.45,.22,'fabric');for(const dx of [-1,1])box(b.x+dx*(b.w/2-.1),.65,b.z,.2,.32,b.d,'fabric');break;
   case 'cabinet':box(b.x,b.y,b.z,b.w,b.h,b.d,'wood');for(let z=b.z-b.d/2+.2;z<b.z+b.d/2;z+=.75)box(b.x-b.w/2-.01,1,z,.025,1.4,.6,'paint');break;
   case 'shoe-shelf':for(const y of [.1,.45,.8,1.15,1.4])box(b.x,y,b.z,b.w,.04,b.d,'metal');for(const dx of [-.8,0,.8])box(b.x+dx,.72,b.z,.035,1.4,b.d,'metal');break;
   case 'stage':box(b.x,b.y,b.z,b.w,b.h,b.d,'wood');break;
   case 'bench':box(b.x,.46,b.z,b.w,.08,b.d,'wood');for(const dx of [-1,1])box(b.x+dx*b.w*.35,.23,b.z,.1,.46,b.d*.7,'blackMetal');break;
   default:box(b.x,b.y,b.z,b.w,b.h,b.d,'concrete');
  }
 }
 for(const b of DECOR)box(b.x,b.y,b.z,b.w,b.h,b.d);
 // Casings follow DOORS, so an apparent opening always matches the collision map.
 for(const door of DOORS){const alongX=door.axis==='x',half=door.width/2;
  for(const side of [-1,1])box(door.x+(alongX?side*(half+.04):0),1.58,door.z+(alongX?0:side*(half+.04)),alongX?.08:.36,3.16,alongX?.36:.08,'blackMetal');
  box(door.x,3.17,door.z,alongX?door.width+.16:.36,.09,alongX?.36:door.width+.16,'blackMetal');
  if(door.label)sign(door.label,door.x+(alongX?0:.22),3.48,door.z+(alongX?.22:0),alongX?0:Math.PI/2,Math.min(door.width,2.6),.32);
 }
 for(const r of ROOMS.filter(r=>r.kind!=='gym')){
  for(const dx of [-r.w*.25,r.w*.25])for(const dz of [-2,2]){box(r.x+dx,3.7,r.z+dz,1.35,.08,.24,'metal');box(r.x+dx,3.65,r.z+dz,1.26,.025,.18,'lamp');}
  if(['japanese','workshop'].includes(r.kind)){box(r.x,1.83,-17.78,Math.min(6,r.w-2),1.45,.07,'wood');box(r.x,1.83,-17.73,Math.min(5.85,r.w-2.15),1.28,.025,'dark');box(r.x,1.16,-17.65,6,.04,.16,'metal');}
  if(r.kind==='sugoi'){box(r.x,1.85,-17.72,8,2,.06,'white');box(r.x,3.2,-16.8,.4,.2,.25,'white');box(r.x,3.45,-16.8,.05,.5,.05,'metal');}
  if(r.kind==='music'){for(const x of [-4.8,4.8])box(x,1.9,-17.7,1.4,2.4,.08,'curtain');for(const x of [1.8,3]){pole(x,.8,-16.1,.32,.45,'wood');pole(x,.49,-16.1,.025,.5,'metal');}}
  const fill=new THREE.PointLight('#fff1dc',18,16,2);fill.position.set(r.x,3.2,r.z);group.add(fill);
 }
 for(let x=-37;x<30;x+=5){box(x,3.73,-6.7,1.2,.07,.22,'metal');box(x,3.68,-6.7,1.1,.025,.16,'lamp');}
 for(let z=-44;z<-9;z+=6){box(-40.3,3.73,z,.22,.07,1.2,'metal');box(-40.3,3.68,z,.16,.025,1.1,'lamp');}
 sign('← 体育館・下校庭',-35.5,2.7,-8.22,0,2.6,.28);sign('下校庭 →',28.9,2.6,-4.79,0,1.8,.28);
 // L-shaped multi-storey exterior, with a smaller fifth-floor rooftop volume.
 // Upper floors are exterior scenery; the playable floor remains 1F.
 function upperWing(x,z,w,d,levels){
  box(x,3.98+levels*3.8/2,z,w,levels*3.8,d,'facade');
  for(let level=0;level<levels;level++){const y=4+level*3.8;box(x,y,z,w+.16,.18,d+.16,'concrete');
   for(const side of [-1,1]){for(let xx=x-w/2+1.5;xx<x+w/2;xx+=3){box(xx,y+1.9,z+side*(d/2+.025),2.35,1.8,.045,'upperGlass');box(xx,y+1.9,z+side*(d/2+.065),.045,1.85,.04,'blackMetal');box(xx,y+1.75,z+side*(d/2+.065),2.4,.045,.04,'blackMetal');}
    for(let zz=z-d/2+1.5;zz<z+d/2;zz+=3)box(x+side*(w/2+.025),y+1.9,zz,.045,1.8,2.2,'upperGlass');}
  }box(x,4+levels*3.8,z,w+.3,.22,d+.3,'concrete');
 }
 upperWing(-6,-11.5,72,13,3);upperWing(-34,-32.5,16,29,3);
 // The fifth floor uses its own raised shell rather than another accessible floor.
 box(-9,17.4,-11.5,32,3.8,13,'facade');for(let x=-23;x<7;x+=3)for(const z of [-18.04,-4.96])box(x,17.4,z,2.3,1.8,.045,'upperGlass');box(-9,19.35,-11.5,32.4,.2,13.4,'concrete');
 // Gym: high windows, gallery rails, timber stage and a dark green curtain.
 const gym=ROOMS.find(r=>r.kind==='gym');box(gym.x,9,gym.z,gym.w+.4,.24,gym.d+.4,'concrete');
 for(const x of [-68,-42]){box(x,6.35,-29,.28,5.1,34,'plaster');windowPanel(x,-29,.3,34,3.8,4);for(let z=-44;z<-12;z+=4){box(x+(x<-50?.36:-.36),4.5,z,.08,1,.08,'metal');}box(x+(x<-50?.36:-.36),5,-29,.06,.06,33,'metal');}
 for(const z of [-46,-12])box(-55,6.35,z,26,5.1,.28);
 box(-55,3.3,-45.78,16,4.8,.08,'curtain');box(-55,5.8,-45.7,18,.4,.25,'wood');for(const x of [-64, -46])box(x,3.2,-45.7,.4,5.5,.25,'wood');
 for(let z=-44;z<-12;z+=4){box(-55,8.7,z,26,.24,.2,'concrete');for(const x of [-62,-55,-48]){box(x,8.4,z,.7,.08,.7,'lamp');}}
 for(const x of [-66,-44])box(x,.044,-28,.045,.012,26,'chalk');for(const z of [-40,-15,-28])box(-55,.044,z,22,.012,.045,'chalk');
 function ring(x,z,r,kind='chalk',y=.05){const m=new THREE.Mesh(new THREE.TorusGeometry(r,.025,5,64),materials[kind]);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);group.add(m);}
 ring(-55,-28,2.3);for(const z of [-41.6,-13.8]){box(-55,3,z,2.1,1.2,.08,'white');ring(-55,z+(z<-25?.5:-.5),.35,'blackMetal',2.7);}
 // The official lower schoolyard photo shows green artificial turf, not gravel.
 box(YARD.x,0,YARD.z,YARD.w,.08,YARD.d,'turf');for(const x of [-20,58])box(x,.051,YARD.z,.055,.012,27,'chalk');for(const z of [-82,-55])box(YARD.x,.051,z,78,.012,.055,'chalk');box(YARD.x,.051,YARD.z,.055,.012,27,'chalk');ring(YARD.x,YARD.z,3,'courtBlue',.06);
 for(const z of [-80,-78,-76,-74])box(19,.06,z,78,.008,.05,'chalk');
 for(const x of [-20,58]){for(const z of [-71.5,-65.5])pole(x,1.2,z,.04,2.4,'chalk');box(x,2.4,-68.5,.08,.08,6,'chalk');}
 for(const [x,z] of TREES){pole(x,1.8,z,.17,3.6,'trunk');for(const [dx,dy,dz,r] of [[0,4.4,0,2.1],[-1,3.6,.5,1.5],[1,4.2,-.6,1.7],[.3,5.5,.1,1.5]])add(dy>5?'leafLight':'leaf',x+dx,dy,z+dz,r,r*.8,r,unitSphere);}
 // Fence only at the world boundary, leaving schoolyard routes open.
 for(const x of [-71,71]){for(let z=-87;z<38;z+=5)pole(x,1.1,z,.04,2.2);for(const y of [.35,1.2,2.1])box(x,y,-26,.025,.025,126,'metal');}
 for(const z of [-89,37]){for(let x=-70;x<72;x+=5)pole(x,1.1,z,.04,2.2);for(const y of [.35,1.2,2.1])box(0,y,z,142,.025,.025,'metal');}
 // Contact shadows are kept inside each shared collision footprint.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d'),radial=sc.createRadialGradient(32,32,3,32,32,32);radial.addColorStop(0,'#00000044');radial.addColorStop(1,'#00000000');sc.fillStyle=radial;sc.fillRect(0,0,64,64);const shadowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
 const contactPositions=[],contactUvs=[];for(const b of SOLIDS.filter(b=>b.h<2)){for(const [u,v] of [[0,0],[0,1],[1,0],[0,1],[1,1],[1,0]]){contactPositions.push(b.x+(u-.5)*(b.w+.5),.075,b.z+(v-.5)*(b.d+.5));contactUvs.push(u,v);}}const contactGeometry=new THREE.BufferGeometry();contactGeometry.setAttribute('position',new THREE.Float32BufferAttribute(contactPositions,3));contactGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(contactUvs,2));group.add(new THREE.Mesh(contactGeometry,shadowMaterial));
 // Bake static geometry per material. Metre-based UVs keep real grain size.
 for(const [kind,items] of batches){const positions=[],normals=[],uvs=[];for(const b of items){const p=b.shape.getAttribute('position'),n=b.shape.getAttribute('normal');for(let i=0;i<p.count;i++){const x=p.getX(i)*b.w+b.x,y=p.getY(i)*b.h+b.y,z=p.getZ(i)*b.d+b.z,nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);positions.push(x,y,z);normals.push(nx,ny,nz);if(Math.abs(ny)>.6)uvs.push(x*.5,z*.5);else if(Math.abs(nx)>.6)uvs.push(z*.5,y*.5);else uvs.push(x*.5,y*.5);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.name='school-'+kind;mesh.castShadow=kind!=='glass'&&kind!=='lamp';mesh.receiveShadow=true;group.add(mesh);
 }
 group.add(createSpawnGuide());unitBox.dispose();unitCylinder.dispose();unitSphere.dispose();return group;
}
