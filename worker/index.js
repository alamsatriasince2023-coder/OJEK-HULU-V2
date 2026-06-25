export default {

    async fetch(request){

        const url = new URL(request.url);

        const q = url.searchParams.get("q");

        if(!q){

            return new Response(
                JSON.stringify({
                    error:"Parameter q wajib."
                }),
                {
                    status:400,
                    headers:{
                        "Content-Type":"application/json",
                        "Access-Control-Allow-Origin":"*"
                    }
                }
            );

        }

        const api =
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;

        const response =
        await fetch(api,{

            headers:{
                "User-Agent":"Ojek Hulu v2"
            }

        });

        const data =
        await response.text();

        return new Response(data,{

            headers:{
                "Content-Type":"application/json",
                "Access-Control-Allow-Origin":"*",
                "Cache-Control":"public,max-age=86400"
            }

        });

    }

}
