import * as THREE from './vendor/three.js';
let seed=29471;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function surface(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
 const bases={plaster:[235,233,224],ceiling:[231,232,225],board:[38,66,55],concrete:[171,173,164],wood:[164,127,88],tile:[198,199,189],grass:[91,110,71],rubber:[169,113,89],facade:[211,207,190],carpet:[133,138,137],turf:[64,103,69]};const base=bases[kind]||bases.plaster;
 const data=c.createImageData(512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;const fine=(random()-.5)*(kind==='grass'?40:kind==='plaster'?5:kind==='ceiling'?9:12);const broad=Math.sin(x*.027)*Math.sin(y*.021)*3;for(let k=0;k<3;k++)data.data[i+k]=base[k]+fine+broad;data.data[i+3]=255;}c.putImageData(data,0,0);
 if(kind==='ceiling'){
  c.fillStyle='#a1a39955';c.fillRect(0,0,512,1);c.fillRect(0,0,1,512);c.fillRect(0,256,512,1);
  for(let i=0;i<3400;i++){c.fillStyle=i%3?'#72766c33':'#fafbf580';c.fillRect(random()*512,random()*512,1,1+random()*3);}
 }else if(kind==='board'){
  for(let i=0;i<160;i++){c.strokeStyle='#dbe3cf06';c.lineWidth=3+random()*18;const x=random()*512,y=random()*512;c.beginPath();c.moveTo(x,y);c.lineTo(x+80+random()*150,y+(random()-.5)*25);c.stroke();}
 }else if(kind==='wood'){
  for(let col=0;col<8;col++){const x=col*64;c.fillStyle=`rgba(${random()>.5?'245,219,178':'48,31,17'},${.03+random()*.08})`;c.fillRect(x,0,64,512);c.fillStyle='#4a38263b';c.fillRect(x,0,1.5,512);
   const split=(col%3)*170;c.fillRect(x,split,64,1);for(let i=0;i<20;i++){c.strokeStyle=`rgba(45,30,18,${.025+random()*.055})`;c.beginPath();const px=x+random()*64;c.moveTo(px,0);c.bezierCurveTo(px+10,150,px-10,350,px,512);c.stroke();}
  }
 }else if(kind==='tile'||kind==='facade'){
  c.fillStyle='#636a6140';for(let x=0;x<512;x+=kind==='facade'?32:128){c.fillRect(x,0,1,512);c.fillRect(0,x,512,1);}for(let i=0;i<7000;i++){c.fillStyle=random()>.5?'#f5f2df60':'#5c625633';c.fillRect(random()*512,random()*512,1+random()*2,1+random()*2);}
 }else if(kind==='concrete'){
  c.strokeStyle='#6b706022';for(let y=0;y<512;y+=128){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}for(let x=0;x<512;x+=256)c.fillRect(x,0,1,512);
 }else if(kind==='carpet'){
  for(let x=0;x<512;x+=4){c.fillStyle=x%8?'#26393d24':'#d5dfdf20';c.fillRect(x,0,1,512);}
 }else if(kind==='grass'||kind==='turf'){
  for(let i=0;i<10000;i++){const x=random()*512,y=random()*512;c.strokeStyle=random()>.5?'#b4bb6d50':'#293d2040';c.beginPath();c.moveTo(x,y);c.lineTo(x+(random()-.5)*4,y-2-random()*6);c.stroke();}
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
 return map;
}
export function createSchoolMaterials(){
 const textures={};for(const kind of ['plaster','ceiling','board','concrete','wood','tile','grass','rubber','facade','carpet','turf'])textures[kind]=surface(kind);
 const make=(kind,color='#ffffff',roughness=.85,metalness=0)=>new THREE.MeshStandardMaterial({color,map:textures[kind],bumpMap:textures[kind],bumpScale:kind==='grass'?.025:.014,roughness,metalness});
 return {
  plaster:make('plaster'),ceiling:make('ceiling'),board:make('board'),concrete:make('concrete'),wood:make('wood','#e3cfb7',.65),floor:make('wood','#ecdbbc',.42),tile:make('tile','#f4f0e8',.52),grass:make('grass'),track:make('rubber'),
  facade:make('facade'),carpet:make('carpet'),carpetBlue:make('carpet','#61a7b1'),carpetYellow:make('carpet','#e0c35b'),turf:make('turf'),
  blind:new THREE.MeshStandardMaterial({color:'#e4e1d2',roughness:.92}),pinboard:new THREE.MeshStandardMaterial({color:'#8a9b89',roughness:1}),white:new THREE.MeshStandardMaterial({color:'#eeefea',roughness:.55}),laminate:new THREE.MeshStandardMaterial({color:'#deded5',roughness:.6}),piano:new THREE.MeshStandardMaterial({color:'#222828',roughness:.2}),fabric:new THREE.MeshStandardMaterial({color:'#8eaa9a',roughness:1}),curtain:new THREE.MeshStandardMaterial({color:'#264e4b',roughness:1}),upperGlass:new THREE.MeshStandardMaterial({color:'#37535a',metalness:.35,roughness:.24}),courtBlue:new THREE.MeshStandardMaterial({color:'#294f72',roughness:1}),
  paint:new THREE.MeshStandardMaterial({color:'#b8c7c0',roughness:.7}),dark:new THREE.MeshStandardMaterial({color:'#324238',roughness:.9}),metal:new THREE.MeshStandardMaterial({color:'#b4b9b6',roughness:.5,metalness:.5}),blackMetal:new THREE.MeshStandardMaterial({color:'#666f69',roughness:.65,metalness:.35}),
  glass:new THREE.MeshPhysicalMaterial({color:'#bad7d3',roughness:.1,metalness:.1,transparent:true,opacity:.3,depthWrite:false,envMapIntensity:1.1}),
  lamp:new THREE.MeshStandardMaterial({color:'#f6f8ed',emissive:'#f4f7e8',emissiveIntensity:.65,roughness:.3}),chalk:new THREE.MeshStandardMaterial({color:'#f2eee0',roughness:.8}),
  leaf:new THREE.MeshStandardMaterial({color:'#4e6b45',roughness:1}),leafLight:new THREE.MeshStandardMaterial({color:'#779361',roughness:1}),trunk:make('wood','#7f7563',1),
 };
}
export function schoolSky(renderer,scene){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,0,1024);gradient.addColorStop(0,'#62859e');gradient.addColorStop(.42,'#cbdce4');gradient.addColorStop(.52,'#edf0e8');gradient.addColorStop(1,'#8e9681');c.fillStyle=gradient;c.fillRect(0,0,2048,1024);
 for(let i=0;i<26;i++){const x=random()*2048,y=180+random()*220,r=40+random()*90;const glow=c.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,'#ffffff40');glow.addColorStop(1,'#ffffff00');c.fillStyle=glow;c.fillRect(x-r,y-r,r*2,r*2);}
 const sky=new THREE.CanvasTexture(canvas);sky.colorSpace=THREE.SRGBColorSpace;sky.mapping=THREE.EquirectangularReflectionMapping;scene.background=sky;
 const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromEquirectangular(sky);scene.environment=environment.texture;scene.environmentIntensity=.4;pmrem.dispose();return environment;
}
