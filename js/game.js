(function(){
"use strict";

var PORTRAIT_DATA = {
  kovac: 'assets/portraits/kovac.jpg',
  russo: 'assets/portraits/russo.jpg',
  ali: 'assets/portraits/ali.jpg',
  zahra: 'assets/portraits/zahra.jpg'
};

// =====================================================================
//  CONSTANTES
// =====================================================================
const W=360, H=620, LANE_L=26, LANE_R=334, PX=42;
const TOWER_R=28, TOWER_MAX=120, TOWER_DMG=5, TOWER_RANGE=4.5*PX, TOWER_INT=1.2;
const DEPLOY_MIN_Y=H*0.6, DEPLOY_MAX_Y=H-84, ENEMY_MIN_Y=76, ENEMY_MAX_Y=H*0.4;
const MAX_ELX=10, ELX_RATE=1/2.8, MATCH_TIME=180, SPAWN_T=0.9;
const C={ player:'#4d6d8c', playerD:'#2f4761', enemy:'#a8402c', enemyD:'#742a1c', amber:'#d99a3d' };
const TCA={ player:'77,109,140', enemy:'168,64,44' };
const TAU=Math.PI*2;

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const rand=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function angLerp(a,b,t){ const d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI; return a+d*t; }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

// =====================================================================
//  DONNÉES : unités
// =====================================================================
const RARITY={ commune:'Commune', rare:'Rare', heroique:'Héroïque' };

const CARDS={
  player:[
    {key:'recrue',  name:"Recrue",          cost:2,speed:2.2,hp:15,dmg:3, range:1.6,interval:1.0,body:'infantry',fx:'bullet', rar:'commune', role:"Infanterie",
      desc:"Jeune engagé de l'armée régulière. Peu chère, rapide au feu : idéale pour occuper l'ennemi."},
    {key:'tireur',  name:"Tireur d'élite",  cost:3,speed:1.6,hp:12,dmg:6, range:4.0,interval:1.2,body:'sniper',  fx:'sniper', rar:'commune', role:"Tir longue portée",
      desc:"Frappe de très loin mais reste fragile. À protéger derrière la ligne."},
    {key:'russo',   name:"Capitaine Russo", cost:4,speed:1.8,hp:22,dmg:5, range:2.2,interval:1.0,body:'hero',    fx:'bullet', rar:'rare',    role:"Officier de terrain", portrait:'russo',
      desc:"Officier expérimentée : solide, mobile et efficace au contact."},
    {key:'blinde',  name:"Blindé léger",    cost:5,speed:1.2,hp:40,dmg:8, range:2.0,interval:1.4,body:'tank',    fx:'shell',  rar:'rare',    role:"Véhicule chenillé", splash:{r:34,f:.5},
      desc:"Tire des obus explosifs qui blessent aussi les unités voisines."},
    {key:'kovac',   name:"Général Kovac",   cost:6,speed:1.3,hp:55,dmg:10,range:2.5,interval:1.1,body:'hero',    fx:'slam',   rar:'heroique',role:"Commandant", portrait:'kovac', splash:{r:44,f:.5},
      desc:"Commandant de l'armée régulière. Ses frappes ébranlent le terrain et touchent une zone."},
    {key:'grimpeur',name:"Grimpeur de falaise",cost:3,speed:2.5,hp:14,dmg:4,range:1.9,interval:.85,body:'infantry',fx:'bullet',rar:'commune',role:"Escalade & tir",
      desc:"Agile comme dans les falaises hors des murs : rapide et précis pour harceler."},
    {key:'sapeur',name:"Sapeur du génie",cost:4,speed:1.5,hp:24,dmg:7,range:2.6,interval:1.3,body:'infantry',fx:'grenade',rar:'rare',role:"Explosifs",splash:{r:36,f:.55},
      desc:"Spécialiste des charges : il fait sauter les groupes d'ennemis."},
    {key:'marcus',name:"Marcus",cost:4,speed:1.9,hp:28,dmg:6,range:2.8,interval:.95,body:'hero',fx:'bullet',rar:'rare',role:"Frère d'armes",
      desc:"L'ami disparu d'Alex, retrouvé blessé mais toujours redoutable au fusil."},
    {key:'obusier',name:"Obusier de campagne",cost:5,speed:1.0,hp:26,dmg:9,range:4.3,interval:1.6,body:'tank',fx:'shell',rar:'rare',role:"Artillerie",splash:{r:40,f:.55},
      desc:"Pilonne les tranchées à très longue portée. Fragile s'il est approché."},
    {key:'alex',name:"Alex",cost:5,speed:1.7,hp:38,dmg:8,range:3.0,interval:.9,body:'hero',fx:'bullet',rar:'heroique',role:"Ancien soldat",
      desc:"Le héros de Karvenia. Couvert, mobile et précis : il tient seul une ligne entière."}
  ],
  enemy:[
    {key:'guetteur',name:"Guetteur",        cost:2,speed:2.6,hp:10,dmg:3, range:1.5,interval:0.9,body:'infantry',fx:'bullet', rar:'commune', role:"Éclaireur",
      desc:"Éclaireur de la milice, rapide et nerveux."},
    {key:'zahra',   name:"Zahra",           cost:3,speed:1.8,hp:16,dmg:5, range:2.0,interval:1.0,body:'hero',    fx:'grenade',rar:'rare',    role:"Lieutenante", portrait:'zahra', splash:{r:40,f:.6},
      desc:"Lieutenante de la milice. Ses grenades blessent tout ce qui se tient près de la cible."},
    {key:'embusque',name:"Tireur embusqué", cost:4,speed:1.4,hp:14,dmg:7, range:4.0,interval:1.3,body:'sniper',  fx:'sniper', rar:'commune', role:"Tir longue portée",
      desc:"Sniper de la milice, mortel à distance."},
    {key:'colonne', name:"Colonne blindée", cost:5,speed:1.1,hp:42,dmg:8, range:2.0,interval:1.4,body:'tank',    fx:'shell',  rar:'rare',    role:"Véhicule lourd", barrels:2, splash:{r:36,f:.5},
      desc:"Véhicule lourd à double canon de la milice."},
    {key:'ali',     name:"Leader Ali",      cost:6,speed:1.3,hp:50,dmg:9, range:2.3,interval:1.1,body:'hero',    fx:'fire',   rar:'heroique',role:"Chef de la milice", portrait:'ali', splash:{r:32,f:.45},
      desc:"Chef de la milice rebelle. Ses cocktails incendiaires embrasent tout sur leur passage."},
    {key:'pillard',name:"Pillard du bunker",cost:2,speed:2.3,hp:12,dmg:3,range:1.5,interval:.9,body:'infantry',fx:'bullet',rar:'commune',role:"Pillard",
      desc:"Rôde dans les ruines soviétiques. Nombreux, nerveux, mal équipés."},
    {key:'lanceflamme',name:"Lance-flammes",cost:4,speed:1.4,hp:26,dmg:7,range:2.0,interval:.8,body:'infantry',fx:'fire',rar:'rare',role:"Terreur des tranchées",splash:{r:34,f:.5},
      desc:"Embrase tout sur son passage. Terrible à courte portée."},
    {key:'mercenaire',name:"Mercenaire",cost:3,speed:1.9,hp:20,dmg:5,range:2.4,interval:.95,body:'infantry',fx:'bullet',rar:'commune',role:"Soldat de fortune",
      desc:"Équipé de matériel de pointe, il se bat pour le plus offrant."},
    {key:'garde',name:"Garde d'élite",cost:5,speed:1.6,hp:40,dmg:8,range:2.8,interval:.9,body:'hero',fx:'bullet',rar:'rare',role:"Élite",
      desc:"Garde personnelle qui protège l'arme. Entraînée, blindée, impitoyable."},
    {key:'charmerc',name:"Char mercenaire",cost:6,speed:1.1,hp:56,dmg:10,range:2.2,interval:1.3,body:'tank',fx:'shell',rar:'heroique',role:"Blindé lourd",barrels:2,splash:{r:40,f:.5},
      desc:"Le blindé des mercenaires : acier, double canon, aucun scrupule."},
    {key:'voss',name:"Commandant Voss",cost:6,speed:1.3,hp:62,dmg:11,range:2.5,interval:1.1,body:'hero',fx:'slam',rar:'heroique',role:"Chef des mercenaires",splash:{r:46,f:.5},
      desc:"Chef des mercenaires, prêt à tout pour posséder l'arme expérimentale."}
  ]
};
const FACTIONS={milice:'Milice rebelle',merc:'Mercenaires',armee:'Armée régulière',pillards:'Pillards',elite:"Garde d'élite"};
const POOLS={
  milice:['guetteur','zahra','embusque','colonne','ali','lanceflamme'],
  merc:['mercenaire','eclaireuse','embusque','charmerc','garde','voss'],
  pillards:['pillard','guetteur','lanceflamme','embusque','zahra','colonne'],
  armee:['recrue','tireur','russo','blinde','kovac','obusier'],
  elite:['garde','voss','charmerc','ali','briseur','mercenaire']
};
const CHAPTERS=[
  {id:'1.1',map:'ruines',goal:"Embuscade au point d'exfiltration",obj:'survive',act:1,title:'Zone Rouge',fac:'milice',text:"L'hélicoptère de l'équipe humanitaire est abattu au-dessus de Karvenia. Alex doit survivre dans les ruines et rejoindre le point d'exfiltration. Couverture, munitions comptées, tension constante."},
  {id:'1.2',map:'ville',goal:"Poste de contrôle des mercenaires",obj:'',act:1,title:'Territoires',fac:'merc',text:"La ville est coupée en trois zones : armée régulière, milice rebelle et mercenaires. Escorte des convois, intercepte des trafics et bâtis ta réputation auprès de chaque faction."},
  {id:'1.3',map:'quartier',goal:"Quartier général de la milice",obj:'',act:1,title:"L'ancien frère d'armes",fac:'milice',text:"Une piste indique que Marcus, l'ami disparu d'Alex, est vivant dans un quartier tenu par la milice. Infiltration urbaine : discrétion ou assaut frontal."},
  {id:'1.4',map:'ville',goal:"Convoi de l'embuscade",obj:'',act:1,title:'Trahison',fac:'merc',text:"Le contact tourne mal : embuscade, fusillade urbaine, poursuite en véhicule. Un indice reste : Marcus a fui vers les zones archéologiques hors de la ville."},
  {id:'2.1',map:'falaise',goal:"Camp des pillards",obj:'',act:2,title:'Hors des murs',fac:'pillards',text:"Falaises, ruines antiques et installations soviétiques abandonnées. Premières escalades, premiers pillards. Le ton change : la nature est un champ de bataille."},
  {id:'2.2',map:'bunker',goal:"Porte scellée du bunker",obj:'',act:2,title:'Le bunker oublié',fac:'pillards',text:"Un complexe souterrain scellé depuis la guerre froide. Mécanismes à activer, passages cachés, et des pillards qui gardent le site."},
  {id:'2.3',map:'bunker',goal:"Salle des archives",obj:'',act:2,title:'Les archives',fac:'armee',text:"Des documents révèlent une arme expérimentale — et le rôle de ton unité, cinq ans plus tôt, dans sa dissimulation. Flashback de la mission ratée."},
  {id:'2.4',map:'effondrement',goal:"Sortie du bunker (survis à l'effondrement)",obj:'survive',act:2,title:'Retrouvailles',fac:'merc',text:"Alex retrouve Marcus, blessé et traqué. Toutes les factions convergent vers le site. Le bunker s'effondre : il faut fuir !"},
  {id:'3.1',map:'tranchees',goal:"Ligne de front",obj:'',act:3,title:'Choix du camp',fac:'opp',text:"Les trois factions se mobilisent pour s'emparer de l'arme. Choisis ton alliance — ou reste indépendant. Ce choix change tes alliés et tes adversaires."},
  {id:'3.2',map:'tranchees',goal:"Tranchées ennemies",obj:'',act:3,title:'Assaut des tranchées',fac:'opp',text:"Grande bataille rangée : tranchées, artillerie, armées entières. Perce jusqu'au site de l'arme."},
  {id:'3.3',map:'base',goal:"Installation de l'arme",obj:'',act:3,title:'Infiltration finale',fac:'elite',text:"Infiltre l'installation où l'arme est gardée : discrétion, escalade et combats rapprochés contre une garde d'élite."},
  {id:'3.4',map:'base',goal:"Chef de la faction rivale",obj:'',act:3,title:'Le choix final',fac:'boss',text:"Confrontation finale avec le chef de la faction rivale. Puis le choix : contrôle, marché noir ou sacrifice."}
];
const THEMES={
  ruines:{n:'Ruines de Karvenia',bg:['#2d1f19','#26241b','#182028'],road:['#2a2a24','#302f28'],side:'city',sc:'#34332a',speck:null},
  ville:{n:'Quartiers divisés',bg:['#2a2018','#2b2a22','#1a2230'],road:['#2b2a27','#33312c'],side:'city',sc:'#3d392f',speck:'rgba(217,154,61,.10)'},
  quartier:{n:'Quartier de la milice (nuit)',bg:['#1d1822','#211d27','#10141c'],road:['#232029','#2b2833'],side:'city',sc:'#2c2933',speck:'rgba(168,64,44,.12)'},
  falaise:{n:'Falaises et ruines antiques',bg:['#27301f','#2a3022','#1c2a2a'],road:['#3a3626','#443f2c'],side:'rock',sc:'#4b4a3a',speck:'rgba(120,150,70,.18)'},
  bunker:{n:'Bunker soviétique',bg:['#15181a','#1a1d1f','#101416'],road:['#25282a','#2e3235'],side:'wall',sc:'#2f3639',speck:'rgba(120,200,170,.08)'},
  effondrement:{n:'Bunker en ruine',bg:['#2a1612','#241a16','#14100e'],road:['#2d2420','#38302a'],side:'wall',sc:'#3a2c26',speck:'rgba(255,120,60,.16)'},
  tranchees:{n:'Champ de tranchées',bg:['#2e2518','#2a2216','#1d1a14'],road:['#3a2e1e','#44361f'],side:'trench',sc:'#54432a',speck:'rgba(90,70,40,.35)'},
  base:{n:"Base de l'arme expérimentale",bg:['#14181e','#1a2028','#0f1318'],road:['#22272e','#2a3038'],side:'wall',sc:'#2b333c',speck:'rgba(110,190,255,.14)'}
};
function curMap(){ return (S&&S.chap)?S.chap.map:(CUR>=0?CHAPTERS[CUR].map:'ruines'); }
const DIFF_INFO={recrue:"Ennemi : troupes légères, sans chef ni blindé lourd. L'IA réagit lentement.",soldat:"Ennemi : armée équilibrée avec ses officiers. L'IA réagit normalement.",veteran:"Ennemi : élite, blindés lourds et chefs. L'IA réagit très vite."};
function diffKeys(keys,boss){
  const by=x=>MULTI_CARDS.find(c=>c.key===x);
  let k=keys.slice();
  if(diffKey==='recrue'){ k=k.filter(x=>x===boss||!by(x)||by(x).cost<6); ['pillard','guetteur','mercenaire','embusque'].forEach(x=>{ if(k.length<5&&k.indexOf(x)<0) k.push(x); }); }
  else if(diffKey==='veteran'){ ['garde','charmerc','lanceflamme'].forEach(x=>{ if(k.indexOf(x)<0) k.push(x); }); }
  return k;
}
const SKIRM={recrue:['guetteur','pillard','mercenaire','embusque','zahra'],soldat:['guetteur','zahra','embusque','colonne','ali','lanceflamme'],veteran:['zahra','embusque','lanceflamme','garde','charmerc','ali','voss']};
const ACTS={1:"Acte 1 — Le retour",2:"Acte 2 — Les ruines et les secrets",3:"Acte 3 — La guerre totale"};
const CAMPS={armee:"Armée régulière",milice:"Milice rebelle",merc:"Mercenaires",indep:"Indépendant"};
const CAMP_ALLY={armee:['obusier'],milice:['zahra','ali'],merc:['mercenaire','voss'],indep:[]};
const ENDINGS={
  controle:{t:'Contrôle',x:"Tu livres l'arme à ta faction alliée. Karvenia est stabilisée sous une main de fer : la paix, mais à quel prix ?"},
  marche:{t:'Marché noir',x:"Tu vends l'arme au plus offrant et tu disparais avec la fortune. Karvenia brûle encore, mais Alex n'est plus là pour le voir."},
  sacrifice:{t:'Sacrifice',x:"Tu détruis l'arme. Karvenia est sauvée, au prix de tout ce qu'Alex avait construit. Certaines victoires coûtent tout."}
};
let CUR=-1, storyProg={unlocked:0,camp:null,ending:null};
try{ const sp=JSON.parse(localStorage.getItem('bf_story')||'null'); if(sp&&typeof sp.unlocked==='number') storyProg=Object.assign(storyProg,sp); }catch(e){}
function saveProg(){ try{ localStorage.setItem('bf_story',JSON.stringify(storyProg)); }catch(e){} }
function chapFaction(ch){
  const c=storyProg.camp;
  if(ch.fac==='opp') return c==='armee'?'milice':(c==='milice'?'armee':'merc');
  if(ch.fac==='boss') return c==='armee'?'milice':(c==='milice'?'armee':'merc');
  return ch.fac;
}
function chapBoss(ch){ if(ch.fac!=='boss') return null; const f=chapFaction(ch); return f==='milice'?'ali':(f==='armee'?'kovac':'voss'); }
function chapterAI(idx){
  const b=DIFF[diffKey], L=idx;
  return { name:b.name, mul:Math.min(1.5,b.mul*(1+L*.035)), min:Math.max(.35,b.min*(1-L*.035)), max:Math.max(.6,b.max*(1-L*.03)),
    smart:Math.min(1,b.smart+L*.03), push:b.push, patience:b.patience };
}
const FX={ bullet:{speed:900}, sniper:{speed:1800}, shell:{speed:560}, grenade:{speed:300,arc:26}, fire:{speed:420}, slam:{speed:640}, tower:{speed:820} };
const DIFF={
  recrue:{ name:'Recrue',  mul:.85, min:1.5, max:2.6, smart:.35, push:6, patience:.5 },
  soldat:{ name:'Soldat',  mul:1.05, min:.9, max:1.6, smart:.75, push:5, patience:.6 },
  veteran:{ name:'Vétéran',mul:1.2, min:.5,  max:.95, smart:1, push:6, patience:.8 }
};

const portraitImgs={};
Object.keys(PORTRAIT_DATA).forEach(k=>{ const im=new Image(); im.src=PORTRAIT_DATA[k]; portraitImgs[k]=im; });
function portraitOK(k){ const im=portraitImgs[k]; return im&&im.complete&&im.naturalWidth>0; }

// =====================================================================
//  SON
// =====================================================================
const Snd={
  ctx:null,on:true,last:{},nb:null,master:null,
  init(){
    if(this.ctx) return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
      this.ctx=new AC(); this.master=this.ctx.createGain(); this.master.gain.value=.33; this.master.connect(this.ctx.destination);
      const len=this.ctx.sampleRate, b=this.ctx.createBuffer(1,len,this.ctx.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
      this.nb=b;
    }catch(e){ this.ctx=null; }
  },
  resume(){ if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); },
  tone(f,d,type,v,f2,delay){
    if(!this.ctx||!this.on) return;
    const c=this.ctx,t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(f,t);
    if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v||.2,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+d+.03);
  },
  noise(d,v,type,f1,f2,delay){
    if(!this.ctx||!this.on||!this.nb) return;
    const c=this.ctx,t=c.currentTime+(delay||0),s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();
    s.buffer=this.nb; fl.type=type||'lowpass'; fl.frequency.setValueAtTime(f1,t); fl.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t+d);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v||.2,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(fl); fl.connect(g); g.connect(this.master); s.start(t,Math.random()*.4,d+.05);
  },
  play(n){
    if(!this.ctx||!this.on) return;
    const now=performance.now(), gap=({shot:70,hit:60,boom:100,sniper:90,shell:90,lob:100,flame:110,slam:110})[n]||0;
    if(gap&&this.last[n]&&now-this.last[n]<gap) return; this.last[n]=now;
    switch(n){
      case 'click': this.tone(520,.05,'triangle',.1,780); break;
      case 'deploy': this.noise(.28,.26,'lowpass',900,110); this.tone(150,.26,'sine',.3,55); break;
      case 'shot': this.noise(.08,.13,'highpass',2600,1200); this.tone(230,.05,'square',.035,110); break;
      case 'sniper': this.noise(.22,.28,'bandpass',3200,600); this.tone(95,.18,'sawtooth',.11,40); break;
      case 'shell': this.noise(.3,.28,'lowpass',1300,150); this.tone(115,.26,'sawtooth',.13,45); break;
      case 'lob': this.tone(300,.16,'sine',.1,520); this.noise(.1,.08,'highpass',1800,900); break;
      case 'flame': this.noise(.3,.16,'bandpass',900,380); break;
      case 'slam': this.tone(80,.3,'sine',.35,38); this.noise(.22,.24,'lowpass',700,90); break;
      case 'boom': this.noise(.6,.46,'lowpass',720,60); this.tone(72,.5,'sine',.38,30); break;
      case 'hit': this.noise(.09,.11,'bandpass',1800,900); break;
      case 'deny': this.tone(190,.16,'square',.11,120); break;
      case 'double': this.tone(440,.13,'triangle',.16,660); this.tone(660,.2,'triangle',.16,990,.1); break;
      case 'win': [523,659,784,1046].forEach((f,i)=>this.tone(f,.32,'triangle',.2,null,i*.13)); break;
      case 'lose': [330,262,196,147].forEach((f,i)=>this.tone(f,.4,'sawtooth',.13,f*.9,i*.16)); break;
    }
  },
  toggle(){ this.on=!this.on; }
};

