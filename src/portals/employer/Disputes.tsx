import { useState } from 'react';
import { DisputeCard } from '../../components/DisputeCard';
import { Button, inputCls } from '../../components/ui';
import { useT } from '../../i18n';
import { respondToDispute, useDb } from '../../api/store';
import type { Dispute, Employer } from '../../domain/types';

function Respond({ d, actor }: { d: Dispute; actor: string }) {
  const { t } = useT();
  const [text, setText] = useState('');
  return (
    <div className="space-y-2">
      <textarea className={inputCls} rows={2} placeholder={t('disputes.responsePlaceholder')} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('disputes.responsePlaceholder')} />
      <div className="flex flex-wrap gap-2">
        <Button disabled={!text.trim()} onClick={() => respondToDispute(d.id, 'accepted', text, actor)}>✓ {t('disputes.accept')}</Button>
        <Button variant="secondary" disabled={!text.trim()} onClick={() => respondToDispute(d.id, 'rejected', text, actor)}>{t('disputes.reject')}</Button>
      </div>
    </div>
  );
}

export default function Disputes({ employer }: { employer: Employer }) {
  const { t } = useT();
  const db = useDb();
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const mine = db.disputes.filter((d) => d.employerId === employer.id);
  const list = mine.filter((d) => (tab === 'open' ? d.status === 'employer_review' || d.status === 'submitted' : d.status === 'resolved' || d.status === 'escalated'));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('disputes.title')}</h1>
      <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        {(['open', 'closed'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-md px-4 py-1.5 font-medium ${tab === k ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
            {t(`disputes.${k}`)}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-slate-500">{t('disputes.empty')}</p>}
      <div className="space-y-4">
        {list.map((d) => (
          <DisputeCard key={d.id} d={d} who="employer">
            {d.status === 'employer_review' && <Respond d={d} actor={employer.representative} />}
          </DisputeCard>
        ))}
      </div>
    </div>
  );
}
