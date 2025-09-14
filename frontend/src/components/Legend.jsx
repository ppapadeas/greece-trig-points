import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import the hook
import './Legend.css';

const Legend = () => {
  const { t } = useTranslation(); // Initialize the hook
  const [isCollapsed, setIsCollapsed] = useState(true);

  const statuses = [
    { name: t('status.OK'), color: '#28a745' },
    { name: t('status.DAMAGED'), color: '#ffc107' },
    { name: t('status.DESTROYED'), color: '#dc3545' },
    { name: t('status.MISSING'), color: '#6c757d' },
    { name: t('status.UNKNOWN'), color: '#17a2b8' },
  ];

  const sizes = [
    { name: t('legend.order1'), className: 'order-i' },
    { name: t('legend.order2'), className: 'order-ii' },
    { name: t('legend.order34'), className: 'order-iii' },
  ];

  if (isCollapsed) {
    return (
      <div className="legend-container collapsed" onClick={() => setIsCollapsed(false)}>
        <span className="legend-toggle-icon">?</span>
        <span>{t('legend.title')}</span>
      </div>
    );
  }

  return (
    <div className="legend-container">
      <div className="legend-header" onClick={() => setIsCollapsed(true)}>
        <h4>{t('legend.title')}</h4>
        <span>{t('legend.toggle')}</span>
      </div>
      <div className="legend-section">
        <h5>{t('legend.statusTitle')}</h5>
        {statuses.map(status => (
          <div key={status.name} className="legend-item">
            <i className="legend-color-swatch" style={{ backgroundColor: status.color }}></i>
            <span>{status.name}</span>
          </div>
        ))}
      </div>
      <div className="legend-section">
        <h5>{t('legend.sizeTitle')}</h5>
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