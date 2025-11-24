// Import initialized instances
import { auth, db, storage, functions } from "./firebase-init.js";
// Import SDK functions needed
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

document.addEventListener('DOMContentLoaded', () => {
    
    let userId;
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
    const appContent = document.getElementById('app-content');

    // Auth elements removed as they are now in login.html
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
    const formProducao = document.getElementById('form-producao');
    const producaoTipoSelect = document.getElementById('producao-tipo-select');
    const producaoDentistaSelect = document.getElementById('producao-dentista-select');
    const producaoPacienteInput = document.getElementById('producao-paciente-input');
    const producaoQtdInput = document.getElementById('producao-qtd-input');
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
    const despesasBar = document.getElementById('despesas-bar');
    const faturamentoBar = document.getElementById('faturamento-bar');
    const despesasBarLabel = document.getElementById('despesas-bar-label');
    const faturamentoBarLabel = document.getElementById('faturamento-bar-label');
    const dentistaSummaryTableBody = document.getElementById('dentista-summary-table-body');
    const verTodasDespesasBtn = document.getElementById('ver-todas-despesas-btn');
    // const loadingModal = document.getElementById('loading-modal'); // Not used in main logic, kept if needed
    // const messageModal = document.getElementById('message-modal'); // Not used
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
    const quickProducaoDentistaSelect = document.getElementById('quick-producao-dentista-select');
    const quickProducaoPacienteInput = document.getElementById('quick-producao-paciente-input');
    const quickProducaoTipoSelect = document.getElementById('quick-producao-tipo-select');
    const quickProducaoQtdInput = document.getElementById('quick-producao-qtd-input');
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
    let state = {
        valores: [],
        producao: [],
        despesas: [],
        dentistas: [],
        estoque: [],
        quickNotes: [], // MUDADO DE "" PARA []
        activeQuickNoteId: null, // NOVO
        mesAtual: new Date().toISOString(),
        closingDayStart: 25,
        closingDayEnd: 24,
        searchTermProducao: '',
        searchTermDentistas: '',
        searchTermEstoque: '',
        notifications: [],
        showAllDentistas: false // controla Top 15 / Todos no gráfico
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    const toastNotification = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    let toastTimeout;

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
            notificationsList.innerHTML = '<div class="p-4 text-center text-gemini-secondary">Nenhuma notificação</div>';
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
    const initializeCharts = () => {
        // Gráfico de Faturamento por Dentista (Barras Horizontais)
        const dentistaCtx = document.getElementById('dentista-chart');
        if (dentistaCtx) {
            charts.dentista = new Chart(dentistaCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Faturamento',
                        data: [],
                        backgroundColor: [],
                        borderRadius: 8,
                        barThickness: 18
                    }]
                },
                options: {
                    indexAxis: 'y', // horizontal bars
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: function(items) {
                                    // Mostra o nome completo do dentista como título do tooltip
                                    if (!items || items.length === 0) return '';
                                    const idx = items[0].dataIndex;
                                    return (charts.dentista && charts.dentista._fullNames && charts.dentista._fullNames[idx]) || items[0].label || '';
                                },
                                label: function(context) {
                                    // context.parsed.x is the value for horizontal bars
                                    const value = context.parsed && (context.parsed.x ?? context.parsed) || 0;
                                    return 'Faturamento: ' + formatarMoeda(value);
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const pieces = charts.dentista && charts.dentista._piecesMap ? charts.dentista._piecesMap[charts.dentista._fullNames[idx]] : 0;
                                    return 'Peças: ' + (pieces || 0);
                                }
                            },
                            bodyFont: { weight: '600' }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { 
                                color: '#9aa0a6',
                                callback: function(value) {
                                    // Exibe no formato moeda
                                    try { return formatarMoeda(value); } catch (e) { return value; }
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' }
                        },
                        y: {
                            ticks: { color: '#9aa0a6' },
                            grid: { display: false }
                        }
                    },
                    layout: { padding: { left: 8, right: 8, top: 8, bottom: 8 } }
                }
            });
        }
    };

    const updateCharts = () => {
        updateDentistaChart();
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
        });

    // Converter para array, ordenar
    const entries = Object.entries(map).map(([nome, v]) => ({ nome, faturamento: v.faturamento, pecas: v.pecas }));
    entries.sort((a, b) => b.faturamento - a.faturamento);
    // Se o usuário escolheu ver todos, mostramos todos; senão limitamos ao Top 15
    const top = state.showAllDentistas ? entries : entries.slice(0, 15);

    const fullNames = top.map(e => e.nome);
    const shortLabels = fullNames.map(n => abbreviateName(n, 28));
    const data = top.map(e => Number(e.faturamento.toFixed(2)));

        // Paleta: gradiente de roxo (Top 1 = mais claro, Top N = mais escuro)
    // Tonalidade clara (Top 1) — ligeiramente mais viva que antes para melhor visibilidade
    const purpleLight = '#d6a8ff'; // Top 1 (mais claro e mais vivo)
        const purpleDark = '#4c1d95';  // Top N (mais escuro)

        // Helpers simples para misturar cores hex
        const hexToRgb = (hex) => {
            const h = hex.replace('#','');
            return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
        };
        const rgbToHex = (r,g,b) => '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
        const blend = (startHex, endHex, t) => {
            const s = hexToRgb(startHex);
            const e = hexToRgb(endHex);
            const r = Math.round(s[0] + (e[0] - s[0]) * t);
            const g = Math.round(s[1] + (e[1] - s[1]) * t);
            const b = Math.round(s[2] + (e[2] - s[2]) * t);
            return rgbToHex(r,g,b);
        };

        // Inverte o gradiente: Top1 (maior faturamento) deve ser mais escuro
        const backgroundColors = top.map((_, i) => {
            if (top.length === 1) return purpleDark;
            const t = i / (top.length - 1); // 0 => Top1, 1 => TopN
            return blend(purpleDark, purpleLight, t);
        });

    charts.dentista.data.labels = shortLabels;
        charts.dentista.data.datasets[0].data = data;
        charts.dentista.data.datasets[0].backgroundColor = backgroundColors;

    // Guardar mapa de peças e nomes completos para tooltips
    charts.dentista._piecesMap = top.reduce((acc, cur) => { acc[cur.nome] = cur.pecas; return acc; }, {});
    charts.dentista._fullNames = fullNames;

        // Ajustar altura do canvas para que cada barra tenha espaço vertical suficiente
        try {
            const canvas = document.getElementById('dentista-chart');
            if (canvas) {
                const perBar = 40; // px por item
                const computedHeight = Math.max(300, shortLabels.length * perBar + 80);
                // Set the canvas height attribute (not CSS) so Chart.js recalculates
                canvas.height = computedHeight;
            }
        } catch (e) {
            console.warn('Não foi possível ajustar a altura do canvas do dentista:', e);
        }

        charts.dentista.update();
    };

    // --- EXPORTAÇÃO PDF ---
