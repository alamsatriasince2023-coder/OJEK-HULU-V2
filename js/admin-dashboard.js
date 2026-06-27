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

    await loadBusinessHealth();

    await loadStatistic();

    await loadCustomerTable();

    initCustomerSearch();

    await loadDriverTable();

    initDriverSearch();

    await loadOrders();

    subscribeRealtime();

}

/* ===========================
BUSINESS HEALTH
=========================== */

async function loadBusinessHealth(){

    const today =

    new Date()

    .toISOString()

    .substring(0,10);

    const [

        customer,

        driver,

        order,

        revenue,

        rating

    ] = await Promise.all([

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","customer"),

        supabase

        .from("drivers")

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

        .gte("created_at",today),

        supabase

        .from("orders")

        .select("price")

        .eq("status","completed")

        .gte("completed_at",today),

        supabase

        .from("driver_ratings")

        .select("rating")

    ]);

    const totalRevenue =

    (revenue.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.price || 0),

        0

    );

    const ratings =

    rating.data || [];

    const avgRating =

    ratings.length

    ?

    (

        ratings.reduce(

            (sum,row)=>

            sum + Number(row.rating || 0),

            0

        )

        /

        ratings.length

    ).toFixed(2)

    :

    "5.00";

    const growth =

    customer.count > 0

    ?

    (

        (

            order.count ||

            0

        )

        /

        customer.count

        *

        100

    ).toFixed(1)

    :

    "0.0";

    document.getElementById(

        "bh-customer"

    ).textContent =

    customer.count || 0;

    document.getElementById(

        "bh-driver"

    ).textContent =

    driver.count || 0;

    document.getElementById(

        "bh-order"

    ).textContent =

    order.count || 0;

    document.getElementById(

        "bh-revenue"

    ).textContent =

    "Rp " +

    totalRevenue.toLocaleString("id-ID");

    document.getElementById(

        "bh-rating"

    ).textContent =

    avgRating;

    document.getElementById(

        "bh-growth"

    ).textContent =

    growth + "%";

}

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
CUSTOMER TABLE
=========================== */

/* ===========================
CUSTOMER TABLE
=========================== */

async function loadCustomerTable(){


    const {

        data,

        error,

        count

    } = await supabase

    .from("profiles")

    .select("*",{

        count:"exact"

    })

    .eq("role","customer")

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(10);

   

    if(error){

        console.error(

            "CUSTOMER QUERY ERROR:",

            error

        );

        document.getElementById(

            "customer-count"

        ).textContent="0";

        document.getElementById(

            "customer-table"

        ).innerHTML=

       

        `<div class="alert alert-danger">

        ${error.message}

        </div>`;

        return;

    }

    document.getElementById(

        "customer-count"

    ).textContent=

    count || 0;

    if(!data || data.length===0){

        document.getElementById(

            "customer-table"

        ).innerHTML=

        `

        <div class="text-center"

        style="padding:20px;color:#888;">

        Belum ada customer ditemukan

        </div>

        `;

        return;

    }

    document.getElementById(

        "customer-table"

    ).innerHTML=

    `

    <table class="table">

    <thead>

    <tr>

    <th>Nama</th>

    <th>HP</th>

    <th>Status</th>

    <th>Join</th>

    </tr>

    </thead>

    <tbody>

    ${data.map(c=>`

    <tr>

    <td>

    ${c.full_name ?? "-"}

    </td>

    <td>

    ${c.phone ?? "-"}

    </td>

    <td>

    ${c.is_active===false

        ? "🔴 Suspend"

        : "🟢 Aktif"}

    </td>

    <td>

    ${c.created_at

        ? new Date(c.created_at)

        .toLocaleDateString("id-ID")

        : "-"}

    </td>

    </tr>

    `).join("")}

    </tbody>

    </table>

    `;

}

/* ===========================
SEARCH CUSTOMER
=========================== */

function initCustomerSearch(){

    const input = document.getElementById(
        "customer-search"
    );

    if(!input) return;

    input.oninput = function(){

        const keyword =
        this.value
        .trim()
        .toLowerCase();

        document
        .querySelectorAll(
            "#customer-table tbody tr"
        )
        .forEach(tr=>{

            tr.style.display =
            tr.innerText
            .toLowerCase()
            .includes(keyword)

            ? ""

            : "none";

        });

    };

}

/* ===========================
DRIVER TABLE
=========================== */

async function loadDriverTable(){

    const [

        { count },

        { data: drivers },

        { data: profiles }

    ] = await Promise.all([

        supabase

        .from("drivers")

        .select("*",{

            head:true,

            count:"exact"

        }),

        supabase

        .from("drivers")

        .select("id,is_online,rating,total_trip,created_at")

        .order(

            "created_at",

            {

                ascending:false

            }

        )

        .limit(10),

        supabase

        .from("profiles")

        .select("id,full_name,phone")

        .eq("role","driver")

    ]);

    document.getElementById(

        "driver-count"

    ).textContent =

    count || 0;

    const profileMap = new Map(

        (profiles || []).map(p => [

            p.id,

            p

        ])

    );

    document.getElementById(

        "driver-table"

    ).innerHTML =

    `
    <table class="table">

    <thead>

    <tr>

    <th>Nama</th>

    <th>HP</th>

    <th>Status</th>

    <th>⭐</th>

    <th>Join</th>

    </tr>

    </thead>

    <tbody>

    ${(drivers || []).map(d=>{

        const p = profileMap.get(d.id) || {};

        return `

        <tr>

        <td>

        ${p.full_name || "-"}

        </td>

        <td>

        ${p.phone || "-"}

        </td>

        <td>

        ${d.is_online

            ? "🟢 Online"

            : "⚫ Offline"}

        </td>

        <td>

        ${(Number(d.rating || 0)).toFixed(1)}

        </td>

        <td>

        ${new Date(

            d.created_at

        ).toLocaleDateString("id-ID")}

        </td>

        </tr>

        `;

    }).join("")}

    </tbody>

    </table>

    `;

}

/* ===========================
SEARCH DRIVER
=========================== */

function initDriverSearch(){

    const input = document.getElementById(
        "driver-search"
    );

    if(!input) return;

    input.oninput = function(){

        const keyword =
        this.value
        .trim()
        .toLowerCase();

        document
        .querySelectorAll(
            "#driver-table tbody tr"
        )
        .forEach(tr=>{

            tr.style.display =
            tr.innerText
            .toLowerCase()
            .includes(keyword)

            ? ""

            : "none";

        });

    };

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

            await loadBusinessHealth();
            await loadStatistic();
            await loadCustomerTable();
            await loadDriverTable();
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
