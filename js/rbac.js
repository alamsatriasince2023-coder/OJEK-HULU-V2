import {
    getCurrentUser,
    getProfile
} from './auth.js';

/* ===========================
   REQUIRE LOGIN
=========================== */

export async function requireLogin() {

    const user = await getCurrentUser();

    if (!user) {

        location.href = 'login.html';

        return null;

    }

    return user;

}

/* ===========================
   REQUIRE ROLE
=========================== */

export async function requireRole(role) {

    const user = await requireLogin();

    if (!user) return null;

    const profile = await getProfile();

    if (!profile) {

        alert('Profil tidak ditemukan.');

        location.href = 'login.html';

        return null;

    }

    if (profile.role !== role) {

        alert('Akses ditolak.');

        switch (profile.role) {

            case 'customer':
                location.href = 'customer.html';
                break;

            case 'driver':
                location.href = 'driver-dashboard.html';
                break;

            case 'admin':
                location.href = 'admin.html';
                break;

            default:
                location.href = 'login.html';

        }

        return null;

    }

    return {

        user,
        profile

    };

}

/* ===========================
   REDIRECT SETELAH LOGIN
=========================== */

export async function redirectByRole() {

    const profile = await getProfile();

    console.log("PROFILE LOGIN:", profile);

    if (!profile) {

        location.href = 'login.html';

        return;

    }

    switch (profile.role) {

        case 'customer':
            location.href = 'customer.html';
            break;

        case 'driver':
            location.href = 'driver-dashboard.html';
            break;

        case 'admin':
            location.href = 'admin.html';
            break;

        default:
            alert("Role tidak dikenali: " + profile.role);
            location.href = 'login.html';

    }

}
