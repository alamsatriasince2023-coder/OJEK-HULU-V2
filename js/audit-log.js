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

    await loadStatistic();

    await loadLogs();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        total,

        today,

        admin,

        critical

    ] = await Promise.all([

        supabase

        .from("audit_logs")

        .select("*",{

            head:true,

            count:"exact"

        }),

        supabase

        .from("audit_logs")

        .select("*",{

            head:true,

            count:"exact"

        })

        .gte(

            "created_at",

            new Date()

            .toISOString()

            .substring(0,10)

        ),

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","admin"),

        supabase

        .from("audit_logs")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("level","CRITICAL")

    ]);

    document.getElementById(

        "total-log"

    ).textContent =

    total.count || 0;

    document.getElementById(

        "today-log"

    ).textContent =

    today.count || 0;

    document.getElementById(

        "admin-active"

    ).textContent =

    admin.count || 0;

    document.getElementById(

        "critical-log"

    ).textContent =

    critical.count || 0;

}

/* ===========================
LOAD LOG
=========================== */

async function loadLogs(){

    const { data, error } =

    await supabase

    .from("audit_logs")

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

    renderLogs(

        data || []

    );

}

/* ===========================
RENDER LOG
=========================== */

function renderLogs(data){

    const list =

    document.getElementById(

        "audit-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada audit log.</p>";

        return;

    }

    list.innerHTML =

    data.map(item=>`

<div
class="promo-card audit-item"
data-id="${item.id}">

<b>

${item.action}

</b>

<br>

📂 ${item.module || "-"}

<br>

👤 ${item.admin_name || item.user_name || "-"}

<br>

<small>

${new Date(item.created_at).toLocaleString("id-ID")}

</small>

</div>

`).join("");

    document

    .querySelectorAll(".audit-item")

    .forEach(el=>{

        el.onclick=()=>{

            const log =

            data.find(

                x=>x.id===el.dataset.id

            );

            showDetail(log);

        };

    });

}

/* ===========================
DETAIL
=========================== */

function showDetail(log){

    if(!log) return;

    document.getElementById(

        "detail-admin"

    ).textContent =

    log.admin_name ||

    log.user_name ||

    "-";

    document.getElementById(

        "detail-action"

    ).textContent =

    log.action || "-";

    document.getElementById(

        "detail-module"

    ).textContent =

    log.module || "-";

    document.getElementById(

        "detail-time"

    ).textContent =

    new Date(

        log.created_at

    ).toLocaleString("id-ID");

}

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("audit-log")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"audit_logs"

        },

        async()=>{

            await loadStatistic();

            await loadLogs();

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

.getElementById("btn-analytics")

.addEventListener(

    "click",

    ()=>{

        location.href =

        "analytics-dashboard.html";

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
