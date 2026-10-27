import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createGameServer } from '../server.js';

async function setup(t,options){const game=createGameServer(options);await new Promise(r=>game.server.listen(0,'127.0.0.1',r));t.after(()=>game.close());const url=`http://127.0.0.1:${game.server.address().port}`;return {game,url,client:async()=>{
  const ws=new WebSocket(url.replace('http','ws'));const inbox=[];const pending=new Set();
  ws.on('message',raw=>{const m=JSON.parse(raw);inbox.push(m);if(inbox.length>100)inbox.shift();for(const waiter of pending)if(waiter.filter(m)){pending.delete(waiter);clearTimeout(waiter.timer);waiter.resolve(m);}});
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  return {ws,send:m=>ws.send(JSON.stringify(m)),wait:(filter)=>new Promise((resolve,reject)=>{const found=inbox.find(filter);if(found){resolve(found);return;}const waiter={filter,resolve,timer:setTimeout(()=>{pending.delete(waiter);reject(new Error('Timed out waiting for message'));},3000)};pending.add(waiter);})};}};}
async function enter(client,type='create',code){client.send({type,name:'テスター',code});return client.wait(m=>m.type==='welcome');}

test('serves application, local Three.js modules and health; unknown paths are 404',async t=>{const {url}=await setup(t);for(const path of ['/','/app.js','/school-floors.js','/style.css','/vendor/three.js','/vendor/three.core.js','/health']){const r=await fetch(url+path);assert.equal(r.status,200,path);assert.ok((await r.text()).length>0);}assert.equal((await fetch(url+'/missing')).status,404);});

test('five-player room enforces capacity, host start and active-round join rules',async t=>{const {client}=await setup(t);const clients=await Promise.all(Array.from({length:6},()=>client()));const host=await enter(clients[0]);for(let i=1;i<5;i++)await enter(clients[i],'join',host.code);const state=await clients[0].wait(m=>m.type==='state'&&m.players.length===5);assert.equal(state.host,host.id);assert.equal(new Set(state.players.map(p=>p.color)).size,5);
  clients[5].send({type:'join',code:host.code});assert.match((await clients[5].wait(m=>m.type==='error')).message,/満員/);
  clients[1].send({type:'start'});await new Promise(r=>setTimeout(r,60));
  clients[0].send({type:'start'});const started=await clients[0].wait(m=>m.type==='state'&&m.phase==='playing');assert.equal(started.players.length,5);assert.ok(started.players.some(p=>p.id===started.tagger));
  clients[4].send({type:'leave'});await clients[4].wait(m=>m.type==='left');const extra=await client();extra.send({type:'join',code:host.code});assert.match((await extra.wait(m=>m.type==='error')).message,/対戦中/);
});

test('solo start is rejected; bad room codes and cross-origin sockets are rejected',async t=>{const {client,url}=await setup(t);const c=await client();await enter(c);c.send({type:'start'});assert.match((await c.wait(m=>m.type==='error')).message,/2人以上/);const other=await client();other.send({type:'join',code:'BADBAD'});assert.match((await other.wait(m=>m.type==='error')).message,/見つかりません/);
const foreign=new WebSocket(url.replace('http','ws'),{origin:'https://foreign.example'});const code=await new Promise(r=>foreign.on('close',r));assert.equal(code,1008);});

test('server caps movement, applies obstacle collisions, boosts and decays speed',async t=>{const {client,game}=await setup(t);const c=await client();const {code,id}=await enter(c);const p=game.rooms.get(code).players.get(id);p.x=70;p.z=30;c.send({type:'input',x:1000,z:0});await new Promise(r=>setTimeout(r,550));assert.ok(p.x<=71.5);p.x=-24;p.z=-4;c.send({type:'input',x:0,z:-1});await new Promise(r=>setTimeout(r,180));assert.ok(p.z>=-4.44,'cannot walk through school wall');c.send({type:'input',x:0,z:0});c.send({type:'tap'});await new Promise(r=>setTimeout(r,60));assert.ok(p.boost>0);assert.ok(p.speed>3.2);await new Promise(r=>setTimeout(r,500));assert.equal(p.boost,0);
});

test('touch transfers tagger once, grace period prevents immediate retag; round scores and host migration work',async t=>{const {client,game}=await setup(t);const a=await client(),b=await client();const host=await enter(a);const second=await enter(b,'join',host.code);a.send({type:'start'});await a.wait(m=>m.type==='state'&&m.phase==='playing');const room=game.rooms.get(host.code);const original=room.tagger;for(const p of room.players.values()){p.x=4;p.z=0;}room.safeUntil=0;await new Promise(r=>setTimeout(r,70));assert.notEqual(room.tagger,original);const next=room.tagger;await new Promise(r=>setTimeout(r,120));assert.equal(room.tagger,next);assert.equal(room.players.get(original).tags,1);assert.ok([...room.players.values()].some(p=>p.score>0));room.ends=Date.now()-1;const end=await a.wait(m=>m.type==='state'&&m.phase==='finished');assert.equal(end.remaining,0);a.send({type:'leave'});await a.wait(m=>m.type==='left');const migrated=await b.wait(m=>m.type==='state'&&m.host===second.id);assert.equal(migrated.players.length,1);b.send({type:'leave'});await b.wait(m=>m.type==='left');assert.equal(game.rooms.size,0);
});

test('explicit Pages origin can create a room on the external game server',async t=>{
  const {url}=await setup(t,{allowedOrigins:['https://yuseimorishima.github.io']});
  const ws=new WebSocket(url.replace('http','ws'),{origin:'https://yuseimorishima.github.io'});
  await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});
  const welcome=new Promise((r,j)=>{const timer=setTimeout(()=>j(new Error('No welcome')),2000);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='welcome'){clearTimeout(timer);r(m);}});});
  ws.send(JSON.stringify({type:'create',name:'Pages'}));assert.match((await welcome).code,/^[A-F0-9]{6}$/);
});
