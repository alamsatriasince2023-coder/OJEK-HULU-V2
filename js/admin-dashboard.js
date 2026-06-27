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

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        customer,

        driver,

        active,

        completed,

        revenue,

        wallet

    ] = await Promise.all([

        supabase

        .from("profiles")

        .select("*",{

            count:"exact",

            head:true

        })

        .eq("role","customer"),

        supabase

        .from("drivers")

        .select("*",{

            count:"exact",

            head:true

        })

        .eq("is_online",true),

        supabase

        .from("orders")

        .select("*",{

            count:"exact",

            head:true

        })

        .in("status",[

            "offered",

            "accepted",

            "pickup",

            "ontheway"

        ]),

        supabase

        .from("orders")

        .select("*",{

            count:"exact",

            head:true

        })

        .eq("status","completed"),

        supabase

        .from("orders")

        .select("price")

        .eq("status","completed"),

        supabase

        .from("driver_wallets")

        .select("balance")

    ]);

    const totalRevenue =

    (revenue.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.price || 0),

        0

    );

    const totalWallet =

    (wallet.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.balance || 0),

        0

    );

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

    document.getElementById(

        "today-revenue"

    ).textContent =

    "Rp " +

    totalRevenue.toLocaleString("id-ID");

    document.getElementById(

        "wallet-total"

    ).textContent =

    "Rp " +

    totalWallet.toLocaleString("id-ID");

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

<b>${order.customer_name ?? "-"}</b>

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
.getElementById("btn-setting")
.addEventListener(
"click",
()=>{

location.href="system-settings.html";

}
);

/* ===========================
   FINANCIAL MENU
=========================== */

/* ===========================
DRIVER MANAGEMENT
=========================== */

document

.getElementById(

    "btn-driver"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "driver-management.html";

    }

);

/* ===========================
CUSTOMER MANAGEMENT
=========================== */

document

.getElementById(

    "btn-customer"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "customer-management.html";

    }

);


document

.getElementById(

    "btn-withdraw"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "withdraw.html";

    }

);

document

.getElementById(

"btn-finance"

)

?.addEventListener(

"click",

()=>{

location.href="finance-dashboard.html";

}

);

/* ===========================
WITHDRAW MANAGEMENT
=========================== */

document

.getElementById(

    "btn-withdraw-management"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "withdraw-management.html";

    }

);

/* ===========================
WALLET MANAGEMENT
=========================== */

document

.getElementById(

    "btn-wallet"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "wallet-management.html";

    }

);

/* ===========================
SYSTEM SETTINGS
=========================== */

document

.getElementById(

    "btn-system-settings"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "system-settings.html";

    }

);

/* ===========================
ANALYTICS DASHBOARD
=========================== */

document

.getElementById(

    "btn-analytics"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "analytics-dashboard.html";

    }

);

/* ===========================
AUDIT LOG
=========================== */

document

.getElementById(

    "btn-audit"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "audit-log.html";

    }

);

/* ===========================
NOTIFICATION CENTER
=========================== */

document

.getElementById(

    "btn-notification"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "notification-center.html";

    }

);

/* ===========================
FRAUD MONITOR
=========================== */

document

.getElementById(

    "btn-fraud"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "fraud-monitor.html";

    }

);

/* ===========================
ADMIN USER MANAGEMENT
=========================== */

document

.getElementById(

    "btn-admin-user"

)

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "admin-user-management.html";

    }

);

/* ===========================
ORDER MANAGEMENT
=========================== */

document

.getElementById("btn-order")

?.addEventListener(

    "click",

    ()=>{

        location.href =

        "order-management.html";

    }

);
