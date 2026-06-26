import { supabase } from './api.js';

/* ===========================
   STATE
=========================== */

let watchId = null;

let lastLatitude = null;

let lastLongitude = null;

function distanceMeters(

    lat1,
    lng1,
    lat2,
    lng2

){

    return Math.sqrt(

        Math.pow(

            lat1-lat2,

            2

        ) +

        Math.pow(

            lng1-lng2,

            2

        )

    ) * 111320;

}

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

           if(accuracy > 30){

                console.log(
            
                    "GPS belum akurat:",
            
                    accuracy
            
                );
            
                return;
            
            }

            /* ===========================
               CEGAH UPDATE DUPLIKAT
            =========================== */

            if(

                lastLatitude === latitude &&

                distanceMeters(

                    latitude,
            
                    longitude,
            
                    lastLatitude,
            
                    lastLongitude
            
                ) < 5

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
            
                    is_online: true,
            
                    last_location:
            
                    new Date().toISOString()
            
                })
            
                .eq('id', userId);
            
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
