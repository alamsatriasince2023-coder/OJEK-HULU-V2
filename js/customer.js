import { logoutUser } from './auth.js';
import { requireRole } from './rbac.js';

const auth = await requireRole('customer');

if (!auth) {

    throw new Error('Akses ditolak');

}

const user = auth.user;
const profile = auth.profile;

/* ===========================
   HEADER
=========================== */

document.getElementById('welcome').textContent =
`Halo, ${profile.full_name || user.email}`;

/* ===========================
   MENU
=========================== */

document
.getElementById('btn-order')
.addEventListener('click', () => {

    location.href = 'order.html';

});

document
.getElementById('btn-history')
.addEventListener('click', () => {

    location.href = 'customer-history.html';

});

document
.getElementById('btn-profile')
.addEventListener('click', () => {

    location.href = 'profile.html';

});

document
.getElementById('btn-logout')
.addEventListener('click', async () => {

    await logoutUser();

    location.href = 'login.html';

});
