import { supabase } from './api.js';
import { logoutUser } from './auth.js';
import { requireRole } from './rbac.js';

/* ===========================
   AUTH
=========================== */

const auth = await requireRole('driver');

if (!auth) {

    throw new Error('Akses ditolak');

}

const user = auth.user;
const profile = auth.profile;

const driverStatus =
document.getElementById('driver-status');

const driverBadge =
document.getElementById('driver-badge');

const btnOnline =
document.getElementById('btn-online');

const todayOrder =
document.getElementById('today-order');

const todayIncome =
document.getElementById('today-income');

let isOnline = false;

/* ===========================
   HEADER
=========================== */

document.getElementById('driver-name').textContent =
profile.full_name || user.email;

/* ===========================
   LOAD ORDER
=========================== */

const orderList =
document.getElementById('order-list');

function getActionButton(order){

    switch(order.status){

        case 'pending':
            return `
            <button
                class="btn btn-green accept-btn"
                data-id="${order.id}">
                ✅ Terima Order
            </button>
            `;

        case 'accepted':
            return `
            <button
                class="btn btn-blue pickup-btn"
                data-id="${order.id}">
                📍 Menuju Jemput
            </button>
            `;

        case 'pickup':
            return `
            <button
                class="btn btn-orange ontheway-btn"
                data-id="${order.id}">
                🚕 Mulai Perjalanan
            </button>
            `;

        case 'ontheway':
            return `
            <button
                class="btn btn-dark complete-btn"
                data-id="${order.id}">
                ✅ Selesaikan Order
            </button>
            `;

        default:
            return '';

    }

}


async function loadOrders(){

   if(!isOnline){

       orderList.innerHTML = `
       <div style="padding:40px;text-align:center;">
   
           🔴 Driver sedang OFFLINE
   
           <br><br>
   
           Aktifkan GO ONLINE
           untuk menerima order.
   
       </div>
       `;
   
       return;
   
   }

    orderList.innerHTML = `
        <div style="padding:30px;text-align:center;">
            Memuat order...
        </div>
    `;

   const pending =
   await supabase
   .from('orders')
   .select('*')
   .eq('status','pending');
   
   const active =
   await supabase
   .from('orders')
   .select('*')
   .eq('driver_id',user.id)
   .in('status',[
       'accepted',
       'pickup',
       'ontheway'
   ]);
   
   const error =
   pending.error || active.error;
   
   const merged = [

       ...(pending.data || []),
   
       ...(active.data || [])
   
   ];
   
   const data = Array.from(
   
       new Map(
   
           merged.map(item => [item.id,item])
   
       ).values()
   
   );
   
   data.sort((a,b)=>b.id-a.id);
   

    if(error){

        console.error(error);

        orderList.innerHTML = `
        <div style="padding:30px;text-align:center;color:red;">
            Gagal mengambil data.
        </div>`;

        return;

    }

    if(!data || data.length===0){

        orderList.innerHTML = `
        <div style="padding:30px;text-align:center;">
            Tidak ada order masuk.
        </div>`;

        return;

    }

    orderList.innerHTML='';

    data.forEach(order=>{

        orderList.innerHTML += `

        <div class="card" style="margin-bottom:20px;">

            <h3>${order.nama}</h3>

            <hr style="margin:10px 0;">

            <p>
            📍 Jemput<br>
            <b>${order.jemput}</b>
            </p>

            <p>
            🎯 Tujuan<br>
            <b>${order.tujuan}</b>
            </p>

            <p>
            💰 Tarif<br>
            <b>
            Rp ${Number(order.price || 0).toLocaleString('id-ID')}
            </b>
            </p>

            ${getActionButton(order)}

        </div>

        `;

    });

    document
    .querySelectorAll('.accept-btn')
    .forEach(btn=>{

        btn.addEventListener('click',acceptOrder);

    });

   document
   .querySelectorAll('.pickup-btn')
   .forEach(btn=>{
   
       btn.addEventListener('click',pickupOrder);
   
   });
   
   document
   .querySelectorAll('.ontheway-btn')
   .forEach(btn=>{
   
       btn.addEventListener('click',startTrip);
   
   });
   
   document
   .querySelectorAll('.complete-btn')
   .forEach(btn=>{
   
       btn.addEventListener('click',completeOrder);
   
   });

}

/* ===========================
   ACCEPT ORDER
=========================== */

