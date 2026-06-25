import {
    estimateTrip
} from './tariff.js';
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
   GPS
=========================== */


let tripEstimate = null;

/* ===========================
   ELEMENT
=========================== */

const form =
document.getElementById('order-form');

const btnLocation =
document.getElementById('btn-my-location');

const pickupInput =
document.getElementById('pickup');

document
.getElementById('pickup')
.addEventListener(
'input',
calculateEstimate
);

document
.getElementById('destination')
.addEventListener(
'input',
calculateEstimate
);

/* ===========================
   GPS CUSTOMER
=========================== */

btnLocation.addEventListener(
'click',
getCurrentLocation
);

function getCurrentLocation(){

    if(!navigator.geolocation){

        alert('Browser tidak mendukung GPS.');

        return;

    }

    btnLocation.disabled = true;
    btnLocation.innerHTML = 'Mengambil Lokasi...';

    navigator.geolocation.getCurrentPosition(

        (position)=>{

            const latitude =
            position.coords.latitude;
            
            const longitude =
            position.coords.longitude;

            pickupInput.value =
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            calculateEstimate();

            document
            .getElementById('destination')
            .focus();

            btnLocation.disabled = false;
            btnLocation.innerHTML =
            '📍 Gunakan Lokasi Saya';

        },

        ()=>{

            alert('Gagal mengambil lokasi.');

            btnLocation.disabled = false;

            btnLocation.innerHTML =
            '📍 Gunakan Lokasi Saya';

        },

        {

            enableHighAccuracy:true,
            timeout:10000

        }

    );

}

/* ===========================
   FORM
=========================== */

form.addEventListener(
'submit',
submitOrder
);

const estimateEl =
document.getElementById('estimate');

async function submitOrder(e){

    e.preventDefault();

    const pickup =
    pickupInput.value.trim();

    const destination =
    document
    .getElementById('destination')
    .value
    .trim();

    const notes =
    document
    .getElementById('notes')
    .value
    .trim();

    if(!pickup || !destination){

        alert('Lokasi wajib diisi.');

        return;

    }

   if(!tripEstimate){

       alert(
           'Silakan tunggu estimasi tarif selesai dihitung.'
       );
   
       return;
   
   }

    const btn =
    form.querySelector(
    'button[type="submit"]'
    );

    btn.disabled = true;

    btn.innerHTML = 'Mengirim...';


    const { data, error } =
    await supabase
    .from('orders')
    .insert({

       customer_id:user.id,
   
       nama:
       auth.profile.full_name ||
       user.email,
   
       jemput:pickup,
   
       tujuan:destination,
   
       catatan:notes,
   
       price:
       tripEstimate?.price || 0,
   
       pickup_latitude:
       tripEstimate?.pickupLat,
   
       pickup_longitude:
       tripEstimate?.pickupLng,
   
       destination_latitude:
       tripEstimate?.destinationLat,
   
       destination_longitude:
       tripEstimate?.destinationLng,
   
       status:'pending'
   
   })

    .select()
    .single();

    btn.disabled = false;

    btn.innerHTML =
    '🚕 Pesan Sekarang';

    if(error){

        alert(error.message);

        return;

    }

    location.href =
    `order-status.html?id=${data.id}`;

}

async function calculateEstimate(){

    const pickup =
    document
    .getElementById('pickup')
    .value
    .trim();

    const destination =
    document
    .getElementById('destination')
    .value
    .trim();

    if(
        !pickup ||
        !destination
    ){

        return;

    }

    try{

        estimateEl.innerHTML =
        'Menghitung...';

        tripEstimate =
        await estimateTrip(

            pickup,

            destination

        );

        estimateEl.innerHTML =

        'Rp ' +

        tripEstimate.price
        .toLocaleString('id-ID');

    }catch(err){

        console.error(err);
        tripEstimate = null;

        estimateEl.innerHTML =
        'Estimasi gagal';

    }

}
