import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html=fs.readFileSync(path.join(root,'roadmap/index.html'),'utf8');
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const tiles=[...html.matchAll(/<a class="tile"[^>]*href="#([^"]+)"/g)].map(m=>m[1]);
assert.equal(tiles.length,6);
assert.equal(new Set(tiles).size,6);
for(const id of tiles){
 assert(ids.has(id),'Missing section '+id);
 const section=html.match(new RegExp('<section[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)</section>'))?.[1];
 assert(section&&section.includes('Practice tip:')&&section.includes('href="#top"'),'Incomplete section '+id);
 assert((section.match(/href="\//g)||[]).length>=3,'Too few resources '+id);
}
for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
 if(href.startsWith('#'))assert(ids.has(href.slice(1)),'Missing anchor '+href);
 if(!href.startsWith('/'))continue;
 const p=path.join(root,href.split(/[?#]/)[0]);
 assert([p,p+'.html',path.join(p,'index.html')].some(x=>fs.existsSync(x)&&fs.statSync(x).isFile()),'Missing resource '+href);
}
console.log('FireOpsSim learning hub structure and local resource paths verified; operational accuracy requires separate review.');
