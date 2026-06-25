import {
    initMap,
    updateCustomerLocation,
    updateDriverLocation,
    drawRoute
} from './map.js';

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

const statusEl =
document.getElementById('order-status');

const descEl =
document.getElementById('status-desc');

const driverEl =
document.getElementById('driver-name');

const vehicleEl =
document.getElementById('vehicle');

const plateEl =
document.getElementById('plate');

const pickupEl =
document.getElementById('pickup');

const destinationEl =
document.getElementById('destination');

const priceEl =
document.getElementById('price');

const distanceEl =
document.getElementById('route-distance');

const timeEl =
document.getElementById('route-time');

let currentDriverId = null;

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

    updateCustomerLocation(

        data.pickup_latitude,

        data.pickup_longitude

    );

    priceEl.textContent =
    'Rp ' +
    Number(data.price || 0)
    .toLocaleString('id-ID');

    driverEl.textContent =
    data.driver_name || '-';

    currentDriverId =
    data.driver_id;

    /* ===========================
       DRIVER
    =========================== */

    if(data.driver_id){

        const {

            data: driver,

            error: driverError

        } =
        await supabase
        .from('drivers')
        .select(`
            latitude,
            longitude,
            vehicle_type,
            vehicle_number
        `)
        .eq('id',data.driver_id)
        .single();

        if(driverError){

            console.error(driverError);

        }else if(driver){

            vehicleEl.textContent =
            driver.vehicle_type || '-';

            plateEl.textContent =
            driver.vehicle_number || '-';

            updateDriverLocation(

                driver.latitude,

                driver.longitude

            );

            drawRoute(

                driver.latitude,
            
                driver.longitude,
            
                data.pickup_latitude,
            
                data.pickup_longitude
            
            );

        }

    }else{

        vehicleEl.textContent='-';

        plateEl.textContent='-';

    }

    /* ===========================
       STATUS
    =========================== */

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
.addEventListener(
'click',
loadOrder
);

/* ===========================
   INIT
=========================== */

initMap();

await loadOrder();

/* ===========================
   REALTIME ORDER
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
async(payload)=>{

    if(payload.new.customer_id !== user.id){

        return;

    }

    await loadOrder();

})

.subscribe();

/* ===========================
   REALTIME DRIVER GPS
=========================== */

supabase
.channel('driver-location')

.on(
'postgres_changes',
{

    event:'UPDATE',

    schema:'public',

    table:'drivers'

},
(payload)=>{

    const driver = payload.new;

    if(driver.id !== currentDriverId){

        return;

    }

    if(

        driver.latitude != null &&

        driver.longitude != null

    ){

        updateDriverLocation(

            driver.latitude,

            driver.longitude

        );

    }

})

.subscribe();
