import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SPAWNS,ROOMS,DOORS,CORRIDORS,SOLIDS,NOTICE_BOARD,SHOE_RACKS,canStand,locationAt} from '../public/school-map.js';

// Sample actual walkable centres, including a full person's radius at each wall.
function reachable(){const queue=[[0,12]],visited=new Set(['0,12']);for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=nx+','+nz;if(!visited.has(key)&&canStand(nx,nz)){visited.add(key);queue.push([nx,nz]);}}}return visited;}

test('all five spawns are walkable; map coordinates remain bounded',()=>{for(const p of SPAWNS)assert.ok(canStand(p.x,p.z));assert.ok(canStand(68,30));assert.ok(!canStand(73,0));assert.ok(!canStand(NaN,0));});
test('every marked doorway is physically open across its centre and both approaches',()=>{
 for(const d of DOORS)for(const offset of [-.8,0,.8])assert.ok(canStand(d.x+(d.axis==='z'?offset:0),d.z+(d.axis==='x'?offset:0)),d.label+' '+offset);
 assert.ok(!canStand(-24,-5),'a window must not be a walk-through doorway');assert.ok(!canStand(-24,-14.1),'classroom desk');
});
test('one continuous corridor connects all rooms, gym, piloti and lower schoolyard',()=>{
 const visited=reachable();
 for(const r of ROOMS){const x=Math.round(r.doorX+(r.kind==='gym'?2:0)),z=Math.round(r.doorZ+(r.kind==='gym'?0:-1));assert.ok(visited.has(x+','+z),r.name+' must be connected');}
 for(const [x,z] of [[-40,-7],[-40,-32],[-40,-46],[-35,-40],[-32,-25],[19,-68],[35,-50]])assert.ok(visited.has(x+','+z),x+','+z+' must be reachable');
 assert.equal(locationAt(0,-6.7),'校舎の廊下');assert.equal(locationAt(-40,-32),'西側の廊下');assert.equal(locationAt(-20,-32),'体育館');assert.equal(locationAt(19,-68),'下校庭');
});
test('corridor centres and turning area have no stray wall or furniture footprint',()=>{
 for(const r of CORRIDORS){const alongX=r.w>r.d,length=Math.max(r.w,r.d);for(let t=-length/2+.7;t<length/2-.7;t+=.2)for(const side of [-.6,0,.6])assert.ok(canStand(r.x+(alongX?t:side),r.z+(alongX?side:t)),r.name+' at '+t+' / '+side);}
 for(const x of [-40.8,-40,-39.3])for(const z of [-8.2,-7.5,-6.7])assert.ok(canStand(x,z),'west corner is clear');
 assert.ok(!canStand(-38.6,-33),'west corridor has a continuous window wall between piloti doors');
});
test('first-floor room types follow the official school guide; all solids have valid dimensions',()=>{
 assert.deepEqual(ROOMS.filter(r=>r.kind!=='gym').map(r=>r.name),['相談室','国語室','SUGOI部屋','音楽室','技術室','用務員室']);
 for(const b of SOLIDS)assert.ok([b.x,b.z,b.w,b.d,b.h,b.y].every(Number.isFinite)&&b.w>0&&b.d>0&&b.h>0);
});
test('a delayed render tick still moves the player and cannot tunnel through a wall',async()=>{
 const {createGameHub}=await import('../public/game-core.js');const hub=createGameHub({send:()=>{}}),client={};hub.message(client,{type:'create'});const p=hub.rooms.get(client.room).players.get(client.pid);p.x=-24;p.z=-4;hub.message(client,{type:'input',x:0,z:-1});hub.tick(Date.now()+1000);assert.ok(p.z<-4,'movement is advanced despite a delayed frame');assert.ok(p.z>=-4.44,'the wall still blocks each substep');
});
test('spawn guide has a solid footprint and leaves routes on either side',()=>{assert.ok(!canStand(NOTICE_BOARD.x,NOTICE_BOARD.z));for(const side of [-1,1])assert.ok(canStand(NOTICE_BOARD.x+side*(NOTICE_BOARD.width/2+.7),NOTICE_BOARD.z));for(const p of SPAWNS)assert.ok(canStand(p.x,p.z));});

test('entrance has class-labelled shoe cubbies and open routes from outside to the school hall',()=>{
 assert.equal(SHOE_RACKS.length,6);assert.deepEqual(SHOE_RACKS.map(r=>r.label),['1A・1B','1C・1D','2A・2B','2C・2D','3A・3B','3C・3D']);
 for(let z=5;z>=-6.7;z-=.1)assert.ok(canStand(0,z),'entrance centre at '+z);
 for(const r of SHOE_RACKS){assert.ok(!canStand(r.x,r.z));assert.ok(canStand(r.x,r.z+.95));}
 assert.equal(locationAt(0,0),'生徒玄関・下駄箱');
 const gym=ROOMS.find(r=>r.kind==='gym');assert.ok(gym.z+gym.d/2<=-18);assert.ok(gym.z-gym.d/2>-52,'gym is between classroom block and lower yard');
 for(const b of SOLIDS.filter(b=>['planter','bench'].includes(b.kind)))assert.ok(Math.abs(b.x-gym.x)>gym.w/2+b.w/2||Math.abs(b.z-gym.z)>gym.d/2+b.d/2,'outdoor furniture must not be inside the gym');
});
