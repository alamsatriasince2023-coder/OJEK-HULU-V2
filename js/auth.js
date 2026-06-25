import { supabase } from './api.js';

export async function registerUser(
email,
password
){

return await supabase.auth.signUp({
email,
password
});

}

export async function loginUser(
email,
password
){

return await supabase.auth.signInWithPassword({

email,
password

});

}

export async function logoutUser(){

await supabase.auth.signOut();

}

export async function getCurrentUser(){

const {
data:{user}
}
=
await supabase.auth.getUser();

return user;

}

export async function getProfile(){

const user = await getCurrentUser();

if(!user) return null;

const { data } = await supabase
.from('profiles')
.select('*')
.eq('id', user.id)
.single();

return data;

}
