import http from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname;if(p==='/favicon.ico'){res.writeHead(204).end();return;}const file=p==='/'?'index.html':p.slice(1);if(file.includes('..'))throw new Error();let body=await readFile(new URL('../docs/'+file,import.meta.url));
 // Test-only access to state and scene; the published application has no test global.
 if(file==='app.js')body=body.toString().replace('const client={};','const client={};window.__schoolLocal={hub,client};')+"\nwindow.__schoolTest={get player(){return state?.players.find(p=>p.id===myId)},scene,camera,place(x,z,angle=0,y=0){const {hub,client}=window.__schoolLocal;clearInputs();Object.assign(hub.rooms.get(client.room).players.get(client.pid),{x,y,z,input:{x:0,z:0}});yaw=angle;pitch=0;hub.tick();avatars.get(myId).height=y;avatars.get(myId).g.position.set(x,y,z);camera.position.set(x,y+1.65,z);camera.rotation.set(0,angle,0,'YXZ');}};";
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(body);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const url=`http://127.0.0.1:${server.address().port}`;
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());await page.goto(url);await page.screenshot({path:'/tmp/neon-school-landing.png'});
 await page.click('#explore');await page.waitForFunction(()=>!document.querySelector('#game-ui').hidden);await page.screenshot({path:'/tmp/neon-school-fps.png'});
 assert.equal(await page.locator('#main-header').isVisible(),false);assert.equal(await page.locator('.location-box,.map-panel,.game-message').count(),0);assert.equal(await page.locator('#game-menu').isVisible(),false);
 async function checkBoard(p){assert.ok(await p.evaluate(()=>{const {scene,camera}=window.__schoolTest,board=scene.getObjectByName('spawn-guide-map');if(!board?.material.map)return false;const point=board.position.clone().project(camera);return Math.abs(point.x)<1&&Math.abs(point.y)<1&&point.z<1&&board.material.map.image.width>=1024;}),'the actual 3D map must be visible in the spawn camera');}
 await checkBoard(page);
 const doorChecks=await page.evaluate(async()=>{
  const THREE=await import('./vendor/three.js'),{DOORS}=await import('./school-map.js?v=8'),{UPPER_DOORS}=await import('./school-floors.js?v=8'),{scene}=window.__schoolTest;scene.updateMatrixWorld(true);const meshes=[];scene.traverse(o=>{if(o.isMesh&&o.name.startsWith('school-'))meshes.push(o);});
  function hits(x,z,axis,base=0){const direction=new THREE.Vector3(axis==='z'?1:0,0,axis==='x'?1:0),start=new THREE.Vector3(x,base+1.65,z).addScaledVector(direction,-.9);return new THREE.Raycaster(start,direction,0,1.8).intersectObjects(meshes,false);}
  return {blocked:[...DOORS,...UPPER_DOORS].flatMap(d=>hits(d.x,d.z,d.axis,d.base||0).map(h=>({door:d.label,mesh:h.object.name,point:h.point.toArray()}))),wallBlocks:hits(-24,-5,'x').length>0};
 });assert.deepEqual(doorChecks,{blocked:[],wallBlocks:true},'3D doorway openings must match collision, while window walls stay closed');
 await page.click('#menu-toggle');await page.click('#quality');assert.equal(await page.locator('#quality').getAttribute('aria-pressed'),'true');await page.click('#menu-close');
 async function walk(key,axis,target,less){await page.keyboard.down(key);try{await page.waitForFunction(({key,axis,target,less})=>{const p=window.__schoolTest.player,reached=p&&(less?p[axis]<target:p[axis]>target);if(reached)window.dispatchEvent(new KeyboardEvent('keyup',{code:key}));return reached;},{key,axis,target,less},{timeout:60000,polling:20});}catch(e){console.error('WALK',key,axis,target,await page.evaluate(()=>window.__schoolTest.player));throw e;}finally{await page.keyboard.up(key);}}
 await walk('KeyW','z',6.95,true);await page.keyboard.down('KeyW');await page.waitForTimeout(350);await page.keyboard.up('KeyW');assert.ok(await page.evaluate(()=>window.__schoolTest.player.z>=6.55),'the noticeboard blocks passage');
 await walk('KeyD','x',3.1,false);await walk('KeyW','z',2.8,true);await walk('KeyA','x',.8,true);await walk('KeyW','z',-5.7,true);
 assert.equal(await page.evaluate(async()=>{const {locationAt}=await import('./school-map.js?v=8'),p=window.__schoolTest.player;return locationAt(p.x,p.z);}),'校舎の廊下');await page.screenshot({path:'/tmp/neon-school-hall.png'});
 // Start at the east end, then actually walk the entire hall, turn west and enter
 // the gym. Test-only placement avoids a long trip outside between checkpoints.
 await page.evaluate(()=>window.__schoolTest.place(25,-6.7));await walk('KeyA','x',-40,true);await walk('KeyW','z',-31.45,true);await walk('KeyA','x',-45,true);await page.screenshot({path:'/tmp/neon-school-gym.png'});
 assert.equal(await page.evaluate(async()=>{const {locationAt}=await import('./school-map.js?v=8'),p=window.__schoolTest.player;return locationAt(p.x,p.z);}),'体育館');
 await page.evaluate(()=>window.__schoolTest.place(-40.3,-44));await walk('KeyW','z',-49,true);
 await page.evaluate(()=>window.__schoolTest.place(19,-68.5,Math.PI));await page.waitForTimeout(350);await page.screenshot({path:'/tmp/neon-school-yard.png'});
 await page.evaluate(()=>window.__schoolTest.place(-12,-9.3));await page.waitForTimeout(350);await page.screenshot({path:'/tmp/neon-school-sugoi.png'});
 // Walk up the actual rendered stairs to every floor, with no floor teleport.
 await page.evaluate(()=>window.__schoolTest.place(26,-3.3));
 for(const [floor,y] of [[2,4],[3,7.8],[4,11.6],[5,15.4]]){
  await walk('KeyA','x',24.05,true);await walk('KeyS','z',6.4,false);await walk('KeyD','x',27.95,false);await walk('KeyW','z',-3.3,true);
  await page.waitForFunction(({floor,y})=>{const {player,camera}=window.__schoolTest;return player.floor===floor&&Math.abs(player.y-y)<.01&&Math.abs(camera.position.y-y-1.65)<.05;},{floor,y},{timeout:60000,polling:20});
  assert.equal(await page.evaluate(floor=>!!window.__schoolTest.scene.getObjectByName('floor-guide-'+floor),floor),true);
  console.log('Reached '+floor+'F by stairs');
 }
 await walk('KeyW','z',-6.2,true);
 await page.evaluate(()=>window.__schoolTest.place(20,-13,0,15.4));await page.screenshot({path:'/tmp/neon-school-rooftop.png'});
 await page.evaluate(()=>window.__schoolTest.place(-1,-9.3,0,15.4));await page.screenshot({path:'/tmp/neon-school-5f-meeting.png'});
 await page.evaluate(()=>window.__schoolTest.place(28,-3.3,0,15.4));await walk('KeyS','z',6.4,false);await walk('KeyA','x',24.05,true);await walk('KeyW','z',-3.3,true);
 assert.ok(await page.evaluate(()=>Math.abs(window.__schoolTest.player.y-11.6)<.01),'walk downstairs from 5F to 4F');
 await page.evaluate(()=>window.__schoolTest.place(-32.3,-32.5,-Math.PI/2,7.8));await page.screenshot({path:'/tmp/neon-school-media-center.png'});
 await page.evaluate(async()=>{const {UPPER_ROOMS}=await import('./school-floors.js?v=8'),r=UPPER_ROOMS.find(r=>r.kind==='infirmary');window.__schoolTest.place(r.x,-9.6,0,4);});await page.screenshot({path:'/tmp/neon-school-infirmary.png'});
 await page.mouse.move(800,500);await page.mouse.down();await page.mouse.move(1100,500,{steps:8});await page.mouse.up();await page.screenshot({path:'/tmp/neon-school-look.png'});await page.click('#menu-toggle');await page.click('#leave');await page.waitForFunction(()=>!document.querySelector('#landing').hidden);await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());await mobile.goto(url);await mobile.click('#explore');await mobile.waitForFunction(()=>!document.querySelector('#game-ui').hidden);await mobile.locator('#dash').tap();await mobile.screenshot({path:'/tmp/neon-school-mobile.png'});await checkBoard(mobile);assert.equal(await mobile.locator('#main-header').isVisible(),false);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log('PASS: 3D doors match collision; no fixed guidance; spawn map on desktop/mobile; whole corridor, gym and yard; climb 1F to 5F, descend, eye height, floor signs and rooftop; menu/quality/leave; mobile tap; no browser errors.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
