// Shared geometry: every solid used by the renderer is also used for collision.
export const BOUNDS={minX:-72,maxX:72,minZ:-50,maxZ:78};
export const SPAWNS=[{x:0,z:12},{x:3,z:14},{x:-3,z:14},{x:6,z:12},{x:-6,z:12}];
export const SOLIDS=[], DECOR=[];
function block(x,z,w,d,h=3.8,color='#e8e1ce',y=h/2,solid=true){const b={x,z,w,d,h,color,y};(solid?SOLIDS:DECOR).push(b);return b;}
function wall(x,z,w,d){return block(x,z,w,d);}
function doorWall(x1,x2,z,door,width=3){wall((x1+door-width/2)/2,z,door-width/2-x1,.35);wall((door+width/2+x2)/2,z,x2-door-width/2,.35);block(door,z,width,.35,.7,'#e8e1ce',3.45,false);}
export const ROOMS=[
 {name:'1年1組',kind:'classroom',x:-43.5,z:-23.5,w:21,d:23,doorX:-43.5,doorZ:-12},
 {name:'理科室',kind:'science',x:-22.5,z:-23.5,w:21,d:23,doorX:-22.5,doorZ:-12},
 {name:'図書室',kind:'library',x:-1.5,z:-23.5,w:21,d:23,doorX:-1.5,doorZ:-12},
 {name:'美術室',kind:'art',x:19.5,z:-23.5,w:21,d:23,doorX:19.5,doorZ:-12},
 {name:'教室（仮）',kind:'classroom',x:-43,z:5,w:22,d:20,doorX:-32,doorZ:5},
 {name:'音楽室',kind:'music',x:-43,z:25,w:22,d:20,doorX:-32,doorZ:25},
 {name:'体育館',kind:'gym',x:51.5,z:-2.5,w:27,d:45,doorX:38,doorZ:8}
];
for(const room of ROOMS)if(!room.name.endsWith('（仮）'))room.name+='（仮）';
wall(-54,-20,.4,30);wall(30,-20,.4,30);wall(-12,-35,84,.4);
for(const x of [-33,-12,9])wall(x,-23.5,.35,23);
for(const room of ROOMS.slice(0,4))doorWall(room.x-room.w/2,room.x+room.w/2,-12,room.doorX,3.6);
// Two entrances: the main front door and the west corridor connection.
doorWall(-54,-12,-5,-28.5,7);doorWall(-12,30,-5,0,6);
wall(-54,15,.4,40);wall(-43,35,22,.4);wall(-43,15,22,.35);
for(const z of [5,25]){wall(-32,z-6,.35,8);wall(-32,z+6,.35,8);block(-32,z,.35,4,.7,'#e8e1ce',3.45,false);}
for(const z of [5,25]){wall(-25,z-6,.35,8);wall(-25,z+6,.35,8);block(-25,z,.35,4,.7,'#e8e1ce',3.45,false);}
// Gym: the doorway on the courtyard side stays open.
wall(51.5,-25,27,.45);wall(65,-2.5,.45,45);wall(51.5,20,27,.45);wall(38,-10,.45,30);wall(38,15.5,.45,9);
block(38,8,.45,6,3,'#e8e1ce',7.5,false);
// All room assignments are provisional until the reference school's plan is supplied.
// School furniture is solid, with wide paths between rows.
for(const room of ROOMS.slice(0,2))for(const x of [-6,-3,0,3,6])for(const z of [-6,-3,0,3,6]){
  block(room.x+x,room.z+z,1.2,.7,.76,room.kind==='science'?'#b0c2bb':'#d9ac73');
  block(room.x+x,room.z+z+.95,.5,.5,.5,'#688d91');
}
for(const x of [-7,-3,1,5]){block(-1.5+x,-28,1.1,8,2.4,'#a97e59');}
for(const z of [-20,-15])for(const x of [-5,3])block(-1.5+x,z,3,1.5,.8,'#d9ac73');
for(const x of [14,23])for(const z of [-28,-20])block(x,z,3.5,2.5,.85,'#c89c72');
for(const x of [-48,-43,-38])for(const z of [0,5,10]){block(x,z,2,1.4,.8,'#d9ac73');block(x,z+1.5,.9,.85,.5,'#688d91');}
block(-43,31,15,3,.7,'#a97e59');block(-49,23,3,2,1.2,'#3b4351');
// Courtyard planters; no unverified fountain is assumed.
block(12,14,6,6,.65,'#c6bdb0');
for(const [x,z] of [[-15,23],[24,27],[30,-1],[-59,-26],[-59,12],[68,30]])block(x,z,3.5,3.5,.6,'#b9b1a3');
for(const [x,z] of [[-12,4],[24,4],[0,29]])block(x,z,4,1,.55,'#a97e59');
for(const x of [-5,5])block(x,-8.4,2,.48,1.5,'#a6afaa');
// Balcony-height lintels and decorative windows never block an open door.
export const OBSTACLES=SOLIDS.map(b=>[b.x,b.z,b.w,b.d]);
export function canStand(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&x>BOUNDS.minX+.5&&x<BOUNDS.maxX-.5&&z>BOUNDS.minZ+.5&&z<BOUNDS.maxZ-.5&&!OBSTACLES.some(([ox,oz,w,d])=>Math.abs(x-ox)<w/2+.42&&Math.abs(z-oz)<d/2+.42);}
export function locationAt(x,z){for(const room of ROOMS)if(Math.abs(x-room.x)<room.w/2&&Math.abs(z-room.z)<room.d/2)return room.name;if(z>=-12&&z<=-5&&x>=-54&&x<=30)return '校舎の廊下';if(x>=-32&&x<=-25&&z>=-5&&z<=35)return '西渡り廊下';if(z>38&&x>-18)return '校庭';return '中庭';}
