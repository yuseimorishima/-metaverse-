import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

export const OBSTACLES = [ [-7,-6,4,3], [7,6,4,3], [-7,7,3,4], [7,-7,3,4], [0,0,3,3] ];
const COLORS = ['#b49aff','#64ebda','#ffcc75','#ff88ba','#82baff'];
const ROUND_MS = 120000;
export function createGameServer({roundMs = ROUND_MS, allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean)} = {}) {
  const rooms = new Map();
  const root = fileURLToPath(new URL('./public/', import.meta.url));
  const server = http.createServer(async (req,res) => {
    const pathname = new URL(req.url,'http://local').pathname;
    if (pathname === '/health') { res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return; }
    const files = {'/':'index.html','/style.css':'style.css','/app.js':'app.js','/config.js':'config.js'};
    try {
      const file = pathname === '/vendor/three.js' ? fileURLToPath(new URL('./node_modules/three/build/three.module.js', import.meta.url)) : pathname === '/vendor/three.core.js' ? fileURLToPath(new URL('./node_modules/three/build/three.core.js', import.meta.url)) : files[pathname] && root+files[pathname];
      if(!file){res.writeHead(404);res.end('Not found');return;}
      const data=await readFile(file);
      res.writeHead(200,{'Content-Type':pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.css')?'text/css':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(data);
    } catch {res.writeHead(500);res.end('Server error');}
  });
  const wss = new WebSocketServer({server,maxPayload:2048});
  function send(ws,data){if(ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(data));}
  function snapshot(room){return {type:'state',code:room.code,host:room.host,phase:room.phase,remaining:Math.max(0,Math.ceil((room.ends-Date.now())/1000)),tagger:room.tagger,cooldown:Math.max(0,room.safeUntil-Date.now()),event:room.event,players:[...room.players.values()].map(({ws,input,lastTap,lastInput,...p})=>p),obstacles:OBSTACLES};}
  function broadcast(room){const state=snapshot(room);for(const p of room.players.values())send(p.ws,state);}
  function event(room,text){room.event={id:randomUUID(),text};}
  function finish(room,text='ラウンド終了！'){room.phase='finished';room.ends=Date.now();event(room,text);}
  function leave(ws){const room=rooms.get(ws.room);if(!room)return;const p=room.players.get(ws.pid);room.players.delete(ws.pid);if(!room.players.size){rooms.delete(room.code);return;}
    if(room.host===ws.pid)room.host=room.players.keys().next().value;
    if(room.tagger===ws.pid){room.tagger=room.players.keys().next().value;room.safeUntil=Date.now()+3000;}
    event(room,`${p?.name||'プレイヤー'} が退出しました`);
    if(room.phase==='playing'&&room.players.size<2)finish(room,'人数が足りないためラウンド終了');broadcast(room);ws.room=null;
  }
  wss.on('connection',(ws,req)=>{
    // Permit same-origin pages and explicitly configured frontend origins.
    if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host&&!allowedOrigins.includes(new URL(req.headers.origin).origin)){ws.close(1008);return;}}catch{ws.close(1008);return;}}
    ws.alive=true;ws.on('pong',()=>ws.alive=true);
    let windowStart=Date.now(),messages=0;
    ws.on('message',raw=>{
      const now=Date.now();if(now-windowStart>1000){windowStart=now;messages=0;}if(++messages>100){ws.close(1008,'Rate limit');return;}
      let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;
      if(m.type==='create'||m.type==='join'){
        if(ws.room){send(ws,{type:'error',message:'すでにルームに参加しています'});return;}
        let room;
        if(m.type==='create'){let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));room={code,players:new Map(),phase:'lobby',host:null,tagger:null,ends:0,safeUntil:0,event:null};rooms.set(code,room);}
        else{room=rooms.get(String(m.code||'').trim().toUpperCase());if(!room){send(ws,{type:'error',message:'ルームが見つかりません。コードを確認してください'});return;}}
        if(room.players.size>=5){send(ws,{type:'error',message:'このルームは満員です（最大5人）'});return;}
        if(room.phase==='playing'){send(ws,{type:'error',message:'対戦中です。ラウンド終了後に参加してください'});return;}
        const id=randomUUID();const slot=[0,1,2,3,4].find(i=>![...room.players.values()].some(p=>p.slot===i));const a=slot*Math.PI*2/5;
        const p={id,slot,name:String(m.name||'ゲスト').replace(/[\x00-\x1f]/g,'').trim().slice(0,12)||'ゲスト',color:COLORS[slot],x:Math.cos(a)*11,z:Math.sin(a)*11,angle:0,boost:0,speed:0,score:0,tags:0,input:{x:0,z:0},lastTap:0,lastInput:now,ws};
        room.players.set(id,p);room.host ||= id;ws.room=room.code;ws.pid=id;send(ws,{type:'welcome',id,code:room.code});event(room,`${p.name} が参加しました`);broadcast(room);return;
      }
      const room=rooms.get(ws.room),p=room?.players.get(ws.pid);if(!p)return;
      if(m.type==='leave'){leave(ws);send(ws,{type:'left'});return;}
      if(m.type==='input'){if(Number.isFinite(m.x)&&Number.isFinite(m.z)){const length=Math.max(1,Math.hypot(m.x,m.z));p.input={x:m.x/length,z:m.z/length};p.lastInput=now;}}
      if(m.type==='tap'&&now-p.lastTap>=65){p.boost=Math.min(1,p.boost+0.17);p.lastTap=now;}
      if(m.type==='start'&&room.host===p.id&&room.phase!=='playing'){
        if(room.players.size<2){send(ws,{type:'error',message:'開始には2人以上必要です。友達を招待しましょう'});return;}
        room.phase='playing';room.ends=now+roundMs;room.safeUntil=now+4000;room.tagger=[...room.players.keys()][Math.floor(Math.random()*room.players.size)];
        let i=0;for(const v of room.players.values()){const a=i++*Math.PI*2/room.players.size;Object.assign(v,{x:Math.cos(a)*11,z:Math.sin(a)*11,score:0,tags:0,boost:0,input:{x:0,z:0}});}
        event(room,'スタート！光るリングのプレイヤーが鬼');broadcast(room);
      }
    });
    ws.on('close',()=>leave(ws));ws.on('error',()=>{});
  });
  const dt=1/30;
  function valid(x,z){return Math.abs(x)<14.4&&Math.abs(z)<14.4&&!OBSTACLES.some(([ox,oz,w,d])=>Math.abs(x-ox)<w/2+0.48&&Math.abs(z-oz)<d/2+0.48);}
  const tick=setInterval(()=>{
    const now=Date.now();for(const room of rooms.values()){
      for(const p of room.players.values()){
        p.boost=Math.max(0,p.boost-dt*0.44);p.speed=3.2+p.boost*5.8;
        if(now-p.lastInput>500)p.input={x:0,z:0};
        const {x,z}=p.input;if(x||z)p.angle=Math.atan2(x,z);
        const nx=p.x+x*p.speed*dt,nz=p.z+z*p.speed*dt;if(valid(nx,p.z))p.x=nx;if(valid(p.x,nz))p.z=nz;
        if(room.phase==='playing'&&p.id!==room.tagger)p.score+=dt;
      }
      if(room.phase==='playing'){
        if(now>=room.ends)finish(room);
        else if(now>=room.safeUntil){const tagger=room.players.get(room.tagger);for(const p of room.players.values())if(p.id!==tagger.id&&Math.hypot(p.x-tagger.x,p.z-tagger.z)<1.15){room.tagger=p.id;tagger.tags++;room.safeUntil=now+3000;event(room,`${tagger.name} → ${p.name} にタッチ！`);break;}}
      }
      broadcast(room);
    }
  },1000/30);
  const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},15000);
  return {server,rooms,close:async()=>{clearInterval(tick);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const {server}=createGameServer();server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('NEON TAG listening on port '+(process.env.PORT||3000)));
}
