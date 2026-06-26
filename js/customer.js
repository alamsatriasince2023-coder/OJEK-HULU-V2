import { supabase } from './api.js';
import {
    logoutUser
} from './auth.js';
import {
    requireRole
} from './rbac.js';

/* ===========================
   AUTH
=========================== */

const auth = await requireRole('customer');

if(!auth){

    throw new Error('Akses ditolak');

}

const user = auth.user;
const profile = auth.profile;

/* ===========================
   HEADER
=========================== */

document.getElementById('welcome').textContent =
`Halo, ${profile.full_name || user.email}`;

/* ===========================
   MENU
=========================== */

document
.getElementById('btn-order')
.addEventListener('click',()=>{

    location.href = 'order-map.html';

});

document
.getElementById('btn-history')
.addEventListener('click',()=>{

    location.href='customer-history.html';

});

document
.getElementById('btn-profile')
.addEventListener('click',()=>{

    location.href='profile.html';

});

document
.getElementById('btn-logout')
.addEventListener('click',async()=>{

    await logoutUser();

    localStorage.clear();

    sessionStorage.clear();

    location.replace('index.html');

});

/* ===========================
   ORDER AKTIF
=========================== */

async function loadActiveOrder(){

    const { data, error } =
    await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .in('status',[
        'pending',
        'offered',
        'accepted',
        'pickup',
        'ontheway'
    ])
    .order('id',{ascending:false})
    .limit(1)
    .maybeSingle();

    if(error){

        console.error(error);

        return;

    }

    const card =
    document.getElementById(
        'active-order-card'
    );

    if(!data){

        card.style.display='none';

        return;

    }

    card.style.display='block';

    let status = '';

    switch(data.status){

        case 'pending':

            status =
            '🟡 Menunggu Driver';

            break;

        case 'offered':

            status =
            '📡 Menghubungi Driver';

            break;

        case 'accepted':

            status =
            '🟢 Driver Ditemukan';

            break;

        case 'pickup':

            status =
            '📍 Driver Menuju Jemput';

            break;

        case 'ontheway':

            status =
            '🚕 Dalam Perjalanan';

            break;

        default:

            status =
            data.status;

    }

    document
    .getElementById('active-status')
    .textContent = status;

    document
    .getElementById('active-driver')
    .textContent =
    data.driver_name || '-';

    window.currentOrder = data;

    loadDriverLocation(data.driver_id);

}

/* ===========================
   REALTIME
=========================== */

supabase
.channel('customer-active-order')

.on(
'postgres_changes',
{

    event:'*',

    schema:'public',

    table:'orders'

},
(payload)=>{

    if(
        payload.new?.customer_id === user.id ||
        payload.old?.customer_id === user.id
    ){

        loadActiveOrder();

    }

})

.subscribe();

/* ===========================
   BUTTON STATUS
=========================== */

document
.getElementById('btn-active-order')
.addEventListener('click',()=>{

   location.href = 'order-map.html';

});

/* ===========================
   INIT
=========================== */

await loadActiveOrder();

/* ===========================
   LIVE DRIVER LOCATION
=========================== */

let driverChannel;

let driverMarker;

async function loadDriverLocation(driverId){

    if(!driverId) return;

    const { data } =
    await supabase
    .from('drivers')
    .select('latitude,longitude,is_online')
    .eq('id',driverId)
    .single();

    if(!data) return;

    if(
        !data.latitude ||
        !data.longitude
    ) return;

    const latlng = [

        data.latitude,

        data.longitude

    ];

    if(!driverMarker){

        driverMarker =

        L.marker(latlng)

        .addTo(map)

        .bindPopup("🚕 Driver");

    }

    else{

        driverMarker.setLatLng(latlng);

        if(window.routingControl){

            window.routingControl.setWaypoints([
        
                L.latLng(
        
                    payload.new.latitude,
        
                    payload.new.longitude
        
                ),
        
                L.latLng(
        
                    window.pickupLat,
        
                    window.pickupLng
        
                )
        
            ]);
        
        }

    }

    map.flyTo(

        latlng,
    
        map.getZoom(),
    
        {
    
            animate:true,
    
            duration:1
    
        }
    
    );

}

/* ===========================
   REALTIME DRIVER GPS
=========================== */

driverChannel?.unsubscribe();

driverChannel =
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

    if(

        payload.new.id===
    
        window.currentOrder?.driver_id
    
    ){
    
        const latlng=[
    
            payload.new.latitude,
    
            payload.new.longitude
    
        ];
    
        if(driverMarker){
    
            driverMarker.setLatLng(latlng);

            if(window.routingControl){

                window.routingControl.setWaypoints([
            
                    L.latLng(
            
                        payload.new.latitude,
            
                        payload.new.longitude
            
                    ),
            
                    L.latLng(
            
                        window.pickupLat,
            
                        window.pickupLng
            
                    )
            
                ]);
            
            }
    
        }
    
        map.flyTo(

            latlng,
        
            map.getZoom(),
        
            {
        
                animate:true,
        
                duration:1
        
            }
        
        );
    
    }

})

.subscribe();
