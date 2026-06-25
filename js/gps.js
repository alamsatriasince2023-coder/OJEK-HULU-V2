import { supabase } from './api.js';

let watchId = null;

/* ===========================
   START GPS
=========================== */

export function startGps(userId){

    if(!navigator.geolocation){

        alert('Browser tidak mendukung GPS.');

        return;

    }

    if(watchId !== null){

        return;

    }

    watchId = navigator.geolocation.watchPosition(

        async(position)=>{

            const latitude =
            position.coords.latitude;

            const longitude =
            position.coords.longitude;

            const { error } =
            await supabase
            .from('drivers')
            .update({

                latitude,

                longitude,

                last_location_at:
                new Date().toISOString()

            })
            .eq('id',userId);

            if(error){

                console.error(error);

            }

        },

        (err)=>{

            console.error(err);

            alert('GPS tidak dapat diakses.');

        },

        {

            enableHighAccuracy:true,

            timeout:10000,

            maximumAge:5000

        }

    );

}

/* ===========================
   STOP GPS
=========================== */

export function stopGps(){

    if(watchId !== null){

        navigator.geolocation.clearWatch(watchId);

        watchId = null;

    }

}
