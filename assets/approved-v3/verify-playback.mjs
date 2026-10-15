import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright-core');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const page=await browser.newPage({viewport:{width:1920,height:1080},ignoreHTTPSErrors:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const dir=fileURLToPath(new URL('./review-frames/v3/',import.meta.url));mkdirSync(dir,{recursive:true});
try{
 await page.goto(new URL('./index.html',import.meta.url).href);
 await page.waitForFunction(()=>Boolean(window.__timelines?.['reference-prototype']));
 const plan=await page.evaluate(()=>JSON.parse(document.querySelector('#sentence-plan').textContent));
 const inspect=async time=>page.evaluate(t=>{
  window.__timelines['reference-prototype'].seek(t);
  const visible=n=>{for(let e=n;e;e=e.parentElement){const s=getComputedStyle(e);if(s.visibility==='hidden'||Number(s.opacity)<.01||s.display==='none')return false;}return true;};
  return {pages:[...document.querySelectorAll('.scene')].filter(visible).map(n=>n.id),cues:[...document.querySelectorAll('.reveal')].filter(visible).map(n=>Number(n.dataset.cue)),captions:[...document.querySelectorAll('.caption-line')].filter(visible).map(n=>Number(n.dataset.cue)),motion:[...document.querySelectorAll('.reveal')].filter(visible).flatMap(n=>[...n.querySelectorAll('*')].map(el=>[el.id, getComputedStyle(el).transform,getComputedStyle(el).opacity]))};
 },time);
 const baseline=new Map();const records=[];
 for(const cue of plan.cues){
  const time=(cue.start+cue.end)/2;
  const state=await inspect(time);baseline.set(cue.id,state);
  assert.deepEqual(state.pages,[`page-${cue.page}`],`page at cue ${cue.id}`);
  assert.deepEqual(state.captions,[cue.id],`caption ${cue.id}`);
  assert.ok(state.cues.includes(cue.id),`action missing ${cue.id}`);
  assert.ok(state.cues.every(id=>plan.cues.find(c=>c.id===id).start<=time),`future cue at ${cue.id}`);
  if(cue.start>0)assert.ok(!(await inspect(cue.start-.02)).cues.includes(cue.id),`early reveal ${cue.id}`);
  const a=await inspect(cue.start+.04),b=await inspect(cue.start+.2);
  assert.notDeepEqual(a.motion,b.motion,`no animation at cue ${cue.id}`);
  await inspect(time);
  await page.evaluate(async t=>{const v=document.querySelector('video');v.currentTime=t;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));},time);
  await page.screenshot({path:`${dir}/cue-${String(cue.id).padStart(2,'0')}.jpg`,type:'jpeg',quality:80});
  records.push({id:cue.id,time,page:cue.page,caption:cue.text});
 }
 for(const cue of [...plan.cues].reverse())assert.deepEqual(await inspect((cue.start+cue.end)/2),baseline.get(cue.id),`reverse seek ${cue.id}`);
 for(const id of [17,2,21,5,12,1,22,9]){const cue=plan.cues.find(c=>c.id===id);assert.deepEqual(await inspect((cue.start+cue.end)/2),baseline.get(id),`random seek ${id}`);}
 assert.deepEqual(errors,[]);
 writeFileSync(`${dir}/verification.json`,JSON.stringify({pages:plan.pages,checkedCues:records,futureVisibility:'pass',motion:'pass',reverseAndRandomSeek:'pass',consoleErrors:errors},null,2));
 console.log(`PASS: ${records.length} captions/actions; future content hidden; motion; reverse/random seeking. Screenshots: ${dir}`);
}finally{await browser.close();}
