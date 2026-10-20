// 韓文字母拆解／組合，以及以「單字」為單位的標準發音推算
// ===== Hangul helpers =====
const LJ='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
const VJ='ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('');
const TJ=['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function dec(c){if(!c)return null;const n=c.charCodeAt(0)-0xAC00;if(n<0||n>11171)return null;return{L:LJ[Math.floor(n/588)],V:VJ[Math.floor((n%588)/28)],T:TJ[n%28]};}
function com(o){return String.fromCharCode(0xAC00+(LJ.indexOf(o.L)*21+VJ.indexOf(o.V))*28+TJ.indexOf(o.T));}

// ===== Pronunciation engine (word level) =====
const REP={'':'','ㄱ':'ㄱ','ㄲ':'ㄱ','ㅋ':'ㄱ','ㄳ':'ㄱ','ㄺ':'ㄱ','ㄴ':'ㄴ','ㄵ':'ㄴ','ㄶ':'ㄴ','ㄷ':'ㄷ','ㅅ':'ㄷ','ㅆ':'ㄷ','ㅈ':'ㄷ','ㅊ':'ㄷ','ㅌ':'ㄷ','ㅎ':'ㄷ','ㄹ':'ㄹ','ㄼ':'ㄹ','ㄽ':'ㄹ','ㄾ':'ㄹ','ㅀ':'ㄹ','ㅁ':'ㅁ','ㄻ':'ㅁ','ㅂ':'ㅂ','ㅍ':'ㅂ','ㅄ':'ㅂ','ㄿ':'ㅂ','ㅇ':'ㅇ'};
const SPLIT={'ㄳ':['ㄱ','ㅆ'],'ㄵ':['ㄴ','ㅈ'],'ㄺ':['ㄹ','ㄱ'],'ㄻ':['ㄹ','ㅁ'],'ㄼ':['ㄹ','ㅂ'],'ㄽ':['ㄹ','ㅆ'],'ㄾ':['ㄹ','ㅌ'],'ㄿ':['ㄹ','ㅍ'],'ㅄ':['ㅂ','ㅆ']};
const TENSE={'ㄱ':'ㄲ','ㄷ':'ㄸ','ㅂ':'ㅃ','ㅅ':'ㅆ','ㅈ':'ㅉ'};
const UNTENSE={'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'};
const NASAL={'ㄱ':'ㅇ','ㄷ':'ㄴ','ㅂ':'ㅁ'};
const ASP={'ㄱ':'ㅋ','ㄷ':'ㅌ','ㅈ':'ㅊ'};
const HASP={'ㄱ':['','ㅋ'],'ㄲ':['','ㅋ'],'ㅋ':['','ㅋ'],'ㄷ':['','ㅌ'],'ㅅ':['','ㅌ'],'ㅆ':['','ㅌ'],'ㅈ':['','ㅊ'],'ㅊ':['','ㅊ'],'ㅌ':['','ㅌ'],'ㅂ':['','ㅍ'],'ㅍ':['','ㅍ'],'ㄺ':['ㄹ','ㅋ'],'ㄵ':['ㄴ','ㅊ'],'ㄼ':['ㄹ','ㅍ']};

function pair(a,b){
  const T=a.T; if(!T) return;
  if(b.L==='ㅇ'){
    if(T==='ㅇ') return;
    if(T==='ㅎ'){a.T='';return;}
    if(T==='ㄶ'){a.T='';b.L='ㄴ';return;}
    if(T==='ㅀ'){a.T='';b.L='ㄹ';return;}
    if(SPLIT[T]){a.T=SPLIT[T][0];b.L=SPLIT[T][1];return;}
    if((T==='ㄷ'||T==='ㅌ')&&b.V==='ㅣ'){a.T='';b.L=(T==='ㄷ'?'ㅈ':'ㅊ');return;}
    a.T='';b.L=T;return;
  }
  if(T==='ㅎ'||T==='ㄶ'||T==='ㅀ'){
    const rem={'ㅎ':'','ㄶ':'ㄴ','ㅀ':'ㄹ'}[T];
    if(ASP[b.L]){b.L=ASP[b.L];a.T=rem;return;}
    if(b.L==='ㅅ'){b.L='ㅆ';a.T=rem;return;}
    if(b.L==='ㄴ'){if(T==='ㅀ'){a.T='ㄹ';b.L='ㄹ';}else a.T='ㄴ';return;}
    a.T=rem||'ㄷ';return;
  }
  if(b.L==='ㅎ'&&HASP[T]){a.T=HASP[T][0];b.L=HASP[T][1];return;}
  let rep=REP[T];
  if(T==='ㄺ'&&b.L==='ㄱ') rep='ㄹ';
  const trig=['ㄱ','ㄷ','ㅂ'].includes(rep)||T==='ㄵ'||T==='ㄻ'||(T==='ㄺ'&&b.L==='ㄱ');
  if(TENSE[b.L]&&trig) b.L=TENSE[b.L];
  if(NASAL[rep]&&(b.L==='ㄴ'||b.L==='ㅁ')) rep=NASAL[rep];
  if(b.L==='ㄹ'){
    if(rep==='ㄱ'||rep==='ㅂ'){b.L='ㄴ';rep=NASAL[rep];}
    else if(rep==='ㅁ'||rep==='ㅇ'){b.L='ㄴ';}
    else if(rep==='ㄴ'){rep='ㄹ';}
  }
  if(rep==='ㄹ'&&b.L==='ㄴ') b.L='ㄹ';
  a.T=rep;
}
function pronWord(w){
  w=w.replace(/^맛없/,'맏없');
  const ch=[...w]; const s=ch.map(dec);
  for(let i=0;i<s.length-1;i++){ if(s[i]&&s[i+1]) pair(s[i],s[i+1]); }
  for(let i=0;i<s.length;i++){ if(s[i]&&(i===s.length-1||!s[i+1])) s[i].T=REP[s[i].T]; }
  return ch.map((c,i)=>s[i]?com(s[i]):c).join('');
}
function pronSentence(str){
  const parts=str.split(/(\s+)/); const out=[]; let prev=null;
  for(const p of parts){
    if(p===''||/^\s+$/.test(p)){out.push(p);continue;}
    let w=pronWord(p);
    if(prev&&/[가-힣]$/.test(prev)&&/^(거|게|것|수|걸)/.test(p)){
      const lc=dec(prev.slice(-1));
      if(lc&&lc.T==='ㄹ'){const d=dec(w[0]);d.L=TENSE[d.L]||d.L;w=com(d)+w.slice(1);}
    }
    prev=p; out.push(w);
  }
  return out.join('');
}
// pronunciation with tense consonants undone (used as a quiz distractor)
function detense(orig,pron){
  const o=[...orig],p=[...pron]; if(o.length!==p.length) return pron;
  return p.map((c,i)=>{const d=dec(c),e=dec(o[i]); if(d&&e&&UNTENSE[d.L]&&!UNTENSE[e.L]){d.L=UNTENSE[d.L];return com(d);} return c;}).join('');
}


export {LJ,VJ,TJ,dec,com,REP,TENSE,UNTENSE,NASAL,pronWord,pronSentence,detense};
