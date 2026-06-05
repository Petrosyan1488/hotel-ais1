const SUPABASE_URL = "https://myratwuodgfzpmmnnzjt.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ic-pUV5WjxAdXnijymzQTA_1IwRQ6Ss";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const roomsGrid = document.getElementById('rooms-grid');
const roomForm = document.getElementById('room-form');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const googleBtn = document.getElementById('google-login-btn');
const adminPanel = document.getElementById('admin-panel');

const ADMIN_EMAIL = '240120@turan-edu.kz';

// 1. Проверка авторизации и показ/скрытие админки
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        if (googleBtn) {
            googleBtn.innerText = `Выйти (${user.email})`;
            googleBtn.className = "btn"; // Делаем кнопку обычной при выходе
        }
        if (adminPanel) {
            // Безопасная проверка почты в нижнем регистре
            adminPanel.style.display = (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? "block" : "none";
        }
    } else {
        if (googleBtn) {
            googleBtn.innerText = "Войти через Google";
            googleBtn.className = "btn google-btn"; // Возвращаем красный стиль
        }
        if (adminPanel) {
            adminPanel.style.display = "none";
        }
    }
}

// 2. Обработчик клика: Вход / Выход
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (user) {
            await supabaseClient.auth.signOut();
            window.location.reload();
        } else {
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + window.location.pathname
                }
            });
            if (error) console.error("Ошибка авторизации через Google:", error.message);
        }
    });
}

// 3. Получение комнат из базы данных
async function fetchRooms() {
    let query = supabaseClient.from('rooms').select('*').order('room_number', { ascending: true });

    const searchValue = searchInput ? searchInput.value.trim() : "";
    const statusValue = filterStatus ? filterStatus.value : "all";

    if (searchValue) {
        query = query.ilike('room_number', `%${searchValue}%`);
    }

    if (statusValue !== 'all') {
        query = query.eq('status', statusValue);
    }

    const { data: rooms, error } = await query;

    if (error) {
        if (roomsGrid) roomsGrid.innerHTML = `<p style="color:red; text-align:center;">🔴 Ошибка: ${error.message}</p>`;
        return;
    }

    if (!roomsGrid) return;
    roomsGrid.innerHTML = '';

    if (!rooms || rooms.length === 0) {
        roomsGrid.innerHTML = '<p class="loading">Номера не найдены в базе данных.</p>';
        return;
    }

    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        const statusClass = room.status.toLowerCase().replace(/\s+/g, '-');

        card.innerHTML = `
            <span class="room-badge status-${statusClass}">${room.status}</span>
            <h3>Номер ${room.room_number}</h3>
            <p><strong>Тип:</strong> ${room.type}</p>
            <p><strong>Цена:</strong> ${room.price_per_night} ₸ / сутки</p>
            <p><em>${room.description || 'Описание отсутствует'}</em></p>
        `;
        roomsGrid.appendChild(card);
    });
}

// 4. Отправка формы (Добавление номера админом)
if (roomForm) {
    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            alert("У вас нет прав администратора!");
            return;
        }

        // Забираем данные строго по ID из нашей HTML формы
        const roomData = {
            room_number: document.getElementById('room-number').value,
            type: document.getElementById('room-type').value,
            price_per_night: parseFloat(document.getElementById('room-price').value),
            status: document.getElementById('room-status').value,
            description: document.getElementById('room-description').value
        };

        const { error } = await supabaseClient.from('rooms').insert([roomData]);

        if (error) {
            alert('Ошибка добавления: ' + error.message);
        } else {
            alert('Номер успешно добавлен!');
            roomForm.reset();
            fetchRooms(); // Перезагружаем список, чтобы увидеть новый номер
        }
    });
}

// 5. Навешивание слушателей событий фильтрации (по одному разу!)
if (searchInput) searchInput.addEventListener('input', fetchRooms);
if (filterStatus) filterStatus.addEventListener('change', fetchRooms);

// 6. Запуск логики при старте страницы
checkUser();
fetchRooms();
