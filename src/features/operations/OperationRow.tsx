import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { ListRow, OperationStatusBadge, SignedAmount } from '../../ui';
import { type Operation, operationSign, useOperationTitle } from './operations';
export type { Operation } from './operations';
import { fmtDate } from '../../lib/format';

const OperationIcon: React.FC<{ op: Operation }> = ({ op }) => {
    if (op.type === 'WITHDRAWAL') return <ArrowUpRight className="w-5 h-5" strokeWidth={1.75} aria-hidden />;
    if (op.type === 'INCOME') return <Sparkles className="w-5 h-5 text-positive" strokeWidth={1.75} aria-hidden />;
    return <ArrowDownLeft className="w-5 h-5" strokeWidth={1.75} aria-hidden />;
};

/** Строка операции: иконка · название · дата · сумма со знаком · статус словом и цветом */
export const OperationRow: React.FC<{ op: Operation; onClick?: () => void }> = ({ op, onClick }) => {
    const title = useOperationTitle();
    return (
        <ListRow
            icon={<OperationIcon op={op} />}
            title={title(op)}
            subtitle={fmtDate(op.date, { day: 'numeric', month: 'long' })}
            value={<SignedAmount value={op.amount} sign={operationSign(op)} muted={op.status === 'REJECTED'} />}
            valueSub={<OperationStatusBadge status={op.status} kind={op.type} />}
            onClick={onClick}
        />
    );
};
