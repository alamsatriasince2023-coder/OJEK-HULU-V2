import { supabase } from './api.js';
import {
    getCurrentUser,
    logoutUser
} from './auth.js';

const user = await getCurrentUser();

if (!user) {
    location.href = 'login.html';
}

document.getElementById('profile-email').textContent = user.email;
document.getElementById('email').value = user.email;

async function loadProfile() {

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {

        console.log('Profile belum ada.');

        document.getElementById('profile-name').textContent = user.email;

        return;

    }

    document.getElementById('profile-name').textContent =
        data.full_name || user.email;

    document.getElementById('full-name').value =
        data.full_name || '';

    document.getElementById('phone').value =
        data.phone || '';

}

loadProfile();

document
.getElementById('btn-save')
.addEventListener('click', async () => {

    const full_name =
        document.getElementById('full-name').value.trim();

    const phone =
        document.getElementById('phone').value.trim();

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,

            full_name,
        
            phone,
        
            role: 'customer'
        
        });

    if (error) {

        alert(error.message);

        return;

    }

    document.getElementById('profile-name').textContent =
        full_name || user.email;

    alert('✅ Profil berhasil disimpan.');

});

document
.getElementById('btn-password')
.addEventListener('click', async () => {

    const { error } = await supabase.auth.resetPasswordForEmail(
        user.email,
        {
            redirectTo: window.location.origin
        }
    );

    if (error) {

        alert(error.message);

        return;

    }

    alert('📧 Link ubah password telah dikirim ke email Anda.');

});

document
.getElementById('btn-logout')
.addEventListener('click', async () => {

    await logoutUser();

    location.href = 'login.html';

});
