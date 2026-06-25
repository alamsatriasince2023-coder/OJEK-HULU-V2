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

historyList.innerHTML=

'<p>Belum ada order.</p>';

}

else{

historyList.innerHTML='';

data.forEach(order=>{

historyList.innerHTML+=`

<div class="card" style="margin-bottom:15px;">

<h3>${order.nama}</h3>

<p>

📍 ${order.jemput}

</p>

<p>

🏁 ${order.tujuan}

</p>

<p>

📝 ${order.catatan || '-'}

</p>

<p>

Status :

<b style="color:green;">

${order.status}

</b>

</p>

</div>

`;

});

}
