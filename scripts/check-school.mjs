import http from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname;if(p==='/favicon.ico'){res.writeHead(204).end();return;}const file=p==='/'?'index.html':p.slice(1);if(file.includes('..'))throw new Error();const body=await readFile(new URL('../docs/'+file,import.meta.url));res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(body);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const url=`http://127.0.0.1:${server.address().port}`;
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());await page.goto(url);await page.screenshot({path:'/tmp/neon-school-landing.png'});
 await page.click('#explore');await page.waitForFunction(()=>!document.querySelector('#game-ui').hidden);assert.equal(await page.locator('#location').textContent(),'中庭');assert.equal(await page.locator('#connection').textContent(),'SOLO');await page.screenshot({path:'/tmp/neon-school-fps.png'});
 await page.keyboard.down('KeyW');try{await page.waitForFunction(()=>document.querySelector('#location').textContent==='校舎の廊下',{},{timeout:30000});}finally{await page.keyboard.up('KeyW');}await page.screenshot({path:'/tmp/neon-school-hall.png'});
 // View rotation also works without pointer lock.
 await page.mouse.move(800,500);await page.mouse.down();await page.mouse.move(1100,500,{steps:8});await page.mouse.up();await page.screenshot({path:'/tmp/neon-school-look.png'});await page.click('#leave');await page.waitForFunction(()=>!document.querySelector('#landing').hidden);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());await mobile.goto(url);await mobile.click('#explore');await mobile.waitForFunction(()=>!document.querySelector('#game-ui').hidden);await mobile.locator('#dash').tap();await mobile.screenshot({path:'/tmp/neon-school-mobile.png'});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log('PASS: offline solo exploration; first-person walk into school corridor; mouse drag look; leave; mobile layout and tap; no browser errors.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
