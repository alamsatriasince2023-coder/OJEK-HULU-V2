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

init();

async function init(){

    await loadDashboard();

    await loadTopDriver();

    await loadTopCustomer();

    await loadBusinessSummary();

    subscribeRealtime();

}

/* ===========================
DASHBOARD
=========================== */

async function loadDashboard(){

    const [

        revenue,

        orders,

        customers,

        drivers

    ] = await Promise.all([

        supabase

        .from("orders")

        .select("price")

        .eq("status","completed"),

        supabase

        .from("orders")

        .select("*",{

            head:true,

            count:"exact"

        }),

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

        })

    ]);

    const totalRevenue =

    (revenue.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.price || 0),

        0

    );

    document.getElementById(

        "kpi-revenue"

    ).textContent =

    "Rp " +

    totalRevenue.toLocaleString("id-ID");

    document.getElementById(

        "kpi-orders"

    ).textContent =

    orders.count || 0;

    document.getElementById(

        "kpi-customers"

    ).textContent =

    customers.count || 0;

    document.getElementById(

        "kpi-drivers"

    ).textContent =

    drivers.count || 0;

}

/* ===========================
TOP DRIVER
=========================== */

async function loadTopDriver(){

    const { data } =

    await supabase

    .from("drivers")

    .select("id,nama,name,rating")

    .order("rating",{ascending:false})

    .limit(10);

    const list =

    document.getElementById(

        "top-driver-list"

    );

    if(!data || data.length===0){

        return;

    }

    list.innerHTML =

    data.map(driver=>`

<div class="promo-card">

<b>

${driver.nama || driver.name || "-"}

</b>

<br>

⭐ ${Number(driver.rating || 0).toFixed(1)}

</div>

`).join("");

}

/* ===========================
TOP CUSTOMER
=========================== */

async function loadTopCustomer(){

    const { data } =

    await supabase

    .from("profiles")

    .select("full_name")

    .eq("role","customer")

    .limit(10);

    const list =

    document.getElementById(

        "top-customer-list"

    );

    if(!data || data.length===0){

        return;

    }

    list.innerHTML =

    data.map(customer=>`

<div class="promo-card">

<b>

${customer.full_name}

</b>

</div>

`).join("");

}

/* ===========================
BUSINESS SUMMARY
=========================== */

async function loadBusinessSummary(){

    const [

        completed,

        cancelled,

        withdraw,

        income

    ] = await Promise.all([

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

        .eq("status","cancelled"),

        supabase

        .from("withdraw_requests")

        .select("amount"),

        supabase

        .from("platform_income")

        .select("platform_fee")

    ]);

    document.getElementById(

        "completed-orders"

    ).textContent =

    completed.count || 0;

    document.getElementById(

        "cancel-orders"

    ).textContent =

    cancelled.count || 0;

    const totalWithdraw =

    (withdraw.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.amount || 0),

        0

    );

    document.getElementById(

        "total-withdraw"

    ).textContent =

    "Rp " +

    totalWithdraw.toLocaleString("id-ID");

    const totalIncome =

    (income.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.platform_fee || 0),

        0

    );

    document.getElementById(

        "platform-income"

    ).textContent =

    "Rp " +

    totalIncome.toLocaleString("id-ID");

}

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("analytics-dashboard")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"orders"

        },

        async()=>{

            await loadDashboard();

            await loadBusinessSummary();

        }

    )

    .subscribe();

}

/* ===========================
MENU
=========================== */

document

.getElementById("btn-home")

.addEventListener(

    "click",

    ()=>{

        location.reload();

    }

);

document

.getElementById("btn-finance")

.addEventListener(

    "click",

    ()=>{

        location.href="finance-dashboard.html";

    }

);

document

.getElementById("btn-driver")

.addEventListener(

    "click",

    ()=>{

        location.href="driver-management.html";

    }

);

document

.getElementById("btn-back")

.addEventListener(

    "click",

    ()=>{

        location.href="admin-dashboard.html";

    }

);
