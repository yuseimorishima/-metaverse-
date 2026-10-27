// Floor assignments follow the official school guide. Room order, dimensions,
// stair positions and furniture layouts are game approximations.
export const FLOORS=[
 {id:1,y:0,color:'#527d70'},
 {id:2,y:4,color:'#9b7354'},
 {id:3,y:7.8,color:'#4d7d94'},
 {id:4,y:11.6,color:'#84749c'},
 {id:5,y:15.4,color:'#64875d'}
];
export const STAIR={minX:22,maxX:30,frontZ:-5,startZ:-2,endZ:5.5,backZ:8,leftX:24,rightX:28,width:2.4};
export const UPPER_ROOMS=[],UPPER_SOLIDS=[],UPPER_DECOR=[],UPPER_DOORS=[];
export const UPPER_CORRIDORS=FLOORS.slice(1).flatMap(f=>[
 {floor:f.id,base:f.y,x:-6,z:-6.7,w:72,d:3.4},
 {floor:f.id,base:f.y,x:-40.3,z:-27.7,w:3.4,d:38.6}
]);
export const FLOOR_FOOTPRINTS=[{x:-6,z:-11.5,w:72,d:13},{x:-34,z:-32.5,w:16,d:29},{x:26,z:-3.5,w:8,d:3}];
const rowDefinitions={
 2:[['事務室','office'],['リソースルーム','resource'],['保健体育室','pe'],['被服室','sewing'],['保健室','infirmary'],['調理室','cooking'],['1学年教室','classroom'],['職員室','staff']],
 3:[['物理化学室','physics'],['科学実験室','laboratory'],['生物地学室','biology'],['Dルーム','d-room'],['2学年教室','classroom']],
 4:[['英語室','english'],['美術室','art'],['グループ学習室','group'],['社会科室','social'],['視聴覚室','audiovisual'],['3学年教室','classroom']]
};
function solid(f,x,z,w,d,h=.8,kind='desk',y=h/2){const b={floor:f.id,base:f.y,x,z,w,d,h,y,kind};UPPER_SOLIDS.push(b);return b;}
function wallLine(f,axis,fixed,start,end,openings=[],windows=false,h=3.6){
 let edge=start;function segment(a,b){if(b-a<.001)return;const o=solid(f,axis==='x'?(a+b)/2:fixed,axis==='x'?fixed:(a+b)/2,axis==='x'?b-a:.28,axis==='x'?.28:b-a,h,'wall',h/2);o.windows=windows;}
 for(const o of [...openings].sort((a,b)=>a.at-b.at)){
  const a=o.at-o.width/2,b=o.at+o.width/2;if(a<edge-.001||b>end+.001)throw new Error('Invalid upper-floor door');segment(edge,a);
  const door={floor:f.id,base:f.y,axis,x:axis==='x'?o.at:fixed,z:axis==='x'?fixed:o.at,width:o.width,label:o.label};UPPER_DOORS.push(door);
  UPPER_DECOR.push({...door,w:axis==='x'?o.width:.28,d:axis==='x'?.28:o.width,h:.4,y:3.4,kind:'lintel'});edge=b;
 }segment(edge,end);
}
function furniture(f,r){
 const desks=(cols,rows,kind='desk')=>{for(const dx of cols)for(const dz of rows){solid(f,r.x+dx,r.z+dz,.85,.6,.73,kind);solid(f,r.x+dx,r.z+dz+.8,.46,.44,.5,'chair');}};
 if(['classroom','english','social','audiovisual'].includes(r.kind))desks([-2.4,0,2.4],[-2,0,2]);
 else if(['physics','laboratory','biology'].includes(r.kind)){
  for(const dx of [-3.6,0,3.6])for(const dz of [-2,1])solid(f,r.x+dx,r.z+dz,2.1,1.2,.85,'lab-table');
  solid(f,r.x,r.z-r.d/2+.7,r.w-2,.65,.9,'lab-counter');
 }else if(r.kind==='cooking'){
  for(const dx of [-2.2,2.2])for(const dz of [-2,1.2])solid(f,r.x+dx,r.z+dz,2,1.4,.85,'kitchen-island');
 }else if(['group','d-room','art','resource','meeting','trainee'].includes(r.kind)){
  for(const dx of [-r.w*.24,r.w*.24])for(const dz of [-2,1])solid(f,r.x+dx,r.z+dz,2.3,1.2,.76,r.kind==='art'?'art-table':'desk');
  solid(f,r.x-r.w/2+.6,r.z-.5,.7,3,1.8,'cabinet');
 }else if(r.kind==='sewing'){
  for(const dx of [-2,2])for(const dz of [-2,1])solid(f,r.x+dx,r.z+dz,1.8,1.1,.76,'sewing-table');
 }else if(r.kind==='infirmary'){
  for(const dx of [-2,2])solid(f,r.x+dx,r.z-1.7,1.4,2.8,.65,'bed');solid(f,r.x,r.z+1.4,2,1,.76,'desk');
 }else if(['office','staff'].includes(r.kind)){
  for(const dx of [-2,2])for(const dz of [-2,1])solid(f,r.x+dx,r.z+dz,1.7,.85,.76,'office-desk');
  solid(f,r.x,r.z-r.d/2+.45,r.w-1,.6,1.9,'cabinet');
 }else if(r.kind==='media'){
  for(const x of [r.x-3.6,r.x,r.x+3.6])for(const z of [r.z-9,r.z+9])solid(f,x,z,.8,6,2,'bookshelf');
  for(const x of [r.x-2.8,r.x+2.8])for(const z of [r.z-3,r.z+3])solid(f,x,z,2.4,1.3,.76,'desk');
 }else if(r.kind==='lounge'){
  for(const z of [r.z-8,r.z,r.z+8]){solid(f,r.x-3,z,2.4,.9,.8,'sofa');solid(f,r.x+1,z,2,1,.55,'desk');}
 }
}
for(const f of FLOORS.slice(1)){
 const definitions=rowDefinitions[f.id];const row=[];
 if(definitions){
  const width=68.6/definitions.length;
  definitions.forEach(([name,kind],i)=>{const x=-38.6+width*(i+.5);row.push({floor:f.id,base:f.y,name,kind,x,z:-13.2,w:width,d:9.6,doorX:x,doorZ:-8.4});});
 }else for(const [name,kind,x] of [['実習生室','trainee',-17],['会議室','meeting',-1]])row.push({floor:5,base:f.y,name,kind,x,z:-13.2,w:16,d:9.6,doorX:x,doorZ:-8.4});
 UPPER_ROOMS.push(...row);
 const rowStart=f.id===5?-25:-38.6,rowEnd=f.id===5?7:30;
 wallLine(f,'x',-8.4,rowStart,rowEnd,row.map(r=>({at:r.doorX,width:2.2,label:r.name})));
 wallLine(f,'x',-18,rowStart,rowEnd,[],true);
 for(const r of row.slice(0,-1))wallLine(f,'z',r.x+r.w/2,-18,-8.4);
 if(f.id===5){wallLine(f,'z',-25,-18,-8.4,[],true);wallLine(f,'z',7,-18,-8.4,[],true);}
 // Exterior walls close every edge. Fifth-floor outer walls become terrace rails.
 const h=f.id===5?1.2:3.6;
 wallLine(f,'x',-5,-42,30,[{at:26,width:6,label:'階段 '+f.id+'F'}],f.id!==5,h);
 wallLine(f,'z',30,-18,-5,[],f.id!==5,h);
 wallLine(f,'z',-42,-47,-5,[],f.id!==5,h);
 wallLine(f,'x',-47,-42,-26,[],f.id!==5,h);
 wallLine(f,'z',-26,-47,-18,[],f.id!==5,h);
 if(f.id===5){wallLine(f,'x',-18,-26,-25,[],false,h);wallLine(f,'x',-18,7,30,[],false,h);}
 else{
  const west={floor:f.id,base:f.y,name:f.id===3?'メディアセンター':f.id===2?'共用学習スペース':'共用ラウンジ',kind:f.id===3?'media':'lounge',x:-32.3,z:-32.5,w:12.6,d:29,doorX:-38.6,doorZ:-32};
  UPPER_ROOMS.push(west);wallLine(f,'z',-38.6,-47,-18,[{at:-32,width:2.4,label:west.name}]);wallLine(f,'z',-38.6,-18,-8.4);
 }
 // The stair enclosure has no slabs across its flights, only level landings.
 wallLine(f,'z',22,-5,8,[],true);wallLine(f,'z',30,-5,8,[],true);wallLine(f,'x',8,22,30,[],true);
 if(f.id===5)solid(f,24,-2,2.4,.08,1.1,'railing');
 for(const r of UPPER_ROOMS.filter(r=>r.floor===f.id))furniture(f,r);
}
export function floorAtHeight(y=0){return FLOORS.reduce((best,f)=>Math.abs(f.y-y)<Math.abs(best.y-y)?f:best,FLOORS[0]).id;}
export function inStairFootprint(x,z){return x>=STAIR.minX&&x<=STAIR.maxX&&z>=STAIR.frontZ&&z<=STAIR.backZ;}
export function stairSurfaces(x,z){
 const s=STAIR,heights=[];
 if(x<s.minX+.42||x>s.maxX-.42||z<s.frontZ||z>s.backZ-.42)return heights;
 if(z<=s.startZ)for(const f of FLOORS)heights.push(f.y);
 else for(let i=0;i<FLOORS.length-1;i++){
  const lower=FLOORS[i].y,upper=FLOORS[i+1].y,half=(upper-lower)/2;
  if(z>=s.endZ)heights.push(lower+half);
  else{
   const t=(z-s.startZ)/(s.endZ-s.startZ);
   if(Math.abs(x-s.leftX)<=s.width/2-.42)heights.push(lower+half*t);
   if(Math.abs(x-s.rightX)<=s.width/2-.42)heights.push(upper-half*t);
  }
 }
 return heights;
}
export function onUpperFloor(x,z){
 // Test the entire player's footprint against the union, preserving L junctions.
 const inside=(px,pz)=>FLOOR_FOOTPRINTS.some(r=>Math.abs(px-r.x)<=r.w/2&&Math.abs(pz-r.z)<=r.d/2);
 return [[-.42,-.42],[-.42,.42],[.42,-.42],[.42,.42]].every(([dx,dz])=>inside(x+dx,z+dz));
}
