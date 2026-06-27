import { supabase } from "./api.js";
import * as wallet from "./wallet-engine.js";

/* ===========================
   GET SYSTEM SETTING
=========================== */

async function getSetting(key, defaultValue = 0){

    const { data, error } = await supabase

    .from("system_settings")

    .select("setting_value")

    .eq("setting_key", key)

    .maybeSingle();

    if(error || !data){

        return defaultValue;

    }

    return Number(data.setting_value);

}

/* ===========================
   PROCESS RIDE
=========================== */

export async function processRide({

    order_id,

    driver_id,

    total_amount

}){

    const rideFee = await getSetting(

        "ride_fee_percent",

        10

    );

    const platformIncome =

        Number(total_amount)

        * rideFee

        / 100;

    const driverIncome =

        Number(total_amount)

        - platformIncome;

    /* Driver Wallet */

    await wallet.credit({

        driver_id,

        amount: driverIncome,

        type: "RIDE",

        description: `Ride #${order_id}`,

        reference_id: order_id

    });

    /* Platform Income */

    const { error } = await supabase

    .from("platform_income")

    .insert({

        order_id,

        driver_id,

        gross_amount: total_amount,

        platform_fee: platformIncome,

        driver_income: driverIncome,

        created_at: new Date().toISOString()

    });

    if(error){

        throw error;

    }

    return {

        driverIncome,

        platformIncome

    };

}
