import React from 'react';

const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="card flex flex-col justify-between hover:bg-white/[0.02] transition-colors duration-200 cursor-default">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-medium text-dark-400 uppercase tracking-wider text-xs">{label}</p>
        <Icon className="w-5 h-5 text-dark-500" />
      </div>
      <div>
        <h4 className="text-2xl font-sans font-semibold text-dark-100 tabular-nums tracking-tight">{value}</h4>
      </div>
    </div>
  );
};

export default StatCard;