// =====================================================================
//  ÉTAT
// =====================================================================
let S=null, NOW=0, diffKey='soldat', gameMode='story';
const NET={peer:null,conn:null,host:false,room:'',connected:false,started:false,lastSend:0,role:'offline',cursorSent:0};
let networkRoomFromUrl='';
try{ networkRoomFromUrl=((location.search+location.hash).match(/room=([A-Za-z0-9_-]+)/)||[])[1]||''; networkRoomFromUrl=networkRoomFromUrl.toLowerCase(); }catch(e){}
const PEER_OPTS={debug:1,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'},{urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turns:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]}};
function isGuest(){ return !!(S&&S.mode==='multi'&&NET.role==='guest'); }
function curHand(){ return isGuest()?S.eHand:S.hand; }
const MULTI_CARDS=[...CARDS.player,...CARDS.enemy,
  {key:'medecin',name:'Médecin de combat',cost:3,speed:1.9,hp:18,dmg:3,range:2.2,interval:1.15,body:'hero',fx:'bullet',rar:'rare',role:'Soutien',desc:'Combattant mobile capable de tenir la ligne et de soutenir les assauts.'},
  {key:'demolisseur',name:'Démolisseur',cost:4,speed:1.5,hp:24,dmg:8,range:2.5,interval:1.35,body:'infantry',fx:'grenade',rar:'rare',role:'Explosifs',splash:{r:34,f:.55},desc:'Lance des charges explosives qui frappent plusieurs ennemis.'},
  {key:'eclaireuse',name:'Éclaireuse',cost:2,speed:2.8,hp:11,dmg:4,range:2.8,interval:.8,body:'sniper',fx:'sniper',rar:'commune',role:'Reconnaissance',desc:'Très rapide et précise, parfaite pour prendre l’initiative.'},
  {key:'briseur',name:'Briseur blindé',cost:6,speed:1.0,hp:58,dmg:11,range:2.1,interval:1.5,body:'tank',fx:'shell',rar:'heroique',role:'Assaut lourd',splash:{r:38,f:.5},desc:'Machine lourde conçue pour ouvrir une brèche dans la ligne adverse.'}
];
const keys={};
let slots=[], enemySlots=[], hoverCard=-1;
let canvas=$('field'), ctx=canvas.getContext('2d'), wrap=$('field-wrap'), bg=null;

try{ const dk=localStorage.getItem('bf_diff'); if(dk&&DIFF[dk]) diffKey=dk; }catch(e){}

// =====================================================================
//  RÉSEAU
// =====================================================================
function netStatus(text,cls){
  const b=$('connectionBadge'); if(!b)return; b.textContent=text; b.className='on '+(cls||'');
}
function roomId(){ return 'bf-'+Math.random().toString(36).slice(2,8); }
function roomUrl(id){ return location.origin+location.pathname+'?room='+id; }
function parseRoom(str){ if(!str) return ''; const m=String(str).match(/room=([A-Za-z0-9_-]+)/); return (m?m[1]:String(str)).toLowerCase().replace(/[^a-z0-9_-]/g,''); }
function netSend(msg){ try{ if(NET.conn&&NET.conn.open) NET.conn.send(msg); }catch(e){} }
function cardKeys(a){ return a.map(x=>x.key); }
function cardsFromKeys(keys){ return keys.map(k=>MULTI_CARDS.find(x=>x.key===k)).filter(Boolean); }

function makeSnapshot(){
  return {type:'state',t:S.t,timeLeft:S.timeLeft,double:S.double,pElixir:S.pElixir,eElixir:S.eElixir,
    pTower:{hp:S.pTower.hp,aim:S.pTower.aim,flash:S.pTower.flash,recoil:S.pTower.recoil},
    eTower:{hp:S.eTower.hp,aim:S.eTower.aim,flash:S.eTower.flash,recoil:S.eTower.recoil},
    units:S.units.map(u=>({id:u.id,team:u.team,key:u.d.key,x:u.x,y:u.y,hp:u.hp,max:u.max,dir:u.dir,aim:u.aim,cd:u.cd,atk:u.atk,phase:u.phase,spawn:u.spawn,landed:u.landed,moving:u.moving,dead:u.dead})),
    result:S.result,phase:S.phase,stats:S.stats,
    eHand:cardKeys(S.eHand),eNext:S.eNext.key,
    projs:S.projs.map(p=>({team:p.team,x:p.x,y:p.y,fx:p.fx,tx:p.tx,ty:p.ty,ux:p.ux,uy:p.uy,rot:p.rot,total:p.total,arc:p.arc,speed:p.speed,dmg:0}))
  };
}
function applySnapshot(m){
  if(!S||S.mode!=='multi')return;
  S.t=m.t; S.timeLeft=m.timeLeft; S.double=m.double; S.pElixir=m.pElixir; S.eElixir=m.eElixir;
  Object.assign(S.pTower,m.pTower); Object.assign(S.eTower,m.eTower);
  if(m.eHand){ const h=cardsFromKeys(m.eHand); if(h.length===4) S.eHand=h; const n=MULTI_CARDS.find(x=>x.key===m.eNext); if(n) S.eNext=n; }
  const old=new Map(S.units.map(u=>[u.id,u])), seen={}, list=[];
  (m.units||[]).forEach(v=>{
    const d=MULTI_CARDS.find(x=>x.key===v.key); if(!d) return; seen[v.id]=1;
    let u=old.get(v.id);
    if(u){ const px=u.x,py=u.y,was=u.landed; Object.assign(u,v,{d:d}); u.nx=v.x; u.ny=v.y; u.x=px; u.y=py; if(v.landed&&!was) landFx(u); }
    else u=Object.assign({},v,{d:d,r:d.body==='tank'?15:(d.body==='hero'?14:10),mass:d.body==='tank'?3:(d.body==='hero'?2:1),rangePx:d.range*PX,speedPx:d.speed*PX,tgt:null,retarget:.2,nx:v.x,ny:v.y,flash:0});
    list.push(u);
  });
  old.forEach((u,id)=>{ if(!seen[id]) explosion(u.x,u.y,u.d.body==='tank'?1.25:(u.d.body==='hero'?1:.6)); });
  S.units=list;
  S.projs=(m.projs||[]).map(p=>Object.assign({},p,{t:null,splash:null,life:0,done:false}));
  S.stats=m.stats||S.stats;
  if(m.phase==='ending'&&S.phase==='playing'){ beginEnding(m.result); }
  else if(m.phase==='over'&&S.phase!=='over'){ S.result=m.result; finishGame(); }
}
function sendSnapshot(force){ if(!NET.host||!NET.connected||!S||S.mode!=='multi')return; const now=performance.now(); if(!force&&now-NET.lastSend<80)return; NET.lastSend=now; netSend(makeSnapshot()); }
function netClose(){ try{if(NET.conn)NET.conn.close(); if(NET.peer)NET.peer.destroy();}catch(e){} NET.peer=null; NET.conn=null; NET.connected=false; NET.started=false; NET.host=false; NET.room=''; NET.role='offline'; netStatus('Hors ligne'); }

// ---------- MODAL QR ----------
function showQrModal(){
  const m=$('qrModal'); if(m) m.classList.remove('hidden');
}
function closeQrModal(){
  const m=$('qrModal'); if(m) m.classList.add('hidden');
  const cv=$('qrCanvas'); if(cv) cv.style.display='block';
  const sb=$('qrStartBtn'); if(sb) sb.style.display='inline-block';
  const cb=$('qrCopyBtn'); if(cb) cb.style.display='inline-block';
  const t=$('qrTitle'); if(t) t.textContent='Salle 1 VS 1';
}

function openHostModal(){
  showQrModal();
  const t=$('qrTitle'); if(t) t.textContent='Salle 1 VS 1';
  $('qrRoomCode').textContent = NET.room ? NET.room.toUpperCase() : '—';
  const st=$('qrModalStatus');
  st.textContent='Création de la salle…'; st.className='';
  $('qrStartBtn').disabled=true;
  $('qrStartBtn').textContent="En attente de l'ami…";
  const cv=$('qrCanvas'); cv.style.display='block'; const lk0=$('qrLink'); if(lk0) lk0.style.display='block';
  const sb=$('qrStartBtn'); sb.style.display='inline-block';
  const cb=$('qrCopyBtn'); cb.style.display='inline-block';

  $('qrCloseBtn').onclick = () => { closeQrModal(); };
  $('qrStartBtn').onclick = () => {
    if(NET.connected){ NET.started=true; startGame(); closeQrModal(); }
  };
  $('qrCopyBtn').onclick = async () => {
    const url=roomUrl(NET.room);
    try{ await navigator.clipboard.writeText(url); st.textContent='Lien copié ! Envoie-le à ton ami.'; st.className='online-ready'; }
    catch(e){ st.innerHTML='<b style="word-break:break-all">'+url+'</b>'; }
  };
}

function paintQr(){
  const url=roomUrl(NET.room), cv=$('qrCanvas'), st=$('qrModalStatus'), lk=$('qrLink');
  if(!cv) return;
  if(lk) lk.textContent=url;
  try{ window.BFQR.toCanvas(cv,url,300); }
  catch(e){ st.innerHTML='QR indisponible. Envoie ce lien à ton ami :<br><b style="word-break:break-all">'+url+'</b>'; return; }
  if(location.protocol==='file:'){ st.textContent='⚠ Ouvre le jeu depuis ton adresse Vercel (https) : en fichier local le QR ne peut pas fonctionner.'; st.className='online-warn'; }
}
function openJoinModal(){
  showQrModal();
  const t=$('qrTitle'); if(t) t.textContent='Connexion';
  const cv=$('qrCanvas'); if(cv) cv.style.display='none'; const lk1=$('qrLink'); if(lk1) lk1.style.display='none';
  $('qrRoomCode').textContent = NET.room ? NET.room.toUpperCase() : '—';
  const st=$('qrModalStatus');
  st.textContent='Connexion à la salle '+NET.room.toUpperCase()+'…'; st.className='';
  const sb=$('qrStartBtn'); if(sb) sb.style.display='none';
  const cb=$('qrCopyBtn'); if(cb) cb.style.display='none';
  $('qrCloseBtn').onclick = () => { closeQrModal(); netClose(); };
}

function markConnected(){
  NET.connected=true; netStatus('● 1 VS 1 connecté','ready');
  const st=$('qrModalStatus');
  if(st){ st.textContent=NET.host?'Ton ami est connecté. Lance le duel !':'Connecté. En attente du créateur…'; st.className='online-ready'; }
  const b=$('qrStartBtn');
  if(b){ b.disabled=false; b.textContent='Lancer le duel'; }
}

function hostOnline(tries){
  tries=tries||0;
  netClose(); NET.host=true; NET.role='host'; NET.room=roomId();
  netStatus('Création de la salle…');
  openHostModal();
  paintQr();                                   // le QR s'affiche tout de suite, sans attendre le serveur
  const st=$('qrModalStatus');
  if(location.protocol!=='file:'){ st.textContent='Connexion au serveur… le QR est déjà valable.'; st.className=''; }
  if(!window.Peer){
    netStatus('PeerJS indisponible','online-warn');
    st.textContent='PeerJS indisponible. Vérifie ta connexion internet puis recharge la page.'; st.className='online-warn';
    return;
  }
  NET.peer=new Peer(NET.room,PEER_OPTS);
  NET.peer.on('open',()=>{
    netStatus('● Salle prête — attente de l\'ami','');
    if(location.protocol!=='file:'){ st.textContent='Salle prête. Fais scanner ce QR code à ton ami.'; st.className='online-ready'; }
  });
  NET.peer.on('disconnected',()=>{ try{ if(NET.peer&&!NET.peer.destroyed) NET.peer.reconnect(); }catch(e){} });
  NET.peer.on('connection',conn=>{
    if(NET.conn&&NET.conn.open){ conn.close(); return; }
    NET.conn=conn;
    conn.on('open',()=>{
      NET.connected=true;
      markConnected();
      netSend({type:'init',pHand:cardKeys(S.hand),pNext:S.next.key,eHand:cardKeys(S.eHand),eNext:S.eNext.key});
    });
    conn.on('data',m=>handleNetMessage(m));
    conn.on('close',()=>{ NET.connected=false; netStatus('Ami déconnecté','online-warn'); });
    conn.on('error',()=>{ NET.connected=false; netStatus('Erreur de connexion','online-warn'); });
  });
  NET.peer.on('error',e=>{
    const t=(e&&e.type)||'';
    if(t==='unavailable-id'&&tries<3){ hostOnline(tries+1); return; }
    const msg=(t==='network'||t==='server-error'||t==='socket-error')?'Serveur de connexion injoignable. Réessaie dans un instant.':('Erreur : '+t);
    netStatus(msg,'online-warn'); st.textContent=msg; st.className='online-warn';
  });
}
function joinOnline(id,att){
  att=att||0;
  netClose(); NET.host=false; NET.role='guest'; NET.room=id;
  netStatus('Connexion…');
  openJoinModal();
  const st=$('qrModalStatus'); let done=false;
  const fail=msg=>{ netStatus(msg,'online-warn'); st.textContent=msg; st.className='online-warn'; };
  const retry=why=>{
    if(done) return; done=true;
    if(att<4){ st.textContent=why+' Nouvelle tentative ('+(att+1)+'/4)…'; st.className='online-warn';
      setTimeout(()=>{ if(NET.role==='guest'&&NET.room===id&&!NET.connected) joinOnline(id,att+1); },2500); }
    else fail("Impossible de rejoindre la salle "+id.toUpperCase()+". Vérifie que le créateur garde la fenêtre « Salle 1 VS 1 » ouverte, puis rescanne le QR.");
  };
  if(!window.Peer){ fail('PeerJS indisponible. Vérifie ta connexion internet.'); return; }
  NET.peer=new Peer(undefined,PEER_OPTS);
  NET.peer.on('open',()=>{
    st.textContent='Connexion à la salle '+id.toUpperCase()+'…';
    const conn=NET.peer.connect(id,{reliable:true,serialization:'json'});
    NET.conn=conn;
    const to=setTimeout(()=>{ if(!conn.open) retry('Pas de réponse du créateur.'); },15000);
    conn.on('open',()=>{ clearTimeout(to); done=true; markConnected(); netSend({type:'hello'}); });
    conn.on('data',handleNetMessage);
    conn.on('close',()=>{ NET.connected=false; netStatus('Créateur déconnecté','online-warn'); });
    conn.on('error',()=>retry('Erreur de connexion.'));
  });
  NET.peer.on('error',e=>{
    const t=(e&&e.type)||'';
    if(t==='peer-unavailable') retry("Salle introuvable pour l'instant.");
    else if(t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed') retry('Serveur de connexion injoignable.');
    else if(t==='browser-incompatible') fail('Navigateur incompatible.');
    else fail('Erreur : '+t);
  });
}
function handleNetMessage(m){
  if(!m||!m.type) return;

  if(m.type==='hello' && NET.host){
    markConnected();
    netSend({
      type:'init',
      pHand:cardKeys(S.hand), pNext:S.next.key,
      eHand:cardKeys(S.eHand), eNext:S.eNext.key
    });
    return;
  }

  if(m.type==='init' && !NET.host){
    S.hand = cardsFromKeys(m.pHand);
    S.next = MULTI_CARDS.find(x=>x.key===m.pNext) || S.next;
    S.eHand = cardsFromKeys(m.eHand);
    S.eNext = MULTI_CARDS.find(x=>x.key===m.eNext) || S.eNext;
    buildHand(); buildEnemyHand();
    return;
  }

  if(m.type==='start' && !NET.host){
    NET.started=true;
    closeQrModal();
    startGame(true);
    return;
  }

  if(m.type==='p2' && NET.host){
    if(!S||S.phase!=='playing')return;
    S.eCursor.x=clamp(m.x,LANE_L+12,LANE_R-12);
    S.eCursor.y=clamp(m.y,ENEMY_MIN_Y,ENEMY_MAX_Y);
    if(m.kind==='deploy'&&m.slot>=0){ S.eSel=m.slot; tryDeployEnemy(); }
    return;
  }

  if(m.type==='state' && !NET.host){ applySnapshot(m); }
}

function sendP2(){
  if(!NET.connected||NET.host||!S||S.mode!=='multi')return;
  netSend({type:'p2',x:S.eCursor.x,y:S.eCursor.y,slot:S.eSel,kind:'cursor'});
}

// =====================================================================
//  NOUVELLE PARTIE
// =====================================================================
function newGame(){
  const chap=(gameMode==='story'&&CUR>=0)?CHAPTERS[CUR]:null;
  const byKey=k=>MULTI_CARDS.find(x=>x.key===k);
  let pool, enemyPool;
  if(gameMode==='multi'){ pool=MULTI_CARDS; enemyPool=MULTI_CARDS; }
  else if(chap){
    pool=CARDS.player.concat((CAMP_ALLY[storyProg.camp]||[]).map(byKey).filter(Boolean));
    const f=chapFaction(chap), keys=POOLS[f].slice(), boss=chapBoss(chap);
    if(boss&&keys.indexOf(boss)<0) keys.push(boss);
    enemyPool=diffKeys(keys,boss).map(byKey).filter(Boolean);
  } else { pool=CARDS.player; enemyPool=SKIRM[diffKey].map(byKey).filter(Boolean); }
  const pq=shuffle(pool), eq=shuffle(enemyPool);
  if(chap){ const b=chapBoss(chap); if(b){ const i=eq.findIndex(c=>c.key===b); if(i>0){ const t=eq[0]; eq[0]=eq[i]; eq[i]=t; } } }
  S={
    phase:'menu', mode:gameMode, chap:chap, t:0, timeLeft:MATCH_TIME, double:false,
    pElixir:(chap&&storyProg.camp==='indep')?7:5, eElixir:5,
    pTower:{isTower:true,team:'player',x:W/2,y:H-50,hp:TOWER_MAX,max:TOWER_MAX,aim:-Math.PI/2,recoil:0,flash:0,cd:1,fxT:0},
    eTower:{isTower:true,team:'enemy', x:W/2,y:50,  hp:TOWER_MAX,max:TOWER_MAX,aim: Math.PI/2,recoil:0,flash:0,cd:1,fxT:0},
    units:[],projs:[],parts:[],decals:[],nextId:1,
    hand:pq.slice(0,4), next:pq[4], queue:pq.slice(5),
    eHand:eq.slice(0,4), eNext:eq[4], eQueue:eq.slice(5),
    sel:-1, eSel:-1,
    cursor:{x:W/2,y:DEPLOY_MIN_Y+56,mode:'mouse'},
    eCursor:{x:W/2,y:ENEMY_MAX_Y-56,mode:'kb'},
    shake:0, stats:{deployed:0,kills:0,dmg:0},
    ai:{timer:1.4,diff:chap?chapterAI(CUR):DIFF[diffKey]},
    endT:0, result:null, bigBoom:null, endBooms:0, prevPhase:null
  };
  if(chap){ const hp=chap.fac==='boss'?240:100+CUR*12; S.eTower.hp=S.eTower.max=hp; }
}
// =====================================================================
//  PARTICULES
// =====================================================================
function P(o){
  if(S.parts.length>650) return;
  const p={life:0,max:.5,vx:0,vy:0,g:0,drag:0,size:2,color:'#fff',add:false,type:'dot',a0:1,lw:2};
  for(const k in o) p[k]=o[k];
  if(p.size2===undefined) p.size2=p.size;
  S.parts.push(p);
}
function explosion(x,y,s){
  for(let i=0;i<Math.round(9*s);i++){ const a=rand(0,TAU),v=rand(20,110)*s; P({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:3,size:rand(3,6)*s,size2:0.5,max:rand(.3,.6),color:Math.random()<.5?'#ff9b3a':'#ffd36b',add:true}); }
  for(let i=0;i<Math.round(6*s);i++){ const a=rand(0,TAU),v=rand(8,44)*s; P({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-8,drag:1.5,size:rand(4,7)*s,size2:rand(12,20)*s,max:rand(.7,1.2),color:'rgba(70,66,58,.75)',a0:.8}); }
  for(let i=0;i<Math.round(7*s);i++){ const a=rand(0,TAU),v=rand(90,220); P({type:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:2.5,max:rand(.25,.5),color:'#ffe9a8',add:true}); }
  P({type:'ring',x,y,size:4,size2:30*s,max:.4,color:'rgba(255,200,120,.9)',lw:3,add:true});
  P({x,y,size:16*s,size2:2,max:.14,color:'#fff4c8',add:true});
  S.shake=Math.max(S.shake,3*s);
  Snd.play('boom');
}
function dust(x,y,s){
  P({type:'ring',x,y,size:3,size2:22*s,max:.45,color:'rgba(210,200,170,.7)',lw:2.5});
  for(let i=0;i<Math.round(7*s);i++){ const a=rand(0,TAU),v=rand(15,55)*s; P({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,drag:3,size:rand(2,4)*s,size2:rand(7,12)*s,max:rand(.5,.9),color:'rgba(150,140,115,.6)',a0:.7}); }
}
function floatText(x,y,text,color,size){ P({type:'text',x,y,vy:-30,drag:1.2,max:.75,text:text,color:color||'#fff',size:size||10}); }
function flashPuff(x,y,r){ P({x,y,size:r,size2:1,max:.09,color:'#ffe7a0',add:true}); }

// =====================================================================
//  UNITÉS
// =====================================================================
function spawnUnit(team,d,x,y){
  const u={ id:S.nextId++, team:team, d:d, x:x, y:y, hp:d.hp, max:d.hp, dir:team==='player'?-1:1,
    aim:team==='player'?-Math.PI/2:Math.PI/2, tgt:null, retarget:0, cd:.35, atk:0, flash:0, phase:Math.random()*6,
    spawn:0, landed:false, moving:false, dead:false,
    rangePx:d.range*PX, speedPx:d.speed*PX,
    r:d.body==='tank'?15:(d.body==='hero'?14:10), mass:d.body==='tank'?3:(d.body==='hero'?2:1) };
  S.units.push(u);
  P({type:'ring',x:x,y:y,size:16,size2:5,max:.5,color:team==='player'?'rgba(127,166,204,.9)':'rgba(224,102,77,.9)',lw:2.5,add:true});
  return u;
}
function landFx(u){
  dust(u.x,u.y+4,u.d.body==='tank'?1.4:1);
  if(u.d.body==='tank'||u.d.body==='hero') S.shake=Math.max(S.shake,1.6);
  Snd.play('deploy');
}
function acquire(u){
  const tower=u.team==='player'?S.eTower:S.pTower;
  let best=null,bd=1e9;
  for(const o of S.units){ if(o.team===u.team||o.dead||o.spawn<.5) continue; const d=dist(u,o); if(d<bd){bd=d;best=o;} }
  const aggro=Math.max(u.rangePx+40,115);
  if(best&&bd<=aggro) return best;
  return tower;
}
function muzzle(u){
  const L=u.d.body==='tank'?20:u.d.body==='sniper'?25:u.d.body==='hero'?19:15;
  return {x:u.x+Math.cos(u.aim)*L,y:u.y+Math.sin(u.aim)*L};
}
function fire(u,t){
  const d=u.d; u.atk=1; u.aim=Math.atan2(t.y-u.y,t.x-u.x);
  const m=muzzle(u), fx=d.fx;
  const pr={team:u.team,x:m.x,y:m.y,fx:fx,t:t,tx:t.x,ty:t.y,dmg:d.dmg,splash:d.splash||null,speed:FX[fx].speed,arc:FX[fx].arc||0,ux:1,uy:0,rot:0,life:0,done:false};
  pr.total=Math.max(20,Math.hypot(t.x-m.x,t.y-m.y)); S.projs.push(pr);
  flashPuff(m.x,m.y,fx==='sniper'?9:6);
  if(fx==='sniper') for(let i=0;i<3;i++){ P({type:'spark',x:m.x,y:m.y,vx:Math.cos(u.aim)*rand(150,300)+rand(-40,40),vy:Math.sin(u.aim)*rand(150,300)+rand(-40,40),drag:3,max:.25,color:'#fff2b0',add:true}); }
  if(fx==='shell') for(let i=0;i<3;i++) P({x:m.x,y:m.y,vx:rand(-20,20),vy:rand(-20,20),size:3,size2:9,max:.6,color:'rgba(120,116,105,.6)',a0:.7});
  if(fx==='slam'){ P({type:'ring',x:u.x,y:u.y+4,size:8,size2:30,max:.35,color:'rgba(240,200,110,.9)',lw:3,add:true}); }
  Snd.play(fx==='bullet'?'shot':fx==='sniper'?'sniper':fx==='shell'?'shell':fx==='grenade'?'lob':fx==='fire'?'flame':'slam');
}
function towerFire(T,t){
  const m={x:T.x+Math.cos(T.aim)*24,y:T.y+Math.sin(T.aim)*24};
  S.projs.push({team:T.team,x:m.x,y:m.y,fx:'tower',t:t,tx:t.x,ty:t.y,dmg:TOWER_DMG,splash:null,speed:FX.tower.speed,arc:0,ux:1,uy:0,rot:0,life:0,done:false,total:Math.hypot(t.x-m.x,t.y-m.y)});
  T.recoil=1; flashPuff(m.x,m.y,8); Snd.play('shot');
}
function hit(t,dmg,team){
  const val=Math.max(1,Math.round(dmg));
  if(t.isTower){
    if(t.hp<=0) return;
    t.hp=Math.max(0,t.hp-dmg); t.flash=.16;
    floatText(t.x+rand(-12,12),t.y+(t.team==='player'?-38:32),'-'+val,team==='player'?'#ffd36b':'#ff8f78',12);
    for(let i=0;i<4;i++){ const a=rand(0,TAU),v=rand(60,150); P({type:'spark',x:t.x+rand(-14,14),y:t.y+rand(-10,10),vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:3,max:.3,color:'#ffe19a',add:true}); }
    S.shake=Math.max(S.shake,team==='enemy'?2.4:1.3);
    if(team==='player') S.stats.dmg+=dmg;
    Snd.play('hit');
  } else {
    if(t.dead) return;
    t.hp-=dmg; t.flash=.12;
    floatText(t.x+rand(-6,6),t.y-t.r-10,'-'+val,t.team==='enemy'?'#ffe6a0':'#ff9d8a',9);
    if(t.team==='enemy'&&team==='player') S.stats.dmg+=dmg;
    if(t.hp<=0) killUnit(t);
  }
}
function killUnit(u){
  u.dead=true;
  if(u.team==='enemy') S.stats.kills++;
  explosion(u.x,u.y,u.d.body==='tank'?1.25:(u.d.body==='hero'?1.0:.6));
  S.decals.push({x:u.x,y:u.y,r:u.d.body==='tank'?17:11,life:0});
  if(S.decals.length>40) S.decals.shift();
  floatText(u.x,u.y-u.r-16,'✕',u.team==='enemy'?'#ffd36b':'#ff9d8a',11);
}
function impact(p){
  p.done=true;
  const t=p.t;
  if(t&&(t.isTower||!t.dead)) hit(t,p.dmg,p.team);
  const fx=p.fx;
  if(p.splash){
    const c2={x:p.tx,y:p.ty};
    for(const o of S.units){ if(o.dead||o.team===p.team||o===t) continue; if(dist(o,c2)<=p.splash.r) hit(o,p.dmg*p.splash.f,p.team); }
  }
  if(fx==='bullet'||fx==='tower'){ for(let i=0;i<3;i++){ const a=rand(0,TAU),v=rand(50,120); P({type:'spark',x:p.tx,y:p.ty,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:3,max:.25,color:'#ffe19a',add:true}); } flashPuff(p.tx,p.ty,4); }
  else if(fx==='sniper'){ for(let i=0;i<5;i++){ const a=rand(0,TAU),v=rand(80,200); P({type:'spark',x:p.tx,y:p.ty,vx:Math.cos(a)*v,vy:Math.sin(a)*v,drag:3,max:.3,color:'#fff4c0',add:true}); } P({type:'ring',x:p.tx,y:p.ty,size:3,size2:12,max:.25,color:'rgba(255,240,190,.9)',lw:2,add:true}); }
  else if(fx==='shell'){ explosion(p.tx,p.ty,.75); }
  else if(fx==='grenade'){ explosion(p.tx,p.ty,.85); }
  else if(fx==='fire'){ for(let i=0;i<12;i++){ const a=rand(0,TAU),v=rand(10,70); P({x:p.tx,y:p.ty,vx:Math.cos(a)*v,vy:Math.sin(a)*v-18,drag:2,g:-30,size:rand(3,6),size2:.5,max:rand(.4,.8),color:Math.random()<.5?'#ff7a2a':'#ffc248',add:true}); } P({x:p.tx,y:p.ty,size:7,size2:20,max:.5,color:'rgba(255,120,40,.25)',add:true}); Snd.play('flame'); }
  else if(fx==='slam'){ P({type:'ring',x:p.tx,y:p.ty,size:4,size2:(p.splash?p.splash.r:30),max:.4,color:'rgba(240,200,110,.9)',lw:3,add:true}); S.shake=Math.max(S.shake,2.2); dust(p.tx,p.ty,.9); }
}
function updateProjs(dt){
  for(const p of S.projs){
    if(p.done) continue;
    p.life+=dt;
    const t=p.t; if(t&&(t.isTower||!t.dead)){ p.tx=t.x; p.ty=t.y; }
    const dx=p.tx-p.x, dy=p.ty-p.y, d=Math.hypot(dx,dy), step=p.speed*dt;
    if(d>0.001){ p.ux=dx/d; p.uy=dy/d; }
    if(d<=step+3){ impact(p); continue; }
    p.x+=p.ux*step; p.y+=p.uy*step; p.rot+=dt*14;
    if(p.fx==='shell'&&Math.random()<.8) P({x:p.x,y:p.y,size:2,size2:6,max:.35,color:'rgba(150,145,130,.55)',a0:.6});
    if(p.fx==='fire'){ for(let i=0;i<2;i++) P({x:p.x+rand(-2,2),y:p.y+rand(-2,2),vx:rand(-14,14),vy:rand(-14,14),size:rand(3,5),size2:.5,max:rand(.25,.45),color:Math.random()<.5?'#ff7a2a':'#ffc248',add:true}); }
    if(p.fx==='slam'&&Math.random()<.5) P({x:p.x,y:p.y,size:4,size2:1,max:.25,color:'#ffe08a',add:true});
  }
  S.projs=S.projs.filter(p=>!p.done);
}
function updateTower(T,dt){
  T.flash=Math.max(0,T.flash-dt); T.recoil=Math.max(0,T.recoil-dt*6); T.cd-=dt;
  let best=null,bd=TOWER_RANGE;
  for(const u of S.units){ if(u.dead||u.team===T.team||u.spawn<1) continue; const d=dist(T,u); if(d<bd){bd=d;best=u;} }
  if(best){
    T.aim=angLerp(T.aim,Math.atan2(best.y-T.y,best.x-T.x),Math.min(1,dt*10));
    if(T.cd<=0){ towerFire(T,best); T.cd=TOWER_INT; }
  } else T.aim=angLerp(T.aim,T.team==='player'?-Math.PI/2:Math.PI/2,Math.min(1,dt*2));
  T.fxT-=dt;
  if(T.fxT<=0){
    T.fxT=.12; const r=T.hp/T.max;
    if(r<.5&&T.hp>0) P({x:T.x+rand(-14,14),y:T.y+rand(-8,8),vy:-22,size:3,size2:11,max:1,color:'rgba(60,58,52,.7)',a0:.7});
    if(r<.25&&T.hp>0) P({x:T.x+rand(-16,16),y:T.y+rand(-8,8),vy:-18,size:4,size2:1,max:.5,color:Math.random()<.5?'#ff7a2a':'#ffc248',add:true});
  }
}
function updateUnits(dt){
  const us=S.units;
  for(const u of us){
    if(u.dead) continue;
    if(u.flash>0) u.flash-=dt;
    if(u.atk>0) u.atk=Math.max(0,u.atk-dt*4.5);
    if(u.spawn<1){ u.spawn=Math.min(1,u.spawn+dt/SPAWN_T); if(!u.landed&&u.spawn>=.62){ u.landed=true; landFx(u); } continue; }
    u.retarget-=dt;
    if(!u.tgt||u.tgt.dead||u.retarget<=0){ u.tgt=acquire(u); u.retarget=.3; }
    const t=u.tgt, tr=t.isTower?TOWER_R:t.r*.5;
    const dd=dist(u,t)-tr, ang=Math.atan2(t.y-u.y,t.x-u.x);
    u.cd=Math.max(0,u.cd-dt);
    let moving=false;
    if(dd>u.rangePx){
      let vx,vy;
      if(t.isTower){ vx=clamp((t.x-u.x)*.8,-u.speedPx*.45,u.speedPx*.45); vy=u.dir*u.speedPx; }
      else { vx=Math.cos(ang)*u.speedPx; vy=Math.sin(ang)*u.speedPx; }
      const m=Math.hypot(vx,vy)||1, k=u.speedPx/m; vx*=k; vy*=k;
      u.x+=vx*dt; u.y+=vy*dt; moving=true;
      u.aim=angLerp(u.aim,Math.atan2(vy,vx),Math.min(1,dt*8));
      if(u.d.body==='tank'&&Math.random()<dt*10) P({x:u.x-Math.cos(u.aim)*14,y:u.y-Math.sin(u.aim)*14,vx:rand(-8,8),vy:rand(-8,8),size:2,size2:7,max:.6,color:'rgba(110,105,95,.5)',a0:.5});
    } else {
      u.aim=angLerp(u.aim,ang,Math.min(1,dt*14));
      if(u.cd<=0){ fire(u,t); u.cd=u.d.interval; }
    }
    u.moving=moving; if(moving) u.phase+=u.speedPx*dt*.12;
  }
  for(let i=0;i<us.length;i++){ const a=us[i]; if(a.dead) continue;
    for(let j=i+1;j<us.length;j++){ const b=us[j]; if(b.dead) continue;
      const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy), min=(a.r+b.r)*.85;
      if(d<min&&d>.01){ const push=(min-d)*.5, nx=dx/d, ny=dy/d, wa=b.mass/(a.mass+b.mass), wb=a.mass/(a.mass+b.mass);
        a.x-=nx*push*wa*2; a.y-=ny*push*wa*2*.7; b.x+=nx*push*wb*2; b.y+=ny*push*wb*2*.7; }
    }
  }
  for(const u of us){ u.x=clamp(u.x,LANE_L+u.r*.5,LANE_R-u.r*.5); u.y=clamp(u.y,18,H-18); }
  S.units=us.filter(u=>!u.dead);
}
function updateParts(dt){
  const ps=S.parts;
  for(let i=ps.length-1;i>=0;i--){
    const p=ps[i]; p.life+=dt;
    if(p.life>=p.max){ ps.splice(i,1); continue; }
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.g*dt;
    if(p.drag){ const k=Math.max(0,1-p.drag*dt); p.vx*=k; p.vy*=k; }
  }
  for(let i=S.decals.length-1;i>=0;i--){ S.decals[i].life+=dt; if(S.decals[i].life>30) S.decals.splice(i,1); }
}

// =====================================================================
//  IA
// =====================================================================
function aiThink(){
  const dg=S.ai.diff;
  const opts=S.eHand.map((d,i)=>({d:d,i:i})).filter(o=>o.d.cost<=S.eElixir);
  if(!opts.length) return;
  const threats=S.units.filter(u=>u.team==='player'&&!u.dead&&u.y<H*.52);
  let pick=null,x,y;
  const score=d=>d.hp+d.dmg*4+d.cost*2;
  if(threats.length&&Math.random()<dg.smart){
    threats.sort((a,b)=>a.y-b.y); const th=threats[0];
    opts.sort((a,b)=>score(b.d)-score(a.d)); pick=opts[0];
    x=clamp(th.x+rand(-30,30),LANE_L+16,LANE_R-16); y=clamp(th.y-70,ENEMY_MIN_Y,ENEMY_MAX_Y);
  } else {
    if(S.eElixir<dg.push&&S.eElixir<9.5&&Math.random()<dg.patience) return;
    pick=S.eElixir>=8?opts.slice().sort((a,b)=>b.d.cost-a.d.cost)[0]:opts[Math.floor(Math.random()*opts.length)];
    x=rand(LANE_L+20,LANE_R-20); y=rand(ENEMY_MIN_Y+10,ENEMY_MIN_Y+55);
  }
  S.eElixir-=pick.d.cost;
  spawnUnit('enemy',pick.d,x,y);
  const played=S.eHand[pick.i]; S.eHand[pick.i]=S.eNext; S.eQueue.push(played); S.eNext=S.eQueue.shift();
}

// =====================================================================
//  BOUCLE
// =====================================================================
function moveCursor(dt){
  let dx=0,dy=0;
  if(keys.ArrowLeft||keys.KeyA) dx-=1; if(keys.ArrowRight||keys.KeyD) dx+=1;
  if(keys.ArrowUp||keys.KeyW) dy-=1;   if(keys.ArrowDown||keys.KeyS) dy+=1;
  if(dx||dy){
    const g=isGuest(), sp=(keys.ShiftLeft||keys.ShiftRight)?430:215, m=Math.hypot(dx,dy), c=g?S.eCursor:S.cursor; c.mode='kb';
    c.x=clamp(c.x+dx/m*sp*dt,LANE_L+12,LANE_R-12);
    c.y=g?clamp(c.y+dy/m*sp*dt,ENEMY_MIN_Y,ENEMY_MAX_Y):clamp(c.y+dy/m*sp*dt,DEPLOY_MIN_Y,DEPLOY_MAX_Y);
  }
}
function update(dt){
  if(!S) return;
  if(S.mode==='multi' && NET.connected && !NET.host){
    moveCursor(dt);
    if(S.eCursor){ const now=performance.now(); if(now-NET.cursorSent>80){NET.cursorSent=now; sendP2();} }
    const kk=Math.min(1,dt*14);
    for(const u of S.units){
      if(u.nx!==undefined){ u.x+=(u.nx-u.x)*kk; u.y+=(u.ny-u.y)*kk; }
      if(u.atk>0) u.atk=Math.max(0,u.atk-dt*4.5);
      if(u.flash>0) u.flash-=dt;
      if(u.spawn<1) u.spawn=Math.min(1,u.spawn+dt/SPAWN_T);
      if(u.moving) u.phase+=u.speedPx*dt*.12;
    }
    updateProjs(dt);
  } else if(S.phase==='playing'){
    S.t+=dt; S.timeLeft-=dt;
    if(S.timeLeft<=60&&!S.double){ S.double=true; banner('ÉLIXIR ×2',1900); Snd.play('double'); }
    const mul=S.double?2:1;
    S.pElixir=Math.min(MAX_ELX,S.pElixir+ELX_RATE*mul*dt);
    S.eElixir=Math.min(MAX_ELX,S.eElixir+ELX_RATE*mul*(S.mode==='multi'?1:S.ai.diff.mul)*dt);
    moveCursor(dt);
    if(S.mode==='story'){
      S.ai.timer-=dt; if(S.ai.timer<=0){ aiThink(); S.ai.timer=rand(S.ai.diff.min,S.ai.diff.max); }
    }
    updateUnits(dt); updateTower(S.pTower,dt); updateTower(S.eTower,dt); updateProjs(dt);
    if(S.pTower.hp<=0) beginEnding('lose');
    else if(S.eTower.hp<=0) beginEnding('win');
    else if(S.timeLeft<=0){ S.timeLeft=0; const a=S.pTower.hp,b=S.eTower.hp; beginEnding((S.chap&&S.chap.obj==='survive'&&a>0)?'win':(a>b?'win':(a<b?'lose':'draw'))); }
    if(S.mode==='multi'&&NET.host) sendSnapshot();
  } else if(S.phase==='ending'){
    if(S.mode==='multi'&&NET.host) sendSnapshot();
    S.endT+=dt;
    const T=S.bigBoom;
    if(T&&S.endT<1.3){ S.endBooms+=dt; if(S.endBooms>.16){ S.endBooms=0; explosion(T.x+rand(-26,26),T.y+rand(-18,18),rand(.6,1.1)); } }
    if(S.endT>=1.8) finishGame();
  }
  S.shake=Math.max(0,S.shake-dt*14);
  if(S.phase!=='paused'&&S.phase!=='menu') updateParts(dt);
}
function beginEnding(res){
  S.phase='ending'; S.result=res; S.endT=0; S.sel=-1; S.projs=[];
  S.bigBoom=res==='win'?S.eTower:(res==='lose'?S.pTower:null);
  if(S.bigBoom){ explosion(S.bigBoom.x,S.bigBoom.y,2.4); S.shake=9; }
}
function finishGame(){
  S.phase='over'; if(S.mode==='multi'&&NET.host) sendSnapshot(true);
  let r=S.result; if(isGuest()&&r!=='draw') r=r==='win'?'lose':'win';
  if(S.chap&&r==='win'){ storyProg.unlocked=Math.max(storyProg.unlocked,CUR+1); saveProg(); }
  if(r==='win'){ addWin(); Snd.play('win'); } else if(r==='lose') Snd.play('lose');
  if(S.chap&&r==='win'&&CUR===CHAPTERS.length-1){ showOverlay('ending'); return; }
  showOverlay('end');
}
// =====================================================================
//  ENTRÉES
// =====================================================================
const DIGITS={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Numpad1:0,Numpad2:1,Numpad3:2,Numpad4:3};
const DIGITS2={Digit7:0,Digit8:1,Digit9:2,Digit0:3,Numpad7:0,Numpad8:1,Numpad9:2,Numpad0:3};
function inZone(x,y){ return x>=LANE_L-4&&x<=LANE_R+4&&y>=DEPLOY_MIN_Y-26; }
function inEnemyZone(x,y){ return x>=LANE_L-4&&x<=LANE_R+4&&y<=ENEMY_MAX_Y+26; }
let hintTimer=null;
function setHint(msg,ms){ $('hint').textContent=msg; if(hintTimer) clearTimeout(hintTimer); if(ms) hintTimer=setTimeout(refreshHint,ms); }
function refreshHint(){
  if(!S||S.phase!=='playing'){ $('hint').textContent=''; return; }
  if(S.mode==='multi') $('hint').textContent=isGuest()?(S.eSel>=0?'Touche le haut du terrain pour déployer ton unité.':'Choisis une carte en bas, puis touche le haut du terrain (ta zone).'):(S.sel>=0?'Place ton unité dans ta moitié basse (clic / Espace).':'Choisis une carte (1-4 ou clic), puis clique dans ta moitié basse.');
  else $('hint').textContent=S.sel>=0?'Place ton unité : souris, ou flèches / ZQSD puis Espace. (Échap : annuler)':'Choisis une carte : touches 1 à 4, ou clique dessus.';
}
function noElixir(slot){
  Snd.play('deny');
  const el=$('elx'); el.classList.remove('deny'); void el.offsetWidth; el.classList.add('deny');
  if(slot>=0&&slots[slot]){ const c=slots[slot].el; c.classList.remove('deny'); void c.offsetWidth; c.classList.add('deny'); }
  setHint("Pas assez d'élixir.",1300);
}
function pressCard(i){
  if(!S||S.phase!=='playing') return;
  if(isGuest()){ pressEnemyCard(i); return; }
  if(S.sel===i){ tryDeploy(); return; }
  S.sel=i; Snd.play('click'); refreshHint();
}
function pressEnemyCard(i){
  if(!S||S.phase!=='playing'||S.mode!=='multi'||NET.host) return;
  if(S.eSel===i){ tryDeployEnemy(); return; }
  S.eSel=i; Snd.play('click'); refreshHint();
}
function tryDeployEnemy(){
  if(!S||S.phase!=='playing'||S.mode!=='multi') return;
  if(S.eSel<0) return;
  const c=S.eCursor;
  if(!inEnemyZone(c.x,c.y)){ Snd.play('deny'); return; }
  const d=S.eHand[S.eSel];
  if(S.eElixir<d.cost){ Snd.play('deny'); return; }
  const x=clamp(c.x,LANE_L+14,LANE_R-14), y=clamp(c.y,ENEMY_MIN_Y,ENEMY_MAX_Y);
  if(!NET.host&&NET.connected){ netSend({type:'p2',x,y,slot:S.eSel,kind:'deploy'}); S.eSel=-1; refreshHint(); return; }
  S.eElixir-=d.cost; spawnUnit('enemy',d,x,y);
  const i=S.eSel, played=S.eHand[i]; S.eHand[i]=S.eNext; S.eQueue.push(played); S.eNext=S.eQueue.shift();
  S.eSel=-1; refreshHint();
}
function tryDeploy(){
  if(!S||S.phase!=='playing') return;
  if(isGuest()){ tryDeployEnemy(); return; }
  if(S.sel<0){ setHint('Choisis d\'abord une carte (1 à 4).',1400); return; }
  const c=S.cursor;
  if(!inZone(c.x,c.y)){ Snd.play('deny'); setHint('Déploie dans ta moitié du terrain.',1400); return; }
  const d=S.hand[S.sel];
  if(S.pElixir<d.cost){ noElixir(S.sel); return; }
  const x=clamp(c.x,LANE_L+14,LANE_R-14), y=clamp(c.y,DEPLOY_MIN_Y,DEPLOY_MAX_Y);
  S.pElixir-=d.cost; S.stats.deployed++;
  spawnUnit('player',d,x,y);
  const i=S.sel, played=S.hand[i];
  S.hand[i]=S.next; S.queue.push(played); S.next=S.queue.shift();
  S.sel=-1; setSlot(i,true); refreshHint();
}
function toLogical(e){
  const r=canvas.getBoundingClientRect();
  return { x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H };
}
canvas.addEventListener('pointermove',e=>{ if(!S) return; const p=toLogical(e); if(isGuest()){ S.eCursor.x=p.x; S.eCursor.y=p.y; return; } S.cursor.x=p.x; S.cursor.y=p.y; S.cursor.mode='mouse'; });
canvas.addEventListener('pointerdown',e=>{
  if(!S||S.phase!=='playing') return;
  Snd.init(); Snd.resume();
  if(isGuest()){
    if(e.button===2){ S.eSel=-1; refreshHint(); return; }
    const q=toLogical(e); S.eCursor.x=q.x; S.eCursor.y=q.y;
    if(S.eSel>=0) tryDeployEnemy(); else setHint('Choisis d\'abord une carte en bas.',1400);
    return;
  }
  if(e.button===2){ S.sel=-1; refreshHint(); return; }
  const p=toLogical(e); S.cursor.x=p.x; S.cursor.y=p.y; S.cursor.mode='mouse';
  $('app').focus({preventScroll:true});
  if(S.sel>=0) tryDeploy(); else setHint('Choisis une carte : touches 1 à 4, ou clique dessus.',1400);
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

window.addEventListener('keydown',e=>{
  const k=e.code;
  if(k==='ArrowUp'||k==='ArrowDown'||k==='ArrowLeft'||k==='ArrowRight'||k==='Space'||k==='Enter') e.preventDefault();
  keys[k]=true;
  if(e.repeat) return;
  Snd.init(); Snd.resume();
  if(k==='KeyM'){ toggleSound(); return; }
  if(!S) return;
  if(S.phase==='menu'){ if(k==='Enter'||k==='Space'){ const b=document.querySelector('#overlay .btn:not(.ghost)'); if(b) b.click(); } return; }
  if(S.phase==='over'){ if(k==='Enter'||k==='Space'){ const b=document.querySelector('#overlay .btn:not(.ghost)'); if(b) b.click(); } else if(k==='Escape') toMenu(); return; }
  if(S.phase==='paused'){ if(k==='KeyP'||k==='Escape'||k==='Enter'||k==='Space') resumeGame(); return; }
  if(S.phase==='playing'){
    if(DIGITS[k]!==undefined) pressCard(DIGITS[k]);
    else if(S.mode==='multi' && DIGITS2[k]!==undefined) pressEnemyCard(DIGITS2[k]);
    else if(k==='Space'||k==='Enter') tryDeploy();
    else if(S.mode==='multi' && k==='ShiftRight') tryDeployEnemy();
    else if(k==='Escape'){ if(S.sel>=0){ S.sel=-1; refreshHint(); } else if(S.mode==='multi'&&S.eSel>=0){ S.eSel=-1; refreshHint(); } else pauseGame(); }
    else if(k==='KeyP') pauseGame();
  }
});
window.addEventListener('keyup',e=>{ delete keys[e.code]; });
window.addEventListener('blur',()=>{ for(const k in keys) delete keys[k]; });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S&&S.phase==='playing'&&S.mode!=='multi') pauseGame(); });

