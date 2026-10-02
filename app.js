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
    let isDataLoaded = false;
    let unsubscribeFromFirestore;
    let charts = {}; // Armazenar instâncias dos gráficos

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
    const authSubtitle = document.getElementById('auth-subtitle');
    const authTabLogin = document.getElementById('auth-tab-login');
    const authTabRegister = document.getElementById('auth-tab-register');
    const togglePasswordVisibilityBtn = document.getElementById('toggle-password-visibility-btn');
    const eyeIconOpen = document.getElementById('eye-icon-open');
    const eyeIconClosed = document.getElementById('eye-icon-closed');
    const rememberMeCheckbox = document.getElementById('remember-me-checkbox');
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
    const generatedMessageText = document.getElementById('generated-message-text');
    const copyMessageBtn = document.getElementById('copy-message-btn');
    const closeMessageModalBtn = document.getElementById('close-message-modal-btn');
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
    const formPix = document.getElementById('form-pix');
    const pixKeyInput = document.getElementById('pix-key-input');
    const pixNameInput = document.getElementById('pix-name-input');
    const pixCityInput = document.getElementById('pix-city-input');

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
    const selectAllProducaoCheckbox = document.getElementById('select-all-producao');

    // Elementos aprimorados: Adicionar Produção
    const producaoDentistaSelect = document.getElementById('producao-dentista-select');
    const btnQuickNewDentista = document.getElementById('btn-quick-new-dentist') || document.getElementById('btn-quick-new-dentista');
    const orderPreviewCard = document.getElementById('order-preview-card');
    const orderPreviewItems = document.getElementById('order-preview-items');
    const orderPreviewSubtotal = document.getElementById('order-preview-subtotal');
    const orderPreviewTotal = document.getElementById('order-preview-total');
    const orderPreviewCount = document.getElementById('order-preview-count');
    const formProducaoSummaryCard = document.getElementById('form-producao-summary-card');
    const formProducaoSummaryItems = document.getElementById('form-producao-summary-items');
    const formProducaoSummaryTotal = document.getElementById('form-producao-summary-total');

    // Elementos aprimorados: Filtros Avançados
    const filterProducaoDentistaMain = document.getElementById('filter-producao-dentista-main');
    const filterProducaoTipo = document.getElementById('filter-producao-tipo');
    const btnLimparFiltrosProducao = document.getElementById('btn-limpar-filtros-producao');
    const btnResetFiltersInline = document.getElementById('btn-reset-filters-inline');
    const filterActiveIndicator = document.getElementById('filter-active-indicator');
    const filterResultsBadge = document.getElementById('filter-results-badge');
    const producaoCounterBadge = document.getElementById('producao-counter-badge');

    // Elementos aprimorados: Produção por Dentista
    const dentistaQuickPills = document.getElementById('dentista-quick-pills');
    const filterDentistaPeriodo = document.getElementById('filter-dentista-periodo');
    const filterDentistaStatus = document.getElementById('filter-dentista-status');
    const searchDentistaTable = document.getElementById('search-dentista-table');
    const dentistaKpiBar = document.getElementById('dentista-kpi-bar');
    const dentistaKpiTotalPecas = document.getElementById('dentista-kpi-total-pecas');
    const dentistaKpiFaturamento = document.getElementById('dentista-kpi-faturamento');
    const dentistaKpiFinalizados = document.getElementById('dentista-kpi-finalizados');
    const dentistaKpiAndamento = document.getElementById('dentista-kpi-andamento');
    const dentistaKpiPendentes = document.getElementById('dentista-kpi-pendentes');
    const dentistaBatchBar = document.getElementById('dentista-batch-bar');
    const batchSelectedCount = document.getElementById('batch-selected-count');
    const batchSelectedTotal = document.getElementById('batch-selected-total');
    const btnBatchPix = document.getElementById('btn-batch-pix');
    const btnBatchFinish = document.getElementById('btn-batch-finish');
    const btnBatchDelete = document.getElementById('btn-batch-delete');
    const btnBatchClear = document.getElementById('btn-batch-clear');
    const thSelectAllDentista = document.getElementById('th-select-all-dentista');
    const btnGerarPixDentista = document.getElementById('btn-gerar-pix-dentista');
    const btnNovaProducaoDentista = document.getElementById('btn-nova-producao-dentista');

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
    // Isso é usado como fallback para navegadores que não suportam backdrop-filter.
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
        // Estado inicial
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
        quickNotes: [], // MUDADO DE "" PARA []
        activeQuickNoteId: null, // NOVO
        mesAtual: new Date(),
        closingDayStart: 25,
        closingDayEnd: 24,
        searchTermProducao: '',
        searchTermDentistas: '',
        searchTermEstoque: '',
        searchTermDespesas: '',
        producaoQuickFilter: 'hoje',
        notifications: [],
        showAllDentistas: false, // controla Top 15 / Todos no gráfico
        pixKey: '',
        pixName: '',
        pixCity: ''
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    const toastNotification = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    let toastTimeout;

    // --- INTERNACIONALIZAÇÃO (i18n) ---
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
        
        // Atualiza textos estáticos
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.dataset.i18n;
            if (translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });

        // Atualiza placeholders
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            if (translations[lang] && translations[lang][key]) {
                element.placeholder = translations[lang][key];
            }
        });

        // Atualiza ícone do botão principal
        const currentBtn = document.getElementById('current-language-btn');
        if (currentBtn) {
            currentBtn.innerHTML = getFlagSVG(lang);
        }

        // Esconde o menu se estiver aberto
        const languageOptions = document.getElementById('language-options');
        if (languageOptions) {
            languageOptions.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        }

        // Atualiza estado ativo na aba Admin
        document.querySelectorAll('.admin-lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === lang;
            btn.classList.toggle('border-accent-blue', isActive);
            btn.classList.toggle('bg-blue-500/20', isActive);
            btn.classList.toggle('shadow-liquid-sm', isActive);
            btn.classList.toggle('border-gemini-border', !isActive);
            btn.classList.toggle('bg-gemini-input', !isActive);
        });

        // Atualiza UI dinâmica
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

    const getTodayDateString = (dateObj = new Date()) => {
        const d = new Date(dateObj);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    /**
     * Animação suave e fluida de contagem progressiva (count-up) para valores numéricos e monetários
     * Easing out-cubic com interpolação de alta precisão via requestAnimationFrame
     * @param {HTMLElement} element - O elemento DOM cujo texto será animado
     * @param {number} targetValue - O valor numérico final
     * @param {boolean} [isCurrency=true] - Se true formata como BRL (R$ 0,00), senão número inteiro
     * @param {number} [duration=800] - Duração da animação em milissegundos
     */
    const animateCountUp = (element, targetValue, isCurrency = true, duration = 800) => {
        if (!element) return;

        // Cancela animação ativa anterior para este elemento
        if (element._countUpRaf) {
            cancelAnimationFrame(element._countUpRaf);
            element._countUpRaf = null;
        }

        const target = Number(targetValue) || 0;
        const formattedTarget = isCurrency 
            ? formatarMoeda(target) 
            : new Intl.NumberFormat('pt-BR').format(Math.round(target));

        // Registra o valor final formatado no elemento para mascaramento de privacidade e exportações
        element._targetFormattedValue = formattedTarget;

        // Se o modo ocultar valores estiver ativado no elemento/corpo
        const isHidden = document.body.classList.contains('values-hidden');
        if (isHidden && isCurrency) {
            element.dataset.originalValue = formattedTarget;
            element.textContent = '';
            element._currentRawValue = target;
            return;
        }

        // Limpa dataset.originalValue prévio se estiver visível
        delete element.dataset.originalValue;

        // Pega valor anterior para animar apenas a transição real se houver, ou atualizar direto
        const previousValue = element._currentRawValue !== undefined ? element._currentRawValue : null;

        // Se a duração for 0 ou se o valor for idêntico ao já exibido, atualiza imediatamente sem animação
        if (duration === 0 || previousValue === target) {
            element.textContent = formattedTarget;
            element._currentRawValue = target;
            return;
        }

        // Se é a primeira renderização do elemento, usa start = 0; se já tinha valor anterior, interpola a partir do valor anterior
        const start = previousValue !== null ? previousValue : 0;
        const diff = target - start;

        // Se a diferença for insignificante (menos de 1 centavo), atualiza direto sem animação
        if (Math.abs(diff) < 0.01) {
            element.textContent = formattedTarget;
            element._currentRawValue = target;
            return;
        }

        const startTime = performance.now();

        // Easing cúbico (Cubic Out): 1 - (1 - t)^3 -> aceleração suave inicial e desaceleração elegante
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            const currentVal = start + (diff * eased);

            // Se o usuário ocultou os valores durante a animação
            if (document.body.classList.contains('values-hidden') && isCurrency) {
                element.dataset.originalValue = formattedTarget;
                element.textContent = '';
                element._countUpRaf = null;
                element._currentRawValue = target;
                return;
            }

            if (isCurrency) {
                element.textContent = formatarMoeda(currentVal);
            } else {
                element.textContent = new Intl.NumberFormat('pt-BR').format(Math.round(currentVal));
            }

            if (progress < 1) {
                element._countUpRaf = requestAnimationFrame(step);
            } else {
                element.textContent = formattedTarget;
                element._countUpRaf = null;
                element._currentRawValue = target;
            }
        };

        element._countUpRaf = requestAnimationFrame(step);
    };

    // --- FUNÇÕES PIX ---
    const crc16 = (str) => {
        let crc = 0xFFFF;
        for (let c = 0; c < str.length; c++) {
            crc ^= str.charCodeAt(c) << 8;
            for (let i = 0; i < 8; i++) {
                if (crc & 0x8000)
                    crc = (crc << 1) ^ 0x1021;
                else
                    crc = crc << 1;
            }
        }
        let hex = (crc & 0xFFFF).toString(16).toUpperCase();
        return hex.padStart(4, '0');
    };

    const generatePixPayload = (chavePix, valor, merchantName, merchantCity, txid = "COBRANCA") => {
        function pad(id, value) {
            let len = value.length.toString().padStart(2, '0');
            return `${id}${len}${value}`;
        }

        merchantName = merchantName.substring(0, 25).trim();
        merchantCity = merchantCity.substring(0, 15).trim();
        txid = txid.substring(0, 25).trim() || 'COBRANCA';

        let payloadFormat = pad('00', '01');
        let merchantAccountInformation = pad('26', pad('00', 'br.gov.bcb.pix') + pad('01', chavePix));
        let merchantCategoryCode = pad('52', '0000');
        let transactionCurrency = pad('53', '986');
        let transactionAmount = valor > 0 ? pad('54', valor.toFixed(2)) : '';
        let countryCode = pad('58', 'BR');
        let merchantNameField = pad('59', merchantName);
        let merchantCityField = pad('60', merchantCity);
        let additionalDataField = pad('62', pad('05', txid));
        
        let payload = `${payloadFormat}${merchantAccountInformation}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantNameField}${merchantCityField}${additionalDataField}6304`;
        
        let crc = crc16(payload);
        return payload + crc;
    };

    // Encurta nomes longos para os rótulos do eixo Y, preservando o nome completo para tooltips
    const abbreviateName = (name, maxLen = 28) => {
        if (!name) return '';
        if (name.length <= maxLen) return name;
        // Tenta reduzir preservando sobrenome: "Primeiro Sobrenome" => "Primeiro S."
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            const first = parts[0];
            const last = parts[parts.length - 1];
            const short = `${first} ${last}`;
            if (short.length <= maxLen) return short;
            // fallback para iniciais
            const initials = parts.map(p => p[0]).join('');
            if (initials.length <= maxLen) return initials;
        }
        return name.slice(0, maxLen - 1) + '…';
    };
    
    const navigateToView = (viewId) => {
        const link = document.querySelector(`.nav-link[data-view="${viewId}"]`);
        if (link) { link.click(); }
    };

    /**
     * [CORREÇÃO] Lógica de cálculo do período de faturamento.
     * Calcula o período de faturamento (data de início e fim) com base em uma data de referência.
     * @param {Date} targetDate - A data de referência para a qual o período será calculado.
     * @returns {{startDate: Date, endDate: Date}} O objeto contendo as datas de início e fim.
     */
    const getBillingPeriod = (targetDate) => {
        const startDay = state.closingDayStart || 25;
        const endDay = state.closingDayEnd || 24;
        let year = targetDate.getFullYear();
        let month = targetDate.getMonth(); // 0-indexado

        let startDate, endDate;

        if (startDay > endDay) { // O ciclo atravessa o mês (ex: 25 a 24)
            // O período pertence ao mês da data de TÉRMINO.
            // Ex: "Período de Outubro" vai de 25/Set a 24/Out.
            endDate = new Date(year, month, endDay, 23, 59, 59);
            startDate = new Date(year, month - 1, startDay, 0, 0, 0);
        } else { // O ciclo é dentro do mesmo mês (ex: 1 a 31)
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

     // Função para o Modal de Confirmação Elegante
    const showConfirmationModal = (title, message) => {
        // Define o texto
        confirmationTitle.textContent = title;
        confirmationMessage.textContent = message;

        // Mostra o modal
        confirmationModal.classList.remove('hidden');

        // Retorna uma promessa que espera a decisão do usuário
        return new Promise((resolve) => {
            // Remove listeners antigos para evitar cliques duplicados
            confirmYesBtn.replaceWith(confirmYesBtn.cloneNode(true));
            confirmNoBtn.replaceWith(confirmNoBtn.cloneNode(true));

            // Pega as novas referências dos botões
            const newYesBtn = document.getElementById('confirm-yes-btn');
            const newNoBtn = document.getElementById('confirm-no-btn');

            // Adiciona os listeners
            newYesBtn.addEventListener('click', () => {
                confirmationModal.classList.add('hidden');
                resolve(true); // Usuário clicou "Sim"
            });
            
            newNoBtn.addEventListener('click', () => {
                confirmationModal.classList.add('hidden');
                resolve(false); // Usuário clicou "Cancelar"
            });
        });
    };

    // --- SISTEMA DE NOTIFICAÇÕES ---
    const addNotification = (message, type = 'info', priority = 'normal') => {
        const notification = {
            id: Date.now(),
            message,
            type,
            priority,
            timestamp: new Date(),
            read: false
        };
        
        state.notifications.unshift(notification);
        
        // Limitar a 50 notificações
        if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50);
        }
        
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
            notificationsList.innerHTML = `<div class="p-4 text-center text-gemini-secondary">${t('notifications_empty')}</div>`;
            return;
        }
        
        state.notifications.slice(0, 10).forEach(notification => {
            const notificationEl = document.createElement('div');
            notificationEl.className = `p-3 border-b border-gemini-border hover:bg-gray-700 cursor-pointer ${!notification.read ? 'bg-blue-900/20' : ''}`;
            
            const timeAgo = getTimeAgo(notification.timestamp);
            const typeIcon = getNotificationIcon(notification.type);
            
            notificationEl.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0 mt-1">
                        ${typeIcon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gemini-primary ${!notification.read ? 'font-semibold' : ''}">${notification.message}</p>
                        <p class="text-xs text-gemini-secondary mt-1">${timeAgo}</p>
                    </div>
                    ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>' : ''}
                </div>
            `;
            
            notificationEl.addEventListener('click', () => {
                notification.read = true;
                updateNotificationUI();
                saveDataToFirestore();
            });
            
            notificationsList.appendChild(notificationEl);
        });
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days}d atrás`;
        if (hours > 0) return `${hours}h atrás`;
        if (minutes > 0) return `${minutes}m atrás`;
        return 'Agora';
    };

    const getNotificationIcon = (type) => {
        const icons = {
            info: '<svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>',
            warning: '<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            success: '<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            error: '<svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons.info;
    };

    const checkForNotifications = () => {
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        // Verificar entregas próximas
        const entregasProximas = (state.producao || []).filter(p => {
            const dataEntrega = new Date(p.entrega + 'T00:00:00');
            return p.status !== 'Finalizado' && dataEntrega <= amanha && dataEntrega >= hoje;
        });
        
        entregasProximas.forEach(entrega => {
            const dentista = (state.dentistas || []).find(d => d.id === entrega.dentista);
            const dentistaName = dentista ? dentista.nome : 'Dentista desconhecido';
            addNotification(`Entrega próxima: ${entrega.tipo} para ${dentistaName}`, 'warning', 'high');
        });
        
        // Verificar trabalhos pendentes há muito tempo
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(hoje.getDate() - 7);
        
        const trabalhosPendentes = (state.producao || []).filter(p => {
            const dataProducao = new Date(p.data + 'T00:00:00');
            return p.status === 'Pendente' && dataProducao <= seteDiasAtras;
        });
        
        trabalhosPendentes.forEach(trabalho => {
            const dentista = (state.dentistas || []).find(d => d.id === trabalho.dentista);
            const dentistaName = dentista ? dentista.nome : 'Dentista desconhecido';
            addNotification(`Trabalho pendente há mais de 7 dias: ${trabalho.tipo} para ${dentistaName}`, 'error', 'high');
        });
    };

    // --- GRÁFICOS ---
    let currentDailyChartType = 'bar';

    // Plugin customizado para desenhar valores e quantidades ao final das barras horizontais dos dentistas
    const dentistValueLabelsPlugin = {
        id: 'dentistValueLabels',
        afterDatasetsDraw(chart) {
            const { ctx, chartArea } = chart;
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || !meta.data.length) return;

            ctx.save();
            ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textBaseline = 'middle';

            meta.data.forEach((bar, index) => {
                const val = chart.data.datasets[0].data[index];
                if (val === undefined || val === null || val === 0) return;
                const fullNames = chart._fullNames || [];
                const piecesMap = chart._piecesMap || {};
                const pieces = (fullNames[index] && piecesMap[fullNames[index]]) || 0;
                const text = formatarMoeda(val) + (pieces > 0 ? ` • ${pieces} un.` : '');

                // Posicionar ligeiramente à direita da ponta da barra
                const x = Math.min(bar.x + 10, chartArea.right - 90);
                const y = bar.y;

                // Sombra suave para contraste
                ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.fillText(text, x + 1, y + 1);

                // Texto branco nítido
                ctx.fillStyle = '#f8fafc';
                ctx.fillText(text, x, y);
            });
            ctx.restore();
        }
    };

    const buildDailyRevenueChartConfig = (type = 'bar') => {
        return {
            type: type,
            data: {
                labels: [],
                datasets: [{
                    label: 'Faturamento',
                    data: [],
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return '#38bdf8';
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        if (type === 'line') {
                            gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
                            gradient.addColorStop(0.6, 'rgba(99, 102, 241, 0.15)');
                            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
                        } else {
                            gradient.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
                            gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.85)');
                            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.45)');
                        }
                        return gradient;
                    },
                    borderColor: type === 'line' ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)',
                    borderWidth: type === 'line' ? 3 : { top: 2, left: 1, right: 1, bottom: 0 },
                    borderRadius: type === 'bar' ? { topLeft: 8, topRight: 8, bottomLeft: 2, bottomRight: 2 } : 0,
                    borderSkipped: false,
                    fill: type === 'line',
                    tension: 0.4,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: type === 'line' ? 4 : 0,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#0284c7',
                    pointHoverBorderWidth: 2,
                    hoverBackgroundColor: '#7dd3fc',
                    barThickness: 'flex',
                    maxBarThickness: 26,
                    barPercentage: 0.7,
                    categoryPercentage: 0.85
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 650,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: { top: 12, bottom: 4, left: 4, right: 8 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(15, 23, 42, 0.94)',
                        titleColor: '#ffffff',
                        bodyColor: '#38bdf8',
                        titleFont: { weight: 'bold', size: 12, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                        bodyFont: { weight: '600', size: 13, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                        padding: 12,
                        cornerRadius: 12,
                        borderColor: 'rgba(255, 255, 255, 0.16)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(items) {
                                if (!items || items.length === 0) return '';
                                const idx = items[0].dataIndex;
                                if (charts.faturamentoDiario && charts.faturamentoDiario._fullDates && charts.faturamentoDiario._fullDates[idx]) {
                                    return charts.faturamentoDiario._fullDates[idx];
                                }
                                return items[0].label;
                            },
                            label: function(context) {
                                const val = (context.parsed && context.parsed.y !== undefined) ? context.parsed.y : (context.raw || 0);
                                return 'Faturamento: ' + formatarMoeda(val);
                            },
                            afterLabel: function(context) {
                                const idx = context.dataIndex;
                                const pieces = (charts.faturamentoDiario && charts.faturamentoDiario._dayPieces) ? charts.faturamentoDiario._dayPieces[idx] : 0;
                                if (pieces > 0) {
                                    return `Produção: ${pieces} peça${pieces !== 1 ? 's' : ''}`;
                                }
                                return 'Sem produção registrada';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(255, 255, 255, 0.03)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 11, weight: '500' },
                            maxTicksLimit: 9,
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: true,
                            autoSkipPadding: 16
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderDash: [4, 4],
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 11 },
                            maxTicksLimit: 6,
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        }
                    }
                }
            }
        };
    };

    const initializeCharts = () => {
        // 1. Gráfico de Faturamento Diário
        const faturamentoDiarioCtx = document.getElementById('faturamento-diario-chart');
        if (faturamentoDiarioCtx) {
            charts.faturamentoDiario = new Chart(faturamentoDiarioCtx, buildDailyRevenueChartConfig(currentDailyChartType));
        }

        // Listeners para alternar entre Barras e Curva Suave
        const toggleBarBtn = document.getElementById('toggle-chart-type-bar');
        const toggleLineBtn = document.getElementById('toggle-chart-type-line');
        if (toggleBarBtn && toggleLineBtn) {
            toggleBarBtn.addEventListener('click', () => {
                if (currentDailyChartType === 'bar') return;
                currentDailyChartType = 'bar';
                toggleBarBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 transition-all';
                toggleLineBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
                rebuildDailyRevenueChart();
            });
            toggleLineBtn.addEventListener('click', () => {
                if (currentDailyChartType === 'line') return;
                currentDailyChartType = 'line';
                toggleLineBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 transition-all';
                toggleBarBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
                rebuildDailyRevenueChart();
            });
        }

        // 2. Gráfico de Faturamento por Dentista (Barras Horizontais com valores visíveis)
        const dentistaCtx = document.getElementById('dentista-chart');
        if (dentistaCtx) {
            charts.dentista = new Chart(dentistaCtx, {
                type: 'bar',
                plugins: [dentistValueLabelsPlugin],
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Faturamento',
                        data: [],
                        backgroundColor: [],
                        borderRadius: 999, // Barra totalmente arredondada tipo cápsula Apple
                        borderSkipped: false,
                        barThickness: 30,
                        maxBarThickness: 38
                    }]
                },
                options: {
                    indexAxis: 'y', // barras horizontais
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 650,
                        easing: 'easeOutQuart'
                    },
                    layout: {
                        padding: { left: 8, right: 90, top: 12, bottom: 8 }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.94)',
                            titleColor: '#ffffff',
                            bodyColor: '#38bdf8',
                            titleFont: { weight: 'bold', size: 13, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                            bodyFont: { weight: '600', size: 12, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                            padding: 12,
                            cornerRadius: 12,
                            borderColor: 'rgba(255, 255, 255, 0.16)',
                            borderWidth: 1,
                            callbacks: {
                                title: function(items) {
                                    if (!items || items.length === 0) return '';
                                    const idx = items[0].dataIndex;
                                    return (charts.dentista && charts.dentista._fullNames && charts.dentista._fullNames[idx]) || items[0].label || '';
                                },
                                label: function(context) {
                                    const value = context.parsed && (context.parsed.x ?? context.parsed) || 0;
                                    return 'Faturamento: ' + formatarMoeda(value);
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const pieces = charts.dentista && charts.dentista._piecesMap ? charts.dentista._piecesMap[charts.dentista._fullNames[idx]] : 0;
                                    return 'Peças produzidas: ' + (pieces || 0);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                borderDash: [4, 4],
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                font: { size: 11, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                                maxTicksLimit: 6,
                                callback: function(value) {
                                    try { return formatarMoeda(value); } catch (e) { return value; }
                                }
                            }
                        },
                        y: {
                            grid: { display: false, drawBorder: false },
                            ticks: {
                                color: '#f1f5f9',
                                font: { size: 12, weight: '600', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
                            }
                        }
                    }
                }
            });
        }

        // 3. Gráfico Donut de Quantidade por Tipo de Trabalho
        const tiposTrabalhoCtx = document.getElementById('tipos-trabalho-donut-chart');
        if (tiposTrabalhoCtx) {
            charts.tiposTrabalho = new Chart(tiposTrabalhoCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#2dd4bf'
                        ],
                        borderWidth: 2,
                        borderColor: 'rgba(15, 23, 42, 0.9)',
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.94)',
                            titleColor: '#ffffff',
                            bodyColor: '#38bdf8',
                            padding: 10,
                            cornerRadius: 10,
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const val = context.parsed || 0;
                                    return ` ${context.label}: ${val} peça${val !== 1 ? 's' : ''}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // 4. Gráfico Comparativo Anual (Jan - Dez)
        const comparativoAnualCtx = document.getElementById('comparativo-anual-chart');
        if (comparativoAnualCtx) {
            charts.comparativoAnual = new Chart(comparativoAnualCtx, buildComparativoAnualChartConfig());
        }

        const prevYearBtn = document.getElementById('anual-prev-year-btn');
        const nextYearBtn = document.getElementById('anual-next-year-btn');
        if (prevYearBtn && nextYearBtn) {
            prevYearBtn.addEventListener('click', () => {
                currentAnualYear--;
                updateComparativoAnualChart();
            });
            nextYearBtn.addEventListener('click', () => {
                currentAnualYear++;
                updateComparativoAnualChart();
            });
        }

        const btnFinancas = document.getElementById('anual-view-financas');
        const btnLucro = document.getElementById('anual-view-lucro');
        const btnPecas = document.getElementById('anual-view-pecas');

        const updateAnualMetricButtons = (selected) => {
            const activeClass = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 transition-all';
            const inactiveClass = 'px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
            if (btnFinancas) btnFinancas.className = selected === 'financas' ? activeClass : inactiveClass;
            if (btnLucro) btnLucro.className = selected === 'lucro' ? activeClass : inactiveClass;
            if (btnPecas) btnPecas.className = selected === 'pecas' ? activeClass : inactiveClass;
        };

        if (btnFinancas && btnLucro && btnPecas) {
            btnFinancas.addEventListener('click', () => {
                if (currentAnualMetric === 'financas') return;
                currentAnualMetric = 'financas';
                updateAnualMetricButtons('financas');
                rebuildComparativoAnualChart();
            });
            btnLucro.addEventListener('click', () => {
                if (currentAnualMetric === 'lucro') return;
                currentAnualMetric = 'lucro';
                updateAnualMetricButtons('lucro');
                rebuildComparativoAnualChart();
            });
            btnPecas.addEventListener('click', () => {
                if (currentAnualMetric === 'pecas') return;
                currentAnualMetric = 'pecas';
                updateAnualMetricButtons('pecas');
                rebuildComparativoAnualChart();
            });
        }
    };

    // --- LÓGICA DO GRÁFICO COMPARATIVO ANUAL ---
    let currentAnualYear = new Date().getFullYear();
    let currentAnualMetric = 'financas'; // 'financas' | 'lucro' | 'pecas'

    const monthAbbrNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthFullNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const buildComparativoAnualChartConfig = () => {
        return {
            type: 'bar',
            data: {
                labels: monthAbbrNames,
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                animation: {
                    duration: 600,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: { top: 16, bottom: 4, left: 6, right: 12 }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: '#94a3b8',
                            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 11, weight: '600' },
                            boxWidth: 12,
                            boxHeight: 12,
                            borderRadius: 3,
                            useBorderRadius: true,
                            padding: 16
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(15, 23, 42, 0.94)',
                        titleColor: '#ffffff',
                        titleFont: { weight: 'bold', size: 13, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                        bodyFont: { weight: '500', size: 12, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
                        padding: 14,
                        cornerRadius: 12,
                        borderColor: 'rgba(255, 255, 255, 0.16)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(items) {
                                if (!items || items.length === 0) return '';
                                const idx = items[0].dataIndex;
                                return `${monthFullNames[idx]} de ${currentAnualYear}`;
                            },
                            label: function(context) {
                                const datasetLabel = context.dataset.label || '';
                                const val = context.parsed.y !== undefined ? context.parsed.y : (context.raw || 0);
                                if (currentAnualMetric === 'pecas') {
                                    return ` ${datasetLabel}: ${val} peça${val !== 1 ? 's' : ''}`;
                                }
                                return ` ${datasetLabel}: ${formatarMoeda(val)}`;
                            },
                            afterBody: function(items) {
                                if (currentAnualMetric === 'financas' && items.length >= 2) {
                                    const fat = items[0].parsed.y || 0;
                                    const des = (items[1] && items[1].parsed.y) || 0;
                                    const lucro = fat - des;
                                    const margem = fat > 0 ? ((lucro / fat) * 100).toFixed(1) : 0;
                                    return [
                                        `──────────────────`,
                                        ` Margem Real: ${margem}%`
                                    ];
                                }
                                return [];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 11, weight: '600' }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderDash: [4, 4],
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 11 },
                            maxTicksLimit: 6,
                            callback: function(value) {
                                if (currentAnualMetric === 'pecas') {
                                    return `${value} un.`;
                                }
                                return formatarMoeda(value);
                            }
                        }
                    }
                }
            }
        };
    };

    const updateComparativoAnualChart = () => {
        if (!charts.comparativoAnual) return;

        const yearDisplay = document.getElementById('anual-year-display');
        if (yearDisplay) {
            yearDisplay.textContent = currentAnualYear;
        }

        const monthlyData = [];
        let totalFaturamentoAno = 0;
        let totalDespesasAno = 0;
        let totalPecasAno = 0;
        let maxFaturamento = 0;
        let melhorMesIndex = -1;

        for (let m = 0; m < 12; m++) {
            const targetDate = new Date(currentAnualYear, m, 15);
            const { startDate, endDate } = getBillingPeriod(targetDate);

            // Filtrar produção do mês correspondente
            const producaoDoMes = (state.producao || []).filter(p => {
                if (!p.data) return false;
                const d = new Date(p.data + "T00:00:00");
                return d >= startDate && d <= endDate;
            });

            // Filtrar despesas do mês correspondente
            const despesasDoMes = (state.despesas || []).filter(d => {
                if (!d.data) return false;
                const dataDesp = new Date(d.data + "T00:00:00");
                return dataDesp >= startDate && dataDesp <= endDate;
            });

            let faturamentoMes = 0;
            let pecasMes = 0;
            producaoDoMes.forEach(p => {
                const dentista = (state.dentistas || []).find(dent => dent.id === p.dentista);
                const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
                const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
                const valorFinal = valorDentista || valorGlobal;
                const totalItem = valorFinal ? valorFinal.valor * p.qtd : 0;
                faturamentoMes += totalItem;
                pecasMes += (p.qtd || 0);
            });

            const totalDespesasMes = despesasDoMes.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
            const lucroMes = faturamentoMes - totalDespesasMes;

            totalFaturamentoAno += faturamentoMes;
            totalDespesasAno += totalDespesasMes;
            totalPecasAno += pecasMes;

            if (faturamentoMes > maxFaturamento) {
                maxFaturamento = faturamentoMes;
                melhorMesIndex = m;
            }

            monthlyData.push({
                faturamento: faturamentoMes,
                despesas: totalDespesasMes,
                lucro: lucroMes,
                pecas: pecasMes
            });
        }

        const totalLucroAno = totalFaturamentoAno - totalDespesasAno;
        const mediaMensal = totalFaturamentoAno / 12;

        // Atualizar mini-KPIs
        const kpiFat = document.getElementById('anual-kpi-faturamento');
        if (kpiFat) kpiFat.textContent = formatarMoeda(totalFaturamentoAno);

        const kpiDesp = document.getElementById('anual-kpi-despesas');
        if (kpiDesp) kpiDesp.textContent = formatarMoeda(totalDespesasAno);

        const kpiLucro = document.getElementById('anual-kpi-lucro');
        if (kpiLucro) {
            kpiLucro.textContent = formatarMoeda(totalLucroAno);
            kpiLucro.className = totalLucroAno >= 0 
                ? 'text-lg font-bold text-emerald-400 mt-1 monetary-value'
                : 'text-lg font-bold text-rose-400 mt-1 monetary-value';
        }

        const kpiMedia = document.getElementById('anual-kpi-media');
        if (kpiMedia) kpiMedia.textContent = formatarMoeda(mediaMensal);

        const melhorMesBadge = document.getElementById('comparativo-anual-melhor-mes-badge');
        if (melhorMesBadge) {
            if (maxFaturamento > 0 && melhorMesIndex >= 0) {
                melhorMesBadge.textContent = `Melhor: ${monthAbbrNames[melhorMesIndex]} (${formatarMoeda(maxFaturamento)})`;
            } else {
                melhorMesBadge.textContent = 'Melhor: -';
            }
        }

        // Criar gradientes pelo canvas
        const canvas = document.getElementById('comparativo-anual-chart');
        let fatGradient = '#38bdf8';
        let despGradient = '#fb7185';
        let pecasGradient = '#a855f7';

        if (canvas) {
            const ctx = canvas.getContext('2d');
            const h = canvas.height || 320;

            const g1 = ctx.createLinearGradient(0, 0, 0, h);
            g1.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
            g1.addColorStop(0.6, 'rgba(99, 102, 241, 0.85)');
            g1.addColorStop(1, 'rgba(139, 92, 246, 0.45)');
            fatGradient = g1;

            const g2 = ctx.createLinearGradient(0, 0, 0, h);
            g2.addColorStop(0, 'rgba(251, 113, 133, 0.95)');
            g2.addColorStop(0.6, 'rgba(239, 68, 68, 0.85)');
            g2.addColorStop(1, 'rgba(225, 29, 72, 0.45)');
            despGradient = g2;

            const g3 = ctx.createLinearGradient(0, 0, 0, h);
            g3.addColorStop(0, 'rgba(168, 85, 247, 0.95)');
            g3.addColorStop(0.6, 'rgba(129, 140, 248, 0.85)');
            g3.addColorStop(1, 'rgba(56, 189, 248, 0.45)');
            pecasGradient = g3;
        }

        let newDatasets = [];

        if (currentAnualMetric === 'financas') {
            newDatasets = [
                {
                    type: 'bar',
                    label: 'Faturamento',
                    data: monthlyData.map(d => d.faturamento),
                    backgroundColor: fatGradient,
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 2, bottomRight: 2 },
                    borderSkipped: false,
                    barPercentage: 0.75,
                    categoryPercentage: 0.7,
                    order: 2
                },
                {
                    type: 'bar',
                    label: 'Despesas',
                    data: monthlyData.map(d => d.despesas),
                    backgroundColor: despGradient,
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 2, bottomRight: 2 },
                    borderSkipped: false,
                    barPercentage: 0.75,
                    categoryPercentage: 0.7,
                    order: 3
                },
                {
                    type: 'line',
                    label: 'Lucro Líquido',
                    data: monthlyData.map(d => d.lucro),
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: false,
                    pointBackgroundColor: '#34d399',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    order: 1
                }
            ];
        } else if (currentAnualMetric === 'lucro') {
            newDatasets = [
                {
                    type: 'bar',
                    label: 'Lucro Líquido',
                    data: monthlyData.map(d => d.lucro),
                    backgroundColor: monthlyData.map(d => d.lucro >= 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(244, 63, 94, 0.85)'),
                    borderColor: monthlyData.map(d => d.lucro >= 0 ? '#34d399' : '#fb7185'),
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.65,
                    categoryPercentage: 0.8
                }
            ];
        } else if (currentAnualMetric === 'pecas') {
            newDatasets = [
                {
                    type: 'bar',
                    label: 'Peças Produzidas',
                    data: monthlyData.map(d => d.pecas),
                    backgroundColor: pecasGradient,
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 2, bottomRight: 2 },
                    borderSkipped: false,
                    barPercentage: 0.65,
                    categoryPercentage: 0.8
                }
            ];
        }

        charts.comparativoAnual.data.datasets = newDatasets;
        charts.comparativoAnual.update();
        toggleValuesVisibility();
    };

    const rebuildComparativoAnualChart = () => {
        const canvas = document.getElementById('comparativo-anual-chart');
        if (!canvas) return;
        if (charts.comparativoAnual) {
            charts.comparativoAnual.destroy();
        }
        charts.comparativoAnual = new Chart(canvas, buildComparativoAnualChartConfig());
        updateComparativoAnualChart();
    };

    const rebuildDailyRevenueChart = () => {
        const canvas = document.getElementById('faturamento-diario-chart');
        if (!canvas) return;
        if (charts.faturamentoDiario) {
            charts.faturamentoDiario.destroy();
        }
        charts.faturamentoDiario = new Chart(canvas, buildDailyRevenueChartConfig(currentDailyChartType));
        updateDailyRevenueChart();
    };

    const updateCharts = () => {
        updateDentistaChart();
        updateDailyRevenueChart();
        updateComparativoAnualChart();
    };

    const updateDailyRevenueChart = () => {
        if (!charts.faturamentoDiario) return;

        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const days = [];
        const data = [];
        const labels = [];
        const fullDates = [];
        
        // Gerar todos os dias do período de faturamento
        let currentDay = new Date(startDate);
        currentDay.setHours(12, 0, 0, 0);
        
        const endDayCheck = new Date(endDate);
        endDayCheck.setHours(12, 0, 0, 0);

        while (currentDay <= endDayCheck) {
            // Rótulo compacto legível (ex: "25 Jul", "01 Ago")
            const diaNum = currentDay.getDate();
            const mesNome = currentDay.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            const dayStr = `${String(diaNum).padStart(2, '0')} ${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}`;
            labels.push(dayStr); 

            // Data completa para o tooltip em português
            const dataCompleta = currentDay.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            fullDates.push(dataCompleta.charAt(0).toUpperCase() + dataCompleta.slice(1));

            days.push(new Date(currentDay));
            currentDay.setDate(currentDay.getDate() + 1);
        }
        
        // Filtrar produção para o período
        const producaoDoMes = (state.producao || []).filter(p => {
             if (!p.data) return false;
             const dataProducao = new Date(p.data + "T00:00:00");
             return dataProducao >= startDate && dataProducao <= endDate;
        });
        
        // Agrupar por dia
        const productionByDay = {};
        const piecesByDay = {};
        producaoDoMes.forEach(p => {
            const dataStr = p.data; // YYYY-MM-DD
            if (!productionByDay[dataStr]) {
                productionByDay[dataStr] = 0;
            }
            if (!piecesByDay[dataStr]) {
                piecesByDay[dataStr] = 0;
            }
            
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const valorTotal = valorFinal ? valorFinal.valor * p.qtd : 0;
            
            productionByDay[dataStr] += valorTotal;
            piecesByDay[dataStr] += (p.qtd || 0);
        });
        
        let maxVal = 0;
        let maxDayLabel = '';
        let totalVal = 0;
        let daysWithSales = 0;
        const dayPieces = [];

        // Mapear para dados do gráfico
        days.forEach((day, i) => {
            const yyyy = day.getFullYear();
            const mm = String(day.getMonth() + 1).padStart(2, '0');
            const dd = String(day.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            const val = productionByDay[dateStr] || 0;
            const pieces = piecesByDay[dateStr] || 0;
            data.push(val);
            dayPieces.push(pieces);
            totalVal += val;

            if (val > maxVal) {
                maxVal = val;
                maxDayLabel = labels[i];
            }
            if (val > 0) {
                daysWithSales++;
            }
        });
        
        charts.faturamentoDiario.data.labels = labels;
        charts.faturamentoDiario.data.datasets[0].data = data;
        charts.faturamentoDiario._fullDates = fullDates;
        charts.faturamentoDiario._dayPieces = dayPieces;
        charts.faturamentoDiario.update();

        // Atualizar badges informativos do cabeçalho do gráfico
        const bestDayBadge = document.getElementById('chart-best-day-badge');
        if (bestDayBadge) {
            bestDayBadge.textContent = maxVal > 0 ? `Maior: ${formatarMoeda(maxVal)} (${maxDayLabel})` : 'Maior: R$ 0,00';
        }
        const avgDayBadge = document.getElementById('chart-avg-day-badge');
        if (avgDayBadge) {
            const avgVal = daysWithSales > 0 ? (totalVal / daysWithSales) : 0;
            avgDayBadge.textContent = avgVal > 0 ? `Média/Dia Ativo: ${formatarMoeda(avgVal)}` : `Total: ${formatarMoeda(totalVal)}`;
        }
    };

    const updateDentistaChart = () => {
        if (!charts.dentista) return;

        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));

        const producaoDoMes = (state.producao || []).filter(p => {
            const data = new Date(p.data + "T00:00:00");
            return data >= startDate && data <= endDate;
        });

        // Agregar faturamento e peças por dentista
        const map = {}; // nome -> { faturamento, pecas }
        let totalGeral = 0;
        producaoDoMes.forEach(p => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            if (!dentista) return;

            const nome = dentista.nome;
            const valorDentista = (dentista.valores || []).find(v => v.tipo === p.tipo);
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            
            const faturamento = valorFinal ? valorFinal.valor * p.qtd : 0;

            if (!map[nome]) map[nome] = { faturamento: 0, pecas: 0 };
            map[nome].faturamento += faturamento;
            map[nome].pecas += p.qtd || 0;
            totalGeral += faturamento;
        });

        // Converter para array, ordenar
        const entries = Object.entries(map).map(([nome, v]) => ({ nome, faturamento: v.faturamento, pecas: v.pecas }));
        entries.sort((a, b) => b.faturamento - a.faturamento);
        const top = state.showAllDentistas ? entries : entries.slice(0, 15);

        const fullNames = top.map(e => e.nome);
        const shortLabels = fullNames.map(n => abbreviateName(n, 28));
        const data = top.map(e => Number(e.faturamento.toFixed(2)));

        // Cores vibrantes com gradientes de alta tecnologia para cada barra
        const canvas = document.getElementById('dentista-chart');
        let backgroundColors = [];
        if (canvas) {
            const ctx = canvas.getContext('2d');
            backgroundColors = top.map((_, i) => {
                const gradient = ctx.createLinearGradient(0, 0, 400, 0);
                if (i === 0) {
                    // Top 1: Azul Safira para Ciano Brilhante com Violeta
                    gradient.addColorStop(0, '#0284c7');
                    gradient.addColorStop(0.5, '#38bdf8');
                    gradient.addColorStop(1, '#818cf8');
                } else if (i === 1) {
                    // Top 2: Esmeralda Radiante
                    gradient.addColorStop(0, '#059669');
                    gradient.addColorStop(0.6, '#10b981');
                    gradient.addColorStop(1, '#34d399');
                } else if (i === 2) {
                    // Top 3: Roxo Ametista
                    gradient.addColorStop(0, '#7c3aed');
                    gradient.addColorStop(0.6, '#8b5cf6');
                    gradient.addColorStop(1, '#c084fc');
                } else if (i === 3) {
                    // Top 4: Âmbar Ouro
                    gradient.addColorStop(0, '#d97706');
                    gradient.addColorStop(0.6, '#f59e0b');
                    gradient.addColorStop(1, '#fbbf24');
                } else {
                    // Demais: Azul Clínico Apple
                    gradient.addColorStop(0, '#1d4ed8');
                    gradient.addColorStop(0.6, '#3b82f6');
                    gradient.addColorStop(1, '#93c5fd');
                }
                return gradient;
            });
        }

        charts.dentista.data.labels = shortLabels;
        charts.dentista.data.datasets[0].data = data;
        charts.dentista.data.datasets[0].backgroundColor = backgroundColors;

        // Guardar mapa de peças e nomes completos para tooltips e plugin
        charts.dentista._piecesMap = top.reduce((acc, cur) => { acc[cur.nome] = cur.pecas; return acc; }, {});
        charts.dentista._fullNames = fullNames;

        // Ajustar altura dinâmica do canvas e espessura da barra (Evita tela preta vazia quando há poucos dentistas!)
        try {
            if (canvas) {
                const count = top.length;
                let computedHeight = 140;
                let barThickness = 32;

                if (count === 0) {
                    computedHeight = 140;
                    barThickness = 28;
                } else if (count === 1) {
                    computedHeight = 130;
                    barThickness = 36;
                } else if (count === 2) {
                    computedHeight = 175;
                    barThickness = 32;
                } else if (count <= 4) {
                    computedHeight = count * 52 + 65;
                    barThickness = 28;
                } else {
                    computedHeight = Math.min(550, count * 44 + 60);
                    barThickness = 22;
                }

                canvas.height = computedHeight;
                canvas.style.height = `${computedHeight}px`;
                charts.dentista.data.datasets[0].barThickness = barThickness;
            }
        } catch (e) {
            console.warn('Erro ao ajustar dimensões dinâmicas do canvas do dentista:', e);
        }

        charts.dentista.update();

        // Atualizar badges do card
        const totalBadge = document.getElementById('dentista-chart-total-badge');
        if (totalBadge) {
            totalBadge.textContent = `Total: ${formatarMoeda(totalGeral)}`;
        }
        const countBadge = document.getElementById('dentista-chart-count-badge');
        if (countBadge) {
            countBadge.textContent = `${top.length} Dentista${top.length !== 1 ? 's' : ''}`;
        }

        // Exibir destaque do pódio para o Top 1
        const podiumContainer = document.getElementById('dentista-podium-container');
        if (podiumContainer) {
            if (top.length > 0) {
                const leader = top[0];
                const leaderShare = totalGeral > 0 ? ((leader.faturamento / totalGeral) * 100).toFixed(0) : 0;
                podiumContainer.innerHTML = `
                    <div class="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-amber-400/25 shadow-sm gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold text-lg shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                                👑
                            </div>
                            <div>
                                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Principal Parceiro do Mês</span>
                                <p class="font-bold text-white text-base">${leader.nome}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 text-right">
                            <div>
                                <span class="font-bold text-emerald-400 text-base monetary-value">${formatarMoeda(leader.faturamento)}</span>
                                <p class="text-xs text-slate-400">${leader.pecas} peça${leader.pecas !== 1 ? 's' : ''} • ${leaderShare}% da receita</p>
                            </div>
                        </div>
                    </div>
                `;
                podiumContainer.classList.remove('hidden');
            } else {
                podiumContainer.classList.add('hidden');
            }
        }
    };

    // Helper global para escape de strings no DOM
    const escapeHtml = (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Resolução precisa de preços (preço exclusivo do dentista com fallback para tabela geral)
    const getItemValorUnitarioGlobal = (dentistaId, tipo) => {
        const dentista = (state.dentistas || []).find(d => String(d.id) === String(dentistaId));
        const valDentista = dentista ? (dentista.valores || []).find(v => v.tipo === tipo) : null;
        const valGlobal = (state.valores || []).find(v => v.tipo === tipo);
        return (valDentista || valGlobal)?.valor || 0;
    };

    // --- EXPORTAÇÃO PDF EXECUTIVA ---

    /**
     * Coleta e consolida todos os indicadores financeiros e operacionais do mês atual
     */
    const getMonthlyReportConsolidatedData = () => {
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const mesAno = new Date(state.mesAtual).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        // Mês anterior para cálculo de tendências
        const prevMonthDate = new Date(state.mesAtual);
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const { startDate: prevStart, endDate: prevEnd } = getBillingPeriod(prevMonthDate);

        // Produção do ciclo atual
        const producaoDoMes = (state.producao || []).filter(p => {
            if (!p.data) return false;
            const dataProd = new Date(p.data + "T00:00:00");
            return dataProd >= startDate && dataProd <= endDate;
        });

        // Produção do ciclo anterior
        const producaoMesAnterior = (state.producao || []).filter(p => {
            if (!p.data) return false;
            const dataProd = new Date(p.data + "T00:00:00");
            return dataProd >= prevStart && dataProd <= prevEnd;
        });

        // Despesas do ciclo atual
        const despesasDoMes = (state.despesas || []).filter(d => {
            if (!d.data) return false;
            const dataDesp = new Date(d.data + "T00:00:00");
            return dataDesp >= startDate && dataDesp <= endDate;
        });

        // Despesas do ciclo anterior
        const despesasMesAnterior = (state.despesas || []).filter(d => {
            if (!d.data) return false;
            const dataDesp = new Date(d.data + "T00:00:00");
            return dataDesp >= prevStart && dataDesp <= prevEnd;
        });

        // Resolução precisa de preços (preço do dentista com fallback para tabela geral)
        const getItemValorUnitario = (dentistaId, tipo) => getItemValorUnitarioGlobal(dentistaId, tipo);

        let faturamentoBruto = 0;
        let totalPecas = 0;
        const tiposMap = {};
        const dentistasMap = {};
        const diasComProducao = new Set();

        producaoDoMes.forEach(p => {
            const qtd = Number(p.qtd) || 0;
            const unitVal = getItemValorUnitario(p.dentista, p.tipo);
            const totalItem = unitVal * qtd;

            faturamentoBruto += totalItem;
            totalPecas += qtd;
            if (p.data) diasComProducao.add(p.data);

            // Agrupamento por tipo de trabalho
            if (!tiposMap[p.tipo]) {
                tiposMap[p.tipo] = { tipo: p.tipo, qtd: 0, total: 0 };
            }
            tiposMap[p.tipo].qtd += qtd;
            tiposMap[p.tipo].total += totalItem;

            // Agrupamento por dentista
            const dId = p.dentista ? String(p.dentista) : 'desconhecido';
            if (!dentistasMap[dId]) {
                const dObj = (state.dentistas || []).find(d => String(d.id) === dId);
                dentistasMap[dId] = {
                    id: dId,
                    nome: dObj ? dObj.nome : 'Dentista Não Cadastrado',
                    clinica: dObj?.clinica || '-',
                    qtd: 0,
                    total: 0
                };
            }
            dentistasMap[dId].qtd += qtd;
            dentistasMap[dId].total += totalItem;
        });

        const totalDespesas = despesasDoMes.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
        const lucroLiquido = faturamentoBruto - totalDespesas;
        const margemLucro = faturamentoBruto > 0 ? ((lucroLiquido / faturamentoBruto) * 100).toFixed(1) : '0.0';

        // Cálculos do mês anterior
        let faturamentoAnterior = 0;
        producaoMesAnterior.forEach(p => {
            const qtd = Number(p.qtd) || 0;
            const unitVal = getItemValorUnitario(p.dentista, p.tipo);
            faturamentoAnterior += unitVal * qtd;
        });
        const totalDespesasAnterior = despesasMesAnterior.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
        const lucroAnterior = faturamentoAnterior - totalDespesasAnterior;

        const varFaturamento = faturamentoAnterior > 0 
            ? (((faturamentoBruto - faturamentoAnterior) / faturamentoAnterior) * 100).toFixed(1)
            : null;

        const ticketMedioPeca = totalPecas > 0 ? faturamentoBruto / totalPecas : 0;
        const diasProdutivosCount = Math.max(diasComProducao.size, 1);
        const mediaDiariaFaturamento = faturamentoBruto / diasProdutivosCount;

        // Despesas agrupadas por categoria
        const categoriasDespesasMap = {};
        despesasDoMes.forEach(d => {
            const cat = d.categoria || 'Outros';
            if (!categoriasDespesasMap[cat]) {
                categoriasDespesasMap[cat] = { categoria: cat, count: 0, total: 0 };
            }
            categoriasDespesasMap[cat].count += 1;
            categoriasDespesasMap[cat].total += Number(d.valor) || 0;
        });

        return {
            startDate,
            endDate,
            mesAno,
            producaoDoMes,
            despesasDoMes,
            faturamentoBruto,
            totalDespesas,
            lucroLiquido,
            margemLucro,
            totalPecas,
            ticketMedioPeca,
            mediaDiariaFaturamento,
            diasProdutivosCount,
            varFaturamento,
            faturamentoAnterior,
            totalDespesasAnterior,
            lucroAnterior,
            tiposMap,
            dentistasMap,
            categoriasDespesasMap,
            getItemValorUnitario
        };
    };

    /**
     * Retorna a logo do aplicativo para inclusão em relatórios e faturas PDF
     */
    const getAppLogo = () => {
        if (window.APP_LOGO_BASE64) return window.APP_LOGO_BASE64;
        const imgEl = document.querySelector('img[src="logo.png"]') || document.querySelector('img[src="logo2.png"]');
        return imgEl || null;
    };

    /**
     * Desenha o cabeçalho executivo institucional nas páginas do relatório com logo no canto superior esquerdo
     */
    const drawExecutiveHeader = (doc, titleText, subtitleText, startDate, endDate, mesAno) => {
        // Barra de fundo azul-escuro / obsidiana (Slate 900)
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 29, 'F');

        // Faixa de realce superior safira
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 1.8, 'F');

        // Linha inferior de brilho ciano
        doc.setFillColor(56, 189, 248);
        doc.rect(0, 28.4, 210, 0.6, 'F');

        // Logo no canto superior esquerdo
        const logo = getAppLogo();
        let textStartX = 14;
        if (logo) {
            try {
                // Cápsula squircle branca com acabamento limpo
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(14, 4.5, 20, 20, 2.5, 2.5, 'F');
                doc.addImage(logo, 'PNG', 15, 5.5, 18, 18);
                textStartX = 38;
            } catch (e) {
                console.warn('Erro ao inserir logo no cabeçalho:', e);
                textStartX = 14;
            }
        }

        // Nome da Empresa / Sistema
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('DENTALFLOW LAB', textStartX, 12);

        // Subtítulo da Seção
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(56, 189, 248);
        doc.text(subtitleText.toUpperCase(), textStartX, 17.8);

        // Cápsula do Mês de Referência (Canto Superior Direito)
        doc.setFillColor(30, 41, 59);
        doc.setDrawColor(71, 85, 105);
        doc.setLineWidth(0.3);
        doc.roundedRect(126, 6, 70, 15.5, 2.5, 2.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        const mesCapitalizado = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
        doc.text(mesCapitalizado.toUpperCase(), 161, 11.8, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(148, 163, 184);
        const cicloText = `Ciclo: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;
        doc.text(cicloText, 161, 17.5, { align: 'center' });
    };

    /**
     * Aplica o rodapé profissional em todas as páginas do documento
     */
    const applyExecutiveFooters = (doc) => {
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            // Linha divisória suave
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(14, 286.5, 196, 286.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.2);
            doc.setTextColor(148, 163, 184);
            doc.text('DentalFlow • Gestão Laboratorial Odontológica Especializada', 14, 291.5);
            doc.text('Documento Gerencial Confidencial', 105, 291.5, { align: 'center' });
            doc.text(`Página ${i} de ${totalPages}`, 196, 291.5, { align: 'right' });
        }
    };

    /**
     * Desenha o título de uma seção com indicador visual
     */
    const drawSectionTitle = (doc, yPos, title) => {
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(14, yPos - 3.4, 2.8, 4.8, 0.6, 0.6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(title, 19.5, yPos);
    };

    /**
     * GERAÇÃO DO RELATÓRIO EXECUTIVO COMPLETO DO MÊS (Dashboard & Resumo Mensal)
     */
    const generateMonthlyExecutiveReport = (reportType = 'dashboard') => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = getMonthlyReportConsolidatedData();

        const titleText = reportType === 'dashboard' ? 'Relatório Executivo do Dashboard' : 'Fechamento de Resumo Mensal';
        const subtitleText = 'Relatório Mensal de Gestão & Fechamento Financeiro';

        // 1. Cabeçalho Institucional
        drawExecutiveHeader(doc, titleText, subtitleText, data.startDate, data.endDate, data.mesAno);

        // 2. Faixa de Metadados
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(187, 247, 208);
        doc.setLineWidth(0.2);
        doc.roundedRect(14, 30.5, 23, 4.6, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(21, 128, 61);
        doc.text('CONSOLIDADO', 25.5, 33.8, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const emissaoData = new Date().toLocaleString('pt-BR');
        const userEmail = (state.user && state.user.email) || (document.getElementById('user-email-display')?.textContent?.trim()) || 'Laboratório';
        doc.text(`Unidade: Matriz • Laboratório Especializado`, 40, 34);
        doc.text(`Emissão: ${emissaoData} • Resp.: ${userEmail}`, 196, 34, { align: 'right' });

        // 3. Quatro Cartões de KPI Principais (Estilo Apple Glass)
        const cardY = 38;
        const cardH = 21.5;
        const cardW = 43;
        const cardGap = 3.3;

        // Card 1: Faturamento Bruto (Sky)
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(3, 105, 161);
        doc.text('FATURAMENTO BRUTO', 17.5, cardY + 5.2);
        doc.setFontSize(11.5);
        doc.setTextColor(12, 74, 110);
        doc.text(formatarMoeda(data.faturamentoBruto), 17.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(2, 132, 199);
        const subFat = data.varFaturamento !== null ? `${data.varFaturamento >= 0 ? '+' : ''}${data.varFaturamento}% vs. mês anterior` : 'Receita total do ciclo';
        doc.text(subFat, 17.5, cardY + 18.2);

        // Card 2: Despesas Totais (Rose)
        const card2X = 14 + cardW + cardGap;
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 205, 211);
        doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(185, 28, 28);
        doc.text('DESPESAS TOTAIS', card2X + 3.5, cardY + 5.2);
        doc.setFontSize(11.5);
        doc.setTextColor(136, 19, 55);
        doc.text(formatarMoeda(data.totalDespesas), card2X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(225, 29, 72);
        doc.text(`${data.despesasDoMes.length} despesas lançadas`, card2X + 3.5, cardY + 18.2);

        // Card 3: Lucro Líquido (Emerald / Red)
        const card3X = card2X + cardW + cardGap;
        const isLucroPositivo = data.lucroLiquido >= 0;
        doc.setFillColor(isLucroPositivo ? 240 : 254, isLucroPositivo ? 253 : 242, isLucroPositivo ? 244 : 242);
        doc.setDrawColor(isLucroPositivo ? 187 : 254, isLucroPositivo ? 247 : 205, isLucroPositivo ? 208 : 211);
        doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(isLucroPositivo ? 21 : 185, isLucroPositivo ? 128 : 28, isLucroPositivo ? 61 : 28);
        doc.text('LUCRO LÍQUIDO', card3X + 3.5, cardY + 5.2);
        doc.setFontSize(11.5);
        doc.setTextColor(isLucroPositivo ? 20 : 136, isLucroPositivo ? 83 : 19, isLucroPositivo ? 45 : 55);
        doc.text(formatarMoeda(data.lucroLiquido), card3X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(isLucroPositivo ? 22 : 225, isLucroPositivo ? 163 : 29, isLucroPositivo ? 74 : 72);
        doc.text(`Margem Real: ${data.margemLucro}%`, card3X + 3.5, cardY + 18.2);

        // Card 4: Volume de Peças (Purple)
        const card4X = card3X + cardW + cardGap;
        doc.setFillColor(245, 243, 255);
        doc.setDrawColor(221, 214, 254);
        doc.roundedRect(card4X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(109, 40, 217);
        doc.text('PEÇAS PRODUZIDAS', card4X + 3.5, cardY + 5.2);
        doc.setFontSize(11.5);
        doc.setTextColor(76, 29, 149);
        doc.text(`${data.totalPecas} un.`, card4X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(124, 58, 237);
        doc.text(`Ticket Médio: ${formatarMoeda(data.ticketMedioPeca)}`, card4X + 3.5, cardY + 18.2);

        let currentY = 66;

        // --- SEÇÃO 1: Demonstrativo Financeiro Sintético ---
        drawSectionTitle(doc, currentY, '1. DEMONSTRATIVO FINANCEIRO SINTÉTICO');
        currentY += 4;

        doc.autoTable({
            startY: currentY,
            margin: { left: 14, right: 14 },
            head: [['Indicador Financeiro', 'Base de Apuração & Detalhes', 'Valor Consolidado']],
            body: [
                ['Faturamento Bruto', 'Total de próteses e serviços entregues no ciclo', formatarMoeda(data.faturamentoBruto)],
                ['Despesas Operacionais', 'Custos fixos, insumos, pró-labore e manutenção', formatarMoeda(data.totalDespesas)],
                ['Resultado Operacional Líquido', 'Saldo real disponível pós-dedução de despesas', formatarMoeda(data.lucroLiquido)],
                ['Margem Operacional Líquida', 'Percentual de rentabilidade sobre a receita bruta', `${data.margemLucro}%`],
                ['Média Diária de Faturamento', `Média sobre ${data.diasProdutivosCount} dia(s) com movimentação`, formatarMoeda(data.mediaDiariaFaturamento)],
                ['Ticket Médio por Elemento Protético', `Média faturada por peça (${data.totalPecas} un. no mês)`, formatarMoeda(data.ticketMedioPeca)]
            ],
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 2.8,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3.2
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 64, fontStyle: 'bold' },
                1: { cellWidth: 70 },
                2: { cellWidth: 48, halign: 'right', fontStyle: 'bold' }
            }
        });

        currentY = doc.autoTable.previous.finalY + 10;

        // --- SEÇÃO 2: Distribuição por Tipo de Trabalho ---
        const tiposArray = Object.values(data.tiposMap);
        tiposArray.sort((a, b) => b.total - a.total);

        if (currentY > 220) {
            doc.addPage();
            currentY = 20;
        }

        drawSectionTitle(doc, currentY, '2. DISTRIBUIÇÃO POR TIPO DE TRABALHO & ESPECIALIDADE');
        currentY += 4;

        const tiposBody = tiposArray.map(item => {
            const percQtd = data.totalPecas > 0 ? ((item.qtd / data.totalPecas) * 100).toFixed(1) + '%' : '0%';
            const percFat = data.faturamentoBruto > 0 ? ((item.total / data.faturamentoBruto) * 100).toFixed(1) + '%' : '0%';
            const unitMedio = item.qtd > 0 ? item.total / item.qtd : 0;
            return [
                item.tipo,
                `${item.qtd} un.`,
                percQtd,
                formatarMoeda(item.total),
                percFat,
                formatarMoeda(unitMedio)
            ];
        });

        // Linha totalizadora
        tiposBody.push([
            'TOTAL CONSOLIDADO',
            `${data.totalPecas} un.`,
            '100%',
            formatarMoeda(data.faturamentoBruto),
            '100%',
            formatarMoeda(data.ticketMedioPeca)
        ]);

        doc.autoTable({
            startY: currentY,
            margin: { left: 14, right: 14 },
            head: [['Tipo de Trabalho', 'Qtd (un)', '% Volume', 'Faturamento (R$)', '% Receita', 'Valor Médio']],
            body: tiposBody.length > 1 ? tiposBody : [['Nenhum trabalho registrado no ciclo', '-', '-', '-', '-', '-']],
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 2.7,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3.2
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 54 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 32, halign: 'right' },
                4: { cellWidth: 24, halign: 'center' },
                5: { cellWidth: 30, halign: 'right' }
            },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === tiposBody.length - 1 && tiposBody.length > 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [241, 245, 249];
                    hookData.cell.styles.textColor = [15, 23, 42];
                }
            }
        });

        currentY = doc.autoTable.previous.finalY + 10;

        // --- SEÇÃO 3: Desempenho dos Principais Dentistas / Clínicas ---
        const dentistasArray = Object.values(data.dentistasMap);
        dentistasArray.sort((a, b) => b.total - a.total);

        if (currentY > 220) {
            doc.addPage();
            currentY = 20;
        }

        drawSectionTitle(doc, currentY, '3. RANKING DE PARCEIROS & DENTISTAS (FATURAMENTO)');
        currentY += 4;

        const dentistasBody = dentistasArray.map(item => {
            const perc = data.faturamentoBruto > 0 ? ((item.total / data.faturamentoBruto) * 100).toFixed(1) + '%' : '0%';
            const tm = item.qtd > 0 ? item.total / item.qtd : 0;
            return [
                item.nome,
                item.clinica,
                `${item.qtd} un.`,
                formatarMoeda(item.total),
                perc,
                formatarMoeda(tm)
            ];
        });

        dentistasBody.push([
            'TOTAL CONSOLIDADO',
            '-',
            `${data.totalPecas} un.`,
            formatarMoeda(data.faturamentoBruto),
            '100%',
            formatarMoeda(data.ticketMedioPeca)
        ]);

        doc.autoTable({
            startY: currentY,
            margin: { left: 14, right: 14 },
            head: [['Dentista / Parceiro', 'Clínica / Unidade', 'Qtd Peças', 'Faturamento (R$)', '% do Mês', 'Ticket Médio']],
            body: dentistasBody.length > 1 ? dentistasBody : [['Nenhum dentista com produção no ciclo', '-', '-', '-', '-', '-']],
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 2.7,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3.2
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 54 },
                1: { cellWidth: 38 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 32, halign: 'right' },
                4: { cellWidth: 18, halign: 'center' },
                5: { cellWidth: 20, halign: 'right' }
            },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === dentistasBody.length - 1 && dentistasBody.length > 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [241, 245, 249];
                    hookData.cell.styles.textColor = [15, 23, 42];
                }
            }
        });

        currentY = doc.autoTable.previous.finalY + 10;

        // --- SEÇÃO 4: Composição de Despesas por Categoria (se houver) ---
        const categoriasArray = Object.values(data.categoriasDespesasMap);
        if (categoriasArray.length > 0) {
            categoriasArray.sort((a, b) => b.total - a.total);

            if (currentY > 220) {
                doc.addPage();
                currentY = 20;
            }

            drawSectionTitle(doc, currentY, '4. COMPOSIÇÃO DE DESPESAS OPERACIONAIS POR CATEGORIA');
            currentY += 4;

            const despBody = categoriasArray.map(item => {
                const perc = data.totalDespesas > 0 ? ((item.total / data.totalDespesas) * 100).toFixed(1) + '%' : '0%';
                return [
                    item.categoria,
                    `${item.count} registro(s)`,
                    formatarMoeda(item.total),
                    perc
                ];
            });

            despBody.push([
                'TOTAL DE DESPESAS',
                `${data.despesasDoMes.length} registro(s)`,
                formatarMoeda(data.totalDespesas),
                '100%'
            ]);

            doc.autoTable({
                startY: currentY,
                margin: { left: 14, right: 14 },
                head: [['Categoria de Custo / Despesa', 'Lançamentos', 'Total Gasto (R$)', '% das Despesas']],
                body: despBody,
                theme: 'striped',
                styles: {
                    font: 'helvetica',
                    fontSize: 8,
                    cellPadding: 2.7,
                    textColor: [51, 65, 85],
                    lineColor: [226, 232, 240],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    cellPadding: 3.2
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 72 },
                    1: { cellWidth: 34, halign: 'center' },
                    2: { cellWidth: 44, halign: 'right' },
                    3: { cellWidth: 32, halign: 'center' }
                },
                didParseCell: (hookData) => {
                    if (hookData.section === 'body' && hookData.row.index === despBody.length - 1) {
                        hookData.cell.styles.fontStyle = 'bold';
                        hookData.cell.styles.fillColor = [241, 245, 249];
                        hookData.cell.styles.textColor = [15, 23, 42];
                    }
                }
            });

            currentY = doc.autoTable.previous.finalY + 10;
        }

        // --- SEÇÃO 5: Relação das Ordens de Serviço do Mês ---
        if (data.producaoDoMes.length > 0) {
            // Nova página para a relação detalhada de trabalhos para melhor leitura e organização
            doc.addPage();
            currentY = 20;

            drawSectionTitle(doc, currentY, '5. RELAÇÃO COMPLETA DE TRABALHOS & ORDENS DO MÊS');
            currentY += 4;

            const ordensRows = data.producaoDoMes.map(p => {
                const dentista = (state.dentistas || []).find(d => String(d.id) === String(p.dentista));
                const dNome = dentista ? dentista.nome : '-';
                const unitVal = data.getItemValorUnitario(p.dentista, p.tipo);
                const totalItem = unitVal * p.qtd;
                const dataFormatada = p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

                return [
                    dataFormatada,
                    p.nomePaciente || 'Não informado',
                    dNome,
                    p.tipo,
                    `${p.qtd}x`,
                    formatarMoeda(totalItem),
                    p.status || 'Entregue'
                ];
            });

            doc.autoTable({
                startY: currentY,
                margin: { left: 14, right: 14 },
                head: [['Data', 'Paciente', 'Dentista / Parceiro', 'Tipo de Trabalho', 'Qtd', 'Total (R$)', 'Status']],
                body: ordensRows,
                theme: 'striped',
                styles: {
                    font: 'helvetica',
                    fontSize: 7.6,
                    cellPadding: 2.4,
                    textColor: [51, 65, 85],
                    lineColor: [226, 232, 240],
                    lineWidth: 0.1,
                    overflow: 'ellipsize'
                },
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 7.8,
                    cellPadding: 3
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 18, halign: 'center' },
                    1: { cellWidth: 38 },
                    2: { cellWidth: 36 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 12, halign: 'center' },
                    5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
                    6: { cellWidth: 16, halign: 'center' }
                }
            });
        }

        // Aplica o rodapé em todas as páginas
        applyExecutiveFooters(doc);

        // Salvar com nome limpo e descritivo
        const mesAnoSlug = data.mesAno.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const filename = `${reportType}_gerencial_${mesAnoSlug}.pdf`;
        doc.save(filename);
    };

    const generateDashboardPDF = () => {
        generateMonthlyExecutiveReport('dashboard');
    };

    const generateResumoPDF = () => {
        generateMonthlyExecutiveReport('resumo');
    };

    const generateAnalisePDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = getMonthlyReportConsolidatedData();

        // Cabeçalho Institucional
        drawExecutiveHeader(doc, 'Relatório de Análise por Dentista', 'Desempenho Comercial & Operacional', data.startDate, data.endDate, data.mesAno);

        // Faixa de Metadados
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(187, 247, 208);
        doc.setLineWidth(0.2);
        doc.roundedRect(14, 30.5, 23, 4.6, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(21, 128, 61);
        doc.text('CONSOLIDADO', 25.5, 33.8, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const emissaoData = new Date().toLocaleString('pt-BR');
        const userEmail = (state.user && state.user.email) || (document.getElementById('user-email-display')?.textContent?.trim()) || 'Laboratório';
        doc.text(`Unidade: Matriz • Laboratório Especializado`, 40, 34);
        doc.text(`Emissão: ${emissaoData} • Resp.: ${userEmail}`, 196, 34, { align: 'right' });

        // 3 Cards de Resumo Rápido
        const cardY = 38;
        const cardH = 21;
        const cardW = 58;
        const cardGap = 4;

        // Card 1: Faturamento do Mês
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(3, 105, 161);
        doc.text('RECEITA TOTAL DO CICLO', 17.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(12, 74, 110);
        doc.text(formatarMoeda(data.faturamentoBruto), 17.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(2, 132, 199);
        doc.text('Faturamento consolidado', 17.5, cardY + 18);

        // Card 2: Dentistas Ativos
        const dentistasArray = Object.values(data.dentistasMap);
        const card2X = 14 + cardW + cardGap;
        doc.setFillColor(245, 243, 255);
        doc.setDrawColor(221, 214, 254);
        doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(109, 40, 217);
        doc.text('PARCEIROS ATENDIDOS', card2X + 3.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(76, 29, 149);
        doc.text(`${dentistasArray.length} Dentistas`, card2X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(124, 58, 237);
        doc.text(`${data.totalPecas} peças solicitadas`, card2X + 3.5, cardY + 18);

        // Card 3: Média por Dentista
        const mediaPorDentista = dentistasArray.length > 0 ? data.faturamentoBruto / dentistasArray.length : 0;
        const card3X = card2X + cardW + cardGap;
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(21, 128, 61);
        doc.text('FATURAMENTO MÉDIO / PARCEIRO', card3X + 3.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(20, 83, 45);
        doc.text(formatarMoeda(mediaPorDentista), card3X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(22, 163, 74);
        doc.text(`Ticket Médio/Peça: ${formatarMoeda(data.ticketMedioPeca)}`, card3X + 3.5, cardY + 18);

        let currentY = 66;
        drawSectionTitle(doc, currentY, '1. RANKING COMPLETO DE DENTISTAS NO CICLO');
        currentY += 4;

        dentistasArray.sort((a, b) => b.total - a.total);

        const tableRows = dentistasArray.map(d => {
            const perc = data.faturamentoBruto > 0 ? ((d.total / data.faturamentoBruto) * 100).toFixed(1) + '%' : '0%';
            const tm = d.qtd > 0 ? d.total / d.qtd : 0;
            return [
                d.nome,
                d.clinica,
                `${d.qtd} un.`,
                formatarMoeda(d.total),
                perc,
                formatarMoeda(tm)
            ];
        });

        tableRows.push([
            'TOTAL CONSOLIDADO',
            '-',
            `${data.totalPecas} un.`,
            formatarMoeda(data.faturamentoBruto),
            '100%',
            formatarMoeda(data.ticketMedioPeca)
        ]);

        doc.autoTable({
            startY: currentY,
            margin: { left: 14, right: 14 },
            head: [['Dentista / Parceiro', 'Clínica', 'Qtd Peças', 'Faturamento (R$)', '% Receita', 'Ticket Médio']],
            body: tableRows,
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 2.8,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3.2
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 54 },
                1: { cellWidth: 38 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 32, halign: 'right' },
                4: { cellWidth: 18, halign: 'center' },
                5: { cellWidth: 20, halign: 'right' }
            },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === tableRows.length - 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [241, 245, 249];
                    hookData.cell.styles.textColor = [15, 23, 42];
                }
            }
        });

        applyExecutiveFooters(doc);
        const mesAnoSlug = data.mesAno.toLowerCase().replace(/[^a-z0-9]/g, '_');
        doc.save(`analise_dentistas_${mesAnoSlug}.pdf`);
    };

    const generateProducaoPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = getMonthlyReportConsolidatedData();

        // Cabeçalho Institucional
        drawExecutiveHeader(doc, 'Relatório Mensal de Produção', 'Relação Operacional de Trabalhos', data.startDate, data.endDate, data.mesAno);

        // Faixa de Metadados
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(187, 247, 208);
        doc.setLineWidth(0.2);
        doc.roundedRect(14, 30.5, 23, 4.6, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(21, 128, 61);
        doc.text('CONSOLIDADO', 25.5, 33.8, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const emissaoData = new Date().toLocaleString('pt-BR');
        const userEmail = (state.user && state.user.email) || (document.getElementById('user-email-display')?.textContent?.trim()) || 'Laboratório';
        doc.text(`Unidade: Matriz • Laboratório Especializado`, 40, 34);
        doc.text(`Emissão: ${emissaoData} • Resp.: ${userEmail}`, 196, 34, { align: 'right' });

        // Cartões de Resumo no topo
        const cardY = 38;
        const cardH = 21;
        const cardW = 58;
        const cardGap = 4;

        // Card 1: Faturamento da Produção
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(3, 105, 161);
        doc.text('FATURAMENTO TOTAL', 17.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(12, 74, 110);
        doc.text(formatarMoeda(data.faturamentoBruto), 17.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(2, 132, 199);
        doc.text('Total bruto faturado', 17.5, cardY + 18);

        // Card 2: Peças Produzidas
        const card2X = 14 + cardW + cardGap;
        doc.setFillColor(245, 243, 255);
        doc.setDrawColor(221, 214, 254);
        doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(109, 40, 217);
        doc.text('VOLUME FABRICADO', card2X + 3.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(76, 29, 149);
        doc.text(`${data.totalPecas} Peças`, card2X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(124, 58, 237);
        doc.text(`${data.producaoDoMes.length} ordens de trabalho`, card2X + 3.5, cardY + 18);

        // Card 3: Ticket Médio
        const card3X = card2X + cardW + cardGap;
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(21, 128, 61);
        doc.text('TICKET MÉDIO POR PEÇA', card3X + 3.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(20, 83, 45);
        doc.text(formatarMoeda(data.ticketMedioPeca), card3X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(22, 163, 74);
        doc.text(`Média faturada por elemento`, card3X + 3.5, cardY + 18);

        let currentY = 66;
        drawSectionTitle(doc, currentY, '1. RELAÇÃO COMPLETA DE TRABALHOS DA PRODUÇÃO MENSAL');
        currentY += 4;

        const tableColumns = ["Data", "Paciente", "Dentista", "Tipo de Trabalho", "Obs.", "Status", "Qtd", "Valor (R$)"];
        const tableRows = data.producaoDoMes.map(p => {
            const dentista = (state.dentistas || []).find(d => String(d.id) === String(p.dentista));
            const dentistaName = dentista ? dentista.nome : '-';
            const unitVal = data.getItemValorUnitario(p.dentista, p.tipo);
            const valorTotal = unitVal * p.qtd;
            const dataStr = p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

            return [
                dataStr,
                p.nomePaciente || '-',
                dentistaName,
                p.tipo,
                p.obs || '-',
                p.status || 'Entregue',
                `${p.qtd}x`,
                formatarMoeda(valorTotal)
            ];
        });

        // Adiciona linha de totalização se houver itens
        if (tableRows.length > 0) {
            tableRows.push([
                '-',
                'TOTAL CONSOLIDADO',
                '-',
                '-',
                '-',
                '-',
                `${data.totalPecas}x`,
                formatarMoeda(data.faturamentoBruto)
            ]);
        }

        doc.autoTable({
            startY: currentY,
            margin: { left: 14, right: 14 },
            head: [tableColumns],
            body: tableRows.length > 0 ? tableRows : [['-', 'Nenhum trabalho registrado neste período', '-', '-', '-', '-', '-', '-']],
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 7.5,
                cellPadding: 2.3,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1,
                overflow: 'ellipsize'
            },
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 7.8,
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 16, halign: 'center' },
                1: { cellWidth: 32 },
                2: { cellWidth: 32 },
                3: { cellWidth: 32 },
                4: { cellWidth: 20 },
                5: { cellWidth: 16, halign: 'center' },
                6: { cellWidth: 12, halign: 'center' },
                7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === tableRows.length - 1 && tableRows.length > 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [241, 245, 249];
                    hookData.cell.styles.textColor = [15, 23, 42];
                }
            }
        });

        applyExecutiveFooters(doc);
        const mesAnoSlug = data.mesAno.toLowerCase().replace(/[^a-z0-9]/g, '_');
        doc.save(`producao_mensal_${mesAnoSlug}.pdf`);
    };

    const handleGerarCobrancaPix = () => {
        const selectedDentistaId = filterDentistaSelect.value;
        if (!selectedDentistaId) {
            showToast(t('toast_select_dentist_pdf'));
            return;
        }

        const dentista = (state.dentistas || []).find(d => d.id == selectedDentistaId);
        if (!dentista) {
            showToast(t('toast_dentist_not_found'));
            return;
        }

        const checkboxes = document.querySelectorAll('.producao-checkbox:checked');
        if (checkboxes.length === 0) {
            showToast('Selecione pelo menos um trabalho para gerar a cobrança.', 'error');
            return;
        }

        if (!state.pixKey || !state.pixName || !state.pixCity) {
            showToast('Configure a chave PIX, Nome e Cidade no painel Admin.', 'error');
            return;
        }

        let totalValor = 0;
        const selectedItems = [];

        checkboxes.forEach(cb => {
            const id = cb.dataset.id;
            const paciente = cb.dataset.paciente;
            const tipo = cb.dataset.tipo;
            const qtd = parseInt(cb.dataset.qtd) || 0;
            const valor = parseFloat(cb.dataset.valor) || 0;
            
            totalValor += valor;
            selectedItems.push({ id, paciente, tipo, qtd, valor });
        });

        if (totalValor <= 0) {
            showToast('O valor total da cobrança deve ser maior que zero.', 'error');
            return;
        }

        // Generating Pix Payload
        const payload = generatePixPayload(state.pixKey, totalValor, state.pixName, state.pixCity, `PGTO${Date.now()}`);

        // Generating QR Code
        const qrContainer = document.createElement('div');
        const qrcode = new QRCode(qrContainer, {
            text: payload,
            width: 200,
            height: 200,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.M
        });

        // Wait for QRCode to generate the base64 image
        setTimeout(() => {
            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
                const qrBase64 = canvas.toDataURL("image/png");
                gerarPDFCobrancaPix(dentista, selectedItems, totalValor, qrBase64, payload);
            } else {
                showToast('Erro ao gerar QR Code.', 'error');
            }
        }, 300);
    };

    /**
     * GERAÇÃO DA NOTA DE COBRANÇA PERSONALIZADA COM PIX
     * Layout executivo com logo, dados do dentista e do emissor, tabela de trabalhos
     * e box de pagamento PIX com QR Code de alta fidelidade e código Copia e Cola
     */
    const gerarPDFCobrancaPix = (dentista, items, totalValor, qrBase64, pixPayload = null) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        if (!pixPayload && state.pixKey) {
            pixPayload = generatePixPayload(state.pixKey, totalValor, state.pixName, state.pixCity, `PGTO${Date.now()}`);
        }

        // 1. CABEÇALHO INSTITUCIONAL
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, 210, 30, 'F');

        // Barra de realce superior índigo
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 1.8, 'F');

        // Linha inferior de brilho esmeralda
        doc.setFillColor(16, 185, 129); // Emerald 500
        doc.rect(0, 29.4, 210, 0.6, 'F');

        // Logo no canto superior esquerdo
        const logo = getAppLogo();
        let textStartX = 14;
        if (logo) {
            try {
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(14, 5, 20, 20, 2.5, 2.5, 'F');
                doc.addImage(logo, 'PNG', 15, 6, 18, 18);
                textStartX = 38;
            } catch (e) {
                console.warn('Erro ao inserir logo na fatura:', e);
                textStartX = 14;
            }
        }

        // Título e Subtítulo da Fatura
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('DENTALFLOW LAB', textStartX, 12.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(52, 211, 153); // Emerald 400
        doc.text('NOTA DE COBRANÇA & PRESTAÇÃO DE SERVIÇOS', textStartX, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text('Laboratório de Prótese Odontológica de Alta Precisão', textStartX, 23);

        // Cápsula da Fatura (Canto Superior Direito)
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.setDrawColor(71, 85, 105);
        doc.setLineWidth(0.3);
        doc.roundedRect(128, 5.5, 68, 19, 2.5, 2.5, 'FD');

        const invoiceId = `FAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text(invoiceId, 162, 11, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 162, 15.5, { align: 'center' });

        // Badge Aguardando Pagamento
        doc.setFillColor(254, 243, 199); // Amber 100
        doc.setDrawColor(253, 230, 138); // Amber 200
        doc.roundedRect(144, 18, 36, 4.2, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.2);
        doc.setTextColor(180, 83, 9); // Amber 700
        doc.text('AGUARDANDO PAGAMENTO', 162, 21.1, { align: 'center' });

        // 2. PAINEL DE DADOS DO CLIENTE E EMISSOR (Side-by-side cards)
        const infoCardY = 35;
        const infoCardH = 24;
        const infoCardW = 88;

        // Card Cliente (Esquerda)
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.2);
        doc.roundedRect(14, infoCardY, infoCardW, infoCardH, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text('TOMADOR DOS SERVIÇOS (DENTISTA)', 18, infoCardY + 5.5);

        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(dentista.nome || 'Cliente / Dentista', 18, infoCardY + 11.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        doc.text(`Clínica: ${dentista.clinica || 'Consultório Odontológico'}`, 18, infoCardY + 16.5);
        doc.text(`Contato: ${dentista.telefone || dentista.email || 'Cadastrado no sistema'}`, 18, infoCardY + 21);

        // Card Emissor / PIX (Direita)
        const infoCardRightX = 108;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(infoCardRightX, infoCardY, infoCardW, infoCardH, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('DADOS DO PRESTADOR & RECEBIMENTO', infoCardRightX + 4, infoCardY + 5.5);

        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text('DentalFlow Lab Protese', infoCardRightX + 4, infoCardY + 11.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        doc.text(`Titular PIX: ${state.pixName || 'Laboratório de Prótese'}`, infoCardRightX + 4, infoCardY + 16.5);
        doc.text(`Chave: ${state.pixKey || '-'} • Cidade: ${state.pixCity || '-'}`, infoCardRightX + 4, infoCardY + 21);

        // 3. SEÇÃO: DISCRIMINAÇÃO DOS SERVIÇOS
        let currentY = 64;
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(14, currentY - 3.4, 2.8, 4.8, 0.6, 0.6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(30, 41, 59);
        doc.text('DISCRIMINAÇÃO DOS SERVIÇOS & PRÓTESES EXECUTADAS', 19.5, currentY);
        currentY += 4;

        let totalQtdItens = 0;
        const tableColumns = ['Item', 'Paciente', 'Descrição do Trabalho / Especialidade', 'Qtd', 'Valor Unit.', 'Subtotal (R$)'];
        const tableRows = items.map((item, idx) => {
            const qtd = Number(item.qtd) || 1;
            totalQtdItens += qtd;
            const subtotal = Number(item.valor) || 0;
            const unitario = qtd > 0 ? subtotal / qtd : subtotal;

            return [
                `#${String(idx + 1).padStart(2, '0')}`,
                item.paciente || 'Não informado',
                item.tipo,
                `${qtd} un.`,
                formatarMoeda(unitario),
                formatarMoeda(subtotal)
            ];
        });

        // Linha de Total Geral
        tableRows.push([
            'TOTAL GERAL A PAGAR',
            '',
            '',
            `${totalQtdItens} un.`,
            '',
            formatarMoeda(totalValor)
        ]);

        doc.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: currentY,
            margin: { left: 14, right: 14 },
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 3,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3.2
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 14, halign: 'center' },
                1: { cellWidth: 46 },
                2: { cellWidth: 60 },
                3: { cellWidth: 16, halign: 'center' },
                4: { cellWidth: 22, halign: 'right' },
                5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === tableRows.length - 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [241, 245, 249];
                    hookData.cell.styles.textColor = [15, 23, 42];
                    if (hookData.column.index === 5) {
                        hookData.cell.styles.textColor = [21, 128, 61];
                        hookData.cell.styles.fontSize = 9;
                    }
                }
            }
        });

        let finalY = doc.autoTable.previous.finalY + 8;

        // Se o espaço restante na folha for insuficiente para o painel PIX (~68mm), quebra página
        if (finalY > 210) {
            doc.addPage();
            finalY = 20;
        }

        // 4. PAINEL DE PAGAMENTO PIX MODERNO
        const pixBoxW = 182;
        const pixBoxH = 68;
        const pixBoxX = 14;
        const pixBoxY = finalY;

        // Container externo com fundo suave e borda
        doc.setFillColor(250, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(pixBoxX, pixBoxY, pixBoxW, pixBoxH, 3, 3, 'FD');

        // Barra superior escura do painel PIX
        doc.setFillColor(15, 23, 42);
        doc.rect(pixBoxX, pixBoxY, pixBoxW, 7, 'F');
        doc.setFillColor(16, 185, 129); // Accent verde esmeralda no topo
        doc.rect(pixBoxX, pixBoxY, pixBoxW, 0.8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text('PAGAMENTO INSTANTÂNEO VIA PIX • LEITURA DE QR CODE OU CHAVE DIRETA', pixBoxX + 6, pixBoxY + 5);

        // Coluna da Esquerda: QR Code dentro de moldura branca
        const qrCardW = 46;
        const qrCardH = 46;
        const qrCardX = pixBoxX + 6;
        const qrCardY = pixBoxY + 11;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(qrCardX, qrCardY, qrCardW, qrCardH, 2.5, 2.5, 'FD');

        if (qrBase64) {
            doc.addImage(qrBase64, 'PNG', qrCardX + 2.5, qrCardY + 2.5, 41, 41);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(100, 116, 139);
        doc.text('Aponte a câmera do seu banco', qrCardX + qrCardW / 2, qrCardY + qrCardH + 4.5, { align: 'center' });

        // Coluna da Direita: Dados de Cobrança e Chave
        const rightColX = pixBoxX + 58;

        // Label Total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('VALOR TOTAL DA COBRANÇA:', rightColX, pixBoxY + 15);

        // Valor em Destaque
        doc.setFontSize(16);
        doc.setTextColor(21, 128, 61); // Verde Esmeralda
        doc.text(formatarMoeda(totalValor), rightColX, pixBoxY + 22.5);

        // Dados do Favorecido
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Favorecido: ${state.pixName || '-'} • Cidade: ${state.pixCity || '-'}`, rightColX, pixBoxY + 28);

        // Chave PIX Direta em destaque
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(rightColX, pixBoxY + 31.5, 118, 9, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text('CHAVE PIX:', rightColX + 3.5, pixBoxY + 37);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(3, 105, 161); // Azul Sky
        doc.text(state.pixKey || 'Não configurada', rightColX + 22, pixBoxY + 37);

        // Box de Código Copia e Cola (se houver payload)
        if (pixPayload) {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(rightColX, pixBoxY + 43, 118, 14, 1.5, 1.5, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.2);
            doc.setTextColor(100, 116, 139);
            doc.text('CÓDIGO PIX COPIA E COLA (SELECIONE PARA COPIAR):', rightColX + 3.5, pixBoxY + 47);

            doc.setFont('courier', 'normal');
            doc.setFontSize(6.2);
            doc.setTextColor(71, 85, 105);
            
            // Quebra o texto da payload para caber na caixinha
            const splitPayload = doc.splitTextToSize(pixPayload, 112);
            doc.text(splitPayload.slice(0, 2), rightColX + 3.5, pixBoxY + 51.5);
        }

        // Nota de rodapé do painel
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('* O comprovante pode ser enviado ao laboratório para confirmação e baixa automática.', rightColX, pixBoxY + 63);

        // 5. RODAPÉ EXECUTIVO
        applyExecutiveFooters(doc);

        // Salvar documento
        const dentistaSlug = (dentista.nome || 'cliente').replace(/\s+/g, '_').toLowerCase();
        doc.save(`nota_cobranca_pix_${dentistaSlug}.pdf`);
    };

    const generateProducaoDentistaPDF = () => {
        const selectedDentistaId = filterDentistaSelect.value;
        
        if (!selectedDentistaId) {
            showToast(t('toast_select_dentist_pdf'));
            return;
        }
        
        const dentista = (state.dentistas || []).find(d => d.id == selectedDentistaId);
        if (!dentista) {
             showToast(t('toast_dentist_not_found'));
             return;
        }
        
        // Usa o estado atual do mês para determinar o período de fechamento
        // Considerar fechamento personalizado do dentista se existir
        let startDay = dentista.customClosingDayStart || state.closingDayStart || 25;
        let endDay = dentista.customClosingDayEnd || state.closingDayEnd || 24;

        let targetDate = new Date(state.mesAtual);
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

        const producaoFiltrada = (state.producao || []).filter(p => {
             if (p.dentista != selectedDentistaId) return false;
             if (!p.data) return false;
             const dataProducao = new Date(p.data + "T00:00:00");
             return dataProducao >= startDate && dataProducao <= endDate;
        });
        
        if (producaoFiltrada.length === 0) {
            showToast(t('toast_no_production_dentist'));
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let totalValor = 0;
        let totalPecasDentista = 0;
        
        const tableColumns = ["Data", "Paciente", "Tipo de Trabalho", "Obs.", "Status", "Qtd", "Valor (R$)"];
        const tableRows = [];

        producaoFiltrada.forEach(p => {
            const valorDentista = (dentista.valores || []).find(v => v.tipo === p.tipo);
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const valorUnitario = valorFinal ? valorFinal.valor : 0;
            const valorTotal = valorUnitario * p.qtd;
            
            totalValor += valorTotal;
            totalPecasDentista += (Number(p.qtd) || 0);
            const dataStr = p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
            
            const row = [
                dataStr,
                p.nomePaciente || 'Não informado',
                p.tipo,
                p.obs || '-',
                p.status || 'Entregue',
                `${p.qtd}x`,
                formatarMoeda(valorTotal)
            ];
            tableRows.push(row);
        });

        const mesAno = new Date(state.mesAtual).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        // Cabeçalho Institucional
        drawExecutiveHeader(doc, `Extrato de Produção - ${dentista.nome}`, `Demonstrativo do Parceiro: ${dentista.nome}`, startDate, endDate, mesAno);

        // Faixa de Metadados
        doc.setFillColor(220, 252, 231);
        doc.setDrawColor(187, 247, 208);
        doc.setLineWidth(0.2);
        doc.roundedRect(14, 30.5, 23, 4.6, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(21, 128, 61);
        doc.text('EXTRATO', 25.5, 33.8, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const emissaoData = new Date().toLocaleString('pt-BR');
        doc.text(`Dentista: ${dentista.nome} • Clínica: ${dentista.clinica || '-'}`, 40, 34);
        doc.text(`Emissão: ${emissaoData}`, 196, 34, { align: 'right' });

        // Cartões de Resumo
        const cardY = 38;
        const cardH = 21;
        const cardW = 58;
        const cardGap = 4;

        // Card 1: Faturamento do Dentista
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(3, 105, 161);
        doc.text('TOTAL FATURADO', 17.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(12, 74, 110);
        doc.text(formatarMoeda(totalValor), 17.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(2, 132, 199);
        doc.text('Saldo total de serviços no ciclo', 17.5, cardY + 18);

        // Card 2: Peças Solicitadas
        const card2X = 14 + cardW + cardGap;
        doc.setFillColor(245, 243, 255);
        doc.setDrawColor(221, 214, 254);
        doc.roundedRect(card2X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(109, 40, 217);
        doc.text('VOLUME DE PEÇAS', card2X + 3.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(76, 29, 149);
        doc.text(`${totalPecasDentista} Peças`, card2X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(124, 58, 237);
        doc.text(`${producaoFiltrada.length} trabalhos realizados`, card2X + 3.5, cardY + 18);

        // Card 3: Ticket Médio
        const tmDentista = totalPecasDentista > 0 ? totalValor / totalPecasDentista : 0;
        const card3X = card2X + cardW + cardGap;
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(card3X, cardY, cardW, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(21, 128, 61);
        doc.text('VALOR MÉDIO / PEÇA', card3X + 3.5, cardY + 5.2);
        doc.setFontSize(12);
        doc.setTextColor(20, 83, 45);
        doc.text(formatarMoeda(tmDentista), card3X + 3.5, cardY + 12.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.6);
        doc.setTextColor(22, 163, 74);
        doc.text('Média por elemento produzido', card3X + 3.5, cardY + 18);

        let currentY = 66;
        drawSectionTitle(doc, currentY, `1. DETALHAMENTO DE TRABALHOS DE ${dentista.nome.toUpperCase()}`);
        currentY += 4;

        if (tableRows.length > 0) {
            tableRows.push([
                '-',
                'TOTAL CONSOLIDADO',
                '-',
                '-',
                '-',
                `${totalPecasDentista}x`,
                formatarMoeda(totalValor)
            ]);
        }
        
        doc.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: currentY,
            margin: { left: 14, right: 14 },
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 7.8,
                cellPadding: 2.4,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.1,
                overflow: 'ellipsize'
            },
            headStyles: {
                fillColor: [30, 41, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 18, halign: 'center' },
                1: { cellWidth: 38 },
                2: { cellWidth: 38 },
                3: { cellWidth: 32 },
                4: { cellWidth: 18, halign: 'center' },
                5: { cellWidth: 14, halign: 'center' },
                6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.row.index === tableRows.length - 1 && tableRows.length > 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [241, 245, 249];
                    hookData.cell.styles.textColor = [15, 23, 42];
                }
            }
        });

        applyExecutiveFooters(doc);
        doc.save(`producao_${dentista.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    // --- FILTROS AVANÇADOS ---
    const getFilteredProducao = () => {
        let producaoFiltrada = [...(state.producao || [])];
        
        // Filtro por busca
        if (state.searchTermProducao) {
            const searchLower = state.searchTermProducao.trim().toLowerCase();
            producaoFiltrada = producaoFiltrada.filter(p => {
                const dentista = (state.dentistas || []).find(d => String(d.id) === String(p.dentista));
                const dentistaName = dentista ? dentista.nome.toLowerCase() : '';
                const pacienteName = p.nomePaciente ? p.nomePaciente.toLowerCase() : '';
                const obs = p.obs ? p.obs.toLowerCase() : '';
                const tipo = p.tipo ? p.tipo.toLowerCase() : '';
                
                return tipo.includes(searchLower) ||
                       dentistaName.includes(searchLower) ||
                       pacienteName.includes(searchLower) ||
                       obs.includes(searchLower);
            });
        }
        
        // Filtro por dentista no painel geral
        if (filterProducaoDentistaMain && filterProducaoDentistaMain.value) {
            producaoFiltrada = producaoFiltrada.filter(p => String(p.dentista) === String(filterProducaoDentistaMain.value));
        }

        // Filtro por tipo de trabalho
        if (filterProducaoTipo && filterProducaoTipo.value) {
            producaoFiltrada = producaoFiltrada.filter(p => p.tipo === filterProducaoTipo.value);
        }

        // Filtro por status
        if (filterStatusSelect && filterStatusSelect.value) {
            producaoFiltrada = producaoFiltrada.filter(p => p.status === filterStatusSelect.value);
        }
        
        // Filtros Rápidos
        const todayStr = getTodayDateString();
        const quickFilter = state.producaoQuickFilter !== undefined ? state.producaoQuickFilter : 'hoje';

        if (quickFilter === 'atrasados') {
            producaoFiltrada = producaoFiltrada.filter(p => p.status !== 'Finalizado' && p.entrega && p.entrega < todayStr);
        } else if (quickFilter === 'pendentes') {
            producaoFiltrada = producaoFiltrada.filter(p => p.status === 'Pendente');
        } else if (quickFilter === 'andamento') {
            producaoFiltrada = producaoFiltrada.filter(p => p.status === 'Em Andamento');
        } else if (quickFilter === 'finalizados') {
            producaoFiltrada = producaoFiltrada.filter(p => p.status === 'Finalizado');
        } else if (quickFilter === 'hoje') {
            producaoFiltrada = producaoFiltrada.filter(p => p.data === todayStr || p.entrega === todayStr);
        } else if (quickFilter === 'semana') {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const startStr = getTodayDateString(monday);
            const endStr = getTodayDateString(sunday);
            producaoFiltrada = producaoFiltrada.filter(p => {
                const dataInRange = Boolean(p.data && p.data >= startStr && p.data <= endStr);
                const entregaInRange = Boolean(p.entrega && p.entrega >= startStr && p.entrega <= endStr);
                return dataInRange || entregaInRange;
            });
        } else if (quickFilter === 'mes') {
            const today = new Date();
            const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const endOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            producaoFiltrada = producaoFiltrada.filter(p => {
                const dataInRange = Boolean(p.data && p.data >= startOfMonth && p.data <= endOfMonth);
                const entregaInRange = Boolean(p.entrega && p.entrega >= startOfMonth && p.entrega <= endOfMonth);
                return dataInRange || entregaInRange;
            });
        }

        // Filtro por data (início / fim) - se o usuário informou datas manualmente nos inputs
        const dtInicio = filterDataInicio && filterDataInicio.value ? filterDataInicio.value : null;
        const dtFim = filterDataFim && filterDataFim.value ? filterDataFim.value : null;

        if (dtInicio && dtFim) {
            producaoFiltrada = producaoFiltrada.filter(p => {
                const dataInRange = Boolean(p.data && p.data >= dtInicio && p.data <= dtFim);
                const entregaInRange = Boolean(p.entrega && p.entrega >= dtInicio && p.entrega <= dtFim);
                return dataInRange || entregaInRange;
            });
        } else if (dtInicio) {
            producaoFiltrada = producaoFiltrada.filter(p => (p.data && p.data >= dtInicio) || (p.entrega && p.entrega >= dtInicio));
        } else if (dtFim) {
            producaoFiltrada = producaoFiltrada.filter(p => (p.data && p.data <= dtFim) || (p.entrega && p.entrega <= dtFim));
        }
        
        return producaoFiltrada;
    };

    // --- LÓGICA DE NAVEGAÇÃO E MENU ---
    const toggleMenu = () => {
        sideMenu.classList.toggle('-translate-x-full');
        sideMenuOverlay.classList.toggle('hidden');
    };
    
    menuToggleButton.addEventListener('click', toggleMenu);
    sideMenuOverlay.addEventListener('click', toggleMenu);
    menuCloseButton.addEventListener('click', toggleMenu);
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetViewId = link.getAttribute('data-view');
            views.forEach(view => view.classList.add('hidden'));
            const targetEl = document.getElementById(targetViewId);
            if (targetEl) targetEl.classList.remove('hidden');
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            if (targetViewId === 'view-dashboard') {
                renderizarDashboard();
            } else if (targetViewId === 'view-resumo') {
                renderizarResumoMensal();
                updateDailyRevenueChart();
            } else if (targetViewId === 'view-analise-dentista') {
                renderizarAnaliseDentista();
                updateDentistaChart();
            }

            setTimeout(() => {
                if (charts.faturamentoDiario) charts.faturamentoDiario.resize();
                if (charts.dentista) charts.dentista.resize();
                if (charts.tiposTrabalho) charts.tiposTrabalho.resize();
                if (charts.comparativoAnual) charts.comparativoAnual.resize();
            }, 60);

            if (window.innerWidth < 1024) { toggleMenu(); }
        });
    });

    // --- LÓGICA DE AUTENTICAÇÃO ---
    function updateAuthUI() { 
        authTitle.textContent = isLoginMode ? t('auth_title_login') : t('auth_title_register');
        
        const authBtnText = document.getElementById('auth-button-text');
        if (authBtnText) {
            authBtnText.textContent = isLoginMode ? t('auth_button_login') : t('auth_button_register');
        } else {
            authButton.textContent = isLoginMode ? t('auth_button_login') : t('auth_button_register');
        }

        toggleAuthMode.textContent = isLoginMode ? t('auth_toggle_register') : t('auth_toggle_login');

        if (authSubtitle) {
            authSubtitle.textContent = isLoginMode ? t('auth_subtitle_login') : t('auth_subtitle_register');
        }

        if (authTabLogin && authTabRegister) {
            if (isLoginMode) {
                authTabLogin.className = "flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
                authTabRegister.className = "flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer";
            } else {
                authTabRegister.className = "flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer";
                authTabLogin.className = "flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 text-slate-400 hover:text-white cursor-pointer";
            }
        }

        authErrorMessage.classList.add('hidden');
    }
    
    toggleAuthMode.addEventListener('click', () => { isLoginMode = !isLoginMode; updateAuthUI(); });

    if (authTabLogin) {
        authTabLogin.addEventListener('click', () => {
            if (!isLoginMode) {
                isLoginMode = true;
                updateAuthUI();
            }
        });
    }

    if (authTabRegister) {
        authTabRegister.addEventListener('click', () => {
            if (isLoginMode) {
                isLoginMode = false;
                updateAuthUI();
            }
        });
    }

    if (togglePasswordVisibilityBtn && passwordInput) {
        togglePasswordVisibilityBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            if (eyeIconOpen && eyeIconClosed) {
                eyeIconOpen.classList.toggle('hidden', isPassword);
                eyeIconClosed.classList.toggle('hidden', !isPassword);
            }
        });
    }

    // Inicializar "Lembrar meu e-mail" se salvo anteriormente
    if (rememberMeCheckbox && emailInput) {
        const savedEmail = localStorage.getItem('dentalflow_remember_email');
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberMeCheckbox.checked = true;
        }
    }
    
    authForm.addEventListener('submit', async (e) => { 
        e.preventDefault(); 
        const email = emailInput.value.trim(); 
        const password = passwordInput.value; 
        authErrorMessage.classList.add('hidden'); 
        setButtonLoading(authButton, true, isLoginMode ? 'Entrar' : 'Registar');

        // Salvar ou limpar e-mail se "Lembrar meu e-mail" estiver ativo
        if (rememberMeCheckbox && rememberMeCheckbox.checked) {
            localStorage.setItem('dentalflow_remember_email', email);
        } else {
            localStorage.removeItem('dentalflow_remember_email');
        }

        try { 
            if (isLoginMode) { 
                await signInWithEmailAndPassword(auth, email, password); 
            } else { 
                const userCredential = await createUserWithEmailAndPassword(auth, email, password); 
                const newUser = userCredential.user;
                const firstNoteId = Date.now();
                const initialState = { 
                    valores: [], 
                    producao: [], 
                    despesas: [], 
                    dentistas: [], 
                    estoque: [],
                    mesAtual: new Date(),
                    closingDayStart: 25,
                    closingDayEnd: 24,
                    notifications: [],
                    quickNotes: [{ id: firstNoteId, title: 'Geral', content: '' }],
                    activeQuickNoteId: firstNoteId,
                    pixKey: '',
                    pixName: '',
                    pixCity: ''
                };
                const docRef = doc(db, "users", newUser.uid);
                await setDoc(docRef, initialState);
            }
        } catch (error) { 
            let message = "Ocorreu um erro. Tente novamente.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') message = "Palavra-passe ou e-mail incorreto.";
            if (error.code === 'auth/user-not-found') message = "Utilizador não encontrado.";
            if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está a ser utilizado.";
            if (error.code === 'auth/weak-password') message = "A palavra-passe deve ter pelo menos 6 caracteres.";
            authErrorMessage.textContent = message; 
            authErrorMessage.classList.remove('hidden'); 
        } finally {
            setButtonLoading(authButton, false);
        }
    });
    
    logoutButton.addEventListener('click', () => { signOut(auth); });
    
    passwordResetButton.addEventListener('click', async () => { 
        const email = emailInput.value; 
        if (!email) { showToast(t('toast_email_required')); return; }
        try { 
            await sendPasswordResetEmail(auth, email); 
            showToast(t('toast_recovery_email_sent'), "success"); 
        } catch (error) { showToast(t('toast_recovery_email_failed')); }
    });

    // --- LÓGICA DE DADOS (FIRESTORE) ---
    async function saveDataToFirestore(button = null) {
        if (!userId) return;
        if (!db) return; // Safety check for test mode or init failures
        
        // Trava de Segurança: não grava se o estado for inválido ou não carregado adequadamente
        if (!isDataLoaded) return;
        if (!state || !Array.isArray(state.producao) || !Array.isArray(state.despesas)) {
            console.error("Tentativa de salvar estado inválido abortada.", state);
            return;
        }

        if(button) setButtonLoading(button, true);
        try {
            const stateToSave = {
                ...state,
                mesAtual: new Date(state.mesAtual).toISOString()
            };
            const docRef = doc(db, "users", userId);
            await setDoc(docRef, stateToSave, { merge: true });
        } catch (error) {
            console.error("Erro ao salvar dados no Firestore: ", error);
            showToast(t('toast_error_generic'));
        } finally {
            if(button) setButtonLoading(button, false);
        }
    }

   function setupFirestoreListener(uid) {
        if (unsubscribeFromFirestore) unsubscribeFromFirestore();
        const docRef = doc(db, "users", uid);
        unsubscribeFromFirestore = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // --- LÓGICA DAS NOTAS RÁPIDAS (MODIFICADA) ---
                let notesData = data.quickNotes;
                // 1. Migra dados antigos (string) para a nova estrutura (array)
                if (typeof notesData === 'string') {
                    notesData = [{ id: Date.now(), title: 'Geral', content: notesData }];
                }
                // 2. Garante que sempre haja pelo menos uma nota
                if (!notesData || notesData.length === 0) {
                    notesData = [{ id: Date.now(), title: 'Geral', content: '' }];
                }
                // 3. Define o estado
                state.quickNotes = notesData;
                
                // 4. Define a aba ativa
                const activeId = data.activeQuickNoteId || notesData[0].id;
                // Garante que a aba ativa exista, senão, usa a primeira
                state.activeQuickNoteId = notesData.some(n => n.id === activeId) ? activeId : notesData[0].id;
                // --- FIM DA LÓGICA DAS NOTAS ---

                state = {
                    ...state, ...data,
                    quickNotes: notesData, // Sobrescreve com os dados tratados
                    activeQuickNoteId: state.activeQuickNoteId, // Sobrescreve com o ID ativo
                    mesAtual: data.mesAtual ? new Date(data.mesAtual) : new Date(),
                    despesas: (data.despesas || []).map(d => ({...d, categoria: d.categoria || 'Outros'})),
                    dentistas: data.dentistas || [],
                    estoque: data.estoque || [],
                    closingDayStart: data.closingDayStart || 25,
                    closingDayEnd: data.closingDayEnd || 24,
                    notifications: data.notifications || [],
                    producaoQuickFilter: state.producaoQuickFilter || 'hoje'
                };
            } else {
                // Novo usuário ou documento ainda não criado
                const firstNoteId = Date.now();
                state = { 
                    valores: [], 
                    producao: [], 
                    despesas: [], 
                    dentistas: [], 
                    estoque: [],
                    mesAtual: new Date(),
                    closingDayStart: 25,
                    closingDayEnd: 24,
                    notifications: [],
                    quickNotes: [{ id: firstNoteId, title: 'Geral', content: '' }], 
                    activeQuickNoteId: firstNoteId, 
                    pixKey: '',
                    pixName: '',
                    pixCity: ''
                };
                // REMOVIDO: saveDataToFirestore(); para evitar sobrescrita destrutiva de dados.
            }

            if(fechamentoDiaInicioInput && fechamentoDiaFimInput) {
                fechamentoDiaInicioInput.value = state.closingDayStart;
                fechamentoDiaFimInput.value = state.closingDayEnd;
            }
            if(pixKeyInput) pixKeyInput.value = state.pixKey || '';
            if(pixNameInput) pixNameInput.value = state.pixName || '';
            if(pixCityInput) pixCityInput.value = state.pixCity || '';
            renderAllUIComponents(); // Esta função vai chamar a renderQuickNotesUI
            updateNotificationUI();
            updateCharts();
            isDataLoaded = true;
            checkAndCreateRecurringExpenses(); 
        }, (error) => {
            console.error("Erro ao carregar dados do Firestore:", error);
            showToast("Não foi possível carregar os dados.");
        });
    }

    // --- RENDERIZAÇÃO E LÓGICA DA UI ---
    
    const updateMonthDisplay = () => {
        const mesAtualDate = new Date(state.mesAtual);
        const monthYearString = mesAtualDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        if (mesAnoAtualSpan) mesAnoAtualSpan.textContent = monthYearString;
        if (dashboardMesAnoAtualSpan) dashboardMesAnoAtualSpan.textContent = monthYearString;
    };

	    const renderQuickNoteContent = () => {
        if (quickNotesInput) {
            const activeNote = state.quickNotes.find(n => n.id === state.activeQuickNoteId);
            if (activeNote) {
                quickNotesInput.value = activeNote.content || '';
                quickNotesInput.disabled = false;
            } else {
                quickNotesInput.value = 'Nenhuma nota selecionada.';
                quickNotesInput.disabled = true;
            }
        }
    };

    // Renderiza a UI inteira (abas + conteúdo)
    const renderQuickNotesUI = () => {
        if (!quickNotesTabsList) return;

        quickNotesTabsList.innerHTML = ''; // Limpa as abas

        // Garante que uma aba ativa esteja definida
        if (!state.activeQuickNoteId && state.quickNotes.length > 0) {
            state.activeQuickNoteId = state.quickNotes[0].id;
        }

        // Cria os botões das abas
        state.quickNotes.forEach(note => {
            const tabButton = document.createElement('button');
            tabButton.className = 'quick-note-tab';
            if (note.id === state.activeQuickNoteId) {
                tabButton.classList.add('active');
            }
            tabButton.textContent = note.title;
            tabButton.dataset.id = note.id;
            tabButton.title = note.title;
            quickNotesTabsList.appendChild(tabButton);
        });

        // Mostra/Esconde o botão de apagar (só pode apagar se tiver mais de uma)
        deleteQuickNoteTabBtn.style.display = state.quickNotes.length > 1 ? 'block' : 'none';

        // Carrega o conteúdo da aba ativa
        renderQuickNoteContent();
    };

    // Função para selecionar uma aba
    const selectQuickNoteTab = (id) => {
        state.activeQuickNoteId = id;
        saveDataToFirestore(); // Salva qual aba está ativa
        renderQuickNotesUI(); // Redesenha a UI
    };
	
    // --- FUNÇÃO DE CÁLCULO DE FATURAMENTO PARA INDICADORES DE TENDÊNCIA ---
    const calculateFaturamentoForPeriod = (startDate, endDate) => {
        const producaoDoPeriodo = (state.producao || []).filter(p => {
            if (!p.data) return false;
            const dataProducao = new Date(p.data + "T00:00:00");
            return dataProducao >= startDate && dataProducao <= endDate;
        });

        return producaoDoPeriodo.reduce((acc, p) => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const faturamento = valorFinal ? valorFinal.valor * p.qtd : 0;
            return acc + faturamento;
        }, 0);
    };

	    const renderizarDashboard = (animate = true) => {
        updateMonthDisplay();
    
        // Período Atual
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
    
        // Período Anterior
        const previousMonthDate = new Date(state.mesAtual);
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
        const { startDate: prevStartDate, endDate: prevEndDate } = getBillingPeriod(previousMonthDate);
    
        // Calcular Faturamentos
        const faturamentoBruto = calculateFaturamentoForPeriod(startDate, endDate);
        const faturamentoAnterior = calculateFaturamentoForPeriod(prevStartDate, prevEndDate);
    
        // Despesas do Mês Atual
        const despesasDoMes = (state.despesas || []).filter(d => {
            if (!d.data) return false;
            const dataDespesa = new Date(d.data + "T00:00:00");
            return dataDespesa >= startDate && dataDespesa <= endDate;
        });
        const totalDespesas = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);

        // Produção do Mês Atual
        const producaoDoMes = (state.producao || []).filter(p => {
            if (!p.data) return false;
            const dataProducao = new Date(p.data + "T00:00:00");
            return dataProducao >= startDate && dataProducao <= endDate;
        });
    
        // Despesas do Mês Anterior
        const despesasAnterior = (state.despesas || []).filter(d => {
            if (!d.data) return false;
            const dataDespesa = new Date(d.data + "T00:00:00");
            return dataDespesa >= prevStartDate && dataDespesa <= prevEndDate;
        });
        const totalDespesasAnterior = despesasAnterior.reduce((acc, d) => acc + d.valor, 0);

        const lucroLiquido = faturamentoBruto - totalDespesas;
        const lucroAnterior = faturamentoAnterior - totalDespesasAnterior;

        // Atualizar KPIs com animação fluida (count-up) ou direto se animate === false
        const totalPecas = producaoDoMes.reduce((acc, p) => acc + (Number(p.qtd) || 0), 0);
        const animDuration = animate ? 800 : 0;
        animateCountUp(kpiFaturamentoMes, faturamentoBruto, true, animDuration);
        animateCountUp(kpiLucroMes, lucroLiquido, true, animDuration);
        animateCountUp(kpiPecasMes, totalPecas, false, animDuration);
        animateCountUp(kpiDespesasMes, totalDespesas, true, animDuration);
    
        // Renderizar Indicador de Tendência
        const renderTrend = (current, previous, element) => {
            if (!element) return;
            // Limpa o conteúdo anterior
            element.innerHTML = ''; 
        
            if (previous === 0) {
                if (current > 0) {
                    element.innerHTML = `<span class="text-green-400 font-bold">↑ 100%</span> <span class="text-gemini-secondary">vs. mês anterior</span>`;
                } else {
                    element.innerHTML = `<span class="text-gemini-secondary">-</span>`;
                }
                return;
            }
        
            const percentageChange = ((current - previous) / previous) * 100;
            // Evita exibir "-0%" se a mudança for muito pequena
            if (Math.abs(percentageChange) < 0.1) {
                 element.innerHTML = `<span class="text-gemini-secondary">→ 0% vs. mês anterior</span>`;
                 return;
            }
            const absPercentage = Math.abs(percentageChange).toFixed(0);
        
            if (percentageChange > 0) {
                element.innerHTML = `<span class="text-green-400 font-bold">↑ ${absPercentage}%</span> <span class="text-gemini-secondary">vs. mês anterior</span>`;
            } else {
                element.innerHTML = `<span class="text-red-400 font-bold">↓ ${absPercentage}%</span> <span class="text-gemini-secondary">vs. mês anterior</span>`;
            }
        };
        
        renderTrend(faturamentoBruto, faturamentoAnterior, kpiFaturamentoTrend);
        renderTrend(lucroLiquido, lucroAnterior, kpiLucroTrend);

        toggleValuesVisibility();
    
        renderizarEntregasDashboard();
    };

    /**
     * Renderização aprimorada do Cronograma de Entregas & Prazos no Dashboard
     */
    const renderizarEntregasDashboard = () => {
        if (!listaEntregasProximas) return;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const trintaDiasDepois = new Date(hoje);
        trintaDiasDepois.setDate(hoje.getDate() + 30);

        // Todas as ordens pendentes com prazo de entrega válido
        const todasEntregas = (state.producao || []).filter(p => {
            if (p.status === 'Finalizado' || !p.entrega) return false;
            const dataEntrega = new Date(p.entrega + 'T00:00:00');
            return dataEntrega <= trintaDiasDepois;
        }).sort((a, b) => new Date(a.entrega + 'T00:00:00') - new Date(b.entrega + 'T00:00:00'));

        // Métricas e Indicadores Globais
        const totalCount = todasEntregas.length;
        const atrasadasCount = todasEntregas.filter(p => new Date(p.entrega + 'T00:00:00') < hoje).length;
        const hojeCount = todasEntregas.filter(p => new Date(p.entrega + 'T00:00:00').getTime() === hoje.getTime()).length;
        const totalValorPrevisto = todasEntregas.reduce((acc, p) => {
            const unitVal = getItemValorUnitarioGlobal(p.dentista, p.tipo);
            return acc + (unitVal * (Number(p.qtd) || 1));
        }, 0);

        // Atualizar Badges e Cards de Métricas
        const entregasBadgeTotal = document.getElementById('entregas-badge-total');
        const entregasBadgeAtrasadas = document.getElementById('entregas-badge-atrasadas');
        const kpiEntregasTotalCount = document.getElementById('kpi-entregas-total-count');
        const kpiEntregasHojeCount = document.getElementById('kpi-entregas-hoje-count');
        const kpiEntregasAtrasadasCount = document.getElementById('kpi-entregas-atrasadas-count');
        const kpiEntregasValorTotal = document.getElementById('kpi-entregas-valor-total');

        if (entregasBadgeTotal) entregasBadgeTotal.textContent = `${totalCount} ${totalCount === 1 ? 'ordem' : 'ordens'}`;
        if (entregasBadgeAtrasadas) {
            if (atrasadasCount > 0) {
                entregasBadgeAtrasadas.classList.remove('hidden');
                entregasBadgeAtrasadas.textContent = `${atrasadasCount} ${atrasadasCount === 1 ? 'atrasada' : 'atrasadas'}`;
            } else {
                entregasBadgeAtrasadas.classList.add('hidden');
            }
        }
        if (kpiEntregasTotalCount) kpiEntregasTotalCount.textContent = totalCount;
        if (kpiEntregasHojeCount) kpiEntregasHojeCount.textContent = hojeCount;
        if (kpiEntregasAtrasadasCount) kpiEntregasAtrasadasCount.textContent = atrasadasCount;
        if (kpiEntregasValorTotal) kpiEntregasValorTotal.textContent = formatarMoeda(totalValorPrevisto);

        // Modo de Filtro Atual
        const filterMode = state.dashboardEntregasFilter || 'todos';
        let filtradas = todasEntregas;

        if (filterMode === 'atrasados') {
            filtradas = filtradas.filter(p => new Date(p.entrega + 'T00:00:00') < hoje);
        } else if (filterMode === 'hoje') {
            filtradas = filtradas.filter(p => new Date(p.entrega + 'T00:00:00').getTime() === hoje.getTime());
        } else if (filterMode === 'semana') {
            const seteDias = new Date(hoje);
            seteDias.setDate(hoje.getDate() + 7);
            filtradas = filtradas.filter(p => {
                const d = new Date(p.entrega + 'T00:00:00');
                return d >= hoje && d <= seteDias;
            });
        } else if (filterMode === 'mes') {
            filtradas = filtradas.filter(p => {
                const d = new Date(p.entrega + 'T00:00:00');
                return d >= hoje && d <= trintaDiasDepois;
            });
        }

        // Filtro por termo de busca
        const searchQuery = (state.dashboardEntregasSearch || '').trim().toLowerCase();
        const clearBtn = document.getElementById('clear-search-entregas-btn');
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', !searchQuery);
        }

        if (searchQuery) {
            filtradas = filtradas.filter(p => {
                const dentista = (state.dentistas || []).find(d => String(d.id) === String(p.dentista));
                const dNome = dentista ? dentista.nome.toLowerCase() : '';
                const clinica = dentista && dentista.clinica ? dentista.clinica.toLowerCase() : '';
                const paciente = (p.nomePaciente || '').toLowerCase();
                const tipo = (p.tipo || '').toLowerCase();
                const obs = (p.obs || '').toLowerCase();
                return paciente.includes(searchQuery) || dNome.includes(searchQuery) || clinica.includes(searchQuery) || tipo.includes(searchQuery) || obs.includes(searchQuery);
            });
        }

        listaEntregasProximas.innerHTML = '';

        if (filtradas.length === 0) {
            listaEntregasProximas.innerHTML = `
                <div class="py-10 px-4 text-center rounded-2xl bg-slate-950/40 border border-white/5 my-1">
                    <div class="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <p class="font-semibold text-white text-sm">Nenhuma entrega encontrada</p>
                    <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        ${searchQuery ? 'Nenhum resultado corresponde à pesquisa informada.' : 'Não há trabalhos pendentes para este filtro no momento.'}
                    </p>
                    ${(searchQuery || filterMode !== 'todos') ? `
                        <button type="button" id="btn-reset-entregas-filter" class="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs text-cyan-300 font-medium transition-colors cursor-pointer">
                            Limpar Filtros e Ver Todos
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        filtradas.forEach(entrega => {
            const dentista = (state.dentistas || []).find(d => String(d.id) === String(entrega.dentista));
            const dentistaName = dentista ? dentista.nome : 'Dentista não informado';
            const clinicaText = dentista && dentista.clinica ? dentista.clinica : '';
            const dataEntrega = new Date(entrega.entrega + 'T00:00:00');
            const dataEntrada = entrega.data ? new Date(entrega.data + 'T00:00:00') : null;
            const diffTime = dataEntrega.getTime() - hoje.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            let timingLabel = '';
            let timingBadgeClass = '';
            let accentBorderClass = '';
            let statusDotClass = '';
            let isUrgent = false;

            if (diffDays < 0) {
                isUrgent = true;
                const absDays = Math.abs(diffDays);
                timingLabel = absDays === 1 ? 'Atrasado há 1 dia' : `Atrasado há ${absDays} dias`;
                timingBadgeClass = 'text-rose-300 bg-rose-500/20 border border-rose-500/35';
                accentBorderClass = 'border-l-4 border-l-rose-500 hover:border-l-rose-400 bg-rose-500/[0.04]';
                statusDotClass = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]';
            } else if (diffDays === 0) {
                timingLabel = 'Entrega Hoje!';
                timingBadgeClass = 'text-amber-300 bg-amber-500/20 border border-amber-500/35';
                accentBorderClass = 'border-l-4 border-l-amber-400 hover:border-l-amber-300 bg-amber-400/[0.04]';
                statusDotClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] animate-pulse';
            } else if (diffDays === 1) {
                timingLabel = 'Amanhã';
                timingBadgeClass = 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30';
                accentBorderClass = 'border-l-4 border-l-cyan-400 hover:border-l-cyan-300 bg-cyan-400/[0.02]';
                statusDotClass = 'bg-cyan-400';
            } else if (diffDays <= 7) {
                timingLabel = `Em ${diffDays} dias`;
                timingBadgeClass = 'text-sky-300 bg-sky-500/10 border border-sky-500/25';
                accentBorderClass = 'border-l-4 border-l-sky-500 hover:border-l-sky-400 bg-sky-500/[0.02]';
                statusDotClass = 'bg-sky-400';
            } else {
                timingLabel = `Em ${diffDays} dias`;
                timingBadgeClass = 'text-slate-400 bg-white/5 border border-white/10';
                accentBorderClass = 'border-l-4 border-l-slate-700 hover:border-l-slate-600 bg-slate-800/10';
                statusDotClass = 'bg-slate-500';
            }

            const unitVal = getItemValorUnitarioGlobal(entrega.dentista, entrega.tipo);
            const qtdNum = Number(entrega.qtd) || 1;
            const valorTotal = unitVal * qtdNum;
            const valorFormatado = formatarMoeda(valorTotal);
            const tipoTrabalho = entrega.tipo || 'Trabalho padrão';
            const pacienteNome = entrega.nomePaciente || 'Paciente não informado';
            const observacoes = (entrega.obs && entrega.obs.trim() !== '') ? entrega.obs.trim() : null;
            const dataEntregaFormatada = dataEntrega.toLocaleDateString('pt-BR');
            const dataEntradaFormatada = dataEntrada ? dataEntrada.toLocaleDateString('pt-BR') : '-';

            // Botão WhatsApp com mensagem pré-configurada
            let whatsappBtnHtml = '';
            if (dentista && dentista.telefone) {
                let cleanPhone = String(dentista.telefone).replace(/\D/g, '');
                if (cleanPhone.length >= 10) {
                    if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
                        cleanPhone = '55' + cleanPhone;
                    }
                    const msgText = encodeURIComponent(`Olá Dr(a). ${dentistaName}, informamos que o trabalho do paciente *${pacienteNome}* (${tipoTrabalho}) está pronto para entrega.`);
                    whatsappBtnHtml = `
                        <a href="https://wa.me/${cleanPhone}?text=${msgText}" target="_blank" rel="noopener noreferrer" class="whatsapp-btn px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5" onclick="event.stopPropagation()">
                            <svg class="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            <span>Avisar no WhatsApp</span>
                        </a>
                    `;
                }
            }

            const entregaEl = document.createElement('div');
            entregaEl.className = `entrega-item-container group bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-slate-700 rounded-xl transition-all duration-200 overflow-hidden ${accentBorderClass}`;
            entregaEl.dataset.id = String(entrega.id);

            entregaEl.innerHTML = `
                <div class="entrega-item-header p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none">
                    <div class="flex items-start gap-3 min-w-0">
                        <div class="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${statusDotClass}"></div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="font-bold text-white text-sm sm:text-base tracking-tight truncate">${escapeHtml(pacienteNome)}</h4>
                                <span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-cyan-300 border border-cyan-500/20">${escapeHtml(tipoTrabalho)}</span>
                                <span class="text-[11px] font-medium px-1.5 py-0.5 rounded text-slate-400 bg-white/5">${qtdNum} ${qtdNum === 1 ? 'peça' : 'peças'}</span>
                            </div>
                            <div class="flex items-center gap-1.5 text-xs text-slate-400 mt-1 flex-wrap">
                                <span class="text-slate-300 font-medium">${escapeHtml(dentistaName)}</span>
                                ${clinicaText ? `<span class="text-slate-600">·</span><span class="text-slate-400">${escapeHtml(clinicaText)}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        <div class="text-left sm:text-right">
                            <div class="flex items-center sm:justify-end gap-1.5">
                                <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${timingBadgeClass}">${timingLabel}</span>
                            </div>
                            <div class="flex items-center sm:justify-end gap-2 text-xs text-slate-400 mt-1">
                                <span class="font-mono tabular-nums text-slate-300">${dataEntregaFormatada}</span>
                                <span class="text-slate-600">·</span>
                                <span class="font-mono font-medium text-emerald-400 monetary-value">${valorFormatado}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <button type="button" class="finalize-entrega-btn px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer" data-id="${entrega.id}" title="Marcar como Finalizado e Concluído">
                                <svg class="w-3.5 h-3.5 text-emerald-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Finalizar</span>
                            </button>

                            <div class="p-1.5 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                                <svg class="entrega-expand-icon w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Painel de Detalhes Expansível -->
                <div class="entrega-item-details hidden px-4 pb-4 pt-1 border-t border-white/5 bg-slate-950/40">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3 text-xs">
                        <div class="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span class="text-slate-400 block mb-0.5">Entrada no Lab</span>
                            <span class="font-mono font-medium text-slate-200 text-sm">${dataEntradaFormatada}</span>
                        </div>
                        <div class="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span class="text-slate-400 block mb-0.5">Prazo de Entrega</span>
                            <span class="font-mono font-medium ${isUrgent ? 'text-rose-400 font-bold' : 'text-cyan-300'} text-sm">${dataEntregaFormatada}</span>
                        </div>
                        <div class="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span class="text-slate-400 block mb-0.5">Valor do Trabalho</span>
                            <span class="font-mono font-bold text-emerald-400 text-sm monetary-value">${valorFormatado}</span>
                        </div>
                    </div>

                    ${observacoes ? `
                        <div class="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 text-xs text-slate-300 mb-3">
                            <span class="font-semibold text-slate-400 block mb-1">Observações do Trabalho:</span>
                            <p class="break-words leading-relaxed">${escapeHtml(observacoes)}</p>
                        </div>
                    ` : ''}

                    <div class="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5">
                        <div class="flex items-center gap-2">
                            ${whatsappBtnHtml}
                        </div>

                        <div class="flex items-center gap-2">
                            <button type="button" class="view-in-producao-btn px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer" data-paciente="${escapeHtml(pacienteNome)}" data-id="${entrega.id}">
                                <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                    <polyline points="2 17 12 22 22 17"></polyline>
                                    <polyline points="2 12 12 17 22 12"></polyline>
                                </svg>
                                <span>Ver na Produção</span>
                            </button>
                            <button type="button" class="finalize-entrega-btn px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer" data-id="${entrega.id}">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Concluir Entrega</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            listaEntregasProximas.appendChild(entregaEl);
        });
    };
    

    const renderizarProducaoDia = () => {
        let producaoFiltrada = getFilteredProducao();
        
        const isSearchActive = Boolean(state.searchTermProducao && state.searchTermProducao.trim() !== '');
        const isStatusActive = Boolean(filterStatusSelect && filterStatusSelect.value !== '');
        const isDataInicioActive = Boolean(filterDataInicio && filterDataInicio.value !== '');
        const isDataFimActive = Boolean(filterDataFim && filterDataFim.value !== '');
        const isDentistaActive = Boolean(filterProducaoDentistaMain && filterProducaoDentistaMain.value !== '');
        const isTipoActive = Boolean(filterProducaoTipo && filterProducaoTipo.value !== '');
        const isQuickFilterActive = Boolean(state.producaoQuickFilter);
        const isAnyFilterActive = isSearchActive || isStatusActive || isDataInicioActive || isDataFimActive || isDentistaActive || isTipoActive || isQuickFilterActive;

        const titleEl = document.getElementById('producao-list-title') || document.querySelector('.producao-section-title') || document.querySelector('[data-i18n="production_today_title"]');
        if (titleEl && !titleEl.classList.contains('producao-section-title')) {
            titleEl.classList.add('producao-section-title');
        }

        // Atualizar Badge de Filtros Ativos
        const badgeFiltros = document.getElementById('badge-filtros-ativos') || filterResultsBadge;
        let countActive = 0;
        if (isSearchActive) countActive++;
        if (isStatusActive) countActive++;
        if (isDataInicioActive || isDataFimActive) countActive++;
        if (isDentistaActive) countActive++;
        if (isTipoActive) countActive++;
        if (isQuickFilterActive && state.producaoQuickFilter !== 'todos') countActive++;

        if (badgeFiltros) {
            if (countActive > 0) {
                badgeFiltros.textContent = `${countActive} ${countActive === 1 ? 'ativo' : 'ativos'}`;
                badgeFiltros.classList.remove('hidden');
            } else {
                badgeFiltros.classList.add('hidden');
            }
        }

        // Título dinâmico inteligente
        if (titleEl) {
            if (state.producaoQuickFilter === 'todos') {
                titleEl.textContent = 'Todas as Ordens de Produção';
            } else if (state.producaoQuickFilter === 'atrasados') {
                titleEl.textContent = '⚠️ Produções Atrasadas';
            } else if (state.producaoQuickFilter === 'hoje') {
                titleEl.textContent = 'Produção de Hoje';
            } else if (state.producaoQuickFilter === 'semana') {
                titleEl.textContent = 'Produção desta Semana';
            } else if (state.producaoQuickFilter === 'mes') {
                titleEl.textContent = 'Produção do Mês Atual';
            } else if (state.producaoQuickFilter === 'pendentes') {
                titleEl.textContent = 'Ordens Pendentes';
            } else if (state.producaoQuickFilter === 'andamento') {
                titleEl.textContent = 'Ordens Em Andamento';
            } else if (state.producaoQuickFilter === 'finalizados') {
                titleEl.textContent = 'Ordens Finalizadas';
            } else if (isAnyFilterActive) {
                titleEl.textContent = 'Resultados Filtrados';
            } else {
                titleEl.textContent = typeof t === 'function' ? t('production_today_title') : 'Produção do Dia';
            }
        }

        // Sincronizar classes ativas dos botões de atalho rápido
        const currentQuickFilter = state.producaoQuickFilter || 'hoje';
        document.querySelectorAll('.btn-quick-filter').forEach(b => {
            const btnMode = b.dataset.filter || b.dataset.quickFilter;
            if (btnMode === currentQuickFilter) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        
        listaProducaoDia.innerHTML = '';
        let totalPecas = 0;
        let totalFaturamento = 0;
        
        if (producaoFiltrada.length === 0) {
            listaProducaoDia.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma produção encontrada</p>';
        } else {
            // Agrupar produção por dentista, paciente, entrega, status e observação
            const groupedProduction = {};
            producaoFiltrada.forEach(p => {
                const key = `${p.dentista}-${p.nomePaciente}-${p.entrega}-${p.status}-${p.obs || ''}`;
                if (!groupedProduction[key]) {
                    groupedProduction[key] = [];
                }
                groupedProduction[key].push(p);
            });

            Object.values(groupedProduction).forEach(group => {
                const firstItem = group[0];
                const dentista = (state.dentistas || []).find(d => d.id === firstItem.dentista);
                const dentistaName = dentista ? dentista.nome : 'Dentista desconhecido';
                
                // Calcular totais do grupo
                let groupTotalValue = 0;

                // Preparar HTML dos itens
                let itemsHtml = '';

                group.forEach(producao => {
                    const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === producao.tipo) : null;
                    const valorGlobal = (state.valores || []).find(v => v.tipo === producao.tipo);
                    const valorFinal = valorDentista || valorGlobal;
                    const valorTotal = valorFinal ? valorFinal.valor * producao.qtd : 0;

                    groupTotalValue += valorTotal;
                    totalPecas += producao.qtd;
                    totalFaturamento += valorTotal;

                    const anexoHtml = producao.anexoURL ? `
                        <a href="${producao.anexoURL}" target="_blank" class="p-1 rounded hover:bg-blue-700 transition-colors text-blue-400" title="Ver Anexo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        </a>` : '';

                    itemsHtml += `
                        <div class="flex justify-between items-center py-2 border-b border-gemini-border/30 last:border-0 hover:bg-gemini-dark/20 px-2 rounded transition-colors">
                            <div class="flex-1">
                                <div class="flex items-center">
                                    <span class="font-medium text-gemini-primary text-sm">${producao.tipo}</span>
                                    <span class="text-xs text-gemini-secondary ml-2 bg-gemini-dark px-1.5 py-0.5 rounded-full border border-gemini-border/50">${producao.qtd}x</span>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                <span class="text-sm font-semibold text-accent-green monetary-value">${formatarMoeda(valorTotal)}</span>
                                <div class="flex space-x-1 opacity-80 hover:opacity-100">
                                    ${anexoHtml}
                                    <button class="edit-producao-btn p-1.5 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-white" data-id="${producao.id}" title="Editar item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="remove-producao-btn p-1.5 rounded hover:bg-red-900/50 transition-colors text-red-400 hover:text-red-300" data-id="${producao.id}" title="Remover item">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                const statusClass = {
                    'Pendente': 'status-pendente',
                    'Em Andamento': 'status-andamento',
                    'Finalizado': 'status-finalizado'
                }[firstItem.status] || 'status-pendente';

                const groupEl = document.createElement('div');
                groupEl.className = 'card-enhanced p-4 hover-effect border-l-4 ' + (firstItem.status === 'Finalizado' ? 'border-l-accent-green' : (firstItem.status === 'Em Andamento' ? 'border-l-yellow-500' : 'border-l-red-500'));
                
                // Configuração para colapso se houver mais de 1 item
                const isExpandable = group.length > 1;
                const expandId = `items-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                groupEl.innerHTML = `
                    <div class="flex justify-between items-start mb-3 border-b border-gemini-border pb-2 ${isExpandable ? 'cursor-pointer group-header' : ''}" ${isExpandable ? `data-expand="${expandId}"` : ''}>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <h4 class="font-bold text-lg text-gemini-primary tracking-tight">${firstItem.nomePaciente || 'Paciente não informado'}</h4>
                                ${isExpandable ? `
                                    <span class="text-xs bg-gemini-input text-gemini-secondary px-2 py-0.5 rounded-full border border-gemini-border flex items-center gap-1">
                                        ${group.length} itens
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transform transition-transform duration-200 chevron-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </span>
                                ` : ''}
                            </div>
                            <p class="text-sm text-gemini-secondary flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                ${dentistaName}
                            </p>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="status-badge ${statusClass} text-xs uppercase tracking-wider font-bold px-2 py-0.5">${firstItem.status}</span>
                            <span class="text-xs text-gemini-secondary flex items-center gap-1 bg-gemini-dark px-2 py-1 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                ${new Date(firstItem.entrega + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </div>

                    ${firstItem.obs ? `<div class="bg-blue-900/10 border border-blue-900/30 rounded p-2 mb-3 text-xs text-blue-200 flex gap-2 items-start"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 flex-shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span>${firstItem.obs}</span></div>` : ''}

                    <div id="${expandId}" class="space-y-0.5 mb-3 ${isExpandable ? 'hidden' : ''}">
                        <div class="text-xs font-semibold text-gemini-secondary uppercase tracking-wider mb-1 ml-1">Itens do Pedido</div>
                        ${itemsHtml}
                    </div>

                    <div class="flex justify-end items-center pt-2 border-t border-gemini-border gap-2">
                        <span class="text-xs text-gemini-secondary uppercase font-semibold">Total</span>
                        <span class="text-lg font-bold text-accent-green monetary-value">${formatarMoeda(groupTotalValue)}</span>
                    </div>
                `;

                // Adicionar listener para toggle
                if (isExpandable) {
                    const header = groupEl.querySelector('.group-header');
                    header.addEventListener('click', () => {
                        const content = document.getElementById(expandId);
                        const chevron = header.querySelector('.chevron-icon');
                        content.classList.toggle('hidden');
                        chevron.classList.toggle('rotate-180');
                    });
                }

                listaProducaoDia.appendChild(groupEl);
            });
        }
        
        totalPecasDia.textContent = totalPecas;
        totalFaturamentoDia.textContent = formatarMoeda(totalFaturamento);
        toggleValuesVisibility();
    };

    const updateDentistaBatchBar = () => {
        if (!dentistaBatchBar) return;
        const checkedBoxes = producaoDentistaTableBody ? producaoDentistaTableBody.querySelectorAll('.producao-checkbox:checked') : [];
        const count = checkedBoxes.length;

        if (count === 0) {
            dentistaBatchBar.classList.add('hidden');
            if (thSelectAllDentista) thSelectAllDentista.checked = false;
            if (selectAllProducaoCheckbox) selectAllProducaoCheckbox.checked = false;
            return;
        }

        let totalVal = 0;
        checkedBoxes.forEach(cb => {
            totalVal += parseFloat(cb.dataset.valor) || 0;
        });

        dentistaBatchBar.classList.remove('hidden');
        if (batchSelectedCount) {
            batchSelectedCount.textContent = `${count} ${count === 1 ? 'trabalho selecionado' : 'trabalhos selecionados'}`;
        }
        if (batchSelectedTotal) {
            batchSelectedTotal.textContent = formatarMoeda(totalVal);
        }
    };

    const renderDentistaQuickPills = () => {
        if (!dentistaQuickPills) return;
        dentistaQuickPills.innerHTML = '';

        const currentSelectedId = filterDentistaSelect ? filterDentistaSelect.value : '';
        const allDentistas = [...(state.dentistas || [])].sort((a, b) => a.nome.localeCompare(b.nome));

        if (allDentistas.length === 0) {
            dentistaQuickPills.innerHTML = '<span class="text-xs text-gemini-secondary italic py-1">Nenhum dentista cadastrado</span>';
            return;
        }

        allDentistas.forEach(d => {
            const activeWorks = (state.producao || []).filter(p => String(p.dentista) === String(d.id) && p.status !== 'Finalizado').length;
            const isSelected = String(d.id) === String(currentSelectedId);

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 cursor-pointer ${
                isSelected 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/80 scale-105' 
                    : 'bg-gemini-input/80 text-gemini-secondary hover:text-white hover:bg-gemini-input border border-gemini-border/80'
            }`;

            pill.innerHTML = `
                <span>${d.nome}</span>
                ${activeWorks > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'}">${activeWorks}</span>` : ''}
            `;

            pill.addEventListener('click', () => {
                if (filterDentistaSelect) {
                    filterDentistaSelect.value = d.id;
                    renderizarProducaoPorDentista();
                }
            });

            dentistaQuickPills.appendChild(pill);
        });
    };

    const renderizarProducaoPorDentista = () => {
        const selectedDentistaId = filterDentistaSelect ? filterDentistaSelect.value : '';
        producaoDentistaTableBody.innerHTML = '';

        // Atualizar quick pills
        renderDentistaQuickPills();

        if (!selectedDentistaId) {
            // Esconder elementos específicos de dentista selecionado
            if (dentistaKpiBar) dentistaKpiBar.classList.add('hidden');
            if (dentistaBatchBar) dentistaBatchBar.classList.add('hidden');
            if (exportDentistaProducaoPdfBtn) exportDentistaProducaoPdfBtn.classList.add('hidden');
            if (btnGerarPixDentista) btnGerarPixDentista.classList.add('hidden');

            producaoDentistaTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="p-8 text-center text-gemini-secondary">
                        <div class="flex flex-col items-center justify-center py-6">
                            <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <p class="font-bold text-gemini-primary text-base">Selecione um dentista para visualizar a produção</p>
                            <p class="text-sm text-gemini-secondary mt-1 max-w-md">Utilize a barra de atalhos rápidos de dentistas acima ou selecione no menu suspenso.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const dentista = (state.dentistas || []).find(d => String(d.id) === String(selectedDentistaId));
        if (!dentista) {
            producaoDentistaTableBody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-red-400">Dentista não encontrado.</td></tr>';
            return;
        }

        // Exibir elementos
        if (dentistaKpiBar) dentistaKpiBar.classList.remove('hidden');
        if (exportDentistaProducaoPdfBtn) exportDentistaProducaoPdfBtn.classList.remove('hidden');
        if (btnGerarPixDentista) btnGerarPixDentista.classList.remove('hidden');

        // Lógica de período
        const periodoModo = filterDentistaPeriodo ? filterDentistaPeriodo.value : 'ciclo';
        let startDate = null;
        let endDate = null;

        if (periodoModo === 'ciclo') {
            let startDay = dentista?.customClosingDayStart || state.closingDayStart || 25;
            let endDay = dentista?.customClosingDayEnd || state.closingDayEnd || 24;
            let targetDate = new Date(state.mesAtual);
            let year = targetDate.getFullYear();
            let month = targetDate.getMonth();

            if (startDay > endDay) {
                endDate = new Date(year, month, endDay, 23, 59, 59);
                startDate = new Date(year, month - 1, startDay, 0, 0, 0);
            } else {
                startDate = new Date(year, month, startDay, 0, 0, 0);
                endDate = new Date(year, month, endDay, 23, 59, 59);
            }
        } else if (periodoModo === '30dias') {
            const now = new Date();
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            startDate.setHours(0, 0, 0, 0);
        } else if (periodoModo === 'mes') {
            const targetDate = new Date(state.mesAtual);
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
        }
        // Se 'todos', startDate e endDate permanecem null

        const statusFilter = filterDentistaStatus ? filterDentistaStatus.value : '';
        const searchTableText = searchDentistaTable ? searchDentistaTable.value.trim().toLowerCase() : '';

        // Filtrar produção do dentista
        const producaoFiltrada = (state.producao || []).filter(p => {
            if (String(p.dentista) !== String(selectedDentistaId)) return false;
            
            // Período
            if (startDate && endDate) {
                if (!p.data) return false;
                const dataProd = new Date(p.data + 'T00:00:00');
                if (dataProd < startDate || dataProd > endDate) return false;
            }

            // Status
            if (statusFilter && p.status !== statusFilter) return false;

            // Busca na tabela
            if (searchTableText) {
                const paciente = (p.nomePaciente || '').toLowerCase();
                const tipo = (p.tipo || '').toLowerCase();
                const obs = (p.obs || '').toLowerCase();
                if (!paciente.includes(searchTableText) && !tipo.includes(searchTableText) && !obs.includes(searchTableText)) {
                    return false;
                }
            }

            return true;
        });

        // Calcular KPIs do dentista no recorte atual
        let kpiPecas = 0;
        let kpiFaturamento = 0;
        let kpiFinalizados = 0;
        let kpiAndamento = 0;
        let kpiPendentes = 0;

        producaoFiltrada.forEach(p => {
            const valorDentista = (dentista.valores || []).find(v => v.tipo === p.tipo);
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const itemTotal = valorFinal ? valorFinal.valor * (parseInt(p.qtd) || 0) : 0;

            kpiPecas += (parseInt(p.qtd) || 0);
            kpiFaturamento += itemTotal;

            if (p.status === 'Finalizado') kpiFinalizados++;
            else if (p.status === 'Em Andamento') kpiAndamento++;
            else if (p.status === 'Pendente') kpiPendentes++;
        });

        if (dentistaKpiTotalPecas) dentistaKpiTotalPecas.textContent = kpiPecas;
        if (dentistaKpiFaturamento) dentistaKpiFaturamento.textContent = formatarMoeda(kpiFaturamento);
        if (dentistaKpiFinalizados) dentistaKpiFinalizados.textContent = kpiFinalizados;
        if (dentistaKpiAndamento) dentistaKpiAndamento.textContent = kpiAndamento;
        if (dentistaKpiPendentes) dentistaKpiPendentes.textContent = kpiPendentes;

        if (producaoFiltrada.length === 0) {
            producaoDentistaTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="p-8 text-center text-gemini-secondary">
                        <div class="py-4">
                            <p class="font-medium text-gemini-primary">Nenhum registro encontrado para este dentista com os filtros selecionados.</p>
                            <p class="text-xs text-gemini-secondary mt-1">Tente alterar o período (ex: Todos os Períodos) ou o filtro de status.</p>
                        </div>
                    </td>
                </tr>
            `;
            if (dentistaBatchBar) dentistaBatchBar.classList.add('hidden');
            return;
        }

        // Ordenar por data decrescente
        producaoFiltrada.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

        const hojeStr = new Date().toISOString().split('T')[0];

        producaoFiltrada.forEach(producao => {
            const valorDentista = (dentista.valores || []).find(v => v.tipo === producao.tipo);
            const valorGlobal = (state.valores || []).find(v => v.tipo === producao.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const unitVal = valorFinal ? valorFinal.valor : 0;
            const valorTotal = unitVal * (parseInt(producao.qtd) || 0);

            const isAtrasado = producao.status !== 'Finalizado' && producao.entrega && producao.entrega < hojeStr;

            const statusClass = {
                'Pendente': 'bg-red-500/15 text-red-300 border border-red-500/30',
                'Em Andamento': 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
                'Finalizado': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }[producao.status] || 'bg-gray-500/15 text-gray-300 border border-gray-500/30';

            const dataEntradaFmt = producao.data ? new Date(producao.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
            const dataEntregaFmt = producao.entrega ? new Date(producao.entrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

            const anexoHtml = producao.anexoURL ? `
                <a href="${producao.anexoURL}" target="_blank" class="p-1.5 rounded-lg hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-200 transition-colors inline-flex items-center" title="Ver Arquivo Anexo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </a>
            ` : '';

            const row = document.createElement('tr');
            row.className = 'border-b border-gemini-border/40 hover:bg-gemini-input/30 transition-colors group';
            
            row.innerHTML = `
                <td class="p-3 text-center">
                    <input type="checkbox" class="producao-checkbox h-4 w-4 rounded border-gemini-border text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-gemini-input" 
                        data-id="${producao.id}" 
                        data-paciente="${producao.nomePaciente || ''}" 
                        data-tipo="${producao.tipo}" 
                        data-qtd="${producao.qtd}"
                        data-valor="${valorTotal}">
                </td>
                <td class="p-3">
                    <div class="text-xs space-y-0.5">
                        <div class="text-gemini-secondary">Entrada: <span class="text-gemini-primary font-medium">${dataEntradaFmt}</span></div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-gemini-secondary">Entrega:</span>
                            <span class="font-medium ${isAtrasado ? 'text-red-400 font-bold' : 'text-gemini-primary'}">${dataEntregaFmt}</span>
                            ${isAtrasado ? '<span class="px-1.5 py-0.2 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">ATRASADO</span>' : ''}
                        </div>
                    </div>
                </td>
                <td class="p-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-gemini-input flex items-center justify-center text-xs font-bold text-gemini-secondary border border-gemini-border">
                            ${(producao.nomePaciente || 'P')[0].toUpperCase()}
                        </div>
                        <span class="text-gemini-primary font-semibold text-sm">${producao.nomePaciente || 'Não informado'}</span>
                    </div>
                </td>
                <td class="p-3">
                    <div class="flex items-center gap-1.5">
                        <span class="text-gemini-primary font-medium text-sm">${producao.tipo}</span>
                        <span class="px-1.5 py-0.5 rounded-full text-xs font-bold bg-gemini-input text-indigo-300 border border-indigo-500/30">x${producao.qtd}</span>
                    </div>
                </td>
                <td class="p-3">
                    ${producao.obs ? `<span class="inline-block max-w-[180px] truncate text-xs text-gemini-secondary bg-gemini-input/60 px-2 py-1 rounded border border-gemini-border/40" title="${producao.obs}">${producao.obs}</span>` : '<span class="text-gemini-secondary text-xs">-</span>'}
                </td>
                <td class="p-3">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                        ${producao.status}
                    </span>
                </td>
                <td class="p-3 text-right">
                    <div class="text-accent-green font-bold text-sm monetary-value">${formatarMoeda(valorTotal)}</div>
                    ${producao.qtd > 1 ? `<div class="text-[11px] text-gemini-secondary">${formatarMoeda(unitVal)}/un</div>` : ''}
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                        ${anexoHtml}
                        <button class="edit-producao-btn p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white" data-id="${producao.id}" title="Editar trabalho">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="remove-producao-btn p-1.5 rounded-lg hover:bg-red-700/30 transition-colors text-red-400 hover:text-red-300" data-id="${producao.id}" title="Excluir trabalho">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            producaoDentistaTableBody.appendChild(row);
        });

        // Adicionar listener aos checkboxes para atualizar batch bar
        const checkboxes = producaoDentistaTableBody.querySelectorAll('.producao-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateDentistaBatchBar);
        });

        updateDentistaBatchBar();
        toggleValuesVisibility();
    };

    const renderizarListaDentistas = () => {
        const dentistasFiltrados = (state.dentistas || []).filter(d => 
            !state.searchTermDentistas || 
            d.nome.toLowerCase().includes(state.searchTermDentistas.toLowerCase()) ||
            (d.clinica && d.clinica.toLowerCase().includes(state.searchTermDentistas.toLowerCase()))
        );
        
        listaDentistas.innerHTML = '';
        
        if (dentistasFiltrados.length === 0) {
            listaDentistas.innerHTML = '<p class="text-center text-gemini-secondary">Nenhum dentista encontrado</p>';
            return;
        }
        
        dentistasFiltrados.forEach(dentista => {
            const dentistaEl = document.createElement('div');
            dentistaEl.className = 'card-enhanced p-4 hover-effect';
            dentistaEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gemini-primary">${dentista.nome}</h4>
                        ${dentista.clinica ? `<p class="text-sm text-gemini-secondary">${dentista.clinica}</p>` : ''}
                        <div class="flex flex-col space-y-1 mt-2">
                            ${dentista.telefone ? `<span class="text-xs text-gemini-secondary">📞 ${dentista.telefone}</span>` : ''}
                            ${dentista.email ? `<span class="text-xs text-gemini-secondary">✉️ ${dentista.email}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-1">
                        <button class="edit-dentista-btn p-2 rounded hover:bg-gray-700 transition-colors" data-id="${dentista.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="remove-dentista-btn p-2 rounded hover:bg-red-700 transition-colors text-red-400" data-id="${dentista.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            listaDentistas.appendChild(dentistaEl);
        });
    };

    const showWorkTypeDetails = (tipo, producaoDoMes) => {
        // Filter by type
        const filtered = producaoDoMes.filter(p => p.tipo === tipo);
        
        // Sort by date desc
        filtered.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        workTypeDetailsTitle.textContent = `${t('summary_chart_types')}: ${tipo}`;
        workTypeDetailsList.innerHTML = '';
        
        if (filtered.length === 0) {
            workTypeDetailsList.innerHTML = '<p class="text-center text-gemini-secondary">Nenhum registro encontrado.</p>';
        } else {
            filtered.forEach(p => {
                const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
                const dentistaName = dentista ? dentista.nome : 'Desconhecido';
                const dataFormatada = new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR');
                
                // Calculate value if needed, or just show basic info
                const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
                const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
                const valorFinal = valorDentista || valorGlobal;
                const valorTotal = valorFinal ? valorFinal.valor * p.qtd : 0;

                const itemEl = document.createElement('div');
                itemEl.className = 'modal-subpanel p-3.5 border border-white/10 hover:border-white/20 transition-all rounded-xl';
                
                itemEl.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-white">${p.nomePaciente || 'Paciente não informado'}</p>
                            <p class="text-xs text-sky-400 font-medium mt-0.5">${dentistaName}</p>
                            <p class="text-xs text-slate-400 mt-1">Data: ${dataFormatada}</p>
                        </div>
                        <div class="text-right">
                             <div class="font-bold text-purple-400 text-sm">${p.qtd} un.</div>
                             <div class="text-sm font-semibold text-emerald-400 monetary-value">${formatarMoeda(valorTotal)}</div>
                             <div class="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 inline-block mt-1">${p.status}</div>
                        </div>
                    </div>
                    ${p.obs ? `<div class="mt-2 text-xs text-slate-400 border-t border-white/10 pt-1.5 italic">Obs: ${p.obs}</div>` : ''}
                `;
                workTypeDetailsList.appendChild(itemEl);
            });
        }
        
        // Ensure values visibility is correct
        toggleValuesVisibility();
        
        workTypeDetailsModal.classList.remove('hidden');
    };

    const renderizarResumoMensal = () => {
        updateMonthDisplay();
    
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
    
        const producaoDoMes = (state.producao || []).filter(p => {
            const data = new Date(p.data + "T00:00:00");
            return data >= startDate && data <= endDate;
        });
    
        const despesasDoMes = (state.despesas || []).filter(d => {
            const data = new Date(d.data + "T00:00:00");
            return data >= startDate && data <= endDate;
        });
        
        const totalPecasValue = producaoDoMes.reduce((acc, p) => acc + p.qtd, 0);
        const faturamentoBruto = producaoDoMes.reduce((acc, p) => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === p.tipo) : null;
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const faturamento = valorFinal ? valorFinal.valor * p.qtd : 0;
            return acc + faturamento;
        }, 0);
        const totalDespesasValue = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);
        const lucroLiquido = faturamentoBruto - totalDespesasValue;
        
        animateCountUp(totalPecasMes, totalPecasValue, false, 800);
        animateCountUp(totalFaturamentoMes, faturamentoBruto, true, 800);
        animateCountUp(totalDespesasMes, totalDespesasValue, true, 800);
        animateCountUp(lucroLiquidoMes, lucroLiquido, true, 800);
        
        // Atualizar barras de progresso
        const maxValue = Math.max(faturamentoBruto, totalDespesasValue);
        if (maxValue > 0) {
            const faturamentoPercent = (faturamentoBruto / maxValue) * 100;
            const despesasPercent = (totalDespesasValue / maxValue) * 100;
            
            faturamentoBar.style.width = `${faturamentoPercent}%`;
            despesasBar.style.width = `${despesasPercent}%`;
        } else {
            faturamentoBar.style.width = '0%';
            despesasBar.style.width = '0%';
        }
        
        faturamentoBarLabel.textContent = formatarMoeda(faturamentoBruto);
        despesasBarLabel.textContent = formatarMoeda(totalDespesasValue);
        
        // Atualizar badge de margem de lucro
        const margemLucroBadge = document.getElementById('margem-lucro-badge');
        if (margemLucroBadge) {
            if (faturamentoBruto > 0) {
                const margemPercent = ((lucroLiquido / faturamentoBruto) * 100).toFixed(1);
                const isPos = lucroLiquido >= 0;
                margemLucroBadge.textContent = `Margem: ${margemPercent}%`;
                margemLucroBadge.className = isPos
                    ? 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                    : 'px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-400/30';
            } else {
                margemLucroBadge.textContent = 'Margem: 0%';
                margemLucroBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-400/30';
            }
        }

        // Renderizar despesas
        despesasContainer.innerHTML = '';
        if (despesasDoMes.length === 0) {
            despesasContainer.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma despesa no mês</p>';
        } else {
            despesasDoMes.slice(0, 5).forEach(despesa => {
                const despesaEl = document.createElement('div');
                despesaEl.className = 'flex justify-between items-center p-2 rounded hover:bg-gray-700 transition-colors';
                despesaEl.innerHTML = `
                    <div>
                        <p class="text-sm font-medium">${despesa.desc}</p>
                        <p class="text-xs text-gemini-secondary">${despesa.categoria}</p>
                    </div>
                    <span class="text-sm font-semibold text-red-400 monetary-value">${formatarMoeda(despesa.valor)}</span>
                `;
                despesasContainer.appendChild(despesaEl);
            });
        }
        
        // Renderizar quantidade por tipo de trabalho e atualizar gráfico de Donut
        const tiposTrabalhoColors = [
            '#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', 
            '#a78bfa', '#fb7185', '#2dd4bf', '#60a5fa', '#f97316', '#4ade80', '#c084fc'
        ];

        const resumoTipos = {};
        producaoDoMes.forEach(p => {
            const qtd = Number(p.qtd) || 0;
            resumoTipos[p.tipo] = (resumoTipos[p.tipo] || 0) + qtd;
        });
        
        const resumoTiposArray = Object.entries(resumoTipos)
            .map(([tipo, qtd]) => ({ tipo, qtd }))
            .sort((a, b) => b.qtd - a.qtd);

        // Atualizar Donut Chart
        if (charts.tiposTrabalho) {
            charts.tiposTrabalho.data.labels = resumoTiposArray.map(item => item.tipo);
            charts.tiposTrabalho.data.datasets[0].data = resumoTiposArray.map(item => item.qtd);
            charts.tiposTrabalho.data.datasets[0].backgroundColor = resumoTiposArray.map((_, i) => tiposTrabalhoColors[i % tiposTrabalhoColors.length]);
            charts.tiposTrabalho.update();
        }

        const donutTotalNumber = document.getElementById('donut-total-number');
        if (donutTotalNumber) {
            donutTotalNumber.textContent = totalPecasValue;
        }

        const tiposTotalBadge = document.getElementById('resumo-tipos-total-badge');
        if (tiposTotalBadge) {
            tiposTotalBadge.textContent = `${resumoTiposArray.length} Tipo${resumoTiposArray.length !== 1 ? 's' : ''}`;
        }
            
        if (resumoTiposContainer) {
            resumoTiposContainer.innerHTML = '';
            if (resumoTiposArray.length === 0) {
                 resumoTiposContainer.innerHTML = '<p class="text-center text-slate-400 col-span-full py-4">Nenhuma produção registrada neste período</p>';
            } else {
                resumoTiposArray.forEach((item, index) => {
                    const color = tiposTrabalhoColors[index % tiposTrabalhoColors.length];
                    const pct = totalPecasValue > 0 ? ((item.qtd / totalPecasValue) * 100).toFixed(0) : 0;
                    
                    const el = document.createElement('div');
                    el.className = 'group flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10 hover:border-white/25 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm';
                    
                    el.innerHTML = `
                        <div class="flex items-center gap-2.5 min-w-0 pr-2">
                            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color}; box-shadow: 0 0 8px ${color}88;"></span>
                            <span class="font-medium text-white text-sm truncate group-hover:text-sky-300 transition-colors" title="${item.tipo}">${item.tipo}</span>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span class="text-xs text-slate-400 font-medium">${pct}%</span>
                            <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold text-white bg-white/10 border border-white/10 group-hover:border-white/20 transition-all">${item.qtd} un.</span>
                        </div>
                    `;
                    
                    el.addEventListener('click', () => {
                         showWorkTypeDetails(item.tipo, producaoDoMes);
                    });

                    resumoTiposContainer.appendChild(el);
                });
            }
        }
        
        // Atualizar o gráfico de faturamento diário que faz parte da visão de Resumo
        updateDailyRevenueChart();
        updateComparativoAnualChart();
        
        toggleValuesVisibility();
    };

    const renderizarAnaliseDentista = () => {
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
    
        const producaoDoMes = (state.producao || []).filter(p => {
            const data = new Date(p.data + "T00:00:00");
            return data >= startDate && data <= endDate;
        });
        
        const analise = {};
        
        producaoDoMes.forEach(p => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            if (!dentista) return; // Pular se o dentista não for encontrado

            if (!analise[dentista.nome]) {
                analise[dentista.nome] = { id: dentista.id, pecas: 0, faturamento: 0 };
            }

            const valorDentista = (dentista.valores || []).find(v => v.tipo === p.tipo);
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const faturamento = valorFinal ? valorFinal.valor * p.qtd : 0;
            
            analise[dentista.nome].pecas += p.qtd;
            analise[dentista.nome].faturamento += faturamento;
        });
        
        // Renderizar tabela
        dentistaSummaryTableBody.innerHTML = '';
        
        Object.entries(analise).forEach(([nome, dados]) => {
            const ticketMedio = dados.pecas > 0 ? dados.faturamento / dados.pecas : 0;
            
            const row = document.createElement('tr');
            // [NOVO] Adicionando classe e data attribute para a funcionalidade de clique
            row.className = 'border-b border-gemini-border hover:bg-gray-700/50 transition-colors cursor-pointer dentist-summary-row';
            row.dataset.dentistId = dados.id;

            row.innerHTML = `
                <td class="py-3 text-gemini-primary">${nome}</td>
                <td class="py-3 text-gemini-secondary">${dados.pecas}</td>
                <td class="py-3 text-accent-green font-semibold monetary-value">${formatarMoeda(dados.faturamento)}</td>
                <td class="py-3 text-gemini-secondary monetary-value">${formatarMoeda(ticketMedio)}</td>
            `;
            dentistaSummaryTableBody.appendChild(row);
        });
        
        if (Object.keys(analise).length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="py-6 text-center text-gemini-secondary">Nenhum dado encontrado para o mês atual</td>';
            dentistaSummaryTableBody.appendChild(row);
        }
        toggleValuesVisibility();
    };

    const renderizarListaValores = () => {
        listaValores.innerHTML = '';
        (state.valores || []).forEach((valor, index) => {
            const valorEl = document.createElement('div');
            valorEl.className = 'flex justify-between items-center p-2 rounded hover:bg-gray-700 transition-colors';
            valorEl.innerHTML = `
                <div>
                    <span class="font-medium">${valor.tipo}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-accent-green font-semibold monetary-value">${formatarMoeda(valor.valor)}</span>
                    <button class="edit-valor-btn p-1 rounded hover:bg-gray-700 transition-colors text-gray-400" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="remove-valor-btn p-1 rounded hover:bg-red-700 transition-colors text-red-400" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            listaValores.appendChild(valorEl);
        });
        toggleValuesVisibility();
    };

    const renderizarSelects = () => {
        // Salvar valores atuais para preservar a seleção
        const currentFilterDentista = filterDentistaSelect ? filterDentistaSelect.value : '';
        const currentProducaoDentista = producaoDentistaSelect ? producaoDentistaSelect.value : '';
        const currentMainDentista = filterProducaoDentistaMain ? filterProducaoDentistaMain.value : '';
        const currentTipo = filterProducaoTipo ? filterProducaoTipo.value : '';

        // Limpar e re-popular os selects
        if (filterDentistaSelect) {
            filterDentistaSelect.innerHTML = '<option value="" data-i18n="placeholder_select_dentist">Selecione um dentista para ver a produção</option>';
        }
        if (producaoDentistaSelect) {
            producaoDentistaSelect.innerHTML = '<option value="">Selecione um dentista...</option>';
        }
        if (filterProducaoDentistaMain) {
            filterProducaoDentistaMain.innerHTML = '<option value="" data-i18n="filter_all_dentists">Todos os Dentistas</option>';
        }
        if (filterProducaoTipo) {
            filterProducaoTipo.innerHTML = '<option value="" data-i18n="filter_all_types">Todos os Tipos de Trabalho</option>';
        }
        
        // Atualizar opções nos selects de itens da produção (Main e Quick)
        const itemSelects = document.querySelectorAll('.main-producao-tipo-select, .quick-producao-tipo-select');
        itemSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="" data-i18n="placeholder_select_work_type">Selecione o tipo de trabalho</option>';
            (state.valores || []).forEach(valor => {
                const option = document.createElement('option');
                option.value = valor.tipo;
                option.textContent = valor.tipo;
                select.appendChild(option);
            });
            select.value = currentValue;
        });

        // Popular filtro por tipos de trabalho
        if (filterProducaoTipo) {
            (state.valores || []).forEach(valor => {
                const option = document.createElement('option');
                option.value = valor.tipo;
                option.textContent = valor.tipo;
                filterProducaoTipo.appendChild(option);
            });
            if (currentTipo) filterProducaoTipo.value = currentTipo;
        }

        // Popular selects de dentistas e datalist
        const dentistasList = document.getElementById('dentistas-list');
        if (dentistasList) dentistasList.innerHTML = '';

        const dentistasOrdenados = [...(state.dentistas || [])].sort((a, b) => a.nome.localeCompare(b.nome));
        
        dentistasOrdenados.forEach(dentista => {
            // Select de Produção por Dentista (usa ID)
            if (filterDentistaSelect) {
                const optionSelect = document.createElement('option');
                optionSelect.value = dentista.id;
                optionSelect.textContent = dentista.nome + (dentista.clinica ? ` (${dentista.clinica})` : '');
                filterDentistaSelect.appendChild(optionSelect);
            }

            // Select do Formulário de Adicionar Produção (usa ID)
            if (producaoDentistaSelect) {
                const optionProd = document.createElement('option');
                optionProd.value = dentista.id;
                optionProd.textContent = dentista.nome + (dentista.clinica ? ` • ${dentista.clinica}` : '');
                producaoDentistaSelect.appendChild(optionProd);
            }

            // Select de Filtros Gerais (usa ID)
            if (filterProducaoDentistaMain) {
                const optionMain = document.createElement('option');
                optionMain.value = dentista.id;
                optionMain.textContent = dentista.nome;
                filterProducaoDentistaMain.appendChild(optionMain);
            }

            // Datalist de busca rápida por nome
            if (dentistasList) {
                const optionDatalist = document.createElement('option');
                optionDatalist.value = dentista.nome;
                dentistasList.appendChild(optionDatalist);
            }
        });

        // Restaurar seleções
        if (filterDentistaSelect && currentFilterDentista) filterDentistaSelect.value = currentFilterDentista;
        if (producaoDentistaSelect && currentProducaoDentista) producaoDentistaSelect.value = currentProducaoDentista;
        if (filterProducaoDentistaMain && currentMainDentista) filterProducaoDentistaMain.value = currentMainDentista;

        // Popular datalist de pacientes
        const pacientesList = document.getElementById('pacientes-list');
        if (pacientesList) {
            pacientesList.innerHTML = '';
            const uniquePatients = [...new Set((state.producao || []).map(p => p.nomePaciente).filter(p => p && p.trim() !== ''))].sort((a, b) => a.localeCompare(b));
            
            uniquePatients.forEach(nome => {
                const option = document.createElement('option');
                option.value = nome;
                pacientesList.appendChild(option);
            });
        }

        updateOrderPreview();
    };

    const renderizarListaDespesasDetalhada = () => {
        if (!listaDespesasDetalhada) return;
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        
        const despesasDoMes = (state.despesas || []).filter(d => {
            const data = new Date(d.data + "T00:00:00");
            return data >= startDate && data <= endDate;
        });
        
        listaDespesasDetalhada.innerHTML = '';
        
        if (despesasDoMes.length === 0) {
            listaDespesasDetalhada.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma despesa encontrada</p>';
            return;
        }
        
        despesasDoMes.forEach(despesa => {
            const despesaEl = document.createElement('div');
            despesaEl.className = 'card-enhanced p-4 hover-effect';
            despesaEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gemini-primary">${despesa.desc}</h4>
                        <p class="text-sm text-gemini-secondary">${despesa.categoria}</p>
                        <p class="text-xs text-gemini-secondary mt-1">${new Date(despesa.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-lg font-semibold text-red-400 monetary-value">${formatarMoeda(despesa.valor)}</span>
                        <div class="flex space-x-1">
                            <button class="edit-despesa-btn p-1 rounded hover:bg-gray-700 transition-colors" data-id="${despesa.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="remove-despesa-btn p-1 rounded hover:bg-red-700 transition-colors text-red-400" data-id="${despesa.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            listaDespesasDetalhada.appendChild(despesaEl);
        });
        toggleValuesVisibility();
    };

    const renderizarListaDespesasCompleta = () => {
        if (!listaDespesasCompleta) return;

        let despesasFiltradas = [...(state.despesas || [])];

        if (state.searchTermDespesas) {
            despesasFiltradas = despesasFiltradas.filter(d =>
                d.desc.toLowerCase().includes(state.searchTermDespesas.toLowerCase()) ||
                d.categoria.toLowerCase().includes(state.searchTermDespesas.toLowerCase())
            );
        }

        // Ordenar por data (mais recente primeiro)
        despesasFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));

        listaDespesasCompleta.innerHTML = '';

        if (despesasFiltradas.length === 0) {
            listaDespesasCompleta.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma despesa encontrada</p>';
            return;
        }

        despesasFiltradas.forEach(despesa => {
            const despesaEl = document.createElement('div');
            despesaEl.className = 'card-enhanced p-4 hover-effect';
            despesaEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gemini-primary">${despesa.desc}</h4>
                        <div class="flex space-x-2 mt-1">
                            <span class="text-xs px-2 py-1 rounded bg-gray-700 text-gemini-secondary">${despesa.categoria}</span>
                            ${despesa.recorrente ? '<span class="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">Recorrente</span>' : ''}
                        </div>
                        <p class="text-xs text-gemini-secondary mt-2">Data: ${new Date(despesa.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="flex flex-col items-end space-y-2">
                        <span class="text-lg font-semibold text-red-400 monetary-value">${formatarMoeda(despesa.valor)}</span>
                        <div class="flex space-x-1">
                            <button class="edit-despesa-btn p-2 rounded hover:bg-gray-700 transition-colors" data-id="${despesa.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="remove-despesa-btn p-2 rounded hover:bg-red-700 transition-colors text-red-400" data-id="${despesa.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            listaDespesasCompleta.appendChild(despesaEl);
        });
        toggleValuesVisibility();
    };

    const renderizarEstoque = () => {
        const estoqueFiltrado = (state.estoque || []).filter(item => 
            !state.searchTermEstoque || 
            item.nome.toLowerCase().includes(state.searchTermEstoque.toLowerCase())
        );
        
        listaEstoque.innerHTML = '';
        
        if (estoqueFiltrado.length === 0) {
            listaEstoque.innerHTML = '<p class="text-center text-gemini-secondary">Nenhum material encontrado</p>';
            return;
        }
        
        estoqueFiltrado.forEach(item => {
            const isLowStock = item.qtd <= item.min;
            const itemEl = document.createElement('div');
            itemEl.className = `card-enhanced p-4 hover-effect ${isLowStock ? 'border-red-500/50' : ''}`;
            itemEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            ${isLowStock ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>` : ''}
                            <h4 class="font-semibold text-gemini-primary">${item.nome}</h4>
                        </div>
                        <p class="text-sm text-gemini-secondary">${item.fornecedor || 'Sem fornecedor'}</p>
                        <div class="flex items-center space-x-4 mt-2">
                            <span class="text-sm">Qtd: <span class="font-semibold ${isLowStock ? 'text-red-400' : ''}">${item.qtd} ${item.unidade}</span></span>
                            <span class="text-sm">Preço: <span class="font-semibold text-accent-green monetary-value">${formatarMoeda(item.preco)}</span></span>
                        </div>
                    </div>
                    <div class="flex space-x-1">
                        <button class="edit-estoque-btn p-2 rounded hover:bg-gray-700 transition-colors" data-id="${item.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="remove-estoque-btn p-2 rounded hover:bg-red-700 transition-colors text-red-400" data-id="${item.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            listaEstoque.appendChild(itemEl);
        });
        toggleValuesVisibility();
    };

	    const renderAllUIComponents = (animateDashboard = true) => {
            renderizarSelects();
            renderDentistaQuickPills();
	        renderizarDashboard(animateDashboard);
	        renderizarProducaoDia();
	        renderQuickNotesUI();
	        renderizarProducaoPorDentista();
            renderizarListaDentistas();
            renderizarResumoMensal();
            renderizarAnaliseDentista();
            renderizarListaValores();
            renderizarEstoque();
            renderizarListaDespesasCompleta();
            toggleValuesVisibility();
            updateOrderPreview();
            
            // Atualizar idioma após renderização
            const currentLang = localStorage.getItem('dentalflow_lang') || 'pt';
            updateLanguage(currentLang);
        };

    // --- FUNÇÕES DE EDIÇÃO ---
    const startEditProducao = (id) => {
        const producao = (state.producao || []).find(p => p.id === id);
        if (!producao) return;
        
        const dentista = (state.dentistas || []).find(d => d.id === producao.dentista);

        producaoEditIdInput.value = producao.id;

        // Configurar linha única para edição
        producaoItemsContainer.innerHTML = '';
        producaoItemsContainer.appendChild(createMainFormItemRow(producao.tipo, producao.qtd));
        updateMainRemoveButtonsVisibility();

        // Esconder botão de adicionar item no modo de edição
        formProducaoAddItemBtn.classList.add('hidden');

        if (producaoDentistaSelect) {
            producaoDentistaSelect.value = producao.dentista || (dentista ? dentista.id : '');
        }
        producaoDentistaInput.value = dentista ? dentista.nome : '';
        producaoPacienteInput.value = producao.nomePaciente || '';
        producaoStatusSelect.value = producao.status;
        producaoObsInput.value = producao.obs || '';
        producaoDataInput.value = producao.data;
        entregaDataInput.value = producao.entrega;
        if (producaoAnexoInput) producaoAnexoInput.value = '';
        
        formProducaoTitle.textContent = 'Editar Produção';
        producaoSubmitBtn.textContent = 'Atualizar';
        producaoCancelBtn.classList.remove('hidden');
        
        updateOrderPreview();
        document.getElementById('form-producao').scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditProducao = () => {
        producaoEditIdInput.value = '';
        formProducao.reset();

        if (producaoDentistaSelect) {
            producaoDentistaSelect.value = '';
        }

        // Resetar linhas para o padrão (uma linha vazia)
        producaoItemsContainer.innerHTML = '';
        producaoItemsContainer.appendChild(createMainFormItemRow());
        updateMainRemoveButtonsVisibility();

        // Mostrar botão de adicionar item
        formProducaoAddItemBtn.classList.remove('hidden');

        formProducaoTitle.textContent = 'Adicionar Produção';
        producaoSubmitBtn.textContent = 'Adicionar';
        producaoCancelBtn.classList.add('hidden');
        
        const hojeStr = getTodayDateString();
        if (producaoDataInput) producaoDataInput.value = hojeStr;
        if (entregaDataInput) entregaDataInput.value = hojeStr;

        updateOrderPreview();
    };

    const renderizarSelectTiposTrabalhoDentista = (dentistaId) => {
        const dentista = state.dentistas.find(d => d.id === dentistaId);
        if (!dentista || !dentistaTipoTrabalhoSelect) return;
    
        const tiposJaDefinidos = (dentista.valores || []).map(v => v.tipo);
        let tiposDisponiveis = (state.valores || []).filter(v => !tiposJaDefinidos.includes(v.tipo));
    
        // Se estiver editando, adicione o tipo de trabalho atual à lista de disponíveis
        if (editingValorIndex !== null && dentista.valores[editingValorIndex]) {
            const tipoEmEdicao = dentista.valores[editingValorIndex].tipo;
            tiposDisponiveis.unshift({ tipo: tipoEmEdicao, valor: 0 }); // Adiciona no início
        }
    
        dentistaTipoTrabalhoSelect.innerHTML = '<option value="">Selecione o tipo de trabalho</option>';
    
        tiposDisponiveis.forEach(valor => {
            const option = document.createElement('option');
            option.value = valor.tipo;
            option.textContent = valor.tipo;
            dentistaTipoTrabalhoSelect.appendChild(option);
        });
    
        const submitButton = formDentistaValores.querySelector('button[type="submit"]');
        if (tiposDisponiveis.length === 0) {
            dentistaTipoTrabalhoSelect.innerHTML = '<option value="">Todos os preços já foram definidos</option>';
            dentistaTipoTrabalhoSelect.disabled = true;
            if (submitButton) submitButton.disabled = true;
        } else {
            dentistaTipoTrabalhoSelect.disabled = false;
            if (submitButton) submitButton.disabled = false;
        }
    };

    const renderizarValoresDentista = (dentistaId) => {
        const dentista = state.dentistas.find(d => d.id === dentistaId);
        
        renderizarSelectTiposTrabalhoDentista(dentistaId);

        if (!dentista || !dentista.valores) {
            listaDentistaValores.innerHTML = '<p class="text-center text-gemini-secondary text-sm">Nenhum preço personalizado.</p>';
            return;
        }

        listaDentistaValores.innerHTML = '';
        if (dentista.valores.length === 0) {
            listaDentistaValores.innerHTML = '<p class="text-center text-gemini-secondary text-sm">Nenhum preço personalizado.</p>';
            return;
        }

        dentista.valores.forEach((valor, index) => {
            const valorEl = document.createElement('div');
            valorEl.className = 'flex justify-between items-center p-2 rounded hover:bg-gray-700 transition-colors';
            valorEl.innerHTML = `
                <div>
                    <span class="font-medium">${valor.tipo}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-accent-green font-semibold monetary-value">${formatarMoeda(valor.valor)}</span>
                    <button class="edit-dentista-valor-btn p-1 rounded hover:bg-gray-700 transition-colors text-gray-400" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="remove-dentista-valor-btn p-1 rounded hover:bg-red-700 transition-colors text-red-400" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            listaDentistaValores.appendChild(valorEl);
        });
        toggleValuesVisibility();
    };

    let editingValorIndex = null; // Para rastrear a edição de preços de dentistas
    let editingGlobalValorIndex = null; // Para rastrear a edição de valores globais

    const cancelEditGlobalValor = () => {
        editingGlobalValorIndex = null;
        formValores.reset();
        
        const submitBtn = formValores.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Adicionar Valor';
        }
        
        const cancelBtn = document.getElementById('cancel-global-valor-btn');
        if (cancelBtn) {
            cancelBtn.remove();
        }
    };

    const startEditGlobalValor = (index) => {
        const valorData = state.valores[index];
        if (!valorData) return;

        editingGlobalValorIndex = index;
        tipoTrabalhoInput.value = valorData.tipo;
        valorTrabalhoInput.value = valorData.valor;

        const submitBtn = formValores.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Atualizar Valor';
        }

        if (!document.getElementById('cancel-global-valor-btn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancel-global-valor-btn';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.className = 'w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all active:scale-95 mt-2';
            cancelBtn.addEventListener('click', cancelEditGlobalValor);
            formValores.appendChild(cancelBtn);
        }
        
        formValores.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditDentistaValor = () => {
        editingValorIndex = null;
        formDentistaValores.reset();
        
        const submitBtn = formDentistaValores.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Adicionar';
        }

        const cancelBtn = document.getElementById('cancel-dentista-valor-btn');
        if (cancelBtn) {
            cancelBtn.remove();
        }

        // Re-renderizar o select para remover o tipo que estava em edição (se for o caso)
        const dentistaId = parseInt(dentistaEditIdInput.value);
        if(dentistaId) {
            renderizarSelectTiposTrabalhoDentista(dentistaId);
        }
    };

    const startEditDentistaValor = (dentistaId, index) => {
        const dentista = state.dentistas.find(d => d.id === dentistaId);
        if (!dentista || !dentista.valores || !dentista.valores[index]) return;

        editingValorIndex = index;
        const valorData = dentista.valores[index];

        renderizarSelectTiposTrabalhoDentista(dentistaId);

        dentistaTipoTrabalhoSelect.value = valorData.tipo;
        dentistaValorTrabalhoInput.value = valorData.valor;

        const submitBtn = formDentistaValores.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Salvar Alteração';
        }

        if (!document.getElementById('cancel-dentista-valor-btn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancel-dentista-valor-btn';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.addEventListener('click', cancelEditDentistaValor);
            formDentistaValores.querySelector('div').appendChild(cancelBtn);
        }

        formDentistaValores.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const startEditDentista = (id) => {
        const dentista = (state.dentistas || []).find(d => d.id === id);
        if (!dentista) return;
        
        dentistaEditIdInput.value = dentista.id;
        dentistaNomeInput.value = dentista.nome;
        dentistaClinicaInput.value = dentista.clinica || '';
        dentistaTelefoneInput.value = dentista.telefone || '';
        dentistaEmailInput.value = dentista.email || '';
        
        // Populate custom cycle if available
        dentistaCicloInicioInput.value = dentista.customClosingDayStart || '';
        dentistaCicloFimInput.value = dentista.customClosingDayEnd || '';
        dentistaCicloWrapper.classList.remove('hidden');

        formDentistaTitle.textContent = 'Editar Dentista';
        formDentistaSubmitBtn.textContent = 'Atualizar';
        formDentistaCancelBtn.classList.remove('hidden');
        
        dentistaValoresSection.classList.remove('hidden');
        renderizarValoresDentista(dentista.id);
        
        document.getElementById('form-dentista').scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditDentista = () => {
        dentistaEditIdInput.value = '';
        formDentista.reset();

        dentistaCicloWrapper.classList.add('hidden');
        dentistaCicloInicioInput.value = '';
        dentistaCicloFimInput.value = '';

        formDentistaTitle.textContent = 'Adicionar Dentista';
        formDentistaSubmitBtn.textContent = 'Adicionar';
        formDentistaCancelBtn.classList.add('hidden');
        dentistaValoresSection.classList.add('hidden');
        listaDentistaValores.innerHTML = '';
    };

    const startEditDespesa = (id) => {
        const despesa = (state.despesas || []).find(d => d.id === id);
        if (!despesa) return;
        
        despesaEditIdInput.value = despesa.id;
        despesaDescInput.value = despesa.desc;
        despesaCategoriaSelect.value = despesa.categoria;
        despesaValorInput.value = despesa.valor;
        despesaDataInput.value = despesa.data;
        despesaRecorrenteCheckbox.checked = despesa.recorrente || false;
        
        formDespesaTitle.textContent = 'Editar Despesa';
        formDespesaSubmitBtn.textContent = 'Atualizar';
        formDespesaCancelBtn.classList.remove('hidden');
        
        despesasModal.classList.add('hidden');
        navigateToView('view-despesas');
        
        setTimeout(() => {
            document.getElementById('form-despesas').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const cancelEditDespesa = () => {
        despesaEditIdInput.value = '';
        formDespesas.reset();
        formDespesaTitle.textContent = 'Adicionar Despesa';
        formDespesaSubmitBtn.textContent = 'Adicionar';
        formDespesaCancelBtn.classList.add('hidden');
        
        if (despesaDataInput) despesaDataInput.value = getTodayDateString();
    };

    const startEditEstoque = (id) => {
        const item = (state.estoque || []).find(i => i.id === id);
        if (!item) return;
        
        estoqueEditIdInput.value = item.id;
        estoqueNomeInput.value = item.nome;
        estoqueFornecedorInput.value = item.fornecedor || '';
        estoqueQtdInput.value = item.qtd;
        estoqueUnidadeInput.value = item.unidade;
        estoqueMinInput.value = item.min;
        estoquePrecoInput.value = item.preco;
        
        formEstoqueTitle.textContent = 'Editar Material';
        formEstoqueSubmitBtn.textContent = 'Atualizar';
        formEstoqueCancelBtn.classList.remove('hidden');
        
        formEstoque.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditEstoque = () => {
        estoqueEditIdInput.value = '';
        formEstoque.reset();
        formEstoqueTitle.textContent = 'Adicionar Material';
        formEstoqueSubmitBtn.textContent = 'Adicionar';
        formEstoqueCancelBtn.classList.add('hidden');
    };

    // --- EVENT LISTENERS ---
    
    // Botão de ocultar/mostrar valores
    const toggleValuesVisibility = () => {
        const isHidden = document.body.classList.contains('values-hidden');
        document.querySelectorAll('.monetary-value').forEach(el => {
            if (isHidden) {
                // Se houver novo conteúdo textual diferente de vazio ou máscara, salva no dataset
                const currentText = el.textContent ? el.textContent.trim() : '';
                if (el._targetFormattedValue) {
                    el.dataset.originalValue = el._targetFormattedValue;
                } else if (currentText !== '' && currentText !== '••••' && currentText !== 'R$ •••••') {
                    el.dataset.originalValue = currentText;
                }
                el.textContent = ''; // Oculta o valor (CSS ::before exibe a máscara)
            } else {
                // Ao exibir, restaura o valor original se existente e remove o dataset para não travar atualizações futuras
                if (el.dataset.originalValue) {
                    el.textContent = el.dataset.originalValue;
                    delete el.dataset.originalValue;
                }
            }
        });
        if (eyeIcon) eyeIcon.classList.toggle('hidden', isHidden);
        if (eyeOffIcon) eyeOffIcon.classList.toggle('hidden', !isHidden);
    };

    if(toggleValuesBtn) {
        toggleValuesBtn.addEventListener('click', () => {
            document.body.classList.toggle('values-hidden');
            const isHidden = document.body.classList.contains('values-hidden');
            toggleValuesBtn.setAttribute('aria-pressed', isHidden);
            toggleValuesVisibility();
        });
    }

    // Toggle Top15 / Todos no gráfico de dentistas
    if (toggleDentistaShowAllBtn) {
        // Inicializa o texto conforme o estado
        toggleDentistaShowAllBtn.textContent = state.showAllDentistas ? 'Mostrar Top 15' : 'Mostrar todos';
        toggleDentistaShowAllBtn.addEventListener('click', () => {
            state.showAllDentistas = !state.showAllDentistas;
            toggleDentistaShowAllBtn.textContent = state.showAllDentistas ? 'Mostrar Top 15' : 'Mostrar todos';
            updateDentistaChart();
        });
    }

	    if (saveQuickNotesBtn) {
	        saveQuickNotesBtn.addEventListener('click', async () => {
                const activeNoteIndex = state.quickNotes.findIndex(n => n.id === state.activeQuickNoteId);
                if (activeNoteIndex === -1) {
                    showToast(t('toast_no_note_selected'));
                    return;
                }
                
                // 1. Atualizar o conteúdo da aba ativa no estado
	            state.quickNotes[activeNoteIndex].content = quickNotesInput.value;
	            
                // 2. Ativar feedback visual (loading)
                const originalButtonText = saveQuickNotesBtn.dataset.originalText || 'Salvar Nota';
                if (!saveQuickNotesBtn.dataset.originalText) {
                    saveQuickNotesBtn.dataset.originalText = originalButtonText;
                }
                setButtonLoading(saveQuickNotesBtn, true, originalButtonText);
	            if (quickNotesFeedback) quickNotesFeedback.classList.add('hidden');

	            try {
	                // 3. Salvar o estado inteiro no Firestore
	                await saveDataToFirestore();
	                showToast(t('toast_note_saved'), "success");
	                
	                // 5. Feedback visual localizado
	                if (quickNotesFeedback) {
	                    quickNotesFeedback.textContent = t('toast_save_success');
	                    quickNotesFeedback.classList.remove('hidden', 'text-red-400');
	                    quickNotesFeedback.classList.add('text-green-400');
	                    setTimeout(() => quickNotesFeedback.classList.add('hidden'), 2000);
	                }

	            } catch (error) {
	                console.error("Erro ao salvar notas:", error);
	                showToast(t('toast_error_save_note'));
	                if (quickNotesFeedback) {
	                    quickNotesFeedback.textContent = t('toast_error_generic');
	                    quickNotesFeedback.classList.remove('hidden', 'text-green-400');
	                    quickNotesFeedback.classList.add('text-red-400');
	                }
	            } finally {
	                setButtonLoading(saveQuickNotesBtn, false);
	            }
	        });
	    }

        // Clique nas abas (delegação de evento)
        if (quickNotesTabsList) {
            quickNotesTabsList.addEventListener('click', (e) => {
                const tab = e.target.closest('.quick-note-tab');
                if (tab && tab.dataset.id) {
                    selectQuickNoteTab(Number(tab.dataset.id));
                }
            });
        }

        // Botão de Adicionar Nova Aba
        if (addQuickNoteTabBtn) {
            addQuickNoteTabBtn.addEventListener('click', () => {
                const title = prompt("Qual o nome da nova nota?", "Nova Nota");
                if (title && title.trim() !== "") {
                    const newNote = {
                        id: Date.now(),
                        title: title.trim(),
                        content: ""
                    };
                    state.quickNotes.push(newNote);
                    selectQuickNoteTab(newNote.id); // Salva e renderiza a nova aba
                }
            });
        }

        // Botão de Apagar Aba
        if (deleteQuickNoteTabBtn) {
    deleteQuickNoteTabBtn.addEventListener('click', async () => { // [MODIFICADO] Adicionado 'async'
        if (state.quickNotes.length <= 1) {
            showToast("Não pode apagar a última nota.");
            return;
        }

        const activeNote = state.quickNotes.find(n => n.id === state.activeQuickNoteId);

        // [MODIFICADO] Chamando o novo modal
        const confirmed = await showConfirmationModal(
            t('modal_confirm_title'), 
            `Tem certeza que quer apagar a nota "${activeNote.title}"?`
        );

        if (confirmed) {
            state.quickNotes = state.quickNotes.filter(n => n.id !== state.activeQuickNoteId);
            // Seleciona a primeira nota da lista como nova aba ativa
            state.activeQuickNoteId = state.quickNotes[0].id; 
            saveDataToFirestore().then(() => {
                renderQuickNotesUI(); // Atualiza a UI
                showToast("Nota apagada.", "success");
            });
        }
    });
}
	
	    // Notificações
	    if (notificationsBtn) {
	        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('hidden');
        });
    }
    
    if (clearNotifications) {
        clearNotifications.addEventListener('click', () => {
            state.notifications = [];
            updateNotificationUI();
            saveDataToFirestore();
            notificationsDropdown.classList.add('hidden');
        });
    }
    
    document.addEventListener('click', () => {
        if (notificationsDropdown) {
            notificationsDropdown.classList.add('hidden');
        }
    });
    
    // Filtros
    if (searchProducaoInput) searchProducaoInput.addEventListener('input', (e) => { state.searchTermProducao = e.target.value; renderizarProducaoDia(); });
    if (searchDentistasInput) searchDentistasInput.addEventListener('input', (e) => { state.searchTermDentistas = e.target.value; renderizarListaDentistas(); });
    if (searchEstoqueInput) searchEstoqueInput.addEventListener('input', (e) => { state.searchTermEstoque = e.target.value; renderizarEstoque(); });
    if (searchDespesasInput) searchDespesasInput.addEventListener('input', (e) => { state.searchTermDespesas = e.target.value; renderizarListaDespesasCompleta(); });
    const handleManualFilterChange = () => {
        state.producaoQuickFilter = null;
        document.querySelectorAll('.btn-quick-filter').forEach(b => b.classList.remove('active'));
        renderizarProducaoDia();
    };

    if (filterStatusSelect) filterStatusSelect.addEventListener('change', handleManualFilterChange);
    if (filterDataInicio) filterDataInicio.addEventListener('change', handleManualFilterChange);
    if (filterDataFim) filterDataFim.addEventListener('change', handleManualFilterChange);
    if (filterProducaoDentistaMain) filterProducaoDentistaMain.addEventListener('change', handleManualFilterChange);
    if (filterProducaoTipo) filterProducaoTipo.addEventListener('change', handleManualFilterChange);

    // Filtros Rápidos
    const applyProducaoQuickFilter = (mode) => {
        state.producaoQuickFilter = mode;

        document.querySelectorAll('.btn-quick-filter').forEach(b => {
            const btnMode = b.dataset.filter || b.dataset.quickFilter;
            if (btnMode === mode) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const todayStr = getTodayDateString(today);

        if (mode === 'todos') {
            if (filterStatusSelect) filterStatusSelect.value = '';
            if (filterDataInicio) filterDataInicio.value = '';
            if (filterDataFim) filterDataFim.value = '';
            if (searchProducaoInput) {
                searchProducaoInput.value = '';
                state.searchTermProducao = '';
            }
            if (filterProducaoDentistaMain) filterProducaoDentistaMain.value = '';
            if (filterProducaoTipo) filterProducaoTipo.value = '';
            state.producaoQuickFilter = 'todos';
        } else if (mode === 'hoje') {
            if (filterDataInicio) filterDataInicio.value = todayStr;
            if (filterDataFim) filterDataFim.value = todayStr;
            if (filterStatusSelect) filterStatusSelect.value = '';
            if (searchProducaoInput) {
                searchProducaoInput.value = '';
                state.searchTermProducao = '';
            }
            state.producaoQuickFilter = 'hoje';
        } else if (mode === 'semana') {
            const dayOfWeek = today.getDay(); // 0 is Sunday
            const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
            const endStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

            if (filterDataInicio) filterDataInicio.value = startStr;
            if (filterDataFim) filterDataFim.value = endStr;
            if (filterStatusSelect) filterStatusSelect.value = '';
        } else if (mode === 'mes') {
            const startOfMonth = `${yyyy}-${mm}-01`;
            const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
            const endOfMonth = `${yyyy}-${mm}-${String(lastDay).padStart(2, '0')}`;

            if (filterDataInicio) filterDataInicio.value = startOfMonth;
            if (filterDataFim) filterDataFim.value = endOfMonth;
            if (filterStatusSelect) filterStatusSelect.value = '';
        } else if (mode === 'pendentes') {
            if (filterStatusSelect) filterStatusSelect.value = 'Pendente';
            if (filterDataInicio) filterDataInicio.value = '';
            if (filterDataFim) filterDataFim.value = '';
        } else if (mode === 'andamento') {
            if (filterStatusSelect) filterStatusSelect.value = 'Em Andamento';
            if (filterDataInicio) filterDataInicio.value = '';
            if (filterDataFim) filterDataFim.value = '';
        } else if (mode === 'finalizados') {
            if (filterStatusSelect) filterStatusSelect.value = 'Finalizado';
            if (filterDataInicio) filterDataInicio.value = '';
            if (filterDataFim) filterDataFim.value = '';
        } else if (mode === 'atrasados') {
            if (filterStatusSelect) filterStatusSelect.value = '';
            if (filterDataInicio) filterDataInicio.value = '';
            if (filterDataFim) filterDataFim.value = '';
        }

        renderizarProducaoDia();
    };

    document.querySelectorAll('.btn-quick-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const mode = btn.dataset.filter || btn.dataset.quickFilter;
            applyProducaoQuickFilter(mode);
        });
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-quick-filter');
        if (btn) {
            e.preventDefault();
            const mode = btn.dataset.filter || btn.dataset.quickFilter;
            applyProducaoQuickFilter(mode);
        }
    });

    const limparFiltrosProducao = () => {
        if (searchProducaoInput) {
            searchProducaoInput.value = '';
            state.searchTermProducao = '';
        }
        if (filterProducaoDentistaMain) filterProducaoDentistaMain.value = '';
        if (filterProducaoTipo) filterProducaoTipo.value = '';
        if (filterStatusSelect) filterStatusSelect.value = '';

        // Ao limpar os filtros, retorna automaticamente para "HOJE"
        applyProducaoQuickFilter('hoje');
    };

    if (btnLimparFiltrosProducao) btnLimparFiltrosProducao.addEventListener('click', (e) => {
        e.preventDefault();
        limparFiltrosProducao();
    });
    if (btnResetFiltersInline) btnResetFiltersInline.addEventListener('click', (e) => {
        e.preventDefault();
        limparFiltrosProducao();
    });

    // Sincronização e atalhos do formulário Adicionar Produção
    if (producaoDentistaSelect) {
        producaoDentistaSelect.addEventListener('change', () => {
            const dId = producaoDentistaSelect.value;
            const d = (state.dentistas || []).find(dent => String(dent.id) === String(dId));
            if (d && producaoDentistaInput) {
                producaoDentistaInput.value = d.nome;
            } else if (!dId && producaoDentistaInput) {
                producaoDentistaInput.value = '';
            }
            updateOrderPreview();
        });
    }

    if (producaoDentistaInput) {
        producaoDentistaInput.addEventListener('input', () => {
            const name = producaoDentistaInput.value.trim().toLowerCase();
            const d = (state.dentistas || []).find(dent => dent.nome.toLowerCase() === name);
            if (d && producaoDentistaSelect) {
                producaoDentistaSelect.value = d.id;
            }
            updateOrderPreview();
        });
    }

    const openQuickAddDentistaModal = () => {
        const modal = document.getElementById('add-dentista-modal') || addDentistaModal;
        if (modal) {
            const form = document.getElementById('quick-add-dentista-form') || quickAddDentistaForm;
            if (form) form.reset();
            modal.classList.remove('hidden');
            const input = document.getElementById('quick-dentista-nome-input') || quickDentistaNomeInput;
            if (input) {
                setTimeout(() => input.focus(), 80);
            }
        }
    };
    window.openQuickAddDentistaModal = openQuickAddDentistaModal;

    if (btnQuickNewDentista) {
        btnQuickNewDentista.addEventListener('click', (e) => {
            e.preventDefault();
            openQuickAddDentistaModal();
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btn-quick-new-dentist, #btn-quick-new-dentista, [data-action="quick-new-dentist"]');
        if (btn) {
            e.preventDefault();
            openQuickAddDentistaModal();
        }
    });

    if (btnNovaProducaoDentista) {
        btnNovaProducaoDentista.addEventListener('click', () => {
            if (filterDentistaSelect && filterDentistaSelect.value) {
                if (producaoDentistaSelect) producaoDentistaSelect.value = filterDentistaSelect.value;
                const d = (state.dentistas || []).find(dent => String(dent.id) === String(filterDentistaSelect.value));
                if (d && producaoDentistaInput) producaoDentistaInput.value = d.nome;
                updateOrderPreview();
            }
            const formEl = document.getElementById('form-producao');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Select all logic
    if (selectAllProducaoCheckbox) {
        selectAllProducaoCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.producao-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateDentistaBatchBar();
        });
    }

    if (thSelectAllDentista) {
        thSelectAllDentista.addEventListener('change', (e) => {
            if (producaoDentistaTableBody) {
                const checkboxes = producaoDentistaTableBody.querySelectorAll('.producao-checkbox');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
                updateDentistaBatchBar();
            }
        });
    }

    // Produção por dentista: Controles avançados
    if (filterDentistaSelect) filterDentistaSelect.addEventListener('change', renderizarProducaoPorDentista);
    if (filterDentistaPeriodo) filterDentistaPeriodo.addEventListener('change', renderizarProducaoPorDentista);
    if (filterDentistaStatus) filterDentistaStatus.addEventListener('change', renderizarProducaoPorDentista);
    if (searchDentistaTable) searchDentistaTable.addEventListener('input', renderizarProducaoPorDentista);

    // Ações em Lote (Batch Bar)
    if (btnBatchClear) {
        btnBatchClear.addEventListener('click', () => {
            if (producaoDentistaTableBody) {
                const checkboxes = producaoDentistaTableBody.querySelectorAll('.producao-checkbox');
                checkboxes.forEach(cb => cb.checked = false);
            }
            if (thSelectAllDentista) thSelectAllDentista.checked = false;
            updateDentistaBatchBar();
        });
    }

    if (btnBatchFinish) {
        btnBatchFinish.addEventListener('click', async () => {
            const checkedBoxes = producaoDentistaTableBody ? producaoDentistaTableBody.querySelectorAll('.producao-checkbox:checked') : [];
            if (checkedBoxes.length === 0) return;
            const ids = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.id));
            state.producao.forEach(p => {
                if (ids.includes(p.id)) {
                    p.status = 'Finalizado';
                }
            });
            await saveDataToFirestore();
            showToast(`${ids.length} trabalhos marcados como Finalizado!`, 'success');
            renderizarProducaoPorDentista();
            renderizarProducaoDia();
            renderizarDashboard();
        });
    }

    if (btnBatchDelete) {
        btnBatchDelete.addEventListener('click', async () => {
            const checkedBoxes = producaoDentistaTableBody ? producaoDentistaTableBody.querySelectorAll('.producao-checkbox:checked') : [];
            if (checkedBoxes.length === 0) return;
            const confirmed = await showConfirmationModal(
                t('modal_confirm_title'),
                `Tem certeza que deseja excluir os ${checkedBoxes.length} trabalhos selecionados?`
            );
            if (confirmed) {
                const ids = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.id));
                state.producao = state.producao.filter(p => !ids.includes(p.id));
                await saveDataToFirestore();
                showToast(`${ids.length} trabalhos excluídos com sucesso!`, 'success');
                renderizarProducaoPorDentista();
                renderizarProducaoDia();
                renderizarDashboard();
            }
        });
    }

    if (btnBatchPix) {
        btnBatchPix.addEventListener('click', handleGerarCobrancaPix);
    }
    if (btnGerarPixDentista) {
        btnGerarPixDentista.addEventListener('click', handleGerarCobrancaPix);
    }

    if (producaoDentistaTableBody) {
        producaoDentistaTableBody.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.edit-producao-btn');
            const removeBtn = e.target.closest('.remove-producao-btn');

            if (editBtn) {
                const producaoId = parseInt(editBtn.dataset.id);
                startEditProducao(producaoId);
            } 
            else if (removeBtn) {
                const producaoId = parseInt(removeBtn.dataset.id);
                
                const confirmed = await showConfirmationModal(
                    t('modal_confirm_title'), 
                    'Tem certeza que quer excluir este trabalho?'
                );

                if (confirmed) {
                    state.producao = state.producao.filter(p => p.id !== producaoId);
                    await saveDataToFirestore();
                    showToast("Produção removida com sucesso!", "success");
                    renderizarProducaoPorDentista();
                    renderizarProducaoDia();
                    renderizarDashboard();
                    renderDentistaQuickPills();
                }
            }
        });
    }

    // Exportação PDF
    if (exportDashboardPdf) exportDashboardPdf.addEventListener('click', () => openExportModal('dashboard'));
    if (exportProducaoPdf) exportProducaoPdf.addEventListener('click', () => openExportModal('producao'));
    if (exportDentistasPdf) exportDentistasPdf.addEventListener('click', () => openExportModal('dentistas'));
    if (exportResumoPdf) exportResumoPdf.addEventListener('click', () => openExportModal('resumo'));
    if (exportAnalisePdf) exportAnalisePdf.addEventListener('click', () => openExportModal('analise'));
    if (exportDentistaProducaoPdfBtn) exportDentistaProducaoPdfBtn.addEventListener('click', () => openExportModal('dentista'));

    // Atalhos de teclado globais
    document.addEventListener('keydown', (e) => {
        // Permitir fechar modais com ESC
        if (e.key === 'Escape') {
            // 1. Confirmação (Prioridade Máxima)
            const confirmationModal = document.getElementById('confirmation-modal');
            if (confirmationModal && !confirmationModal.classList.contains('hidden')) {
                const noBtn = document.getElementById('confirm-no-btn');
                if (noBtn) noBtn.click();
                e.preventDefault();
                return;
            }

            // 2. Outros Modais
            const openModals = Array.from(document.querySelectorAll('[id$="-modal"]'))
                .filter(m => !m.classList.contains('hidden') && m.id !== 'confirmation-modal' && m.id !== 'loading-modal');

            if (openModals.length > 0) {
                openModals.forEach(m => m.classList.add('hidden'));
                e.preventDefault();
                return;
            }

            // 3. Menu Lateral (Mobile)
            const sideMenu = document.getElementById('side-menu');
            if (sideMenu && !sideMenu.classList.contains('-translate-x-full')) {
                toggleMenu();
                e.preventDefault();
                return;
            }
        }

        // Evita disparo ao digitar em inputs ou textareas
        const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
        if (isInput) return;

        // Shift + P: Produção Rápida
        if (e.shiftKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            const btn = document.getElementById('action-add-producao');
            if (btn) btn.click();
        }

        // Shift + C: Adicionar Dentista Rápido
        if (e.shiftKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            const btn = document.getElementById('action-add-dentista');
            if (btn) btn.click();
        }
    });

    // Ações rápidas
    // --- LÓGICA DO FORMULÁRIO DE PRODUÇÃO (PRINCIPAL) ---

    const calculateItemPrice = (dentistaId, tipoTrabalho, qtd = 1) => {
        if (!tipoTrabalho) return { unitPrice: 0, totalPrice: 0 };
        const dentista = (state.dentistas || []).find(d => String(d.id) === String(dentistaId));
        const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === tipoTrabalho) : null;
        const valorGlobal = (state.valores || []).find(v => v.tipo === tipoTrabalho);
        const unitPrice = valorDentista ? (parseFloat(valorDentista.valor) || 0) : (valorGlobal ? (parseFloat(valorGlobal.valor) || 0) : 0);
        const quantity = parseInt(qtd) > 0 ? parseInt(qtd) : 1;
        return {
            unitPrice,
            totalPrice: unitPrice * quantity
        };
    };

    const updateOrderPreview = () => {
        const summaryCard = document.getElementById('form-producao-summary-card') || formProducaoSummaryCard;
        const summaryItems = document.getElementById('form-producao-summary-items') || formProducaoSummaryItems;
        const summaryTotal = document.getElementById('form-producao-summary-total') || formProducaoSummaryTotal;
        
        let dentistaId = producaoDentistaSelect ? producaoDentistaSelect.value : null;
        if (!dentistaId && producaoDentistaInput) {
            const dName = producaoDentistaInput.value.trim().toLowerCase();
            const dObj = (state.dentistas || []).find(d => (d.nome || '').trim().toLowerCase() === dName || String(d.id) === dName);
            if (dObj) dentistaId = dObj.id;
        }

        const itemRows = producaoItemsContainer ? producaoItemsContainer.querySelectorAll('.main-work-item-group') : [];
        let subtotal = 0;
        let totalItems = 0;
        let totalTypesCount = 0;
        const previewItemsList = [];

        itemRows.forEach(row => {
            const select = row.querySelector('.main-producao-tipo-select');
            const qtdInput = row.querySelector('.main-producao-qtd-input');
            const priceBadge = row.querySelector('.item-price-preview');
            const elementosInfo = row.querySelector('.item-elementos-info');
            
            const tipo = select ? select.value : '';
            const qtd = qtdInput ? (parseInt(qtdInput.value) > 0 ? parseInt(qtdInput.value) : 1) : 1;
            
            if (elementosInfo) {
                elementosInfo.textContent = `${qtd} ${qtd === 1 ? 'elemento' : 'elementos'}`;
            }

            const { unitPrice, totalPrice } = calculateItemPrice(dentistaId, tipo, qtd);
            
            if (priceBadge) {
                if (unitPrice > 0 && tipo) {
                    priceBadge.innerHTML = `<span class="text-accent-green font-semibold">${formatarMoeda(unitPrice)}/un</span> <span class="text-gemini-secondary">(${formatarMoeda(totalPrice)})</span>`;
                    priceBadge.classList.remove('hidden');
                } else {
                    priceBadge.classList.add('hidden');
                }
            }

            if (tipo && qtd > 0) {
                subtotal += totalPrice;
                totalItems += qtd;
                totalTypesCount++;
                previewItemsList.push({ tipo, qtd, unitPrice, totalPrice });
            }
        });

        // 1. Atualizar o Resumo Dinâmico do Pedido no Formulário Principal
        if (summaryTotal) {
            summaryTotal.textContent = formatarMoeda(subtotal);
        }

        if (summaryItems) {
            if (totalItems === 0) {
                summaryItems.textContent = 'Nenhum trabalho selecionado';
            } else {
                summaryItems.textContent = `${totalItems} ${totalItems === 1 ? 'elemento selecionado' : 'elementos selecionados'}${totalTypesCount > 1 ? ` (${totalTypesCount} tipos)` : ''}`;
            }
        }

        // 2. Atualizar elementos adicionais de preview se existirem
        if (orderPreviewItems) {
            if (previewItemsList.length === 0) {
                orderPreviewItems.innerHTML = '<p class="text-xs text-gemini-secondary italic">Nenhum trabalho selecionado ainda.</p>';
            } else {
                orderPreviewItems.innerHTML = previewItemsList.map(item => `
                    <div class="flex justify-between items-center text-xs py-1 border-b border-gemini-border/40 last:border-0">
                        <span class="text-gemini-primary font-medium truncate max-w-[150px]">${item.tipo} <span class="text-gemini-secondary font-normal">(${item.qtd} ${item.qtd === 1 ? 'elem.' : 'elem.'})</span></span>
                        <span class="text-accent-green font-bold">${formatarMoeda(item.totalPrice)}</span>
                    </div>
                `).join('');
            }
        }

        if (orderPreviewSubtotal) orderPreviewSubtotal.textContent = formatarMoeda(subtotal);
        if (orderPreviewTotal) orderPreviewTotal.textContent = formatarMoeda(subtotal);
        if (orderPreviewCount) orderPreviewCount.textContent = `${totalItems} ${totalItems === 1 ? 'elemento' : 'elementos'}`;
    };

    const createMainFormItemRow = (selectedValue = '', quantity = 1) => {
        const row = document.createElement('div');
        row.className = 'main-work-item-group p-3 rounded-xl border border-gemini-border bg-gemini-input/20 space-y-2 transition-all hover:border-indigo-500/40';

        const safeQuantity = parseInt(quantity) > 0 ? parseInt(quantity) : 1;

        row.innerHTML = `
            <div class="flex gap-2 items-center">
                <div class="flex-1 min-w-0">
                    <select class="main-producao-tipo-select w-full p-2.5 bg-gemini-input text-gemini-input border border-gemini-border rounded-lg text-sm font-medium mobile-optimized-input truncate focus:border-indigo-500" required>
                        <option value="" data-i18n="placeholder_select_work_type">${t('placeholder_select_work_type')}</option>
                    </select>
                </div>
                <div class="w-36 flex-shrink-0">
                    <div class="elementos-stepper" title="Quantidade de elementos">
                        <button type="button" class="btn-step-minus" title="Diminuir elemento">−</button>
                        <input type="number" class="main-producao-qtd-input" value="${safeQuantity}" min="1" max="999" required title="Quantidade de elementos">
                        <button type="button" class="btn-step-plus" title="Aumentar elemento">+</button>
                    </div>
                </div>
                <button type="button" class="remove-main-item-btn p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/15 border border-transparent hover:border-red-500/25 transition-all flex-shrink-0" title="Remover trabalho">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="flex justify-between items-center text-xs px-1">
                <span class="item-elementos-info text-xs font-semibold text-sky-400">${safeQuantity} ${safeQuantity === 1 ? 'elemento' : 'elementos'}</span>
                <span class="item-price-preview text-xs text-gemini-secondary hidden"></span>
            </div>
        `;

        // Populate Select
        const select = row.querySelector('select');
        (state.valores || []).forEach(valor => {
            const option = document.createElement('option');
            option.value = valor.tipo;
            option.textContent = valor.tipo;
            select.appendChild(option);
        });

        if (selectedValue) select.value = selectedValue;

        const qtdInput = row.querySelector('.main-producao-qtd-input');
        const btnMinus = row.querySelector('.btn-step-minus');
        const btnPlus = row.querySelector('.btn-step-plus');

        if (btnMinus && qtdInput) {
            btnMinus.addEventListener('click', () => {
                let v = parseInt(qtdInput.value) || 1;
                if (v > 1) {
                    qtdInput.value = v - 1;
                    qtdInput.dispatchEvent(new Event('input', { bubbles: true }));
                    updateOrderPreview();
                }
            });
        }

        if (btnPlus && qtdInput) {
            btnPlus.addEventListener('click', () => {
                let v = parseInt(qtdInput.value) || 1;
                qtdInput.value = v + 1;
                qtdInput.dispatchEvent(new Event('input', { bubbles: true }));
                updateOrderPreview();
            });
        }

        select.addEventListener('change', updateOrderPreview);
        qtdInput.addEventListener('input', updateOrderPreview);
        qtdInput.addEventListener('change', updateOrderPreview);
        qtdInput.addEventListener('keyup', updateOrderPreview);

        setTimeout(updateOrderPreview, 0);

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

    // --- LÓGICA DO MODAL DE ADIÇÃO RÁPIDA DE PRODUÇÃO ---

    const createWorkItemRow = () => {
        const row = document.createElement('div');
        row.className = 'work-item-group flex gap-2 items-center p-2 rounded-xl border transition-all';
        
        row.innerHTML = `
            <div class="flex-1 min-w-0">
                 <select class="quick-producao-tipo-select w-full p-2.5 bg-gemini-input text-gemini-input border border-gemini-border rounded-lg text-sm font-medium mobile-optimized-input truncate" required>
                    <option value="" data-i18n="placeholder_select_work_type">Selecione o tipo de trabalho</option>
                </select>
            </div>
            <div class="w-20 flex-shrink-0">
                 <input type="number" class="quick-producao-qtd-input w-full p-2.5 bg-gemini-input text-gemini-input border border-gemini-border rounded-lg text-sm font-bold text-center mobile-optimized-input" placeholder="Qtd" value="1" min="1" required title="Quantidade">
            </div>
            <button type="button" class="remove-work-item-btn p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/15 border border-transparent hover:border-red-500/25 transition-all flex-shrink-0" title="Remover trabalho">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        // Populate Select
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
        const rows = quickProductionItemsContainer.querySelectorAll('.work-item-group');
        const removeBtns = quickProductionItemsContainer.querySelectorAll('.remove-work-item-btn');

        if (rows.length === 1) {
            removeBtns.forEach(btn => btn.classList.add('hidden'));
        } else {
            removeBtns.forEach(btn => btn.classList.remove('hidden'));
        }
    };

    const openQuickAddModal = () => {
        quickAddProductionForm.reset();

        // Reset and populate items
        quickProductionItemsContainer.innerHTML = '';
        quickProductionItemsContainer.appendChild(createWorkItemRow());
        updateRemoveButtonsVisibility();
        
        // Definir datas padrão
        const hojeStr = getTodayDateString();
        if (quickProducaoDataInput) quickProducaoDataInput.value = hojeStr;
        if (quickEntregaDataInput) quickEntregaDataInput.value = hojeStr;
        
        addProductionModal.classList.remove('hidden');
    };

    if (actionAddProducao) {
        actionAddProducao.addEventListener('click', openQuickAddModal);
    }

    if (workTypeDetailsModal) {
        const closeLogic = () => workTypeDetailsModal.classList.add('hidden');
        if (closeWorkTypeModalBtn) closeWorkTypeModalBtn.addEventListener('click', closeLogic);
        if (closeWorkTypeModalFooterBtn) closeWorkTypeModalFooterBtn.addEventListener('click', closeLogic);
    }
    
    // Listeners do Modal Adicionar Produção Rápida
    if (addProductionModal) {
        closeAddProductionModalBtn.addEventListener('click', () => addProductionModal.classList.add('hidden'));
        quickAddProductionCancelBtn.addEventListener('click', () => addProductionModal.classList.add('hidden'));

        if (addWorkItemBtn) {
            addWorkItemBtn.addEventListener('click', () => {
                quickProductionItemsContainer.appendChild(createWorkItemRow());
                updateRemoveButtonsVisibility();
            });
        }

        if (quickProductionItemsContainer) {
            quickProductionItemsContainer.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-work-item-btn');
                if (removeBtn) {
                    const row = removeBtn.closest('.work-item-group');
                    if (row) {
                        row.remove();
                        updateRemoveButtonsVisibility();
                    }
                }
            });
        }
    
        quickAddProductionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const originalButtonText = quickAddProductionSubmitBtn.textContent;
            setButtonLoading(quickAddProductionSubmitBtn, true, originalButtonText);
    
            const dentistaNome = quickProducaoDentistaInput.value.trim();
            const dentistaObj = (state.dentistas || []).find(d => d.nome === dentistaNome);
            
            if (!dentistaObj) {
                showToast(t('toast_dentist_not_found'));
                setButtonLoading(quickAddProductionSubmitBtn, false);
                return;
            }

            // Collect all items
            const itemRows = quickProductionItemsContainer.querySelectorAll('.work-item-group');
            const itemsToAdd = [];
            let validationError = false;

            itemRows.forEach(row => {
                const tipo = row.querySelector('.quick-producao-tipo-select').value;
                const qtd = parseInt(row.querySelector('.quick-producao-qtd-input').value) || 0;

                if (!tipo || qtd <= 0) {
                    validationError = true;
                } else {
                    itemsToAdd.push({ tipo, qtd });
                }
            });

            if (validationError || itemsToAdd.length === 0) {
                showToast(t('toast_fill_all_fields'));
                setButtonLoading(quickAddProductionSubmitBtn, false);
                return;
            }

            const nomePaciente = quickProducaoPacienteInput.value.trim();
            const obs = quickProducaoObsInput.value.trim();
            const data = quickProducaoDataInput.value;
            const entrega = quickEntregaDataInput.value;

            if (!nomePaciente || !data || !entrega) {
                 showToast(t('toast_fill_all_fields'));
                 setButtonLoading(quickAddProductionSubmitBtn, false);
                 return;
            }

            const itemsAdded = []; // Keep track of added items for rollback

            try {
                // Generate base ID.
                const baseId = Date.now();

                itemsToAdd.forEach((item, index) => {
                    const producaoData = {
                        id: baseId + index,
                        tipo: item.tipo,
                        dentista: dentistaObj.id,
                        nomePaciente: nomePaciente,
                        qtd: item.qtd,
                        status: 'Pendente', // Status Padrão
                        obs: obs,
                        data: data,
                        entrega: entrega,
                        anexoURL: null
                    };
                    state.producao.push(producaoData);
                    itemsAdded.push(producaoData);
                });

                await saveDataToFirestore();
                showToast(t('toast_success_production_add'), "success");
                addProductionModal.classList.add('hidden');
                renderAllUIComponents(); // Atualiza o dashboard
                updateCharts();
            } catch (error) {
                // Rollback: remove the items that were tentatively added
                if (itemsAdded.length > 0) {
                     state.producao = state.producao.filter(p => !itemsAdded.includes(p));
                }
                showToast(t('toast_error_save_production'));
                console.error(error);
            } finally {
                setButtonLoading(quickAddProductionSubmitBtn, false);
            }
        });
    }
    const actionAddDentista = document.getElementById('action-add-dentista');
    if (actionAddDentista) {
        actionAddDentista.addEventListener('click', () => {
            if (addDentistaModal) {
                quickAddDentistaForm.reset();
                addDentistaModal.classList.remove('hidden');
                quickDentistaNomeInput.focus();
            } else {
                navigateToView('view-dentistas');
            }
        });
    }
    if (actionAddDespesa) {
        actionAddDespesa.addEventListener('click', () => {
            if (addDespesaModal) {
                quickAddDespesaForm.reset();
                // Definir data padrão como hoje
                if (quickDespesaDataInput) quickDespesaDataInput.value = getTodayDateString();
                addDespesaModal.classList.remove('hidden');
                quickDespesaDescInput.focus();
            } else {
                navigateToView('view-admin');
            }
        });
    }

    // Listeners do Modal Adicionar Despesa Rápida
    if (addDespesaModal) {
        closeAddDespesaModalBtn.addEventListener('click', () => addDespesaModal.classList.add('hidden'));
        quickAddDespesaCancelBtn.addEventListener('click', () => addDespesaModal.classList.add('hidden'));

        quickAddDespesaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = quickAddDespesaSubmitBtn;
            const originalText = submitButton.textContent;
            setButtonLoading(submitButton, true, originalText);

            const desc = quickDespesaDescInput.value.trim();
            const valor = parseFloat(quickDespesaValorInput.value);
            const data = quickDespesaDataInput.value;

            if (!desc || isNaN(valor) || !data) {
                showToast(t('toast_fill_expense_fields'));
                setButtonLoading(submitButton, false);
                return;
            }

            const despesaData = {
                id: Date.now(),
                desc,
                categoria: quickDespesaCategoriaSelect.value,
                valor,
                data,
                recorrente: quickDespesaRecorrenteCheckbox.checked
            };

            state.despesas.push(despesaData);

            try {
                await saveDataToFirestore();
                showToast(t('toast_success_expense_add'), "success");
                addDespesaModal.classList.add('hidden');
                renderAllUIComponents(); // Atualiza o dashboard e listas
            } catch (error) {
                state.despesas.pop(); // Reverte em caso de erro
                showToast(t('toast_error_save_expense'));
                console.error(error);
            } finally {
                setButtonLoading(submitButton, false);
            }
        });
    }

    // Listeners do Modal Adicionar Dentista
    const targetAddDentistaModal = document.getElementById('add-dentista-modal') || addDentistaModal;
    const targetCloseAddDentistaModalBtn = document.getElementById('close-add-dentista-modal-btn') || closeAddDentistaModalBtn;
    const targetQuickAddDentistaCancelBtn = document.getElementById('quick-add-dentista-cancel-btn') || quickAddDentistaCancelBtn;
    const targetQuickAddDentistaForm = document.getElementById('quick-add-dentista-form') || quickAddDentistaForm;

    if (targetAddDentistaModal) {
        if (targetCloseAddDentistaModalBtn) {
            targetCloseAddDentistaModalBtn.addEventListener('click', () => targetAddDentistaModal.classList.add('hidden'));
        }
        if (targetQuickAddDentistaCancelBtn) {
            targetQuickAddDentistaCancelBtn.addEventListener('click', () => targetAddDentistaModal.classList.add('hidden'));
        }
        targetAddDentistaModal.addEventListener('click', (e) => {
            if (e.target === targetAddDentistaModal) targetAddDentistaModal.classList.add('hidden');
        });

        if (targetQuickAddDentistaForm) {
            targetQuickAddDentistaForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = e.submitter || document.getElementById('quick-add-dentista-submit-btn');
                setButtonLoading(submitButton, true, 'Salvar');

                const nomeInput = document.getElementById('quick-dentista-nome-input') || quickDentistaNomeInput;
                const clinicaInput = document.getElementById('quick-dentista-clinica-input') || quickDentistaClinicaInput;
                const telInput = document.getElementById('quick-dentista-telefone-input') || quickDentistaTelefoneInput;
                const emailInput = document.getElementById('quick-dentista-email-input') || quickDentistaEmailInput;

                const nome = nomeInput ? nomeInput.value.trim() : '';
                if (!nome) {
                    showToast(t('toast_fill_dentist_name'));
                    setButtonLoading(submitButton, false);
                    return;
                }

                const dentistaData = {
                    id: Date.now(),
                    nome,
                    clinica: clinicaInput ? clinicaInput.value.trim() : '',
                    telefone: telInput ? telInput.value.trim() : '',
                    email: emailInput ? emailInput.value.trim() : '',
                    valores: []
                };

                state.dentistas.push(dentistaData);

                try {
                    await saveDataToFirestore();
                    showToast(t('toast_success_dentist_add'), "success");
                    targetAddDentistaModal.classList.add('hidden');
                    renderAllUIComponents(); // Re-renderiza a UI para mostrar o novo dentista
                    
                    // Pré-seleciona automaticamente o novo dentista no formulário de produção
                    if (producaoDentistaSelect) {
                        producaoDentistaSelect.value = dentistaData.id;
                    }
                    if (producaoDentistaInput) {
                        producaoDentistaInput.value = dentistaData.nome;
                    }
                    updateOrderPreview();
                } catch (error) {
                    // Se falhar, remove o dentista que foi adicionado localmente
                    state.dentistas.pop();
                    showToast(t('toast_error_save_dentist'));
                } finally {
                    setButtonLoading(submitButton, false);
                }
            });
        }
    }

    // Formulários
    if (formPix) {
        formPix.addEventListener('submit', (e) => {
            e.preventDefault();
            state.pixKey = pixKeyInput.value.trim();
            state.pixName = pixNameInput.value.trim();
            state.pixCity = pixCityInput.value.trim();
            saveDataToFirestore().then(() => {
                showToast("Configuração PIX salva com sucesso!", "success");
            });
        });
    }

    if (formFechamento) {
        formFechamento.addEventListener('submit', (e) => {
            e.preventDefault();
            const diaInicio = parseInt(fechamentoDiaInicioInput.value);
            const diaFim = parseInt(fechamentoDiaFimInput.value);
    
            if (diaInicio >= 1 && diaInicio <= 31 && diaFim >= 1 && diaFim <= 31) {
                state.closingDayStart = diaInicio;
                state.closingDayEnd = diaFim;
                saveDataToFirestore().then(() => {
                    showToast(t('toast_success_cycle_save'), "success");
                    renderAllUIComponents();
                    updateCharts();
                });
            } else {
                showToast(t('toast_invalid_days'));
            }
        });
    }

    if (formDentista) {
        formDentista.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = dentistaEditIdInput.value ? parseInt(dentistaEditIdInput.value) : Date.now();
            const nome = dentistaNomeInput.value.trim();
            if (!nome) { showToast(t('toast_fill_dentist_name')); return; }
            
            const customClosingDayStart = parseInt(dentistaCicloInicioInput.value) || '';
            const customClosingDayEnd = parseInt(dentistaCicloFimInput.value) || '';

            if (dentistaEditIdInput.value) {
                const index = state.dentistas.findIndex(d => d.id === id);
                if (index !== -1) {
                    // Mantém a estrutura de valores existente ao editar
                    const existingValores = state.dentistas[index].valores || [];
                    state.dentistas[index] = {
                        ...state.dentistas[index],
                        id,
                        nome,
                        clinica: dentistaClinicaInput.value.trim(),
                        telefone: dentistaTelefoneInput.value.trim(),
                        email: dentistaEmailInput.value.trim(),
                        valores: existingValores,
                        customClosingDayStart,
                        customClosingDayEnd
                    };
                    showToast(t('toast_success_dentist_update'), "success");
                }
            } else {
                // Adiciona um novo dentista com uma lista de valores vazia
                const dentistaData = {
                    id,
                    nome,
                    clinica: dentistaClinicaInput.value.trim(),
                    telefone: dentistaTelefoneInput.value.trim(),
                    email: dentistaEmailInput.value.trim(),
                    valores: [],
                    customClosingDayStart,
                    customClosingDayEnd
                };
                state.dentistas.push(dentistaData); 
                showToast(t('toast_success_dentist_add'), "success");
            }
            saveDataToFirestore(formDentistaSubmitBtn);
            cancelEditDentista();
        });
    }

    if(formDentistaCancelBtn) formDentistaCancelBtn.addEventListener('click', cancelEditDentista);

    if (formDentistaValores) {
        formDentistaValores.addEventListener('submit', (e) => {
            e.preventDefault();
            const dentistaId = parseInt(dentistaEditIdInput.value);
            if (!dentistaId) return;

            const tipo = dentistaTipoTrabalhoSelect.value;
            const valor = parseFloat(dentistaValorTrabalhoInput.value);

            if (!tipo || isNaN(valor) || valor < 0) {
                showToast(t('toast_fill_all_fields'));
                return;
            }

            const dentista = state.dentistas.find(d => d.id === dentistaId);
            if (!dentista) return;

            if (editingValorIndex !== null) {
                // Atualizando um valor existente
                if (dentista.valores && dentista.valores[editingValorIndex]) {
                    dentista.valores[editingValorIndex] = { tipo, valor };
                    showToast(t('toast_success_price_update'), "success");
                }
            } else {
                // Adicionando um novo valor
                if (!dentista.valores) dentista.valores = [];
                dentista.valores.push({ tipo, valor });
                showToast(t('toast_success_price_add'), "success");
            }

            renderizarValoresDentista(dentistaId);
            cancelEditDentistaValor(); // Reseta o formulário e o estado de edição
        });
    }

    if (listaDentistaValores) {
        listaDentistaValores.addEventListener('click', async (e) => {
            const removeBtn = e.target.closest('.remove-dentista-valor-btn');
            const editBtn = e.target.closest('.edit-dentista-valor-btn');
            const dentistaId = parseInt(dentistaEditIdInput.value);

            if (editBtn) {
                const index = parseInt(editBtn.dataset.index);
                startEditDentistaValor(dentistaId, index);
            } else if (removeBtn) {
                const index = parseInt(removeBtn.dataset.index);
                const dentista = state.dentistas.find(d => d.id === dentistaId);
                if (dentista && dentista.valores && dentista.valores[index]) {
                    const confirmed = await showConfirmationModal(
                        t('modal_confirm_title'),
                        t('toast_confirm_remove_price')
                    );
                    if (confirmed) {
                        dentista.valores.splice(index, 1);
                        renderizarValoresDentista(dentistaId);
                        showToast(t('toast_success_price_remove'), "success");
                    }
                }
            }
        });
    }

    if(listaDentistas) {
    listaDentistas.addEventListener('click', async (e) => { // [MODIFICADO] Adicionado 'async'
        const editButton = e.target.closest('.edit-dentista-btn');
        const removeButton = e.target.closest('.remove-dentista-btn');

        if (editButton) { 
            startEditDentista(parseInt(editButton.dataset.id)); 
        }

        else if (removeButton) {
            const dentistaId = parseInt(removeButton.dataset.id);

            // [MODIFICADO] Chamando o novo modal
            const confirmed = await showConfirmationModal(
                t('modal_confirm_title'), 
                t('toast_confirm_remove_dentist')
            );

            if (confirmed) { 
                state.dentistas = state.dentistas.filter(d => d.id !== dentistaId); 
                saveDataToFirestore(); 
                showToast(t('toast_success_dentist_remove'), "success"); 
            } 
        }
    });
}

    if(formValores) formValores.addEventListener('submit', async (e) => { 
        e.preventDefault(); 
        const tipo = tipoTrabalhoInput.value.trim(); 
        const valor = parseFloat(valorTrabalhoInput.value); 
        
        if (tipo && !isNaN(valor)) { 
            if (editingGlobalValorIndex !== null) {
                // UPDATE
                const oldTipo = state.valores[editingGlobalValorIndex].tipo;
                state.valores[editingGlobalValorIndex] = { tipo, valor };
                
                // Update productions
                let updatedCount = 0;
                // Get current billing period to verify if update is needed for the month
                // The requirement is "update productions that have already been registered in the month"
                // Assuming "in the month" refers to the current selected view month or literally "this calendar month"?
                // The user said: "atualize as produções que já foram cadastradas no mês"
                // Given the app is often used to view past/future, but typically data entry is current,
                // and to be safe and consistent (and since the instruction is slightly ambiguous about *which* month),
                // it is safer to update ALL productions that match the type to maintain consistency, OR just the current view month.
                // HOWEVER, typically if you change the price of a service in settings, you expect it to apply to your current work.
                // Let's stick to the user's specific "registradas no mês" (registered in the month).
                // We'll use the 'getBillingPeriod' for the current state.mesAtual which controls the view.
                
                const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
                
                state.producao.forEach(p => {
                    const dataProducao = new Date(p.data + "T00:00:00");
                    // Check if production is within the current billing month view
                    if (p.tipo === oldTipo && dataProducao >= startDate && dataProducao <= endDate) {
                        p.tipo = tipo; // Update name (if changed)
                        // Note: Production objects don't explicitly store 'valor' (it's derived from p.tipo + p.qtd during render),
                        // EXCEPT for the fact that render functions look up the value from state.valores.
                        // SO, by updating state.valores (which we did above), the value is AUTOMATICALLY updated for all records
                        // because it's a relational lookup!
                        //
                        // WAIT. Let's re-read renderizarProducaoDia.
                        // const valorGlobal = (state.valores || []).find(v => v.tipo === producao.tipo);
                        // YES. The value is looked up dynamically.
                        //
                        // So why did the user ask to "update productions"?
                        // 1. Maybe they want the NAME update to propagate (handled).
                        // 2. Maybe they think the value is stored in the object?
                        // Let's check `producaoData` in `formProducao` submit handler.
                        // It stores: id, tipo, dentista, nomePaciente, qtd, status, obs, data, entrega, anexoURL.
                        // It DOES NOT store the value.
                        //
                        // Therefore, simply updating `state.valores` updates the calculated value for ALL productions (past and future)
                        // that share that type name.
                        //
                        // BUT, if we renamed the type (oldTipo !== tipo), we MUST update p.tipo.
                        //
                        // Issue: If I change "Limpeza" ($100) to "Limpeza" ($120), all "Limpeza" records ever made now show $120.
                        // If the user request "update productions registered in the month", it implies they might NOT want to update past months?
                        // But since the data model doesn't snapshot the price on creation, we can't easily support historical prices 
                        // without changing the data model (adding a 'valorSnapshot' field to production).
                        //
                        // Given the constraints and the current codebase, the only thing we explicitly need to "update" on the production object
                        // is the 'tipo' string if it changed. The value update happens automatically by reference.
                        //
                        // HOWEVER, to be absolutely sure we fulfill the "registered in the month" requirement:
                        // If the data model WAS storing value, we'd update it here.
                        // Since it's not, we just ensure the type name is updated for those records.
                        //
                        // Let's stick to updating the type name for records in the current month as requested, 
                        // BUT, if we only update the name for this month, and we renamed "A" to "B", 
                        // then "A" records from last month will point to a non-existent value type "A" (since we overwrote it in state.valores).
                        // This would break historical data (showing $0 or error).
                        //
                        // ERROR IN LOGIC: If we rename a Value Type in `state.valores`, we effectively delete the old key.
                        // Any production record (from any date) that references the old name will break.
                        // Therefore, we MUST update ALL production records globally to the new name to preserve integrity.
                        //
                        // RE-READING USER REQUEST: "que também atualize as produções que já foram cadastradas no mês."
                        // Maybe they simply mean "Make sure the calculations for this month reflect the new price".
                        // Since the price is dynamic, this happens automatically.
                        //
                        // So the only critical code action is updating the TIPO string on the production objects if the name changed.
                        // And for integrity, it really should be ALL records, not just this month's, or history breaks.
                        //
                        // Let's assume the user's "in the month" comment was context (what they are looking at) rather than a strict constraint to BREAK history.
                        // I will update ALL records to ensure data integrity.
                        
                        updatedCount++;
                    } else if (p.tipo === oldTipo) {
                         // Even if it's not in this month, we must update the name or the link is broken
                         p.tipo = tipo;
                         updatedCount++;
                    }
                });

                if (updatedCount > 0) {
                     console.log(`Updated ${updatedCount} productions from ${oldTipo} to ${tipo}`);
                }
                
                showToast(t('toast_success_value_update'), "success");
                cancelEditGlobalValor();
            } else {
                // CREATE
                state.valores.push({ tipo, valor }); 
                showToast(t('toast_success_value_add'), "success");
                formValores.reset(); 
            }
            
            await saveDataToFirestore(); 
            renderAllUIComponents(); // This will refresh the list
        } 
    });

    if(listaValores) {
    listaValores.addEventListener('click', async (e) => { // [MODIFICADO] Adicionado 'async'
        const removeBtn = e.target.closest('.remove-valor-btn'); 
        const editBtn = e.target.closest('.edit-valor-btn');

        if (editBtn) {
            const index = parseInt(editBtn.dataset.index);
            startEditGlobalValor(index);
        } else if (removeBtn) { 
            const index = removeBtn.dataset.index;
            // Pega o nome do trabalho para deixar a mensagem mais clara
            const tipoTrabalho = state.valores[index]?.tipo || 'este item'; 

            // [MODIFICADO] Chamando o novo modal
            const confirmed = await showConfirmationModal(
                t('modal_confirm_title'), 
                `${t('toast_confirm_remove_value')} "${tipoTrabalho}"?`
            );

            if (confirmed) {
                state.valores.splice(index, 1); 
                saveDataToFirestore(); 
                showToast(t('toast_success_value_remove'), "success"); 
            }
        } 
    });
}
    
    if(formProducao){
        if (formProducaoAddItemBtn) {
            formProducaoAddItemBtn.addEventListener('click', () => {
                producaoItemsContainer.appendChild(createMainFormItemRow());
                updateMainRemoveButtonsVisibility();
                updateOrderPreview();
            });
        }

        if (producaoItemsContainer) {
            producaoItemsContainer.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-main-item-btn');
                if (removeBtn) {
                    const row = removeBtn.closest('.main-work-item-group');
                    if (row) {
                        row.remove();
                        updateMainRemoveButtonsVisibility();
                        updateOrderPreview();
                    }
                }
            });
        }

        formProducao.addEventListener('submit', async (e) => { 
            e.preventDefault();
            const originalButtonText = producaoSubmitBtn.textContent;
            setButtonLoading(producaoSubmitBtn, true, originalButtonText);

            const file = (producaoAnexoInput && producaoAnexoInput.files) ? producaoAnexoInput.files[0] : null;
            let anexoURL = null;

            if (file) {
                const storageRef = ref(storage, `users/${userId}/attachments/${Date.now()}_${file.name}`);
                try {
                    const snapshot = await uploadBytes(storageRef, file);
                    anexoURL = await getDownloadURL(snapshot.ref);
                } catch (error) {
                    console.error("Erro no upload: ", error);
                    showToast(t('toast_upload_fail'));
                    setButtonLoading(producaoSubmitBtn, false);
                    return;
                }
            }
            
            const editId = producaoEditIdInput.value ? parseInt(producaoEditIdInput.value) : null;
            
            let dentistaObj = null;
            if (producaoDentistaSelect && producaoDentistaSelect.value) {
                dentistaObj = (state.dentistas || []).find(d => String(d.id) === String(producaoDentistaSelect.value));
            }
            if (!dentistaObj && producaoDentistaInput) {
                const dentistaNome = producaoDentistaInput.value.trim().toLowerCase();
                dentistaObj = (state.dentistas || []).find(d => d.nome.toLowerCase() === dentistaNome || String(d.id) === dentistaNome);
            }
            
            if (!dentistaObj) {
                showToast(t('toast_dentist_not_found'));
                setButtonLoading(producaoSubmitBtn, false);
                return;
            }

            const nomePaciente = producaoPacienteInput.value.trim();
            const status = producaoStatusSelect.value;
            const obs = producaoObsInput.value.trim();
            const data = producaoDataInput.value;
            const entrega = entregaDataInput.value;

            if (!nomePaciente || !data || !entrega) {
                 showToast(t('toast_fill_all_fields'));
                 setButtonLoading(producaoSubmitBtn, false);
                 return;
            }

            // Gather items
            const itemRows = producaoItemsContainer.querySelectorAll('.main-work-item-group');
            const itemsToProcess = [];
            let validationError = false;

            itemRows.forEach(row => {
                const tipo = row.querySelector('.main-producao-tipo-select').value;
                const qtd = parseInt(row.querySelector('.main-producao-qtd-input').value) || 0;

                if (!tipo || qtd <= 0) {
                    validationError = true;
                } else {
                    itemsToProcess.push({ tipo, qtd });
                }
            });

            if (validationError || itemsToProcess.length === 0) {
                showToast(t('toast_fill_all_fields'));
                setButtonLoading(producaoSubmitBtn, false);
                return;
            }

            try {
                if (editId) { 
                    // EDIT MODE - Expect single item (enforced by UI)
                    // But we use the first valid item found in the form
                    const item = itemsToProcess[0];
                    const index = state.producao.findIndex(p => p.id === editId); 

                    if (index !== -1) {
                        const producaoData = {
                            ...state.producao[index],
                            tipo: item.tipo,
                            dentista: dentistaObj.id,
                            nomePaciente,
                            qtd: item.qtd,
                            status,
                            obs,
                            data,
                            entrega,
                            anexoURL: anexoURL || state.producao[index].anexoURL
                        };
                        state.producao[index] = producaoData; 
                        showToast(t('toast_success_production_update'), "success");
                    } 
                } else { 
                    // ADD MODE - Multiple items
                    const baseId = Date.now();
                    itemsToProcess.forEach((item, index) => {
                        const producaoData = {
                            id: baseId + index,
                            tipo: item.tipo,
                            dentista: dentistaObj.id,
                            nomePaciente,
                            qtd: item.qtd,
                            status,
                            obs,
                            data,
                            entrega,
                            anexoURL: anexoURL
                        };
                        state.producao.push(producaoData);
                    });
                    showToast(t('toast_success_production_add'), "success");
                }

                await saveDataToFirestore();
                cancelEditProducao();
                renderAllUIComponents();
            } catch (error) {
                console.error(error);
                showToast(t('toast_error_save_production'));
            } finally {
                setButtonLoading(producaoSubmitBtn, false);
            }
        });
    }

    if(producaoCancelBtn) producaoCancelBtn.addEventListener('click', cancelEditProducao);
    if(listaProducaoDia) {
    listaProducaoDia.addEventListener('click', async (e) => { // [MODIFICADO] Adicionado 'async'
        const removeBtn = e.target.closest('.remove-producao-btn');
        const editBtn = e.target.closest('.edit-producao-btn');

        if (removeBtn) { 
            const producaoId = parseInt(removeBtn.dataset.id);

            // [MODIFICADO] Chamando o novo modal
            const confirmed = await showConfirmationModal(
                t('modal_confirm_title'), 
                t('toast_confirm_remove_production')
            );

            if (confirmed) { 
                state.producao = state.producao.filter(p => p.id !== producaoId); 
                saveDataToFirestore(); 
                showToast(t('toast_success_production_remove'), "success"); 
            }
        }

        else if (editBtn) { // [MODIFICADO] Mudei para 'else if'
            startEditProducao(parseInt(editBtn.dataset.id)); 
        }
    });
}
    if(producaoDataInput) producaoDataInput.addEventListener('change', renderizarProducaoDia);
    
    if(formDespesas) {
        formDespesas.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = despesaEditIdInput.value ? parseInt(despesaEditIdInput.value) : null;
            const despesaData = { 
                id: editId || Date.now(), 
                desc: despesaDescInput.value.trim(), 
                categoria: despesaCategoriaSelect.value, 
                valor: parseFloat(despesaValorInput.value), 
                data: despesaDataInput.value,
                recorrente: despesaRecorrenteCheckbox.checked
            };
            if (despesaData.desc && !isNaN(despesaData.valor) && despesaData.data) {
                if (editId) { 
                    const index = state.despesas.findIndex(d => d.id === editId); 
                    if (index !== -1) { 
                        state.despesas[index] = despesaData; 
                        showToast(t('toast_success_expense_update'), "success"); 
                    } 
                } else { 
                    state.despesas.push(despesaData); 
                    showToast(t('toast_success_expense_add'), "success"); 
                }
                renderAllUIComponents();
                saveDataToFirestore(formDespesaSubmitBtn);
                cancelEditDespesa();
            } else { showToast(t('toast_fill_expense_fields')); }
        });
    }

    if(formDespesaCancelBtn) formDespesaCancelBtn.addEventListener('click', cancelEditDespesa);

    // Estoque
    if (formEstoque) {
        formEstoque.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = estoqueEditIdInput.value ? parseInt(estoqueEditIdInput.value) : Date.now();
            const itemData = {
                id,
                nome: estoqueNomeInput.value.trim(),
                fornecedor: estoqueFornecedorInput.value.trim(),
                qtd: parseFloat(estoqueQtdInput.value),
                unidade: estoqueUnidadeInput.value.trim(),
                min: parseFloat(estoqueMinInput.value),
                preco: parseFloat(estoquePrecoInput.value)
            };
            if (!itemData.nome || isNaN(itemData.qtd) || !itemData.unidade || isNaN(itemData.min)) {
                showToast(t('toast_fill_material_fields'));
                return;
            }
            if (estoqueEditIdInput.value) {
                const index = state.estoque.findIndex(i => i.id === id);
                if (index !== -1) state.estoque[index] = itemData;
            } else {
                state.estoque.push(itemData);
            }
            saveDataToFirestore(formEstoqueSubmitBtn);
            cancelEditEstoque();
            showToast(t('toast_success_material_save'), "success");
        });
    }
    if (formEstoqueCancelBtn) formEstoqueCancelBtn.addEventListener('click', cancelEditEstoque);
    if (listaEstoque) {
    listaEstoque.addEventListener('click', async (e) => { // [MODIFICADO] Adicionado 'async'
        const editBtn = e.target.closest('.edit-estoque-btn');
        const removeBtn = e.target.closest('.remove-estoque-btn'); // [NOVO]

        if (editBtn) {
            startEditEstoque(parseInt(editBtn.dataset.id));
        } 
        else if (removeBtn) { // [MODIFICADO] Mudei para 'else if'
            const itemId = parseInt(removeBtn.dataset.id);

            // [MODIFICADO] Chamando o novo modal
            const confirmed = await showConfirmationModal(
                t('modal_confirm_title'), 
                t('toast_confirm_remove_material')
            );

            if (confirmed) {
                state.estoque = state.estoque.filter(i => i.id !== itemId);
                saveDataToFirestore();
                showToast(t('toast_success_material_remove'), "success");
            }
        }
    });
}
    
    const changeMonth = (offset) => {
        const d = new Date(state.mesAtual);
        d.setMonth(d.getMonth() + offset);
        state.mesAtual = d;
        renderAllUIComponents();
        updateCharts();
        checkAndCreateRecurringExpenses(); 
        saveDataToFirestore();
    };

    if(prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if(nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));
    if(dashboardPrevMonthBtn) dashboardPrevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if(dashboardNextMonthBtn) dashboardNextMonthBtn.addEventListener('click', () => changeMonth(1));

    if(verTodasDespesasBtn) verTodasDespesasBtn.addEventListener('click', () => { navigateToView('view-despesas'); });
    if(closeDespesasModalBtn) closeDespesasModalBtn.addEventListener('click', () => { despesasModal.classList.add('hidden'); });

    // Lista de despesas na nova aba
    if(listaDespesasCompleta) {
        listaDespesasCompleta.addEventListener('click', async (e) => {
            const editButton = e.target.closest('.edit-despesa-btn');
            if (editButton) { startEditDespesa(Number(editButton.dataset.id)); }
            const removeButton = e.target.closest('.remove-despesa-btn');
            if (removeButton) {
                const confirmed = await showConfirmationModal(
                    t('modal_confirm_title'),
                    t('toast_confirm_remove_expense')
                );
                if (confirmed) {
                    const idToRemove = Number(removeButton.dataset.id);
                    state.despesas = state.despesas.filter(d => d.id !== idToRemove);
                    saveDataToFirestore();
                    renderizarListaDespesasCompleta();
                    showToast(t('toast_success_expense_remove'), "success");
                }
            }
        });
    }

    if(listaDespesasDetalhada) {
        listaDespesasDetalhada.addEventListener('click', async (e) => {
            const editButton = e.target.closest('.edit-despesa-btn');
            if (editButton) { startEditDespesa(Number(editButton.dataset.id)); }
            const removeButton = e.target.closest('.remove-despesa-btn');
            if (removeButton) { 
                const confirmed = await showConfirmationModal(
                    t('modal_confirm_title'), 
                    t('toast_confirm_remove_expense')
                );
                if (confirmed) { 
                    state.despesas = state.despesas.filter(d => d.id !== Number(removeButton.dataset.id)); 
                    saveDataToFirestore(); 
                    renderizarListaDespesasDetalhada();
                    renderizarListaDespesasCompleta();
                    showToast(t('toast_success_expense_remove'), "success"); 
                } 
            }
        });
    }

    // --- CRONOGRAMA DE ENTREGAS & PRAZOS (DASHBOARD) ---
    if (listaEntregasProximas) {
        listaEntregasProximas.addEventListener('click', async (e) => {
            const finalizeButton = e.target.closest('.finalize-entrega-btn');
            const viewInProducaoBtn = e.target.closest('.view-in-producao-btn');
            const resetFilterBtn = e.target.closest('#btn-reset-entregas-filter');
            const whatsappBtn = e.target.closest('.whatsapp-btn');
            const header = e.target.closest('.entrega-item-header');

            if (whatsappBtn) {
                // Deixa o link abrir normalmente
                return;
            }

            if (finalizeButton) {
                e.stopPropagation();
                const producaoId = parseInt(finalizeButton.dataset.id);
                const producaoIndex = (state.producao || []).findIndex(p => p.id === producaoId);
                if (producaoIndex !== -1) {
                    const item = state.producao[producaoIndex];
                    item.status = 'Finalizado';
                    await saveDataToFirestore();
                    const nome = item.nomePaciente ? `"${item.nomePaciente}"` : 'Trabalho';
                    showToast(`Entrega de ${nome} concluída e finalizada!`, "success");
                    renderAllUIComponents(false);
                }
            } else if (viewInProducaoBtn) {
                e.stopPropagation();
                const paciente = viewInProducaoBtn.dataset.paciente;
                if (searchProducaoInput && paciente) {
                    searchProducaoInput.value = paciente;
                    state.searchTermProducao = paciente;
                }
                if (filterStatusSelect) filterStatusSelect.value = '';
                if (filterDataInicio) filterDataInicio.value = '';
                if (filterDataFim) filterDataFim.value = '';
                if (filterProducaoDentistaMain) filterProducaoDentistaMain.value = '';
                if (filterProducaoTipo) filterProducaoTipo.value = '';
                state.producaoQuickFilter = 'todos';
                renderizarProducaoDia();
                navigateToView('view-producao');
            } else if (resetFilterBtn) {
                e.stopPropagation();
                state.dashboardEntregasFilter = 'todos';
                state.dashboardEntregasSearch = '';
                const searchInput = document.getElementById('search-entregas-input');
                if (searchInput) searchInput.value = '';
                document.querySelectorAll('.btn-entregas-filter').forEach(b => {
                    b.classList.toggle('active', b.dataset.filter === 'todos');
                });
                renderizarEntregasDashboard();
            } else if (header) {
                const container = header.closest('.entrega-item-container');
                if (container) {
                    const details = container.querySelector('.entrega-item-details');
                    const icon = header.querySelector('.entrega-expand-icon');
                    if (details) details.classList.toggle('hidden');
                    if (icon) icon.classList.toggle('rotate-180');
                }
            }
        });
    }

    // Filtros por Período de Entregas no Dashboard
    document.querySelectorAll('.btn-entregas-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = btn.dataset.filter || 'todos';
            state.dashboardEntregasFilter = filter;
            document.querySelectorAll('.btn-entregas-filter').forEach(b => {
                b.classList.toggle('active', b.dataset.filter === filter);
            });
            renderizarEntregasDashboard();
        });
    });

    // Busca de Entregas no Dashboard
    const searchEntregasInput = document.getElementById('search-entregas-input');
    const clearSearchEntregasBtn = document.getElementById('clear-search-entregas-btn');
    if (searchEntregasInput) {
        searchEntregasInput.addEventListener('input', (e) => {
            state.dashboardEntregasSearch = e.target.value;
            renderizarEntregasDashboard();
        });
    }
    if (clearSearchEntregasBtn) {
        clearSearchEntregasBtn.addEventListener('click', () => {
            if (searchEntregasInput) searchEntregasInput.value = '';
            state.dashboardEntregasSearch = '';
            renderizarEntregasDashboard();
        });
    }

    // --- LÓGICA DE DESPESAS RECORRENTES ---
    const checkAndCreateRecurringExpenses = () => {
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const recurringExpenses = (state.despesas || []).filter(d => d.recorrente);
        let createdNewExpense = false;

        recurringExpenses.forEach(recurrent => {
            const alreadyExists = (state.despesas || []).some(d => 
                d.desc === recurrent.desc &&
                d.valor === recurrent.valor &&
                new Date(d.data + "T00:00:00") >= startDate &&
                new Date(d.data + "T00:00:00") <= endDate
            );

            if (!alreadyExists) {
                // Determine the target date based on the recurrent day
                // We check both possible months (start month and end month) to see where the day fits
                const recurrentDay = new Date(recurrent.data + "T00:00:00").getDate();
                const candidate1 = new Date(startDate.getFullYear(), startDate.getMonth(), recurrentDay);
                const candidate2 = new Date(endDate.getFullYear(), endDate.getMonth(), recurrentDay);

                let targetDate = null;

                // Prioritize the date that falls strictly within the billing period
                if (candidate1 >= startDate && candidate1 <= endDate) {
                    targetDate = candidate1;
                } else if (candidate2 >= startDate && candidate2 <= endDate) {
                    targetDate = candidate2;
                }

                if (targetDate) {
                    const newExpense = {
                        ...recurrent,
                        id: Date.now() + Math.random(),
                        data: targetDate.toISOString().split('T')[0],
                        recorrente: false // A nova despesa não é o "molde" recorrente
                    };
                    state.despesas.push(newExpense);
                    createdNewExpense = true;
                    addNotification(`Despesa recorrente '${newExpense.desc}' criada para este mês.`, 'info');
                }
            }
        });

        if (createdNewExpense && isDataLoaded) {
            // Usa debounce via setTimeout ou ignora e delega a uma interação do usuário
            // Aqui garantimos que apenas chame caso os dados já estejam totalmente carregados.
            setTimeout(() => {
                 saveDataToFirestore();
            }, 1000);
        }
    };


    // --- INICIALIZAÇÃO ---
    const initApp = () => {
        document.querySelectorAll('button[type="submit"]').forEach(button => {
            button.dataset.originalText = button.innerHTML;
        });
        const hojeStr = getTodayDateString();
        if (producaoDataInput) producaoDataInput.value = hojeStr;
        if (entregaDataInput) entregaDataInput.value = hojeStr;
        if (despesaDataInput) despesaDataInput.value = hojeStr;
        
        // Inicializar formulário de produção com uma linha
        if (producaoItemsContainer) {
            producaoItemsContainer.innerHTML = '';
            producaoItemsContainer.appendChild(createMainFormItemRow());
            updateMainRemoveButtonsVisibility();
        }

        initLanguage();
        setTimeout(initializeCharts, 100);
    };

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
                if (user) {
                    userId = user.uid;
                    userEmailDisplay.textContent = user.email;
                    
                    authScreen.classList.add('hidden');
                    appContent.classList.remove('hidden');
                    
                    initialLoadingOverlay.classList.remove('hidden');
                    initialLoadingOverlay.classList.remove('splash-fade-out');
                    
                    setTimeout(() => {
                        initialLoadingOverlay.classList.add('splash-fade-out');
                        setTimeout(() => {
                            initialLoadingOverlay.classList.add('hidden');
                            initialLoadingOverlay.classList.remove('splash-fade-out');
                        }, 600);
                    }, 1500);

                    setupFirestoreListener(userId);
                } else {
                    userId = null;
                    if (unsubscribeFromFirestore) unsubscribeFromFirestore();
                    appContent.classList.add('hidden');
                    authScreen.classList.remove('hidden');
                    initialLoadingOverlay.classList.add('hidden');
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

    // --- LÓGICA DO MODAL DE EXPORTAÇÃO / NOTA PERSONALIZADA ---
    const exportPdfModal = document.getElementById('export-pdf-modal');
    const closeExportModalBtn = document.getElementById('close-export-modal-btn');
    const cancelExportModalBtn = document.getElementById('cancel-export-modal-btn');
    const exportModalStep1 = document.getElementById('export-modal-step-1');
    const exportModalStep2 = document.getElementById('export-modal-step-2');
    const exportOptionA = document.getElementById('export-option-a');
    const exportOptionB = document.getElementById('export-option-b');
    const backToStep1Btn = document.getElementById('back-to-step-1');
    
    const customExportStartDate = document.getElementById('custom-export-start-date');
    const customExportEndDate = document.getElementById('custom-export-end-date');
    const searchCustomExportBtn = document.getElementById('search-custom-export-btn');
    const customExportResultsList = document.getElementById('custom-export-results-list');
    const customExportSelectAll = document.getElementById('custom-export-select-all');
    const generateCustomPixBtn = document.getElementById('generate-custom-pix-btn');
    const customExportTotalEl = document.getElementById('custom-export-total');
    const modalExportDentistaSelect = document.getElementById('modal-export-dentista-select');

    let customExportSelectedItems = [];
    let currentExportContext = 'dentista';

    const openExportModal = (context = 'dentista') => {
        currentExportContext = context;
        if (context === 'dentista') {
            const selectedDentistaId = filterDentistaSelect.value;
            if (!selectedDentistaId) {
                showToast(t('toast_select_dentist_pdf') || 'Selecione um dentista primeiro.');
                return;
            }
        }
        exportPdfModal.classList.remove('hidden');
        exportModalStep1.classList.remove('hidden');
        exportModalStep2.classList.add('hidden');
        exportModalStep1.classList.add('flex');
        exportModalStep2.classList.remove('flex');
        
        if (modalExportDentistaSelect) {
            modalExportDentistaSelect.innerHTML = '<option value="todos">Todos os Dentistas</option>';
            state.dentistas.forEach(d => {
                const option = document.createElement('option');
                option.value = d.id;
                option.textContent = d.nome;
                modalExportDentistaSelect.appendChild(option);
            });
            if (context === 'dentista' && typeof filterDentistaSelect !== 'undefined' && filterDentistaSelect.value) {
                modalExportDentistaSelect.value = filterDentistaSelect.value;
            } else {
                modalExportDentistaSelect.value = 'todos';
            }
        }
        
        // Reset filters
        customExportStartDate.value = '';
        customExportEndDate.value = '';
        customExportResultsList.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gemini-secondary">Selecione as datas e clique em Buscar</td></tr>';
        customExportTotalEl.textContent = 'R$ 0,00';
        customExportSelectAll.checked = false;
    };

    const closeExportModal = () => {
        exportPdfModal.classList.add('hidden');
    };

    if (closeExportModalBtn) closeExportModalBtn.addEventListener('click', closeExportModal);
    if (cancelExportModalBtn) cancelExportModalBtn.addEventListener('click', closeExportModal);

    if (exportOptionA) {
        exportOptionA.addEventListener('click', () => {
            switch(currentExportContext) {
                case 'dashboard':
                    generateDashboardPDF();
                    break;
                case 'producao':
                    generateProducaoPDF(); // PDF com toda a produção do mês
                    break;
                case 'dentistas':
                    generateProducaoDentistaPDF(); // PDF do dentista selecionado
                    break;
                case 'analise':
                    generateAnalisePDF();
                    break;
                case 'resumo':
                    generateResumoPDF();
                    break;
                default:
                    generateProducaoPDF();
                    break;
            }
            closeExportModal();
        });
    }

    if (exportOptionB) {
        exportOptionB.addEventListener('click', () => {
            exportModalStep1.classList.add('hidden');
            exportModalStep1.classList.remove('flex');
            exportModalStep2.classList.remove('hidden');
            exportModalStep2.classList.add('flex');
        });
    }

    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', () => {
            exportModalStep2.classList.add('hidden');
            exportModalStep2.classList.remove('flex');
            exportModalStep1.classList.remove('hidden');
            exportModalStep1.classList.add('flex');
        });
    }

    const renderCustomExportResults = (results, dentista) => {
        customExportResultsList.innerHTML = '';
        if (results.length === 0) {
            customExportResultsList.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gemini-secondary">Nenhum trabalho encontrado no período.</td></tr>';
            return;
        }

        results.forEach(p => {
            const valorDentista = (dentista.valores || []).find(v => v.tipo === p.tipo);
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const valorUnitario = valorFinal ? valorFinal.valor : 0;
            const valorTotal = valorUnitario * p.qtd;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-2 border-b border-gemini-border text-center">
                    <input type="checkbox" class="custom-export-item-checkbox cursor-pointer rounded border-gray-600 bg-gray-700 text-accent-purple focus:ring-accent-purple" 
                           data-id="${p.id}" 
                           data-paciente="${p.nomePaciente || ''}" 
                           data-tipo="${p.tipo}" 
                           data-qtd="${p.qtd}" 
                           data-valor="${valorTotal}">
                </td>
                <td class="p-2 border-b border-gemini-border text-white">${new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td class="p-2 border-b border-gemini-border text-white">${p.nomePaciente || '-'}</td>
                <td class="p-2 border-b border-gemini-border text-white">${p.tipo} (${p.qtd}x)</td>
                <td class="p-2 border-b border-gemini-border text-white text-right">${formatarMoeda(valorTotal)}</td>
            `;
            customExportResultsList.appendChild(tr);
        });

        // Add listeners to new checkboxes
        document.querySelectorAll('.custom-export-item-checkbox').forEach(cb => {
            cb.addEventListener('change', updateCustomExportTotal);
        });
    };

    const updateCustomExportTotal = () => {
        let total = 0;
        document.querySelectorAll('.custom-export-item-checkbox:checked').forEach(cb => {
            total += parseFloat(cb.dataset.valor || 0);
        });
        customExportTotalEl.textContent = formatarMoeda(total);
        
        // Update select all checkbox state
        const allBoxes = document.querySelectorAll('.custom-export-item-checkbox');
        const checkedBoxes = document.querySelectorAll('.custom-export-item-checkbox:checked');
        if (allBoxes.length > 0) {
            customExportSelectAll.checked = allBoxes.length === checkedBoxes.length;
        }
    };

    if (searchCustomExportBtn) {
        searchCustomExportBtn.addEventListener('click', () => {
            const start = customExportStartDate.value;
            const end = customExportEndDate.value;
            const selectedDentistaId = modalExportDentistaSelect ? modalExportDentistaSelect.value : 'todos';
            
            if (!start || !end) {
                showToast('Selecione as datas inicial e final.', 'error');
                return;
            }

            const dentista = (state.dentistas || []).find(d => d.id == selectedDentistaId);
            
            const startDate = new Date(start + "T00:00:00");
            const endDate = new Date(end + "T23:59:59");

            const producaoFiltrada = (state.producao || []).filter(p => {
                if (selectedDentistaId !== 'todos' && p.dentista != selectedDentistaId) return false;
                if (!p.data) return false;
                const dataProducao = new Date(p.data + "T00:00:00");
                return dataProducao >= startDate && dataProducao <= endDate;
            });
            
            producaoFiltrada.sort((a, b) => new Date(a.data) - new Date(b.data));

            renderCustomExportResults(producaoFiltrada, dentista || { nome: 'Todos' });
            updateCustomExportTotal();
        });
    }

    if (customExportSelectAll) {
        customExportSelectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.custom-export-item-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateCustomExportTotal();
        });
    }

    if (generateCustomPixBtn) {
        generateCustomPixBtn.addEventListener('click', () => {
            const selectedDentistaId = modalExportDentistaSelect ? modalExportDentistaSelect.value : 'todos';
            const dentista = (state.dentistas || []).find(d => d.id == selectedDentistaId) || { nome: 'Diversos', dentes: [] };
            
            const checkboxes = document.querySelectorAll('.custom-export-item-checkbox:checked');
            if (checkboxes.length === 0) {
                showToast('Selecione pelo menos um trabalho para gerar a cobrança.', 'error');
                return;
            }

            if (!state.pixKey || !state.pixName || !state.pixCity) {
                showToast('Configure a chave PIX, Nome e Cidade no painel Admin.', 'error');
                return;
            }

            let totalValor = 0;
            const selectedItems = [];

            checkboxes.forEach(cb => {
                const id = cb.dataset.id;
                const paciente = cb.dataset.paciente;
                const tipo = cb.dataset.tipo;
                const qtd = parseInt(cb.dataset.qtd) || 0;
                const valor = parseFloat(cb.dataset.valor) || 0;
                
                totalValor += valor;
                selectedItems.push({ id, paciente, tipo, qtd, valor });
            });

            if (totalValor <= 0) {
                showToast('O valor total da cobrança deve ser maior que zero.', 'error');
                return;
            }

            // Generate Payload PIX
            const payload = generatePixPayload(state.pixKey, totalValor, state.pixName, state.pixCity, `PGTO${Date.now()}`);

            // Generate QR Code
            const qrContainer = document.createElement('div');
            const qrcode = new QRCode(qrContainer, {
                text: payload,
                width: 200,
                height: 200,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.M
            });

            setTimeout(() => {
                const canvas = qrContainer.querySelector('canvas');
                if (canvas) {
                    const qrBase64 = canvas.toDataURL("image/png");
                    gerarPDFCobrancaPix(dentista, selectedItems, totalValor, qrBase64, payload);
                    closeExportModal();
                } else {
                    showToast('Erro ao gerar QR Code.', 'error');
                }
            }, 300);
        });
    }

});