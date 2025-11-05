// Importar SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

document.addEventListener('DOMContentLoaded', () => {
    
    let db, auth, functions, storage, userId;
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
    const kpiFaturamentoMes = document.getElementById('kpi-faturamento-mes');
    const kpiLucroMes = document.getElementById('kpi-lucro-mes');
    const kpiPecasMes = document.getElementById('kpi-pecas-mes');
    const kpiDespesasMes = document.getElementById('kpi-despesas-mes');
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
        mesAtual: new Date().toISOString(),
        closingDayStart: 25,
        closingDayEnd: 24,
        searchTermProducao: '',
        searchTermDentistas: '',
        searchTermEstoque: '',
        notifications: []
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
        // Gráfico de Faturamento por Dentista
        const dentistaCtx = document.getElementById('dentista-chart');
        if (dentistaCtx) {
            charts.dentista = new Chart(dentistaCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Faturamento',
                        data: [],
                        backgroundColor: '#4f46e5',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#9aa0a6' },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' }
                        },
                        y: {
                            ticks: { 
                                color: '#9aa0a6',
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' }
                        }
                    }
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
        
        const faturamentoPorDentista = {};
        
        producaoDoMes.forEach(p => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            const dentistaName = dentista ? dentista.nome : 'Desconhecido';
            const valor = (state.valores || []).find(v => v.tipo === p.tipo);
            const faturamento = valor ? valor.valor * p.qtd : 0;
            
            if (!faturamentoPorDentista[dentistaName]) {
                faturamentoPorDentista[dentistaName] = 0;
            }
            faturamentoPorDentista[dentistaName] += faturamento;
        });
        
        const labels = Object.keys(faturamentoPorDentista);
        const data = Object.values(faturamentoPorDentista);
        
        charts.dentista.data.labels = labels;
        charts.dentista.data.datasets[0].data = data;
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
    function updateAuthUI() { 
        authTitle.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
        authButton.textContent = isLoginMode ? 'Entrar' : 'Registar';
        toggleAuthMode.textContent = isLoginMode ? 'Ainda não tem conta? Registe-se' : 'Já tem conta? Entrar';
        authErrorMessage.classList.add('hidden');
    }
    
    toggleAuthMode.addEventListener('click', () => { isLoginMode = !isLoginMode; updateAuthUI(); });
    
    authForm.addEventListener('submit', async (e) => { 
        e.preventDefault(); 
        const email = emailInput.value; 
        const password = passwordInput.value; 
        authErrorMessage.classList.add('hidden'); 
        setButtonLoading(authButton, true, isLoginMode ? 'Entrar' : 'Registar');
        try { 
            if (isLoginMode) { await signInWithEmailAndPassword(auth, email, password); } 
            else { await createUserWithEmailAndPassword(auth, email, password); }
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
        if (!email) { showToast("Por favor, insira o seu e-mail no campo acima."); return; }
        try { 
            await sendPasswordResetEmail(auth, email); 
            showToast("E-mail de recuperação enviado com sucesso!", "success"); 
        } catch (error) { showToast("Não foi possível enviar o e-mail de recuperação."); }
    });

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
	
	    const renderizarDashboard = () => {
        updateMonthDisplay();
    
        const { startDate, endDate } = getBillingPeriod(new Date(state.mesAtual));
    
        const producaoDoMes = (state.producao || []).filter(p => {
            if (!p.data) return false;
            const dataProducao = new Date(p.data + "T00:00:00");
            return dataProducao >= startDate && dataProducao <= endDate;
        });
    
        const despesasDoMes = (state.despesas || []).filter(d => {
            if (!d.data) return false;
            const dataDespesa = new Date(d.data + "T00:00:00");
            return dataDespesa >= startDate && dataDespesa <= endDate;
        });
    
        const faturamentoBruto = producaoDoMes.reduce((acc, p) => acc + ((state.valores || []).find(v => v.tipo === p.tipo)?.valor || 0) * p.qtd, 0);
        const totalDespesas = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);
        kpiFaturamentoMes.textContent = formatarMoeda(faturamentoBruto);
        kpiLucroMes.textContent = formatarMoeda(faturamentoBruto - totalDespesas);
        kpiPecasMes.textContent = producaoDoMes.reduce((acc, p) => acc + p.qtd, 0);
        kpiDespesasMes.textContent = formatarMoeda(totalDespesas);
    
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
                const valor = (state.valores || []).find(v => v.tipo === producao.tipo);
                const valorTotal = valor ? valor.valor * producao.qtd : 0;
                
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

    const renderizarProducaoPorDentista = () => {
        const selectedDentistaId = filterDentistaSelect.value;
        producaoDentistaTableBody.innerHTML = '';

        if (!selectedDentistaId) {
            producaoDentistaTableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gemini-secondary">Selecione um dentista para começar.</td></tr>';
            exportDentistaProducaoPdfBtn.classList.add('hidden'); // Oculta o botão
            return;
        }

        const producaoFiltrada = (state.producao || []).filter(p => p.dentista == selectedDentistaId);

        if (producaoFiltrada.length === 0) {
            producaoDentistaTableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gemini-secondary">Nenhuma produção encontrada para este dentista.</td></tr>';
            exportDentistaProducaoPdfBtn.classList.add('hidden'); // Oculta o botão
            return;
        }
        
        exportDentistaProducaoPdfBtn.classList.remove('hidden'); // Exibe o botão

        producaoFiltrada.forEach(producao => {
            const dentista = (state.dentistas || []).find(d => d.id === producao.dentista);
            const dentistaName = dentista ? dentista.nome : 'Desconhecido';
            const valor = (state.valores || []).find(v => v.tipo === producao.tipo);
            const valorTotal = valor ? valor.valor * producao.qtd : 0;
            const statusClass = {
                'Pendente': 'text-red-400',
                'Em Andamento': 'text-yellow-400',
                'Finalizado': 'text-green-400'
            }[producao.status] || 'text-gemini-secondary';

            const row = document.createElement('tr');
            row.className = 'border-b border-gemini-border hover:bg-gray-700/50 transition-colors';
            
            // [MODIFICADO] Adicionado o botão de excluir
            row.innerHTML = `
                <td class="p-3 text-gemini-primary font-medium">${dentistaName}</td>
                <td class="p-3 text-gemini-secondary">${producao.nomePaciente || '-'}</td>
                <td class="p-3 text-gemini-secondary">${producao.tipo}</td>
                <td class="p-3 text-gemini-secondary text-sm">${producao.obs || '-'}</td>
                <td class="p-3 font-semibold ${statusClass}">${producao.status}</td>
                <td class="p-3 text-accent-green font-semibold monetary-value">${formatarMoeda(valorTotal)}</td>
                <td class="p-3 text-center">
                    <button class="edit-producao-btn p-1 rounded hover:bg-gray-700 transition-colors" data-id="${producao.id}" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="remove-producao-btn p-1 rounded hover:bg-red-700 transition-colors text-red-400" data-id="${producao.id}" title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </td>
            `;
            producaoDentistaTableBody.appendChild(row);
        });
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
            const valor = (state.valores || []).find(v => v.tipo === p.tipo);
            return acc + (valor ? valor.valor * p.qtd : 0);
        }, 0);
        const totalDespesasValue = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);
        const lucroLiquido = faturamentoBruto - totalDespesasValue;
        
        totalPecasMes.textContent = totalPecasValue;
        totalFaturamentoMes.textContent = formatarMoeda(faturamentoBruto);
        totalDespesasMes.textContent = formatarMoeda(totalDespesasValue);
        lucroLiquidoMes.textContent = formatarMoeda(lucroLiquido);
        
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
            
            const valor = (state.valores || []).find(v => v.tipo === p.tipo);
            const faturamento = valor ? valor.valor * p.qtd : 0;
            
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
                    <button class="remove-valor-btn p-1 rounded hover:bg-red-700 transition-colors text-red-400" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            listaValores.appendChild(valorEl);
        });
        toggleValuesVisibility();
    };

    const renderizarSelects = () => {
        // Renderizar select de tipos de trabalho
        producaoTipoSelect.innerHTML = '<option value="">Selecione o tipo de trabalho</option>';
        (state.valores || []).forEach(valor => {
            const option = document.createElement('option');
            option.value = valor.tipo;
            option.textContent = valor.tipo;
            producaoTipoSelect.appendChild(option);
        });
        
        // Renderizar select de dentistas nos formulários
        producaoDentistaSelect.innerHTML = '<option value="">Selecione o Dentista</option>';
        // Renderizar select de dentistas no filtro de produção
        filterDentistaSelect.innerHTML = '<option value="">Selecione um dentista para ver a produção</option>';

        (state.dentistas || []).forEach(dentista => {
            const optionForm = document.createElement('option');
            optionForm.value = dentista.id;
            optionForm.textContent = dentista.nome;
            producaoDentistaSelect.appendChild(optionForm);

            const optionFilter = document.createElement('option');
            optionFilter.value = dentista.id;
            optionFilter.textContent = dentista.nome;
            filterDentistaSelect.appendChild(optionFilter);
        });
    };

    const renderizarListaDespesasDetalhada = () => {
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

	    const renderAllUIComponents = () => {
	        renderizarDashboard();
	        renderizarProducaoDia();
	        renderQuickNotesUI();
	        renderizarProducaoPorDentista();
        renderizarProducaoPorDentista();
        renderizarListaDentistas();
        renderizarResumoMensal();
        renderizarAnaliseDentista();
        renderizarListaValores();
        renderizarSelects();
        renderizarEstoque();
    };

    // --- FUNÇÕES DE EDIÇÃO ---
    const startEditProducao = (id) => {
        const producao = (state.producao || []).find(p => p.id === id);
        if (!producao) return;
        
        producaoEditIdInput.value = producao.id;
        producaoTipoSelect.value = producao.tipo;
        producaoDentistaSelect.value = producao.dentista;
        producaoPacienteInput.value = producao.nomePaciente || '';
        producaoQtdInput.value = producao.qtd;
        producaoStatusSelect.value = producao.status;
        producaoObsInput.value = producao.obs || '';
        producaoDataInput.value = producao.data;
        entregaDataInput.value = producao.entrega;
        producaoAnexoInput.value = '';
        
        formProducaoTitle.textContent = 'Editar Produção';
        producaoSubmitBtn.textContent = 'Atualizar';
        producaoCancelBtn.classList.remove('hidden');
        
        document.getElementById('form-producao').scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditProducao = () => {
        producaoEditIdInput.value = '';
        formProducao.reset();
        formProducaoTitle.textContent = 'Adicionar Produção';
        producaoSubmitBtn.textContent = 'Adicionar';
        producaoCancelBtn.classList.add('hidden');
        
        const hoje = new Date();
        producaoDataInput.valueAsDate = hoje;
        entregaDataInput.valueAsDate = hoje;
        producaoQtdInput.value = 1;
    };

    const startEditDentista = (id) => {
        const dentista = (state.dentistas || []).find(d => d.id === id);
        if (!dentista) return;
        
        dentistaEditIdInput.value = dentista.id;
        dentistaNomeInput.value = dentista.nome;
        dentistaClinicaInput.value = dentista.clinica || '';
        dentistaTelefoneInput.value = dentista.telefone || '';
        dentistaEmailInput.value = dentista.email || '';
        
        formDentistaTitle.textContent = 'Editar Dentista';
        formDentistaSubmitBtn.textContent = 'Atualizar';
        formDentistaCancelBtn.classList.remove('hidden');
        
        document.getElementById('form-dentista').scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditDentista = () => {
        dentistaEditIdInput.value = '';
        formDentista.reset();
        formDentistaTitle.textContent = 'Adicionar Dentista';
        formDentistaSubmitBtn.textContent = 'Adicionar';
        formDentistaCancelBtn.classList.add('hidden');
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
        navigateToView('view-admin');
        
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
        
        despesaDataInput.valueAsDate = new Date();
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
                const originalValue = el.dataset.originalValue || el.textContent;
                el.dataset.originalValue = originalValue;
                el.textContent = ''; // O CSS fará o resto com o ::before
            } else {
                if (el.dataset.originalValue) {
                    el.textContent = el.dataset.originalValue;
                }
            }
        });
        eyeIcon.classList.toggle('hidden', isHidden);
        eyeOffIcon.classList.toggle('hidden', !isHidden);
    };

    if(toggleValuesBtn) {
        toggleValuesBtn.addEventListener('click', () => {
            document.body.classList.toggle('values-hidden');
            const isHidden = document.body.classList.contains('values-hidden');
            toggleValuesBtn.setAttribute('aria-pressed', isHidden);
            toggleValuesVisibility();
        });
    }

	    if (saveQuickNotesBtn) {
	        saveQuickNotesBtn.addEventListener('click', async () => {
                const activeNoteIndex = state.quickNotes.findIndex(n => n.id === state.activeQuickNoteId);
                if (activeNoteIndex === -1) {
                    showToast("Nenhuma nota selecionada para salvar.");
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
	                showToast("Nota salva com sucesso!", "success");
	                
	                // 5. Feedback visual localizado
	                if (quickNotesFeedback) {
	                    quickNotesFeedback.textContent = 'Salvo!';
	                    quickNotesFeedback.classList.remove('hidden', 'text-red-400');
	                    quickNotesFeedback.classList.add('text-green-400');
	                    setTimeout(() => quickNotesFeedback.classList.add('hidden'), 2000);
	                }

	            } catch (error) {
	                console.error("Erro ao salvar notas:", error);
	                showToast("Erro ao salvar notas.");
	                if (quickNotesFeedback) {
	                    quickNotesFeedback.textContent = 'Erro ao salvar.';
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
            'Confirmar Exclusão', 
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
    if (filterStatusSelect) filterStatusSelect.addEventListener('change', renderizarProducaoDia);
    if (filterDataInicio) filterDataInicio.addEventListener('change', renderizarProducaoDia);
    if (filterDataFim) filterDataFim.addEventListener('change', renderizarProducaoDia);

    // Produção por dentista
    if (filterDentistaSelect) filterDentistaSelect.addEventListener('change', renderizarProducaoPorDentista);
    if (producaoDentistaTableBody) {
        producaoDentistaTableBody.addEventListener('click', async (e) => { // [MODIFICADO] Adicionado 'async'
            const editBtn = e.target.closest('.edit-producao-btn');
            const removeBtn = e.target.closest('.remove-producao-btn');

            if (editBtn) {
                const producaoId = parseInt(editBtn.dataset.id);
                startEditProducao(producaoId);
            } 
            else if (removeBtn) {
                const producaoId = parseInt(removeBtn.dataset.id);
                
                // [MODIFICADO] Chamando o novo modal
                const confirmed = await showConfirmationModal(
                    'Confirmar Exclusão', 
                    'Tem certeza que quer excluir este trabalho?'
                );

                if (confirmed) {
                    state.producao = state.producao.filter(p => p.id !== producaoId);
                    saveDataToFirestore();
                    showToast("Produção removida com sucesso!", "success");
                }
            }
        });
    }

    // Exportação PDF
    if (exportDashboardPdf) exportDashboardPdf.addEventListener('click', generateDashboardPDF);
    if (exportProducaoPdf) exportProducaoPdf.addEventListener('click', generateProducaoPDF);
    if (exportDentistaProducaoPdfBtn) exportDentistaProducaoPdfBtn.addEventListener('click', generateProducaoDentistaPDF);

    // Ações rápidas
    if (actionAddProducao) actionAddProducao.addEventListener('click', () => navigateToView('view-producao'));
    if (actionAddDespesa) actionAddDespesa.addEventListener('click', () => navigateToView('view-admin'));

    // Formulários
    if (formFechamento) {
        formFechamento.addEventListener('submit', (e) => {
            e.preventDefault();
            const diaInicio = parseInt(fechamentoDiaInicioInput.value);
            const diaFim = parseInt(fechamentoDiaFimInput.value);
    
            if (diaInicio >= 1 && diaInicio <= 31 && diaFim >= 1 && diaFim <= 31) {
                state.closingDayStart = diaInicio;
                state.closingDayEnd = diaFim;
                saveDataToFirestore().then(() => {
                    showToast("Ciclo de fechamento salvo com sucesso!", "success");
                    renderAllUIComponents();
                    updateCharts();
                });
            } else {
                showToast("Por favor, insira dias válidos (1-31).");
            }
        });
    }

    if (formDentista) {
        formDentista.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = dentistaEditIdInput.value ? parseInt(dentistaEditIdInput.value) : Date.now();
            const nome = dentistaNomeInput.value.trim();
            if (!nome) { showToast("O nome do dentista é obrigatório."); return; }
            const dentistaData = { id, nome, clinica: dentistaClinicaInput.value.trim(), telefone: dentistaTelefoneInput.value.trim(), email: dentistaEmailInput.value.trim() };
            if (dentistaEditIdInput.value) {
                const index = state.dentistas.findIndex(d => d.id === id);
                if (index !== -1) { state.dentistas[index] = dentistaData; showToast("Dentista atualizado com sucesso!", "success"); }
            } else { state.dentistas.push(dentistaData); showToast("Dentista adicionado com sucesso!", "success"); }
            saveDataToFirestore(formDentistaSubmitBtn);
            cancelEditDentista();
        });
    }

    if(formDentistaCancelBtn) formDentistaCancelBtn.addEventListener('click', cancelEditDentista);
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
                'Confirmar Exclusão', 
                'Tem certeza que quer remover este dentista?'
            );

            if (confirmed) { 
                state.dentistas = state.dentistas.filter(d => d.id !== dentistaId); 
                saveDataToFirestore(); 
                showToast("Dentista removido.", "success"); 
            } 
        }
    });
}

    if(formValores) formValores.addEventListener('submit', (e) => { e.preventDefault(); const tipo = tipoTrabalhoInput.value.trim(); const valor = parseFloat(valorTrabalhoInput.value); if (tipo && !isNaN(valor)) { state.valores.push({ tipo, valor }); saveDataToFirestore(); formValores.reset(); showToast("Valor adicionado com sucesso!", "success"); } });
    if(listaValores) {
    listaValores.addEventListener('click', async (e) => { // [MODIFICADO] Adicionado 'async'
        const btn = e.target.closest('.remove-valor-btn'); 

        if (btn) { 
            const index = btn.dataset.index;
            // Pega o nome do trabalho para deixar a mensagem mais clara
            const tipoTrabalho = state.valores[index]?.tipo || 'este item'; 

            // [MODIFICADO] Chamando o novo modal
            const confirmed = await showConfirmationModal(
                'Confirmar Exclusão', 
                `Tem certeza que quer remover o valor de "${tipoTrabalho}"?`
            );

            if (confirmed) {
                state.valores.splice(index, 1); 
                saveDataToFirestore(); 
                showToast("Valor removido.", "success"); 
            }
        } 
    });
}
    
    if(formProducao){
        formProducao.addEventListener('submit', async (e) => { 
            e.preventDefault();
            setButtonLoading(producaoSubmitBtn, true);

            const file = producaoAnexoInput.files[0];
            let anexoURL = null;

            if (file) {
                const storageRef = ref(storage, `users/${userId}/attachments/${Date.now()}_${file.name}`);
                try {
                    const snapshot = await uploadBytes(storageRef, file);
                    anexoURL = await getDownloadURL(snapshot.ref);
                } catch (error) {
                    console.error("Erro no upload: ", error);
                    showToast("Falha no upload do anexo.");
                    setButtonLoading(producaoSubmitBtn, false);
                    return;
                }
            }
            
            const editId = producaoEditIdInput.value ? parseInt(producaoEditIdInput.value) : null;
            const producaoData = { 
                id: editId || Date.now(), 
                tipo: producaoTipoSelect.value, 
                dentista: parseInt(producaoDentistaSelect.value), 
                nomePaciente: producaoPacienteInput.value.trim(),
                qtd: parseInt(producaoQtdInput.value), 
                status: producaoStatusSelect.value, 
                obs: producaoObsInput.value.trim(), 
                data: producaoDataInput.value, 
                entrega: entregaDataInput.value,
                anexoURL: anexoURL
            };

            if (producaoData.tipo && producaoData.dentista && producaoData.nomePaciente && producaoData.qtd > 0 && producaoData.data && producaoData.entrega) {
                if (editId) { 
                    const index = state.producao.findIndex(p => p.id === editId); 
                    if (index !== -1) {
                        producaoData.anexoURL = anexoURL || state.producao[index].anexoURL; // Mantém anexo antigo se não houver novo
                        state.producao[index] = producaoData; 
                        showToast("Produção atualizada com sucesso!", "success");
                    } 
                } else { 
                    state.producao.push(producaoData); 
                    showToast("Produção adicionada com sucesso!", "success");
                }
                await saveDataToFirestore();
                cancelEditProducao();
            } else { 
                showToast("Por favor, preencha todos os campos obrigatórios."); 
            }
            setButtonLoading(producaoSubmitBtn, false);
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
                'Confirmar Exclusão', 
                'Tem certeza que quer excluir este trabalho?'
            );

            if (confirmed) { 
                state.producao = state.producao.filter(p => p.id !== producaoId); 
                saveDataToFirestore(); 
                showToast("Produção removida.", "success"); 
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
                        showToast("Despesa atualizada com sucesso!", "success"); 
                    } 
                } else { 
                    state.despesas.push(despesaData); 
                    showToast("Despesa adicionada com sucesso!", "success"); 
                }
                saveDataToFirestore(formDespesaSubmitBtn);
                cancelEditDespesa();
            } else { showToast("Preencha todos os campos da despesa."); }
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
                showToast("Preencha os campos obrigatórios do material.");
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
            showToast("Material salvo com sucesso!", "success");
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
                'Confirmar Exclusão', 
                'Tem certeza que quer remover este material do estoque?'
            );

            if (confirmed) {
                state.estoque = state.estoque.filter(i => i.id !== itemId);
                saveDataToFirestore();
                showToast("Material removido.", "success");
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

    if(verTodasDespesasBtn) verTodasDespesasBtn.addEventListener('click', () => { renderizarListaDespesasDetalhada(); despesasModal.classList.remove('hidden'); });
    if(closeDespesasModalBtn) closeDespesasModalBtn.addEventListener('click', () => { despesasModal.classList.add('hidden'); });
    if(listaDespesasDetalhada) {
        listaDespesasDetalhada.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-despesa-btn');
            if (editButton) { startEditDespesa(parseInt(editButton.dataset.id)); }
            const removeButton = e.target.closest('.remove-despesa-btn');
            if (removeButton) { if (confirm('Tem certeza?')) { state.despesas = state.despesas.filter(d => d.id !== parseInt(removeButton.dataset.id)); saveDataToFirestore(); renderizarListaDespesasDetalhada(); showToast("Despesa removida.", "success"); } }
        });
    }

    if(listaEntregasProximas) {
        listaEntregasProximas.addEventListener('click', (e) => {
            const finalizeButton = e.target.closest('.finalize-entrega-btn');
           const header = e.target.closest('.entrega-item-header');

            if (finalizeButton) {
               e.stopPropagation(); // Impede que o clique expanda o item
                const producaoId = parseInt(finalizeButton.dataset.id);
                const producaoIndex = state.producao.findIndex(p => p.id === producaoId);
                if (producaoIndex !== -1) {
                    state.producao[producaoIndex].status = 'Finalizado';
                    saveDataToFirestore();
                    showToast("Produção finalizada com sucesso!", "success");
                }
            }
           // [NOVO] Lógica para expandir
           else if (header) {
               const container = header.closest('.entrega-item-container');
               const details = container.querySelector('.entrega-item-details');
               const icon = header.querySelector('.entrega-expand-icon');
               
               details.classList.toggle('hidden');
               icon.classList.toggle('rotate-180');
           }
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
                const newDate = new Date(startDate);
                newDate.setDate(new Date(recurrent.data + "T00:00:00").getDate());

                const newExpense = {
                    ...recurrent,
                    id: Date.now() + Math.random(),
                    data: newDate.toISOString().split('T')[0],
                    recorrente: false // A nova despesa não é o "molde" recorrente
                };
                state.despesas.push(newExpense);
                createdNewExpense = true;
                addNotification(`Despesa recorrente '${newExpense.desc}' criada para este mês.`, 'info');
            }
        });

        if (createdNewExpense) {
            saveDataToFirestore();
        }
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
	});