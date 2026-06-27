import { requireRole } from "./rbac.js";
import { logoutUser } from "./auth.js";
import { supabase } from "./api.js";

const auth = await requireRole("admin");

if(!auth){

    throw new Error("Akses ditolak");

}

document.getElementById(

    "admin-name"

).textContent =

auth.profile.full_name;

init();

async function init(){

    await loadStatistic();

    await loadOrders();

    subscribeRealtime();

}

/* ===========================
   STATISTIK
=========================== */

async function loadStatistic(){

    const [

        customer,

        driver,

        active,

        completed

    ] = await Promise.all([

        supabase
        .from("profiles")
        .select("*",{count:"exact",head:true})
        .eq("role","customer"),

        supabase
        .from("drivers")
        .select("*",{count:"exact",head:true})
        .eq("is_online",true),

        supabase
        .from("orders")
        .select("*",{count:"exact",head:true})
        .in("status",[

            "offered",

            "accepted",

            "pickup",

            "ontheway"

        ]),

        supabase
        .from("orders")
        .select("*",{count:"exact",head:true})
        .eq("status","completed")

    ]);

    document.getElementById(

        "total-customer"

    ).textContent =

    customer.count || 0;

    document.getElementById(

        "driver-online"

    ).textContent =

    driver.count || 0;

    document.getElementById(

        "order-active"

    ).textContent =

    active.count || 0;

    document.getElementById(

        "order-complete"

    ).textContent =

    completed.count || 0;

}

/* ===========================
   ORDER LIST
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

    )

    .limit(10);

    if(error){

        console.error(error);

        return;

    }

    const list =

    document.getElementById(

        "order-list"

    );

    if(!data || data.length===0){

        list.innerHTML =

        "<p>Belum ada order.</p>";

        return;

    }

    list.innerHTML =

    data.map(order=>`

<div class="promo-card">

<b>${order.nama ?? "-"}</b>

<br>

🚕 ${order.driver_name ?? "Belum ada driver"}

<br>

📦 ${order.status}

<br>

💰 Rp ${Number(order.price || 0).toLocaleString("id-ID")}

</div>

`).join("");

}

/* ===========================
   REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel(

        "admin-dashboard"

    )

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
   LOGOUT
=========================== */

document

.getElementById(

    "btn-logout"

)

.addEventListener(

    "click",

    async()=>{

        if(

            !confirm(

                "Logout Admin?"

            )

        ){

            return;

        }

        await logoutUser();

        localStorage.clear();

        sessionStorage.clear();

        location.replace(

            "index.html"

        );

    }

);

document
.getElementById("btn-home")
.addEventListener(
"click",
()=>{

location.reload();

}
);

document
.getElementById("btn-monitor")
.addEventListener(
"click",
()=>{

alert("Monitoring segera hadir.");

}
);

document
.getElementById("btn-setting")
.addEventListener(
"click",
()=>{

alert("Pengaturan segera hadir.");

}
);

/* ===========================
   FINANCIAL MENU
=========================== */

document
.getElementById("btn-driver")
?.addEventListener(
"click",
()=>{

    alert("🚕 Manajemen Driver - Segera Hadir");

}
);

document
.getElementById("btn-customer")
?.addEventListener(
"click",
()=>{

    alert("👥 Manajemen Customer - Segera Hadir");

}
);

document
.getElementById("btn-order")
?.addEventListener(
"click",
()=>{

    alert("📦 Manajemen Order - Segera Hadir");

}
);

document
.getElementById("btn-wallet")
?.addEventListener(
"click",
()=>{

    alert("💰 Wallet Driver - Segera Hadir");

}
);

document
.getElementById("btn-withdraw")
?.addEventListener(
"click",
()=>{

    alert("💸 Withdraw Driver - Segera Hadir");

}
);

document
.getElementById("btn-finance")
?.addEventListener(
"click",
()=>{

    alert("📊 Finance Dashboard - Segera Hadir");

}
);

document
.getElementById("btn-business")
?.addEventListener(
"click",
()=>{

    location.href = "business.html";

}
);

document
.getElementById("btn-report")
?.addEventListener(
"click",
()=>{

    alert("📈 Financial Report - Segera Hadir");

}
);
