import * as THREE from './vendor/three.js';
const $=id=>document.getElementById(id);
let socket, myId, state, lastEvent, wasPlaying=false, sounds=false, audio, toastTimer;
const keys=new Set(), pointers=new Map(),avatars=new Map();
const scene=new THREE.Scene();scene.background=new THREE.Color('#100f1c');scene.fog=new THREE.FogExp2('#100f1c',.007);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,180);camera.position.set(32,34,38);camera.lookAt(0,0,0);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{$('error').textContent='3D表示にはWebGL対応ブラウザが必要です';throw new Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;$('world').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xb1a6e9,0x252032,2.5));
const keyLight=new THREE.DirectionalLight('#cfbaff',3);keyLight.position.set(5,18,8);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-22;keyLight.shadow.camera.right=22;keyLight.shadow.camera.top=22;keyLight.shadow.camera.bottom=-22;scene.add(keyLight);
const mintLight=new THREE.PointLight('#66f4df',40,22);mintLight.position.set(-9,5,1);scene.add(mintLight);
const purpleLight=new THREE.PointLight('#a175ff',50,25);purpleLight.position.set(9,4,-4);scene.add(purpleLight);
const arena=new THREE.Group();scene.add(arena);
function box(w,h,d,color,x,y,z,emissive){const mat=new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.12,...(emissive?{emissive:color,emissiveIntensity:1.5}:{})});const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;arena.add(m);return m;}
box(31,.7,31,'#242031',0,-.5,0);box(30,.12,30,'#393147',0,-.08,0);
const grid=new THREE.GridHelper(30,30,0x75628e,0x4d405f);grid.position.y=.006;grid.material.transparent=true;grid.material.opacity=.35;arena.add(grid);
for(const x of [-15,15]){box(.08,.09,30,'#a47dff',x,.04,0,true);box(.3,.6,30,'#282035',x,-.1,0);}
for(const z of [-15,15]){box(30,.09,.08,'#a47dff',0,.04,z,true);box(30,.6,.3,'#282035',0,-.1,z);}
const obstacles=[[-7,-6,4,3],[7,6,4,3],[-7,7,3,4],[7,-7,3,4],[0,0,3,3]];
for(const [x,z,w,d] of obstacles){const h=x===0?1.9:1.4;box(w,h,d,'#504462',x,h/2,z);box(w+.05,.06,d+.05,x===0?'#b794ff':'#8b72aa',x,h,z,x===0);box(w-.3,.04,d-.3,'#3f354e',x,h+.055,z);for(let i=0;i<3;i++)box(.15,.23,.02,'#bca4dd',x-w/2+.5+i*.3,.35,z+d/2+.02);}
for(const [x,z] of [[-12,-12],[12,12],[12,-12],[-12,12]]){box(.6,2.5,.6,'#504260',x,1.25,z);box(.65,.3,.65,'#b89bff',x,2.5,z,true);}
// Small floating islands and columns give the arena its own night-time world.
for(let i=0;i<28;i++){const a=i*2.399,r=23+(i%4)*4;const x=Math.sin(a)*r,z=Math.cos(a)*r;box(2+(i%3),2+(i%6),2,'#1d1929',x,-3,z);}
const particles=new THREE.BufferGeometry();const coords=[];for(let i=0;i<200;i++){coords.push(Math.sin(i*12.989)*45,2+((i*7.31)%25),Math.cos(i*7.3)*45);}particles.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));scene.add(new THREE.Points(particles,new THREE.PointsMaterial({color:'#b9a0ff',size:.055,transparent:true,opacity:.6})));
function label(text,color){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#171222cc';c.beginPath();c.roundRect(32,12,448,64,24);c.fill();c.font='bold 29px sans-serif';c.fillStyle=color;c.textAlign='center';c.fillText(text,256,55);const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(2.6,.49,1);sprite.position.y=2.65;return sprite;}
function avatar(p,demo=false){const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:p.color,roughness:.45});const dark=new THREE.MeshStandardMaterial({color:'#282136'});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.48,4,8),mat);body.position.y=1.03;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),new THREE.MeshStandardMaterial({color:'#f6d8c9'}));head.position.y=1.73;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12,0,Math.PI*2,0,Math.PI*.52),dark);hair.position.y=1.8;g.add(hair);
  const face=new THREE.Mesh(new THREE.BoxGeometry(.27,.1,.06),dark);face.position.set(0,1.75,.27);g.add(face);
  const legs=[];for(const x of [-.18,.18]){const l=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.35,3,6),dark);l.position.set(x,.4,0);l.castShadow=true;g.add(l);legs.push(l);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.36,3,6),mat);arm.position.set(x*2.5,1.05,0);g.add(arm);legs.push(arm);}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.055,8,48),new THREE.MeshBasicMaterial({color:'#ff6b90'}));ring.rotation.x=Math.PI/2;ring.position.y=.09;g.add(ring);
  const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.16),new THREE.MeshBasicMaterial({color:'#e5d6ff'}));marker.position.y=3.1;g.add(marker);marker.visible=false;
  const tag=label(p.name,p.color);g.add(tag);g.position.set(p.x,0,p.z);arena.add(g);return {g,ring,marker,legs,label:tag,demo};
}
const demos=[{id:'d1',name:'RUNNER',color:'#b49aff',x:3,z:5},{id:'d2',name:'CATCH ME',color:'#69e3d2',x:-2,z:8},{id:'d3',name:'LET’S PLAY',color:'#ffc477',x:9,z:0}].map(p=>avatar(p,true));
demos[0].ring.visible=true;demos[1].ring.visible=false;demos[2].ring.visible=false;
function disposeAvatar(a){arena.remove(a.g);a.g.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});}
function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',3500);}
function beep(freq=600){if(!sounds)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.frequency.setValueAtTime(freq,audio.currentTime);gain.gain.setValueAtTime(.04,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);osc.start();osc.stop(audio.currentTime+.17);}catch{}}
function send(m){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(m));}
function reset(){myId=null;state=null;wasPlaying=false;keys.clear();pointers.clear();$('landing').hidden=false;$('scene-caption').hidden=false;$('footer').hidden=false;$('game-ui').hidden=true;$('results').hidden=true;document.body.classList.remove('playing');for(const a of avatars.values())disposeAvatar(a);avatars.clear();demos.forEach(a=>a.g.visible=true);$('create').disabled=false;$('join').disabled=false;}
const config=window.NEON_TAG_CONFIG||{};
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
  if(!backend&&config.requireBackend){$('connection').textContent='サーバー未設定';$('create').disabled=true;$('join').disabled=true;$('server-settings').open=true;return;}
  let address;try{address=backendSocketUrl(backend);}catch(e){toast(e.message);return;}
  $('connection').textContent='接続中';$('create').disabled=true;$('join').disabled=true;
  const previous=socket,ws=new WebSocket(address);socket=ws;previous?.close();
  ws.addEventListener('open',()=>{if(socket!==ws)return;$('connection').textContent='ONLINE';$('create').disabled=false;$('join').disabled=false;});
  ws.addEventListener('close',()=>{if(socket!==ws)return;const hadRoom=!!myId;reset();$('connection').textContent='再接続中';$('create').disabled=true;$('join').disabled=true;if(hadRoom)toast('接続が切れました。再接続後にルームへ入り直してください');reconnectTimer=setTimeout(connect,2500);});
  ws.addEventListener('error',()=>{if(socket===ws)$('connection').textContent='接続を確認中';});
  ws.addEventListener('message',({data})=>{if(socket!==ws)return;const m=JSON.parse(data);if(m.type==='error'){$('error').textContent=m.message;toast(m.message);$('create').disabled=false;$('join').disabled=false;}if(m.type==='welcome'){myId=m.id;$('landing').hidden=true;$('scene-caption').hidden=true;$('footer').hidden=true;$('game-ui').hidden=false;document.body.classList.add('playing');demos.forEach(a=>a.g.visible=false);const url=new URL(location.href);url.searchParams.set('room',m.code);history.replaceState(null,'',url);}if(m.type==='state')renderState(m);if(m.type==='left'){reset();history.replaceState(null,'',location.pathname);}});
}
$('server-settings').hidden=!config.requireBackend;
$('server-url').value=backend;
$('server-form').onsubmit=e=>{e.preventDefault();const value=$('server-url').value.trim();if(!value){toast('ゲームサーバーのURLを入力してください');return;}try{backendSocketUrl(value);}catch(error){toast(error.message);return;}backend=value;try{localStorage.setItem('neon-backend:'+location.pathname,value);}catch{}connect();};
function enter(type){if(socket?.readyState!==WebSocket.OPEN){toast('サーバーに接続中です');return;}try{localStorage.setItem('neon-name',$('name').value);}catch{}$('error').textContent='';$('create').disabled=true;$('join').disabled=true;send({type,name:$('name').value,code:$('code').value});}
$('create').onclick=()=>enter('create');$('join-form').onsubmit=e=>{e.preventDefault();if(!/^[a-fA-F0-9]{6}$/.test($('code').value.trim())){$('error').textContent='6文字のルームコードを入力してください';return;}enter('join');};
$('start').onclick=()=>send({type:'start'});$('again').onclick=()=>send({type:'start'});$('leave').onclick=()=>send({type:'leave'});
$('copy').onclick=async()=>{if(!state)return;try{await navigator.clipboard.writeText(state.code);toast('ルームコード '+state.code+' をコピーしました');}catch{toast('ルームコード: '+state.code);}};
$('sound').onclick=()=>{sounds=!sounds;$('sound').textContent=sounds?'音 ON':'音 OFF';beep();};
function renderState(m){if(!myId)return;state=m;$('copy').textContent=m.code+' ⧉';$('timer').textContent=m.phase==='lobby'?'02:00':`${String(Math.floor(m.remaining/60)).padStart(2,'0')}:${String(m.remaining%60).padStart(2,'0')}`;$('count').textContent=`${m.players.length} / 5`;
  const me=m.players.find(p=>p.id===myId),host=m.host===myId,isPlaying=m.phase==='playing',isIt=m.tagger===myId;
  $('players').replaceChildren(...m.players.map(p=>{const row=document.createElement('div');row.className='player-row';const dot=document.createElement('span');dot.className='player-dot';dot.style.background=p.color;const name=document.createElement('span');name.className='player-name';name.textContent=p.name+(p.id===myId?' (YOU)':'');const badge=document.createElement(p.id===m.tagger&&isPlaying?'b':'small');badge.textContent=p.id===m.tagger&&isPlaying?'鬼':p.id===m.host?'HOST':`${Math.floor(p.score)}s`;row.append(dot,name,badge);return row;}));
  $('start').hidden=isPlaying||!host||m.phase==='finished';$('start').disabled=m.players.length<2;$('phase-label').textContent=isPlaying?(isIt?'YOU ARE IT':'RUN FOR YOUR LIFE'):'WAITING ROOM';$('status-title').textContent=isPlaying?(isIt?'あなたが鬼！':'逃げきろう！'):'仲間を待っています';$('status-title').style.color=isPlaying&&isIt?'#ff94b1':'#f6f4ff';$('status-detail').textContent=isPlaying?(m.cooldown>0?`タッチ待機 ${Math.ceil(m.cooldown/1000)}秒`:isIt?'ほかのプレイヤーに触れて鬼を交代':'光るピンクのリングが鬼の目印'):host?'2人以上でスタート。最大5人まで参加できます':'ホストがゲームを始めるまで自由に走れます';
  if(me){$('speed').replaceChildren(document.createTextNode(me.speed.toFixed(1)+' '));const u=document.createElement('small');u.textContent='m/s';$('speed').append(u);$('boost').style.width=`${me.boost*100}%`;}
  for(const p of m.players){if(!avatars.has(p.id))avatars.set(p.id,avatar(p));const a=avatars.get(p.id);a.target=p;a.ring.visible=isPlaying&&p.id===m.tagger;a.ring.material.color.set(m.cooldown>0?'#ffcc75':'#ff6b90');a.marker.visible=p.id===myId;}
  for(const [id,a] of avatars)if(!m.players.some(p=>p.id===id)){disposeAvatar(a);avatars.delete(id);}
  if(m.event?.id!==lastEvent){lastEvent=m.event?.id;$('event').textContent=m.event?.text||'';beep(isIt?260:680);}
  $('results').hidden=m.phase!=='finished';if(m.phase==='finished'){const sorted=[...m.players].sort((a,b)=>b.score-a.score);$('ranking').replaceChildren(...sorted.map((p,i)=>{const li=document.createElement('li');const pos=document.createElement('span');pos.textContent=String(i+1).padStart(2,'0');pos.style.color=p.color;const name=document.createElement('span');name.textContent=p.name;const score=document.createElement('strong');score.textContent=p.score.toFixed(1)+' 秒';li.append(pos,name,score);return li;}));if(wasPlaying)beep(900);}
  $('again').hidden=!host;$('again').disabled=m.players.length<2;$('again-hint').textContent=host?(m.players.length<2?'2人以上で再開できます':'同じメンバーでもう一度！'):'ホストが次のラウンドを始めるのを待っています';wasPlaying=isPlaying;
}
function tap(){if(!myId)return;send({type:'tap'});beep(350+Math.random()*200);$('dash').animate([{background:'#bba0ff99'},{background:'#9d7cec33'}],{duration:160});}
$('dash').addEventListener('pointerdown',e=>{e.preventDefault();tap();});
for(const b of $('movement').querySelectorAll('button')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,b.dataset.dir);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>pointers.delete(e.pointerId));}
const controlKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
window.addEventListener('keydown',e=>{if(!myId||!controlKeys.includes(e.code)||/INPUT|TEXTAREA/.test(e.target.tagName))return;e.preventDefault();if(e.code==='Space'&&!e.repeat)tap();keys.add(e.code);});window.addEventListener('keyup',e=>keys.delete(e.code));
function clearInputs(){keys.clear();pointers.clear();send({type:'input',x:0,z:0});}window.addEventListener('blur',clearInputs);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInputs();});
setInterval(()=>{if(!myId)return;const dirs=[...pointers.values()];const right=keys.has('KeyD')||keys.has('ArrowRight')||dirs.includes('right'),left=keys.has('KeyA')||keys.has('ArrowLeft')||dirs.includes('left'),up=keys.has('KeyW')||keys.has('ArrowUp')||dirs.includes('up'),down=keys.has('KeyS')||keys.has('ArrowDown')||dirs.includes('down');const dx=Number(right)-Number(left),dz=Number(down)-Number(up);send({type:'input',x:(dx+dz)*Math.SQRT1_2,z:(dz-dx)*Math.SQRT1_2});},50);
try{$('name').value=localStorage.getItem('neon-name')||'';}catch{}const invite=new URL(location.href).searchParams.get('room');if(invite)$('code').value=invite.slice(0,6);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const clock=new THREE.Clock(),lookTarget=new THREE.Vector3(),camTarget=new THREE.Vector3();let elapsed=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
  if(myId){const me=avatars.get(myId);const target=me?.g.position||new THREE.Vector3();const follow=innerWidth<800?1:.65;camTarget.set(target.x*follow+22,28,target.z*follow+26);lookTarget.set(target.x*follow,0,target.z*follow);camera.position.lerp(camTarget,1-Math.exp(-dt*3));camera.lookAt(lookTarget);}else{camTarget.set(32,34,38);camera.position.lerp(camTarget,dt*2);camera.lookAt(-7,0,0);demos.forEach((a,i)=>{a.g.position.y=Math.sin(elapsed*2+i)*.07;a.g.rotation.y=Math.sin(elapsed*.4+i)*.5+1;a.marker.visible=false;a.legs.forEach((l,j)=>l.rotation.x=Math.sin(elapsed*5+j*3)*.25);});}
  for(const a of avatars.values()){const p=a.target;if(!p)continue;const old=a.g.position.clone();a.g.position.x=THREE.MathUtils.damp(a.g.position.x,p.x,18,dt);a.g.position.z=THREE.MathUtils.damp(a.g.position.z,p.z,18,dt);let angle=p.angle-a.g.rotation.y;angle=Math.atan2(Math.sin(angle),Math.cos(angle));a.g.rotation.y+=angle*Math.min(1,dt*15);const moving=old.distanceTo(a.g.position)>.003;a.legs.forEach((l,j)=>l.rotation.x=moving?Math.sin(elapsed*(8+p.boost*8)+(j%2)*Math.PI)*.6:0);a.g.position.y=moving?Math.abs(Math.sin(elapsed*12))*.07:0;a.marker.position.y=3.1+Math.sin(elapsed*3)*.08;}
  renderer.render(scene,camera);
}connect();frame();
