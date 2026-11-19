const timed = [
  ['07:20','叫早，发到群里'],
  ['08:15','发到群里：考勤照片（带水印）、文字、考勤表'],
  ['09:15','巡班：文字和照片（带水印）'], ['11:15','巡班：文字和照片（带水印）'],
  ['13:30','午休叫起：发文字'],
  ['14:05','发到群里：考勤照片（带水印）、文字、考勤表'],
  ['15:15','巡班：文字和照片（带水印）'], ['16:00','自习课：按照自习课话术发：班级照、手机照、考勤截图'],
  ['17:15','巡班：文字和照片（带水印）'],
  ['19:00','自习课：按照自习课话术发：班级照、手机照、考勤截图，录几秒学生晚读视频'],
  ['22:00','查寝']
];
const anytime = [
  '词测：中英文一共只能错 10 个',
  '词测反馈正确率：七个人词测照片、整体正确率',
  '词测第一次不过只发二测，并加文字说明“今日词测情况请查收，部分未达标的同学也已通过二测”',
  '抽学生朗读（单独去空教室朗读）：发单独朗读照片，以及整体评价表',
  '汇总当日作业，发到学生和家长群',
  '拍一张学生写作业照片',
  '作业三天一汇总，发到家长群（未到提交时间可隐藏到下次发）'
];
const $ = id => document.getElementById(id);
let selectedDate = localDate();
let reminded = JSON.parse(localStorage.getItem('camp-reminded') || '{}');
function localDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function key(date, type, index){return `camp-${date}-${type}-${index}`}
function isDone(date,type,index){return localStorage.getItem(key(date,type,index)) === '1'}
function setDone(date,type,index,value){localStorage.setItem(key(date,type,index),value?'1':'0')}
function render(){
  $('datePicker').value=selectedDate;
  const t=$('timedTasks'), a=$('anytimeTasks'); t.innerHTML=''; a.innerHTML='';
  timed.forEach((item,i)=>t.appendChild(taskEl(item[0],item[1],'t',i)));
  anytime.forEach((title,i)=>a.appendChild(taskEl('',title,'a',i)));
  updateSummary(); $('taskCount').textContent=`${timed.length} 个时间节点`;
}
function taskEl(time,title,type,index){
  const row=document.createElement('label'); row.className='task'+(isDone(selectedDate,type,index)?' done':'');
  row.innerHTML=`<input class="check" type="checkbox" ${isDone(selectedDate,type,index)?'checked':''}><span class="task-time">${time||'全天'}</span><span class="task-title">${title}</span>${time?'<span class="task-note">提醒可用</span>':''}`;
  row.querySelector('input').addEventListener('change',e=>{setDone(selectedDate,type,index,e.target.checked);row.classList.toggle('done',e.target.checked);updateSummary()}); return row;
}
function updateSummary(){const total=timed.length+anytime.length;let done=0;for(let i=0;i<timed.length;i++)done+=isDone(selectedDate,'t',i)?1:0;for(let i=0;i<anytime.length;i++)done+=isDone(selectedDate,'a',i)?1:0;const p=Math.round(done/total*100);$('summaryText').textContent=`${done} / ${total} 已完成`;$('percentText').textContent=`${p}%`;$('progressBar').style.width=p+'%'}
function shift(days){const d=new Date(selectedDate+'T12:00:00');d.setDate(d.getDate()+days);selectedDate=localDate(d);render()}
function showToast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800)}
function updateClock(){const d=new Date();$('liveTime').textContent=d.toLocaleTimeString('zh-CN',{hour12:false});$('liveDate').textContent=d.toLocaleDateString('zh-CN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});checkReminders(d)}
function checkReminders(now){if(selectedDate!==localDate(now))return;const lead=Number($('leadMinutes').value);timed.forEach((item,i)=>{const [h,m]=item[0].split(':').map(Number);const target=new Date(now);target.setHours(h,m,0,0);const diff=Math.round((target-now)/60000);const rid=`${localDate(now)}-${i}-${lead}`;if(diff===lead&&!reminded[rid]){reminded[rid]=1;localStorage.setItem('camp-reminded',JSON.stringify(reminded));notify(item[0],item[1])}})}
function notify(time,title){const msg=`${time} · ${title}`,body=`还有约 ${$('leadMinutes').value} 分钟：${msg}`;if(typeof Notification!=='undefined'&&Notification.permission==='granted'){if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(reg=>reg.showNotification('封闭营任务提醒',{body,tag:`camp-${time}`,renotify:true})).catch(()=>{});else try{new Notification('封闭营任务提醒',{body})}catch(e){}}showToast(`提醒：${msg}`)}
$('datePicker').addEventListener('change',e=>{selectedDate=e.target.value;render()});$('prevDay').onclick=()=>shift(-1);$('nextDay').onclick=()=>shift(1);$('todayBtn').onclick=()=>{selectedDate=localDate();render()};
$('holidayBtn').onclick=()=>{if(!confirm(`确定将 ${selectedDate} 的全部 ${timed.length+anytime.length} 项任务标记为已完成吗？`))return;timed.forEach((_,i)=>setDone(selectedDate,'t',i,true));anytime.forEach((_,i)=>setDone(selectedDate,'a',i,true));render();showToast('今天的任务已全部打勾，放假愉快 ☀')};
$('enableNotify').onclick=async()=>{if(!('Notification' in window)){showToast('当前浏览器不支持系统通知，请安装到主屏幕后重试');return}const p=await Notification.requestPermission();$('notifyStatus').textContent=p==='granted'?'已开启：任务前会弹出提醒。请保持主屏幕 App 可用。':'未获得通知权限，可稍后再次开启。';showToast(p==='granted'?'提醒已开启':'通知权限未开启')};$('leadMinutes').onchange=()=>{localStorage.setItem('camp-lead',$('leadMinutes').value)};
const savedLead=localStorage.getItem('camp-lead');if(savedLead)$('leadMinutes').value=savedLead;render();updateClock();setInterval(updateClock,1000);

if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
if('Notification' in window && Notification.permission==='granted') $('notifyStatus').textContent='已开启：任务前会弹出提醒。请保持网页或主屏幕 App 可用。';
$('installTip').onclick=()=>showToast(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'请在 Safari 点分享按钮，再选择“添加到主屏幕”':'请使用浏览器菜单中的“安装应用”或“添加到主屏幕”');
