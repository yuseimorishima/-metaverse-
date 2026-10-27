import * as THREE from './vendor/three.js';
import {BOUNDS,ROOMS,SOLIDS,SPAWNS,NOTICE_BOARD,CORRIDORS,PILOTI,COURTYARD,YARD,WALKWAYS} from './school-map.js?v=7';

// A printed, static map in the world: no screen overlay or live player tracking.
export function createSpawnGuide(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1536;const c=canvas.getContext('2d');
 c.fillStyle='#f4f1e7';c.fillRect(0,0,2048,1536);c.fillStyle='#284c48';c.fillRect(0,0,2048,220);c.fillStyle='#fffdf2';c.font='bold 106px sans-serif';c.fillText('校 内 案 内',90,145);c.font='38px sans-serif';c.textAlign='right';c.fillText('竹早中モデル ／ 1階・下校庭',1958,138);c.textAlign='left';
 const left=80,top=290,w=1190,h=1040,sx=w/(BOUNDS.maxX-BOUNDS.minX),sz=h/(BOUNDS.maxZ-BOUNDS.minZ),px=x=>left+(x-BOUNDS.minX)*sx,pz=z=>top+(z-BOUNDS.minZ)*sz;
 c.fillStyle='#dfe7d5';c.fillRect(left,top,w,h);c.strokeStyle='#a0b0a1';c.lineWidth=4;c.strokeRect(left,top,w,h);
 function rect(r){c.fillRect(px(r.x-r.w/2),pz(r.z-r.d/2),r.w*sx,r.d*sz);}
 c.fillStyle='#ece8df';for(const r of WALKWAYS)rect(r);rect(COURTYARD);
 c.fillStyle='#89b29a';rect(YARD);c.fillStyle='#365b44';c.font='bold 42px sans-serif';c.fillText('下校庭（人工芝）',px(-13),pz(-65));
 c.fillStyle='#f4ecdb';for(const r of CORRIDORS)rect(r);rect(PILOTI);
 for(const [i,r] of ROOMS.entries()){
  c.fillStyle=r.kind==='gym'?'#cad7de':'#b4cec5';c.fillRect(px(r.x-r.w/2),pz(r.z-r.d/2),r.w*sx,r.d*sz);
  const x=px(r.x),z=pz(r.z);c.fillStyle='#2c514b';c.beginPath();c.arc(x,z,31,0,Math.PI*2);c.fill();c.fillStyle='#ffffff';c.font='bold 38px sans-serif';c.textAlign='center';c.fillText(String(i+1),x,z+14);c.textAlign='left';
 }
 c.fillStyle='#486960';for(const b of SOLIDS.filter(b=>b.kind==='wall'||b.kind==='column'))c.fillRect(px(b.x-b.w/2),pz(b.z-b.d/2),Math.max(3,b.w*sx),Math.max(3,b.d*sz));
 const spawn=SPAWNS[0],x=px(spawn.x),z=pz(spawn.z);c.fillStyle='#b64d4f';c.beginPath();c.arc(x,z,19,0,Math.PI*2);c.fill();c.strokeStyle='#b64d4f';c.lineWidth=5;c.beginPath();c.moveTo(x,z);c.lineTo(x-70,z+60);c.lineTo(x-250,z+60);c.stroke();c.font='bold 37px sans-serif';c.fillText('スポーン地点',x-290,z+108);
 c.fillStyle='#53695b';c.font='32px sans-serif';c.fillText('中庭',px(-4),pz(-32));c.fillText('ピロティー',px(-37),pz(-21));c.fillText('校舎アプローチ',px(8),pz(23));
 const legendX=1360;c.fillStyle='#284c48';c.font='bold 50px sans-serif';c.fillText('部屋の案内',legendX,350);
 ROOMS.forEach((r,i)=>{const y=440+i*88;c.fillStyle='#2c514b';c.font='bold 44px sans-serif';c.fillText(String(i+1).padStart(2,'0'),legendX,y);c.fillStyle='#364c43';c.font='44px sans-serif';c.fillText(r.name.replace('（仮）',''),legendX+92,y);});
 c.strokeStyle='#b6c0b3';c.lineWidth=3;c.beginPath();c.moveTo(1360,1060);c.lineTo(1950,1060);c.stroke();c.fillStyle='#284c48';c.font='bold 43px sans-serif';c.fillText('あそびかた',legendX,1130);c.font='31px sans-serif';['WASD ／ 左下ボタンで移動','ドラッグ ／ Q・Eで見回す','Space ／ TAP連打で加速','メニューから鬼ごっこ開始','（2〜5人で遊べます）'].forEach((line,i)=>c.fillText(line,legendX,1190+i*53));
 c.fillStyle='#6e7d6e';c.font='31px sans-serif';c.fillText('公式の校舎案内・写真を参考に制作 ／ 寸法・部屋順は近似',80,1440);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(NOTICE_BOARD.width,NOTICE_BOARD.height),new THREE.MeshStandardMaterial({map:texture,roughness:.85}));face.position.set(NOTICE_BOARD.x,NOTICE_BOARD.y,NOTICE_BOARD.z+NOTICE_BOARD.depth/2+.025);face.name='spawn-guide-map';return face;
}
