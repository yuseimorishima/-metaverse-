import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SPAWNS,ROOMS,canStand,locationAt} from '../public/school-map.js';

test('school spans more than 100 metres, all five spawns are walkable',()=>{for(const p of SPAWNS)assert.ok(canStand(p.x,p.z));assert.ok(canStand(68,70));assert.ok(!canStand(73,0));assert.ok(!canStand(NaN,0));});
test('entrance and internal doors are walkable, walls and furniture block passage',()=>{assert.ok(canStand(0,-5));assert.ok(!canStand(-48,-5));for(const r of ROOMS){assert.ok(canStand(r.doorX,r.doorZ),r.name);}assert.ok(!canStand(-43.5,-23.5),'classroom desk');});
test('every room, corridor and schoolyard can be reached from the courtyard',()=>{
 const queue=[[0,12]],visited=new Set(['0,12']);for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=nx+','+nz;if(!visited.has(key)&&canStand(nx,nz)){visited.add(key);queue.push([nx,nz]);}}}
 for(const r of ROOMS){const targets=r.kind==='gym'?[[40,8]]:r.doorX===-32?[[-34,r.z]]:[[Math.round(r.doorX),-14]];assert.ok(targets.some(([x,z])=>visited.has(x+','+z)),r.name+' must be connected');}
 assert.ok(visited.has('22,55'));assert.equal(locationAt(0,-8),'校舎の廊下');assert.equal(locationAt(45,0),'体育館（仮）');assert.equal(locationAt(22,55),'校庭');
});
