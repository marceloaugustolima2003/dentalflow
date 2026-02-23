// Importar SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
import { translations } from "./translations.js";

document.addEventListener('DOMContentLoaded', () => {

    // Helper para tradução
    let currentLang = localStorage.getItem('dentalflow_lang') || 'pt';
    const t = (key) => (translations[currentLang] && translations[currentLang][key]) || key;
    
    let db, auth, functions, storage, userId;
    let unsubscribeFromFirestore;
    let charts = {}; // Armazenar instâncias dos gráficos

    // Configure Global Chart Defaults
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.color = '#8b92a5';
    Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

    // --- ELEMENTOS DO DOM ---
    const quickNotesInput = document.getElementById('quick-notes-input');
    const saveQuickNotesBtn = document.getElementById('save-quick-notes-btn');
    const quickNotesFeedback = document.getElementById('quick-notes-feedback');
    const quickNotesTabsList = document.getElementById('quick-notes-tabs-list');
    const addQuickNoteTabBtn = document.getElementById('add-quick-note-tab-btn'); 
    const deleteQuickNoteTabBtn = document.getElementById('delete-quick-note-tab-btn'); 
    const initialLoadingOverlay = document.getElementById('initial-loading-overlay');
    const authScreen = document.getElementById('auth-screen');
    const appContent = document.getElementById('app-content');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authButton = document.getElementById('auth-button');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const authErrorMessage = document.getElementById('auth-error-message');
    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const passwordResetButton = document.getElementById('password-reset-button');
    const logoutButton = document.getElementById('logout-button');
    const userEmailDisplay = document.getElementById('user-email-display');
    const formValores = document.getElementById('form-valores');
    const tipoTrabalhoInput = document.getElementById('tipo-trabalho-input');
    const valorTrabalhoInput = document.getElementById('valor-trabalho-input');
    const listaValores = document.getElementById('lista-valores');
    const formDespesas = document.getElementById('form-despesas');
    const formDespesaTitle = document.getElementById('form-despesa-title');
    const despesaEditIdInput = document.getElementById('despesa-edit-id');
    const despesaDescInput = document.getElementById('despesa-desc-input');
    const despesaCategoriaSelect = document.getElementById('despesa-categoria-select');
    const despesaValorInput = document.getElementById('despesa-valor-input');
    const despesaDataInput = document.getElementById('despesa-data-input');
    const despesaRecorrenteCheckbox = document.getElementById('despesa-recorrente-checkbox');
    const formDespesaSubmitBtn = document.getElementById('form-despesa-submit-btn');
    const formDespesaCancelBtn = document.getElementById('form-despesa-cancel-btn');
    const listaDespesasCompleta = document.getElementById('lista-despesas-completa');
    const searchDespesasInput = document.getElementById('search-despesas-input');
    const formProducao = document.getElementById('form-producao');
    const producaoItemsContainer = document.getElementById('producao-items-container');
    const formProducaoAddItemBtn = document.getElementById('form-producao-add-item-btn');
    const producaoDentistaInput = document.getElementById('producao-dentista-input');
    const producaoPacienteInput = document.getElementById('producao-paciente-input');
    const producaoStatusSelect = document.getElementById('producao-status-select');
    const producaoObsInput = document.getElementById('producao-obs-input');
    const producaoAnexoInput = document.getElementById('producao-anexo-input');
    const producaoDataInput = document.getElementById('producao-data-input');
    const entregaDataInput = document.getElementById('entrega-data-input');
    const formProducaoTitle = document.getElementById('form-producao-title');
    const producaoEditIdInput = document.getElementById('producao-edit-id');
    const producaoSubmitBtn = document.getElementById('form-producao-submit-btn');
    const producaoCancelBtn = document.getElementById('form-producao-cancel-btn');
    const listaProducaoDia = document.getElementById('lista-producao-dia');
    const totalPecasDia = document.getElementById('total-pecas-dia');
    const totalFaturamentoDia = document.getElementById('total-faturamento-dia');
    const mesAnoAtualSpan = document.getElementById('mes-ano-atual');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const totalPecasMes = document.getElementById('total-pecas-mes');
    const totalFaturamentoMes = document.getElementById('total-faturamento-mes');
    const totalDespesasMes = document.getElementById('total-despesas-mes');
    const lucroLiquidoMes = document.getElementById('lucro-liquido-mes');
    const despesasContainer = document.getElementById('despesas-container');
    const resumoTiposContainer = document.getElementById('resumo-tipos-container');
    const despesasBar = document.getElementById('despesas-bar');
    const faturamentoBar = document.getElementById('faturamento-bar');
    const despesasBarLabel = document.getElementById('despesas-bar-label');
    const faturamentoBarLabel = document.getElementById('faturamento-bar-label');
    const dentistaSummaryTableBody = document.getElementById('dentista-summary-table-body');
    const verTodasDespesasBtn = document.getElementById('ver-todas-despesas-btn');
    const loadingModal = document.getElementById('loading-modal');
    const messageModal = document.getElementById('message-modal');
    const despesasModal = document.getElementById('despesas-modal');
    const closeDespesasModalBtn = document.getElementById('close-despesas-modal-btn');
    const listaDespesasDetalhada = document.getElementById('lista-despesas-detalhada');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const menuCloseButton = document.getElementById('menu-close-btn');
    const sideMenu = document.getElementById('side-menu');
    const sideMenuOverlay = document.getElementById('side-menu-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-container');
    const formDentista = document.getElementById('form-dentista');
    const formDentistaTitle = document.getElementById('form-dentista-title');
    const dentistaEditIdInput = document.getElementById('dentista-edit-id');
    const dentistaNomeInput = document.getElementById('dentista-nome-input');
    const dentistaClinicaInput = document.getElementById('dentista-clinica-input');
    const dentistaTelefoneInput = document.getElementById('dentista-telefone-input');
    const dentistaEmailInput = document.getElementById('dentista-email-input');
    const formDentistaSubmitBtn = document.getElementById('form-dentista-submit-btn');
    const formDentistaCancelBtn = document.getElementById('form-dentista-cancel-btn');
    const listaDentistas = document.getElementById('lista-dentistas');
    const dentistaCicloWrapper = document.getElementById('dentista-ciclo-wrapper');
    const dentistaCicloInicioInput = document.getElementById('dentista-ciclo-inicio-input');
    const dentistaCicloFimInput = document.getElementById('dentista-ciclo-fim-input');
    const dentistaValoresSection = document.getElementById('dentista-valores-section');
    const formDentistaValores = document.getElementById('form-dentista-valores');
    const dentistaTipoTrabalhoSelect = document.getElementById('dentista-tipo-trabalho-select');
    const dentistaValorTrabalhoInput = document.getElementById('dentista-valor-trabalho-input');
    const listaDentistaValores = document.getElementById('lista-dentista-valores');
    const kpiFaturamentoMes = document.getElementById('kpi-faturamento-mes');
    const kpiLucroMes = document.getElementById('kpi-lucro-mes');
    const kpiPecasMes = document.getElementById('kpi-pecas-mes');
    const kpiDespesasMes = document.getElementById('kpi-despesas-mes');
    const kpiFaturamentoTrend = document.getElementById('kpi-faturamento-trend');
    const kpiLucroTrend = document.getElementById('kpi-lucro-trend');
    const listaEntregasProximas = document.getElementById('lista-entregas-proximas');
    const actionAddProducao = document.getElementById('action-add-producao');
    const actionAddDespesa = document.getElementById('action-add-despesa');
    const searchProducaoInput = document.getElementById('search-producao-input');
    const searchDentistasInput = document.getElementById('search-dentistas-input');
    const toggleValuesBtn = document.getElementById('toggle-values-btn');
    const eyeIcon = document.getElementById('eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon');
    const formFechamento = document.getElementById('form-fechamento');
    const fechamentoDiaInicioInput = document.getElementById('fechamento-dia-inicio-input');
    const fechamentoDiaFimInput = document.getElementById('fechamento-dia-fim-input');

    // Elementos do Estoque
    const formEstoque = document.getElementById('form-estoque');
    const formEstoqueTitle = document.getElementById('form-estoque-title');
    const estoqueEditIdInput = document.getElementById('estoque-edit-id');
    const estoqueNomeInput = document.getElementById('estoque-nome-input');
    const estoqueFornecedorInput = document.getElementById('estoque-fornecedor-input');
    const estoqueQtdInput = document.getElementById('estoque-qtd-input');
    const estoqueUnidadeInput = document.getElementById('estoque-unidade-input');
    const estoqueMinInput = document.getElementById('estoque-min-input');
    const estoquePrecoInput = document.getElementById('estoque-preco-input');
    const formEstoqueSubmitBtn = document.getElementById('form-estoque-submit-btn');
    const formEstoqueCancelBtn = document.getElementById('form-estoque-cancel-btn');
    const listaEstoque = document.getElementById('lista-estoque');
    const searchEstoqueInput = document.getElementById('search-estoque-input');

    // Work Type Details Modal
    const workTypeDetailsModal = document.getElementById('work-type-details-modal');
    const workTypeDetailsTitle = document.getElementById('work-type-details-title');
    const workTypeDetailsList = document.getElementById('work-type-details-list');
    const closeWorkTypeModalBtn = document.getElementById('close-work-type-modal-btn');
    const closeWorkTypeModalFooterBtn = document.getElementById('close-work-type-modal-footer-btn');

    // Novos elementos para funcionalidades avançadas
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationCount = document.getElementById('notification-count');
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    const notificationsList = document.getElementById('notifications-list');
    const clearNotifications = document.getElementById('clear-notifications');
    const filterStatusSelect = document.getElementById('filter-status-select');
    const filterDataInicio = document.getElementById('filter-data-inicio');
    const filterDataFim = document.getElementById('filter-data-fim');
    
    // Elementos da nova funcionalidade de produção por dentista
    const filterDentistaSelect = document.getElementById('filter-dentista-select');
    const producaoDentistaTableBody = document.getElementById('producao-dentista-table-body');
    const exportDentistaProducaoPdfBtn = document.getElementById('export-dentista-producao-pdf');

    // Botão para alternar Top 15 / Todos no gráfico de dentistas
    const toggleDentistaShowAllBtn = document.getElementById('toggle-dentista-show-all');

    // Novos elementos para controle de mês no dashboard
    const dashboardMesAnoAtualSpan = document.getElementById('dashboard-mes-ano-atual');
    const dashboardPrevMonthBtn = document.getElementById('dashboard-prev-month');
    const dashboardNextMonthBtn = document.getElementById('dashboard-next-month');

    // Botões de exportação
    const exportDashboardPdf = document.getElementById('export-dashboard-pdf');
    const exportProducaoPdf = document.getElementById('export-producao-pdf');
    const exportDentistasPdf = document.getElementById('export-dentistas-pdf');
    const exportAnalisePdf = document.getElementById('export-analise-pdf');
    const exportResumoPdf = document.getElementById('export-resumo-pdf');

    // Elementos do Modal de Confirmação
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');

    // Elementos do Modal de Adicionar Produção Rápida
    const addProductionModal = document.getElementById('add-production-modal');
    const closeAddProductionModalBtn = document.getElementById('close-add-production-modal-btn');
    const quickAddProductionForm = document.getElementById('quick-add-production-form');
    const quickProducaoDentistaInput = document.getElementById('quick-producao-dentista-input');
    const quickProducaoPacienteInput = document.getElementById('quick-producao-paciente-input');
    const quickProductionItemsContainer = document.getElementById('quick-production-items-container');
    const addWorkItemBtn = document.getElementById('add-work-item-btn');
    const quickProducaoObsInput = document.getElementById('quick-producao-obs-input');
    const quickProducaoDataInput = document.getElementById('quick-producao-data-input');
    const quickEntregaDataInput = document.getElementById('quick-entrega-data-input');
    const quickAddProductionCancelBtn = document.getElementById('quick-add-production-cancel-btn');
    const quickAddProductionSubmitBtn = document.getElementById('quick-add-production-submit-btn');

    // Elementos do Modal de Adicionar Dentista Rápido
    const addDentistaModal = document.getElementById('add-dentista-modal');
    const closeAddDentistaModalBtn = document.getElementById('close-add-dentista-modal-btn');
    const quickAddDentistaForm = document.getElementById('quick-add-dentista-form');
    const quickDentistaNomeInput = document.getElementById('quick-dentista-nome-input');
    const quickDentistaClinicaInput = document.getElementById('quick-dentista-clinica-input');
    const quickDentistaTelefoneInput = document.getElementById('quick-dentista-telefone-input');
    const quickDentistaEmailInput = document.getElementById('quick-dentista-email-input');
    const quickAddDentistaCancelBtn = document.getElementById('quick-add-dentista-cancel-btn');

    // Elementos do Modal de Adicionar Despesa Rápida
    const addDespesaModal = document.getElementById('add-despesa-modal');
    const closeAddDespesaModalBtn = document.getElementById('close-add-despesa-modal-btn');
    const quickAddDespesaForm = document.getElementById('quick-add-despesa-form');
    const quickDespesaDescInput = document.getElementById('quick-despesa-desc-input');
    const quickDespesaCategoriaSelect = document.getElementById('quick-despesa-categoria-select');
    const quickDespesaValorInput = document.getElementById('quick-despesa-valor-input');
    const quickDespesaDataInput = document.getElementById('quick-despesa-data-input');
    const quickDespesaRecorrenteCheckbox = document.getElementById('quick-despesa-recorrente-checkbox');
    const quickAddDespesaCancelBtn = document.getElementById('quick-add-despesa-cancel-btn');
    const quickAddDespesaSubmitBtn = document.getElementById('quick-add-despesa-submit-btn');

    // --- FALLBACK: adicionar/remover classe 'modal-open' no <body> quando qualquer modal estiver visível
    const updateBodyModalOpen = () => {
        try {
            const openModals = Array.from(document.querySelectorAll('[id$="-modal"]')).filter(m => m && !m.classList.contains('hidden'));
            if (openModals.length > 0) document.body.classList.add('modal-open');
            else document.body.classList.remove('modal-open');
        } catch (e) { console.warn('updateBodyModalOpen error', e); }
    };

    // Observe alterações de atributo (classe) nos modais existentes
    const modalElements = Array.from(document.querySelectorAll('[id$="-modal"]'));
    if (modalElements.length > 0) {
        const observer = new MutationObserver((mutations) => {
            updateBodyModalOpen();
        });
        modalElements.forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['class'] }));
        updateBodyModalOpen();
    }

    // --- ESTADO DA APLICAÇÃO ---
    let isLoginMode = true;
    let state = {
        valores: [],
        producao: [],
        despesas: [],
        dentistas: [],
        estoque: [],
        quickNotes: [],
        activeQuickNoteId: null,
        mesAtual: new Date().toISOString(),
        closingDayStart: 25,
        closingDayEnd: 24,
        searchTermProducao: '',
        searchTermDentistas: '',
        searchTermEstoque: '',
        searchTermDespesas: '',
        notifications: [],
        showAllDentistas: false
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    let toastTimeout;

    // --- INTERNACIONALIZAÇÃO (i18n) ---
    // (Mantido igual)
    const getFlagSVG = (lang) => {
        const svgs = {
            pt: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 5 36 26" preserveAspectRatio="none" class="w-full h-full object-cover"><path fill="#009b3a" d="M36 27a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v18z"/><path fill="#fedf00" d="M32.73 18L18 29.09 3.27 18 18 6.91z"/><circle fill="#002776" cx="18" cy="18" r="6.5"/><path fill="#fff" d="M12.63 19.34a7.6 7.6 0 0 0 10.9-1.5l.62.77a8.59 8.59 0 0 1-12.28 1.69z"/></svg>',
            en: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 5 36 26" preserveAspectRatio="none" class="w-full h-full object-cover"><path fill="#bd3d44" d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z"/><path fill="#fff" d="M0 9a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v1.86H0zm0 5.43h36v3.71H0zm0 7.43h36v3.71H0z"/><path fill="#192f5d" d="M0 5a4 4 0 0 0 4 4h12.57V5z"/><path fill="#192f5d" d="M0 14.43h16.57V9H0z"/></svg>',
            es: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 5 36 26" preserveAspectRatio="none" class="w-full h-full object-cover"><path fill="#c60b1e" d="M36 27a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v18z"/><path fill="#ffc400" d="M0 12h36v12H0z"/><path fill="#c60b1e" d="M9 14h3v3H9z"/><path fill="#c60b1e" d="M9 19h3v3H9z"/></svg>'
        };
        return svgs[lang] || svgs.pt;
    };

    const updateLanguage = (lang) => {
        currentLang = lang;
        localStorage.setItem('dentalflow_lang', lang);
        
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.dataset.i18n;
            if (translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });

        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            if (translations[lang] && translations[lang][key]) {
                element.placeholder = translations[lang][key];
            }
        });

        const currentBtn = document.getElementById('current-language-btn');
        if (currentBtn) {
            currentBtn.innerHTML = getFlagSVG(lang);
        }

        const languageOptions = document.getElementById('language-options');
        if (languageOptions) {
            languageOptions.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        }

        updateAuthUI();
    };

    const initLanguage = () => {
        const savedLang = localStorage.getItem('dentalflow_lang') || 'pt';
        updateLanguage(savedLang);
        
        const currentBtn = document.getElementById('current-language-btn');
        const languageOptions = document.getElementById('language-options');
        const optionsBtns = document.querySelectorAll('.lang-option-btn');

        if (currentBtn && languageOptions) {
            currentBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                languageOptions.classList.toggle('opacity-0');
                languageOptions.classList.toggle('translate-y-4');
                languageOptions.classList.toggle('pointer-events-none');
            });

            document.addEventListener('click', (e) => {
                if (!currentBtn.contains(e.target) && !languageOptions.contains(e.target)) {
                    languageOptions.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
                }
            });
        }

        optionsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = btn.dataset.lang;
                updateLanguage(lang);
            });
        });
    };

    const showToast = (message, type = 'error') => {
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toastNotification.classList.remove('bg-red-500', 'bg-green-500');
        toastNotification.classList.add(type === 'error' ? 'bg-red-500' : 'bg-green-500');
        toastNotification.style.transform = 'translateX(0)';
        toastTimeout = setTimeout(() => {
            toastNotification.style.transform = 'translateX(calc(100% + 1.25rem))';
        }, 3000);
    };
    
    const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

    const abbreviateName = (name, maxLen = 28) => {
        if (!name) return '';
        if (name.length <= maxLen) return name;
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            const first = parts[0];
            const last = parts[parts.length - 1];
            const short = `${first} ${last}`;
            if (short.length <= maxLen) return short;
            const initials = parts.map(p => p[0]).join('');
            if (initials.length <= maxLen) return initials;
        }
        return name.slice(0, maxLen - 1) + '…';
    };
    
    const navigateToView = (viewId) => {
        const link = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        if (link) { link.click(); }
    };

    const getBillingPeriod = (targetDate) => {
        const startDay = state.closingDayStart || 25;
        const endDay = state.closingDayEnd || 24;
        let year = targetDate.getFullYear();
        let month = targetDate.getMonth();

        let startDate, endDate;

        if (startDay > endDay) {
            endDate = new Date(year, month, endDay, 23, 59, 59);
            startDate = new Date(year, month - 1, startDay, 0, 0, 0);
        } else {
            startDate = new Date(year, month, startDay, 0, 0, 0);
            endDate = new Date(year, month, endDay, 23, 59, 59);
        }

        return { startDate, endDate };
    };

    const setButtonLoading = (button, isLoading, originalText = null) => {
        if (isLoading) {
            button.disabled = true;
            if (originalText) button.dataset.originalText = originalText;
            button.innerHTML = `<svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || '';
        }
    };

    const showConfirmationModal = (title, message) => {
        confirmationTitle.textContent = title;
        confirmationMessage.textContent = message;
        confirmationModal.classList.remove('hidden');

        return new Promise((resolve) => {
            const newYesBtn = confirmYesBtn.cloneNode(true);
            const newNoBtn = confirmNoBtn.cloneNode(true);
            confirmYesBtn.replaceWith(newYesBtn);
            confirmNoBtn.replaceWith(newNoBtn);

            newYesBtn.addEventListener('click', () => {
                confirmationModal.classList.add('hidden');
                resolve(true);
            });
            
            newNoBtn.addEventListener('click', () => {
                confirmationModal.classList.add('hidden');
                resolve(false);
            });
        });
    };

    // --- NOTIFICAÇÕES (Simples) ---
    const addNotification = (message, type = 'info', priority = 'normal') => {
        const notification = { id: Date.now(), message, type, priority, timestamp: new Date(), read: false };
        state.notifications.unshift(notification);
        if (state.notifications.length > 50) state.notifications = state.notifications.slice(0, 50);
        updateNotificationUI();
        saveDataToFirestore();
    };

    const updateNotificationUI = () => {
        const unreadCount = state.notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            notificationCount.textContent = unreadCount;
            notificationCount.classList.remove('hidden');
        } else {
            notificationCount.classList.add('hidden');
        }
        renderNotificationsList();
    };

    const renderNotificationsList = () => {
        if (!notificationsList) return;
        notificationsList.innerHTML = '';
        if (state.notifications.length === 0) {
            notificationsList.innerHTML = `<div class="p-4 text-center text-gray-500 text-sm">${t('notifications_empty')}</div>`;
            return;
        }
        state.notifications.slice(0, 10).forEach(notification => {
            const el = document.createElement('div');
            el.className = `p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notification.read ? 'bg-primary/10' : ''}`;
            el.innerHTML = `
                <div class="flex justify-between items-start">
                    <p class="text-sm text-gray-200 ${!notification.read ? 'font-semibold' : ''}">${notification.message}</p>
                    ${!notification.read ? '<span class="w-2 h-2 bg-primary rounded-full mt-1"></span>' : ''}
                </div>
                <p class="text-xs text-gray-500 mt-1">${getTimeAgo(notification.timestamp)}</p>
            `;
            el.addEventListener('click', () => {
                notification.read = true;
                updateNotificationUI();
                saveDataToFirestore();
            });
            notificationsList.appendChild(el);
        });
    };

    const getTimeAgo = (timestamp) => {
        const diff = new Date() - new Date(timestamp);
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m atrás`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    const getNotificationIcon = (type) => ''; // Not used in simplified list

    // --- GRÁFICOS ---
    const initializeCharts = () => {
        // --- Dashboard: Revenue (Line Chart) ---
        const revenueCtx = document.getElementById('dashboard-revenue-chart');
        if (revenueCtx) {
            charts.dashboardRevenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: '#8b5cf6', // Neon Purple
                        backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
                            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
                            return gradient;
                        },
                        borderWidth: 3,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#fff',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false, min: 0 }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        }

        // --- Dashboard: Analytics (Doughnut) ---
        const analyticsCtx = document.getElementById('dashboard-analytics-chart');
        if (analyticsCtx) {
            charts.dashboardAnalytics = new Chart(analyticsCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#8b5cf6', // Purple
                            '#3b82f6', // Blue
                            '#c084fc', // Lilac
                            '#10b981', // Green
                            '#f59e0b', // Yellow
                            '#ef4444'  // Red
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => ` ${context.label}: ${context.raw} itens`
                            }
                        }
                    }
                }
            });
        }

        // --- Other Views (kept for functionality) ---
        const faturamentoDiarioCtx = document.getElementById('faturamento-diario-chart');
        if (faturamentoDiarioCtx) {
            charts.faturamentoDiario = new Chart(faturamentoDiarioCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Faturamento',
                        data: [],
                        backgroundColor: '#3b82f6',
                        borderRadius: 4,
                        barThickness: 'flex',
                        maxBarThickness: 30
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#8b92a5' } },
                        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8b92a5' } }
                    }
                }
            });
        }

        const dentistaCtx = document.getElementById('dentista-chart');
        if (dentistaCtx) {
            charts.dentista = new Chart(dentistaCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Faturamento',
                        data: [],
                        backgroundColor: '#8b5cf6',
                        borderRadius: 4,
                        barThickness: 20
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8b92a5' } },
                        y: { grid: { display: false }, ticks: { color: '#8b92a5' } }
                    }
                }
            });
        }
    };

    const updateCharts = () => {
        updateDashboardRevenueChart();
        updateDashboardAnalyticsChart();
        updateDailyRevenueChart(); // For the summary view
        updateDentistaChart();     // For the analysis view
    };

    // New: Update Dashboard Revenue Chart
    const updateDashboardRevenueChart = () => {
        if (!charts.dashboardRevenue) return;

        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const days = [];
        const data = [];
        let totalRevenue = 0;

        let currentDay = new Date(startDate);
        currentDay.setHours(12, 0, 0, 0);
        const endDayCheck = new Date(endDate);
        endDayCheck.setHours(12, 0, 0, 0);

        // Pre-calculate daily totals
        const productionByDay = {};
        (state.producao || []).forEach(p => {
            const d = new Date(p.data + "T00:00:00");
            if (d >= startDate && d <= endDate) {
                const dayStr = p.data;
                const dentista = (state.dentistas || []).find(dev => dev.id === p.dentista);
                const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
                const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
                const valor = (valorDentista || valorGlobal)?.valor || 0;

                if (!productionByDay[dayStr]) productionByDay[dayStr] = 0;
                productionByDay[dayStr] += valor * p.qtd;
                totalRevenue += valor * p.qtd;
            }
        });

        // Fill chart data
        while (currentDay <= endDayCheck) {
            const yyyy = currentDay.getFullYear();
            const mm = String(currentDay.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDay.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            data.push(productionByDay[dateStr] || 0);
            days.push(dd + '/' + mm);
            currentDay.setDate(currentDay.getDate() + 1);
        }

        charts.dashboardRevenue.data.labels = days;
        charts.dashboardRevenue.data.datasets[0].data = data;
        charts.dashboardRevenue.update();

        // Update the big number in dashboard
        const revenueHighlight = document.getElementById('revenue-highlight');
        if (revenueHighlight) revenueHighlight.textContent = formatarMoeda(totalRevenue);
    };

    // New: Update Dashboard Analytics Chart (Work Types)
    const updateDashboardAnalyticsChart = () => {
        if (!charts.dashboardAnalytics) return;

        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const typeCounts = {};
        let totalItems = 0;

        (state.producao || []).forEach(p => {
            const d = new Date(p.data + "T00:00:00");
            if (d >= startDate && d <= endDate) {
                typeCounts[p.tipo] = (typeCounts[p.tipo] || 0) + p.qtd;
                totalItems += p.qtd;
            }
        });

        // Sort by count and take top 5, group rest as "Outros"
        let sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 5) {
            const top5 = sorted.slice(0, 5);
            const othersCount = sorted.slice(5).reduce((acc, curr) => acc + curr[1], 0);
            sorted = [...top5, ['Outros', othersCount]];
        }

        charts.dashboardAnalytics.data.labels = sorted.map(s => s[0]);
        charts.dashboardAnalytics.data.datasets[0].data = sorted.map(s => s[1]);
        charts.dashboardAnalytics.update();

        const totalEl = document.getElementById('analytics-total');
        if (totalEl) totalEl.textContent = totalItems;
    };

    // (Logic for existing charts kept for compatibility with other views)
    const updateDailyRevenueChart = () => {
        if (!charts.faturamentoDiario) return;
        // ... (Logic similar to updateDashboardRevenueChart but for the 'Resumo' view)
        // Re-implementing briefly to ensure consistency
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const labels = [];
        const data = [];
        
        let currentDay = new Date(startDate);
        currentDay.setHours(12,0,0,0);
        const endDayCheck = new Date(endDate);
        endDayCheck.setHours(12,0,0,0);

        const productionByDay = {};
        (state.producao || []).forEach(p => {
            const d = new Date(p.data + "T00:00:00");
            if (d >= startDate && d <= endDate) {
                const dentista = (state.dentistas || []).find(dev => dev.id === p.dentista);
                const valor = ((dentista?.valores || []).find(v => v.tipo === p.tipo) || (state.valores || []).find(v => v.tipo === p.tipo))?.valor || 0;
                productionByDay[p.data] = (productionByDay[p.data] || 0) + (valor * p.qtd);
            }
        });

        while(currentDay <= endDayCheck) {
            const iso = currentDay.toISOString().split('T')[0];
            labels.push(currentDay.getDate());
            data.push(productionByDay[iso] || 0);
            currentDay.setDate(currentDay.getDate() + 1);
        }

        charts.faturamentoDiario.data.labels = labels;
        charts.faturamentoDiario.data.datasets[0].data = data;
        charts.faturamentoDiario.update();
    };

    const updateDentistaChart = () => {
        if (!charts.dentista) return;
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const map = {};
        
        (state.producao || []).filter(p => {
            const d = new Date(p.data + "T00:00:00");
            return d >= startDate && d <= endDate;
        }).forEach(p => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            if (!dentista) return;
            const valor = ((dentista.valores || []).find(v => v.tipo === p.tipo) || (state.valores || []).find(v => v.tipo === p.tipo))?.valor || 0;
            if (!map[dentista.nome]) map[dentista.nome] = { faturamento: 0, pecas: 0 };
            map[dentista.nome].faturamento += valor * p.qtd;
            map[dentista.nome].pecas += p.qtd;
        });

        const entries = Object.entries(map).map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.faturamento - a.faturamento);
        const top = state.showAllDentistas ? entries : entries.slice(0, 15);

        charts.dentista.data.labels = top.map(e => abbreviateName(e.nome));
        charts.dentista.data.datasets[0].data = top.map(e => e.faturamento);
        charts.dentista._piecesMap = top.reduce((acc, cur) => { acc[cur.nome] = cur.pecas; return acc; }, {});
        charts.dentista._fullNames = top.map(e => e.nome);
        
        // Dynamic height adjustment
        const canvas = document.getElementById('dentista-chart');
        if (canvas) canvas.height = Math.max(300, top.length * 40 + 50);
        
        charts.dentista.update();
    };

    // --- RENDERIZAÇÃO DA DASHBOARD (Reduzida para focar em dados) ---
    const renderizarDashboard = () => {
        updateMonthDisplay();
        
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const prevMonth = new Date(state.mesAtual);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const { startDate: prevStart, endDate: prevEnd } = getBillingPeriod(prevMonth);

        const faturamento = calculateFaturamentoForPeriod(startDate, endDate);
        const faturamentoPrev = calculateFaturamentoForPeriod(prevStart, prevEnd);
        
        const despesas = (state.despesas || []).filter(d => {
            const date = new Date(d.data + "T00:00:00");
            return date >= startDate && date <= endDate;
        }).reduce((acc, d) => acc + d.valor, 0);
        
        const despesasPrev = (state.despesas || []).filter(d => {
            const date = new Date(d.data + "T00:00:00");
            return date >= prevStart && date <= prevEnd;
        }).reduce((acc, d) => acc + d.valor, 0);

        const pecas = (state.producao || []).filter(p => {
            const date = new Date(p.data + "T00:00:00");
            return date >= startDate && date <= endDate;
        }).reduce((acc, p) => acc + p.qtd, 0);

        const lucro = faturamento - despesas;
        const lucroPrev = faturamentoPrev - despesasPrev;

        // Update KPIs
        const kpiFaturamentoTrend = document.getElementById('kpi-faturamento-trend');
        const kpiLucroTrend = document.getElementById('kpi-lucro-trend');
        
        if (kpiLucroMes) kpiLucroMes.textContent = formatarMoeda(lucro);
        if (kpiPecasMes) kpiPecasMes.textContent = pecas;
        if (kpiDespesasMes) kpiDespesasMes.textContent = formatarMoeda(despesas);

        // Render Trends
        const renderTrend = (curr, prev, el) => {
            if (!el) return;
            const diff = prev === 0 ? 100 : ((curr - prev) / prev) * 100;
            const isPos = diff >= 0;
            const color = isPos ? 'text-green-400' : 'text-red-400';
            const arrow = isPos ? '↑' : '↓';
            el.innerHTML = `<span class="${color}">${arrow} ${Math.abs(diff).toFixed(0)}%</span>`;
        };

        renderTrend(faturamento, faturamentoPrev, kpiFaturamentoTrend);
        renderTrend(lucro, lucroPrev, kpiLucroTrend);

        // Populate Timeline
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const future = new Date(hoje);
        future.setDate(hoje.getDate() + 30);

        const items = (state.producao || [])
            .filter(p => p.status !== 'Finalizado')
            .map(p => ({ ...p, dateObj: new Date(p.entrega + "T00:00:00") }))
            .filter(p => p.dateObj >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 30) && p.dateObj <= future) // Show overdue too
            .sort((a, b) => a.dateObj - b.dateObj);

        if (listaEntregasProximas) {
            listaEntregasProximas.innerHTML = items.length ? '' : '<p class="text-sm text-gray-500 text-center mt-4">Nada pendente.</p>';
            items.forEach(item => {
                const dentistaName = (state.dentistas.find(d => d.id === item.dentista)?.nome || 'Desconhecido').split(' ')[0];
                const isOverdue = item.dateObj < hoje;
                const el = document.createElement('div');
                el.className = 'timeline-item pl-4 border-l-2 border-white/5 py-1';
                el.innerHTML = `
                    <div class="flex justify-between items-center group cursor-pointer finalize-entrega-btn" data-id="${item.id}" title="Clique para finalizar">
                        <div>
                            <p class="text-sm font-semibold text-gray-200 group-hover:text-primary transition-colors">${item.nomePaciente}</p>
                            <p class="text-xs text-gray-500">${dentistaName} • ${item.tipo}</p>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-bold ${isOverdue ? 'text-red-400' : 'text-gray-400'}">${item.dateObj.getDate()}/${item.dateObj.getMonth()+1}</span>
                        </div>
                    </div>
                `;
                listaEntregasProximas.appendChild(el);
            });
        }

        updateCharts();
        toggleValuesVisibility();
    };

    // --- INICIALIZAÇÃO ---
    const initApp = () => {
        document.querySelectorAll('button[type="submit"]').forEach(button => {
            button.dataset.originalText = button.innerHTML;
        });
        const hoje = new Date();
        producaoDataInput.valueAsDate = hoje;
        entregaDataInput.valueAsDate = hoje;
        despesaDataInput.valueAsDate = hoje;
        
        if (producaoItemsContainer) {
            producaoItemsContainer.innerHTML = '';
            producaoItemsContainer.appendChild(createMainFormItemRow());
            updateMainRemoveButtonsVisibility();
        }

        initLanguage();
        // Delay chart init slightly to ensure DOM is ready
        setTimeout(initializeCharts, 100);
    };

    // --- FIREBASE INIT ---
    async function initializeFirebase() {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyDEDzQkvYegnFT2EK7RI_xZxconQ3-Q9GU",
                authDomain: "cad-manager-d7eaf.firebaseapp.com",
                projectId: "cad-manager-d7eaf",
                storageBucket: "cad-manager-d7eaf.appspot.com",
                messagingSenderId: "631779304741",
                appId: "1:631779304741:web:57c388a39cbe1ec32766cc"
            };
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            storage = getStorage(app);
            functions = getFunctions(app, 'southamerica-east1'); 
            onAuthStateChanged(auth, (user) => {
                initialLoadingOverlay.classList.add('hidden');
                if (user) {
                    userId = user.uid;
                    userEmailDisplay.textContent = user.email;
                    authScreen.classList.add('hidden');
                    appContent.classList.remove('hidden');
                    setupFirestoreListener(userId);
                } else {
                    userId = null;
                    if (unsubscribeFromFirestore) unsubscribeFromFirestore();
                    appContent.classList.add('hidden');
                    authScreen.classList.remove('hidden');
                }
            });
        } catch (error) {
            console.error("Erro ao inicializar o Firebase:", error);
            initialLoadingOverlay.innerHTML = "<p>Não foi possível ligar à base de dados.</p>";
        }
    }

	initApp();
	initializeFirebase();

    // EXPOSE FOR TESTING
    window.appState = state;
    window.appRender = renderAllUIComponents;
    window.appUpdateState = (newState) => { state = {...state, ...newState}; };
});