function toggleSound(){ Snd.toggle(); $('btnSound').style.opacity=Snd.on?1:.4; if(Snd.on) Snd.play('click'); }
$('btnSound').addEventListener('click',()=>{ Snd.init(); Snd.resume(); toggleSound(); });
$('btnPause').addEventListener('click',()=>{ if(S&&S.phase==='playing') pauseGame(); else if(S&&S.phase==='paused') resumeGame(); });

// =====================================================================
//  ÉCRANS
// =====================================================================
function banner(text,ms){
  const b=$('banner'); b.textContent=text; b.classList.add('show');
  clearTimeout(banner._t); banner._t=setTimeout(()=>b.classList.remove('show'),ms||1500);
}
function heroImgs(ids){ return ids.map(k=>'<img alt="" src="'+PORTRAIT_DATA[k]+'">').join(''); }
function showOverlay(kind){
  const o=$('overlay'); o.classList.remove('hidden'); buildBG();
  if(kind==='start'){
    o.innerHTML=
      '<div class="ov-sub">Karvenia · Assaut sur le front</div>'+
      '<h2 class="ov-title stencil">Broken<br>Front</h2>'+
      '<div class="ov-heroes"><div class="grp">'+heroImgs(['kovac','russo'])+'</div><span class="vs2">VS</span><div class="grp e">'+heroImgs(['ali','zahra'])+'</div></div>'+
      '<div class="row" id="modeBox"><button class="btn ghost '+(gameMode==='story'?'on':'')+'" data-mode="story">Histoire</button><button class="btn ghost '+(gameMode==='multi'?'on':'')+'" data-mode="multi">1 VS 1 en ligne</button><button class="btn ghost" id="btnCards">Cartes</button></div>'+
      '<div id="storySettings" '+(gameMode==='multi'?'style="display:none"':'')+'>'+diffHTML()+'</div>'+
      (gameMode==='multi'?'':'<div class="row"><button class="btn" id="btnCampaign">Campagne 3D<small>FPS</small></button><button class="btn ghost" id="btnGo">Partie rapide</button></div>')+
      '<div class="ov-tip">'+(gameMode==='multi'?'Crée une salle puis partage le QR code. Ton ami scanne et rejoint le duel.':'Campagne 3D : 12 chapitres en FPS · Partie rapide : un duel contre la milice')+'</div>';

    $('modeBox').addEventListener('click',e=>{
      const b=e.target.closest('button[data-mode]'); if(!b)return;
      gameMode=b.dataset.mode; if(gameMode!=='multi') netClose();
      showOverlay('start'); Snd.init(); Snd.play('click');
    });
    bindDiff(); $('btnCards').onclick=()=>showOverlay('cards');
    if(gameMode==='story'){ $('btnCampaign').onclick=()=>{ location.href='histoire3d.html'; }; $('btnGo').onclick=()=>{ CUR=-1; startGame(); }; }
    else {
      const action=document.createElement('div'); action.className='row'; action.id='onlineActionsRow';
      action.innerHTML='<button class="btn" id="createRoom">Créer une salle</button><button class="btn ghost" id="joinRoom">Rejoindre avec un code</button>';
      const ss=$('storySettings')||$('modeBox');
      ss.insertAdjacentElement('afterend',action);
      $('createRoom').onclick=()=>{ Snd.init();Snd.resume();hostOnline(); };
      $('joinRoom').onclick=()=>{ const id=parseRoom(prompt('Code de la salle ou lien reçu (ex. bf-abc123)')); if(id) joinOnline(id); };
      if(networkRoomFromUrl){ const id=networkRoomFromUrl; networkRoomFromUrl=''; joinOnline(id); }
    }
  } else if(kind==='pause'){
    o.innerHTML='<h2 class="ov-title stencil">Pause</h2><p class="ov-text">Le front retient son souffle.</p>'+
      '<div class="row"><button class="btn" id="btnResume">Reprendre<small>P</small></button><button class="btn ghost" id="btnMenu">Menu</button></div>';
    $('btnResume').addEventListener('click',resumeGame); $('btnMenu').addEventListener('click',toMenu);
  } else if(kind==='cards'){
    showCards(o,'all');
  } else if(kind==='chapters'){
    let h='<div class="ov-sub">Karvenia · Campagne</div><h2 class="ov-title stencil" style="font-size:26px">Mode Histoire</h2>';
    for(let a=1;a<=3;a++){
      h+='<div class="act-h">'+ACTS[a]+'</div><div class="chap-grid">';
      CHAPTERS.forEach((c,ix)=>{ if(c.act!==a) return; const lock=ix>storyProg.unlocked, done=ix<storyProg.unlocked;
        h+='<button class="chap'+(lock?' locked':'')+(done?' done':'')+'" data-c="'+ix+'">'+(done?'✓ ':'')+c.id+' · '+c.title+'</button>'; });
      h+='</div>';
    }
    h+=diffHTML()+'<div class="row"><button class="btn" id="btnCont">Continuer<small>Entrée</small></button><button class="btn ghost" id="btnBack">Retour</button></div>';
    o.innerHTML=h;
    bindDiff();
    o.querySelectorAll('.chap').forEach(b=>b.onclick=()=>{ CUR=+b.dataset.c; showOverlay('brief'); });
    $('btnCont').onclick=()=>{ CUR=Math.min(storyProg.unlocked,CHAPTERS.length-1); showOverlay('brief'); };
    $('btnBack').onclick=()=>{ showOverlay('start'); };
  } else if(kind==='brief'){
    const c=CHAPTERS[CUR], fac=chapFaction(c);
    if(c.id==='3.1'&&!storyProg.camp) storyProg.camp='indep';
    let h='<div class="ov-sub">'+ACTS[c.act]+'</div><h2 class="ov-title stencil" style="font-size:26px">'+c.id+' · '+c.title+'</h2><p class="ov-text" style="max-width:300px">'+c.text+'</p>';
    if(c.id==='3.1'){ h+='<div class="camp-row">'+Object.keys(CAMPS).map(k=>'<button data-camp="'+k+'" class="'+(storyProg.camp===k?'on':'')+'">'+CAMPS[k]+'</button>').join('')+'</div>'; }
    else if(c.act===3&&storyProg.camp) h+='<div class="ov-tip">Ton camp : <b>'+CAMPS[storyProg.camp]+'</b></div>';
    const hp=c.fac==='boss'?240:100+CUR*12;
    h+='<div class="ov-tip">Lieu : <b>'+THEMES[c.map].n+'</b><br>Objectif : '+(c.obj==='survive'?'<b>survis jusqu\'à la fin du temps</b> ou détruis : ':'détruis : ')+'<b>'+c.goal+'</b></div>';
    h+='<div class="ov-tip">Ennemi : <b>'+FACTIONS[fac]+'</b> · Niveau '+(CUR+1)+'/12 · Avant-poste '+hp+' PV'+(c.fac==='boss'?' · <b>CHEF ENNEMI</b>':'')+'</div>';
    h+=diffHTML()+'<div class="row"><button class="btn" id="btnLaunch">Lancer le chapitre<small>Entrée</small></button><button class="btn ghost" id="btnBack">Chapitres</button></div>';
    o.innerHTML=h;
    bindDiff();
    o.querySelectorAll('[data-camp]').forEach(b=>b.onclick=()=>{ storyProg.camp=b.dataset.camp; saveProg(); Snd.init(); Snd.play('click'); showOverlay('brief'); });
    $('btnLaunch').onclick=()=>{ saveProg(); startGame(); };
    $('btnBack').onclick=()=>{ showOverlay('chapters'); };
  } else if(kind==='ending'){
    o.innerHTML='<div class="ov-sub">Chapitre 3.4 · Victoire</div><h2 class="ov-title stencil win" style="font-size:26px">Le choix final</h2><p class="ov-text" style="max-width:300px">L\'arme est entre tes mains. Que fait Alex ?</p>'+
      '<div class="row" style="flex-direction:column;width:100%;max-width:260px">'+Object.keys(ENDINGS).map(k=>'<button class="btn ghost" data-end="'+k+'"><b>'+ENDINGS[k].t+'</b></button>').join('')+'</div>';
    o.querySelectorAll('[data-end]').forEach(b=>b.onclick=()=>{ storyProg.ending=b.dataset.end; saveProg(); showOverlay('epilogue'); });
  } else if(kind==='epilogue'){
    const e=ENDINGS[storyProg.ending]||ENDINGS.sacrifice;
    o.innerHTML='<div class="ov-sub">Fin · '+e.t+'</div><h2 class="ov-title stencil" style="font-size:28px">Karvenia</h2><p class="ov-text" style="max-width:300px">'+e.x+'</p><p class="ov-tip">Rejoue la campagne pour découvrir les autres fins.</p><div class="row"><button class="btn" id="btnMenu">Retour au menu</button></div>';
    $('btnMenu').onclick=toMenu;
  } else if(kind==='end'){
    let r=S.result; if(isGuest()&&r!=='draw') r=r==='win'?'lose':'win';
    const st=S.stats, used=Math.round(MATCH_TIME-S.timeLeft), multi=S.mode==='multi', ch=S.chap;
    const title=r==='win'?'Victoire':(r==='lose'?'Défaite':'Égalité');
    let txt;
    if(multi) txt=r==='win'?"L'avant-poste adverse est tombé. Bien joué !":(r==='lose'?"Ton avant-poste est tombé. Une revanche ?":"Aucun camp n'a pris l'avantage.");
    else if(ch) txt=r==='win'?"Chapitre "+ch.id+" terminé. L'histoire d'Alex continue.":(r==='lose'?"La ligne a cédé. Regroupe tes forces et retente le chapitre.":"Aucun camp n'a pris l'avantage : rejoue le chapitre.");
    else txt=r==='win'?"L'avant-poste de la milice est tombé. Karvenia respire, pour l'instant.":(r==='lose'?"La ligne a cédé. Regroupe tes forces et retente l'assaut.":"Aucun camp n'a pris l'avantage. Le front reste figé.");
    let btns;
    if(multi) btns=(isGuest()?'':'<button class="btn" id="btnAgain">Revanche<small>Entrée</small></button>')+'<button class="btn ghost" id="btnMenu">Quitter</button>';
    else if(ch) btns=(r==='win'&&CUR<CHAPTERS.length-1?'<button class="btn" id="btnNext">Chapitre suivant<small>Entrée</small></button>':'<button class="btn" id="btnAgain">'+(r==='win'?'Rejouer':'Réessayer')+'<small>Entrée</small></button>')+'<button class="btn ghost" id="btnMenu">Chapitres</button>';
    else btns='<button class="btn" id="btnAgain">Rejouer<small>Entrée</small></button><button class="btn ghost" id="btnMenu">Menu</button>';
    o.innerHTML='<h2 class="ov-title stencil '+r+'">'+title+'</h2><p class="ov-text">'+txt+'</p>'+
      '<div class="grid4"><div>Durée<b>'+Math.floor(used/60)+':'+String(used%60).padStart(2,'0')+'</b></div><div>Unités déployées<b>'+st.deployed+'</b></div>'+
      '<div>Ennemis détruits<b>'+st.kills+'</b></div><div>Dégâts infligés<b>'+Math.round(st.dmg)+'</b></div></div>'+
      '<div class="row">'+btns+'</div>';
    if($('btnAgain')) $('btnAgain').addEventListener('click',()=>startGame());
    if($('btnNext')) $('btnNext').addEventListener('click',()=>{ CUR++; toChapters(true); showOverlay('brief'); });
    $('btnMenu').addEventListener('click',()=>{ if(ch&&!multi) toChapters(); else toMenu(); });
  }
}
function diffHTML(){ return '<div class="diff" id="diffBox">'+Object.keys(DIFF).map(k=>'<button data-d="'+k+'" class="'+(k===diffKey?'on':'')+'">'+DIFF[k].name+'</button>').join('')+'</div><div class="ov-tip" id="diffInfo">'+DIFF_INFO[diffKey]+'</div>'; }
function bindDiff(){
  const bx=$('diffBox'); if(!bx) return;
  bx.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; diffKey=b.dataset.d; try{localStorage.setItem('bf_diff',diffKey);}catch(_){}
    [].forEach.call(bx.children,x=>x.classList.toggle('on',x===b)); $('diffInfo').textContent=DIFF_INFO[diffKey]; Snd.init(); Snd.play('click'); });
}
function showCards(o,filter){
  const P=CARDS.player.map(c=>c.key), E=CARDS.enemy.map(c=>c.key);
  const list=MULTI_CARDS.filter(c=>filter==='all'||(filter==='p'&&P.indexOf(c.key)>=0)||(filter==='e'&&E.indexOf(c.key)>=0)||(filter==='d'&&P.indexOf(c.key)<0&&E.indexOf(c.key)<0));
  o.innerHTML='<div class="ov-sub">Collection</div><h2 class="ov-title stencil" style="font-size:24px">Cartes ('+MULTI_CARDS.length+')</h2>'+
    '<div class="camp-row">'+[['all','Toutes'],['p','Armée'],['e','Ennemis'],['d','Duel']].map(f=>'<button data-f="'+f[0]+'" class="'+(f[0]===filter?'on':'')+'">'+f[1]+'</button>').join('')+'</div>'+
    '<div class="cgrid">'+list.map(c=>'<div class="cg r-'+c.rar+'" data-k="'+c.key+'"><b class="cgc">'+c.cost+'</b><canvas width="144" height="144"></canvas><span>'+c.name+'</span></div>').join('')+'</div>'+
    '<div id="cdet" class="ov-tip">Touche une carte pour voir sa fiche.</div><div class="row"><button class="btn ghost" id="btnBack">Retour</button></div>';
  o.querySelectorAll('.cg').forEach((el,i)=>{ const d=list[i], team=P.indexOf(d.key)>=0||E.indexOf(d.key)<0?'player':'enemy'; drawCardArt(el.querySelector('canvas'),d,team,.4,i*.3);
    el.onclick=()=>{ $('cdet').innerHTML='<b>'+d.name+'</b> · '+RARITY[d.rar]+' · '+d.role+'<br>Coût '+d.cost+' · PV '+d.hp+' · Dégâts '+d.dmg+' · Portée '+d.range+' · Vitesse '+d.speed+'<br>'+d.desc; Snd.init(); Snd.play('click'); }; });
  o.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>showCards(o,b.dataset.f));
  $('btnBack').onclick=()=>showOverlay('start');
}
function hideOverlay(){ $('overlay').classList.add('hidden'); }

