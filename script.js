/**
 * Diver Digital Service - Script
 * Core functionality and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // === Variables & Data ===
    const portfolioData = [
        { id: 1, title: 'Tiktok + Live Tiktok', category: 'Live Service', img: 'https://i.imgur.com/xCDneE1.png' },
        { id: 2, title: 'Tiktok Promotion', category: 'Promote Development', img: 'https://i.imgur.com/DFUlLL0.png' },
        { id: 3, title: 'Minecraft SMP Setup', category: 'Server Setup', img: 'https://i.imgur.com/8FyN0UQ.png' },
        { id: 4, title: 'Owning Content', category: 'Editing Service', img: 'https://i.imgur.com/euxoP5l.png' },
        { id: 5, title: 'Web Development', category: 'Editing Service', img: 'https://i.imgur.com/y6bAndJ.png' }
    ];

    const queueData = [
        { id: '1', user: 'GlorivaHost', status: 'done' },
        { id: '2', user: 'AeroBlast', status: 'done' },
        { id: '3', user: 'SOON', status: 'waiting' },
        { id: '4', user: 'SOON', status: 'waiting' },
        { id: '5', user: 'SOON', status: 'waiting' }
    ];

    // === Theme Toggle ===
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeToggle.innerHTML = theme === 'dark' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    }

    // === Navbar Scroll ===
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // === Typing Effect ===
    const typingElement = document.getElementById('typing-text');
    const phrases = ['Creative Digital Service', 'Modern Video Editing', 'Futuristic Web Development', 'Premium Content Ownership'];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    type();

    // === Render Portfolio ===
    const portfolioGrid = document.getElementById('portfolioGrid');
    const loadMoreBtn = document.getElementById('loadMore');
    let displayedCount = 4;

    function renderPortfolio() {
        portfolioGrid.innerHTML = '';
        portfolioData.slice(0, displayedCount).forEach(item => {
            const card = document.createElement('div');
            card.className = 'portfolio-card reveal';
            card.innerHTML = `
                <img src="${item.img}" alt="${item.title}" class="portfolio-img">
                <div class="portfolio-overlay">
                    <span class="portfolio-category">${item.category}</span>
                    <h3 class="portfolio-title">${item.title}</h3>
                </div>
            `;
            portfolioGrid.appendChild(card);
        });

        if (displayedCount >= portfolioData.length) {
            loadMoreBtn.style.display = 'none';
        }

        // Trigger reveal for new items
        setTimeout(() => {
            document.querySelectorAll('.portfolio-card').forEach(item => item.classList.add('active'));
        }, 100);
    }

    loadMoreBtn.addEventListener('click', () => {
        displayedCount += 2;
        renderPortfolio();
    });

    renderPortfolio();

    // === Render Queue ===
    const queueList = document.getElementById('queueList');
    function renderQueue() {
        queueList.innerHTML = '';
        queueData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'queue-item glass reveal';

            let statusClass = '';
            let statusText = '';
            if (item.status === 'active') { statusClass = 'status-active'; statusText = 'Sedang Dikerjakan'; }
            else if (item.status === 'waiting') { statusClass = 'status-waiting'; statusText = 'Menunggu'; }
            else { statusClass = 'status-done'; statusText = 'Selesai'; }

            div.innerHTML = `
                <div class="queue-left">
                    <span class="queue-id font-mono">${item.id}</span>
                    <span class="queue-user">${item.user}</span>
                </div>
                <span class="badge-status ${statusClass}">${statusText}</span>
            `;
            queueList.appendChild(div);
        });
    }
    renderQueue();

    // === Modal Logic ===
    const modal = document.getElementById('orderModal');
    const modalClose = document.querySelector('.modal-close');
    const orderFormatText = document.getElementById('orderFormat');
    const copyBtn = document.getElementById('copyOrder');
    const buyButtons = document.querySelectorAll('.buy-btn');

    buyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pkg = btn.getAttribute('data-package');
            const price = btn.getAttribute('data-price');

            const format = `Halo Diver! 👋\n\nSaya ingin memesan:\nPaket: ${pkg}\nHarga: ${price}\n\nFormat Order:\nNama: [Isi Nama]\nKontak: [Isi WA/Tele]\nCustom Catatan: [Isi jika ada]`;

            orderFormatText.textContent = format;
            modal.classList.add('active');
        });
    });

    modalClose.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(orderFormatText.textContent);
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Berhasil Dicopy';
        setTimeout(() => {
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copy Format Order';
        }, 2000);
    });

    // === Booking Form ===
    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const contact = document.getElementById('contact').value;
        const pkg = document.getElementById('package-select').value;
        const date = document.getElementById('date').value;
        const note = document.getElementById('note').value;

        const message = `Halo Diver! Saya ingin booking jasa via website.\n\nDetail Booking:\nNama: ${name}\nKontak: ${contact}\nPaket: ${pkg}\nTanggal: ${date}\nCatatan: ${note}`;
        const whatsappUrl = `https://wa.me/6287820870752?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    });

    // === Mobile Nav Toggle ===
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.innerHTML = navMenu.classList.contains('active') 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
    });

    // Close mobile nav on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
        });
    });

    // === Scroll Reveal ===
    function reveal() {
        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(item => {
            const windowHeight = window.innerHeight;
            const elementTop = item.getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementTop < windowHeight - elementVisible) {
                item.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', reveal);
    reveal(); // Initial check

    // === Ripple Effect ===
    window.addEventListener('mousedown', (e) => {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});
/* --- Tambahkan ini di bagian paling bawah script.js --- */

// Proteksi: Disable Klik Kanan
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Proteksi: Disable Tombol F12, Ctrl+Shift+I, dll
document.addEventListener('keydown', (e) => {
    if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
    ) {
        e.preventDefault();
        return false;
    }
});
