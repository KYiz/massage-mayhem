// Massage Mayhem: deterministic rule engine (no DOM dependencies)
export const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
export const therapists=[
  {
    "id": "charming_m",
    "name": "阿烈｜痞帅男模",
    "gender": "男",
    "skills": {
      "gentle": 55,
      "strong": 48,
      "food": 48,
      "dance": 96,
      "prank": 55
    },
    "charm": 94,
    "trait": "魅力互动/热舞",
    "cost": 0,
    "appearance": "微卷狼尾、单边耳钉、半开领黑衬衫、修身西裤；歪嘴坏笑与挑眉",
    "palette": "黑/酒红/紫",
    "animationSet": "飞吻、近距离舞步、被拒时秒变无辜",
    "silhouette": "狼尾耳钉+单手插袋站姿",
    "matchNotes": "偏爱其风格的爱玩顾客；不擅长保守社恐客"
  },
  {
    "id": "charming_f",
    "name": "小曼｜甜辣头牌",
    "gender": "女",
    "skills": {
      "gentle": 78,
      "strong": 35,
      "food": 62,
      "dance": 94,
      "prank": 45
    },
    "charm": 94,
    "trait": "温柔护理/飞吻/表演",
    "cost": 0,
    "appearance": "高马尾或长卷发、眼尾上挑、修身制服与可解锁黑丝袜装扮",
    "palette": "黑/粉/金",
    "animationSet": "职业甜笑、心形特效、被投诉时冷脸",
    "silhouette": "高马尾+独特手套和星星发夹",
    "matchNotes": "偏爱魅力服务的客人；遇到保守客可能失配"
  },
  {
    "id": "uncle",
    "name": "老冯｜铁掌推拿大叔",
    "gender": "男",
    "skills": {
      "gentle": 70,
      "strong": 93,
      "food": 50,
      "dance": 20,
      "prank": 55
    },
    "charm": 40,
    "trait": "强力推拿/压腿",
    "cost": 230,
    "appearance": "浓眉、寸头、宽肩、旧白背心、腰间旧毛巾、粗壮手掌",
    "palette": "灰白/深蓝/褐",
    "animationSet": "蓄力拍背、鼻孔喷气、无语脸",
    "silhouette": "斜挎旧毛巾+硕大方形手掌",
    "matchNotes": "大力偏好顾客；轻柔敏感型易失误"
  },
  {
    "id": "aunt",
    "name": "芬姨｜暖心嘴碎大妈",
    "gender": "女",
    "skills": {
      "gentle": 85,
      "strong": 60,
      "food": 98,
      "dance": 22,
      "prank": 53
    },
    "charm": 41,
    "trait": "足浴/美食/安抚",
    "cost": 230,
    "appearance": "短卷发、花纹围裙、圆润轮廓、肩搭纯棉旧毛巾",
    "palette": "橙/绿/米黄",
    "animationSet": "唠嗑、翻白眼、招呼吃东西",
    "silhouette": "大花围裙+快速摆手说话动作",
    "matchNotes": "吃货与家庭感偏好顾客；讨厌唠叨者减益"
  },
  {
    "id": "gentle",
    "name": "岚姐｜冷艳王牌",
    "gender": "女",
    "skills": {
      "gentle": 96,
      "strong": 73,
      "food": 45,
      "dance": 42,
      "prank": 23
    },
    "charm": 68,
    "trait": "精准轻重控制/复杂顾客",
    "cost": 180,
    "appearance": "利落深色短发、细框眼镜、利落制服、笔直站姿",
    "palette": "黑/酒红/深灰",
    "animationSet": "推眼镜、精准压点、冷眼一扫",
    "silhouette": "细框眼镜+锐角制服肩线",
    "matchNotes": "苛刻客与轻柔客；爱闹顾客可能嫌沉闷"
  },
  {
    "id": "power",
    "name": "阿虎｜肌肉狼狗",
    "gender": "男",
    "skills": {
      "gentle": 35,
      "strong": 99,
      "food": 35,
      "dance": 40,
      "prank": 72
    },
    "charm": 52,
    "trait": "重压足疗/压腿",
    "cost": 180,
    "appearance": "方正轮廓、短寸、宽背、蓝色运动背心、护腕",
    "palette": "蓝/白/橙",
    "animationSet": "蓄力憨笑、失误后手忙脚乱",
    "silhouette": "大护腕+倒三角肌肉轮廓",
    "matchNotes": "吃力客；怕痛型失配严重"
  },
  {
    "id": "joker",
    "name": "小周｜憨萌学徒",
    "gender": "男",
    "skills": {
      "gentle": 52,
      "strong": 53,
      "food": 50,
      "dance": 61,
      "prank": 97
    },
    "charm": 56,
    "trait": "整蛊/学习成长",
    "cost": 280,
    "appearance": "蘑菇短发、偏大工作服、胸袋小抄、站姿拘谨",
    "palette": "浅蓝/卡其/白",
    "animationSet": "紧张流汗、误操作石化、成功比耶",
    "silhouette": "大号工服+胸袋小抄",
    "matchNotes": "爱玩与宽容顾客；挑剔客易翻车"
  },
  {
    "id": "bao_master",
    "name": "包师傅｜黄金右手",
    "gender": "男",
    "skills": {
      "gentle": 55,
      "strong": 99,
      "food": 45,
      "dance": 20,
      "prank": 65
    },
    "charm": 50,
    "trait": "足疗重按／黄金右手：高舒适、高投诉风险",
    "cost": 12800,
    "hidden": true,
    "revealAfterLevel": 30,
    "signatureSkillId": "golden_right_hand",
    "portrait": "../art/characters/bao_master_portrait.png",
    "appearance": "壮硕中年技师，短寸与胡茬，米白色工作衫、深色工装裤，腰间白毛巾，右手有夸张暖金高光",
    "palette": "米白／深灰／暖金",
    "animationSet": "活动右手、擦毛巾、卸表蓄力、黄金右手足底按压",
    "silhouette": "宽肩、腰间毛巾、放大的右手",
    "matchNotes": "足疗和喜欢重按的顾客效率高；轻柔顾客与非足疗场景优势有限"
  }
];
export const guests=[
{id:'foodie',name:'馋嘴顾客',look:'😋',preferences:{gentle:45,strong:48,food:96,dance:35,prank:45},charmPreference:55,patience:78,complaintBase:8,goal:75,disposition:'吃货'},
{id:'gentle',name:'高冷白领',look:'😐',preferences:{gentle:95,strong:12,food:25,dance:8,prank:9},charmPreference:35,patience:57,complaintBase:20,goal:82,disposition:'社恐'},
{id:'strong',name:'硬核运动员',look:'💪',preferences:{gentle:22,strong:98,food:35,dance:30,prank:55},charmPreference:30,patience:86,complaintBase:10,goal:92,disposition:'吃力'},
{id:'flirt',name:'派对达人',look:'😍',preferences:{gentle:42,strong:54,food:32,dance:97,prank:70},charmPreference:98,patience:69,complaintBase:12,goal:89,disposition:'爱玩'},
{id:'tricky',name:'坏笑挑剔客',look:'😏',preferences:{gentle:65,strong:32,food:14,dance:40,prank:57},charmPreference:65,patience:43,complaintBase:36,goal:98,disposition:'刁钻'},
{id:'goofy',name:'呆萌顾客',look:'🤪',preferences:{gentle:62,strong:54,food:78,dance:65,prank:92},charmPreference:70,patience:78,complaintBase:9,goal:80,disposition:'憨憨'}
];
export const services=[
{id:'gentle',name:'轻柔按摩',cost:0,base:12,affection:3,complaint:0,inspection:0,energy:11,scene:['back','legs','feet']},
{id:'strong',name:'大力按摩',cost:0,base:15,affection:1,complaint:3,inspection:0,energy:13,scene:['back','legs','feet']},
{id:'food',name:'美食招待',cost:8,base:1,affection:13,complaint:0,inspection:0,energy:3,scene:['back','legs','feet']},
{id:'dance',name:'卡通热舞',cost:0,base:8,affection:12,complaint:8,inspection:20,energy:16,scene:['back','legs','feet'],consent:true},
{id:'prank',name:'卡通整蛊',cost:0,base:7,affection:3,complaint:12,inspection:5,energy:12,scene:['back','legs','feet'],consent:true},
{id:'heart',name:'飞吻爱心',cost:0,base:4,affection:10,complaint:9,inspection:8,energy:10,scene:['back','legs','feet'],consent:true}
];
export const scenes=[{id:'back',name:'趴卧开背'},{id:'legs',name:'仰卧腿部'},{id:'feet',name:'躺椅足疗'}];
export function newGame(therapistId='charming_m',guestId='foodie',scene='back'){
 const therapist=therapists.find(x=>x.id===therapistId)||therapists[0],guest=guests.find(x=>x.id===guestId)||guests[0];
 return {therapistId:therapist.id,guestId:guest.id,scene,comfort:0,affection:35,patience:guest.patience,complaint:guest.complaintBase,inspection:0,energy:0,coins:0,turns:0,status:'playing',mood:'neutral',consent:null,logs:[`顾客 ${guest.name} 入场。目标舒适值 ${guest.goal}。`]};
}
export function act(state,serviceId,random=Math.random()){
 if(state.status!=='playing')return {...state};
 const s=services.find(x=>x.id===serviceId),t=therapists.find(x=>x.id===state.therapistId),g=guests.find(x=>x.id===state.guestId);if(!s||!s.scene.includes(state.scene))return {...state,logs:[...state.logs,'当前场景不可用。']};
 const ns={...state,logs:[...state.logs],turns:state.turns+1};
 const pref=g.preferences[s.id]??g.preferences.dance;
 const ability=t.skills[s.id]??t.charm;
 // Service success based on skill x preference; no age/sex assumptions.
 const match=clamp(Math.round(0.57*pref+0.43*ability));
 const success=random<match/100;
 if(s.consent && pref<35){ns.complaint=clamp(ns.complaint+13);ns.affection=clamp(ns.affection-9);ns.mood='angry';ns.logs.push('顾客明确拒绝该互动；服务没有执行，投诉风险提高。');return check(ns,g);}
 const effect=success?Math.max(1,Math.round(s.base*(0.65+match/100))):Math.max(1,Math.round(s.base*0.2));
 const comfortDelta=s.id==='food'?0:(success?effect:-Math.ceil(effect/2));
 ns.comfort=clamp(ns.comfort+comfortDelta);
 const foodChance=s.id==='food'?Math.min(0.85,0.12+0.62*(pref/100)*(ability/100)):0;
 const affectionDelta=s.id==='food'?(random<foodChance?s.affection:-1):(success?Math.round(s.affection*match/80):-8);
 ns.affection=clamp(ns.affection+affectionDelta);
 ns.patience=clamp(ns.patience+(success?1:-10));
 ns.complaint=clamp(ns.complaint+(success?Math.round(s.complaint*(1-match/125)):-Math.min(-2,-s.complaint-8)));
 ns.inspection=clamp(ns.inspection+s.inspection);
 ns.energy=clamp(ns.energy+s.energy);
 ns.coins=Math.max(0,ns.coins-s.cost);
 ns.mood=success?'happy':'angry';
 ns.logs.push(`${s.name}：${success?'成功':'失误'}，舒适 ${comfortDelta>=0?'+':''}${comfortDelta}，好感 ${affectionDelta>=0?'+':''}${affectionDelta}。`);
 return check(ns,g);
}
function check(s,g){
 if(s.complaint>=100){s.status='complaint_failed';s.mood='angry';s.logs.push('投诉升级：本关失败。');}
 else if(s.inspection>=100){s.status='inspection_failed';s.mood='shock';s.logs.push('警察乌龙查房：本关失败；该技师冷却七个已完成关卡。');}
 else if(s.patience<=0){s.status='walkout';s.mood='angry';s.logs.push('忍耐耗尽，顾客离开，本关失败。');}
 else if(s.comfort>=g.goal){s.status='won';s.mood='happy';s.coins+=Math.round(60+g.goal*.5+s.affection*.3);s.logs.push(`通关！结算金币：${s.coins}。`);}
 else if(s.turns>=25){s.status='timeout';s.logs.push('回合耗尽，本关失败。');}
 return s;
}
export function useSkill(state){if(state.energy<100||state.status!=='playing')return {...state,logs:[...state.logs,'技能条不足。']};const ns={...state,energy:0,comfort:clamp(state.comfort+22),affection:clamp(state.affection+8),logs:[...state.logs,'特殊技能成功：舒适 +22，好感 +8。']};return check(ns,guests.find(g=>g.id===state.guestId));}
export function complaintAppeal(state,evidence){if(state.status!=='playing')return state;const good=evidence>=3;return {...state,complaint:good?clamp(state.complaint-35):clamp(state.complaint+20),logs:[...state.logs,good?'申诉成功：有充分证据，投诉风险下降。':'证据不足：投诉风险上升。']};}