function startGame(fromNetwork){
  fromNetwork = !!fromNetwork;
  if(S && S.mode==='multi' && !NET.host && !fromNetwork) return;
  Snd.init(); Snd.resume();

  if(fromNetwork && S && S.mode==='multi'){
    S.phase='playing'; S.t=0; S.timeLeft=MATCH_TIME; S.double=false;
    S.pElixir=5; S.eElixir=5;
    S.units=[]; S.projs=[]; S.parts=[]; S.decals=[];
    S.sel=-1; S.eSel=-1;
    S.pTower.hp=S.pTower.max; S.eTower.hp=S.eTower.max;
    S.result=null; S.endT=0; S.bigBoom=null; S.endBooms=0;
    S.stats={deployed:0,kills:0,dmg:0};
    S.cursor={x:W/2,y:DEPLOY_MIN_Y+56,mode:'mouse'};
    S.eCursor={x:W/2,y:ENEMY_MAX_Y-56,mode:'kb'};
  } else {
    newGame();
    S.phase='playing';
    if(S.mode==='multi'&&NET.host&&NET.connected){
      netSend({type:'init',pHand:cardKeys(S.hand),pNext:S.next.key,eHand:cardKeys(S.eHand),eNext:S.eNext.key});
      netSend({type:'start'});
    }
  }

  buildBG(); hideOverlay(); closeQrModal(); buildHand(); buildEnemyHand(); refreshHint();
  $('app').focus({preventScroll:true});
  banner(S.chap?('Chapitre '+S.chap.id+' · '+S.chap.title):'Assaut !',1600);
}
function toChapters(keep){ if(!keep) CUR=-1; const c=CUR; CUR=-1; newGame(); CUR=keep?c:-1; S.phase='menu'; buildHand(); buildEnemyHand(); if(!keep) showOverlay('chapters'); refreshHint(); }
function toMenu(){ if(gameMode==='multi') netClose(); CUR=-1; newGame(); S.phase='menu'; buildHand(); buildEnemyHand(); showOverlay('start'); refreshHint(); }
function pauseGame(){ if(!S||S.phase!=='playing'||S.mode==='multi') return; S.phase='paused'; showOverlay('pause'); }
function resumeGame(){ if(!S||S.phase!=='paused') return; S.phase='playing'; hideOverlay(); $('app').focus({preventScroll:true}); refreshHint(); }
function addWin(){ try{ const n=(parseInt(localStorage.getItem('bf_karvenia_wins')||'0',10)||0)+1; localStorage.setItem('bf_karvenia_wins',String(n)); }catch(e){} }

