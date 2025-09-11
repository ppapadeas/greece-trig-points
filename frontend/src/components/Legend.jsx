import React from 'react';
import './Legend.css';

const Legend = () => {
  const statuses = [
    { name: 'OK', color: '#28a745' },
    { name: 'Damaged', color: '#ffc107' },
    { name: 'Destroyed', color: '#dc3545' },
    { name: 'Missing', color: '#6c757d' },
    { name: 'Unknown', color: '#17a2b8' },
  ];

  return (
    <div className="legend-container">
      <h4>Status Legend</h4>
      {statuses.map(status => (
        <div key={status.name} className="legend-item">
          <i style={{ backgroundColor: status.color }}></i>
          <span>{status.name}</span>
        </div>
      ))}
    </div>
  );
};

export default Legend;