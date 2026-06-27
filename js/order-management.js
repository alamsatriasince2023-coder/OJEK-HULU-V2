import { requireRole } from "./rbac.js";
import { supabase } from "./api.js";

const auth = await requireRole("admin");

if(!auth){

    throw new Error("Akses ditolak");

}

document.getElementById(

    "admin-name"

).textContent =

auth.profile.full_name;

let selectedOrder = null;

let allOrders = [];

init();

async function init(){

    await loadStatistic();

    await loadOrders();

    initSearch();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        total,

        running,

        completed,

        cancelled

    ] = await Promise.all([

        supabase

        .from("orders")

        .select("*",{

            head:true,

            count:"exact"

        }),

        supabase

        .from("orders")

        .select("*",{

            head:true,

            count:"exact"

        })

        .in("status",[

            "waiting",

            "accepted",

            "pickup",

            "ongoing"

        ]),

        supabase

        .from("orders")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("status","completed"),

        supabase

        .from("orders")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("status","cancelled")

    ]);

    document.getElementById(

        "total-order"

    ).textContent =

    total.count || 0;

    document.getElementById(

        "running-order"

    ).textContent =

    running.count || 0;

    document.getElementById(

        "completed-order"

    ).textContent =

    completed.count || 0;

    document.getElementById(

        "cancel-order"

    ).textContent =

    cancelled.count || 0;

}

/* ===========================
LOAD ORDER
=========================== */

async function loadOrders(){

    const { data, error } =

    await supabase

    .from("orders")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    );

    if(error){

        console.error(error);

        return;

    }

    allOrders = data || [];

    renderOrders(allOrders);

}

/* ===========================
SEARCH
=========================== */

function initSearch(){

    document

    .getElementById(

        "search-order"

    )

    .addEventListener(

        "input",

        e=>{

            const keyword =

            e.target.value

            .toLowerCase()

            .trim();

            if(!keyword){

                renderOrders(allOrders);

                return;

            }

            const filtered =

            allOrders.filter(order=>

                String(order.id)

                .toLowerCase()

                .includes(keyword)

                ||

                String(order.customer_name || "")

                .toLowerCase()

                .includes(keyword)

                ||

                String(order.driver_name || "")

                .toLowerCase()

                .includes(keyword)

            );

            renderOrders(filtered);

        }

    );

}

/* ===========================
RENDER ORDER
=========================== */

function renderOrders(data){

    const list =

    document.getElementById(

        "order-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada order.</p>";

        return;

    }

    list.innerHTML =

    data.map(order=>`

<div
class="promo-card order-item"
data-id="${order.id}">

<b>

${order.customer_name || "Customer"}

</b>

<br>

🚕 ${order.driver_name || "-"}

<br>

💰 Rp ${Number(order.price || 0).toLocaleString("id-ID")}

<br>

📌 ${order.status}

</div>

`).join("");

    document

    .querySelectorAll(".order-item")

    .forEach(el=>{

        el.onclick=()=>{

            selectedOrder =

            data.find(

                x=>x.id===el.dataset.id

            );

            showDetail(selectedOrder);

        };

    });

}

/* ===========================
DETAIL
=========================== */

function showDetail(order){

    if(!order) return;

    document.getElementById("detail-id").textContent =
    order.id;

    document.getElementById("detail-status").textContent =
    order.status;

    document.getElementById("detail-customer").textContent =
    order.customer_name || "-";

    document.getElementById("detail-driver").textContent =
    order.driver_name || "-";

    document.getElementById("detail-pickup").textContent =
    order.pickup_address || "-";

    document.getElementById("detail-destination").textContent =
    order.destination_address || "-";

    document.getElementById("detail-price").textContent =
    "Rp " +
    Number(order.price || 0).toLocaleString("id-ID");

    document.getElementById("detail-payment").textContent =
    order.payment_method || "-";

}

/* ===========================
LIVE TRACKING
=========================== */

document

.getElementById("btn-track")

.addEventListener(

    "click",

    ()=>{

        if(!selectedOrder){

            alert("Pilih order.");

            return;

        }

        location.href =

        `order-map.html?id=${selectedOrder.id}`;

    }

);

/* ===========================
TIMELINE
=========================== */

document

.getElementById("btn-history")

.addEventListener(

    "click",

    ()=>{

        if(!selectedOrder){

            alert("Pilih order.");

            return;

        }

        location.href =

        `order-status.html?id=${selectedOrder.id}`;

    }

);

/* ===========================
CANCEL ORDER
=========================== */

document

.getElementById("btn-cancel")

.addEventListener(

    "click",

    async()=>{

        if(!selectedOrder){

            alert("Pilih order.");

            return;

        }

        const { error } =

        await supabase

        .from("orders")

        .update({

            status:"cancelled"

        })

        .eq(

            "id",

            selectedOrder.id

        );

        if(error){

            alert(error.message);

            return;

        }

        alert("Order berhasil dibatalkan.");

        await loadStatistic();

        await loadOrders();

    }

);

/* ===========================
REFUND
=========================== */

document

.getElementById("btn-refund")

.addEventListener(

    "click",

    ()=>{

        if(!selectedOrder){

            alert("Pilih order.");

            return;

        }

        alert(

            "Refund Engine akan terhubung ke Wallet Engine."

        );

    }

);

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("order-management")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"orders"

        },

        async()=>{

            await loadStatistic();

            await loadOrders();

        }

    )

    .subscribe();

}

/* ===========================
MENU
=========================== */

document.getElementById("btn-home")
.addEventListener("click",()=>location.reload());

document.getElementById("btn-driver")
.addEventListener("click",()=>location.href="driver-management.html");

document.getElementById("btn-customer")
.addEventListener("click",()=>location.href="customer-management.html");

document.getElementById("btn-back")
.addEventListener("click",()=>location.href="admin-dashboard.html");