// =====================================================================
//  DESSIN : helpers
// =====================================================================
function circ(c,x,y,r){ c.beginPath(); c.arc(x,y,r,0,TAU); }
function ell(c,x,y,rx,ry){ c.beginPath(); c.ellipse(x,y,rx,ry,0,0,TAU); }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function glow(c,x,y,a,s){
  c.save(); c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(x,y,0,x,y,s); g.addColorStop(0,'rgba(255,240,180,'+a+')'); g.addColorStop(1,'rgba(255,140,40,0)');
  c.fillStyle=g; c.fillRect(x-s,y-s,s*2,s*2); c.restore();
}

// =====================================================================
//  DESSIN : sprites
// =====================================================================
function drawSprite(c,d,team,o){
  const tc=team==='player'?C.player:C.enemy, td=team==='player'?C.playerD:C.enemyD;
  c.save(); c.translate(o.x,o.y);
  if(o.scale&&o.scale!==1) c.scale(o.scale,o.scale);
  if(o.alpha!==undefined&&o.alpha<1) c.globalAlpha*=o.alpha;
  if(d.body==='tank') sTank(c,d,tc,td,team,o);
  else if(d.body==='hero') sHero(c,d,team,tc,td,o);
  else sInfantry(c,d,tc,td,o,d.body==='sniper');
  c.restore();
}
function sInfantry(c,d,tc,td,o,sn){
  const a=o.aim, ph=o.phase, t=o.t;
  const bob=o.moving?Math.abs(Math.sin(ph))*1.5:Math.sin(t*2.2+ph)*.4;
  const sw=o.moving?Math.sin(ph)*3.6:0;
  c.fillStyle='#17170f'; ell(c,-3.8,6+sw,2.8,2); c.fill(); ell(c,3.8,6-sw,2.8,2); c.fill();
  c.translate(0,-bob);
  c.fillStyle=td; rr(c,-Math.cos(a)*5.5-3.5,-Math.sin(a)*5.5-3.5,7,7,2); c.fill();
  c.fillStyle=tc; ell(c,0,1,8.6,6.6); c.fill(); c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1; c.stroke();
  c.fillStyle=sn?'#454c34':td; circ(c,0,-.5,5.2); c.fill(); c.stroke();
  c.fillStyle='rgba(255,255,255,.2)'; circ(c,-1.5,-2,1.9); c.fill();
  if(sn){ c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=1; ell(c,0,-.5,5.2,5.2); c.beginPath(); c.arc(0,-.5,3.4,.2,Math.PI-.2); c.stroke(); }
  c.save(); c.rotate(a);
  const rec=-o.atk*2.6, len=sn?23:13;
  c.fillStyle='#14140e'; c.fillRect(3+rec,-1.2,len,2.4);
  if(sn){ c.fillStyle='#2b2b22'; c.fillRect(10+rec,-3.1,7,1.9); c.fillStyle='#7fd0ff'; c.fillRect(16.4+rec,-3.1,1.2,1.9); c.fillStyle='#14140e'; c.fillRect(24+rec,-2.4,1.6,4.8); }
  else { c.fillStyle='#2b2b22'; c.fillRect(6+rec,1.2,4,2); }
  if(o.atk>.6) glow(c,3+len+rec+2,0,o.atk,sn?12:8);
  c.restore();
}
function sTank(c,d,tc,td,team,o){
  const base=team==='player'?-Math.PI/2:Math.PI/2, two=d.barrels===2;
  c.rotate(base); if(two) c.scale(1.1,1.1);
  c.fillStyle='#17170f'; rr(c,-15,-12.5,30,7,2); c.fill(); rr(c,-15,5.5,30,7,2); c.fill();
  c.strokeStyle='#3d3d32'; c.lineWidth=1; const off=(o.phase*1.6)%4;
  c.beginPath(); for(let x=-15+off;x<15;x+=4){ c.moveTo(x,-12.5); c.lineTo(x,-5.5); c.moveTo(x,5.5); c.lineTo(x,12.5); } c.stroke();
  c.fillStyle=tc; rr(c,-13,-8.5,26,17,4); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1.2; c.stroke();
  c.fillStyle='rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(6,-8.5); c.lineTo(13,-6); c.lineTo(13,6); c.lineTo(6,8.5); c.closePath(); c.fill();
  c.strokeStyle='rgba(0,0,0,.35)'; c.beginPath(); for(let k=0;k<4;k++){ c.moveTo(-11+k*2.6,-5); c.lineTo(-11+k*2.6,5); } c.stroke();
  c.save(); c.rotate(o.aim-base);
  const rec=o.atk*4.5;
  c.fillStyle='#14140e';
  if(two){ c.fillRect(2-rec,-4.6,19,2.4); c.fillRect(2-rec,2.2,19,2.4); c.fillStyle='#2b2b22'; c.fillRect(17-rec,-5,2.5,3.2); c.fillRect(17-rec,1.8,2.5,3.2); }
  else { c.fillRect(2-rec,-1.7,19,3.4); c.fillStyle='#2b2b22'; c.fillRect(17-rec,-2.2,2.6,4.4); }
  c.fillStyle=td; circ(c,0,0,7.6); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1; c.stroke();
  c.fillStyle='rgba(255,255,255,.16)'; circ(c,-1.7,-1.9,3.2); c.fill();
  c.fillStyle='rgba(0,0,0,.4)'; circ(c,-1.6,1.7,2); c.fill();
  if(o.atk>.6){ glow(c,22-rec,two?-3.4:0,o.atk,14); if(two) glow(c,22-rec,3.4,o.atk,14); }
  c.restore();
}
function sHero(c,d,team,tc,td,o){
  const t=o.t, ph=o.phase, pulse=(Math.sin(t*3.2+ph)+1)/2, tca=TCA[team];
  const lunge=o.atk*(d.fx==='slam'?3.2:2);
  const g=c.createRadialGradient(0,0,6,0,0,27); g.addColorStop(0,'rgba('+tca+',0)'); g.addColorStop(.62,'rgba('+tca+','+(.24+.14*pulse)+')'); g.addColorStop(1,'rgba('+tca+',0)');
  c.fillStyle=g; circ(c,0,0,27); c.fill();
  c.save(); c.rotate(t*.9); c.setLineDash([5,4]); c.strokeStyle='rgba('+tca+',.8)'; c.lineWidth=1.6; circ(c,0,0,19.5+pulse*1.6); c.stroke(); c.restore();
  const bobY=o.moving?-Math.abs(Math.sin(ph))*1.3:Math.sin(t*2+ph)*.5;
  c.save(); c.translate(Math.cos(o.aim)*lunge,Math.sin(o.aim)*lunge+bobY);
  c.fillStyle='rgba(10,10,8,.7)'; circ(c,0,0,15.6); c.fill();
  c.save(); circ(c,0,0,13); c.clip();
  if(d.portrait&&portraitOK(d.portrait)){ const z=1.05+.025*Math.sin(t*1.4+ph); c.drawImage(portraitImgs[d.portrait],-13*z,-13*z,26*z,26*z); }
  else { c.fillStyle=td; c.fillRect(-13,-13,26,26); c.fillStyle='#fff'; c.font='700 14px Oswald,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(d.name.charAt(0),0,1); }
  c.restore();
  c.lineWidth=2.6; c.strokeStyle=tc; circ(c,0,0,13.3); c.stroke();
  c.lineWidth=.9; c.strokeStyle=d.rar==='heroique'?'#e0b04a':'rgba(255,255,255,.35)'; circ(c,0,0,15.5); c.stroke();
  c.save(); c.rotate(o.aim);
  const rec=-o.atk*3;
  c.fillStyle='#0e0e0a';
  if(d.fx==='bullet'){ c.fillRect(13+rec,-1.2,8,2.4); if(o.atk>.6) glow(c,24+rec,0,o.atk,9); }
  else if(d.fx==='grenade'){ c.fillStyle='#4d5a36'; circ(c,17+rec,0,3.4); c.fill(); c.fillStyle='#1e2415'; c.fillRect(15.6+rec,-1,1.6,2); if(o.atk>.6) glow(c,20+rec,0,o.atk*.7,8); }
  else if(d.fx==='fire'){ c.fillRect(13,-2,7,4); c.fillStyle='#742a1c'; c.fillRect(12,-3.4,3,6.8); if(o.atk>.4){ glow(c,22,0,o.atk,13); } else { glow(c,21.5,0,.55+.25*Math.sin(t*14),4.5); } }
  else { c.fillStyle='#e0b04a'; c.fillRect(13+rec,-3,6,6); c.fillStyle='#8a6a1e'; c.fillRect(19+rec,-1.4,3,2.8); }
  c.restore();
  c.restore();
  if(d.rar==='heroique'){ c.fillStyle='#e0b04a'; for(let i=-1;i<=1;i++){ c.save(); c.translate(i*7,19); c.rotate(t*.6+i); c.beginPath(); for(let k=0;k<5;k++){ const A=k*TAU/5-Math.PI/2; c.lineTo(Math.cos(A)*2.6,Math.sin(A)*2.6); const B=A+Math.PI/5; c.lineTo(Math.cos(B)*1.1,Math.sin(B)*1.1);} c.closePath(); c.fill(); c.restore(); } }
}

// =====================================================================
//  DESSIN : cartes
// =====================================================================
function drawCardArt(cv,d,team,t,seed){
  if(!cv) return;
  const c=cv.getContext('2d'), k=cv.width/72;
  c.setTransform(k,0,0,k,0,0); c.clearRect(0,0,72,72);
  const g=c.createLinearGradient(0,0,0,72); g.addColorStop(0,'#1a1b14'); g.addColorStop(1,'#2b2c21'); c.fillStyle=g; c.fillRect(0,0,72,72);
  c.strokeStyle='rgba(230,220,190,.07)'; c.lineWidth=1.4;
  const sp=(t*(14+d.speed*10))%16; c.beginPath(); for(let y=-16+sp;y<72;y+=16){ c.moveTo(0,y); c.lineTo(72,y); } c.stroke();
  c.strokeStyle='rgba(217,154,61,.16)'; c.setLineDash([5,5]); c.lineDashOffset=-sp; c.beginPath(); c.moveTo(36,0); c.lineTo(36,72); c.stroke(); c.setLineDash([]);
  const gg=c.createRadialGradient(36,52,2,36,52,34); gg.addColorStop(0,'rgba('+TCA[team]+',.42)'); gg.addColorStop(1,'rgba('+TCA[team]+',0)'); c.fillStyle=gg; c.fillRect(0,0,72,72);
  const sc=d.body==='hero'?1.5:(d.body==='tank'?1.62:2.05), tt=t+seed;
  const per=d.interval*1.7+.7, ph=(tt%per)/per, atk=ph<.18?1-ph/.18:0;
  const L=d.body==='tank'?21:(d.body==='sniper'?25:(d.body==='hero'?19:15));
  const y0=47, my=y0-L*sc;
  c.save(); ell(c,36,y0+8*sc*.8,9*sc,4.2*sc); c.fillStyle='rgba(0,0,0,.35)'; c.fill(); c.restore();
  drawSprite(c,d,team,{x:36,y:y0,scale:sc,aim:-Math.PI/2,phase:tt*(2+d.speed*3.2),atk:atk,moving:true,t:tt,flash:0});
  previewFx(c,d,ph,my);
  const vg=c.createRadialGradient(36,36,26,36,36,52); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)'); c.fillStyle=vg; c.fillRect(0,0,72,72);
}
function previewFx(c,d,ph,my){
  c.save(); c.globalCompositeOperation='lighter'; c.lineCap='round';
  const fx=d.fx;
  if(fx==='bullet'&&ph<.28){ const p=ph/.28, y=my-p*(my-4); c.strokeStyle='rgba(255,224,138,.95)'; c.lineWidth=1.6; c.beginPath(); c.moveTo(36,y+7); c.lineTo(36,y); c.stroke(); }
  else if(fx==='sniper'){
    if(ph>.45&&ph<.95){ c.strokeStyle='rgba(255,70,50,'+(.15+.35*(ph-.45)/.5)+')'; c.lineWidth=.8; c.beginPath(); c.moveTo(36,my); c.lineTo(36,0); c.stroke(); }
    if(ph<.14){ c.strokeStyle='rgba(255,246,208,'+(1-ph/.14)+')'; c.lineWidth=2.2; c.beginPath(); c.moveTo(36,my); c.lineTo(36,0); c.stroke(); }
  }
  else if(fx==='shell'){
    if(ph<.3){ const p=ph/.3, y=my-p*(my-8); c.fillStyle='#fff3c8'; circ(c,36,y,2); c.fill(); c.fillStyle='rgba(180,170,150,.5)'; circ(c,36,y+5,2.2); c.fill(); }
    else if(ph<.5){ const p=(ph-.3)/.2; c.fillStyle='rgba(255,150,60,'+(.9-p*.9)+')'; circ(c,36,8,3+p*10); c.fill(); }
  }
  else if(fx==='grenade'){
    if(ph<.42){ const p=ph/.42, y=my-p*(my-9), x=36+Math.sin(p*Math.PI)*-8; c.fillStyle='#a9bd7a'; circ(c,x,y-Math.sin(p*Math.PI)*8,2); c.fill(); }
    else if(ph<.62){ const p=(ph-.42)/.2; c.fillStyle='rgba(255,150,60,'+(.9-p*.9)+')'; circ(c,36,9,3+p*9); c.fill(); }
  }
  else if(fx==='fire'&&ph<.42){
    const p=ph/.42;
    for(let i=0;i<7;i++){ const q=clamp(p*1.15-i*.08,0,1), y=my-q*(my-8), x=36+Math.sin(i*2.3+ph*30)*3*q; c.fillStyle=i%2?'rgba(255,122,42,'+(1-q)+')':'rgba(255,194,72,'+(1-q)+')'; circ(c,x,y,1.4+q*2.6); c.fill(); }
  }
  else if(fx==='slam'&&ph<.4){ const p=ph/.4; c.strokeStyle='rgba(240,200,110,'+(1-p)+')'; c.lineWidth=2.4; circ(c,36,47,6+p*28); c.stroke(); }
  c.restore();
}

