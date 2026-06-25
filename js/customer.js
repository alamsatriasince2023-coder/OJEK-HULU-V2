import {
    getCurrentUser,
    logoutUser
} from './auth.js';

const user = await getCurrentUser();

if (!user) {
    location.href = 'login.html';
}

document.getElementById('welcome').textContent =
`Halo, ${user.email}`;

document
.getElementById('btn-order')
.addEventListener('click', () => {

    location.href = 'order.html';

});

document
.getElementById('btn-history')
.addEventListener('click', () => {

    console.log('BTN HISTORY DIKLIK');

    location.href = 'customer-history.html';

});

document
.getElementById('btn-profile')
.addEventListener('click', () => {

    alert('Profil V2 segera dibuat');

});

document
.getElementById('btn-logout')
.addEventListener('click', async () => {

    await logoutUser();

    location.href = 'login.html';

});
