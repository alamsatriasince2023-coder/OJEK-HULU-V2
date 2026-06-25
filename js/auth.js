import { supabase } from './api.js';

/* ===========================
   REGISTER
=========================== */

export async function registerUser(
    email,
    password,
    fullName,
    phone
){

    const { data, error } =
    await supabase.auth.signUp({

        email,
        password

    });

    if(error){

        return {
            data:null,
            error
        };

    }

    const user = data.user;

    if(user){

        const { error: profileError } =
        await supabase
        .from('profiles')
        .upsert({

            id: user.id,
            full_name: fullName,
            phone: phone,
            role: 'customer'

        });

        if(profileError){

            return {
                data:null,
                error:profileError
            };

        }

    }

    return {
        data,
        error:null
    };

}

/* ===========================
   LOGIN
=========================== */

export async function loginUser(
    email,
    password
){

    return await supabase.auth.signInWithPassword({

        email,
        password

    });

}

/* ===========================
   LOGOUT
=========================== */

export async function logoutUser(){

    await supabase.auth.signOut();

}

/* ===========================
   CURRENT USER
=========================== */

export async function getCurrentUser(){

    const {

        data:{ user }

    } = await supabase.auth.getUser();

    return user;

}

/* ===========================
   PROFILE
=========================== */

export async function getProfile(){

    const user =
    await getCurrentUser();

    if(!user) return null;

    const { data } =
    await supabase
    .from('profiles')
    .select('*')
    .eq('id',user.id)
    .single();

    return data;

}