// =====================================================================
//  DESSIN : décor
// =====================================================================
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function sideDecor(c,th,rnd){
  for(const side of [0,1]){
    const x0=side?W-LANE_L-8:0, w=LANE_L+8;
    c.fillStyle='rgba(0,0,0,.28)'; c.fillRect(x0,0,w,H);
    if(th.side==='rock'){
      for(let y=-10;y<H;y+=rnd()*30+16){ const rx=rnd()*10+9, ry=rnd()*14+10, cx=side?x0+rnd()*10:x0+w-rnd()*10;
        c.fillStyle=th.sc; ell(c,cx,y,rx,ry); c.fill(); c.fillStyle='rgba(0,0,0,.35)'; ell(c,cx+2,y+3,rx*.8,ry*.7); c.fill(); c.fillStyle='rgba(255,255,230,.07)'; ell(c,cx-3,y-4,rx*.5,ry*.4); c.fill(); }
      for(let i=0;i<14;i++){ c.fillStyle='rgba(110,150,60,'+(rnd()*.4+.2)+')'; c.fillRect(x0+rnd()*w,rnd()*H,rnd()*4+2,rnd()*3+1); }
    } else if(th.side==='wall'){
      c.fillStyle=th.sc; c.fillRect(x0,0,w,H);
      c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1;
      for(let y=0;y<H;y+=34){ c.beginPath(); c.moveTo(x0,y); c.lineTo(x0+w,y); c.stroke(); }
      c.strokeStyle='rgba(180,190,200,.16)'; c.lineWidth=3; const px=side?x0+6:x0+w-6; c.beginPath(); c.moveTo(px,0); c.lineTo(px,H); c.stroke();
      for(let y=20;y<H;y+=rnd()*70+50){ c.fillStyle=th.speck||'rgba(255,200,120,.2)'; circ(c,side?x0+w-7:x0+7,y,3); c.fill(); }
      for(let i=0;i<10;i++){ c.strokeStyle='rgba(0,0,0,.5)'; c.beginPath(); let x=x0+rnd()*w,y=rnd()*H; c.moveTo(x,y); c.lineTo(x+rnd()*8-4,y+rnd()*16); c.stroke(); }
    } else {
      for(let y=4;y<H;y+=9){ for(let k=0;k<3;k++){ const bx=side?x0+k*11+(y%18?0:5):x0+w-(k+1)*11-(y%18?0:5); c.fillStyle=(k+y)%2?th.sc:'#6a5736'; rr(c,bx,y,12,8,3); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=.7; c.stroke(); } }
      for(let y=30;y<H-30;y+=rnd()*80+60){ c.strokeStyle='#2a2014'; c.lineWidth=2; const x=side?x0+w-2:x0+2; c.beginPath(); c.moveTo(x,y); c.lineTo(x+(side?-10:10),y-12); c.stroke(); }
    }
  }
}
function buildBG(){
  const cw=canvas.width, ch=canvas.height; if(!cw||!ch) return;
  const th=THEMES[curMap()]||THEMES.ruines;
  bg=document.createElement('canvas'); bg.width=cw; bg.height=ch;
  const c=bg.getContext('2d'); c.setTransform(cw/W,0,0,ch/H,0,0);
  const rnd=mulberry(1337);
  let g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,th.bg[0]); g.addColorStop(.5,th.bg[1]); g.addColorStop(1,th.bg[2]); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let i=0;i<2600;i++){ const x=rnd()*W,y=rnd()*H,s=rnd()*1.6+.4; c.fillStyle=rnd()<.5?'rgba(255,240,200,'+(rnd()*.05)+')':'rgba(0,0,0,'+(rnd()*.13)+')'; c.fillRect(x,y,s,s); }
  if(th.side==='city'){
  for(const side of [0,1]){
    const x0=side?W-LANE_L-8:0, w=LANE_L+8;
    c.fillStyle='rgba(0,0,0,.28)'; c.fillRect(x0,0,w,H);
    for(let y=8;y<H-30;y+=rnd()*46+34){
      const bw=rnd()*10+12, bh=rnd()*24+18, bx=side?x0+rnd()*4:x0+w-bw-rnd()*4;
      c.fillStyle=th.sc; c.fillRect(bx,y,bw,bh); c.strokeStyle='rgba(255,240,200,.08)'; c.strokeRect(bx,y,bw,bh);
      c.fillStyle='rgba(0,0,0,.4)'; for(let wy=y+4;wy<y+bh-4;wy+=7) for(let wx=bx+3;wx<bx+bw-4;wx+=6) if(rnd()<.6) c.fillRect(wx,wy,3,3);
      if(rnd()<.4){ c.fillStyle='rgba(20,15,10,.6)'; c.beginPath(); c.moveTo(bx,y); c.lineTo(bx+bw*.6,y); c.lineTo(bx+bw*.3,y+6); c.closePath(); c.fill(); }
    }
    for(let i=0;i<40;i++){ c.fillStyle='rgba(90,84,68,'+(rnd()*.4+.1)+')'; c.fillRect(x0+rnd()*w,rnd()*H,rnd()*3+1,rnd()*3+1); }
  }
  } else sideDecor(c,th,rnd);
  const rx=LANE_L+8, rw=W-2*rx;
  g=c.createLinearGradient(rx,0,rx+rw,0); g.addColorStop(0,th.road[0]); g.addColorStop(.5,th.road[1]); g.addColorStop(1,th.road[0]); c.fillStyle=g; c.fillRect(rx,0,rw,H);
  for(let i=0;i<1400;i++){ c.fillStyle='rgba(0,0,0,'+(rnd()*.12)+')'; c.fillRect(rx+rnd()*rw,rnd()*H,rnd()*2+.5,rnd()*2+.5); }
  if(th.speck){ for(let i=0;i<240;i++){ c.fillStyle=th.speck; c.fillRect(rx+rnd()*rw,rnd()*H,rnd()*5+1,rnd()*3+1); } }
  c.strokeStyle='rgba(230,220,180,.22)'; c.lineWidth=1.4; c.setLineDash([12,10]);
  c.beginPath(); c.moveTo(rx+7,0); c.lineTo(rx+7,H); c.moveTo(rx+rw-7,0); c.lineTo(rx+rw-7,H); c.stroke();
  c.strokeStyle='rgba(217,154,61,.16)'; c.lineWidth=1.6; c.beginPath(); c.moveTo(W/2,0); c.lineTo(W/2,H); c.stroke(); c.setLineDash([]);
  c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=.8;
  for(let i=0;i<16;i++){ let x=rx+rnd()*rw,y=rnd()*H; c.beginPath(); c.moveTo(x,y); for(let k=0;k<6;k++){ x+=rnd()*14-7; y+=rnd()*12-2; c.lineTo(x,y); } c.stroke(); }
  for(let i=0;i<9;i++){ c.fillStyle='rgba(0,0,0,'+(rnd()*.16+.05)+')'; ell(c,rx+rnd()*rw,rnd()*H,rnd()*16+8,rnd()*7+4); c.fill(); }
  for(let i=0;i<8;i++){
    const x=rx+20+rnd()*(rw-40), y=110+rnd()*(H-220), r=rnd()*9+7;
    if(Math.abs(y-H/2)<26) continue;
    const cg=c.createRadialGradient(x,y,1,x,y,r); cg.addColorStop(0,'rgba(0,0,0,.6)'); cg.addColorStop(.75,'rgba(0,0,0,.28)'); cg.addColorStop(1,'rgba(255,240,200,.09)');
    c.fillStyle=cg; ell(c,x,y,r,r*.68); c.fill();
  }
  for(let y=96;y<H-96;y+=13){
    if(rnd()<.32) continue;
    for(const x of [rx-2,rx+rw+2]){ c.fillStyle='#7a6b48'; ell(c,x,y,6,3.6); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=.8; c.stroke(); c.fillStyle='rgba(255,240,200,.12)'; ell(c,x-1,y-1,3.5,1.6); c.fill(); }
  }
  const my=H/2;
  c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(rx,my-6,rw,12);
  c.strokeStyle='rgba(217,154,61,.5)'; c.lineWidth=2; c.setLineDash([9,9]); c.beginPath(); c.moveTo(0,my); c.lineTo(W,my); c.stroke(); c.setLineDash([]);
  for(let x=rx+14;x<rx+rw-8;x+=34){
    if(Math.abs(x-W/2)<24) continue;
    c.strokeStyle='#15150f'; c.lineWidth=3.4; c.beginPath(); c.moveTo(x-7,my-7); c.lineTo(x+7,my+7); c.moveTo(x+7,my-7); c.lineTo(x-7,my+7); c.moveTo(x,my-8); c.lineTo(x,my+8); c.stroke();
    c.strokeStyle='#4b4a3c'; c.lineWidth=1.4; c.beginPath(); c.moveTo(x-7,my-7); c.lineTo(x+7,my+7); c.moveTo(x+7,my-7); c.lineTo(x-7,my+7); c.moveTo(x,my-8); c.lineTo(x,my+8); c.stroke();
  }
  for(const v of [{x:LANE_L+22,y:H*.36,a:.4},{x:W-LANE_L-24,y:H*.66,a:-.3}]){
    c.save(); c.translate(v.x,v.y); c.rotate(v.a); c.fillStyle='rgba(20,15,10,.6)'; rr(c,-13,-7,26,14,3); c.fill(); c.fillStyle='#5c3a26'; rr(c,-11,-5,22,10,2); c.fill(); c.fillStyle='rgba(0,0,0,.5)'; circ(c,3,0,4); c.fill(); c.restore();
  }
  for(const y of [50,H-50]){
    const pg=c.createRadialGradient(W/2,y,10,W/2,y,68); pg.addColorStop(0,'rgba(90,88,74,.55)'); pg.addColorStop(1,'rgba(90,88,74,0)'); c.fillStyle=pg; c.fillRect(W/2-70,y-70,140,140);
  }
  c.fillStyle='rgba(168,64,44,.08)'; c.fillRect(0,0,W,H/2); c.fillStyle='rgba(77,109,140,.10)'; c.fillRect(0,H/2,W,H/2);
  const vg=c.createRadialGradient(W/2,H/2,H*.28,W/2,H/2,H*.7); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)'); c.fillStyle=vg; c.fillRect(0,0,W,H);
}

