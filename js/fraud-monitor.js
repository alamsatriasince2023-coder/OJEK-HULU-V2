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

let selectedFraud = null;

init();

async function init(){

    await loadStatistic();

    await loadFraud();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        total,

        critical,

        resolved,

        suspended

    ] = await Promise.all([

        supabase

        .from("fraud_logs")

        .select("*",{

            head:true,

            count:"exact"

        }),

        supabase

        .from("fraud_logs")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("level","CRITICAL"),

        supabase

        .from("fraud_logs")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("status","RESOLVED"),

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("is_active",false)

    ]);

    document.getElementById(

        "total-alert"

    ).textContent =

    total.count || 0;

    document.getElementById(

        "critical-alert"

    ).textContent =

    critical.count || 0;

    document.getElementById(

        "resolved-alert"

    ).textContent =

    resolved.count || 0;

    document.getElementById(

        "suspend-user"

    ).textContent =

    suspended.count || 0;

}

/* ===========================
LOAD FRAUD
=========================== */

async function loadFraud(){

    const { data, error } =

    await supabase

    .from("fraud_logs")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(50);

    if(error){

        console.error(error);

        return;

    }

    renderFraud(

        data || []

    );

}

/* ===========================
RENDER FRAUD
=========================== */

function renderFraud(data){

    const list =

    document.getElementById(

        "fraud-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada fraud alert.</p>";

        return;

    }

    list.innerHTML =

    data.map(item=>`

<div
class="promo-card fraud-item"
data-id="${item.id}">

<b>

${item.fraud_type || "-"}

</b>

<br>

👤 ${item.user_name || item.user_id}

<br>

🚨 ${item.level}

<br>

✅ ${item.status}

</div>

`).join("");

    document

    .querySelectorAll(".fraud-item")

    .forEach(el=>{

        el.onclick=()=>{

            selectedFraud =

            data.find(

                x=>x.id===el.dataset.id

            );

            showDetail(selectedFraud);

        };

    });

}

/* ===========================
DETAIL
=========================== */

function showDetail(item){

    if(!item) return;

    document.getElementById(

        "detail-user"

    ).textContent =

    item.user_name ||

    item.user_id;

    document.getElementById(

        "detail-type"

    ).textContent =

    item.fraud_type;

    document.getElementById(

        "detail-level"

    ).textContent =

    item.level;

    document.getElementById(

        "detail-status"

    ).textContent =

    item.status;

}

/* ===========================
RESOLVE
=========================== */

document

.getElementById(

    "btn-resolve"

)

.addEventListener(

    "click",

    async()=>{

        if(!selectedFraud) return;

        await supabase

        .from("fraud_logs")

        .update({

            status:"RESOLVED"

        })

        .eq(

            "id",

            selectedFraud.id

        );

        await loadStatistic();

        await loadFraud();

    }

);

/* ===========================
SUSPEND USER
=========================== */

document

.getElementById(

    "btn-suspend"

)

.addEventListener(

    "click",

    async()=>{

        if(!selectedFraud) return;

        await supabase

        .from("profiles")

        .update({

            is_active:false

        })

        .eq(

            "id",

            selectedFraud.user_id

        );

        alert(

            "User berhasil disuspend."

        );

        await loadStatistic();

    }

);

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("fraud-monitor")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"fraud_logs"

        },

        async()=>{

            await loadStatistic();

            await loadFraud();

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

.getElementById("btn-audit")

.addEventListener(

    "click",

    ()=>{

        location.href =

        "audit-log.html";

    }

);

document

.getElementById("btn-setting")

.addEventListener(

    "click",

    ()=>{

        location.href =

        "system-settings.html";

    }

);

document

.getElementById("btn-back")

.addEventListener(

    "click",

    ()=>{

        location.href =

        "admin-dashboard.html";

    }

);
