export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className="rounded-xl border px-4 py-3 text-sm"
      style={{
        background: "var(--warn-bg)",
        color: "var(--warn-fg)",
        borderColor: "var(--warn-border)",
      }}
    >
      <strong>Aviso:</strong> esta aplicação é uma ferramenta de apoio pessoal e{" "}
      <strong>não substitui</strong> acompanhamento médico ou nutricional profissional.
      {!compact && (
        <>
          {" "}
          Qualquer mudança de dose de GLP-1, sintomas novos (náuseas persistentes, vómitos,
          dor abdominal intensa, sinais de desidratação) ou dúvidas sobre medicação devem ser
          discutidos com o médico ou nutricionista.
        </>
      )}
    </div>
  );
}
