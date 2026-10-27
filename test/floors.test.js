import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGameHub} from '../public/game-core.js';
import {canStand,walkHeight,locationAt,FLOORS,STAIR,UPPER_ROOMS} from '../public/school-map.js';
import {UPPER_DOORS} from '../public/school-floors.js';

function simulation(t,count=1){
 let now=1700000000000;t.mock.method(Date,'now',()=>now);const hub=createGameHub({send:()=>{}}),clients=[{}];hub.message(clients[0],{type:'create'});const room=hub.rooms.get(clients[0].room);
 for(let i=1;i<count;i++){const c={};clients.push(c);hub.message(c,{type:'join',code:room.code});}
 const player=room.players.get(clients[0].pid);
 function tick(){now+=1000/60;hub.tick(now);}
 function walk(x,z,boost=false){
  for(let i=0;i<1600;i++){
   const dx=x-player.x,dz=z-player.z,dist=Math.hypot(dx,dz);if(dist<.09){hub.message(clients[0],{type:'input',x:0,z:0});return;}
   hub.message(clients[0],{type:'input',x:dx/dist,z:dz/dist});if(boost&&i%6===0)hub.message(clients[0],{type:'tap'});tick();
  }assert.fail(`Blocked walking to ${x},${z}: actual ${player.x},${player.y},${player.z}`);
 }
 return {hub,room,clients,player,tick,walk};
}

test('walking the real game simulation reaches all five floors and returns to the ground',t=>{
 const {player,walk}=simulation(t);Object.assign(player,{x:26,z:-6.7});walk(26,-3.3);
 for(const floor of FLOORS.slice(1)){
  walk(STAIR.leftX,-3.3);walk(STAIR.leftX,6.6);walk(STAIR.rightX,6.6);walk(STAIR.rightX,-3.3);
  assert.ok(Math.abs(player.y-floor.y)<.001,'arrive at '+floor.id+'F');assert.equal(player.floor,floor.id);
  walk(26,-3.3);walk(26,-6.7);assert.equal(locationAt(player.x,player.z,player.y),floor.id+'F 廊下');walk(26,-3.3);
 }
 for(const floor of [...FLOORS].reverse().slice(1)){
  walk(STAIR.rightX,-3.3);walk(STAIR.rightX,6.6);walk(STAIR.leftX,6.6);walk(STAIR.leftX,-3.3);
  assert.ok(Math.abs(player.y-floor.y)<.001,'descend to '+floor.id+'F');
 }
 walk(STAIR.leftX,-6.7);assert.equal(player.y,0);assert.equal(player.floor,1);
});

test('rapid tapping can climb a flight without skipping a floor or clipping through a stair wall',t=>{
 const {player,walk}=simulation(t);Object.assign(player,{x:24,z:-3.3});walk(24,6.6,true);assert.ok(Math.abs(player.y-2)<.001);walk(28,6.6,true);walk(28,-3.3,true);assert.equal(player.floor,2);assert.equal(player.y,4);assert.ok(player.boost>0);
});

test('every upper-floor doorway and room is reachable from its staircase landing',()=>{
 for(const floor of FLOORS.slice(1)){
  const queue=[[26,-7]],visited=new Set(['26,-7']);
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,nz=z+dz,key=nx+','+nz;if(!visited.has(key)&&canStand(nx,nz,floor.y)){visited.add(key);queue.push([nx,nz]);}}}
  for(const r of UPPER_ROOMS.filter(r=>r.floor===floor.id)){
   assert.ok(canStand(r.doorX,r.doorZ,floor.y),floor.id+'F '+r.name+' door');
   const x=Math.round(2*(r.doorX+(r.doorAxis==='z'?1:0)))/2,z=Math.round(2*(r.doorZ+(r.doorAxis==='z'?0:-1)))/2;
   assert.ok(visited.has(x+','+z),floor.id+'F '+r.name+' must be reachable');
  }
  for(const d of UPPER_DOORS.filter(d=>d.floor===floor.id))for(const offset of [-.8,0,.8])assert.ok(canStand(d.x+(d.axis==='z'?offset:0),d.z+(d.axis==='x'?offset:0),floor.y),d.floor+'F '+d.label+' approach '+offset);
 }
});

test('upper-floor supports, rails and stair gaps prevent flying, falling or crossing a ceiling',()=>{
 assert.equal(walkHeight(0,-6.7,2),null,'no floor exists midway through a ceiling');
 assert.equal(walkHeight(35,0,4),null,'cannot walk outside the second-floor footprint');
 assert.equal(walkHeight(26,0,2),null,'cannot walk sideways across the stairwell gap');
 assert.equal(walkHeight(24,0,15.4),null,'no sixth-floor flight');
 assert.ok(!canStand(29.8,-12,15.4),'roof edge has a safety rail');
 assert.ok(canStand(20,-12,15.4),'roof terrace is accessible');
 assert.ok(!canStand(22,1,0),'ground stair enclosure is solid');
 assert.ok(canStand(24,-3.4,0),'first flight entrance stays clear');
});

test('tagging respects height, and a new round resets players from upper floors',t=>{
 const {hub,room,clients,tick}=simulation(t,2);hub.message(clients[0],{type:'start'});room.safeUntil=0;
 const [a,b]=[...room.players.values()];Object.assign(a,{x:0,z:-6.7,y:0});Object.assign(b,{x:0,z:-6.7,y:4});const original=room.tagger;tick();assert.equal(room.tagger,original,'players stacked on different floors must not tag each other');assert.equal(b.floor,2);
 b.y=0;room.safeUntil=0;tick();assert.notEqual(room.tagger,original,'touching on the same level transfers the tag');
 room.phase='finished';b.y=15.4;hub.message(clients[0],{type:'start'});for(const p of room.players.values()){assert.equal(p.y,0);assert.equal(p.floor,1);}
});

test('middle-school grades have four separate reachable homerooms and keep their special rooms',()=>{
 for(const grade of [1,2,3]){
  const classes=UPPER_ROOMS.filter(r=>r.grade===grade);
  assert.deepEqual(classes.map(r=>r.name),['A','B','C','D'].map(letter=>grade+letter));
  assert.ok(classes.every(r=>r.floor===grade+1&&r.kind==='classroom'));
  const y=FLOORS[grade].y;assert.ok(!canStand(-32.3,-39.75,y),'a solid partition separates A and B');assert.ok(canStand(-40.3,-39.75,y),'the corridor passes that partition');
 }
 assert.equal(UPPER_ROOMS.filter(r=>r.kind==='classroom').length,12);
 assert.ok(UPPER_ROOMS.every(r=>r.kind!=='lounge'),'generic shared rooms are replaced by middle-school homerooms');
 const names=floor=>UPPER_ROOMS.filter(r=>r.floor===floor&&!r.grade).map(r=>r.name);
 assert.deepEqual(names(2),['事務室','リソースルーム','保健体育室','被服室','保健室','調理室','職員室']);
 assert.deepEqual(names(3),['物理化学室','科学実験室','生物地学室','Dルーム','メディアセンター']);
 assert.deepEqual(names(4),['英語室','美術室','グループ学習室','社会科室','視聴覚室']);
 assert.deepEqual(names(5),['実習生室','会議室']);
});