// =====================================================================
//  DESSIN : scène
// =====================================================================
function drawTower(T){
  const c=ctx, tc=T.team==='player'?C.player:C.enemy, td=T.team==='player'?C.playerD:C.enemyD;
  c.save(); c.translate(T.x,T.y);
  c.fillStyle='rgba(0,0,0,.4)'; ell(c,4,10,36,22); c.fill();
  c.fillStyle='#7a6b48'; for(let i=0;i<14;i++){ const A=i/14*TAU; ell(c,Math.cos(A)*35,Math.sin(A)*24,7,4.4); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=.8; c.stroke(); }
  c.fillStyle=T.flash>0?'#ffffff':'#4a4a3f'; rr(c,-28,-22,56,44,7); c.fill(); c.strokeStyle='#15150f'; c.lineWidth=2; c.stroke();
  c.fillStyle=tc; c.fillRect(-28,-14,5,28); c.fillRect(23,-14,5,28);
  c.fillStyle=T.flash>0?'#ffffff':'#5e5e4f'; rr(c,-20,-15,40,30,5); c.fill(); c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=1; c.stroke();
  c.strokeStyle='rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(-20,-5); c.lineTo(20,-5); c.moveTo(-20,5); c.lineTo(20,5); c.stroke();
  c.save(); c.rotate(T.aim);
  const rec=T.recoil*5; c.fillStyle='#14140e'; c.fillRect(3-rec,-2.6,23,5.2); c.fillStyle='#2b2b22'; c.fillRect(20-rec,-3.4,5,6.8);
  c.fillStyle=td; circ(c,0,0,9); c.fill(); c.strokeStyle='#15150f'; c.lineWidth=1.4; c.stroke();
  c.fillStyle='rgba(255,255,255,.16)'; circ(c,-2,-2.4,3.6); c.fill();
  c.restore();
  const wave=Math.sin(NOW*3+(T.team==='player'?0:1.7));
  c.strokeStyle='#15150f'; c.lineWidth=1.6; c.beginPath(); c.moveTo(-24,-22); c.lineTo(-24,-36); c.stroke();
  c.fillStyle=tc; c.beginPath(); c.moveTo(-24,-36); c.lineTo(-13+wave*2,-33.5+wave); c.lineTo(-24,-30); c.closePath(); c.fill();
  c.restore();
  const bw=58, bh=6, bx=T.x-bw/2, by=T.team==='player'?T.y-46:T.y+34;
  c.fillStyle='rgba(0,0,0,.6)'; rr(c,bx-1,by-1,bw+2,bh+2,4); c.fill();
  const pct=Math.max(0,T.hp/T.max); c.fillStyle=tc; if(pct>0){ rr(c,bx,by,bw*pct,bh,3); c.fill(); }
  c.fillStyle='#eee7d6'; c.font='700 8px Oswald,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(Math.ceil(T.hp),T.x,by+bh/2+.5);
}
function drawUnit(u){
  const c=ctx, d=u.d, sp=u.spawn<1?Math.min(1,u.spawn*1.6):1;
  const drop=u.spawn<1?Math.pow(1-sp,2)*54:0;
  c.fillStyle='rgba(0,0,0,'+(.34*sp)+')'; ell(c,u.x+2,u.y+u.r*.55,u.r*(1.25-.25*sp),u.r*.58*(1.2-.2*sp)); c.fill();
  c.strokeStyle='rgba('+TCA[u.team]+','+(.55*sp)+')'; c.lineWidth=1.6; ell(c,u.x,u.y+u.r*.5,u.r*1.15,u.r*.6); c.stroke();
  if(u.spawn<1){ c.strokeStyle='rgba('+TCA[u.team]+',.25)'; c.lineWidth=1; c.beginPath(); c.moveTo(u.x,u.y-drop); c.lineTo(u.x,u.y-drop-60); c.stroke(); }
  const lunge=(d.body==='infantry')?u.atk*2:0;
  drawSprite(c,d,u.team,{x:u.x+Math.cos(u.aim)*lunge,y:u.y-drop+Math.sin(u.aim)*lunge,aim:u.aim,phase:u.phase,atk:u.atk,moving:u.moving,t:NOW,alpha:Math.min(1,u.spawn*3)});
  if(u.flash>0){ c.save(); c.globalCompositeOperation='lighter'; c.fillStyle='rgba(255,255,255,'+Math.min(.7,u.flash*6)+')'; circ(c,u.x,u.y-drop,u.r*.95); c.fill(); c.restore(); }
  if(u.spawn>=1){
    const bw=d.body==='hero'||d.body==='tank'?28:22, bx=u.x-bw/2, by=u.y-u.r-11-(d.body==='hero'?6:0), pct=Math.max(0,u.hp/u.max);
    c.fillStyle='rgba(0,0,0,.65)'; rr(c,bx-1,by-1,bw+2,5.5,2.5); c.fill();
    c.fillStyle=u.team==='player'?'#6fa3d1':'#e0664d'; if(pct>0){ rr(c,bx,by,bw*pct,3.5,1.8); c.fill(); }
  }
}
function drawProj(p){
  const c=ctx, col=p.team==='player'?'255,224,138':'255,176,112';
  c.save(); c.globalCompositeOperation='lighter'; c.lineCap='round';
  switch(p.fx){
    case 'bullet': case 'tower': { const L=p.fx==='tower'?16:13; c.strokeStyle='rgba('+col+',.95)'; c.lineWidth=p.fx==='tower'?2.6:2; c.beginPath(); c.moveTo(p.x-p.ux*L,p.y-p.uy*L); c.lineTo(p.x,p.y); c.stroke(); c.fillStyle='rgba(255,255,240,.9)'; circ(c,p.x,p.y,1.5); c.fill(); break; }
    case 'sniper': c.strokeStyle='rgba(255,246,208,.3)'; c.lineWidth=5; c.beginPath(); c.moveTo(p.x-p.ux*54,p.y-p.uy*54); c.lineTo(p.x,p.y); c.stroke(); c.strokeStyle='rgba(255,250,225,.95)'; c.lineWidth=2.2; c.beginPath(); c.moveTo(p.x-p.ux*46,p.y-p.uy*46); c.lineTo(p.x,p.y); c.stroke(); break;
    case 'shell': c.fillStyle='rgba(255,240,200,.95)'; circ(c,p.x,p.y,3.4); c.fill(); c.fillStyle='rgba(255,150,60,.5)'; circ(c,p.x-p.ux*4,p.y-p.uy*4,3); c.fill(); break;
    case 'grenade': { const prog=clamp(1-Math.hypot(p.tx-p.x,p.ty-p.y)/p.total,0,1), z=Math.sin(prog*Math.PI)*p.arc; c.globalCompositeOperation='source-over'; c.fillStyle='rgba(0,0,0,.3)'; ell(c,p.x,p.y,3,1.6); c.fill(); c.fillStyle='#59683f'; circ(c,p.x,p.y-z,3.6); c.fill(); c.strokeStyle='#c9d6a0'; c.lineWidth=1; c.beginPath(); c.arc(p.x,p.y-z,3.6,p.rot,p.rot+1.6); c.stroke(); break; }
    case 'fire': c.fillStyle='rgba(255,140,50,.5)'; circ(c,p.x,p.y,6); c.fill(); c.fillStyle='rgba(255,220,120,.9)'; circ(c,p.x,p.y,2.6); c.fill(); break;
    case 'slam': c.strokeStyle='rgba(255,224,138,.9)'; c.lineWidth=3; c.beginPath(); c.arc(p.x,p.y,6,p.rot,p.rot+TAU*.75); c.stroke(); c.fillStyle='rgba(255,210,110,.35)'; circ(c,p.x,p.y,7); c.fill(); break;
  }
  c.restore();
}
function drawParts(){
  const c=ctx;
  for(const p of S.parts){
    const k=p.life/p.max, a=Math.max(0,p.a0*(1-k));
    c.globalAlpha=a; c.globalCompositeOperation=p.add?'lighter':'source-over';
    if(p.type==='ring'){ c.strokeStyle=p.color; c.lineWidth=p.lw*(1-k)+.4; circ(c,p.x,p.y,lerp(p.size,p.size2,k)); c.stroke(); }
    else if(p.type==='spark'){ c.strokeStyle=p.color; c.lineWidth=1.3; c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(p.x-p.vx*.045,p.y-p.vy*.045); c.stroke(); }
    else if(p.type==='text'){ c.globalCompositeOperation='source-over'; c.font='700 '+p.size+'px Oswald,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=2.6; c.strokeStyle='rgba(0,0,0,.75)'; c.strokeText(p.text,p.x,p.y); c.fillStyle=p.color; c.fillText(p.text,p.x,p.y); }
    else { c.fillStyle=p.color; circ(c,p.x,p.y,Math.max(.1,lerp(p.size,p.size2,k))); c.fill(); }
  }
  c.globalAlpha=1; c.globalCompositeOperation='source-over';
}
function drawSelectionFor(team){
  const isP=team==='player', d=isP?S.hand[S.sel]:S.eHand[S.eSel], cur=isP?S.cursor:S.eCursor;
  if(!d) return;
  const c=ctx,pulse=(Math.sin(NOW*4)+1)/2;
  const zy=isP?DEPLOY_MIN_Y:ENEMY_MIN_Y, zh=DEPLOY_MAX_Y-DEPLOY_MIN_Y+18;
  const top=isP?zy:18, height=isP?zh:(ENEMY_MAX_Y-18);
  const rgb=isP?'77,109,140':'168,64,44';
  c.fillStyle='rgba('+rgb+','+(.08+.05*pulse)+')'; c.fillRect(LANE_L+2,top,W-2*(LANE_L+2),height);
  c.strokeStyle='rgba('+rgb+','+(.55+.2*pulse)+')'; c.lineWidth=1.3; c.setLineDash([7,5]); c.strokeRect(LANE_L+2,top,W-2*(LANE_L+2),height); c.setLineDash([]);
  c.fillStyle='rgba('+rgb+',.7)'; c.font='600 8px Oswald,sans-serif'; c.textAlign='left'; c.textBaseline='top'; c.fillText(isP?'JOUEUR 1 · ZONE DE DÉPLOIEMENT':'JOUEUR 2 · ZONE DE DÉPLOIEMENT',LANE_L+6,top+5);
  const valid=isP?inZone(cur.x,cur.y):inEnemyZone(cur.x,cur.y), x=clamp(cur.x,LANE_L+14,LANE_R-14), y=clamp(cur.y,isP?DEPLOY_MIN_Y:ENEMY_MIN_Y,isP?DEPLOY_MAX_Y:ENEMY_MAX_Y);
  const elx=isP?S.pElixir:S.eElixir, poor=elx<d.cost;
  c.strokeStyle=valid&&!poor?'rgba(255,255,255,.4)':'rgba(255,90,70,.6)'; c.lineWidth=1.2; c.setLineDash([4,4]); circ(c,x,y,d.range*PX); c.stroke(); c.setLineDash([]);
  c.strokeStyle=valid?'rgba(255,220,140,.85)':'rgba(255,90,70,.8)'; c.lineWidth=1.4; const r=20+pulse*2;
  c.beginPath(); c.moveTo(x-r,y); c.lineTo(x-r+7,y); c.moveTo(x+r,y); c.lineTo(x+r-7,y); c.moveTo(x,y-r); c.lineTo(x,y-r+7); c.moveTo(x,y+r); c.lineTo(x,y+r-7); c.stroke();
  drawSprite(c,d,team,{x,y,aim:isP?-Math.PI/2:Math.PI/2,phase:0,atk:0,moving:false,t:NOW,alpha:valid?(poor?.4:.7):.35});
  c.fillStyle=poor?'#ff8f78':'#ffd36b'; c.font='700 11px Oswald,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.strokeStyle='rgba(0,0,0,.7)'; c.lineWidth=3; c.strokeText(String(d.cost),x,y+(isP?-30:30)); c.fillText(String(d.cost),x,y+(isP?-30:30));
}
function drawSelection(){ drawSelectionFor(isGuest()?'enemy':'player'); }

function render(){
  if(!S) return;
  const c=ctx, sx=canvas.width/W, sy=canvas.height/H;
  c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,canvas.width,canvas.height);
  c.setTransform(sx,0,0,sy,0,0);
  if(S.shake>0.05) c.translate(rand(-1,1)*S.shake,rand(-1,1)*S.shake);
  if(bg) c.drawImage(bg,0,0,W,H);
  for(const d of S.decals){ const f=1-d.life/30; c.fillStyle='rgba(0,0,0,'+(.34*f)+')'; ell(c,d.x,d.y,d.r,d.r*.7); c.fill(); c.fillStyle='rgba(0,0,0,'+(.3*f)+')'; ell(c,d.x,d.y,d.r*.55,d.r*.38); c.fill(); }
  if(S.phase==='playing'&&(isGuest()?S.eSel>=0:S.sel>=0)) drawSelection();
  drawTower(S.eTower); drawTower(S.pTower);
  const us=S.units.slice().sort((a,b)=>a.y-b.y);
  for(const u of us) drawUnit(u);
  for(const p of S.projs) drawProj(p);
  drawParts();
  if(S.pTower.hp/S.pTower.max<.3&&S.pTower.hp>0){
    const pl=(Math.sin(NOW*6)+1)/2, g=c.createLinearGradient(0,H-110,0,H); g.addColorStop(0,'rgba(201,79,61,0)'); g.addColorStop(1,'rgba(201,79,61,'+(.12+.16*pl)+')'); c.fillStyle=g; c.fillRect(0,H-110,W,110);
  }
}

