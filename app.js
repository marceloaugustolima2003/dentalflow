// Importar SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

document.addEventListener('DOMContentLoaded', () => {
    
    let db, auth, functions, userId;
    let unsubscribeFromFirestore;
    let charts = {}; // Armazenar instâncias dos gráficos

    // --- ELEMENTOS DO DOM ---
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
    const formDespesaSubmitBtn = document.getElementById('form-despesa-submit-btn');
    const formDespesaCancelBtn = document.getElementById('form-despesa-cancel-btn');
    const formProducao = document.getElementById('form-producao');
    const producaoTipoSelect = document.getElementById('producao-tipo-select');
    const producaoDentistaSelect = document.getElementById('producao-dentista-select');
    const producaoPacienteInput = document.getElementById('producao-paciente-input');
    const producaoQtdInput = document.getElementById('producao-qtd-input');
    const producaoStatusSelect = document.getElementById('producao-status-select');
    const producaoObsInput = document.getElementById('producao-obs-input');
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
    const statusPendente = document.getElementById('status-pendente');
    const statusAndamento = document.getElementById('status-andamento');
    const statusFinalizado = document.getElementById('status-finalizado');
    const actionAddProducao = document.getElementById('action-add-producao');
    const actionAddDespesa = document.getElementById('action-add-despesa');
    const searchProducaoInput = document.getElementById('search-producao-input');
    const searchDentistasInput = document.getElementById('search-dentistas-input');

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

    // Botões de exportação
    const exportDashboardPdf = document.getElementById('export-dashboard-pdf');
    const exportProducaoPdf = document.getElementById('export-producao-pdf');
    const exportDentistasPdf = document.getElementById('export-dentistas-pdf');
    const exportAnalisePdf = document.getElementById('export-analise-pdf');
    const exportResumoPdf = document.getElementById('export-resumo-pdf');

    // --- ESTADO DA APLICAÇÃO ---
    let isLoginMode = true;
    let state = {
        valores: [],
        producao: [],
        despesas: [],
        dentistas: [],
        mesAtual: new Date().toISOString(),
        searchTermProducao: '',
        searchTermDentistas: '',
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

    const setButtonLoading = (button, isLoading) => {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || '';
        }
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
        // GRÁFICO DE FATURAMENTO REMOVIDO
        
        // Gráfico de Status da Produção
        const statusCtx = document.getElementById('status-chart');
        if (statusCtx) {
            charts.status = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Pendente', 'Em Andamento', 'Finalizado'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e8eaed',
                                padding: 20
                            }
                        }
                    }
                }
            });
        }

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
                        backgroundColor: '#6366f1',
                        borderRadius: 8
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
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                            ticks: { 
                                color: '#9aa0a6',
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }
    };

    const updateCharts = () => {
        // CHAMADA PARA updateFaturamentoChart REMOVIDA
        updateStatusChart();
        updateDentistaChart();
    };

    // FUNÇÃO updateFaturamentoChart REMOVIDA

    const updateStatusChart = () => {
        if (!charts.status) return;
        
        const pendente = (state.producao || []).filter(p => p.status === 'Pendente').length;
        const andamento = (state.producao || []).filter(p => p.status === 'Em Andamento').length;
        const finalizado = (state.producao || []).filter(p => p.status === 'Finalizado').length;
        
        charts.status.data.datasets[0].data = [pendente, andamento, finalizado];
        charts.status.update();
    };

    const updateDentistaChart = () => {
        if (!charts.dentista) return;
        
        const mesAtualDate = new Date(state.mesAtual);
        const primeiroDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth() + 1, 0);
        
        const producaoDoMes = (state.producao || []).filter(p => {
            const data = new Date(p.data + 'T00:00:00');
            return data >= primeiroDiaMes && data <= ultimoDiaMes;
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
    const exportToPDF = (title, content, filename) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurar fonte
        doc.setFont('helvetica');
        
        // Título
        doc.setFontSize(20);
        doc.text(title, 20, 30);
        
        // Data de geração
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40);
        
        // Conteúdo
        doc.setFontSize(12);
        let yPosition = 60;
        
        content.forEach(section => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 30;
            }
            
            // Título da seção
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(section.title, 20, yPosition);
            yPosition += 10;
            
            // Conteúdo da seção
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            if (section.type === 'table') {
                section.data.forEach(row => {
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 30;
                    }
                    doc.text(row, 20, yPosition);
                    yPosition += 8;
                });
            } else {
                const lines = doc.splitTextToSize(section.content, 170);
                lines.forEach(line => {
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 30;
                    }
                    doc.text(line, 20, yPosition);
                    yPosition += 8;
                });
            }
            
            yPosition += 10;
        });
        
        doc.save(filename);
    };

    const generateDashboardPDF = () => {
        const mesAtualDate = new Date(state.mesAtual);
        const primeiroDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth() + 1, 0);
        
        const producaoDoMes = (state.producao || []).filter(p => {
            const data = new Date(p.data + 'T00:00:00');
            return data >= primeiroDiaMes && data <= ultimoDiaMes;
        });
        
        const despesasDoMes = (state.despesas || []).filter(d => {
            const data = new Date(d.data + 'T00:00:00');
            return data >= primeiroDiaMes && data <= ultimoDiaMes;
        });
        
        const faturamentoBruto = producaoDoMes.reduce((acc, p) => {
            const valor = (state.valores || []).find(v => v.tipo === p.tipo);
            return acc + (valor ? valor.valor * p.qtd : 0);
        }, 0);
        
        const totalDespesas = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);
        const totalPecas = producaoDoMes.reduce((acc, p) => acc + p.qtd, 0);
        const lucro = faturamentoBruto - totalDespesas;
        
        const content = [
            {
                title: 'Resumo Executivo',
                type: 'text',
                content: `Faturamento: ${formatarMoeda(faturamentoBruto)}\nDespesas: ${formatarMoeda(totalDespesas)}\nLucro: ${formatarMoeda(lucro)}\nPeças Produzidas: ${totalPecas}`
            },
            {
                title: 'Status da Produção',
                type: 'table',
                data: [
                    `Pendente: ${(state.producao || []).filter(p => p.status === 'Pendente').length}`,
                    `Em Andamento: ${(state.producao || []).filter(p => p.status === 'Em Andamento').length}`,
                    `Finalizado: ${(state.producao || []).filter(p => p.status === 'Finalizado').length}`
                ]
            }
        ];
        
        exportToPDF('Dashboard Analítico - DentalFlow', content, 'dashboard-dentalflow.pdf');
    };

    const generateProducaoPDF = () => {
        const producaoFiltrada = getFilteredProducao();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const tableColumns = ["DENTISTA", "TIPO DE TRABALHO", "STATUS", "QTD DE ELEMENTOS", "VALOR TOTAL"];
        const tableRows = [];

        producaoFiltrada.forEach(p => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            const dentistaName = dentista ? dentista.nome : 'Desconhecido';
            const valor = (state.valores || []).find(v => v.tipo === p.tipo);
            const valorTotal = valor ? valor.valor * p.qtd : 0;

            const producaoData = [
                dentistaName,
                p.tipo,
                p.status,
                p.qtd,
                formatarMoeda(valorTotal)
            ];
            tableRows.push(producaoData);
        });

        doc.autoTable(tableColumns, tableRows, { startY: 20 });
        doc.text("Relatório de Produção - DentalFlow", 14, 15);
        doc.save('producao-dentalflow.pdf');
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
                state = {
                    ...state, ...data,
                    mesAtual: data.mesAtual ? new Date(data.mesAtual) : new Date(),
                    despesas: (data.despesas || []).map(d => ({...d, categoria: d.categoria || 'Outros'})),
                    dentistas: data.dentistas || [],
                    notifications: data.notifications || []
                };
            } else {
                state = { 
                    valores: [], 
                    producao: [], 
                    despesas: [], 
                    dentistas: [], 
                    mesAtual: new Date(),
                    notifications: []
                };
                saveDataToFirestore(); 
            }
            renderAllUIComponents();
            updateNotificationUI();
            updateCharts();
            checkForNotifications();
        }, (error) => {
            console.error("Erro ao carregar dados do Firestore:", error);
            showToast("Não foi possível carregar os dados.");
        });
    }

    // --- RENDERIZAÇÃO E LÓGICA DA UI ---
    
    const renderizarDashboard = () => {
        const mesAtualDate = new Date(state.mesAtual);
        const primeiroDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth() + 1, 0);
        const producaoDoMes = (state.producao || []).filter(p => new Date(p.data+'T00:00:00') >= primeiroDiaMes && new Date(p.data+'T00:00:00') <= ultimoDiaMes);
        const despesasDoMes = (state.despesas || []).filter(d => new Date(d.data+'T00:00:00') >= primeiroDiaMes && new Date(d.data+'T00:00:00') <= ultimoDiaMes);
        const faturamentoBruto = producaoDoMes.reduce((acc, p) => acc + ((state.valores || []).find(v => v.tipo === p.tipo)?.valor || 0) * p.qtd, 0);
        const totalDespesas = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);
        kpiFaturamentoMes.textContent = formatarMoeda(faturamentoBruto);
        kpiLucroMes.textContent = formatarMoeda(faturamentoBruto - totalDespesas);
        kpiPecasMes.textContent = producaoDoMes.reduce((acc, p) => acc + p.qtd, 0);
        kpiDespesasMes.textContent = formatarMoeda(totalDespesas);
        statusPendente.textContent = (state.producao || []).filter(p => p.status === 'Pendente').length;
        statusAndamento.textContent = (state.producao || []).filter(p => p.status === 'Em Andamento').length;
        statusFinalizado.textContent = (state.producao || []).filter(p => p.status === 'Finalizado').length;
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const seteDiasDepois = new Date(); seteDiasDepois.setDate(hoje.getDate() + 7);
        const entregas = (state.producao || []).filter(p => { const dataEntrega = new Date(p.entrega + 'T00:00:00'); return p.status !== 'Finalizado' && dataEntrega >= hoje && dataEntrega <= seteDiasDepois; }).sort((a, b) => new Date(a.entrega) - new Date(b.entrega));
        listaEntregasProximas.innerHTML = '';
        if (entregas.length === 0) { listaEntregasProximas.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma entrega próxima</p>'; } 
        else { entregas.forEach(entrega => { const dentista = (state.dentistas || []).find(d => d.id === entrega.dentista); const dentistaName = dentista ? dentista.nome : 'Dentista desconhecido'; const dataEntrega = new Date(entrega.entrega + 'T00:00:00'); const isUrgent = dataEntrega <= hoje; const entregaEl = document.createElement('div'); entregaEl.className = `p-3 rounded-lg border ${isUrgent ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'}`; entregaEl.innerHTML = `<div class="flex justify-between items-center"><div><p class="font-medium">${entrega.tipo}</p><p class="text-sm text-gemini-secondary">${dentistaName}</p></div><div class="text-right"><p class="text-sm font-medium">${dataEntrega.toLocaleDateString('pt-BR')}</p><span class="text-xs px-2 py-1 rounded-full ${isUrgent ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}">${isUrgent ? 'URGENTE' : 'PRÓXIMO'}</span></div></div>`; listaEntregasProximas.appendChild(entregaEl); }); }
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
                
                const producaoEl = document.createElement('div');
                producaoEl.className = 'card-enhanced p-4 hover-scale';
                producaoEl.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gemini-primary">${producao.tipo}</h4>
                            <p class="text-sm text-gemini-secondary">${dentistaName}</p>
                            <p class="text-sm text-gemini-secondary font-medium">Paciente: ${producao.nomePaciente || 'Não informado'}</p>
                            <div class="flex items-center space-x-4 mt-2">
                                <span class="text-sm">Qtd: <span class="font-semibold">${producao.qtd}</span></span>
                                <span class="text-sm">Valor: <span class="font-semibold text-accent-green">${formatarMoeda(valorTotal)}</span></span>
                            </div>
                            <p class="text-xs text-gemini-secondary mt-1">Entrega: ${new Date(producao.entrega).toLocaleDateString('pt-BR')}</p>
                            ${producao.obs ? `<p class="text-xs text-gemini-secondary mt-1">${producao.obs}</p>` : ''}
                        </div>
                        <div class="flex flex-col items-end space-y-2">
                            <span class="status-badge ${statusClass}">${producao.status}</span>
                            <div class="flex space-x-1">
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
    };

    const renderizarProducaoPorDentista = () => {
        const selectedDentistaId = filterDentistaSelect.value;
        producaoDentistaTableBody.innerHTML = '';

        if (!selectedDentistaId) {
            producaoDentistaTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gemini-secondary">Selecione um dentista para começar.</td></tr>';
            return;
        }

        const producaoFiltrada = (state.producao || []).filter(p => p.dentista == selectedDentistaId);

        if (producaoFiltrada.length === 0) {
            producaoDentistaTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gemini-secondary">Nenhuma produção encontrada para este dentista.</td></tr>';
            return;
        }
        
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
            row.innerHTML = `
                <td class="p-3 text-gemini-primary font-medium">${dentistaName}</td>
                <td class="p-3 text-gemini-secondary">${producao.nomePaciente || '-'}</td>
                <td class="p-3 text-gemini-secondary">${producao.tipo}</td>
                <td class="p-3 text-gemini-secondary text-sm">${producao.obs || '-'}</td>
                <td class="p-3 font-semibold ${statusClass}">${producao.status}</td>
                <td class="p-3 text-accent-green font-semibold">${formatarMoeda(valorTotal)}</td>
            `;
            producaoDentistaTableBody.appendChild(row);
        });
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
            dentistaEl.className = 'card-enhanced p-4 hover-scale';
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
        const mesAtualDate = new Date(state.mesAtual);
        mesAnoAtualSpan.textContent = mesAtualDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        const primeiroDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth() + 1, 0);
        
        const producaoDoMes = (state.producao || []).filter(p => {
            const data = new Date(p.data + 'T00:00:00');
            return data >= primeiroDiaMes && data <= ultimoDiaMes;
        });
        
        const despesasDoMes = (state.despesas || []).filter(d => {
            const data = new Date(d.data + 'T00:00:00');
            return data >= primeiroDiaMes && data <= ultimoDiaMes;
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
                    <span class="text-sm font-semibold text-red-400">${formatarMoeda(despesa.valor)}</span>
                `;
                despesasContainer.appendChild(despesaEl);
            });
        }
    };

    const renderizarAnaliseDentista = () => {
        const mesAtualDate = new Date(state.mesAtual);
        const primeiroDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth() + 1, 0);
        
        const producaoDoMes = (state.producao || []).filter(p => {
            const data = new Date(p.data + 'T00:00:00');
            return data >= primeiroDiaMes && data <= ultimoDiaMes;
        });
        
        const analise = {};
        
        producaoDoMes.forEach(p => {
            const dentista = (state.dentistas || []).find(d => d.id === p.dentista);
            const dentistaName = dentista ? dentista.nome : 'Desconhecido';
            const valor = (state.valores || []).find(v => v.tipo === p.tipo);
            const faturamento = valor ? valor.valor * p.qtd : 0;
            
            if (!analise[dentistaName]) {
                analise[dentistaName] = { pecas: 0, faturamento: 0 };
            }
            
            analise[dentistaName].pecas += p.qtd;
            analise[dentistaName].faturamento += faturamento;
        });
        
        // Renderizar tabela
        dentistaSummaryTableBody.innerHTML = '';
        
        Object.entries(analise).forEach(([nome, dados]) => {
            const ticketMedio = dados.pecas > 0 ? dados.faturamento / dados.pecas : 0;
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gemini-border hover:bg-gray-700 transition-colors';
            row.innerHTML = `
                <td class="py-3 text-gemini-primary">${nome}</td>
                <td class="py-3 text-gemini-secondary">${dados.pecas}</td>
                <td class="py-3 text-accent-green font-semibold">${formatarMoeda(dados.faturamento)}</td>
                <td class="py-3 text-gemini-secondary">${formatarMoeda(ticketMedio)}</td>
            `;
            dentistaSummaryTableBody.appendChild(row);
        });
        
        if (Object.keys(analise).length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="py-6 text-center text-gemini-secondary">Nenhum dado encontrado para o mês atual</td>';
            dentistaSummaryTableBody.appendChild(row);
        }
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
                    <span class="text-accent-green font-semibold">${formatarMoeda(valor.valor)}</span>
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
        const mesAtualDate = new Date(state.mesAtual);
        const primeiroDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth(), 1);
        const ultimoDiaMes = new Date(mesAtualDate.getFullYear(), mesAtualDate.getMonth() + 1, 0);
        
        const despesasDoMes = (state.despesas || []).filter(d => {
            const data = new Date(d.data + 'T00:00:00');
            return data >= primeiroDiaMes && data <= ultimoDiaMes;
        });
        
        listaDespesasDetalhada.innerHTML = '';
        
        if (despesasDoMes.length === 0) {
            listaDespesasDetalhada.innerHTML = '<p class="text-center text-gemini-secondary">Nenhuma despesa encontrada</p>';
            return;
        }
        
        despesasDoMes.forEach(despesa => {
            const despesaEl = document.createElement('div');
            despesaEl.className = 'card-enhanced p-4 hover-scale';
            despesaEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gemini-primary">${despesa.desc}</h4>
                        <p class="text-sm text-gemini-secondary">${despesa.categoria}</p>
                        <p class="text-xs text-gemini-secondary mt-1">${new Date(despesa.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-lg font-semibold text-red-400">${formatarMoeda(despesa.valor)}</span>
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
    };

    const renderAllUIComponents = () => {
        renderizarDashboard();
        renderizarProducaoDia();
        renderizarProducaoPorDentista();
        renderizarListaDentistas();
        renderizarResumoMensal();
        renderizarAnaliseDentista();
        renderizarListaValores();
        renderizarSelects();
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
        
        formProducaoTitle.textContent = 'Editar Produção';
        producaoSubmitBtn.textContent = 'Atualizar';
        producaoCancelBtn.classList.remove('hidden');
        
        // Scroll para o formulário
        document.getElementById('form-producao').scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditProducao = () => {
        producaoEditIdInput.value = '';
        formProducao.reset();
        formProducaoTitle.textContent = 'Adicionar Produção';
        producaoSubmitBtn.textContent = 'Adicionar';
        producaoCancelBtn.classList.add('hidden');
        
        // Definir data padrão
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
        
        // Scroll para o formulário
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
        
        formDespesaTitle.textContent = 'Editar Despesa';
        formDespesaSubmitBtn.textContent = 'Atualizar';
        formDespesaCancelBtn.classList.remove('hidden');
        
        // Fechar modal se estiver aberto
        despesasModal.classList.add('hidden');
        
        // Navegar para a view admin
        navigateToView('view-admin');
        
        // Scroll para o formulário
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
        
        // Definir data padrão
        despesaDataInput.valueAsDate = new Date();
    };

    // --- EVENT LISTENERS ---
    
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
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
        if (notificationsDropdown) {
            notificationsDropdown.classList.add('hidden');
        }
    });
    
    // Filtros
    if (searchProducaoInput) {
        searchProducaoInput.addEventListener('input', (e) => {
            state.searchTermProducao = e.target.value;
            renderizarProducaoDia();
        });
    }
    
    if (searchDentistasInput) {
        searchDentistasInput.addEventListener('input', (e) => {
            state.searchTermDentistas = e.target.value;
            renderizarListaDentistas();
        });
    }
    
    if (filterStatusSelect) {
        filterStatusSelect.addEventListener('change', renderizarProducaoDia);
    }
    
    if (filterDataInicio) {
        filterDataInicio.addEventListener('change', renderizarProducaoDia);
    }
    
    if (filterDataFim) {
        filterDataFim.addEventListener('change', renderizarProducaoDia);
    }

    // Event listener para a nova área de produção por dentista
    if (filterDentistaSelect) {
        filterDentistaSelect.addEventListener('change', renderizarProducaoPorDentista);
    }
    
    // Exportação PDF
    if (exportDashboardPdf) {
        exportDashboardPdf.addEventListener('click', generateDashboardPDF);
    }
    
    if (exportProducaoPdf) {
        exportProducaoPdf.addEventListener('click', generateProducaoPDF);
    }
    
    // Ações rápidas
    if (actionAddProducao) {
        actionAddProducao.addEventListener('click', () => navigateToView('view-producao'));
    }
    
    if (actionAddDespesa) {
        actionAddDespesa.addEventListener('click', () => navigateToView('view-admin'));
    }

    // Formulários
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

    formDentistaCancelBtn.addEventListener('click', cancelEditDentista);
    listaDentistas.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-dentista-btn');
        if (editButton) { startEditDentista(parseInt(editButton.dataset.id)); }
        const removeButton = e.target.closest('.remove-dentista-btn');
        if (removeButton) { if (confirm('Tem certeza?')) { state.dentistas = state.dentistas.filter(d => d.id !== parseInt(removeButton.dataset.id)); saveDataToFirestore(); showToast("Dentista removido.", "success"); } }
    });

    formValores.addEventListener('submit', (e) => { e.preventDefault(); const tipo = tipoTrabalhoInput.value.trim(); const valor = parseFloat(valorTrabalhoInput.value); if (tipo && !isNaN(valor)) { state.valores.push({ tipo, valor }); saveDataToFirestore(); formValores.reset(); showToast("Valor adicionado com sucesso!", "success"); } });
    listaValores.addEventListener('click', (e) => { const btn = e.target.closest('.remove-valor-btn'); if (btn) { state.valores.splice(btn.dataset.index, 1); saveDataToFirestore(); showToast("Valor removido.", "success"); } });
    
    formProducao.addEventListener('submit', (e) => { 
        e.preventDefault(); 
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
            entrega: entregaDataInput.value 
        };
        if (producaoData.tipo && producaoData.dentista && producaoData.nomePaciente && producaoData.qtd > 0 && producaoData.data && producaoData.entrega) {
            if (editId) { 
                const index = state.producao.findIndex(p => p.id === editId); 
                if (index !== -1) { 
                    state.producao[index] = producaoData; 
                    showToast("Produção atualizada com sucesso!", "success");
                    addNotification(`Produção atualizada: ${producaoData.tipo}`, 'success');
                } 
            } else { 
                state.producao.push(producaoData); 
                showToast("Produção adicionada com sucesso!", "success");
                addNotification(`Nova produção adicionada: ${producaoData.tipo}`, 'success');
            }
            saveDataToFirestore(producaoSubmitBtn);
            cancelEditProducao();
        } else { showToast("Por favor, preencha todos os campos obrigatórios, incluindo o nome do paciente."); }
    });

    producaoCancelBtn.addEventListener('click', cancelEditProducao);
    listaProducaoDia.addEventListener('click', (e) => { 
        const removeBtn = e.target.closest('.remove-producao-btn');
        if (removeBtn) { if (confirm('Tem certeza?')) { state.producao = state.producao.filter(p => p.id !== parseInt(removeBtn.dataset.id)); saveDataToFirestore(); showToast("Produção removida.", "success"); }}
        const editBtn = e.target.closest('.edit-producao-btn');
        if (editBtn) { startEditProducao(parseInt(editBtn.dataset.id)); }
    });
    producaoDataInput.addEventListener('change', renderizarProducaoDia);
    
    formDespesas.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = despesaEditIdInput.value ? parseInt(despesaEditIdInput.value) : null;
        const despesaData = { id: editId || Date.now(), desc: despesaDescInput.value.trim(), categoria: despesaCategoriaSelect.value, valor: parseFloat(despesaValorInput.value), data: despesaDataInput.value };
        if (despesaData.desc && !isNaN(despesaData.valor) && despesaData.data) {
            if (editId) { 
                const index = state.despesas.findIndex(d => d.id === editId); 
                if (index !== -1) { 
                    state.despesas[index] = despesaData; 
                    showToast("Despesa atualizada com sucesso!", "success"); 
                    addNotification(`Despesa atualizada: ${despesaData.desc}`, 'success');
                } 
            } else { 
                state.despesas.push(despesaData); 
                showToast("Despesa adicionada com sucesso!", "success"); 
                addNotification(`Nova despesa: ${despesaData.desc} - ${formatarMoeda(despesaData.valor)}`, 'info');
            }
            saveDataToFirestore(formDespesaSubmitBtn);
            cancelEditDespesa();
        } else { showToast("Preencha todos os campos da despesa."); }
    });

    formDespesaCancelBtn.addEventListener('click', cancelEditDespesa);
    prevMonthBtn.addEventListener('click', () => { const d = new Date(state.mesAtual); d.setMonth(d.getMonth() - 1); state.mesAtual = d; saveDataToFirestore(); });
    nextMonthBtn.addEventListener('click', () => { const d = new Date(state.mesAtual); d.setMonth(d.getMonth() + 1); state.mesAtual = d; saveDataToFirestore(); });
    verTodasDespesasBtn.addEventListener('click', () => { renderizarListaDespesasDetalhada(); despesasModal.classList.remove('hidden'); });
    closeDespesasModalBtn.addEventListener('click', () => { despesasModal.classList.add('hidden'); });
    listaDespesasDetalhada.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-despesa-btn');
        if (editButton) { startEditDespesa(parseInt(editButton.dataset.id)); }
        const removeButton = e.target.closest('.remove-despesa-btn');
        if (removeButton) { if (confirm('Tem certeza?')) { state.despesas = state.despesas.filter(d => d.id !== parseInt(removeButton.dataset.id)); saveDataToFirestore(); renderizarListaDespesasDetalhada(); showToast("Despesa removida.", "success"); } }
    });

    // --- INICIALIZAÇÃO ---
    const initApp = () => {
        document.querySelectorAll('button[type="submit"]').forEach(button => {
            button.dataset.originalText = button.innerHTML;
        });
        const hoje = new Date();
        producaoDataInput.valueAsDate = hoje;
        entregaDataInput.valueAsDate = hoje;
        despesaDataInput.valueAsDate = hoje;
        
        // Inicializar gráficos
        setTimeout(initializeCharts, 100);
    };

    async function initializeFirebase() {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyDEDzQkvYegnFT2EK7RI_xZxconQ3-Q9GU",
                authDomain: "cad-manager-d7eaf.firebaseapp.com",
                projectId: "cad-manager-d7eaf",
                storageBucket: "cad-manager-d7eaf.firebasestorage.app",
                messagingSenderId: "631779304741",
                appId: "1:631779304741:web:57c388a39cbe1ec32766cc"
            };
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
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