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

async function loadOrders(){

    orderList.innerHTML = `
        <div style="padding:30px;text-align:center;">
            Memuat order...
        </div>
    `;

    const { data, error } =
    await supabase
    .from('orders')
    .select('*')
    .eq('status','pending')
    .order('id',{ascending:false});

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

            <button
                class="btn btn-green accept-btn"
                data-id="${order.id}">
                ✅ Terima Order
            </button>

        </div>

        `;

    });

    document
    .querySelectorAll('.accept-btn')
    .forEach(btn=>{

        btn.addEventListener('click',acceptOrder);

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
   
       loadOrders();
   
       return;
   
   }

    alert('✅ Order berhasil diterima');

    loadOrders();

}

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

loadOrders();
