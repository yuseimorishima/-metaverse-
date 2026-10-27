import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fork } from 'node:child_process';
import { PeerServer } from 'peer';
import { chromium } from 'playwright';
if(process.argv.includes('--signal')){
  PeerServer({host:'127.0.0.1',port:0,path:'/'},server=>process.send(server.address().port));
}else{
  const child=fork(new URL(import.meta.url),['--signal'],{stdio:['ignore','ignore','inherit','ipc']});
  let server,browser;
  try{
    const port=await new Promise((r,j)=>{child.once('message',r);child.once('error',j);child.once('exit',()=>j(new Error('Signaling process exited')));});
    server=http.createServer(async(req,res)=>{try{
      const path=new URL(req.url,'http://local').pathname;
      if(path==='/favicon.ico'){res.writeHead(204).end();return;}
      if(!path.startsWith('/game/')){res.writeHead(404).end();return;}
      const relative=path.slice(6)||'index.html';
      if(relative.includes('..')){res.writeHead(404).end();return;}
      const ice=process.env.TEST_TURN_URL?[{urls:process.env.TEST_TURN_URL,username:process.env.TEST_TURN_USER,credential:process.env.TEST_TURN_PASSWORD}]:[];
      const body=relative==='config.js'?'window.NEON_TAG_CONFIG='+JSON.stringify({transport:'peer',peerOptions:{host:'127.0.0.1',port,path:'/',secure:false,debug:1,config:{iceServers:ice,...(ice.length?{iceTransportPolicy:'relay'}:{})}}})+';':await readFile(new URL('../docs/'+relative,import.meta.url));
      res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':'text/html');res.end(body);
    }catch{res.writeHead(404).end();}});
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const url=`http://127.0.0.1:${server.address().port}/game/`;
    const host=await browser.newPage({viewport:{width:1000,height:900}}),guest=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];
    for(const page of [host,guest]){page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER',e.message);});page.on('console',m=>{if(m.type()==='error')console.error(m.text());});await page.goto(url);await page.waitForFunction(()=>document.querySelector('#connection').textContent==='ONLINE');await page.click('#quality');}
    await host.fill('#name','ホスト');await host.click('#create');await host.waitForFunction(()=>!document.querySelector('#game-ui').hidden);
    await host.click('#menu-toggle');const code=(await host.locator('#copy').textContent()).split(' ')[0];assert.match(code,/^[A-F0-9]{6}$/);
    await guest.fill('#name','ゲスト');await guest.fill('#code',code);await guest.click('#join');try{await host.waitForFunction(()=>document.querySelector('#count').textContent==='2 / 5');}catch(e){console.error('RTC',await guest.evaluate(()=>{const t=window.debugPeerTransport,c=t?.joining||t?.guest,p=c?.peerConnection;return {peer:t?.peer.id,conn:c?.open,ice:p?.iceConnectionState,signal:p?.signalingState};}));console.error('HOST',await host.locator('#toast').textContent(),'GUEST',await guest.locator('#error').textContent(),await guest.locator('#toast').textContent());throw e;}
    const extraResults=await host.evaluate(async({code})=>{const {PeerTransport}=await import('./peer-transport.js?v=6');window.testPeers=[];const results=[];
      for(let i=0;i<4;i++){const transport=new PeerTransport(window.NEON_TAG_CONFIG.peerOptions);window.testPeers.push(transport);await new Promise((r,j)=>{transport.addEventListener('open',r,{once:true});transport.addEventListener('error',()=>j(new Error('peer open failed')),{once:true});});
        const joined=new Promise((r,j)=>{const timeout=setTimeout(()=>j(new Error('join timed out')),10000);transport.addEventListener('message',({data})=>{const m=JSON.parse(data);if(['welcome','error'].includes(m.type)){clearTimeout(timeout);r(m);}});});transport.send(JSON.stringify({type:'join',code,name:'追加'+i}));results.push(await joined);}
      return results;
    },{code});
    assert.deepEqual(extraResults.map(m=>m.type),['welcome','welcome','welcome','error']);assert.match(extraResults[3].message,/満員/);
    await host.waitForFunction(()=>document.querySelector('#count').textContent==='5 / 5');await host.click('#start');await guest.waitForFunction(()=>document.querySelector('#game-ui').dataset.phase==='playing');
    // Actual mobile touchscreen interaction is covered by check-school.mjs. Here DOM
    // pointer events avoid software-GPU input acknowledgements while retaining the
    // real button handler, WebRTC transport, host simulation and guest speed UI.
    assert.ok(await guest.locator('#dash').isVisible());
    await Promise.all([guest.waitForFunction(()=>parseFloat(document.querySelector('#speed').textContent)>3.2,{},{timeout:60000}),guest.evaluate(()=>new Promise(resolve=>{let taps=0;const timer=setInterval(()=>{document.querySelector('#dash').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch'}));if(++taps===8){clearInterval(timer);resolve();}},90);}))]);
    // Full game state and scores are synchronized over actual RTCDataChannels.
    await guest.waitForFunction(()=>document.querySelector('#timer').textContent<'02:00');
    await host.close();await guest.waitForFunction(()=>!document.querySelector('#landing').hidden);
    assert.deepEqual(errors,[]);console.log('PASS: static subpath; 5 RTC players; sixth rejected; round start; mobile tap boost; host disconnect; no browser errors.');
  }finally{await browser?.close();server?.closeAllConnections();if(server)await new Promise(r=>server.close(r));child.kill();}
}
