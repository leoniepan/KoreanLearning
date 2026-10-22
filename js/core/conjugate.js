// 動詞／形容詞變化：現在、過去、未來、冠形詞形、-(으)러
import {dec,com} from './hangul.js';
// ===== Conjugation engine =====
const BRIGHT=['ㅏ','ㅗ','ㅑ'];
function aeo(stem,irr){
  const a=[...stem]; const n=a.length; const last=a[n-1]; const d=dec(last);
  if(last==='하') return a.slice(0,-1).join('')+'해';
  if(irr==='ㅂ'){d.T='';a[n-1]=com(d);return a.join('')+(/^(돕|곱)$/.test(stem)?'와':'워');}
  if(irr==='르'){const p=dec(a[n-2]);p.T='ㄹ';a[n-2]=com(p);a[n-1]=BRIGHT.includes(p.V)?'라':'러';return a.join('');}
  if(irr==='ㄷ'){d.T='ㄹ';a[n-1]=com(d);}
  if(d.T) return a.join('')+(BRIGHT.includes(d.V)?'아':'어');
  const m={'ㅗ':'ㅘ','ㅜ':'ㅝ','ㅣ':'ㅕ','ㅚ':'ㅙ'};
  if(m[d.V]){d.V=m[d.V];a[n-1]=com(d);return a.join('');}
  if(d.V==='ㅡ'){const br=n>1&&BRIGHT.includes(dec(a[n-2]).V);d.V=br?'ㅏ':'ㅓ';a[n-1]=com(d);return a.join('');}
  if(d.V==='ㅟ'||d.V==='ㅢ') return a.join('')+'어';
  return a.join('');
}
function addT(s,t){const a=[...s];const d=dec(a[a.length-1]);d.T=t;a[a.length-1]=com(d);return a.join('');}
function futF(stem,irr){
  const d=dec([...stem].pop());
  if(irr==='ㅂ') return addT(stem,'')+'울 거예요';
  if(irr==='ㄷ') return addT(stem,'ㄹ')+'을 거예요';
  if(d.T==='ㄹ') return stem+' 거예요';
  if(d.T) return stem+'을 거예요';
  return addT(stem,'ㄹ')+' 거예요';
}
function attrF(stem,t,irr){
  const d=dec([...stem].pop());
  if(t!=='a'||/(있|없)$/.test(stem)){ if(d.T==='ㄹ') return addT(stem,'')+'는'; return stem+'는'; }
  if(irr==='ㅂ') return addT(stem,'')+'운';
  if(d.T==='ㄹ') return addT(stem,'ㄴ');
  if(d.T) return stem+'은';
  return addT(stem,'ㄴ');
}
function purpF(stem,irr){
  const d=dec([...stem].pop());
  if(irr==='ㄷ') return addT(stem,'ㄹ')+'으러 가요';
  if(irr==='ㅂ') return addT(stem,'')+'우러 가요';
  if(!d.T||d.T==='ㄹ') return stem+'러 가요';
  return stem+'으러 가요';
}
function forms(w){
  const stem=w.k.slice(0,-1); const x=aeo(stem,w.irr);
  const f={pres:x+'요',past:addT(x,'ㅆ')+'어요',fut:futF(stem,w.irr),attr:attrF(stem,w.t,w.irr)};
  if(w.t==='v') f.purp=purpF(stem,w.irr);
  return f;
}


export {BRIGHT,aeo,addT,futF,attrF,purpF,forms};
