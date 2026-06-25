import { supabase } from './api.js';
import { getCurrentUser } from './auth.js';

const user = await getCurrentUser();

if(!user){

location.href='login.html';

}

const historyList =
document.getElementById('history-list');

const { data, error } = await supabase

.from('orders')

.select('*')

.eq('customer_id', user.id)

.order('id',{ascending:false});

if(error){

historyList.innerHTML=

'<p>Gagal mengambil data.</p>';

console.error(error);

throw error;

}

if(!data.length){

historyList.innerHTML='

<div
style="
text-align:center;
padding:50px;
">

🚕<br><br>

Belum ada riwayat perjalanan.

</div>

}

function getStatus(status){

switch(status){

case 'pending':
return '<span class="status status-pending">Pending</span>';

case 'accepted':
return '<span class="status status-accepted">Driver Ditemukan</span>';

case 'pickup':
return '<span class="status status-pickup">Menuju Jemput</span>';

case 'ontheway':
return '<span class="status status-ontheway">Dalam Perjalanan</span>';

case 'completed':
return '<span class="status status-completed">Selesai</span>';

case 'cancel':
return '<span class="status status-cancel">Dibatalkan</span>';

default:
return status;

}

}

else{

historyList.innerHTML='';

data.forEach(order=>{

historyList.innerHTML+=`

<div class="card" style="margin-bottom:15px;">

<h3>${order.nama}</h3>

<hr style="margin:10px 0;">

<p>

🟢 Jemput

<br>

<b>${order.jemput}</b>

</p>

<p>

🔴 Tujuan

<br>

<b>${order.tujuan}</b>

</p>

<p>

📝 ${order.catatan || '-'}

</p>

<p>

Status :

<div style="margin-top:15px;">

${getStatus(order.status)}

</div>

</p>

</div>

`;

});

}
