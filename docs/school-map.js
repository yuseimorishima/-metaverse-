// Official reference: https://www2.u-gakugei.ac.jp/~takechu/building-info
// Room names, floor assignments, L-shaped massing and turf are referenced;
// dimensions, door positions and room order are an approximation for this game.
export const BOUNDS={minX:-72,maxX:72,minZ:-90,maxZ:38};
export const SPAWNS=[{x:0,z:12},{x:3,z:14},{x:-3,z:14},{x:6,z:12},{x:-6,z:12}];
export const NOTICE_BOARD={x:0,z:6,y:1.9,width:3.8,height:2.8,depth:.3};
export const CORRIDORS=[
 {name:'校舎の廊下',x:-6,z:-6.7,w:72,d:3.4},
 {name:'西側の廊下',x:-40.3,z:-27.7,w:3.4,d:38.6}
];
export const PILOTI={x:-32.3,z:-32.5,w:12.6,d:29};
export const COURTYARD={x:2,z:-32.5,w:56,d:29};
export const YARD={x:19,z:-68.5,w:86,d:33};
export const WALKWAYS=[
 {x:-1,z:8,w:82,d:26},
 {x:35,z:-25,w:5,d:66},
 {x:-40.3,z:-50,w:3.4,d:8},
 {x:-11,z:-50,w:62,d:4}
];
export const ROOMS=[
 {name:'相談室',kind:'counseling',x:-34.3,z:-13.2,w:8.6,d:9.6,doorX:-34.3,doorZ:-8.4},
 {name:'国語室',kind:'japanese',x:-24,z:-13.2,w:12,d:9.6,doorX:-24,doorZ:-8.4},
 {name:'SUGOI部屋',kind:'sugoi',x:-12,z:-13.2,w:12,d:9.6,doorX:-12,doorZ:-8.4},
 {name:'音楽室',kind:'music',x:0,z:-13.2,w:12,d:9.6,doorX:0,doorZ:-8.4},
 {name:'技術室',kind:'workshop',x:13,z:-13.2,w:14,d:9.6,doorX:13,doorZ:-8.4},
 {name:'用務員室',kind:'caretaker',x:25,z:-13.2,w:10,d:9.6,doorX:25,doorZ:-8.4},
 {name:'体育館',kind:'gym',x:-55,z:-29,w:26,d:34,doorX:-42,doorZ:-32}
];
export const SOLIDS=[],DECOR=[],DOORS=[];
function block(x,z,w,d,h=.8,color='#d9ac73',y=h/2,kind='furniture',solid=true){
 if(w<=0||d<=0||h<=0)throw new Error('School geometry must have positive dimensions');
 const b={x,z,w,d,h,color,y,kind};(solid?SOLIDS:DECOR).push(b);return b;
}
// One wall definition supplies both the visible wall and the collision footprint.
function wallLine(axis,fixed,start,end,openings=[],windows=false){
 let edge=start;const depth=.28;
 function segment(a,b){if(b-a<.001)return;const alongX=axis==='x',wall=block(alongX?(a+b)/2:fixed,alongX?fixed:(a+b)/2,alongX?b-a:depth,alongX?depth:b-a,3.8,'#e8e1ce',1.9,'wall');wall.windows=windows;}
 for(const opening of [...openings].sort((a,b)=>a.at-b.at)){
  const a=opening.at-opening.width/2,b=opening.at+opening.width/2;
  if(a<edge-.001||b>end+.001)throw new Error('Overlapping or out-of-range school doorway');
  segment(edge,a);const door={axis,x:axis==='x'?opening.at:fixed,z:axis==='x'?fixed:opening.at,width:opening.width,label:opening.label||''};DOORS.push(door);
  block(door.x,door.z,axis==='x'?door.width:depth,axis==='x'?depth:door.width,.6,'#e8e1ce',3.5,'lintel',false);edge=b;
 }segment(edge,end);
}
// A continuous 3.4 m corridor runs past all first-floor rooms and turns west.
wallLine('x',-5,-42,30,[{at:-40.3,width:2.4,label:'校庭へ'},{at:0,width:4.4,label:'竹早中学校'}],true);
wallLine('x',-8.4,-38.6,30,ROOMS.slice(0,6).map(r=>({at:r.doorX,width:2.4,label:r.name})));
wallLine('x',-18,-38.6,30,[],true);
for(const x of [-30,-18,-6,6,20])wallLine('z',x,-18,-8.4);
wallLine('z',30,-18,-5,[],true);
wallLine('z',-38.6,-18,-8.4);
// The old duplicate courtyard holes and unclosed corridor ends are removed.
wallLine('z',-42,-47,-5,[{at:-32,width:3.2,label:'体育館'}]);
wallLine('z',-38.6,-47,-18,[{at:-40,width:2.4,label:'ピロティー'},{at:-25,width:2.4,label:'ピロティー'}],true);
wallLine('x',-47,-42,-38.6,[{at:-40.3,width:2.4,label:'下校庭へ'}]);
// The ground-floor piloti is deliberately open on the courtyard side.
for(const z of [-46,-37,-28,-19])block(-26.2,z,.48,.48,3.8,'#e8e1ce',1.9,'column');
// Gym shares its east wall and doorway with the west corridor: no doubled wall.
wallLine('z',-68,-46,-12,[],true);wallLine('x',-46,-68,-42,[],true);wallLine('x',-12,-68,-42,[],true);
block(-55,-43.8,18,3,.8,'#d9ac73',.4,'stage');
// Furniture leaves a clear entrance aisle in every room.
for(const r of ROOMS.filter(r=>['japanese','sugoi'].includes(r.kind)))for(const dx of [-3.6,-1.8,0,1.8,3.6])for(const dz of [-2,0,2]){
 block(r.x+dx,r.z+dz,.85,.6,.73,'#d9ac73',.365,r.kind==='sugoi'?'modern-desk':'desk');
 block(r.x+dx,r.z+dz+.8,.46,.44,.5,'#688d91',.25,r.kind==='sugoi'?'modern-chair':'chair');
}
for(const dx of [-3.2,-1.6,0,1.6,3.2])for(const dz of [-1.4,.2,1.8])block(dx,-13.2+dz,.42,.42,.48,'#d9ac73',.24,'stool');
block(-4.5,-15.8,1.5,2.5,1.1,'#3b4351',.55,'piano');
block(3.7,-16,2.4,.75,1.05,'#d9ac73',.525,'upright-piano');
for(const x of [9,13,17])for(const z of [-15.5,-11.5])block(x,z,2.1,1.3,.85,'#c89c72',.425,'workbench');
for(const z of [-15.8,-11.3])block(-36.5,z,2.4,.9,.8,'#688d91',.4,'sofa');
block(-33.2,-13.4,1.4,1.2,.5,'#d9ac73',.25,'desk');
block(25,-15,3,1.5,.76,'#d9ac73',.38,'desk');
block(28.8,-14,.6,5,1.8,'#a97e59',.9,'cabinet');
for(const x of [-4,4])block(x,-5.4,1.6,.45,1.4,'#a6afaa',.7,'shoe-shelf');
// Keep the approach, east schoolyard path and piloti exits clear of planters.
export const TREES=[[-19,10],[24,12],[-18,-37],[23,-29],[65,-48],[66,-78],[-61,24]];
for(const [x,z] of TREES)block(x,z,2.4,2.4,.45,'#b9b1a3',.225,'planter');
for(const [x,z] of [[-14,19],[19,20],[-11,-29]])block(x,z,3,.7,.5,'#a97e59',.25,'bench');
block(NOTICE_BOARD.x,NOTICE_BOARD.z,NOTICE_BOARD.width+.16,NOTICE_BOARD.depth,NOTICE_BOARD.height+.16,'#284c48',NOTICE_BOARD.y,'notice-board');
export const OBSTACLES=SOLIDS.map(b=>[b.x,b.z,b.w,b.d]);
export function canStand(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&x>BOUNDS.minX+.5&&x<BOUNDS.maxX-.5&&z>BOUNDS.minZ+.5&&z<BOUNDS.maxZ-.5&&!OBSTACLES.some(([ox,oz,w,d])=>Math.abs(x-ox)<w/2+.42&&Math.abs(z-oz)<d/2+.42);}
function inside(r,x,z){return Math.abs(x-r.x)<r.w/2&&Math.abs(z-r.z)<r.d/2;}
export function locationAt(x,z){for(const r of ROOMS)if(inside(r,x,z))return r.name;for(const r of CORRIDORS)if(inside(r,x,z))return r.name;if(inside(PILOTI,x,z))return 'ピロティー';if(inside(YARD,x,z))return '下校庭';if(z<-18)return '中庭';return '校舎アプローチ';}
