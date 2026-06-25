import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {

    try {

        const { orderId } = await req.json();

        if (!orderId) {

            return new Response(
                JSON.stringify({
                    error: "orderId wajib diisi"
                }),
                {
                    status: 400
                }
            );

        }

        /* ===========================
           AMBIL ORDER
        =========================== */

        const {
            data: order,
            error: orderError
        } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

        if (orderError || !order) {

            return new Response(
                JSON.stringify({
                    error: "Order tidak ditemukan"
                }),
                {
                    status: 404
                }
            );

        }

        // lanjut Sprint 10.2

        return new Response(
            JSON.stringify({
                success: true,
                message: "Order berhasil dibaca",
                order
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (err) {

        return new Response(
            JSON.stringify({
                error: err.message
            }),
            {
                status: 500
            }
        );

    }

});
