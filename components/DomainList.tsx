
import React from 'react';
import type { AssessmentSession } from '../types';
import { DomainStatus } from '../types';
import { Icon } from './Icon';

interface DomainListProps {
  session: AssessmentSession;
  onStartDomain: (domainIndex: number) => void;
}

const statusInfo = {
  [DomainStatus.NOT_STARTED]: { icon: 'lock-open', color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Not Started' },
  [DomainStatus.IN_PROGRESS]: { icon: 'pencil', color: 'text-primary', bgColor: 'bg-primary/10', label: 'In Progress' },
  [DomainStatus.COMPLETED]: { icon: 'check-circle', color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Completed' },
  [DomainStatus.MASTERED]: { icon: 'star', color: 'text-secondary', bgColor: 'bg-secondary/10', label: 'Mastered' },
  [DomainStatus.STRUGGLING]: { icon: 'exclamation-circle', color: 'text-red-600', bgColor: 'bg-red-100', label: 'Struggling' },
};

export const DomainList: React.FC<DomainListProps> = ({ session, onStartDomain }) => {
  const canAccessDomain = (index: number) => {
    if (index === 0) return true;
    const prevStatus = session.domain_assessments[index - 1].status;
    return prevStatus !== DomainStatus.NOT_STARTED && prevStatus !== DomainStatus.IN_PROGRESS;
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border">
      <h3 className="font-bold text-lg mb-4 text-on-surface">Knowledge Domains: {session.main_topic}</h3>
      <ul className="space-y-3">
        {session.domain_assessments.map((domain, index) => {
          const isAccessible = canAccessDomain(index);
          const { icon, color, bgColor, label } = statusInfo[domain.status];
          const isActive = session.current_domain_index === index;

          return (
            <li key={index}>
              <button
                onClick={() => onStartDomain(index)}
                disabled={!isAccessible || domain.status !== DomainStatus.NOT_STARTED}
                className={`w-full text-left p-4 rounded-lg flex items-start gap-4 transition-all duration-200 ${
                  isActive ? 'ring-2 ring-primary bg-white shadow-md' : 'bg-white'
                } ${
                  isAccessible && domain.status === DomainStatus.NOT_STARTED
                    ? 'hover:bg-primary/5 hover:shadow-sm cursor-pointer'
                    : 'cursor-not-allowed'
                } disabled:opacity-70`}
              >
                <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${bgColor}`}>
                    <Icon name={icon} className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-on-surface">{session.domain_list[index].domain_name}</p>
                  <p className="text-sm text-on-surface-variant">{session.domain_list[index].description}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${domain.progress}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-on-surface-variant whitespace-nowrap bg-gray-200 px-2 py-0.5 rounded-full">
                      Diff: {Math.round(domain.current_difficulty)}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
