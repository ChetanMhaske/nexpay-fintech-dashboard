import React from 'react';

const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="card flex items-center space-x-4">
      <div className="p-3 bg-dark-800 rounded-lg">
        <Icon className="w-6 h-6 text-primary-400" />
      </div>
      <div>
        <p className="text-sm text-dark-400 font-medium">{label}</p>
        <h4 className="text-xl font-bold text-dark-100">{value}</h4>
      </div>
    </div>
  );
};

export default StatCard;
