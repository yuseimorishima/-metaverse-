import * as THREE from './vendor/three.js';
import {SOLIDS,DECOR,ROOMS,DOORS,CORRIDORS,ENTRANCE_HALL,PILOTI,COURTYARD,YARD,WALKWAYS,TREES} from './school-map.js?v=10';
import {createSpawnGuide,createFloorGuide} from './spawn-guide.js?v=10';
import {createSchoolMaterials} from './school-materials.js?v=10';
import {FLOORS,STAIR,UPPER_ROOMS,UPPER_SOLIDS,UPPER_DECOR,UPPER_DOORS} from './school-floors.js?v=10';

export function createSchool(scene){
 const group=new THREE.Group();group.name='takehaya-school';scene.add(group);const materials=createSchoolMaterials(),batches=new Map();
 const unitBox=new THREE.BoxGeometry(1,1,1).toNonIndexed(),unitCylinder=new THREE.CylinderGeometry(1,1,1,8).toNonIndexed(),unitSphere=new THREE.IcosahedronGeometry(1,2).toNonIndexed();
 let elevation=0,placement=null;const customGeometry=[];
 function add(kind,x,y,z,w,h,d,shape=unitBox){let rotation=0;if(placement){rotation=placement.rotation;const dx=x-placement.x,dz=z-placement.z,c=Math.cos(rotation),s=Math.sin(rotation);x=placement.x+c*dx+s*dz;z=placement.z-s*dx+c*dz;}
  // Spatially bounded batches let Three.js cull furniture on other floors
  // and behind the camera, while still sharing geometry/material draw calls.
  const key=kind+':'+Math.floor((y+elevation)/3.8)+':'+Math.floor(x/16)+':'+Math.floor(z/16);
  if(!batches.has(key))batches.set(key,{kind,items:[]});
  batches.get(key).items.push({x,y:y+elevation,z,w,h,d,shape,rotation});}
 const box=(x,y,z,w,h,d,kind='plaster')=>add(kind,x,y,z,w,h,d);
 const pole=(x,y,z,r,h,kind='metal')=>add(kind,x,y,z,r,h,r,unitCylinder);
 function sign(text,x,y,z,rotation=0,width=2,height=.34,bg='#eeeae0',color='#293d3a'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(96,Math.round(1024*height/width));const c=canvas.getContext('2d'),H=canvas.height;c.fillStyle=bg;c.fillRect(0,0,1024,H);c.strokeStyle='#7c877d';c.lineWidth=4;c.strokeRect(2,2,1020,H-4);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='500 '+Math.round(H*.62)+'px sans-serif';c.fillText(text,512,H*.52,970);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:texture,roughness:.7,side:THREE.DoubleSide}));m.position.set(x,y+elevation,z);m.rotation.y=rotation;m.name='school-sign';m.userData.text=text;m.userData.base=elevation;group.add(m);
 }
 // All floor, ceiling and passage extents come from the shared map.
 box(0,-.26,-26,148,.36,132,'grass');
 for(const r of WALKWAYS)box(r.x,-.025,r.z,r.w,.08,r.d,'concrete');
 box(COURTYARD.x,-.025,COURTYARD.z,COURTYARD.w,.08,COURTYARD.d,'concrete');
 for(const r of CORRIDORS){box(r.x,0,r.z,r.w,.09,r.d,'tile');box(r.x,2.96,r.z,r.w,.1,r.d,'ceiling');}
 box(ENTRANCE_HALL.x,0,ENTRANCE_HALL.z,ENTRANCE_HALL.w,.08,ENTRANCE_HALL.d,'tile');
 box(0,3.12,-1,16.3,.18,8.3,'concrete');
 box(0,.047,1.4,4,.014,2.8,'carpet');
 for(const x of [-4.8,0,4.8]){box(x,2.96,-1,1.25,.06,.28,'metal');box(x,2.92,-1,1.15,.025,.2,'lamp');}
 box(PILOTI.x,0,PILOTI.z,PILOTI.w,.09,PILOTI.d,'tile');box(PILOTI.x,3.85,PILOTI.z,PILOTI.w,.1,PILOTI.d);
 for(const r of ROOMS){box(r.x,-.01,r.z,r.w,.08,r.d,r.kind==='gym'||r.kind==='music'||r.kind==='workshop'?'floor':'tile');if(r.kind!=='gym')box(r.x,3.16,r.z,r.w,.1,r.d,'ceiling');}
 // The SUGOI room's white desks and blue/yellow carpet follow its official photo.
 const sugoi=ROOMS.find(r=>r.kind==='sugoi');box(sugoi.x,.043,sugoi.z,10.8,.016,8.5,'carpet');
 for(const [dx,dz] of [[-3,-2],[3,2]])box(sugoi.x+dx,.054,sugoi.z+dz,2.1,.01,2.1,dx<0?'carpetBlue':'carpetYellow');
 function windowPanel(x,z,w,d,height=3.8,base=0){
  const alongX=w>d,length=Math.max(w,d),sections=Math.max(1,Math.ceil(length/3)),span=length/sections;
  // Concrete piers and a continuous sill give windows an opening in a wall,
  // rather than making each facade a floor-to-ceiling glass box.
  for(let i=0;i<sections;i++){
   const a=-length/2+span*(i+.5),px=x+(alongX?a:0),pz=z+(alongX?0:a),top=Math.min(2.76,height-.35),bottom=.92;
   box(px,base+bottom/2,pz,alongX?span:w,bottom,alongX?d:span,'plaster');
   box(px,base+(height+top)/2,pz,alongX?span:w,height-top,alongX?d:span,'plaster');
   for(const offset of [-span/2+.09,span/2-.09])box(px+(alongX?offset:0),base+(bottom+top)/2,pz+(alongX?0:offset),alongX?.18:w,top-bottom,alongX?d:.18,'plaster');
   box(px,base+(bottom+top)/2,pz,alongX?span-.36:.018,top-bottom,alongX?.018:span-.36,'glass');
   for(const offset of [-span/2+.2,0,span/2-.2])box(px+(alongX?offset:0),base+(bottom+top)/2,pz+(alongX?0:offset),alongX?.035:.06,top-bottom,alongX?.06:.035,'blackMetal');
   for(const y of [bottom,1.78,top])box(px,base+y,pz,alongX?span-.35:.07,.035,alongX?.07:span-.35,'blackMetal');
   box(px,base+bottom-.025,pz,alongX?span-.24:w+.12,.07,alongX?d+.12:span-.24,'wood');
  }
 }
 function partition(b){
  const alongX=b.w>b.d,length=Math.max(b.w,b.d),segments=Math.max(1,Math.ceil(length/2));
  box(b.x,.47,b.z,b.w,.94,b.d,'wood');
  box(b.x,2.72,b.z,b.w,Math.max(.1,b.h-2.72),b.d,'plaster');
  box(b.x,1.75,b.z,alongX?b.w:.025,1.56,alongX?.025:b.d,'glass');
  for(let i=0;i<=segments;i++){const a=-length/2+length*i/segments;box(b.x+(alongX?a:0),1.76,b.z+(alongX?0:a),alongX?.045:.08,1.64,alongX?.08:.045,'wood');}
  for(const y of [.96,2.3,2.57])box(b.x,y,b.z,alongX?b.w:.08,.055,alongX?.08:b.d,'wood');
 }
 function railing(b){const alongX=b.w>b.d,length=Math.max(b.w,b.d);for(let t=-length/2;t<=length/2+.01;t+=Math.min(1,length))pole(b.x+(alongX?t:0),b.h/2,b.z+(alongX?0:t),.025,b.h);for(const y of [.25,b.h])box(b.x,y,b.z,alongX?b.w:.05,.055,alongX?.05:b.d,'metal');}
 function wall(b){if(b.h<2){railing(b);return;}if(b.windows==='partition')partition(b);else if(b.windows&&Math.max(b.w,b.d)>1.4)windowPanel(b.x,b.z,b.w,b.d,b.h);else{box(b.x,b.y,b.z,b.w,b.h,b.d);box(b.x,.45,b.z,b.w+.02,.9,b.d+.02,'wood');}box(b.x,.05,b.z,b.w+.025,.1,b.d+.025,'blackMetal');box(b.x,.94,b.z,b.w+.035,.045,b.d+.035,'wood');}
 function desk(b,modern=false){box(b.x,b.h-.035,b.z,b.w,.07,b.d,modern?'white':'laminate');box(b.x,b.h-.085,b.z,b.w+.015,.035,b.d+.015,'wood');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*(b.w/2-.08),b.h/2-.03,b.z+dz*(b.d/2-.08),.022,b.h-.06,'metal');}
 function chair(b,modern=false){box(b.x,.45,b.z,b.w,.065,b.d,modern?'white':'wood');box(b.x,.72,b.z+b.d/2-.04,b.w,.24,.035,modern?'white':'wood');for(const dx of [-1,1])pole(b.x+dx*(b.w/2-.04),.63,b.z+b.d/2-.04,.018,.43,'metal');for(const dx of [-1,1])for(const dz of [-1,1]){pole(b.x+dx*(b.w/2-.06),.23,b.z+dz*(b.d/2-.06),.02,.46,'metal');if(modern)pole(b.x+dx*(b.w/2-.06),.04,b.z+dz*(b.d/2-.06),.035,.045,'blackMetal');}}
 for(const b of [...SOLIDS,...UPPER_SOLIDS]){elevation=b.base||0;
  switch(b.kind){
   case 'wall':wall(b);break;
   case 'column':box(b.x,b.y,b.z,b.w,b.h,b.d,'facade');break;
   case 'notice-board':box(b.x,b.y,b.z,b.w,b.h,b.d,'blackMetal');for(const dx of [-1.35,1.35])pole(b.x+dx,1.65,b.z,.065,3.3);break;
   case 'desk':case 'modern-desk':case 'teacher-desk':{placement=b.rotation?{x:b.x,z:b.z,rotation:b.rotation}:null;desk(b.rotation?{...b,w:b.d,d:b.w}:b,b.kind==='modern-desk');placement=null;break;}
   case 'chair':case 'modern-chair':{placement=b.rotation?{x:b.x,z:b.z,rotation:b.rotation}:null;chair(b.rotation?{...b,w:b.d,d:b.w}:b,b.kind==='modern-chair');placement=null;break;}
   case 'stool':pole(b.x,.46,b.z,.21,.055,'wood');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*.13,.23,b.z+dz*.13,.024,.46,'wood');break;
   case 'workbench':box(b.x,.8,b.z,b.w,.1,b.d,'wood');for(const dx of [-1,1])for(const dz of [-1,1])box(b.x+dx*.82,.4,b.z+dz*.45,.13,.8,.13,'wood');box(b.x,.24,b.z,1.8,.1,.95,'wood');box(b.x+.8,.9,b.z+.6,.3,.2,.22,'blackMetal');pole(b.x+.8,2.7,b.z,.018,1.9);box(b.x+.8,1.8,b.z,.09,.19,.07,'white');break;
   case 'piano':case 'upright-piano':{
    box(b.x,.69,b.z,b.w,.64,b.d,'piano');box(b.x,.97,b.z+b.d/2+.01,b.w*.9,.09,.18,'white');for(let i=0;i<16;i++)if(i%7!==2&&i%7!==6)box(b.x-b.w*.43+i*b.w*.054,1.025,b.z+b.d/2-.01,.035,.03,.11,'blackMetal');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*(b.w/2-.12),.25,b.z+dz*(b.d/2-.12),.035,.5,'piano');break;
   }
   case 'sofa':box(b.x,.4,b.z,b.w,.4,b.d,'fabric');box(b.x,.75,b.z-.32,b.w,.45,.22,'fabric');for(const dx of [-1,1])box(b.x+dx*(b.w/2-.1),.65,b.z,.2,.32,b.d,'fabric');break;
   case 'class-lockers':{
    const n=6;for(let i=0;i<=n;i++)box(b.x-b.w/2+b.w*i/n,.44,b.z,.025,.88,b.d,'wood');for(const y of [.04,.44,.86])box(b.x,y,b.z,b.w,.03,b.d,'wood');box(b.x,.44,b.z-b.d/2,b.w,.88,.025,'wood');break;
   }
   case 'cabinet':box(b.x,b.y,b.z,b.w,b.h,b.d,'wood');if(b.w>b.d){for(let x=b.x-b.w/2+.4;x<b.x+b.w/2;x+=.8)box(x,1,b.z+b.d/2+.015,.7,1.4,.03,'paint');}else for(let z=b.z-b.d/2+.2;z<b.z+b.d/2;z+=.75)box(b.x-b.w/2-.01,1,z,.025,1.4,.6,'paint');break;
   case 'lab-table':desk(b);box(b.x,b.h,b.z,b.w,.06,b.d,'piano');pole(b.x-.5,b.h+.16,b.z,.08,.25,'glass');pole(b.x+.4,b.h+.12,b.z,.06,.2,'white');break;
   case 'lab-counter':box(b.x,.43,b.z,b.w,.86,b.d,'white');box(b.x,.89,b.z,b.w,.07,b.d,'piano');break;
   case 'kitchen-island':box(b.x,.4,b.z,b.w,.8,b.d,'white');box(b.x,.84,b.z,b.w,.06,b.d,'metal');box(b.x-.45,.88,b.z,.6,.02,.5,'blackMetal');for(const dz of [-.28,.28])pole(b.x+.5,.88,b.z+dz,.14,.02,'piano');pole(b.x-.45,1.02,b.z-.3,.02,.3,'metal');break;
   case 'sewing-table':desk(b);box(b.x,.9,b.z,.4,.28,.2,'white');box(b.x+.12,.94,b.z,.1,.36,.22,'white');break;
   case 'art-table':desk(b);for(const dx of [-.6,.6])box(b.x+dx,b.h+.01,b.z,.55,.012,.4,'white');break;
   case 'office-desk':desk(b);box(b.x,1.04,b.z-.1,.6,.4,.04,'piano');pole(b.x,.85,b.z-.1,.025,.2);box(b.x,.78,b.z+.15,.5,.025,.18,'blackMetal');break;
   case 'bed':box(b.x,.52,b.z,b.w,.24,b.d,'white');box(b.x,.67,b.z-b.d*.3,b.w*.8,.12,.6,'fabric');for(const dx of [-1,1])for(const dz of [-1,1])pole(b.x+dx*(b.w/2-.07),.25,b.z+dz*(b.d/2-.1),.035,.5,'metal');break;
   case 'bookshelf':{
    for(const dz of [-1,1])box(b.x,b.h/2,b.z+dz*(b.d/2-.04),b.w,b.h,.08,'wood');box(b.x,b.h/2,b.z,.045,b.h,b.d,'wood');
    for(const y of [.1,.55,1,1.45,1.95]){box(b.x,y,b.z,b.w,.05,b.d,'wood');if(y>1.5)continue;for(let z=b.z-b.d/2+.15;z<b.z+b.d/2-.1;z+=.24)for(const side of [-1,1])box(b.x+side*.2,y+.18,z,.32,.3,.17,['paint','dark','wood','white'][Math.abs(Math.round(z*10))%4]);}break;
   }
   case 'railing':railing(b);break;
   case 'shoe-shelf':{
    // Open individual cubbies with recessed backs, name strips and shoe soles.
    box(b.x,.75,b.z-b.d/2+.015,b.w,1.5,.03,'paint');
    for(const y of [.05,.34,.63,.92,1.21,1.5])box(b.x,y,b.z,b.w,.025,b.d,'white');
    for(let i=0;i<=8;i++)box(b.x-b.w/2+i*b.w/8,.75,b.z,.022,1.5,b.d,'white');
    for(let col=0;col<8;col++)for(let row=0;row<5;row++){
     const x=b.x-b.w/2+(col+.5)*b.w/8,y=.08+row*.29;
     box(x,y+.1,b.z+.333,.18,.04,.012,'white');
     if((col+row)%3!==0)for(const dx of [-.055,.055]){box(x+dx,y+.035,b.z+.06,.075,.045,.23,'chalk');box(x+dx,y+.015,b.z+.06,.08,.015,.24,'blackMetal');}
    }
    sign(b.label,b.x,1.67,b.z+.35,0,1.5,.2);break;
   }
   case 'stage':box(b.x,b.y,b.z,b.w,b.h,b.d,'wood');break;
   case 'bench':box(b.x,.46,b.z,b.w,.08,b.d,'wood');for(const dx of [-1,1])box(b.x+dx*b.w*.35,.23,b.z,.1,.46,b.d*.7,'blackMetal');break;
   default:box(b.x,b.y,b.z,b.w,b.h,b.d,'concrete');
  }
 }
 for(const b of [...DECOR,...UPPER_DECOR]){elevation=b.base||0;box(b.x,b.y,b.z,b.w,b.h,b.d);}elevation=0;
 // The open part of every sliding door is exactly the shared collision opening.
 // Parked leaves sit against the wall instead of obstructing the passage.
 for(const door of [...DOORS,...UPPER_DOORS]){
  elevation=door.base||0;const alongX=door.axis==='x',half=door.width/2;
  const classroom=door.label&&!/階段|校庭|学校|体育館|ピロティー/.test(door.label),top=classroom?2.3:2.65;
  for(const side of [-1,1])box(door.x+(alongX?side*(half+.025):0),top/2,door.z+(alongX?0:side*(half+.025)),alongX?.05:.3,top,alongX?.3:.05,'metal');
  box(door.x,top+.035,door.z,alongX?door.width+.1:.3,.07,alongX?.3:door.width+.1,'metal');
  // Solid transom above the shorter door; no false full-height openings.
  box(door.x,(top+3.2)/2,door.z,alongX?door.width:.28,3.2-top,alongX?.28:door.width,'plaster');
  if(classroom){
   const leaf=Math.min(.65,door.width*.42),offset=(half+leaf/2+.06)*(door.parkSide||1);
   // Leaves are thin, so they remain wholly within the player's wall clearance.
   for(const side of [-1,1]){
    const px=door.x+(alongX?offset:side*.2),pz=door.z+(alongX?side*.2:offset);
    box(px,.5,pz,alongX?leaf:.045,1,alongX?.045:leaf,'wood');
    box(px,1.61,pz,alongX?leaf:.025,1.14,alongX?.025:leaf,'glass');
    for(const o of [-leaf/2,leaf/2])box(px+(alongX?o:0),1.15,pz+(alongX?0:o),alongX?.035:.055,2.3,alongX?.055:.035,'wood');
    for(const h of [1.03,2.27])box(px,h,pz,alongX?leaf:.055,.04,alongX?.055:leaf,'wood');
    box(px+(alongX?-leaf*.3:side*.03),1.08,pz+(alongX?side*.03:-leaf*.3),alongX?.03:.02,.16,alongX?.02:.03,'blackMetal');
   }
  }
  if(door.label)for(const side of [-1,1])sign(door.label,door.x+(alongX?0:side*.22),top+.23,door.z+(alongX?side*.22:0),alongX?(side===1?0:Math.PI):side*Math.PI/2,Math.min(door.width*.7,1.5),.18);
 }elevation=0;
 function fluorescent(x,z,alongX=true,y=2.91){
  box(x,y,z,alongX?1.25:.28,.055,alongX?.28:1.25,'metal');
  for(const side of [-1,1])box(x+(alongX?0:side*.075),y-.04,z+(alongX?side*.075:0),alongX?1.18:.035,.025,alongX?.035:1.18,'lamp');
 }
 // Wall fittings use the room's teaching direction. Windows stay to one side.
 function teachingWall(r,west=false){
  const angle=west?Math.PI/2:0,W=west?r.d:r.w,D=west?r.w:r.d,front=-D/2+.21;
  placement={x:r.x,z:r.z,rotation:angle};
  const local=(x,y,z,w,h,d,kind)=>box(r.x+x,y,r.z+z,w,h,d,kind);
  const boardW=Math.min(r.kind==='sugoi'?8:4.8,W-1.4),white=r.kind==='sugoi'||r.kind==='audiovisual';
  local(0,1.72,front,boardW+.12,1.32,.08,'metal');local(0,1.72,front+.05,boardW,1.22,.025,white?'white':'board');
  local(0,1.06,front+.13,boardW+.16,.045,.18,'metal');
  for(const x of [-boardW*.37,boardW*.31])local(x,1.1,front+.16,.13,.035,.065,x<0?'chalk':'paint');
  // Clock, speaker, suspended screen and air conditioning break up the blank box.
  local(-W*.37,2.58,front,.22,.3,.12,'white');
  local(W*.34,2.63,front,.72,.42,.07,'piano');local(W*.34,2.91,front,.035,.25,.035,'metal');
  local(0,2.91,front+.12,1.1,.18,.3,'white');for(let i=-4;i<=4;i++)local(i*.095,2.87,front+.28,.04,.035,.015,'blackMetal');
  placement=null;
  const world=(x,z)=>({x:r.x+Math.cos(angle)*x+Math.sin(angle)*z,z:r.z-Math.sin(angle)*x+Math.cos(angle)*z});
  if(r.grade){const p=world(0,front+.08);sign(r.name,p.x,2.63,p.z,angle,1.2,.24,'#f0eee4','#344137');}
  const clock=document.createElement('canvas');clock.width=clock.height=256;const c=clock.getContext('2d');c.fillStyle='#f3f2e8';c.beginPath();c.arc(128,128,121,0,Math.PI*2);c.fill();c.strokeStyle='#69716c';c.lineWidth=8;c.stroke();
  for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(128+Math.sin(a)*97,128-Math.cos(a)*97);c.lineTo(128+Math.sin(a)*108,128-Math.cos(a)*108);c.lineWidth=3;c.stroke();}c.lineWidth=5;c.beginPath();c.moveTo(128,128);c.lineTo(88,105);c.moveTo(128,128);c.lineTo(128,52);c.stroke();
  const texture=new THREE.CanvasTexture(clock);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(.34,.34),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.8})),point=world(-W*.23,front+.08);m.position.set(point.x,elevation+2.63,point.z);m.rotation.y=angle;m.name='classroom-clock';group.add(m);
 }
 function blinds(x,z,length,alongX=true){
  // Short lowered blinds leave a clear view through the lower window panes.
  box(x,2.75,z,alongX?length:.08,.09,alongX?.08:length,'metal');
  for(let i=0;i<9;i++)box(x,2.68-i*.055,z,alongX?length:.025,.032,alongX?.025:length,'blind');
 }
 function interior(r){
  const clear=3.12;
  for(const dx of [-r.w*.25,r.w*.25])for(const dz of [-r.d*.28,0,r.d*.28])fluorescent(r.x+dx,r.z+dz,true,clear-.07);
  // Shallow beams, column returns and panel ceiling distinguish the structural bays.
  for(const side of [-1,1]){box(r.x+side*(r.w/2-.23),2.97,r.z,.32,.3,r.d,'plaster');box(r.x+side*(r.w/2-.23),1.5,r.z-r.d/2+.25,.32,3,.32,'plaster');}
  if(r.grade)teachingWall(r);
  else if(!['counseling','caretaker','office','staff','infirmary','media'].includes(r.kind))teachingWall(r,true);
  if(r.grade){
   blinds(-26.22,r.z,r.d-.45,false);
   // A classroom bulletin board with anonymous exercise sheets sits at the rear.
   box(r.x-2.4,1.8,r.z+r.d/2-.2,3.4,1.15,.045,'pinboard');
   for(let i=0;i<5;i++)box(r.x-3.65+i*.62,1.82,r.z+r.d/2-.23,.44,.66,.012,'white');
  }else if(r.z===-13.2)blinds(r.x,-17.77,r.w-.5);
 }
 for(const r of ROOMS.filter(r=>r.kind!=='gym')){
  interior(r);const fill=new THREE.PointLight('#f8f6eb',12,15,2);fill.position.set(r.x,2.7,r.z);group.add(fill);
  if(r.kind==='music')for(const x of [1.8,3]){pole(x,.8,-16.1,.32,.45,'wood');pole(x,.49,-16.1,.025,.5,'metal');}
 }
 function corridorDetails(base=0){
  elevation=base;
  for(let x=-36;x<30;x+=6){fluorescent(x,-6.7,true,2.84);box(x,2.78,-6.7,.22,.26,3.4,'plaster');}
  for(let z=-44;z<-9;z+=6){fluorescent(-40.3,z,false,2.84);box(-40.3,2.78,z,3.4,.26,.22,'plaster');}
  // Slim wall-mounted notice cases add scale without reducing the walking width.
  const bays=[...SOLIDS,...UPPER_SOLIDS].filter(b=>(b.base||0)===base&&b.kind==='wall'&&b.z===-8.4&&b.w>2.6);
  for(const {x} of bays.filter((_,i)=>i%2===0)){box(x,1.7,-8.21,1.5,.8,.055,'pinboard');for(const dx of [-.47,0,.47])box(x+dx,1.7,-8.17,.33,.5,.01,'white');}
  elevation=0;
 }
 corridorDetails();sign('← 体育館・下校庭',-35.5,2.53,-8.22,0,2.1,.2);
 // Real upper-floor interiors replace the old solid facade blocks.
 for(const f of FLOORS.slice(1)){
  elevation=f.y;
  box(-6,-.09,-11.5,72,.18,13,'tile');box(-34,-.09,-32.5,16,.18,29,'tile');
  if(f.id<5){box(-6,3.16,-11.5,72,.08,13,'ceiling');box(-34,3.16,-32.5,16,.08,29,'ceiling');box(-6,2.96,-6.7,72,.08,3.4,'ceiling');box(-40.3,2.96,-27.7,3.4,.08,38.6,'ceiling');}
  else{box(-9,3.64,-11.5,32,.08,13);box(-9,3.74,-11.5,32.3,.2,13.3,'concrete');box(-33,.03,-33,9,.06,18,'concrete');}
  for(const r of UPPER_ROOMS.filter(r=>r.floor===f.id)){
   if(['art','media','meeting','trainee','group'].includes(r.kind))box(r.x,.018,r.z,r.w-.3,.035,r.d-.3,r.kind==='media'?'carpet':'floor');
   interior(r);
  }
  if(f.id<5)corridorDetails(f.y);elevation=f.y;
  const fill=new THREE.PointLight('#fff2df',20,22,2);fill.position.set(12,f.y+2.7,-10);group.add(fill);
  sign(f.id+'F  ← 教室 / 階段 →',20,2.53,-8.18,0,3.4,.3,'#eeeae0',f.color);
 }elevation=0;
 // One continuous switchback stair connects every storey. Collision uses the
 // same flights with a smooth walking surface; the renderer adds real treads.
 function slopingBeam(x1,y1,z1,x2,y2,z2,width=.035,kind='metal'){
  const start=new THREE.Vector3(x1,y1,z1),end=new THREE.Vector3(x2,y2,z2),direction=end.clone().sub(start),shape=new THREE.CylinderGeometry(width,width,direction.length(),8).toNonIndexed();shape.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));customGeometry.push(shape);const mid=start.add(end).multiplyScalar(.5);add(kind,mid.x,mid.y,mid.z,1,1,1,shape);
 }
 for(const f of FLOORS){
  box(26,f.y-.09,-3.5,8,.18,3,'tile');
  sign(f.id+'F',29.78,f.y+2.9,-3.5,-Math.PI/2,1.5,.6,'#eeeae0',f.color);
  group.add(createFloorGuide(f,f.id===1?ROOMS:UPPER_ROOMS.filter(r=>r.floor===f.id)));
  if(f.id<5)sign('↑ '+(f.id+1)+'F',24,f.y+2.5,-1.9,Math.PI,1.5,.32);
  if(f.id>1)sign('↓ '+(f.id-1)+'F',28,f.y+2.5,-1.9,Math.PI,1.5,.32);
 }
 for(let i=0;i<FLOORS.length-1;i++){
  const lower=FLOORS[i].y,upper=FLOORS[i+1].y,mid=(lower+upper)/2,run=STAIR.endZ-STAIR.startZ;
  box(26,mid-.09,(STAIR.endZ+STAIR.backZ)/2,8,.18,STAIR.backZ-STAIR.endZ,'tile');
  for(const [x,startY,endY] of [[STAIR.leftX,lower,mid],[STAIR.rightX,upper,mid]]){
   const rise=endY-startY,count=Math.ceil(Math.abs(rise)/.17),length=Math.hypot(run,rise),shape=new THREE.BoxGeometry(STAIR.width,.16,length).toNonIndexed();shape.rotateX(-Math.atan2(rise,run));customGeometry.push(shape);add('concrete',x,(startY+endY)/2-.14,(STAIR.startZ+STAIR.endZ)/2,1,1,1,shape);
   for(let step=0;step<count;step++){const top=startY+rise*(rise>0?(step+1)/count:step/count);box(x,top-.07,STAIR.startZ+run*(step+.5)/count,STAIR.width,.14,run/count,'tile');}
   for(const side of [-1,1]){const railX=x+side*STAIR.width/2;slopingBeam(railX,startY+1,STAIR.startZ,railX,endY+1,STAIR.endZ);for(let j=0;j<=4;j++){const t=j/4;pole(railX,startY+rise*t+.5,STAIR.startZ+run*t,.025,1,'metal');}}
  }
  elevation=mid;railing({x:26,z:STAIR.endZ,w:1.6,d:.06,h:1.1});elevation=0;
 }
 box(26,19.1,1.5,8.3,.2,13.3,'concrete');
 // Gym location now follows the campus map: beyond the piloti, before the yard.
 const gym=ROOMS.find(r=>r.kind==='gym'),left=gym.x-gym.w/2,right=gym.x+gym.w/2,north=gym.z-gym.d/2,south=gym.z+gym.d/2;
 box(gym.x,9,gym.z,gym.w+.4,.24,gym.d+.4,'concrete');
 for(const x of [left,right]){box(x,6.35,gym.z,.28,5.1,gym.d,'plaster');windowPanel(x,gym.z,.3,gym.d,3.8,4);for(let z=north+2;z<south;z+=4)box(x+(x<gym.x?.36:-.36),4.5,z,.08,1,.08,'metal');box(x+(x<gym.x?.36:-.36),5,gym.z,.06,.06,gym.d-1,'metal');}
 for(const z of [north,south])box(gym.x,6.35,z,gym.w,5.1,.28);
 box(gym.x,3.3,north+.22,16,4.8,.08,'curtain');box(gym.x,5.8,north+.3,18,.4,.25,'wood');for(const x of [gym.x-9,gym.x+9])box(x,3.2,north+.3,.4,5.5,.25,'wood');
 for(let z=north+2;z<south;z+=4){box(gym.x,8.7,z,gym.w,.24,.2,'concrete');for(const x of [gym.x-7,gym.x,gym.x+7])box(x,8.4,z,.7,.08,.7,'lamp');}
 for(const x of [left+2,right-2])box(x,.044,gym.z,.045,.012,gym.d-6,'chalk');for(const z of [north+5,south-3,gym.z])box(gym.x,.044,z,gym.w-4,.012,.045,'chalk');
 function ring(x,z,r,kind='chalk',y=.05){const m=new THREE.Mesh(new THREE.TorusGeometry(r,.025,5,64),materials[kind]);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);group.add(m);}
 ring(gym.x,gym.z,2.3);for(const z of [north+4,south-2]){box(gym.x,3,z,2.1,1.2,.08,'white');ring(gym.x,z+(z<gym.z?.5:-.5),.35,'blackMetal',2.7);}
 // Covered route from the piloti to the gym's west doorway.
 box(-25,3.12,-32,2.3,.18,5,'concrete');box(-25,0,-32,2.3,.08,5,'tile');
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
 const contactPositions=[],contactUvs=[];for(const b of [...SOLIDS,...UPPER_SOLIDS].filter(b=>b.h<2)){for(const [u,v] of [[0,0],[0,1],[1,0],[0,1],[1,1],[1,0]]){contactPositions.push(b.x+(u-.5)*(b.w+.18),(b.base||0)+.075,b.z+(v-.5)*(b.d+.18));contactUvs.push(u,v);}}const contactGeometry=new THREE.BufferGeometry();contactGeometry.setAttribute('position',new THREE.Float32BufferAttribute(contactPositions,3));contactGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(contactUvs,2));group.add(new THREE.Mesh(contactGeometry,shadowMaterial));
 // Bake static geometry per material. Metre-based UVs keep real grain size.
 for(const {kind,items} of batches.values()){const positions=[],normals=[],uvs=[];for(const b of items){const p=b.shape.getAttribute('position'),n=b.shape.getAttribute('normal');for(let i=0;i<p.count;i++){const c=Math.cos(b.rotation),s=Math.sin(b.rotation),lx=p.getX(i)*b.w,lz=p.getZ(i)*b.d,x=c*lx+s*lz+b.x,y=p.getY(i)*b.h+b.y,z=-s*lx+c*lz+b.z,nx=c*n.getX(i)+s*n.getZ(i),ny=n.getY(i),nz=-s*n.getX(i)+c*n.getZ(i);positions.push(x,y,z);normals.push(nx,ny,nz);if(Math.abs(ny)>.6)uvs.push(x*.5,z*.5);else if(Math.abs(nx)>.6)uvs.push(z*.5,y*.5);else uvs.push(x*.5,y*.5);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.name='school-'+kind;mesh.castShadow=kind!=='glass'&&kind!=='lamp';mesh.receiveShadow=true;group.add(mesh);
 }
 group.add(createSpawnGuide());unitBox.dispose();unitCylinder.dispose();unitSphere.dispose();customGeometry.forEach(g=>g.dispose());return group;
}
