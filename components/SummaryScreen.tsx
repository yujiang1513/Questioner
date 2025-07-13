
import React from 'react';
import type { FinalReport } from '../types';
import { RadarChartComponent } from './RadarChartComponent';
import { Icon } from './Icon';

interface SummaryScreenProps {
  report: FinalReport;
  onRestart: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ report, onRestart }) => {
  const chartData = Object.entries(report.detailed_breakdown).map(([name, data]) => ({
    subject: name.replace(/ for .*/, ''), // Shorten long names
    score: (data as any).score,
    fullMark: 100,
  }));

  return (
    <div className="animate-fade-in p-1 sm:p-4">
      <h2 className="text-3xl font-bold text-center text-primary mb-2">{report.title}</h2>
      <p className="text-center text-on-surface-variant mb-8">
        A detailed analysis of your performance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-center">
        <MetricCard icon="star" label="Overall Score" value={`${report.overall_score}%`} color="primary"/>
        <MetricCard icon="award" label="Knowledge Level" value={report.knowledge_level} color="secondary"/>
        <MetricCard icon="check-circle" label="Domains Assessed" value={report.domains_assessed} color="accent"/>
        <MetricCard icon="clock" label="Total Time" value={`${report.total_time_minutes} min`} color="blue-500"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-1">
          <RadarChartComponent data={chartData} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <InfoSection icon="trending-up" title="Strengths" items={report.strengths} color="secondary"/>
          <InfoSection icon="trending-down" title="Areas for Improvement" items={report.areas_for_improvement} color="red-500"/>
          <InfoSection icon="bulb" title="Recommendations" items={report.recommendations} color="primary"/>
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-center text-primary mb-6">Detailed Domain Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(report.detailed_breakdown).map(([domain, feedback]) => (
                <DomainFeedbackCard key={domain} domainName={domain} feedback={feedback as any} />
            ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <button
          onClick={onRestart}
          className="bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-transform transform hover:scale-105"
        >
          Take Another Assessment
        </button>
      </div>
    </div>
  );
};


interface MetricCardProps {
    icon: string;
    label: string;
    value: string | number;
    color: 'primary' | 'secondary' | 'accent' | 'blue-500';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, color }) => {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        accent: 'bg-accent/10 text-accent',
        'blue-500': 'bg-blue-100 text-blue-500'
    }
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                <Icon name={icon} className="w-6 h-6"/>
            </div>
            <p className="text-3xl font-bold mt-2 text-on-surface">{value}</p>
            <p className="text-sm text-on-surface-variant mt-1">{label}</p>
        </div>
    )
}

interface InfoSectionProps {
    icon: string;
    title: string;
    items: string[];
    color: 'primary' | 'secondary' | 'red-500' | 'accent';
}

const InfoSection: React.FC<InfoSectionProps> = ({ icon, title, items, color }) => {
    const colorClasses = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        'red-500': 'text-red-500',
        accent: 'text-accent',
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
                <Icon name={icon} className={`w-6 h-6 ${colorClasses[color]}`}/>
                <h3 className="text-xl font-bold text-on-surface">{title}</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-on-surface-variant">
                {items.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

interface DomainFeedbackCardProps {
    domainName: string;
    feedback: {
        score: number;
        status: string;
        key_strengths: string[];
        improvement_areas: string[];
    };
}

const DomainFeedbackCard: React.FC<DomainFeedbackCardProps> = ({ domainName, feedback }) => {
    const statusColor = feedback.status.toLowerCase() === 'mastered' ? 'text-secondary' : feedback.status.toLowerCase() === 'struggling' ? 'text-red-500' : 'text-yellow-600';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
            <div className="flex justify-between items-start mb-1">
                <h4 className="text-lg font-bold text-on-surface pr-2">{domainName.replace(/ for .*/, '')}</h4>
                <span className={`font-bold text-lg flex-shrink-0 ${statusColor}`}>{Math.round(feedback.score)}%</span>
            </div>
            <p className={`text-sm font-semibold capitalize mb-4 ${statusColor}`}>{feedback.status}</p>

            {feedback.key_strengths?.length > 0 && (
                 <div className="mb-4">
                    <h5 className="font-semibold text-sm text-secondary mb-2 flex items-center gap-2">
                        <Icon name="trending-up" className="w-4 h-4" />
                        Key Strengths
                    </h5>
                    <ul className="list-disc list-inside text-sm text-on-surface-variant space-y-1">
                        {feedback.key_strengths.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            )}

            {feedback.improvement_areas?.length > 0 && (
                <div>
                    <h5 className="font-semibold text-sm text-red-500 mb-2 flex items-center gap-2">
                        <Icon name="trending-down" className="w-4 h-4" />
                        Improvement Areas
                    </h5>
                    <ul className="list-disc list-inside text-sm text-on-surface-variant space-y-1">
                        {feedback.improvement_areas.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            )}
        </div>
    )
}
