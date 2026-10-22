'use strict';
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'denbrown-photo-selection-albums-v1';
const DB_NAME = 'denbrown-photo-selection-db';
const STORE_NAME = 'photos';
let albums = [];
let activeAlbumId = null;
let db = null;
let toastTimer = null;

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function showToast(message){
  const el = $('toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.classList.remove('show'),2800);
}
function saveAlbums(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(albums)); }
function loadAlbums(){
  try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); albums = Array.isArray(data) ? data : []; }
  catch { albums = []; }
}
function currentAlbum(){ return albums.find(a=>a.id===activeAlbumId); }
function openDatabase(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){ reject(new Error('Trình duyệt không hỗ trợ lưu ảnh')); return; }
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => { if(!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME,{keyPath:'id'}); };
    request.onsuccess = ()=>resolve(request.result);
    request.onerror = ()=>reject(request.error);
  });
}
function allPhotos(){
  return new Promise((resolve,reject)=>{
    const request = db.transaction(STORE_NAME,'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = ()=>resolve(request.result); request.onerror = ()=>reject(request.error);
  });
}
function putPhoto(photo){
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE_NAME,'readwrite'); tx.objectStore(STORE_NAME).put(photo);
    tx.oncomplete = resolve; tx.onerror = ()=>reject(tx.error);
  });
}
function deletePhoto(id){
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE_NAME,'readwrite'); tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = resolve; tx.onerror = ()=>reject(tx.error);
  });
}
function switchView(name){
  $('createView').classList.toggle('hidden',name!=='create');
  $('albumsView').classList.toggle('hidden',name!=='albums');
  $('detailView').classList.toggle('hidden',name!=='detail');
  document.querySelectorAll('.tab[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name || (name==='detail'&&b.dataset.view==='albums')));
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='albums') renderAlbums();
}
function renderAlbumCount(){ $('albumCount').textContent = albums.length; }
function renderAlbums(){
  renderAlbumCount();
  const list = $('albumList'); list.replaceChildren();
  $('noAlbums').classList.toggle('hidden',albums.length>0);
  albums.forEach(album=>{
    const card=document.createElement('article'); card.className='album-card';
    const title=document.createElement('h3'); title.textContent=album.name;
    const info=document.createElement('p'); info.textContent=`Giới hạn ${album.limit} ảnh · ${album.driveLink?'Có link Google Drive':'Chưa có link Google Drive'}`;
    const actions=document.createElement('div'); actions.className='card-actions';
    const open=document.createElement('button'); open.className='primary-button'; open.textContent='Mở album →'; open.onclick=()=>openAlbum(album.id);
    const edit=document.createElement('button'); edit.className='secondary-button'; edit.textContent='Sửa'; edit.onclick=()=>{activeAlbumId=album.id;openEditDialog();};
    actions.append(open,edit); card.append(title,info,actions); list.append(card);
  });
}
function openAlbum(id){ activeAlbumId=id; switchView('detail'); renderDetail(); }
async function renderDetail(){
  const album=currentAlbum(); if(!album)return;
  $('detailTitle').textContent=album.name;
  $('detailDescription').textContent=`Giới hạn ${album.limit} ảnh được chọn${album.driveLink?' · Có đường dẫn Google Drive':''}`;
  $('photoFiles').disabled=false;
  const photos=(await allPhotos()).filter(p=>p.albumId===album.id);
  const grid=$('photoGrid'); grid.replaceChildren();
  $('noPhotos').classList.toggle('hidden',photos.length>0);
  photos.forEach((photo,index)=>{
    const selected=album.selected.includes(photo.id);
    const card=document.createElement('div'); card.className='photo-card'+(selected?' selected':'');
    const img=document.createElement('img'); img.alt=photo.name; img.loading='lazy'; img.src=URL.createObjectURL(photo.blob);
    img.onload=()=>URL.revokeObjectURL(img.src);
    const check=document.createElement('span'); check.className='photo-check'; check.textContent='✓';
    const name=document.createElement('span'); name.className='photo-name'; name.textContent=`${index+1}. ${photo.name}`;
    card.append(img,check,name);
    card.onclick=()=>toggleSelected(photo.id);
    if(album.allowDownload){
      const download=document.createElement('button'); download.className='photo-download'; download.textContent='↓'; download.title='Tải ảnh gốc';
      download.onclick=(event)=>{event.stopPropagation();downloadBlob(photo.blob,photo.name);}; card.append(download);
    }
    if(!album.allowSelection){card.style.cursor='default';card.onclick=()=>showToast('Album này đang tắt chức năng chọn ảnh.');}
    grid.append(card);
  });
  $('selectedCount').textContent=`Đã chọn ${album.selected.length}/${album.limit} ảnh`;
}
function toggleSelected(photoId){
  const album=currentAlbum(); if(!album)return;
  if(!album.allowSelection){showToast('Album đang tắt chức năng chọn ảnh.');return;}
  const index=album.selected.indexOf(photoId);
  if(index>=0) album.selected.splice(index,1);
  else if(album.selected.length>=album.limit){showToast(`Bạn đã đạt giới hạn ${album.limit} ảnh.`);return;}
  else album.selected.push(photoId);
  saveAlbums(); renderDetail();
}
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url;a.download=name||'denbrown-photo';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function csvEscape(value){return '"'+String(value??'').replace(/"/g,'""')+'"';}
async function exportSelectedCsv(){
  const album=currentAlbum();if(!album)return;
  const photos=(await allPhotos()).filter(p=>p.albumId===album.id&&album.selected.includes(p.id));
  const rows=[['STT','Tên album','Tên ảnh','ID ảnh'],...photos.map((p,i)=>[i+1,album.name,p.name,p.id])];
  const csv='\ufeff'+rows.map(row=>row.map(csvEscape).join(',')).join('\r\n');
  downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`DENBROWN-${album.name.replace(/[^\p{L}\p{N}-]+/gu,'-')}-selected.csv`);
  showToast(`Đã xuất danh sách ${photos.length} ảnh.`);
}
async function downloadSelectedPhotos(){
  const album=currentAlbum();if(!album)return;
  const photos=(await allPhotos()).filter(p=>p.albumId===album.id&&album.selected.includes(p.id));
  if(!photos.length){showToast('Bạn chưa chọn ảnh nào.');return;}
  for(let i=0;i<photos.length;i++){downloadBlob(photos[i].blob,photos[i].name);await new Promise(resolve=>setTimeout(resolve,350));}
  showToast(`Đã gửi lệnh tải ${photos.length} ảnh. Trình duyệt có thể hỏi quyền tải nhiều tệp.`);
}
function openEditDialog(){
  const album=currentAlbum();if(!album)return;
  $('editName').value=album.name;$('editDrive').value=album.driveLink||'';
  $('editLimit').value=album.limit;$('editAllowDownload').checked=album.allowDownload;
  $('editAllowSelection').checked=album.allowSelection;$('editDialog').showModal();
}
$('createForm').addEventListener('submit',event=>{
  event.preventDefault();
  const name=$('albumName').value.trim();if(!name){showToast('Vui lòng nhập tên album.');return;}
  const album={id:uid(),name,driveLink:$('driveLink').value.trim(),limit:Math.max(1,Math.min(1000,Number($('selectionLimit').value)||30)),allowDownload:$('allowDownload').checked,allowSelection:$('allowSelection').checked,selected:[],createdAt:new Date().toISOString()};
  albums.unshift(album);saveAlbums();event.target.reset();$('selectionLimit').value=30;$('allowDownload').checked=true;$('allowSelection').checked=true;
  renderAlbums();openAlbum(album.id);showToast('Đã tạo album.');
});
$('photoFiles').addEventListener('change',async event=>{
  const album=currentAlbum();if(!album)return;
  const files=Array.from(event.target.files||[]).filter(file=>file.type.startsWith('image/'));
  if(!files.length){event.target.value='';return;}
  try{
    for(const file of files) await putPhoto({id:uid(),albumId:album.id,name:file.name,blob:file,createdAt:Date.now()});
    showToast(`Đã thêm ${files.length} ảnh vào album.`);await renderDetail();
  }catch(error){showToast('Không lưu được ảnh. Có thể thiết bị đã hết dung lượng.');}
  event.target.value='';
});
$('exportCsv').addEventListener('click',exportSelectedCsv);
$('downloadChosen').addEventListener('click',downloadSelectedPhotos);
$('backToAlbums').addEventListener('click',()=>switchView('albums'));
$('newAlbumButton').addEventListener('click',()=>switchView('create'));
$('brandHome').addEventListener('click',event=>{event.preventDefault();switchView('create');});
document.querySelectorAll('.tab[data-view]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.view)));
$('editAlbumButton').addEventListener('click',openEditDialog);
$('closeDialog').addEventListener('click',()=>$('editDialog').close());
$('editForm').addEventListener('submit',event=>{
  event.preventDefault();const album=currentAlbum();if(!album)return;
  album.name=$('editName').value.trim();album.driveLink=$('editDrive').value.trim();
  album.limit=Math.max(1,Math.min(1000,Number($('editLimit').value)||30));
  album.allowDownload=$('editAllowDownload').checked;album.allowSelection=$('editAllowSelection').checked;
  if(album.selected.length>album.limit)album.selected=album.selected.slice(0,album.limit);
  saveAlbums();$('editDialog').close();renderAlbums();renderDetail();showToast('Đã lưu cài đặt album.');
});
$('deleteAlbumButton').addEventListener('click',async()=>{
  const album=currentAlbum();if(!album)return;
  if(!confirm(`Xóa album “${album.name}” và toàn bộ ảnh lưu trong album này trên thiết bị?`))return;
  const photos=(await allPhotos()).filter(p=>p.albumId===album.id);
  for(const photo of photos)await deletePhoto(photo.id);
  albums=albums.filter(a=>a.id!==album.id);saveAlbums();activeAlbumId=null;switchView('albums');showToast('Đã xóa album khỏi thiết bị này.');
});
function showDriveHelp(){alert('Để dùng thư mục Google Drive, hãy mở Drive → Chia sẻ → Quyền truy cập chung → Bất kỳ ai có đường liên kết → Người xem.\n\nLưu ý: bản mã nguồn này chỉ lưu đường dẫn Drive; chưa kết nối Google Drive API nên chưa tự đọc ảnh trong thư mục.');}
$('driveHelp').addEventListener('click',showDriveHelp);
$('helpButton').addEventListener('click',()=>alert('HƯỚNG DẪN DENBROWN PHOTO SELECTION\n\n1. Tạo album, đặt tên và giới hạn số ảnh.\n2. Mở album → Thêm ảnh để chọn ảnh từ thiết bị.\n3. Chạm ảnh để chọn hoặc bỏ chọn.\n4. Xuất danh sách CSV để gửi cho người chỉnh ảnh.\n5. Dữ liệu được lưu trên trình duyệt của thiết bị hiện tại.\n\nBản này chưa có đăng nhập, link album khách dùng từ xa hoặc đồng bộ máy chủ.'));
$('menuButton').addEventListener('click',()=>switchView('albums'));
(async()=>{
  loadAlbums();
  try{db=await openDatabase();renderAlbums();renderAlbumCount();}
  catch(error){showToast('Không thể khởi tạo vùng lưu ảnh của trình duyệt.');console.error(error);}
})();
