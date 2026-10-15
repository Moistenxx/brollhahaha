import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const found=html.match(/<script id="sentence-plan" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(found,'缺少页内逐句动作计划；旧版不是5–8秒一页');
const plan=JSON.parse(found[1]);
assert.equal(plan.pages[0].start,0);
assert.equal(plan.pages.at(-1).end,30);
plan.pages.forEach((p,i)=>{
 assert.ok(p.end-p.start>=5 && p.end-p.start<=8,`页 ${i+1} 时长不在5–8秒内`);
 if(i)assert.equal(p.start,plan.pages[i-1].end);
});
const srt=readFileSync(new URL('./面试Skill口播_校对版.srt',import.meta.url),'utf8');
const seconds=t=>t.split(/[:,]/).reduce((v,n,i)=>v+Number(n)*[3600,60,1,.001][i],0);
const cues=[...srt.matchAll(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([^\n]+)/g)].map(m=>({id:+m[1],start:seconds(m[2]),end:seconds(m[3]),text:m[4]})).filter(c=>c.start<30);
assert.equal(plan.cues.length,cues.length);
cues.forEach(c=>{
 const entry=plan.cues.find(x=>x.id===c.id);
 assert.ok(entry,`漏句 ${c.id}`); assert.equal(entry.start,c.start); assert.equal(entry.text,c.text);
 assert.ok(entry.action.length>0,`第${c.id}句没有动作`);
 const page=plan.pages.find(p=>c.start>=p.start && c.start<p.end);
 assert.equal(entry.page,page.id);
});
console.log(`${plan.pages.length}页均为5–8秒，${cues.length}/${cues.length}句与SRT严格对齐`);