const generateDashboardPDF = () => {
        // ... função original generateDashboardPDF (inalterada)
    };

const generateProducaoPDF = () => {
        // Usa o estado atual do mês para determinar o período de fechamento
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
        const mesAno = new Date(state.mesAtual).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        // Filtra todas as produções que estão DENTRO do período de faturamento
        const producaoDoMes = (state.producao || []).filter(p => {
            if (!p.data) return false;
            const dataProducao = new Date(p.data + "T00:00:00");
            return dataProducao >= startDate && dataProducao <= endDate;
        });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let totalFaturamentoMes = 0;

        // Colunas (inalteradas)
        const tableColumns = ["PACIENTE", "DENTISTA", "TIPO DE TRABALHO", "OBS.", "STATUS", "QTD", "VALOR"];
        const tableRows = [];
        
        // Define a ordem das colunas e seus índices (inalterado)
        const columnMap = {
            'PACIENTE': 0,
            'DENTISTA': 1,
            'TIPO DE TRABALHO': 2,
            'OBS.': 3,
            'STATUS': 4,
            'QTD': 5,
            'VALOR': 6
        };

        producaoDoMes.forEach(p => {
            // Busca o nome do dentista
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            const dentistaName = dentista ? dentista.nome : 'Dentista Desconhecido';

            // Busca o valor unitário
            const valorItem = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorUnitario = valorItem ? valorItem.valor : 0;
            const valorTotal = valorUnitario * p.qtd;
            
            totalFaturamentoMes += valorTotal;
            
            // OBS. usa o conteúdo completo
            const obsConteudo = (p.obs || '-'); 

            const producaoData = [
                p.nomePaciente || 'Não Informado',
                dentistaName,
                p.tipo,
                obsConteudo,
                p.status,
                p.qtd.toString(),
                formatarMoeda(valorTotal)
            ];
            tableRows.push(producaoData);
        });
        
        // Título e Período
        doc.setFontSize(16);
        doc.text(`Relatório de Produção Mensal`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Período de Referência: ${mesAno}`, 14, 20);

        // Tabela
        doc.autoTable({ 
            head: [tableColumns], 
            body: tableRows, 
            startY: 25,
            // Mantemos 'ellipsize' mas o aumento de largura deve reduzir a necessidade de truncamento.
            styles: { fontSize: 9, cellPadding: 2, overflow: 'ellipsize' }, 
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            // NOVO AJUSTE FINO (Reduz TIPO DE TRABALHO e VALOR, Aumenta nomes)
            columnStyles: {
                // Largura em mm. Largura total do documento é ~190mm
                [columnMap['PACIENTE']]: { cellWidth: 44 },     // +2mm (Prioridade máxima)
                [columnMap['DENTISTA']]: { cellWidth: 44 },     // +2mm (Prioridade máxima)
                [columnMap['TIPO DE TRABALHO']]: { cellWidth: 40 }, // -5mm (Mais compacto)
                [columnMap['OBS.']]: { cellWidth: 20 },         // Mantido
                [columnMap['STATUS']]: { cellWidth: 15 },       // Mantido
                [columnMap['QTD']]: { cellWidth: 8, halign: 'center' }, // Mantido no mínimo
                [columnMap['VALOR']]: { cellWidth: 19, halign: 'right' } // +1mm (Apenas o necessário para o formato R$ X,XX)
            }
            // Soma das larguras: 44 + 44 + 40 + 20 + 15 + 8 + 19 = 190mm (Uso total do espaço)
        });
        
        // Posição final da tabela
        const finalY = doc.autoTable.previous.finalY;
        
        // VALOR TOTAL (em destaque)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`VALOR TOTAL (BRUTO): ${formatarMoeda(totalFaturamentoMes)}`, 14, finalY + 10);

        doc.save(`producao-mensal-${mesAno.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const generateProducaoDentistaPDF = () => {
        const selectedDentistaId = filterDentistaSelect.value;
        
        if (!selectedDentistaId) {
            showToast("Selecione um dentista para exportar o PDF.");
            return;
        }
        
        const dentista = (state.dentistas || []).find(d => d.id == selectedDentistaId);
        if (!dentista) {
             showToast("Dentista não encontrado.");
             return;
        }
        
        const producaoFiltrada = (state.producao || []).filter(p => p.dentista == selectedDentistaId);
        
        if (producaoFiltrada.length === 0) {
            showToast("Nenhuma produção encontrada para este dentista.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let totalValor = 0;
        
        const tableColumns = ["PACIENTE", "DENTISTA", "TIPO DE TRABALHO", "OBS.", "STATUS", "QUANTIDADE", "VALOR"];
        const tableRows = [];

        producaoFiltrada.forEach(p => {
             // Calculate value
            const valorDentista = (dentista.valores || []).find(v => v.tipo === p.tipo);
            const valorGlobal = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorFinal = valorDentista || valorGlobal;
            const valorUnitario = valorFinal ? valorFinal.valor : 0;
            const valorTotal = valorUnitario * p.qtd;
            
            totalValor += valorTotal;
            
            const row = [
                p.nomePaciente || '',
                dentista.nome,
                p.tipo,
                p.obs || '',
                p.status,
                p.qtd.toString(),
                formatarMoeda(valorTotal)
            ];
            tableRows.push(row);
        });
        
        // Title
        doc.setFontSize(16);
        doc.text(`Relatório de Produção - ${dentista.nome}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 20);
        
        doc.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 9, cellPadding: 2, overflow: 'ellipsize' },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 40 }, // Paciente
                1: { cellWidth: 40 }, // Dentista
                2: { cellWidth: 30 }, // Tipo
                3: { cellWidth: 30 }, // Obs
                4: { cellWidth: 20 }, // Status
                5: { cellWidth: 10, halign: 'center' }, // Qtd
                6: { cellWidth: 20, halign: 'right' } // Valor
            }
        });
        
        const finalY = doc.autoTable.previous.finalY;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL: ${formatarMoeda(totalValor)}`, 14, finalY + 10);
        
        doc.save(`producao_${dentista.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    // --- FILTROS AVANÇADOS ---
    const getFilteredProducao = () => {
        let producaoFiltrada = [...(state.producao || [])];
        
        // Filtro por busca
        if (state.searchTermProducao) {
            producaoFiltrada = producaoFiltrada.filter(p => {
                const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
                const dentistaName = dentista ? dentista.nome.toLowerCase() : '';
                return p.tipo.toLowerCase().includes(state.searchTermProducao.toLowerCase()) ||
                       dentistaName.includes(state.searchTermProducao.toLowerCase());
            });
        }
        
        // Filtro por status
        if (filterStatusSelect && filterStatusSelect.value) {
            producaoFiltrada = producaoFiltrada.filter(p => p.status === filterStatusSelect.value);
        }
        
        // Filtro por data
        if (filterDataInicio && filterDataInicio.value) {
            const dataInicio = new Date(filterDataInicio.value + 'T00:00:00');
            producaoFiltrada = producaoFiltrada.filter(p => new Date(p.data + 'T00:00:00') >= dataInicio);
        }
        
        if (filterDataFim && filterDataFim.value) {
            const dataFim = new Date(filterDataFim.value + 'T23:59:59');
            producaoFiltrada = producaoFiltrada.filter(p => new Date(p.data + 'T00:00:00') <= dataFim);
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
            document.getElementById(targetViewId).classList.remove('hidden');
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
            if (window.innerWidth < 1024) { toggleMenu(); }
        });
    });

    // --- LÓGICA DE AUTENTICAÇÃO ---
    // Removida - agora em login.js
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'login.html';
            });
        });
    }
    
    // --- LÓGICA DE DADOS (FIRESTORE) ---
    async function saveDataToFirestore(button = null) {
        if (!userId) return;

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
            showToast("Erro ao salvar dados. Verifique sua conexão.");
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
                };
            } else {
                // Novo usuário
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
                    quickNotes: [{ id: firstNoteId, title: 'Geral', content: '' }], // NOVO
                    activeQuickNoteId: firstNoteId // NOVO
                };
                saveDataToFirestore(); 
            }

            if(fechamentoDiaInicioInput && fechamentoDiaFimInput) {
                fechamentoDiaInicioInput.value = state.closingDayStart;
                fechamentoDiaFimInput.value = state.closingDayEnd;
            }
            renderAllUIComponents(); // Esta função vai chamar a renderQuickNotesUI
            updateNotificationUI();
            updateCharts();
            checkAndCreateRecurringExpenses(); 
        }, (error) => {
            console.error("Erro ao carregar dados do Firestore:", error);
            showToast("Não foi possível carregar os dados.");
        });
    }

    // --- RENDERIZAÇÃO E LÓGICA DA UI ---
    // ... (keep all render functions as they are) ...
    
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

	    const renderizarDashboard = () => {
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

        // Atualizar KPIs
        kpiFaturamentoMes.textContent = formatarMoeda(faturamentoBruto);
        kpiLucroMes.textContent = formatarMoeda(lucroLiquido);
        kpiPecasMes.textContent = producaoDoMes.reduce((acc, p) => acc + p.qtd, 0);
        kpiDespesasMes.textContent = formatarMoeda(totalDespesas);
    
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
    
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const trintaDiasDepois = new Date();
        trintaDiasDepois.setDate(hoje.getDate() + 30);
    
        const entregasAtrasadas = (state.producao || []).filter(p => {
            const dataEntrega = new Date(p.entrega + 'T00:00:00');
            return p.status !== 'Finalizado' && dataEntrega < hoje;
        }).sort((a, b) => new Date(a.entrega) - new Date(b.entrega));
    
        const entregasProximas = (state.producao || []).filter(p => {
            const dataEntrega = new Date(p.entrega + 'T00:00:00');
            return p.status !== 'Finalizado' && dataEntrega >= hoje && dataEntrega <= trintaDiasDepois;
        }).sort((a, b) => new Date(a.entrega) - new Date(b.entrega));
        
        const todasAsEntregas = [...entregasAtrasadas, ...entregasProximas];
    
        listaEntregasProximas.innerHTML = '';
        if (todasAsEntregas.length === 0) {
            listaEntregasProximas.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma entrega próxima ou atrasada</p>';
        } else {
            todasAsEntregas.forEach(entrega => {
                const dentista = (state.dentistas || []).find(d => d.id === entrega.dentista);
                const dentistaName = dentista ? dentista.nome : 'Dentista desconhecido';
                const dataEntrega = new Date(entrega.entrega + 'T00:00:00');
                const isUrgent = dataEntrega < hoje;

                // Buscar os detalhes extras
                const tipoTrabalho = entrega.tipo || 'Tipo não informado';
                const observacoes = entrega.obs || 'Nenhuma observação';

                const entregaEl = document.createElement('div');
                entregaEl.className = `entrega-item-container p-3 rounded-lg border ${isUrgent ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`;
                
                // HTML reestruturado para expansão (e CORRIGIDO sem os '+')
                entregaEl.innerHTML = `
                    <div class="entrega-item-header flex justify-between items-center cursor-pointer">
                        <div class="flex-1 min-w-0">
                            <p class="font-medium truncate">${entrega.nomePaciente || 'Paciente não informado'}</p>
                            <p class="text-sm text-gemini-secondary truncate">${dentistaName}</p>
                        </div>
                        <div class="flex items-center space-x-3 flex-shrink-0 ml-3">
                             <div class="text-right">
                                <p class="text-sm font-medium">${dataEntrega.toLocaleDateString('pt-BR')}</p>
                                <span class="text-xs px-2 py-1 rounded-full ${isUrgent ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}">${isUrgent ? 'ATRASADO' : 'PRÓXIMO'}</span>
                            </div>
                            <button class="finalize-entrega-btn p-2 rounded-full bg-green-500/20 hover:bg-green-500/40" data-id="${entrega.id}" title="Finalizar Entrega">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-green-400" style="pointer-events: none;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            <svg class="entrega-expand-icon w-4 h-4 text-gemini-secondary transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                     </div>
 
                     <div class="entrega-item-details hidden mt-3 pt-3 border-t border-gemini-border/50">
                         <p class="text-sm"><strong class="text-gemini-secondary">Trabalho:</strong> ${tipoTrabalho}</p>
                         <p class="text-sm mt-1 break-words"><strong class="text-gemini-secondary">Obs:</strong> ${observacoes}</p>
                     </div>
                 `;
                 listaEntregasProximas.appendChild(entregaEl);
            });
        } 
    };
    

    const renderizarProducaoDia = () => {
        const dataSelecionada = producaoDataInput.value;
        if (!dataSelecionada) return;
        
        const producaoFiltrada = getFilteredProducao().filter(p => p.data === dataSelecionada);
        
        listaProducaoDia.innerHTML = '';
        let totalPecas = 0;
        let totalFaturamento = 0;
        
        if (producaoFiltrada.length === 0) {
            listaProducaoDia.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma produção encontrada</p>';
        } else {
            producaoFiltrada.forEach(producao => {
                const dentista = (state.dentistas || []).find(d => d.id === producao.dentista);
                const dentistaName = dentista ? dentista.nome : 'Dentista desconhecido';
                
                const valorDentista = dentista ? (dentista.valores || []).find(v => v.tipo === producao.tipo) : null;
                const valorGlobal = (state.valores || []).find(v => v.tipo === producao.tipo);
                const valorFinal = valorDentista || valorGlobal;
                const valorTotal = valorFinal ? valorFinal.valor * producao.qtd : 0;

                totalPecas += producao.qtd;
                totalFaturamento += valorTotal;
                
                const statusClass = {
                    'Pendente': 'status-pendente',
                    'Em Andamento': 'status-andamento',
                    'Finalizado': 'status-finalizado'
                }[producao.status] || 'status-pendente';

                const anexoHtml = producao.anexoURL ? `
                    <a href="${producao.anexoURL}" target="_blank" class="p-1 rounded hover:bg-blue-700 transition-colors text-blue-400" title="Ver Anexo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </a>` : '';
                
                const producaoEl = document.createElement('div');
                producaoEl.className = 'card-enhanced p-4 hover-effect';
                producaoEl.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gemini-primary">${producao.tipo}</h4>
                            <p class="text-sm text-gemini-secondary">${dentistaName}</p>
                            <p class="text-sm text-gemini-secondary font-medium">Paciente: ${producao.nomePaciente || 'Não informado'}</p>
                            <div class="flex items-center space-x-4 mt-2">
                                <span class="text-sm">Qtd: <span class="font-semibold">${producao.qtd}</span></span>
                                <span class="text-sm whitespace-nowrap">Valor: <span class="font-semibold text-accent-green monetary-value">${formatarMoeda(valorTotal)}</span></span>
                            </div>
                            <p class="text-xs text-gemini-secondary mt-1">Entrega: ${new Date(producao.entrega + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                            ${producao.obs ? `<p class="text-xs text-gemini-secondary mt-1">${producao.obs}</p>` : ''}
                        </div>
                        <div class="flex flex-col items-end space-y-2">
                            <span class="status-badge ${statusClass}">${producao.status}</span>
                            <div class="flex space-x-1">
                                ${anexoHtml}
                                <button class="edit-producao-btn p-1 rounded hover:bg-gray-700 transition-colors" data-id="${producao.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="remove-producao-btn p-1 rounded hover:bg-red-700 transition-colors text-red-400" data-id="${producao.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                listaProducaoDia.appendChild(producaoEl);
            });
        }
        
        totalPecasDia.textContent = totalPecas;
        totalFaturamentoDia.textContent = formatarMoeda(totalFaturamento);
        toggleValuesVisibility();
    };

    // ... rest of the code remains the same until initialization ...

    // --- INICIALIZAÇÃO ---
    const initApp = () => {
        document.querySelectorAll('button[type="submit"]').forEach(button => {
            button.dataset.originalText = button.innerHTML;
        });
        const hoje = new Date();
        producaoDataInput.valueAsDate = hoje;
        entregaDataInput.valueAsDate = hoje;
        despesaDataInput.valueAsDate = hoje;
        
        setTimeout(initializeCharts, 100);
    };

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (initialLoadingOverlay) initialLoadingOverlay.classList.add('hidden');
        if (user) {
            userId = user.uid;
            if(userEmailDisplay) userEmailDisplay.textContent = user.email;
            if(authScreen) authScreen.classList.add('hidden');
            if(appContent) appContent.classList.remove('hidden');
            setupFirestoreListener(userId);
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });

    initApp();
});
