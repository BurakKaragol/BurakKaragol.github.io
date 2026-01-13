document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const loadingOverlay = document.getElementById('loadingOverlay');
    const wheelCanvas = document.getElementById('wheel');
    const ctx = wheelCanvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const movieListContainer = document.getElementById('movieListContainer');
    const watchedListContainer = document.getElementById('watchedList');
    const resultSection = document.getElementById('resultSection');
    const winnerNameDisplay = document.getElementById('winnerName');
    const winnerGenreDisplay = document.getElementById('winnerGenre');
    const genreFilterSelect = document.getElementById('genreFilter');
    const keepBtn = document.getElementById('keepBtn');
    const watchedBtn = document.getElementById('watchedBtn');
    
    // Empty State Controls
    const loadSamplesBtn = document.getElementById('loadSamplesBtn');
    const importBtnEmpty = document.getElementById('importBtnEmpty');

    // Bulk Controls
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');

    // Modals
    const importModal = document.getElementById('importModal');
    const importBtn = document.getElementById('importBtn');
    const movieTitleInput = document.getElementById('newMovieTitle');
    const genreChipsContainer = document.getElementById('genreChipsContainer');
    const addToStagingBtn = document.getElementById('addToStagingBtn');
    const stagingList = document.getElementById('stagingList');
    const stagingCount = document.getElementById('stagingCount');
    const saveImportBtn = document.getElementById('saveImportBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsGenreList = document.getElementById('settingsGenreList');
    const newGenreInput = document.getElementById('newGenreInput');
    const addNewGenreBtn = document.getElementById('addNewGenreBtn');

    // --- STATE ---
    let movies = [];
    let currentFilter = 'All';
    let customGenres = [];
    let stagingMovies = [];

    const DEFAULT_GENRES = [
        "Action", "Adventure", "Animation", "Comedy", "Crime", 
        "Documentary", "Drama", "Family", "Fantasy", "Horror", 
        "Mystery", "Romance", "Sci-Fi", "Thriller", "Western"
    ];

    const SAMPLE_POOL = [
        { text: "The Godfather", genres: ["Crime", "Drama"] },
        { text: "The Dark Knight", genres: ["Action", "Crime"] },
        { text: "Pulp Fiction", genres: ["Crime", "Drama"] },
        { text: "Inception", genres: ["Action", "Sci-Fi"] },
        { text: "Fight Club", genres: ["Drama"] },
        { text: "Forrest Gump", genres: ["Drama", "Romance"] },
        { text: "The Matrix", genres: ["Action", "Sci-Fi"] },
        { text: "Goodfellas", genres: ["Biography", "Crime"] },
        { text: "Seven Samurai", genres: ["Action", "Drama"] },
        { text: "City of God", genres: ["Crime", "Drama"] },
        { text: "Se7en", genres: ["Crime", "Mystery"] },
        { text: "Silence of the Lambs", genres: ["Crime", "Thriller"] },
        { text: "It's a Wonderful Life", genres: ["Drama", "Family"] },
        { text: "Life Is Beautiful", genres: ["Comedy", "Drama"] },
        { text: "Spirited Away", genres: ["Animation", "Adventure"] },
        { text: "Saving Private Ryan", genres: ["Drama", "War"] },
        { text: "Interstellar", genres: ["Adventure", "Sci-Fi"] },
        { text: "The Green Mile", genres: ["Crime", "Drama"] },
        { text: "Parasite", genres: ["Drama", "Thriller"] },
        { text: "Léon: The Professional", genres: ["Action", "Crime"] },
        { text: "The Lion King", genres: ["Animation", "Drama"] },
        { text: "Gladiator", genres: ["Action", "Drama"] },
        { text: "Terminator 2", genres: ["Action", "Sci-Fi"] },
        { text: "Back to the Future", genres: ["Adventure", "Comedy"] },
        { text: "Psycho", genres: ["Horror", "Mystery"] },
        { text: "The Pianist", genres: ["Biography", "Drama"] },
        { text: "Whiplash", genres: ["Drama", "Music"] },
        { text: "The Departed", genres: ["Crime", "Thriller"] },
        { text: "The Prestige", genres: ["Drama", "Mystery"] },
        { text: "Casablanca", genres: ["Drama", "Romance"] },
        { text: "Rear Window", genres: ["Mystery", "Thriller"] },
        { text: "Alien", genres: ["Horror", "Sci-Fi"] },
        { text: "Apocalypse Now", genres: ["Drama", "War"] },
        { text: "Memento", genres: ["Mystery", "Thriller"] },
        { text: "Indiana Jones", genres: ["Action", "Adventure"] },
        { text: "Django Unchained", genres: ["Drama", "Western"] },
        { text: "WALL·E", genres: ["Animation", "Adventure"] },
        { text: "The Shining", genres: ["Drama", "Horror"] },
        { text: "Avengers: Endgame", genres: ["Action", "Adventure"] },
        { text: "Oldboy", genres: ["Action", "Drama"] },
        { text: "Joker", genres: ["Crime", "Drama"] },
        { text: "Princess Mononoke", genres: ["Animation", "Fantasy"] },
        { text: "Spider-Man: Into the Spider-Verse", genres: ["Animation", "Action"] },
        { text: "Coco", genres: ["Animation", "Family"] },
        { text: "Toy Story", genres: ["Animation", "Comedy"] },
        { text: "Braveheart", genres: ["Biography", "Drama"] },
        { text: "Amélie", genres: ["Comedy", "Romance"] },
        { text: "A Clockwork Orange", genres: ["Crime", "Sci-Fi"] },
        { text: "Taxi Driver", genres: ["Crime", "Drama"] },
        { text: "Up", genres: ["Animation", "Adventure"] }
    ];

    // --- SAFETY INIT ---
    setTimeout(() => {
        try {
            loadData();
            loadGenres();
            renderUI();
        } catch (error) {
            console.error("Critical Error:", error);
            localStorage.removeItem('movieWheelData');
            localStorage.removeItem('movieWheelGenres');
            movies = [];
            customGenres = [];
            renderUI();
        } finally {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
        }
    }, 50);

    // --- DATA LAYER ---
    function loadData() {
        const saved = localStorage.getItem('movieWheelData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (!Array.isArray(parsed)) throw new Error("Corrupt data");
                movies = parsed;
                movies.forEach(m => {
                    if (m.genre) { m.genres = [m.genre]; delete m.genre; }
                    if (!m.genres || !Array.isArray(m.genres)) m.genres = ["General"];
                });
            } catch (e) { movies = []; }
        }
    }

    function saveData() { localStorage.setItem('movieWheelData', JSON.stringify(movies)); }

    function loadGenres() {
        const saved = localStorage.getItem('movieWheelGenres');
        if (saved) { try { customGenres = JSON.parse(saved); } catch(e) { customGenres = []; } }
    }
    function saveGenres() { localStorage.setItem('movieWheelGenres', JSON.stringify(customGenres)); }
    function getAllGenres() { return [...new Set([...DEFAULT_GENRES, ...customGenres])].sort(); }


    // --- UI RENDER FUNCTIONS ---
    function renderUI() {
        renderMovieList();
        renderWatchedList();
        drawWheel();
        updateFilterDropdown();
    }

    function renderMovieList() {
        movieListContainer.innerHTML = '';
        const visibleMovies = movies.filter(m => 
            m.status !== 'watched' && 
            (currentFilter === 'All' || m.genres.includes(currentFilter))
        );
        
        if (visibleMovies.length === 0) {
            document.getElementById('leftEmptyState').style.display = 'block';
        } else {
            document.getElementById('leftEmptyState').style.display = 'none';
            const fragment = document.createDocumentFragment();
            visibleMovies.forEach(movie => {
                const btn = document.createElement('div');
                btn.className = `movie-btn ${movie.status === 'active' ? 'active' : ''}`;
                const tagsHtml = movie.genres.map(g => `<span class="genre-tag-mini">${g}</span>`).join('');
                btn.innerHTML = `
                    <span class="movie-info">${movie.text}</span>
                    <div class="tags-row">${tagsHtml}</div>
                    <button class="delete-btn" title="Delete"><span class="material-icons-round" style="font-size:18px;">delete</span></button>
                `;
                btn.onclick = (e) => toggleMovieStatus(e, movie.id);
                btn.querySelector('.delete-btn').onclick = (e) => deleteMovie(e, movie.id);
                fragment.appendChild(btn);
            });
            movieListContainer.appendChild(fragment);
        }
    }

    function updateFilterDropdown() {
        const activeGenres = new Set();
        movies.forEach(m => m.genres.forEach(g => activeGenres.add(g)));
        const currentVal = genreFilterSelect.value;
        genreFilterSelect.innerHTML = '<option value="All">All Genres</option>';
        Array.from(activeGenres).sort().forEach(g => {
            const opt = document.createElement('option');
            opt.value = g; opt.textContent = g;
            genreFilterSelect.appendChild(opt);
        });
        if(Array.from(activeGenres).includes(currentVal)) { genreFilterSelect.value = currentVal; } 
        else { genreFilterSelect.value = 'All'; currentFilter = 'All'; }
    }

    function renderWatchedList() {
        watchedListContainer.innerHTML = '';
        movies.filter(m => m.status === 'watched').forEach(m => {
            const li = document.createElement('li');
            li.textContent = m.text;
            watchedListContainer.appendChild(li);
        });
    }

    // --- BULK ACTION LOGIC ---
    selectAllBtn.onclick = () => {
        movies.forEach(m => {
            if (m.status !== 'watched' && (currentFilter === 'All' || m.genres.includes(currentFilter))) {
                m.status = 'active';
            }
        });
        saveData();
        renderUI();
    };

    deselectAllBtn.onclick = () => {
        movies.forEach(m => {
            if (m.status !== 'watched' && (currentFilter === 'All' || m.genres.includes(currentFilter))) {
                m.status = 'inactive';
            }
        });
        saveData();
        renderUI();
    };

    // --- RANDOMIZER LOGIC ---
    loadSamplesBtn.onclick = () => {
        // Shuffle the pool
        const shuffled = [...SAMPLE_POOL].sort(() => 0.5 - Math.random());
        // Pick first 10
        const selected = shuffled.slice(0, 10);
        
        selected.forEach(m => {
            movies.push({
                id: Date.now() + Math.random(),
                text: m.text,
                genres: m.genres,
                status: 'active'
            });
        });
        
        saveData();
        renderUI();
    };
    
    // Wire up the manual add button in empty state to open modal
    importBtnEmpty.onclick = () => {
        importBtn.click();
    };

    // --- WHEEL LOGIC ---
    let currentRotation = 0;
    let isSpinning = false;
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    function toggleMovieStatus(e, id) {
        if(e.target.closest('.delete-btn')) return;
        if (isSpinning) return;
        const movie = movies.find(m => m.id === id);
        if (movie) { movie.status = movie.status === 'active' ? 'inactive' : 'active'; saveData(); renderUI(); }
    }

    function deleteMovie(e, id) {
        e.stopPropagation();
        if(!confirm("Remove this movie?")) return;
        movies = movies.filter(m => m.id !== id); saveData(); renderUI();
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function spin() {
        const wheelMovies = movies.filter(m => m.status === 'active' && (currentFilter === 'All' || m.genres.includes(currentFilter)));
        if (wheelMovies.length === 0) return alert("No active movies match current filter!");
        
        isSpinning = true;
        spinBtn.disabled = true;
        resultSection.classList.add('hidden'); 

        const duration = 5000; 
        const startRotation = currentRotation;
        const totalRotation = (Math.random() * 360 * 5) + (360 * 5); 
        const totalRadians = (totalRotation * Math.PI) / 180;
        const startTime = performance.now();

        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutCubic(progress);
            currentRotation = startRotation + (totalRadians * ease);
            drawWheel();
            if (progress < 1) { requestAnimationFrame(animate); } 
            else { isSpinning = false; spinBtn.disabled = false; determineWinner(wheelMovies); }
        }
        requestAnimationFrame(animate);
    }

    function drawWheel() {
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        const wheelMovies = movies.filter(m => m.status === 'active' && (currentFilter === 'All' || m.genres.includes(currentFilter)));
        ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
        const radius = wheelCanvas.width / 2;

        if (wheelMovies.length === 0) {
            ctx.save();
            ctx.translate(radius, radius);
            ctx.beginPath();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.setLineDash([15, 15]);
            ctx.arc(0, 0, radius - 10, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#475569";
            ctx.font = "bold 24px 'Segoe UI'"; ctx.fillText("EMPTY", 0, -15);
            ctx.font = "16px 'Segoe UI'"; ctx.fillText("Add items to spin", 0, 15);
            ctx.restore();
            return;
        }

        const arc = (2 * Math.PI) / wheelMovies.length;
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(currentRotation);
        
        wheelMovies.forEach((movie, i) => {
            const angle = i * arc;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + arc);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.stroke();
            
            ctx.save();
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 24px 'Segoe UI'";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.fillText(movie.text.substring(0, 15) + (movie.text.length > 15 ? '..' : ''), radius - 30, 8);
            ctx.restore();
        });
        ctx.restore();
    }

    function determineWinner(wheelMovies) {
        const len = wheelMovies.length;
        const arc = (2 * Math.PI) / len;
        const normalizedRotation = currentRotation % (2 * Math.PI);
        let pointerAngle = (2 * Math.PI) - normalizedRotation;
        if (pointerAngle < 0) pointerAngle += 2 * Math.PI;
        const index = Math.floor(pointerAngle / arc) % len;
        const winner = wheelMovies[index];
        currentWinnerId = winner.id;
        
        winnerNameDisplay.textContent = winner.text;
        winnerGenreDisplay.textContent = winner.genres.join(' • ');
        resultSection.classList.remove('hidden');

        if(window.innerWidth < 900) { resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }

    let currentWinnerId = null;
    keepBtn.onclick = () => resultSection.classList.add('hidden');
    watchedBtn.onclick = () => {
        const movie = movies.find(m => m.id === currentWinnerId);
        if(movie) { movie.status = 'watched'; saveData(); renderUI(); resultSection.classList.add('hidden'); }
    };
    
    document.getElementById('clearHistoryBtn').onclick = () => { if(confirm("Clear history?")) { movies = movies.filter(m => m.status !== 'watched'); saveData(); renderUI(); }};
    document.getElementById('clearListBtn').onclick = () => { if(confirm("Clear shelf?")) { movies = movies.filter(m => m.status === 'watched'); saveData(); renderUI(); }};
    genreFilterSelect.addEventListener('change', (e) => { currentFilter = e.target.value; renderUI(); });
    spinBtn.onclick = spin;

    // --- IMPORT MODAL ---
    function renderGenreChips() {
        genreChipsContainer.innerHTML = '';
        const all = getAllGenres();
        all.forEach(g => {
            const chip = document.createElement('div');
            chip.className = 'genre-chip';
            chip.textContent = g;
            chip.onclick = () => chip.classList.toggle('selected');
            genreChipsContainer.appendChild(chip);
        });
    }

    function addItemToStaging() {
        const title = movieTitleInput.value.trim();
        if (!title) return false;
        const selectedGenres = [];
        document.querySelectorAll('.genre-chip.selected').forEach(c => selectedGenres.push(c.textContent));
        const finalGenres = selectedGenres.length > 0 ? selectedGenres : ["General"];
        stagingMovies.push({ id: Date.now() + Math.random(), text: title, genres: finalGenres, status: 'active' });
        movieTitleInput.value = '';
        document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('selected'));
        renderStagingList();
        movieTitleInput.focus();
        return true;
    }

    function renderStagingList() {
        stagingList.innerHTML = '';
        stagingCount.textContent = stagingMovies.length;
        if (stagingMovies.length === 0) { stagingList.innerHTML = '<div class="empty-staging">List is empty.</div>'; return; }
        const fragment = document.createDocumentFragment();
        stagingMovies.forEach((m, index) => {
            const item = document.createElement('div');
            item.className = 'staging-item';
            item.innerHTML = `<div><strong>${m.text}</strong><small>${m.genres.join(', ')}</small></div><button class="icon-btn" data-index="${index}"><span class="material-icons-round">close</span></button>`;
            item.querySelector('button').onclick = () => { stagingMovies.splice(index, 1); renderStagingList(); };
            fragment.appendChild(item);
        });
        stagingList.appendChild(fragment);
    }

    importBtn.onclick = () => { stagingMovies = []; movieTitleInput.value = ''; renderGenreChips(); renderStagingList(); importModal.classList.add('active'); setTimeout(() => movieTitleInput.focus(), 100); };
    addToStagingBtn.onclick = addItemToStaging;
    movieTitleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItemToStaging(); });
    saveImportBtn.onclick = () => {
        if(movieTitleInput.value.trim() !== '') addItemToStaging();
        if (stagingMovies.length === 0) return alert("Add some movies first!");
        movies.push(...stagingMovies); saveData(); renderUI(); importModal.classList.remove('active');
    };
    document.getElementById('closeModalCross').onclick = () => importModal.classList.remove('active');
    document.getElementById('cancelImportBtn').onclick = () => importModal.classList.remove('active');

    // --- SETTINGS MODAL ---
    settingsBtn.onclick = () => { renderSettingsList(); settingsModal.classList.add('active'); };
    function renderSettingsList() {
        settingsGenreList.innerHTML = '';
        if(customGenres.length === 0) settingsGenreList.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">No custom genres added.</span>';
        customGenres.forEach((g, index) => {
            const tag = document.createElement('div'); tag.className = 'settings-genre-item'; tag.innerHTML = `${g} <button>&times;</button>`;
            tag.querySelector('button').onclick = () => { customGenres.splice(index, 1); saveGenres(); renderSettingsList(); renderGenreChips(); };
            settingsGenreList.appendChild(tag);
        });
    }
    addNewGenreBtn.onclick = () => {
        const val = newGenreInput.value.trim();
        if(val && !getAllGenres().includes(val)) { customGenres.push(val); saveGenres(); newGenreInput.value = ''; renderSettingsList(); renderGenreChips(); }
    };
    document.getElementById('closeSettingsCross').onclick = () => settingsModal.classList.remove('active');

});