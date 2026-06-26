const CACHE_NAME = "ojek-hulu-v3";

const FILES = [

    "/",

    "/index.html",

    "/login.html",

    "/register.html",

    "/customer.html",

    "/customer-history.html",

    "/driver-dashboard.html",

    "/driver-register.html",

    "/order-map.html",

    "/order-status-map.html",

    "/profile.html",

    "/offline.html",

    "/css/style.css",

    "/manifest.webmanifest",

    "/assets/icons/icon-192.png",

    "/assets/icons/icon-512.png",

    "/assets/icons/maskable-512.png",

    "/assets/images/logo.png",

    "/assets/images/banner.png",

    "/assets/images/splash.png",

    "/js/api.js",

    "/js/auth.js",

    "/js/rbac.js",

    "/js/customer.js",

    "/js/order-map.js",

    "/js/order-status-map.js",

    "/js/tariff.js",

    "/js/assign-driver.js",

    "/js/pwa.js"

];

/* ===========================
   INSTALL
=========================== */

self.addEventListener(

    "install",

    event=>{

        self.skipWaiting();

        event.waitUntil(

            caches
            .open(CACHE_NAME)
            .then(cache=>cache.addAll(FILES))

        );

    }

);

/* ===========================
   ACTIVATE
=========================== */

self.addEventListener(

    "activate",

    event=>{

        event.waitUntil(

            caches.keys()

            .then(keys=>{

                return Promise.all(

                    keys.map(key=>{

                        if(

                            key !== CACHE_NAME

                        ){

                            console.log(

                                "Delete Cache:",

                                key

                            );

                            return caches.delete(key);

                        }

                    })

                );

            })

            .then(()=>{

                return self.clients.claim();

            })

        );

    }

);

/* ===========================
   FETCH
=========================== */

self.addEventListener(

    "fetch",

    event=>{

        if(event.request.method !== "GET"){

            return;

        }

        // Jangan cache request Supabase
        if(

            event.request.url.includes("supabase.co") ||

            event.request.url.includes("/auth/") ||

            event.request.url.includes("/rest/v1/")

        ){

            return;

        }

        event.respondWith(

            caches.match(event.request)

            .then(cached=>{

                if(cached){

                    return cached;

                }

                return fetch(event.request)

                .then(response=>{
                
                    // Jangan cache redirect
                    if(response.redirected){
                
                        return response;
                
                    }
                
                    // Jangan cache response error
                    if(!response.ok){
                
                        return response;
                
                    }
                
                    // Cache hanya file dari origin sendiri
                    if(response.type === "basic"){
                
                        const clone = response.clone();
                
                        caches.open(CACHE_NAME)
                
                        .then(cache=>{
                
                            cache.put(
                
                                event.request,
                
                                clone
                
                            );
                
                        });
                
                    }
                
                    return response;
                
                });

            })

            .catch(()=>{

                if(

                    event.request.mode==="navigate"

                ){

                    return caches.match(

                        "/offline.html"

                    );

                }

            })

        );

    }

);
