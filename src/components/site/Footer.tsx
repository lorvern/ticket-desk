export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-lg font-semibold">TicketDesk</p>
          <p className="text-sm text-muted-foreground">Premium event ticketing in Ghana.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TicketDesk. Payments secured by Paystack.
        </p>
      </div>
    </footer>
  );
}
