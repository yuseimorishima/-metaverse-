import {OBSTACLES,SPAWNS,canStand} from './school-map.js?v=5';
export {OBSTACLES};
const COLORS = ['#b49aff','#64ebda','#ffcc75','#ff88ba','#82baff'];
const ROUND_MS = 120000;
function randomUUID(){return globalThis.crypto.randomUUID();}
function roomCode(){const bytes=globalThis.crypto.getRandomValues(new Uint8Array(3));return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();}
export function createGameHub({roundMs=ROUND_MS,send,makeCode=roomCode}={}){
  const rooms=new Map();
  function snapshot(room){return {type:'state',code:room.code,host:room.host,phase:room.phase,remaining:Math.max(0,Math.ceil((room.ends-Date.now())/1000)),tagger:room.tagger,cooldown:Math.max(0,room.safeUntil-Date.now()),event:room.event,players:[...room.players.values()].map(({ws,input,lastTap,lastInput,boostAt,...p})=>p),obstacles:OBSTACLES};}
  function broadcast(room){const state=snapshot(room);for(const p of room.players.values())send(p.ws,state);}
  function event(room,text){room.event={id:randomUUID(),text};}
  function finish(room,text='ラウンド終了！'){room.phase='finished';room.ends=Date.now();event(room,text);}
  function leave(ws){const room=rooms.get(ws.room);if(!room)return;const p=room.players.get(ws.pid);room.players.delete(ws.pid);if(!room.players.size){rooms.delete(room.code);return;}
    if(room.host===ws.pid)room.host=room.players.keys().next().value;
    if(room.tagger===ws.pid){room.tagger=room.players.keys().next().value;room.safeUntil=Date.now()+3000;}
    event(room,`${p?.name||'プレイヤー'} が退出しました`);
    if(room.phase==='playing'&&room.players.size<2)finish(room,'人数が足りないためラウンド終了');broadcast(room);ws.room=null;
  }
  function message(ws,m){const now=Date.now();if(!m||typeof m!=='object')return;
      if(m.type==='create'||m.type==='join'){
        if(ws.room){send(ws,{type:'error',message:'すでにルームに参加しています'});return;}
        let room;
        if(m.type==='create'){let code;do{code=makeCode();}while(rooms.has(code));room={code,players:new Map(),phase:'lobby',host:null,tagger:null,ends:0,safeUntil:0,event:null};rooms.set(code,room);}
        else{room=rooms.get(String(m.code||'').trim().toUpperCase());if(!room){send(ws,{type:'error',message:'ルームが見つかりません。コードを確認してください'});return;}}
        if(room.players.size>=5){send(ws,{type:'error',message:'このルームは満員です（最大5人）'});return;}
        if(room.phase==='playing'){send(ws,{type:'error',message:'対戦中です。ラウンド終了後に参加してください'});return;}
        const id=randomUUID();const slot=[0,1,2,3,4].find(i=>![...room.players.values()].some(p=>p.slot===i));
        const p={id,slot,name:String(m.name||'ゲスト').replace(/[\x00-\x1f]/g,'').trim().slice(0,12)||'ゲスト',color:COLORS[slot],x:SPAWNS[slot].x,z:SPAWNS[slot].z,angle:0,boost:0,boostAt:now,speed:0,score:0,tags:0,input:{x:0,z:0},lastTap:0,lastInput:now,ws};
        room.players.set(id,p);room.host ||= id;ws.room=room.code;ws.pid=id;send(ws,{type:'welcome',id,code:room.code});event(room,`${p.name} が参加しました`);broadcast(room);return;
      }
      const room=rooms.get(ws.room),p=room?.players.get(ws.pid);if(!p)return;
      if(m.type==='leave'){leave(ws);send(ws,{type:'left'});return;}
      if(m.type==='input'){if(Number.isFinite(m.x)&&Number.isFinite(m.z)){const length=Math.max(1,Math.hypot(m.x,m.z));p.input={x:m.x/length,z:m.z/length};p.lastInput=now;}}
      if(m.type==='tap'&&now-p.lastTap>=65){p.boost=Math.min(1,Math.max(0,p.boost-Math.max(0,now-p.boostAt)/1000*.44)+.17);p.boostAt=now;p.lastTap=now;}
      if(m.type==='start'&&room.host===p.id&&room.phase!=='playing'){
        if(room.players.size<2){send(ws,{type:'error',message:'開始には2人以上必要です。友達を招待しましょう'});return;}
        room.phase='playing';room.ends=now+roundMs;room.safeUntil=now+4000;room.tagger=[...room.players.keys()][Math.floor(Math.random()*room.players.size)];
        let i=0;for(const v of room.players.values()){const spawn=SPAWNS[i++];Object.assign(v,{x:spawn.x,z:spawn.z,score:0,tags:0,boost:0,boostAt:now,input:{x:0,z:0}});}
        event(room,'スタート！光るリングのプレイヤーが鬼');broadcast(room);
      }

  }
  let lastTick=Date.now();
  const valid=canStand;
  function tick(now=Date.now()){
    const gap=Math.max(0,now-lastTick);lastTick=now;
    const dt=Math.min(.5,gap/1000),steps=Math.max(1,Math.ceil(dt*60)),step=dt/steps;
    for(const room of rooms.values()){
      for(const p of room.players.values()){
        p.boost=Math.max(0,p.boost-Math.max(0,now-p.boostAt)/1000*.44);p.boostAt=now;p.speed=3.2+p.boost*5.8;
        if(now-p.lastInput>Math.min(2000,Math.max(500,gap*1.5+100)))p.input={x:0,z:0};
        const {x,z}=p.input;if(x||z)p.angle=Math.atan2(x,z);
        for(let i=0;i<steps;i++){const nx=p.x+x*p.speed*step,nz=p.z+z*p.speed*step;if(valid(nx,p.z))p.x=nx;if(valid(p.x,nz))p.z=nz;}
        if(room.phase==='playing'&&p.id!==room.tagger)p.score+=dt;
      }
      if(room.phase==='playing'){
        if(now>=room.ends)finish(room);
        else if(now>=room.safeUntil){const tagger=room.players.get(room.tagger);for(const p of room.players.values())if(p.id!==tagger.id&&Math.hypot(p.x-tagger.x,p.z-tagger.z)<1.15){room.tagger=p.id;tagger.tags++;room.safeUntil=now+3000;event(room,`${tagger.name} → ${p.name} にタッチ！`);break;}}
      }
      broadcast(room);
    }
  }

  return {rooms,message,leave,tick};
}