// =====================================================================
//  UI
// =====================================================================
function buildHand(){
  const hand=$('hand'); hand.innerHTML=''; slots=[];
  for(let i=0;i<4;i++){
    const el=document.createElement('div'); el.className='card';
    el.innerHTML='<div class="key">'+(i+1)+'</div><div class="cost stencil"></div><canvas class="art" width="144" height="144"></canvas><div class="name"></div><div class="afford"><i></i></div>';
    el.addEventListener('click',()=>{ Snd.init(); Snd.resume(); pressCard(i); });
    el.addEventListener('mouseenter',()=>{ hoverCard=i; });
    el.addEventListener('mouseleave',()=>{ hoverCard=-1; });
    hand.appendChild(el);
    slots.push({el:el,cost:el.querySelector('.cost'),art:el.querySelector('.art'),name:el.querySelector('.name'),bar:el.querySelector('.afford i'),card:null});
    setSlot(i,false);
  }
}
function buildEnemyHand(){
  const hand=$('enemyHand'); if(!hand) return; hand.innerHTML=''; enemySlots=[];
  for(let i=0;i<4;i++){
    const el=document.createElement('div'); el.className='card enemy-card';
    el.innerHTML='<div class="key">'+(i===3?'0':String(i+7))+'</div><div class="cost stencil"></div><canvas class="art" width="144" height="144"></canvas><div class="name"></div><div class="afford"><i></i></div>';
    el.addEventListener('click',()=>{ Snd.init(); Snd.resume(); pressEnemyCard(i); });
    hand.appendChild(el); enemySlots.push({el,cost:el.querySelector('.cost'),art:el.querySelector('.art'),name:el.querySelector('.name'),bar:el.querySelector('.afford i'),card:null});
    setEnemySlot(i,false);
  }
}
function setEnemySlot(i,anim){
  if(!enemySlots[i]) return; const s=enemySlots[i],d=S.eHand[i]; if(!d) return;
  s.card=d; s.cost.textContent=d.cost; s.name.textContent=d.name; s.el.className='card enemy-card r-'+d.rar;
  if(anim){s.el.classList.add('deal');setTimeout(()=>s.el.classList.remove('deal'),520);}
}
function setSlot(i,anim){
  const s=slots[i], d=curHand()[i]; if(!s||!d) return;
  s.card=d; s.cost.textContent=d.cost; s.name.textContent=d.name;
  s.el.className='card r-'+d.rar;
  if(anim){ s.el.classList.add('deal'); setTimeout(()=>s.el.classList.remove('deal'),520); }
}
const cache={};
function setTxt(id,v){ if(cache[id]!==v){ cache[id]=v; $(id).textContent=v; } }
function setW(id,v){ if(cache[id]!==v){ cache[id]=v; $(id).style.width=v; } }
let infoCard=null, infoKey='';
function updateHUD(){
  if(!S) return;
  const g=isGuest(), team=g?'enemy':'player', hand=g?S.eHand:S.hand, nxt=g?S.eNext:S.next, elx=g?S.eElixir:S.pElixir, sel=g?S.eSel:S.sel;
  setTxt('pHpTxt',Math.ceil(S.pTower.hp)); setTxt('eHpTxt',Math.ceil(S.eTower.hp));
  setW('pHpFill',(100*S.pTower.hp/S.pTower.max)+'%'); setW('eHpFill',(100*S.eTower.hp/S.eTower.max)+'%');
  const tl=Math.max(0,Math.ceil(S.timeLeft)); setTxt('timer',Math.floor(tl/60)+':'+String(tl%60).padStart(2,'0'));
  $('timer').classList.toggle('low',S.phase==='playing'&&tl<=10);
  $('x2').classList.toggle('on',S.double); $('app').classList.toggle('double',S.double);
  setW('elx-fill',(100*elx/MAX_ELX)+'%'); setTxt('elx-count',elx.toFixed(1).replace('.0',''));
  const cb=$('elx-cost');
  if(sel>=0&&S.phase==='playing'&&hand[sel]){
    const cost=hand[sel].cost, from=Math.max(0,elx-cost);
    cb.style.display='block'; cb.style.left=(100*from/MAX_ELX)+'%'; cb.style.width=(100*Math.min(cost,elx)/MAX_ELX)+'%';
  } else cb.style.display='none';
  for(let i=0;i<slots.length;i++){
    const s=slots[i], d=hand[i]; if(!d) continue;
    if(s.card!==d) setSlot(i,false);
    const poor=elx<d.cost;
    s.el.classList.toggle('selected',sel===i); s.el.classList.toggle('poor',poor); s.el.classList.toggle('ready',!poor);
    s.bar.style.width=(100*Math.min(1,elx/d.cost))+'%';
    drawCardArt(s.art,d,team,NOW,i*.83);
  }
  drawCardArt($('nextArt'),nxt,team,NOW,4.1);
  $('enemyHandBar').classList.remove('on');
  const m=S.mode==='multi';
  setTxt('pTowerLabel',m?(g?'Adversaire (J1)':'Toi (J1)'):'Ton avant-poste');
  setTxt('eTowerLabel',m?(g?'Toi (J2)':'Adversaire (J2)'):(S.chap?S.chap.goal:'Milice de Karvenia'));
  setTxt('elx-label',m?(g?'Joueur 2 · Élixir':'Joueur 1 · Élixir'):'Élixir');
  const foc=hoverCard>=0?hand[hoverCard]:(sel>=0?hand[sel]:(infoCard||hand[0]));
  infoCard=foc;
  drawCardArt($('infoArt'),foc,team,NOW,.5);
  if(infoKey!==foc.key){
    infoKey=foc.key;
    setTxt('infoName',foc.name); setTxt('infoRole',foc.role); setTxt('infoDesc',foc.desc);
    const tag=$('infoRar'); tag.textContent=RARITY[foc.rar]; tag.style.color=foc.rar==='heroique'?'#e0b04a':(foc.rar==='rare'?'#5c9ad6':'#b8ad8c');
    const set=(b,v,val,max)=>{ $(b).style.width=(100*Math.min(1,val/max))+'%'; $(v).textContent=(Math.round(val*10)/10); };
    set('bCost','vCost',foc.cost,6); set('bHp','vHp',foc.hp,62); set('bDmg','vDmg',foc.dmg,11); set('bRng','vRng',foc.range,4.3); set('bSpd','vSpd',foc.speed,2.8);
  }
}
// =====================================================================
//  MISE EN PAGE & BOUCLE
// =====================================================================
function fit(){
  const main=$('main'), aw=main.clientWidth-16, ah=main.clientHeight-10;
  let w=Math.min(aw,ah*W/H); w=Math.max(150,w); const h=w*H/W;
  wrap.style.width=w+'px'; wrap.style.height=h+'px';
  const dpr=Math.min(2.5,window.devicePixelRatio||1);
  canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
  buildBG();
}
window.addEventListener('resize',fit);
if(window.ResizeObserver){ try{ new ResizeObserver(fit).observe($('main')); }catch(e){} }

let lastT=null;
function loop(ts){
  if(lastT===null) lastT=ts;
  const dt=Math.min(.05,(ts-lastT)/1000); lastT=ts; NOW=ts/1000;
  update(dt); render(); updateHUD();
  requestAnimationFrame(loop);
}

function boot(){
  if(networkRoomFromUrl) gameMode='multi';
  newGame(); S.phase='menu';
  buildHand(); buildEnemyHand(); fit(); showOverlay('start'); refreshHint();
  if(networkRoomFromUrl){
    const id = networkRoomFromUrl;
    networkRoomFromUrl='';
    setTimeout(()=>joinOnline(id), 400);
  }
  requestAnimationFrame(loop);
}
boot();
})();