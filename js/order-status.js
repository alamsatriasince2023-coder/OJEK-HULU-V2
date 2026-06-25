import { supabase } from './api.js';
import { requireRole } from './rbac.js';

/* ===========================
   AUTH
=========================== */

const auth = await requireRole('customer');

if (!auth) {

    throw new Error('Akses ditolak');

}

const user = auth.user;

/* ===========================
   ELEMENT
=========================== */

const statusEl = document.getElementById('order-status');
const descEl = document.getElementById('status-desc');

const driverEl = document.getElementById('driver-name');
const vehicleEl = document.getElementById('vehicle');
const plateEl = document.getElementById('plate');

const pickupEl = document.getElementById('pickup');
const destinationEl = document.getElementById('destination');
const priceEl = document.getElementById('price');

/* ===========================
   LOAD ORDER
=========================== */

async function loadOrder(){

    const { data, error } =
    await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('id',{ascending:false})
    .limit(1)
    .single();

    if(error){

        console.error(error);

        alert('Order tidak ditemukan.');

        location.href='customer.html';

        return;

    }

    pickupEl.textContent =
    data.jemput;

    destinationEl.textContent =
    data.tujuan;

    priceEl.textContent =
    'Rp ' +
    Number(data.price || 0)
    .toLocaleString('id-ID');

    driverEl.textContent =
    data.driver_name || '-';

    vehicleEl.textContent =
    data.vehicle_type || '-';

    plateEl.textContent =
    data.vehicle_number || '-';

    switch(data.status){

        case 'pending':

            statusEl.innerHTML =
            '🟡 Menunggu Driver';

            descEl.innerHTML =
            'Sedang mencari driver terdekat...';

            break;

        case 'accepted':

            statusEl.innerHTML =
            '🟢 Driver Ditemukan';

            descEl.innerHTML =
            'Driver sedang menuju lokasi Anda.';

            break;

        case 'pickup':

            statusEl.innerHTML =
            '📍 Driver Menuju Jemput';

            descEl.innerHTML =
            'Driver hampir tiba.';

            break;

        case 'ontheway':

            statusEl.innerHTML =
            '🚕 Dalam Perjalanan';

            descEl.innerHTML =
            'Selamat menikmati perjalanan.';

            break;

        case 'completed':

            statusEl.innerHTML =
            '✅ Perjalanan Selesai';

            descEl.innerHTML =
            'Terima kasih telah menggunakan Ojek Hulu.';

            break;

        case 'cancel':

            statusEl.innerHTML =
            '❌ Order Dibatalkan';

            descEl.innerHTML =
            'Order telah dibatalkan.';

            break;

    }

}

/* ===========================
   BUTTON
=========================== */

document
.getElementById('btn-refresh')
.addEventListener('click',loadOrder);

/* ===========================
   INIT
=========================== */

loadOrder();

/* ===========================
   REALTIME
=========================== */

supabase
.channel('customer-order-status')

.on(
'postgres_changes',
{

event:'UPDATE',

schema:'public',

table:'orders'

},
(payload)=>{

    if(payload.new.customer_id!==user.id){

        return;

    }

    console.log('Realtime Update',payload);

    loadOrder();

})

.subscribe();
