/* ===========================
   PWA REGISTER
=========================== */

if ("serviceWorker" in navigator) {

    window.addEventListener(

        "load",

        async()=>{

            try{

                const registration =

                await navigator.serviceWorker.register(

                    "/sw.js"

                );

                console.log(

                    "✅ Service Worker aktif"

                );

                registration.update();

            }

            catch(err){

                console.error(

                    "SW Error",

                    err

                );

            }

        }

    );

}

/* ===========================
   AUTO RELOAD
=========================== */

navigator.serviceWorker?.addEventListener(

    "controllerchange",

    ()=>{

        console.log(

            "🔄 Update aplikasi"

        );

        window.location.reload();

    }

);
