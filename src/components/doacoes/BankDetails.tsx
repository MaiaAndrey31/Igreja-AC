interface BankDetailsProps {
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  bankHolder: string;
}

export function BankDetails({ bankName, bankAgency, bankAccount, bankHolder }: BankDetailsProps) {
  const rows = [
    { label: "Banco", value: bankName },
    { label: "Agência", value: bankAgency },
    { label: "Conta", value: bankAccount },
    { label: "Titular", value: bankHolder },
  ];

  return (
    <div className="bg-background p-6 sm:p-7">
      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-subtle">Transferência bancária</p>
      <dl className="mt-4 flex flex-col divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-foreground-subtle">{row.label}</dt>
            <dd className="font-data text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
