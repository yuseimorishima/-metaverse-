import { cp, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url);
let serverUrl=(process.env.BACKEND_URL||'').trim();
if(serverUrl){const u=new URL(serverUrl);if(!['https:','wss:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw new Error('BACKEND_URL must be a public HTTPS/WSS URL without credentials, query or hash');serverUrl=u.href;}
const output=new URL('docs/',root);await mkdir(new URL('vendor/',output),{recursive:true});
await cp(new URL('public/',root),output,{recursive:true});
await cp(new URL('node_modules/three/build/three.module.js',root),new URL('vendor/three.js',output));
await cp(new URL('node_modules/three/build/three.core.js',root),new URL('vendor/three.core.js',output));
await cp(new URL('node_modules/three/LICENSE',root),new URL('vendor/LICENSE-three.txt',output));
await writeFile(new URL('config.js',output),'window.NEON_TAG_CONFIG = '+JSON.stringify({serverUrl,requireBackend:true})+';\n');
await writeFile(new URL('.nojekyll',output),'');
console.log('GitHub Pages files built in '+fileURLToPath(output));
