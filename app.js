const timed = [
  ['07:30','叫早：发送“今日住宿学员已叫早结束”'],
  ['08:15','正课考勤：发送考勤文字、考勤照片和考勤反馈表'],
  ['09:00','正课巡班：发送巡班文字和现场照片'],
  ['11:00','正课巡班：发送巡班文字和现场照片'],
  ['13:30','午休叫起：发送“今日住宿学员午休叫起结束”'],
  ['14:00','正课考勤：发送考勤文字、考勤照片和考勤反馈表'],
  ['15:00','正课巡班：发送巡班文字和现场照片'],
  ['16:00','自习课任务：发送学习任务、考勤反馈表；17:00进行词测'],
  ['17:00','自习课巡班：发送巡班文字和现场照片'],
  ['17:15','词测反馈：发送七个人词测照片和整体正确率'],
  ['19:00','晚自习考勤：发送考勤文字、考勤表和晚自习照片'],
  ['19:08','晚读检查：确认学生开始晚读并发送照片/文字'],
  ['19:20','学习检查：抽查学生朗读，发送朗读照片和整体评价表'],
  ['19:28','今日作业：发送作业提醒、作业照片或作业完成情况'],
  ['22:00','查寝结束：汇总并发送今日上课出勤和住宿情况']
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
let remindersEnabled = localStorage.getItem('camp-reminders-enabled') === '1';
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
function checkReminders(now){if(!remindersEnabled||selectedDate!==localDate(now))return;const lead=Number($('leadMinutes').value);timed.forEach((item,i)=>{const [h,m]=item[0].split(':').map(Number);const target=new Date(now);target.setHours(h,m,0,0);const diff=Math.round((target-now)/60000);const rid=`${localDate(now)}-${i}-${lead}`;if(diff===lead&&!reminded[rid]){reminded[rid]=1;localStorage.setItem('camp-reminded',JSON.stringify(reminded));notify(item[0],item[1])}})}
function notify(time,title){const msg=`${time} · ${title}`,body=`还有约 ${$('leadMinutes').value} 分钟：${msg}`;if(typeof Notification!=='undefined'&&Notification.permission==='granted'){if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(reg=>reg.showNotification('封闭营任务提醒',{body,tag:`camp-${time}`,renotify:true})).catch(()=>{});else try{new Notification('封闭营任务提醒',{body})}catch(e){}}showToast(`提醒：${msg}`)}
$('datePicker').addEventListener('change',e=>{selectedDate=e.target.value;render()});$('prevDay').onclick=()=>shift(-1);$('nextDay').onclick=()=>shift(1);$('todayBtn').onclick=()=>{selectedDate=localDate();render()};
$('holidayBtn').onclick=()=>{if(!confirm(`确定将 ${selectedDate} 的全部 ${timed.length+anytime.length} 项任务标记为已完成吗？`))return;timed.forEach((_,i)=>setDone(selectedDate,'t',i,true));anytime.forEach((_,i)=>setDone(selectedDate,'a',i,true));render();showToast('今天的任务已全部打勾，放假愉快 ☀')};
 $('enableNotify').onclick=async()=>{if(!('Notification' in window)){showToast('当前浏览器不支持系统通知，请安装到主屏幕后重试');return}const p=await Notification.requestPermission();if(p==='granted'){remindersEnabled=true;localStorage.setItem('camp-reminders-enabled','1');$('notifyStatus').textContent=`已开启：全部 ${timed.length} 个时间节点都会按系统时间提醒。`;showToast('全部任务提醒已开启')}else{$('notifyStatus').textContent='未获得通知权限，可稍后再次开启。';showToast('通知权限未开启')}};$('leadMinutes').onchange=()=>{localStorage.setItem('camp-lead',$('leadMinutes').value)};
const savedLead=localStorage.getItem('camp-lead');if(savedLead)$('leadMinutes').value=savedLead;render();updateClock();setInterval(updateClock,1000);

if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
if('Notification' in window && Notification.permission==='granted' && remindersEnabled) $('notifyStatus').textContent=`已开启：全部 ${timed.length} 个时间节点都会按系统时间提醒。`;
$('installTip').onclick=()=>showToast(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'请在 Safari 点分享按钮，再选择“添加到主屏幕”':'请使用浏览器菜单中的“安装应用”或“添加到主屏幕”');
