export const CURRENT_APP_VERSION = '1.1.0';

export const PATCH_NOTES_CONTENT = `
    <div class="space-y-4">
        <div class="border-l-4 border-accent-green pl-3">
            <span class="inline-block bg-accent-green bg-opacity-20 text-accent-green text-xs font-bold px-2 py-1 rounded mb-1">[NOVO] Cobranças com PIX Automático</span>
            <p class="text-sm text-gemini-secondary">Selecione trabalhos específicos via checkbox para gerar a nota do dentista. O PDF gerado já inclui o QR Code do PIX com o valor exato da cobrança! <br><br><span class="text-accent-purple font-semibold">Dica:</span> Lembre-se de configurar sua Chave PIX, Nome e Cidade na aba <b>Admin</b> para ativar a geração do QR Code.</p>
        </div>

        <div class="border-l-4 border-accent-green pl-3">
            <span class="inline-block bg-accent-green bg-opacity-20 text-accent-green text-xs font-bold px-2 py-1 rounded mb-1">[NOVO] Nova Central de Exportação</span>
            <p class="text-sm text-gemini-secondary">Ao clicar em "Exportar PDF" em qualquer tela, um novo menu permitirá escolher entre o relatório completo do mês ou uma nota personalizada.</p>
        </div>

        <div class="border-l-4 border-accent-purple pl-3">
            <span class="inline-block bg-accent-purple bg-opacity-20 text-accent-purple text-xs font-bold px-2 py-1 rounded mb-1">[MELHORIA] PDFs com Design Profissional</span>
            <p class="text-sm text-gemini-secondary">Reformulamos o layout dos relatórios e notas de cobrança. Agora eles seguem a identidade visual do laboratório, transmitindo mais credibilidade.</p>
        </div>

        <div class="border-l-4 border-red-500 pl-3">
            <span class="inline-block bg-red-500 bg-opacity-20 text-red-400 text-xs font-bold px-2 py-1 rounded mb-1">[CORREÇÃO] Ajuste de Margens nas Tabelas</span>
            <p class="text-sm text-gemini-secondary">Corrigimos o problema (aviso de "width could not fit page") onde tabelas mais largas acabavam cortando textos na impressão do PDF.</p>
        </div>

        <div class="border-l-4 border-accent-purple pl-3">
            <span class="inline-block bg-accent-purple bg-opacity-20 text-accent-purple text-xs font-bold px-2 py-1 rounded mb-1">[MELHORIA] Interface Mais Limpa</span>
            <p class="text-sm text-gemini-secondary">Removemos botões duplicados e aprimoramos o fluxo de cliques para deixar o uso diário mais fluido e organizado.</p>
        </div>
    </div>
`;
