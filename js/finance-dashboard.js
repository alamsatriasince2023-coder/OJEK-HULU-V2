import { requireRole } from "./rbac.js";
import { supabase } from "./api.js";

const auth = await requireRole("admin");

if(!auth){

    throw new Error("Akses ditolak");

}

document.getElementById(
    "finance-admin-name"
).textContent =
auth.profile.full_name;

init();

async function init(){

    await loadSummary();

    await loadTransactionList();

    await loadWithdrawList();

    await loadIncomeList();

    subscribeRealtime();

}

/* ===========================
SUMMARY
=========================== */

async function loadSummary(){

    await Promise.all([

        loadTodayRevenue(),

        loadMonthRevenue(),

        loadWithdraw(),

        loadPlatformIncome(),

        loadDriverWallet(),

        loadCustomerWallet(),

        loadFinancialSummary()

    ]);

}

/* ===========================
TODAY REVENUE
=========================== */

async function loadTodayRevenue(){

    const today =
    new Date()
    .toISOString()
    .substring(0,10);

    const { data } =
    await supabase

    .from("orders")

    .select("price")

    .eq("status","completed")

    .gte("completed_at",today);

    const total =

    (data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.price || 0),

        0

    );

    document.getElementById(
        "today-revenue"
    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

}

/* ===========================
MONTH REVENUE
=========================== */

async function loadMonthRevenue(){

    const now =
    new Date();

    const month =

    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;

    const { data } =
    await supabase

    .from("orders")

    .select("price")

    .eq("status","completed")

    .gte("completed_at",month);

    const total =

    (data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.price || 0),

        0

    );

    document.getElementById(
        "month-revenue"
    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

}

/* ===========================
WITHDRAW
=========================== */

async function loadWithdraw(){

    const { data } =
    await supabase

    .from("withdraw_requests")

    .select("amount")

    .eq("status","SUCCESS");

    const total =

    (data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.amount || 0),

        0

    );

    document.getElementById(
        "today-withdraw"
    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

}

/* ===========================
PLATFORM INCOME
=========================== */

async function loadPlatformIncome(){

    const { data } =
    await supabase

    .from("platform_income")

    .select("platform_fee");

    const total =

    (data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.platform_fee || 0),

        0

    );

    document.getElementById(

        "platform-income"

    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

}

/* ===========================
DRIVER WALLET
=========================== */

async function loadDriverWallet(){

    const { data } =
    await supabase

    .from("driver_wallets")

    .select("balance");

    const total =

    (data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.balance || 0),

        0

    );

    document.getElementById(

        "driver-wallet"

    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

}

/* ===========================
CUSTOMER WALLET
=========================== */

async function loadCustomerWallet(){

    document.getElementById(

        "customer-wallet"

    ).textContent =

    "Coming Soon";

}

/* ===========================
FINANCIAL SUMMARY
=========================== */

async function loadFinancialSummary(){

    const { count } =
    await supabase

    .from("orders")

    .select("*",{

        head:true,

        count:"exact"

    });

    document.getElementById(

        "total-order"

    ).textContent =

    count || 0;

    document.getElementById(

        "total-topup"

    ).textContent =

    "Coming Soon";

    document.getElementById(

        "platform-fee"

    ).textContent =

    document.getElementById(

        "platform-income"

    ).textContent;

}

/* ===========================
TRANSACTION LIST
=========================== */

async function loadTransactionList(){

    const { data } =
    await supabase

    .from("wallet_transactions")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(10);

    const box =

    document.getElementById(

        "transaction-list"

    );

    if(!data || data.length===0){

        return;

    }

    box.innerHTML =

    data.map(item=>`

<div class="promo-card">

<b>${item.type}</b>

<br>

Rp ${Number(item.amount).toLocaleString("id-ID")}

<br>

${item.description || "-"}

</div>

`).join("");

}

/* ===========================
WITHDRAW LIST
=========================== */

async function loadWithdrawList(){

    const { data } =
    await supabase

    .from("withdraw_requests")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(10);

    const box =

    document.getElementById(

        "withdraw-list"

    );

    if(!data || data.length===0){

        return;

    }

    box.innerHTML =

    data.map(item=>`

<div class="promo-card">

<b>

Rp ${Number(item.amount).toLocaleString("id-ID")}

</b>

<br>

${item.bank_name}

<br>

${item.status}

</div>

`).join("");

}

/* ===========================
PLATFORM LIST
=========================== */

async function loadIncomeList(){

    const { data } =
    await supabase

    .from("platform_income")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(10);

    const box =

    document.getElementById(

        "income-list"

    );

    if(!data || data.length===0){

        return;

    }

    box.innerHTML =

    data.map(item=>`

<div class="promo-card">

<b>

Rp ${Number(item.platform_fee).toLocaleString("id-ID")}

</b>

<br>

Order :

${item.order_id}

</div>

`).join("");

}

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("finance-dashboard")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"orders"

        },

        async()=>{

            await loadSummary();

            await loadTransactionList();

            await loadWithdrawList();

            await loadIncomeList();

        }

    )

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"withdraw_requests"

        },

        async()=>{

            await loadSummary();

            await loadWithdrawList();

        }

    )

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"platform_income"

        },

        async()=>{

            await loadSummary();

            await loadIncomeList();

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

.getElementById("btn-wallet")

.addEventListener(

    "click",

    ()=>{

        location.href="wallet.html";

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

        "withdraw-management.html";

    }

);

document

.getElementById("btn-business")

.addEventListener(

    "click",

    ()=>{

        location.href="business.html";

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
