export function InboundConversationalModeLegend() {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
      <p className="mb-2 text-sm font-medium text-foreground">O que significa cada modo (inbound)</p>
      <dl className="space-y-2">
        <div>
          <dt className="font-medium text-foreground">Somente template</dt>
          <dd>
            Usa o texto fixo dos templates da Kokoro, sem chamar a IA. Indicado quando você quer previsibilidade
            total ou a IA está desligada.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">IA personalizada</dt>
          <dd>
            A IA reescreve o template base com tom mais humano, mantendo medicamento, horários e opções Sim/Não.
            Se a IA falhar, cai em regras ou no template original (badge <strong>Regras</strong> ou{" "}
            <strong>Template</strong> na timeline).
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">IA com orientação</dt>
          <dd>
            A IA conduz a conversa a partir do prompt pendente (onboarding, intro de escala, respostas ambíguas).
            Preserva fatos clínicos e opções; ideal para cadastro e escalas com tom conversacional.
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function OutboundContentModeLegend() {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
      <p className="mb-2 text-sm font-medium text-foreground">Modo de conteúdo (lembretes, follow-ups, marcos)</p>
      <dl className="space-y-2">
        <div>
          <dt className="font-medium text-foreground">Somente template</dt>
          <dd>Envia o texto do template sem personalização por IA.</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Somente IA</dt>
          <dd>
            Reescreve lembretes e mensagens proativas com IA (dentro da janela de 24h). Medicamento e pergunta de
            check-in permanecem; botões Sim/Não continuam interativos.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Intercalar template e IA</dt>
          <dd>Alterna entre template e IA a cada envio (por paciente ou por tipo de mensagem).</dd>
        </div>
      </dl>
    </div>
  );
}