async function acceptOrder(e){

    const orderId =
    e.target.dataset.id;

    e.target.disabled=true;
    e.target.innerHTML='Memproses...';

    const { data, error } =
    await supabase
    .from('orders')
    .update({
      
          status:'accepted',
      
          driver_id:user.id,
      
          driver_name:profile.full_name,
      
          accepted_at:new Date().toISOString()
      
    })
    .eq('id',orderId)
    .eq('status','pending')
    .select();

    if(error){

       alert(error.message);
   
       e.target.disabled=false;
   
       e.target.innerHTML='✅ Terima Order';
   
       return;
   
   }
   
   if(!data || data.length===0){
   
       alert('Order sudah diambil driver lain.');
   
       await loadOrders();
      await loadStatistic();
   
       return;
   
   }

    alert('✅ Order berhasil diterima');

    await loadOrders();
   await loadStatistic();

}

async function pickupOrder(e){

    const id = e.target.dataset.id;

    const { error } =
   await supabase
   .from('orders')
   .update({
   
       status:'pickup'
   
   })
   .eq('id',id);
   
   if(error){
   
       alert(error.message);
   
       return;
   
   }
   
   await loadOrders();
   await loadStatistic();

}

async function startTrip(e){

    const id = e.target.dataset.id;

    const { error } =
   await supabase
   .from('orders')
   .update({
   
       status:'ontheway'
   
   })
   .eq('id',id);
   
   if(error){
   
       alert(error.message);
   
       return;
   
   }
   
   await loadOrders();
   await loadStatistic();

}

async function completeOrder(e){

    const id = e.target.dataset.id;

    const { error } =
   await supabase
   .from('orders')
   .update({
   
       status:'completed',
   
       completed_at:new Date().toISOString()
   
   })
   .eq('id',id);
   
   if(error){
   
       alert(error.message);
   
       return;
   
   }
   
   await loadOrders();
   await loadStatistic();

    

}

/* ===========================
   DRIVER STATUS
=========================== */

async function loadDriverStatus(){

    const { data, error } =
    await supabase
    .from('drivers')
    .select('is_online')
    .eq('id',user.id)
    .single();

    if(error){

        console.error(error);

        return;

    }

    isOnline = data.is_online;

    updateStatusUI();

}

function updateStatusUI(){

    if(isOnline){

        driverStatus.innerHTML='🟢 ONLINE';

        driverBadge.innerHTML='ONLINE';

        btnOnline.innerHTML='GO OFFLINE';

        btnOnline.className='btn btn-red';

    }else{

        driverStatus.innerHTML='🔴 OFFLINE';

        driverBadge.innerHTML='OFFLINE';

        btnOnline.innerHTML='GO ONLINE';

        btnOnline.className='btn btn-green';

    }

}

async function toggleOnline(){

    isOnline=!isOnline;

    const { error } =
    await supabase
    .from('drivers')
    .update({

        is_online:isOnline

    })
    .eq('id',user.id);

    if(error){

        alert(error.message);

        return;

    }

    updateStatusUI();

   await loadOrders();
   
   await loadStatistic();

}

/* ===========================
   STATISTIK
=========================== */

async function loadStatistic(){

    const { data } =
    await supabase
    .from('orders')
    .select('price')
    .eq('driver_id',user.id)
    .eq('status','completed');

    todayOrder.textContent =
    data?.length || 0;

    let total = 0;

    data?.forEach(item=>{

        total += Number(item.price || 0);

    });

    todayIncome.textContent =
    'Rp ' + total.toLocaleString('id-ID');

}

/* ===========================
   BUTTON
=========================== */

btnOnline.addEventListener(
'click',
toggleOnline
);

/* ===========================
   MENU
=========================== */

document
.getElementById('btn-history')
.addEventListener('click',()=>{

    alert('Driver History segera dibuat');

});

document
.getElementById('btn-profile')
.addEventListener('click',()=>{

    alert('Driver Profile segera dibuat');

});

document
.getElementById('btn-logout')
.addEventListener('click',async()=>{

    await logoutUser();

    location.href='login.html';

});

/* ===========================
   INIT
=========================== */

await loadDriverStatus();

await loadOrders();

await loadStatistic();

supabase
.channel('driver-orders')
.on(
    'postgres_changes',
    {
        event:'*',
        schema:'public',
        table:'orders'
    },
    async ()=>{

        await loadDriverStatus();

        await loadOrders();

        await loadStatistic();

    }
)
.subscribe();
