import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

import { createGameHub, OBSTACLES } from './public/game-core.js';
export { OBSTACLES };
export function createGameServer({roundMs = 120000, allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean)} = {}) {

  const root = fileURLToPath(new URL('./public/', import.meta.url));
  const server = http.createServer(async (req,res) => {
    const pathname = new URL(req.url,'http://local').pathname;
    if (pathname === '/health') { res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return; }
    const files = {'/':'index.html','/style.css':'style.css','/app.js':'app.js','/config.js':'config.js','/game-core.js':'game-core.js','/peer-transport.js':'peer-transport.js','/school-map.js':'school-map.js','/school-scene.js':'school-scene.js','/school-materials.js':'school-materials.js','/spawn-guide.js':'spawn-guide.js'};
    try {
      const file = pathname === '/vendor/peerjs.js' ? fileURLToPath(new URL('./node_modules/peerjs/dist/peerjs.min.js', import.meta.url)) : pathname === '/vendor/three.js' ? fileURLToPath(new URL('./node_modules/three/build/three.module.js', import.meta.url)) : pathname === '/vendor/three.core.js' ? fileURLToPath(new URL('./node_modules/three/build/three.core.js', import.meta.url)) : files[pathname] && root+files[pathname];
      if(!file){res.writeHead(404);res.end('Not found');return;}
      const data=await readFile(file);
      res.writeHead(200,{'Content-Type':pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.css')?'text/css':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(data);
    } catch {res.writeHead(500);res.end('Server error');}
  });
  const wss = new WebSocketServer({server,maxPayload:2048});
  const hub=createGameHub({roundMs,send:(ws,data)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));}});
  const rooms=hub.rooms;
  wss.on('connection',(ws,req)=>{
    if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host&&!allowedOrigins.includes(new URL(req.headers.origin).origin)){ws.close(1008);return;}}catch{ws.close(1008);return;}}
    ws.alive=true;ws.on('pong',()=>ws.alive=true);
    let windowStart=Date.now(),messages=0;
    ws.on('message',raw=>{const now=Date.now();if(now-windowStart>1000){windowStart=now;messages=0;}if(++messages>100){ws.close(1008,'Rate limit');return;}let m;try{m=JSON.parse(raw);}catch{return;}hub.message(ws,m);});
    ws.on('close',()=>hub.leave(ws));ws.on('error',()=>{});
  });
  const tick=setInterval(()=>hub.tick(),1000/30);
  const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},15000);
  return {server,rooms,close:async()=>{clearInterval(tick);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const {server}=createGameServer();server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('NEON TAG listening on port '+(process.env.PORT||3000)));
}
