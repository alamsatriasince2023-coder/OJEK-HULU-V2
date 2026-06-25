import { supabase } from './api.js';

/* ===========================
   STATE
=========================== */

let watchId = null;

let lastLatitude = null;

let lastLongitude = null;

/* ===========================
   START GPS
=========================== */

export function startGps(userId){

    if(!navigator.geolocation){

        console.warn('Browser tidak mendukung GPS.');

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

            const accuracy =
            position.coords.accuracy;

            /* ===========================
               CEGAH UPDATE DUPLIKAT
            =========================== */

            if(

                lastLatitude === latitude &&

                lastLongitude === longitude

            ){

                return;

            }

            lastLatitude = latitude;

            lastLongitude = longitude;

            console.log(
                'GPS',
                latitude,
                longitude,
                'Accuracy:',
                accuracy
            );

            const { error } =
            await supabase
            .from('drivers')
            .update({

                latitude,

                longitude,

                last_location:
                new Date().toISOString()

            })
            .eq('id',userId);

            if(error){

                console.error(
                    'GPS Update Error',
                    error
                );

            }

        },

        (err)=>{

            console.warn(
                'GPS Error',
                err
            );

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

        navigator.geolocation.clearWatch(
            watchId
        );

        watchId = null;

    }

    lastLatitude = null;

    lastLongitude = null;

}
