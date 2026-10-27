import * as THREE from './vendor/three.js';
import { PeerTransport } from './peer-transport.js?v=8';
import { createSchool } from './school-scene.js?v=8';
import { schoolSky } from './school-materials.js?v=8';
import { createGameHub } from './game-core.js?v=8';
const $=id=>document.getElementById(id);
let socket, myId, state, lastEvent, wasPlaying=false, sounds=false, audio, toastTimer, eventTimer, exploring=false;
let yaw=0,pitch=0;
const keys=new Set(), pointers=new Map(),avatars=new Map();
const scene=new THREE.Scene();scene.background=new THREE.Color('#bfd9d8');scene.fog=new THREE.Fog('#bfd9d8',85,210);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.08,260);camera.rotation.order='YXZ';camera.position.set(80,58,68);camera.lookAt(-7,3,-23);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{$('error').textContent='3D表示にはWebGL対応ブラウザが必要です';throw new Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;$('world').append(renderer.domElement);
schoolSky(renderer,scene);
scene.add(new THREE.HemisphereLight('#eef3ff','#a3a28d',1.1));
const sun=new THREE.DirectionalLight('#fff0d8',3);sun.position.set(-40,65,30);sun.castShadow=true;sun.shadow.mapSize.set(innerWidth<800?1024:2048,innerWidth<800?1024:2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:.5,far:160});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;sun.shadow.radius=2;scene.add(sun);scene.add(sun.target);
const arena=createSchool(scene);
let reducedQuality=false,idleFrames=30;
function setQuality(reduced){idleFrames=30;reducedQuality=reduced;renderer.setPixelRatio(Math.min(devicePixelRatio,reduced?.7:1.5));renderer.shadowMap.enabled=!reduced;renderer.shadowMap.needsUpdate=true;arena.traverse(o=>{if(o.isPointLight)o.visible=!reduced;});$('quality').textContent=reduced?'画質：軽量':'画質：標準';$('quality').setAttribute('aria-pressed',String(reduced));try{localStorage.setItem('neon-quality',reduced?'low':'standard');}catch{}}
$('quality').onclick=()=>setQuality(!reducedQuality);try{if(localStorage.getItem('neon-quality')==='low')setQuality(true);}catch{}
function label(text,color){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#171222cc';c.beginPath();c.roundRect(32,12,448,64,24);c.fill();c.font='bold 29px sans-serif';c.fillStyle=color;c.textAlign='center';c.fillText(text,256,55);const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.scale.set(2.6,.49,1);sprite.position.y=2.65;return sprite;}
function avatar(p,demo=false){const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:p.color,roughness:.45});const dark=new THREE.MeshStandardMaterial({color:'#282136'});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.48,4,8),mat);body.position.y=1.03;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),new THREE.MeshStandardMaterial({color:'#f6d8c9'}));head.position.y=1.73;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12,0,Math.PI*2,0,Math.PI*.52),dark);hair.position.y=1.8;g.add(hair);
  const face=new THREE.Mesh(new THREE.BoxGeometry(.27,.1,.06),dark);face.position.set(0,1.75,.27);g.add(face);
  const legs=[];for(const x of [-.18,.18]){const l=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.35,3,6),dark);l.position.set(x,.4,0);l.castShadow=true;g.add(l);legs.push(l);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.36,3,6),mat);arm.position.set(x*2.5,1.05,0);g.add(arm);legs.push(arm);}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.055,8,48),new THREE.MeshBasicMaterial({color:'#ff6b90'}));ring.rotation.x=Math.PI/2;ring.position.y=.09;g.add(ring);
  const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.16),new THREE.MeshBasicMaterial({color:'#e5d6ff'}));marker.position.y=3.1;g.add(marker);marker.visible=false;
  const tag=label(p.name,p.color);g.add(tag);g.position.set(p.x,p.y||0,p.z);arena.add(g);return {g,ring,marker,legs,label:tag,demo,height:p.y||0};
}
const demos=[{id:'d1',name:'RUNNER',color:'#b49aff',x:3,z:5},{id:'d2',name:'CATCH ME',color:'#69e3d2',x:-2,z:8},{id:'d3',name:'LET’S PLAY',color:'#ffc477',x:9,z:0}].map(p=>avatar(p,true));
demos[0].ring.visible=true;demos[1].ring.visible=false;demos[2].ring.visible=false;
function disposeAvatar(a){arena.remove(a.g);a.g.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});}
function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',3500);}
function beep(freq=600){if(!sounds)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.frequency.setValueAtTime(freq,audio.currentTime);gain.gain.setValueAtTime(.04,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);osc.start();osc.stop(audio.currentTime+.17);}catch{}}
function send(m){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(m));}
function reset(){setMenu(false);$('main-header').append($('quality'),$('sound'));idleFrames=30;exploring=false;document.exitPointerLock?.();myId=null;state=null;wasPlaying=false;keys.clear();pointers.clear();$('landing').hidden=false;$('scene-caption').hidden=false;$('footer').hidden=false;$('game-ui').hidden=true;$('results').hidden=true;document.body.classList.remove('playing','solo');for(const a of avatars.values())disposeAvatar(a);avatars.clear();demos.forEach(a=>a.g.visible=true);$('create').disabled=false;$('join').disabled=false;}
const config=window.NEON_TAG_CONFIG||{};
const usePeer=config.transport==='peer';
let backend=config.serverUrl||'', reconnectTimer;
try{backend=localStorage.getItem('neon-backend:'+location.pathname)||backend;}catch{}
function backendSocketUrl(value){
  const url=new URL(value||location.origin);
  if(!['http:','https:','ws:','wss:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('HTTPSのサーバーURLを入力してください');
  if(location.protocol==='https:'&&['http:','ws:'].includes(url.protocol))throw new Error('公開ページにはHTTPSのサーバーURLが必要です');
  url.protocol=['https:','wss:'].includes(url.protocol)?'wss:':'ws:';return url.href;
}
function connect(){
  clearTimeout(reconnectTimer);
  if(!usePeer&&!backend&&config.requireBackend){$('connection').textContent='サーバー未設定';$('create').disabled=true;$('join').disabled=true;$('server-settings').open=true;return;}
  let address;try{if(!usePeer)address=backendSocketUrl(backend);}catch(e){toast(e.message);return;}
  $('connection').textContent='接続中';$('create').disabled=true;$('join').disabled=true;
  const previous=socket,ws=usePeer?new PeerTransport(config.peerOptions||{}):new WebSocket(address);socket=ws;previous?.close();
  ws.addEventListener('open',()=>{if(socket!==ws)return;$('connection').textContent='ONLINE';$('create').disabled=false;$('join').disabled=false;});
  ws.addEventListener('close',()=>{if(socket!==ws)return;const hadRoom=!!myId;reset();$('connection').textContent='再接続中';$('create').disabled=true;$('join').disabled=true;if(hadRoom)toast('接続が切れました。再接続後にルームへ入り直してください');if(!usePeer)reconnectTimer=setTimeout(connect,2500);else{$('connection').textContent='接続できません';$('error').textContent='接続できません。ページを再読み込みするか、別のWi-Fiで試してください';}});
  ws.addEventListener('error',()=>{if(socket===ws)$('connection').textContent='接続を確認中';});
  listen(ws);
}
function listen(ws){
  ws.addEventListener('message',({data})=>{if(socket!==ws)return;const m=JSON.parse(data);if(m.type==='error'){$('error').textContent=m.message;toast(m.message);$('create').disabled=false;$('join').disabled=false;}if(m.type==='welcome'){yaw=0;pitch=0;myId=m.id;$('landing').hidden=true;$('scene-caption').hidden=true;$('footer').hidden=true;$('game-ui').hidden=false;$('game-settings').append($('quality'),$('sound'));setMenu(false);document.body.classList.add('playing');document.body.classList.toggle('solo',exploring);demos.forEach(a=>a.g.visible=false);if(!exploring){const url=new URL(location.href);url.searchParams.set('room',m.code);history.replaceState(null,'',url);}}if(m.type==='state')renderState(m);if(m.type==='left'){const wasSolo=exploring;reset();history.replaceState(null,'',location.pathname);if(wasSolo)connect();}});
}

$('server-settings').hidden=usePeer||!config.requireBackend;
$('peer-note').hidden=!usePeer;
$('server-url').value=backend;
$('server-form').onsubmit=e=>{e.preventDefault();const value=$('server-url').value.trim();if(!value){toast('ゲームサーバーのURLを入力してください');return;}try{backendSocketUrl(value);}catch(error){toast(error.message);return;}backend=value;try{localStorage.setItem('neon-backend:'+location.pathname,value);}catch{}connect();};
function enter(type){if(socket?.readyState!==WebSocket.OPEN){toast('サーバーに接続中です');return;}try{localStorage.setItem('neon-name',$('name').value);}catch{}$('error').textContent='';$('create').disabled=true;$('join').disabled=true;send({type,name:$('name').value,code:$('code').value});}
$('explore').onclick=()=>{
  clearTimeout(reconnectTimer);const previous=socket;clearTimeout(toastTimer);$('toast').style.display='none';$('error').textContent='';
  const local=new EventTarget();local.readyState=1;let timer;
  const hub=createGameHub({send:(_,m)=>local.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(m)}))});const client={};
  local.send=raw=>{const m=JSON.parse(raw);hub.message(client,m);if(m.type==='leave')local.close();};local.close=()=>{clearInterval(timer);local.readyState=3;};
  socket=local;previous?.close();exploring=true;$('connection').textContent='SOLO';listen(local);local.send(JSON.stringify({type:'create',name:$('name').value||'探検者'}));timer=setInterval(()=>{hub.message(client,{type:'input',...movementInput()});hub.tick();},1000/30);
};
$('create').onclick=()=>enter('create');$('join-form').onsubmit=e=>{e.preventDefault();if(!/^[a-fA-F0-9]{6}$/.test($('code').value.trim())){$('error').textContent='6文字のルームコードを入力してください';return;}enter('join');};
function setMenu(open){$('game-menu').hidden=!open;$('menu-toggle').setAttribute('aria-expanded',String(open));if(open){document.exitPointerLock?.();clearInputs();$('menu-close').focus();}else if(myId)$('menu-toggle').focus();}
$('menu-toggle').onclick=()=>setMenu($('game-menu').hidden);$('menu-close').onclick=()=>setMenu(false);
$('start').onclick=()=>send({type:'start'});$('again').onclick=()=>send({type:'start'});$('leave').onclick=()=>send({type:'leave'});
$('copy').onclick=async()=>{if(!state)return;try{await navigator.clipboard.writeText(state.code);toast('ルームコード '+state.code+' をコピーしました');}catch{toast('ルームコード: '+state.code);}};
$('sound').onclick=()=>{sounds=!sounds;$('sound').textContent=sounds?'音 ON':'音 OFF';beep();};
function renderState(m){if(!myId)return;state=m;$('copy').textContent=m.code+' ⧉';$('timer').textContent=m.phase==='lobby'?'02:00':`${String(Math.floor(m.remaining/60)).padStart(2,'0')}:${String(m.remaining%60).padStart(2,'0')}`;$('count').textContent=`${m.players.length} / 5`;
  const me=m.players.find(p=>p.id===myId),host=m.host===myId,isPlaying=m.phase==='playing',isIt=m.tagger===myId;
  $('players').replaceChildren(...m.players.map(p=>{const row=document.createElement('div');row.className='player-row';const dot=document.createElement('span');dot.className='player-dot';dot.style.background=p.color;const name=document.createElement('span');name.className='player-name';name.textContent=p.name+(p.id===myId?' (YOU)':'');const badge=document.createElement(p.id===m.tagger&&isPlaying?'b':'small');badge.textContent=p.id===m.tagger&&isPlaying?'鬼':p.id===m.host?'HOST':`${Math.floor(p.score)}s`;row.append(dot,name,badge);return row;}));
  $('game-ui').dataset.phase=m.phase;$('timer-box').hidden=!isPlaying;$('tag-role').textContent=isIt?'あなたが鬼':'鬼から逃げよう';$('tag-role').style.color=isIt?'#ffb2c2':'#eef5ee';
  if(isPlaying&&!wasPlaying)setMenu(false);
  $('start').hidden=exploring||isPlaying||!host||m.phase==='finished';$('start').disabled=m.players.length<2;
  if(me){$('speed').replaceChildren(document.createTextNode(me.speed.toFixed(1)+' '));const u=document.createElement('small');u.textContent='m/s';$('speed').append(u);$('boost').style.width=`${me.boost*100}%`;}
  for(const p of m.players){if(!avatars.has(p.id))avatars.set(p.id,avatar(p));const a=avatars.get(p.id);a.target=p;a.ring.visible=isPlaying&&p.id===m.tagger;a.ring.material.color.set(m.cooldown>0?'#ffcc75':'#ff6b90');a.marker.visible=false;a.g.visible=p.id!==myId;}
  for(const [id,a] of avatars)if(!m.players.some(p=>p.id===id)){disposeAvatar(a);avatars.delete(id);}
  if(m.event?.id!==lastEvent){lastEvent=m.event?.id;$('event').textContent=m.event?.text||'';clearTimeout(eventTimer);eventTimer=setTimeout(()=>$('event').textContent='',3000);beep(isIt?260:680);}
  $('results').hidden=m.phase!=='finished';if(m.phase==='finished'){const sorted=[...m.players].sort((a,b)=>b.score-a.score);$('ranking').replaceChildren(...sorted.map((p,i)=>{const li=document.createElement('li');const pos=document.createElement('span');pos.textContent=String(i+1).padStart(2,'0');pos.style.color=p.color;const name=document.createElement('span');name.textContent=p.name;const score=document.createElement('strong');score.textContent=p.score.toFixed(1)+' 秒';li.append(pos,name,score);return li;}));if(wasPlaying)beep(900);}
  $('again').hidden=!host;$('again').disabled=m.players.length<2;$('again-hint').textContent=host?(m.players.length<2?'2人以上で再開できます':'同じメンバーでもう一度！'):'ホストが次のラウンドを始めるのを待っています';wasPlaying=isPlaying;
  $('room-code-box').hidden=exploring;$('players-panel').hidden=exploring;

}
function tap(){if(!myId)return;send({type:'tap'});beep(350+Math.random()*200);$('dash').animate([{background:'#bba0ff99'},{background:'#9d7cec33'}],{duration:160});}
$('dash').addEventListener('pointerdown',e=>{e.preventDefault();tap();});
for(const b of $('movement').querySelectorAll('button')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,b.dataset.dir);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>pointers.delete(e.pointerId));}
const controlKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyQ','KeyE'];
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('game-menu').hidden){setMenu(false);return;}if(!myId||!$('game-menu').hidden||!controlKeys.includes(e.code)||/INPUT|TEXTAREA/.test(e.target.tagName))return;e.preventDefault();if(e.code==='Space'&&!e.repeat)tap();keys.add(e.code);});window.addEventListener('keyup',e=>keys.delete(e.code));
function clearInputs(){keys.clear();pointers.clear();send({type:'input',x:0,z:0});}window.addEventListener('blur',clearInputs);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInputs();});
function movementInput(){if(!$('game-menu').hidden)return {x:0,z:0};const dirs=[...pointers.values()];const right=keys.has('KeyD')||keys.has('ArrowRight')||dirs.includes('right'),left=keys.has('KeyA')||keys.has('ArrowLeft')||dirs.includes('left'),up=keys.has('KeyW')||keys.has('ArrowUp')||dirs.includes('up'),down=keys.has('KeyS')||keys.has('ArrowDown')||dirs.includes('down');const dx=Number(right)-Number(left),dz=Number(down)-Number(up);return {x:Math.cos(yaw)*dx+Math.sin(yaw)*dz,z:-Math.sin(yaw)*dx+Math.cos(yaw)*dz};}
setInterval(()=>{if(myId)send({type:'input',...movementInput()});},50);
try{$('name').value=localStorage.getItem('neon-name')||'';}catch{}const invite=new URL(location.href).searchParams.get('room');if(invite)$('code').value=invite.slice(0,6);
window.addEventListener('resize',()=>{idleFrames=30;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
// Click to capture the mouse; dragging also works when pointer lock is unavailable.
function rotate(dx,dy){yaw-=dx*.0028;pitch=THREE.MathUtils.clamp(pitch-dy*.0028,-1.2,1.2);}
$('look').onclick=()=>{const result=renderer.domElement.requestPointerLock?.();result?.catch?.(()=>toast('画面のドラッグ、またはQ/Eキーでも見回せます'));};
let lookPointer=null,lastLookX=0,lastLookY=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(!myId||!$('game-menu').hidden)return;if(e.pointerType==='touch'&&e.clientX<innerWidth*.4)return;lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!myId)return;if(document.pointerLockElement===renderer.domElement)rotate(e.movementX,e.movementY);else if(e.pointerId===lookPointer){rotate(e.clientX-lastLookX,e.clientY-lastLookY);lastLookX=e.clientX;lastLookY=e.clientY;}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(type,()=>lookPointer=null);
document.addEventListener('pointerlockchange',()=>{$('look').textContent=document.pointerLockElement?'Escで解除':'見回す';clearInputs();});
const clock=new THREE.Clock(),camTarget=new THREE.Vector3();let elapsed=0,shadowTimer=1;
function frame(){requestAnimationFrame(frame);if(!myId){if(idleFrames<=0)return;idleFrames--;}const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
  for(const a of avatars.values()){const p=a.target;if(!p)continue;const old=a.g.position.clone();a.g.position.x=THREE.MathUtils.damp(a.g.position.x,p.x,20,dt);a.g.position.z=THREE.MathUtils.damp(a.g.position.z,p.z,20,dt);a.height=THREE.MathUtils.damp(a.height,p.y||0,20,dt);let angle=p.angle-a.g.rotation.y;angle=Math.atan2(Math.sin(angle),Math.cos(angle));a.g.rotation.y+=angle*Math.min(1,dt*15);const moving=old.distanceTo(a.g.position)>.003;a.legs.forEach((l,j)=>l.rotation.x=moving?Math.sin(elapsed*(8+p.boost*8)+(j%2)*Math.PI)*.6:0);a.g.position.y=a.height+(moving?Math.abs(Math.sin(elapsed*12))*.04:0);}
  if(myId){if(keys.has('KeyQ'))yaw+=dt*1.7;if(keys.has('KeyE'))yaw-=dt*1.7;const me=avatars.get(myId);if(me){camera.position.set(me.g.position.x,me.height+1.65,me.g.position.z);camera.rotation.set(pitch,yaw,0,'YXZ');}}
  else{camera.position.lerp(camTarget.set(80,58,68),dt*2);camera.lookAt(-7,3,-23);}
  shadowTimer+=dt;if(shadowTimer>.25){const x=myId?camera.position.x:0,y=myId?camera.position.y-1.65:0,z=myId?camera.position.z:0;sun.position.set(x-40,y+65,z+30);sun.target.position.set(x,y,z);sun.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;shadowTimer=0;}
  renderer.render(scene,camera);
}connect();frame();
