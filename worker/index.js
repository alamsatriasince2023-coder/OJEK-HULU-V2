export default {

    async fetch(request){

        const url = new URL(request.url);

        const headers = {

            "Content-Type":"application/json",

            "Access-Control-Allow-Origin":"*",

            "Cache-Control":"public,max-age=86400"

        };

        /* ===========================
           REVERSE GEOCODE
        =========================== */

        if(

            url.pathname === "/reverse"

        ){

            const lat =

            url.searchParams.get("lat");

            const lng =

            url.searchParams.get("lng");

            if(

                !lat ||

                !lng

            ){

                return new Response(

                    JSON.stringify({

                        error:"lat dan lng wajib."

                    }),

                    {

                        status:400,

                        headers

                    }

                );

            }

            const api =

`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

            const response =

            await fetch(

                api,

                {

                    headers:{

                        "User-Agent":"Ojek Hulu v2"

                    }

                }

            );

            const data =

            await response.text();

            return new Response(

                data,

                {

                    headers

                }

            );

        }

        /* ===========================
           SEARCH
        =========================== */

        const q =

        url.searchParams.get("q");

        if(!q){

            return new Response(

                JSON.stringify({

                    error:"Parameter q wajib."

                }),

                {

                    status:400,

                    headers

                }

            );

        }

        const api =

`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;

        const response =

        await fetch(

            api,

            {

                headers:{

                    "User-Agent":"Ojek Hulu v2"

                }

            }

        );

        const data =

        await response.text();

        return new Response(

            data,

            {

                headers

            }

        );

    }

}
