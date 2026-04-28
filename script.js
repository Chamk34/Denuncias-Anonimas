document.addEventListener('DOMContentLoaded', () => {
    // --- State & Selectors ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');
    const pageTitle = document.getElementById('page-title');
    const formDenuncia = document.getElementById('form-denuncia');
    const reportContainer = document.getElementById('report-container');

    // Section Titles Mapping
    const titles = {
        denuncia: 'Denuncia Anónima',
        reportes: 'Historial de Reportes',
        ajustes: 'Información y Ajustes'
    };

    // --- Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');
            
            // Update Navigation UI
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update Sections
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `section-${targetSection}`) {
                    section.classList.add('active');
                }
            });

            // Update Title
            pageTitle.innerText = titles[targetSection];

            // If switching to reports, refresh the list
            if (targetSection === 'reportes') {
                renderReports();
            }
        });
    });

    const mediaInput = document.getElementById('media-files');
    const audioInput = document.getElementById('audio-files');
    const mediaPreview = document.getElementById('media-preview');
    const legalCheck = document.getElementById('legal-check');
    const btnSubmit = document.getElementById('btn-submit');
    const modal = document.getElementById('confirm-modal');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSummary = document.getElementById('modal-summary');

    let selectedMedia = [];
    let pendingReport = null;

    // --- Security & Validation ---
    legalCheck.addEventListener('change', () => {
        btnSubmit.disabled = !legalCheck.checked;
    });

    // --- Media Preview Handling ---
    const handleFiles = (files, type) => {
        Array.from(files).forEach(file => {
            selectedMedia.push({ name: file.name, type: type || file.type });
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                if (file.type.startsWith('image')) {
                    div.style.backgroundImage = `url(${e.target.result})`;
                } else if (file.type.startsWith('video')) {
                    div.innerHTML = '<i class="material-icons" style="color: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)">play_circle</i>';
                    div.style.backgroundColor = '#000';
                } else {
                    div.classList.add('audio-type');
                    div.innerHTML = '<i class="material-icons">mic</i>';
                }
                mediaPreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    };

    mediaInput.addEventListener('change', (e) => handleFiles(e.target.files));
    audioInput.addEventListener('change', (e) => handleFiles(e.target.files, 'audio/mp3'));

    // --- Anti-Fraud Functions ---
    function checkCooldown() {
        const lastSent = localStorage.getItem('last_report_timestamp');
        if (lastSent) {
            const now = Date.now();
            const diff = now - parseInt(lastSent);
            const cooldownMs = 10 * 60 * 1000; // 10 minutes
            if (diff < cooldownMs) {
                const minutesLeft = Math.ceil((cooldownMs - diff) / 60000);
                alert(`Seguridad: Debe esperar ${minutesLeft} minutos antes de enviar otra denuncia para evitar saturación del sistema.`);
                return false;
            }
        }
        return true;
    }

    function calculateCredibility(text) {
        let score = 100;
        const spamKeywords = ['jajaja', 'fake', 'prueba', 'test', 'troll', 'mentira'];
        const lowerText = text.toLowerCase();
        
        // Check for spam keywords
        spamKeywords.forEach(word => {
            if (lowerText.includes(word)) score -= 40;
        });

        // Check for repetitiveness
        const words = lowerText.split(' ');
        const uniqueWords = new Set(words);
        if (words.length > 5 && uniqueWords.size / words.length < 0.5) {
            score -= 30; // High repetition
        }

        if (score < 40) return 'SPAM';
        if (score < 70) return 'BAJA';
        return 'ALTA';
    }

    // --- Form Handling & Modal ---
    formDenuncia.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Cooldown Check
        if (!checkCooldown()) return;

        // 2. Data Gathering
        const tipo = document.getElementById('tipo-incidente').value;
        const descripcion = document.getElementById('descripcion').value;
        const ubicacion = document.getElementById('ubicacion').value;

        // 3. Length Validation (Min 50 chars)
        if (descripcion.length < 50) {
            alert('La descripción es demasiado breve. Para procesar su denuncia, proporcione al menos 50 caracteres con detalles del incidente.');
            return;
        }

        // 4. Prepare Pending Report
        pendingReport = {
            id: 'REP-' + Math.floor(Math.random() * 10000),
            fecha: new Date().toLocaleString(),
            timestamp: Date.now(),
            tipo,
            descripcion,
            ubicacion,
            media: selectedMedia.map(m => m.name),
            credibilidad: calculateCredibility(descripcion),
            metadata: {
                precision: 'High (GPS Simulation)',
                device: navigator.userAgent.split(' ')[0],
                sessionTime: performance.now()
            }
        };

        // 5. Show Confirmation Modal
        modalSummary.innerHTML = `
            <strong>Tipo:</strong> ${tipo}<br>
            <strong>Ubicación:</strong> ${ubicacion}<br>
            <strong>Detalle:</strong> ${descripcion.substring(0, 60)}...
        `;
        modal.style.display = 'block';
    });

    modalCancel.addEventListener('click', () => {
        modal.style.display = 'none';
        pendingReport = null;
    });

    modalConfirm.addEventListener('click', () => {
        if (!pendingReport) return;

        // 1. Save to LocalStorage
        saveReport(pendingReport);
        localStorage.setItem('last_report_timestamp', Date.now().toString());

        // 2. Send Email
        sendEmail(pendingReport);

        // 3. Reset UI
        modal.style.display = 'none';
        alert('Denuncia oficial enviada a la Policía de La Rioja.');
        formDenuncia.reset();
        mediaPreview.innerHTML = '';
        selectedMedia = [];
        legalCheck.checked = false;
        btnSubmit.disabled = true;

        // 4. Redirect
        document.querySelector('[data-section="reportes"]').click();
    });

    function sendEmail(report) {
        const email = 'chamiplay@hotmail.com';
        const subject = `DENUNCIA OFICIAL - ${report.tipo} - ID: ${report.id} (LR)`;
        const body = `
DENUNCIA CIUDADANA - LA RIOJA
------------------------------
ID UNICO: ${report.id}
FECHA/HORA: ${report.fecha}
CATEGORIA: ${report.tipo}
UBICACION: ${report.ubicacion}

DESCRIPCION DETALLADA:
${report.descripcion}

MULTIMEDIA ADJUNTA: ${report.media.length > 0 ? report.media.join(', ') : 'Ninguna'}

INFO TECNICA DE VALIDACION:
- Credibilidad Estimada: ${report.credibilidad}
- Precision de Ubicacion: ${report.metadata.precision}
- Marca de Tiempo: ${report.timestamp}

ADVERTENCIA: Este reporte fue confirmado legalmente por el usuario.
        `;
        // Abrir en Gmail web
        const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailLink, '_blank');
    }

    // --- Persistence Logic ---
    function saveReport(report) {
        const existingReports = JSON.parse(localStorage.getItem('denuncias')) || [];
        existingReports.unshift(report);
        localStorage.setItem('denuncias', JSON.stringify(existingReports));
    }

    function renderReports() {
        const reports = JSON.parse(localStorage.getItem('denuncias')) || [];
        
        if (reports.length === 0) {
            reportContainer.innerHTML = `
                <div class="empty-state">
                    <i class="material-icons">assignment_late</i>
                    <p>No hay reportes registrados aún.</p>
                </div>
            `;
            return;
        }

        reportContainer.innerHTML = reports.map(report => `
            <div class="report-card" style="border-left-color: ${report.credibilidad === 'SPAM' ? '#d35400' : report.credibilidad === 'BAJA' ? '#c0392b' : '#1a237e'}">
                <div class="report-header">
                    <span>ID: ${report.id}</span>
                    <span>${report.fecha}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong class="report-type">${report.tipo}</strong>
                    ${report.credibilidad === 'SPAM' ? '<span class="tag-spam">Posible Spam</span>' : 
                      report.credibilidad === 'BAJA' ? '<span class="tag-low">Baja Credibilidad</span>' : ''}
                </div>
                <p>${report.descripcion}</p>
                <div class="report-footer" style="margin-top: 10px; font-size: 0.85rem; color: var(--primary); display: flex; justify-content: space-between;">
                    <span>
                        <i class="material-icons" style="font-size: 1rem; vertical-align: middle;">place</i>
                        ${report.ubicacion}
                    </span>
                    ${report.media && report.media.length > 0 ? `
                        <span style="color: var(--text-muted);">
                            <i class="material-icons" style="font-size: 1rem; vertical-align: middle;">attach_file</i>
                            ${report.media.length} adjunto(s)
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderReports();
});

// PWA: Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado con éxito con el scope: ', registration.scope);
            })
            .catch(error => {
                console.log('Fallo en el registro del ServiceWorker: ', error);
            });
    });
}
