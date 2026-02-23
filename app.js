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

    // --- HELPERS FOR DYNAMIC FORMS ---

    const createMainFormItemRow = (selectedValue = '', quantity = 1) => {
        const row = document.createElement('div');
        row.className = 'main-work-item-group flex gap-2 items-start';
        row.innerHTML = `
            <div class="flex-1">
                 <select class="main-producao-tipo-select w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm" required>
                    <option value="" data-i18n="placeholder_select_work_type">${t('placeholder_select_work_type')}</option>
                </select>
            </div>
            <div class="w-24">
                 <input type="number" class="main-producao-qtd-input w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm" placeholder="${t('placeholder_quantity')}" data-i18n-placeholder="placeholder_quantity" value="${quantity}" min="1" required>
            </div>
            <button type="button" class="remove-main-item-btn p-3 text-red-400 hover:text-red-300 rounded-lg hover:bg-white/10 transition-colors" title="Remover">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;
        const select = row.querySelector('select');
        (state.valores || []).forEach(valor => {
            const option = document.createElement('option');
            option.value = valor.tipo;
            option.textContent = valor.tipo;
            select.appendChild(option);
        });
        if (selectedValue) select.value = selectedValue;
        return row;
    };

    const updateMainRemoveButtonsVisibility = () => {
        if (!producaoItemsContainer) return;
        const rows = producaoItemsContainer.querySelectorAll('.main-work-item-group');
        const removeBtns = producaoItemsContainer.querySelectorAll('.remove-main-item-btn');
        if (rows.length === 1) {
            removeBtns.forEach(btn => btn.classList.add('hidden'));
        } else {
            removeBtns.forEach(btn => btn.classList.remove('hidden'));
        }
    };

    const createWorkItemRow = () => {
        const row = document.createElement('div');
        row.className = 'work-item-group flex gap-2 items-start';
        row.innerHTML = `
            <div class="flex-1">
                 <select class="quick-producao-tipo-select w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm" required>
                    <option value="" data-i18n="placeholder_select_work_type">Selecione o tipo de trabalho</option>
                </select>
            </div>
            <div class="w-24">
                 <input type="number" class="quick-producao-qtd-input w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm" placeholder="Qtd" value="1" min="1" required>
            </div>
            <button type="button" class="remove-work-item-btn p-3 text-red-400 hover:text-red-300 rounded-lg hover:bg-white/10 transition-colors" title="Remover">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;
        const select = row.querySelector('select');
        (state.valores || []).forEach(valor => {
            const option = document.createElement('option');
            option.value = valor.tipo;
            option.textContent = valor.tipo;
            select.appendChild(option);
        });
        return row;
    };

    const updateRemoveButtonsVisibility = () => {
        if (!quickProductionItemsContainer) return;
        const rows = quickProductionItemsContainer.querySelectorAll('.work-item-group');
        const removeBtns = quickProductionItemsContainer.querySelectorAll('.remove-work-item-btn');
        if (rows.length === 1) {
            removeBtns.forEach(btn => btn.classList.add('hidden'));
        } else {
            removeBtns.forEach(btn => btn.classList.remove('hidden'));
        }
    };

    // --- HELPER FUNCTIONS MISSING ---

    const updateAuthUI = () => {
        if (isLoginMode) {
            authTitle.dataset.i18n = "auth_title_login";
            authTitle.textContent = t('auth_title_login');
            authButton.dataset.i18n = "auth_button_login";
            authButton.textContent = t('auth_button_login');
            toggleAuthMode.innerHTML = `<span data-i18n="auth_toggle_register">${t('auth_toggle_register')}</span>`;
        } else {
            authTitle.dataset.i18n = "auth_title_register";
            authTitle.textContent = t('auth_title_register');
            authButton.dataset.i18n = "auth_button_register";
            authButton.textContent = t('auth_button_register');
            toggleAuthMode.innerHTML = `<span data-i18n="auth_toggle_login">${t('auth_toggle_login')}</span>`;
        }
    };

    const toggleValuesVisibility = (caller) => {
        const isHidden = document.body.classList.toggle('values-hidden');
        const elements = document.querySelectorAll('.monetary-value');

        if (isHidden) {
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
            elements.forEach(el => {
                if (!el.dataset.originalValue) el.dataset.originalValue = el.textContent;
                el.textContent = '---';
            });
        } else {
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
            elements.forEach(el => {
                if (el.dataset.originalValue) el.textContent = el.dataset.originalValue;
            });
        }
    };

    const updateMonthDisplay = () => {
        const date = new Date(state.mesAtual);
        const options = { month: 'long', year: 'numeric' };
        const text = date.toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : (currentLang === 'es' ? 'es-ES' : 'en-US'), options);
        const capitalized = text.charAt(0).toUpperCase() + text.slice(1);

        if (mesAnoAtualSpan) mesAnoAtualSpan.textContent = capitalized;
        if (dashboardMesAnoAtualSpan) dashboardMesAnoAtualSpan.textContent = capitalized;
    };

    const calculateFaturamentoForPeriod = (startDate, endDate) => {
        let total = 0;
        (state.producao || []).forEach(p => {
            const d = new Date(p.data + "T00:00:00");
            if (d >= startDate && d <= endDate) {
                const dentista = (state.dentistas || []).find(dev => dev.id === p.dentista);
                const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
                const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
                const valor = (valorDentista || valorGlobal)?.valor || 0;
                total += valor * p.qtd;
            }
        });
        return total;
    };

    const setupFirestoreListener = (uid) => {
        const userDocRef = doc(db, 'users', uid);
        unsubscribeFromFirestore = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                state = { ...state, ...data };
                // Ensure array fields exist
                state.producao = state.producao || [];
                state.despesas = state.despesas || [];
                state.dentistas = state.dentistas || [];
                state.estoque = state.estoque || [];
                state.valores = state.valores || [];
                state.quickNotes = state.quickNotes || [];
                state.notifications = state.notifications || [];

                renderAllUIComponents();
            } else {
                // Initialize new user
                saveDataToFirestore();
            }
        }, (error) => {
            console.error("Firestore Error:", error);
            showToast(t('toast_error_generic'), 'error');
        });
    };

    let saveTimeout;
    const saveDataToFirestore = () => {
        if (!userId) return;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                const userDocRef = doc(db, 'users', userId);
                const dataToSave = {
                    valores: state.valores,
                    producao: state.producao,
                    despesas: state.despesas,
                    dentistas: state.dentistas,
                    estoque: state.estoque,
                    quickNotes: state.quickNotes,
                    closingDayStart: state.closingDayStart,
                    closingDayEnd: state.closingDayEnd,
                    notifications: state.notifications
                };
                await setDoc(userDocRef, dataToSave, { merge: true });
            } catch (error) {
                console.error("Error saving to Firestore:", error);
                showToast(t('toast_error_generic'), 'error');
            }
        }, 1000);
    };

    const renderAllUIComponents = () => {
        if (typeof renderizarDashboard === 'function') renderizarDashboard();
        if (typeof renderizarProducao === 'function') renderizarProducao();
        if (typeof renderizarEstoque === 'function') renderizarEstoque();
        if (typeof renderizarDespesas === 'function') renderizarDespesas();
        if (typeof renderizarDentistas === 'function') renderizarDentistas();
        if (typeof renderizarAnaliseDentista === 'function') renderizarAnaliseDentista();
        if (typeof renderizarResumo === 'function') renderizarResumo();

        updateNotificationUI();

        const pacientesList = document.getElementById('pacientes-list');
        if (pacientesList) {
            pacientesList.innerHTML = '';
            const pacientes = [...new Set((state.producao || []).map(p => p.nomePaciente))].sort();
            pacientes.forEach(nome => {
                const option = document.createElement('option');
                option.value = nome;
                pacientesList.appendChild(option);
            });
        }

        const dentistasList = document.getElementById('dentistas-list');
        if (dentistasList) {
            dentistasList.innerHTML = '';
            (state.dentistas || []).sort((a,b) => a.nome.localeCompare(b.nome)).forEach(d => {
                const option = document.createElement('option');
                option.value = d.nome;
                dentistasList.appendChild(option);
            });
        }
    };

    const renderizarProducao = () => {
        if (listaProducaoDia) {
            listaProducaoDia.innerHTML = '';
            const hoje = new Date().toISOString().split('T')[0];
            const producaoDia = (state.producao || []).filter(p => p.data === hoje);

            let totalPecas = 0;
            let totalValor = 0;

            if (producaoDia.length === 0) {
                listaProducaoDia.innerHTML = '<p class="text-gray-500 text-center text-sm py-4">Nenhuma produção hoje.</p>';
            } else {
                producaoDia.forEach(p => {
                    const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
                    const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
                    const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
                    const valor = (valorDentista || valorGlobal)?.valor || 0;

                    totalPecas += p.qtd;
                    totalValor += valor * p.qtd;

                    const el = document.createElement('div');
                    el.className = 'flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5';
                    el.innerHTML = `
                        <div>
                            <p class="font-bold text-sm text-gray-200">${p.nomePaciente}</p>
                            <p class="text-xs text-gray-500">${dentista ? dentista.nome : 'Dentista Desconhecido'} • ${p.tipo}</p>
                        </div>
                        <div class="text-right">
                             <p class="font-bold text-primary text-sm monetary-value">${formatarMoeda(valor * p.qtd)}</p>
                             <p class="text-xs text-gray-500">${p.qtd} un</p>
                        </div>
                    `;
                    listaProducaoDia.appendChild(el);
                });
            }
            if (totalPecasDia) totalPecasDia.textContent = totalPecas;
            if (totalFaturamentoDia) totalFaturamentoDia.textContent = formatarMoeda(totalValor);
        }

        if (producaoDentistaTableBody) {
            producaoDentistaTableBody.innerHTML = '';
            let filtered = state.producao || [];

            if (filterDentistaSelect && filterDentistaSelect.value) {
                const dentistaNome = filterDentistaSelect.value;
                const dentista = state.dentistas.find(d => d.nome === dentistaNome);
                if (dentista) {
                   filtered = filtered.filter(p => p.dentista === dentista.id);
                }
            }

            if (filterStatusSelect && filterStatusSelect.value) {
                filtered = filtered.filter(p => p.status === filterStatusSelect.value);
            }

            if (filterDataInicio && filterDataInicio.value) {
                 filtered = filtered.filter(p => p.data >= filterDataInicio.value);
            }

            if (filterDataFim && filterDataFim.value) {
                 filtered = filtered.filter(p => p.data <= filterDataFim.value);
            }

            if (!filterDataInicio.value && !filterDentistaSelect.value) {
                filtered = filtered.sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0, 50);
            }

            if (filtered.length === 0) {
                 producaoDentistaTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Nenhum registro encontrado.</td></tr>';
            } else {
                 filtered.forEach(p => {
                    const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
                    const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
                    const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
                    const valor = (valorDentista || valorGlobal)?.valor || 0;

                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-white/5 transition-colors border-b border-white/5';
                    tr.innerHTML = `
                        <td class="p-3">${dentista ? abbreviateName(dentista.nome) : 'Desconhecido'}</td>
                        <td class="p-3">${p.nomePaciente}</td>
                        <td class="p-3 text-xs text-gray-400">${p.tipo} (${p.qtd})</td>
                        <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold ${p.status === 'Finalizado' ? 'bg-green-500/20 text-green-400' : (p.status === 'Em Andamento' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400')}">${p.status}</span></td>
                        <td class="p-3 monetary-value font-medium">${formatarMoeda(valor * p.qtd)}</td>
                        <td class="p-3 text-right">
                            <button class="text-gray-400 hover:text-white mr-2 edit-producao-btn" data-id="${p.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                            <button class="text-red-400 hover:text-red-300 delete-producao-btn" data-id="${p.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </td>
                    `;
                    producaoDentistaTableBody.appendChild(tr);
                 });
            }
        }

        if (filterDentistaSelect && filterDentistaSelect.options.length <= 1) {
             filterDentistaSelect.innerHTML = '<option value="">Todos Dentistas</option>';
             (state.dentistas || []).sort((a,b) => a.nome.localeCompare(b.nome)).forEach(d => {
                const option = document.createElement('option');
                option.value = d.nome;
                option.textContent = d.nome;
                filterDentistaSelect.appendChild(option);
            });
        }
    };

    const renderizarEstoque = () => {
        if (!listaEstoque) return;
        listaEstoque.innerHTML = '';

        let filtered = state.estoque || [];
        if (state.searchTermEstoque) {
            const term = state.searchTermEstoque.toLowerCase();
            filtered = filtered.filter(i => i.nome.toLowerCase().includes(term) || (i.fornecedor && i.fornecedor.toLowerCase().includes(term)));
        }

        if (filtered.length === 0) {
             listaEstoque.innerHTML = '<p class="text-gray-500 text-center col-span-2">Nenhum material encontrado.</p>';
        } else {
             filtered.forEach(item => {
                const isLow = item.qtd <= item.min;
                const el = document.createElement('div');
                el.className = `p-4 rounded-xl border ${isLow ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`;
                el.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-bold text-gray-200">${item.nome}</h4>
                            <p class="text-xs text-gray-500">${item.fornecedor || 'Sem fornecedor'}</p>
                        </div>
                        <div class="flex gap-2">
                            <button class="text-gray-400 hover:text-white edit-estoque-btn" data-id="${item.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                            <button class="text-red-400 hover:text-red-300 delete-estoque-btn" data-id="${item.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </div>
                    </div>
                    <div class="flex justify-between items-end mt-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Quantidade</p>
                            <p class="text-xl font-bold ${isLow ? 'text-red-400' : 'text-primary'}">${item.qtd} <span class="text-xs font-normal text-gray-400">${item.unidade}</span></p>
                        </div>
                         <div>
                            <p class="text-xs text-gray-500 mb-1 text-right">Preço Un.</p>
                            <p class="font-bold monetary-value">${formatarMoeda(item.preco)}</p>
                        </div>
                    </div>
                `;
                listaEstoque.appendChild(el);
             });
        }
    };

    const renderizarDespesas = () => {
        if (!listaDespesasCompleta) return;
        listaDespesasCompleta.innerHTML = '';

        let filtered = state.despesas || [];
        if (state.searchTermDespesas) {
             const term = state.searchTermDespesas.toLowerCase();
             filtered = filtered.filter(d => d.desc.toLowerCase().includes(term) || d.categoria.toLowerCase().includes(term));
        }

        filtered = filtered.sort((a,b) => new Date(b.data) - new Date(a.data));

        if (filtered.length === 0) {
            listaDespesasCompleta.innerHTML = '<p class="text-gray-500 text-center text-sm py-4">Nenhuma despesa registrada.</p>';
        } else {
            filtered.forEach(d => {
                const el = document.createElement('div');
                el.className = 'flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5';
                el.innerHTML = `
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="font-bold text-sm text-gray-200">${d.desc}</p>
                            ${d.recorrente ? '<span class="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">R</span>' : ''}
                        </div>
                        <p class="text-xs text-gray-500">${new Date(d.data).toLocaleDateString()} • ${d.categoria}</p>
                    </div>
                     <div class="flex items-center gap-4">
                        <p class="font-bold text-red-400 text-sm monetary-value">- ${formatarMoeda(d.valor)}</p>
                        <div class="flex gap-1">
                             <button class="text-gray-400 hover:text-white edit-despesa-btn" data-id="${d.id}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                            <button class="text-red-400 hover:text-red-300 delete-despesa-btn" data-id="${d.id}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </div>
                    </div>
                `;
                listaDespesasCompleta.appendChild(el);
            });
        }

        if (despesasContainer) {
             despesasContainer.innerHTML = '';
             const recent = filtered.slice(0, 5);
             if (recent.length === 0) {
                 despesasContainer.innerHTML = '<p class="text-gray-500 text-center text-xs">Sem dados.</p>';
             } else {
                 recent.forEach(d => {
                     const el = document.createElement('div');
                     el.className = 'flex justify-between items-center text-sm p-2 hover:bg-white/5 rounded';
                     el.innerHTML = `<span>${d.desc}</span><span class="text-red-400 monetary-value">- ${formatarMoeda(d.valor)}</span>`;
                     despesasContainer.appendChild(el);
                 });
             }
        }
    };

    const renderizarDentistas = () => {
        if (!listaDentistas) return;
        listaDentistas.innerHTML = '';

        let filtered = state.dentistas || [];
        if (state.searchTermDentistas) {
            const term = state.searchTermDentistas.toLowerCase();
            filtered = filtered.filter(d => d.nome.toLowerCase().includes(term) || (d.clinica && d.clinica.toLowerCase().includes(term)));
        }

        filtered.sort((a,b) => a.nome.localeCompare(b.nome));

        if (filtered.length === 0) {
            listaDentistas.innerHTML = '<p class="text-gray-500 text-center col-span-2">Nenhum dentista encontrado.</p>';
        } else {
            filtered.forEach(d => {
                const el = document.createElement('div');
                el.className = 'p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center';
                el.innerHTML = `
                    <div class="flex items-center gap-3">
                         <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            ${d.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-200 text-sm">${d.nome}</h4>
                            <p class="text-xs text-gray-500">${d.clinica || 'Sem clínica'} • ${d.telefone || 'Sem telefone'}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="text-gray-400 hover:text-white edit-dentista-btn" data-id="${d.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button class="text-red-400 hover:text-red-300 delete-dentista-btn" data-id="${d.id}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                `;
                listaDentistas.appendChild(el);
            });
        }
    };

    const renderizarAnaliseDentista = () => {
        updateDentistaChart();

        if (!dentistaSummaryTableBody) return;
        dentistaSummaryTableBody.innerHTML = '';

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

        entries.forEach(entry => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-colors border-b border-white/5';
            tr.innerHTML = `
                <td class="p-3 font-medium">${entry.nome}</td>
                <td class="p-3 text-gray-400">${entry.pecas}</td>
                <td class="p-3 text-primary font-bold monetary-value">${formatarMoeda(entry.faturamento)}</td>
                <td class="p-3 text-gray-400 monetary-value">${formatarMoeda(entry.pecas ? entry.faturamento / entry.pecas : 0)}</td>
            `;
            dentistaSummaryTableBody.appendChild(tr);
        });

        toggleValuesVisibility();
    };

    const renderizarResumo = () => {
        updateDailyRevenueChart();

        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));

        const faturamento = calculateFaturamentoForPeriod(startDate, endDate);
        const despesas = (state.despesas || []).filter(d => {
            const date = new Date(d.data + "T00:00:00");
            return date >= startDate && date <= endDate;
        }).reduce((acc, d) => acc + d.valor, 0);

        const pecas = (state.producao || []).filter(p => {
            const date = new Date(p.data + "T00:00:00");
            return date >= startDate && date <= endDate;
        }).reduce((acc, p) => acc + p.qtd, 0);

        const lucro = faturamento - despesas;

        if (totalPecasMes) totalPecasMes.textContent = pecas;
        if (totalFaturamentoMes) totalFaturamentoMes.textContent = formatarMoeda(faturamento);
        if (totalDespesasMes) totalDespesasMes.textContent = formatarMoeda(despesas);
        if (lucroLiquidoMes) lucroLiquidoMes.textContent = formatarMoeda(lucro);

        if (faturamentoBarLabel) faturamentoBarLabel.textContent = formatarMoeda(faturamento);
        if (despesasBarLabel) despesasBarLabel.textContent = formatarMoeda(despesas);

        const max = Math.max(faturamento, despesas) || 1;
        if (faturamentoBar) faturamentoBar.style.width = `${(faturamento / max) * 100}%`;
        if (despesasBar) despesasBar.style.width = `${(despesas / max) * 100}%`;

        if (resumoTiposContainer) {
            resumoTiposContainer.innerHTML = '';
            const typeCounts = {};
            (state.producao || []).forEach(p => {
                const d = new Date(p.data + "T00:00:00");
                if (d >= startDate && d <= endDate) {
                    typeCounts[p.tipo] = (typeCounts[p.tipo] || 0) + p.qtd;
                }
            });

            Object.entries(typeCounts)
                .sort((a,b) => b[1] - a[1])
                .forEach(([tipo, qtd]) => {
                    const el = document.createElement('div');
                    el.className = 'flex justify-between items-center p-2 hover:bg-white/5 rounded';
                    el.innerHTML = `<span class="text-sm text-gray-300">${tipo}</span><span class="text-sm font-bold text-accent">${qtd}</span>`;
                    resumoTiposContainer.appendChild(el);
                });
        }

        toggleValuesVisibility();
    };

    // --- INICIALIZAÇÃO ---
    const initApp = () => {
        document.querySelectorAll('button[type="submit"]').forEach(button => {
            button.dataset.originalText = button.innerHTML;
        });
        const hoje = new Date();
        if (producaoDataInput) producaoDataInput.valueAsDate = hoje;
        if (entregaDataInput) entregaDataInput.valueAsDate = hoje;
        if (despesaDataInput) despesaDataInput.valueAsDate = hoje;
        
        if (producaoItemsContainer) {
            producaoItemsContainer.innerHTML = '';
            producaoItemsContainer.appendChild(createMainFormItemRow());
            updateMainRemoveButtonsVisibility();
        }

        initLanguage();
        setTimeout(initializeCharts, 100);

        // --- AUTH LISTENERS ---
        if (authForm) {
            authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = emailInput.value;
                const password = passwordInput.value;

                setButtonLoading(authButton, true);
                authErrorMessage.classList.add('hidden');

                try {
                    if (isLoginMode) {
                        await signInWithEmailAndPassword(auth, email, password);
                    } else {
                        await createUserWithEmailAndPassword(auth, email, password);
                    }
                } catch (error) {
                    console.error("Auth Error:", error);
                    authErrorMessage.textContent = error.message;
                    authErrorMessage.classList.remove('hidden');
                } finally {
                    setButtonLoading(authButton, false);
                }
            });
        }

        if (toggleAuthMode) {
            toggleAuthMode.addEventListener('click', () => {
                isLoginMode = !isLoginMode;
                updateAuthUI();
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                signOut(auth);
            });
        }

        if (passwordResetButton) {
            passwordResetButton.addEventListener('click', async () => {
                const email = emailInput.value;
                if (!email) {
                     showToast(t('toast_email_required'), 'error');
                     return;
                }
                try {
                    await sendPasswordResetEmail(auth, email);
                    showToast(t('toast_recovery_email_sent'), 'success');
                } catch (error) {
                    showToast(t('toast_recovery_email_failed'), 'error');
                }
            });
        }

        // --- NAVIGATION LISTENERS ---
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active', 'bg-primary/10', 'text-primary'));
                link.classList.add('active', 'bg-primary/10', 'text-primary');

                views.forEach(v => v.classList.add('hidden'));
                const viewId = link.dataset.view;
                const view = document.getElementById(viewId);
                if (view) {
                    view.classList.remove('hidden');
                    if (viewId === 'view-producao') renderizarProducao();
                    if (viewId === 'view-estoque') renderizarEstoque();
                    if (viewId === 'view-despesas') renderizarDespesas();
                    if (viewId === 'view-dentistas') renderizarDentistas();
                    if (viewId === 'view-analise-dentista') renderizarAnaliseDentista();
                    if (viewId === 'view-resumo') renderizarResumo();
                    if (viewId === 'view-dashboard') renderizarDashboard();
                }

                if (window.innerWidth < 1024) {
                     sideMenu.classList.add('-translate-x-full');
                     sideMenuOverlay.classList.add('hidden');
                }
            });
        });

        if (menuToggleButton) {
            menuToggleButton.addEventListener('click', () => {
                sideMenu.classList.remove('-translate-x-full');
                sideMenuOverlay.classList.remove('hidden');
            });
        }

        if (sideMenuOverlay) {
             sideMenuOverlay.addEventListener('click', () => {
                 sideMenu.classList.add('-translate-x-full');
                 sideMenuOverlay.classList.add('hidden');
             });
        }

        // --- FORM LISTENERS ---
        if (formProducao) {
            formProducaoAddItemBtn.addEventListener('click', () => {
                producaoItemsContainer.appendChild(createMainFormItemRow());
                updateMainRemoveButtonsVisibility();
            });

            producaoItemsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.remove-main-item-btn')) {
                    e.target.closest('.main-work-item-group').remove();
                    updateMainRemoveButtonsVisibility();
                }
            });

            formProducao.addEventListener('submit', (e) => {
                e.preventDefault();
                setButtonLoading(producaoSubmitBtn, true);

                try {
                    const dentistaNome = producaoDentistaInput.value;
                    let dentista = state.dentistas.find(d => d.nome === dentistaNome);

                    if (!dentista) {
                         showToast(t('toast_dentist_not_found'), 'error');
                         setButtonLoading(producaoSubmitBtn, false);
                         return;
                    }

                    const rows = producaoItemsContainer.querySelectorAll('.main-work-item-group');
                    const timestamp = new Date().toISOString();

                    rows.forEach((row, index) => {
                         const tipo = row.querySelector('.main-producao-tipo-select').value;
                         const qtd = parseInt(row.querySelector('.main-producao-qtd-input').value) || 1;

                         const newItem = {
                             id: Date.now() + index,
                             dentista: dentista.id,
                             nomePaciente: producaoPacienteInput.value,
                             tipo,
                             qtd,
                             data: producaoDataInput.value,
                             entrega: entregaDataInput.value,
                             status: producaoStatusSelect.value,
                             obs: producaoObsInput.value,
                             anexo: null,
                             timestamp
                         };
                         state.producao.unshift(newItem);
                    });

                    saveDataToFirestore();
                    renderAllUIComponents();

                    formProducao.reset();
                    producaoDataInput.valueAsDate = new Date();
                    entregaDataInput.valueAsDate = new Date();
                    producaoItemsContainer.innerHTML = '';
                    producaoItemsContainer.appendChild(createMainFormItemRow());
                    updateMainRemoveButtonsVisibility();

                    showToast(t('toast_success_production_add'), 'success');

                } catch (error) {
                    console.error(error);
                    showToast(t('toast_error_save_production'), 'error');
                } finally {
                    setButtonLoading(producaoSubmitBtn, false);
                }
            });
        }

        if (formEstoque) {
            formEstoque.addEventListener('submit', (e) => {
                e.preventDefault();
                setButtonLoading(formEstoqueSubmitBtn, true);

                try {
                    const newItem = {
                        id: Date.now(),
                        nome: estoqueNomeInput.value,
                        fornecedor: estoqueFornecedorInput.value,
                        qtd: parseFloat(estoqueQtdInput.value),
                        unidade: estoqueUnidadeInput.value,
                        min: parseFloat(estoqueMinInput.value),
                        preco: parseFloat(estoquePrecoInput.value) || 0
                    };
                    state.estoque.unshift(newItem);
                    saveDataToFirestore();
                    renderizarEstoque();
                    formEstoque.reset();
                    showToast(t('toast_success_material_save'), 'success');
                } catch(e) {
                    showToast(t('toast_error_generic'), 'error');
                } finally {
                    setButtonLoading(formEstoqueSubmitBtn, false);
                }
            });
        }

        if (formDespesas) {
             formDespesas.addEventListener('submit', (e) => {
                 e.preventDefault();
                 setButtonLoading(formDespesaSubmitBtn, true);

                 try {
                     const newItem = {
                         id: Date.now(),
                         desc: despesaDescInput.value,
                         categoria: despesaCategoriaSelect.value,
                         valor: parseFloat(despesaValorInput.value),
                         data: despesaDataInput.value,
                         recorrente: despesaRecorrenteCheckbox.checked
                     };
                     state.despesas.unshift(newItem);
                     saveDataToFirestore();
                     renderizarDespesas();
                     renderizarDashboard();
                     renderizarResumo();
                     formDespesas.reset();
                     despesaDataInput.valueAsDate = new Date();
                     showToast(t('toast_success_expense_add'), 'success');
                 } catch(e) {
                     showToast(t('toast_error_save_expense'), 'error');
                 } finally {
                     setButtonLoading(formDespesaSubmitBtn, false);
                 }
             });
        }

        if (formDentista) {
            formDentista.addEventListener('submit', (e) => {
                e.preventDefault();
                setButtonLoading(formDentistaSubmitBtn, true);
                try {
                    const newItem = {
                        id: Date.now().toString(),
                        nome: dentistaNomeInput.value,
                        clinica: dentistaClinicaInput.value,
                        telefone: dentistaTelefoneInput.value,
                        email: dentistaEmailInput.value,
                        valores: []
                    };
                    state.dentistas.unshift(newItem);
                    saveDataToFirestore();
                    renderAllUIComponents();
                    formDentista.reset();
                    showToast(t('toast_success_dentist_add'), 'success');
                } catch(e) {
                    showToast(t('toast_error_save_dentist'), 'error');
                } finally {
                     setButtonLoading(formDentistaSubmitBtn, false);
                }
            });
        }

        if (quickAddProductionForm) {
            addWorkItemBtn.addEventListener('click', () => {
                quickProductionItemsContainer.appendChild(createWorkItemRow());
                updateRemoveButtonsVisibility();
            });

            quickProductionItemsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.remove-work-item-btn')) {
                    e.target.closest('.work-item-group').remove();
                    updateRemoveButtonsVisibility();
                }
            });

            quickAddProductionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const dentistaNome = quickProducaoDentistaInput.value;
                let dentista = state.dentistas.find(d => d.nome === dentistaNome);
                if (!dentista) {
                     showToast(t('toast_dentist_not_found'), 'error');
                     return;
                }
                 const rows = quickProductionItemsContainer.querySelectorAll('.work-item-group');
                 rows.forEach((row, index) => {
                     const tipo = row.querySelector('.quick-producao-tipo-select').value;
                     const qtd = parseInt(row.querySelector('.quick-producao-qtd-input').value) || 1;
                     state.producao.unshift({
                         id: Date.now() + index,
                         dentista: dentista.id,
                         nomePaciente: quickProducaoPacienteInput.value,
                         tipo,
                         qtd,
                         data: quickProducaoDataInput.value,
                         entrega: quickEntregaDataInput.value,
                         status: 'Pendente',
                         obs: quickProducaoObsInput.value,
                         timestamp: new Date().toISOString()
                     });
                });
                saveDataToFirestore();
                renderAllUIComponents();
                addProductionModal.classList.add('hidden');
                quickAddProductionForm.reset();
                showToast(t('toast_success_production_add'), 'success');
            });
        }

        // --- UI & MODAL LISTENERS ---
        if (toggleValuesBtn) {
            toggleValuesBtn.addEventListener('click', () => toggleValuesVisibility('btn'));
        }

        if (actionAddProducao) {
            actionAddProducao.addEventListener('click', () => {
                addProductionModal.classList.remove('hidden');
                quickProducaoDataInput.valueAsDate = new Date();
                quickEntregaDataInput.valueAsDate = new Date();
                quickProductionItemsContainer.innerHTML = '';
                quickProductionItemsContainer.appendChild(createWorkItemRow());
                updateRemoveButtonsVisibility();
            });
        }

        if (closeAddProductionModalBtn) {
            closeAddProductionModalBtn.addEventListener('click', () => addProductionModal.classList.add('hidden'));
        }
        if (quickAddProductionCancelBtn) {
            quickAddProductionCancelBtn.addEventListener('click', () => addProductionModal.classList.add('hidden'));
        }

        // --- DASHBOARD MONTH NAV ---
        const changeMonth = (offset) => {
            const current = new Date(state.mesAtual);
            current.setMonth(current.getMonth() + offset);
            state.mesAtual = current.toISOString();
            renderAllUIComponents();
        };

        if (dashboardPrevMonthBtn) dashboardPrevMonthBtn.addEventListener('click', () => changeMonth(-1));
        if (dashboardNextMonthBtn) dashboardNextMonthBtn.addEventListener('click', () => changeMonth(1));
        if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

        // --- FILTER LISTENERS ---
        if (filterDentistaSelect) filterDentistaSelect.addEventListener('change', renderizarProducao);
        if (filterStatusSelect) filterStatusSelect.addEventListener('change', renderizarProducao);
        if (filterDataInicio) filterDataInicio.addEventListener('change', renderizarProducao);
        if (filterDataFim) filterDataFim.addEventListener('change', renderizarProducao);

        if (searchEstoqueInput) {
             searchEstoqueInput.addEventListener('input', (e) => {
                 state.searchTermEstoque = e.target.value;
                 renderizarEstoque();
             });
        }

        if (searchDespesasInput) {
             searchDespesasInput.addEventListener('input', (e) => {
                 state.searchTermDespesas = e.target.value;
                 renderizarDespesas();
             });
        }

        if (searchDentistasInput) {
             searchDentistasInput.addEventListener('input', (e) => {
                 state.searchTermDentistas = e.target.value;
                 renderizarDentistas();
             });
        }
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
