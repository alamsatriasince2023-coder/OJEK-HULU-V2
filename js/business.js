import { requireRole } from "./rbac.js";
import { supabase } from "./api.js";

const auth = await requireRole("admin");

if (!auth) {

    throw new Error("Akses ditolak");

}

const SETTINGS = [

    "ride_fee_percent",
    "food_fee_percent",
    "mart_fee_percent",
    "minimum_withdraw",
    "maximum_withdraw",
    "withdraw_fee",
    "auto_topup",
    "auto_withdraw"

];

init();

async function init() {

    await loadSettings();

}

/* ===========================
   LOAD SETTINGS
=========================== */

async function loadSettings() {

    const { data, error } = await supabase

        .from("system_settings")

        .select("*");

    if (error) {

        console.error(error);

        alert(error.message);

        return;

    }

    data.forEach(item => {

        const el = document.getElementById(item.setting_key);

        if (!el) return;

        if (el.type === "checkbox") {

            el.checked = item.setting_value === "true";

        } else {

            el.value = item.setting_value;

        }

    });

}

/* ===========================
   SAVE SETTINGS
=========================== */

document

.getElementById("btn-save")

.addEventListener(

    "click",

    async () => {

        for (const key of SETTINGS) {

            const el = document.getElementById(key);

            if (!el) continue;

            const value =

                el.type === "checkbox"

                ? String(el.checked)

                : el.value;

            const { error } = await supabase

                .from("system_settings")

                .update({

                    setting_value: value,

                    updated_at: new Date().toISOString()

                })

                .eq("setting_key", key);

            if (error) {

                alert(error.message);

                return;

            }

        }

        alert("✅ Konfigurasi berhasil disimpan.");

    }

);

/* ===========================
   BACK
=========================== */

document

.getElementById("btn-back")

.addEventListener(

    "click",

    () => {

        location.href = "admin-dashboard.html";

    }

);
