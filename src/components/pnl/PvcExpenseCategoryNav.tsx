import {
  PVC_EXPENSE_SECTIONS,
  expenseHeadLabelLines,
  expenseHeadTabLabel,
  getPvcExpenseHeadsForSection,
  type PvcExpenseSection,
} from "@/lib/plant-catalogs";

type PvcExpenseCategoryNavProps = {
  section: PvcExpenseSection;
  category: string;
  sectionHeads: string[];
  onSectionChange: (next: PvcExpenseSection) => void;
  onCategoryChange: (head: string) => void;
};

export function PvcExpenseCategoryNav({
  section,
  category,
  sectionHeads,
  onSectionChange,
  onCategoryChange,
}: PvcExpenseCategoryNavProps) {
  return (
    <div className="pnl-expense-navigation-group">
      <div
        className="pnl-tab-nav pnl-tab-nav--fit pnl-expense-type-nav"
        role="tablist"
        aria-label="Expense section"
      >
        {PVC_EXPENSE_SECTIONS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            role="tab"
            aria-selected={section === entry.value}
            className={section === entry.value ? "is-active" : undefined}
            onClick={() => onSectionChange(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div
        className={`pnl-tab-nav pnl-expense-cat-nav pnl-expense-cat-nav--cols-${sectionHeads.length}`}
        role="tablist"
        aria-label={
          section === "direct"
            ? "Direct expense types"
            : "Indirect expense types"
        }
      >
        {sectionHeads.map((head) => {
          const lines = expenseHeadLabelLines(head);
          const shortLabel = expenseHeadTabLabel(head);
          return (
            <button
              key={head}
              type="button"
              role="tab"
              aria-label={head}
              title={head}
              aria-selected={category === head}
              className={category === head ? "is-active" : undefined}
              onClick={() => onCategoryChange(head)}
            >
              {lines ? (
                <>
                  <span className="pnl-expense-cat-label--full">{head}</span>
                  <span className="pnl-expense-cat-label--stacked pnl-tab-nav__stacked">
                    <span>{lines[0]}</span>
                    <span>{lines[1]}</span>
                  </span>
                </>
              ) : shortLabel !== head ? (
                <>
                  <span className="pnl-expense-cat-label--full">{head}</span>
                  <span className="pnl-expense-cat-label--short">
                    {shortLabel}
                  </span>
                </>
              ) : (
                head
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function headsForSection(section: PvcExpenseSection): string[] {
  return [...getPvcExpenseHeadsForSection(section)];
}