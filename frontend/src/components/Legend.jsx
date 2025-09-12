import React, { useState } from 'react';
import './Legend.css';

const Legend = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const statuses = [
    { name: 'OK', color: '#28a745' },
    { name: 'Damaged', color: '#ffc107' },
    { name: 'Destroyed', color: '#dc3545' },
    { name: 'Missing', color: '#6c757d' },
    { name: 'Unknown', color: '#17a2b8' },
  ];

  const sizes = [
    { name: 'Order I', className: 'order-i' },
    { name: 'Order II', className: 'order-ii' },
    { name: 'Order III & IV', className: 'order-iii' },
  ];

  // If the legend is collapsed, show only a button
  if (isCollapsed) {
    return (
      <div className="legend-container collapsed" onClick={() => setIsCollapsed(false)}>
        <span className="legend-toggle-icon">?</span>
        <span>Legend</span>
      </div>
    );
  }

  // If expanded, show the full legend
  return (
    <div className="legend-container">
      <div className="legend-header" onClick={() => setIsCollapsed(true)}>
        <h4>Legend</h4>
        <span>(click to collapse)</span>
      </div>
      <div className="legend-section">
        <h5>Status</h5>
        {statuses.map(status => (
          <div key={status.name} className="legend-item">
            <i className="legend-color-swatch" style={{ backgroundColor: status.color }}></i>
            <span>{status.name}</span>
          </div>
        ))}
      </div>
      <div className="legend-section">
        <h5>Size by Order</h5>
        {sizes.map(size => (
          <div key={size.name} className="legend-item">
            <i className={`legend-size-swatch ${size.className}`}></i>
            <span>{size.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;