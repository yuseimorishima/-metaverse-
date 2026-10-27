import http from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname;if(p==='/favicon.ico'){res.writeHead(204).end();return;}const file=p==='/'?'index.html':p.slice(1);if(file.includes('..'))throw new Error();let body=await readFile(new URL('../docs/'+file,import.meta.url));
 // Test-only access to state and scene; the published application has no test global.
 if(file==='app.js')body=body.toString()+"\nwindow.__schoolTest={get player(){return state?.players.find(p=>p.id===myId)},scene,camera};";
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
 await page.click('#menu-toggle');await page.click('#quality');assert.equal(await page.locator('#quality').getAttribute('aria-pressed'),'true');await page.click('#menu-close');
 async function walk(key,axis,target,less){await page.keyboard.down(key);try{await page.waitForFunction(({axis,target,less})=>{const p=window.__schoolTest.player;return p&&(less?p[axis]<target:p[axis]>target);},{axis,target,less},{timeout:60000});}finally{await page.keyboard.up(key);}}
 await walk('KeyW','z',6.95,true);await page.keyboard.down('KeyW');await page.waitForTimeout(350);await page.keyboard.up('KeyW');assert.ok(await page.evaluate(()=>window.__schoolTest.player.z>=6.55),'the noticeboard blocks passage');
 await walk('KeyD','x',3.1,false);await walk('KeyW','z',2.8,true);await walk('KeyA','x',.3,true);await walk('KeyW','z',-5.3,true);
 assert.equal(await page.evaluate(async()=>{const {locationAt}=await import('./school-map.js?v=6'),p=window.__schoolTest.player;return locationAt(p.x,p.z);}),'校舎の廊下');await page.screenshot({path:'/tmp/neon-school-hall.png'});
 await page.mouse.move(800,500);await page.mouse.down();await page.mouse.move(1100,500,{steps:8});await page.mouse.up();await page.screenshot({path:'/tmp/neon-school-look.png'});await page.click('#menu-toggle');await page.click('#leave');await page.waitForFunction(()=>!document.querySelector('#landing').hidden);await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());await mobile.goto(url);await mobile.click('#explore');await mobile.waitForFunction(()=>!document.querySelector('#game-ui').hidden);await mobile.locator('#dash').tap();await mobile.screenshot({path:'/tmp/neon-school-mobile.png'});await checkBoard(mobile);assert.equal(await mobile.locator('#main-header').isVisible(),false);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log('PASS: no fixed guidance; visible 3D spawn map on desktop/mobile; board collision and walk around it into school; menu/quality/leave; mobile tap; no browser errors.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
