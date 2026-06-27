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

let selectedAdmin = null;

init();

async function init(){

    await loadStatistic();

    await loadAdmins();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        admin,

        active,

        operator,

        viewer

    ] = await Promise.all([

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","admin"),

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","admin")

        .eq("is_active",true),

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","operator"),

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","viewer")

    ]);

    document.getElementById(

        "total-admin"

    ).textContent =

    admin.count || 0;

    document.getElementById(

        "active-admin"

    ).textContent =

    active.count || 0;

    document.getElementById(

        "total-operator"

    ).textContent =

    operator.count || 0;

    document.getElementById(

        "total-viewer"

    ).textContent =

    viewer.count || 0;

}

/* ===========================
LOAD ADMIN
=========================== */

async function loadAdmins(){

    const { data, error } =

    await supabase

    .from("profiles")

    .select("*")

    .in("role",[

        "admin",

        "operator",

        "viewer"

    ])

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

    renderAdmins(

        data || []

    );

}

/* ===========================
CREATE ADMIN
=========================== */

document

.getElementById(

    "btn-create"

)

.addEventListener(

    "click",

    createAdmin

);

async function createAdmin(){

    const full_name =

    document

    .getElementById("full-name")

    .value;

    const email =

    document

    .getElementById("email")

    .value;

    const role =

    document

    .getElementById("role")

    .value;

    if(!full_name || !email){

        alert("Lengkapi data.");

        return;

    }

    const { error } =

    await supabase

    .from("profiles")

    .insert({

        full_name,

        email,

        role,

        is_active:true

    });

    if(error){

        alert(error.message);

        return;

    }

    alert("Administrator berhasil ditambahkan.");

    document.getElementById("full-name").value="";

    document.getElementById("email").value="";

    await loadStatistic();

    await loadAdmins();

}

/* ===========================
RENDER ADMIN
=========================== */

function renderAdmins(data){

    const list =

    document.getElementById(

        "admin-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada administrator.</p>";

        return;

    }

    list.innerHTML =

    data.map(admin=>`

<div
class="promo-card admin-item"
data-id="${admin.id}">

<b>

${admin.full_name}

</b>

<br>

📧 ${admin.email}

<br>

👨‍💼 ${admin.role}

<br>

${admin.is_active ? "🟢 ACTIVE" : "🔴 NONAKTIF"}

</div>

`).join("");

    document

    .querySelectorAll(".admin-item")

    .forEach(el=>{

        el.onclick=()=>{

            selectedAdmin =

            data.find(

                x=>x.id===el.dataset.id

            );

            showDetail(selectedAdmin);

        };

    });

}

/* ===========================
DETAIL
=========================== */

function showDetail(admin){

    if(!admin) return;

    document.getElementById("detail-name").textContent = admin.full_name;

    document.getElementById("detail-email").textContent = admin.email;

    document.getElementById("detail-role").textContent = admin.role;

    document.getElementById("detail-status").textContent =

    admin.is_active ?

    "ACTIVE" :

    "NONAKTIF";

}

/* ===========================
DISABLE ADMIN
=========================== */

document

.getElementById(

    "btn-disable"

)

.addEventListener(

    "click",

    async()=>{

        if(!selectedAdmin) return;

        const { error } =

        await supabase

        .from("profiles")

        .update({

            is_active:false

        })

        .eq(

            "id",

            selectedAdmin.id

        );

        if(error){

            alert(error.message);

            return;

        }

        alert("Administrator dinonaktifkan.");

        await loadStatistic();

        await loadAdmins();

    }

);

/* ===========================
RESET PASSWORD
=========================== */

document

.getElementById(

    "btn-reset"

)

.addEventListener(

    "click",

    ()=>{

        if(!selectedAdmin){

            alert("Pilih administrator.");

            return;

        }

        alert(

            "Integrasi reset password Supabase Auth akan dibuat pada Sprint Security."

        );

    }

);

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("admin-user-management")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"profiles"

        },

        async()=>{

            await loadStatistic();

            await loadAdmins();

        }

    )

    .subscribe();

}

/* ===========================
MENU
=========================== */

document.getElementById("btn-home")
.addEventListener("click",()=>location.reload());

document.getElementById("btn-setting")
.addEventListener("click",()=>location.href="system-settings.html");

document.getElementById("btn-audit")
.addEventListener("click",()=>location.href="audit-log.html");

document.getElementById("btn-back")
.addEventListener("click",()=>location.href="admin-dashboard.html");
