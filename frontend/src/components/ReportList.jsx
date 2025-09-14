import React from 'react';
import { useTranslation } from 'react-i18next'; // Import the hook
import './ReportList.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ReportList = ({ reports }) => {
  const { t } = useTranslation(); // Initialize the hook

  if (!reports || reports.length === 0) {
    return <p className="no-reports-message">{t('reportList.noReports')}</p>;
  }

  return (
    <div className="report-list-container">
      <h4>{t('reportList.title')}</h4>
      <ul className="report-list">
        {reports.map((report) => {
          const imageUrl = report.image_url && report.image_url.startsWith('http')
            ? report.image_url
            : `${API_BASE_URL}${report.image_url}`;

          return (
            <li key={report.id} className="report-item">
              <div className="report-header">
                <img src={report.profile_picture_url} alt={report.display_name} className="report-avatar" />
                <div className="report-user-info">
                  <strong>{report.display_name}</strong>
                  <span className="report-date">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className={`status-badge status-${report.status.toLowerCase()}`}>{t(`status.${report.status}`)}</span>
              </div>
              {report.comment && <p className="report-comment">{report.comment}</p>}
              {report.image_url && (
                <div className="report-image-container">
                  <img src={imageUrl} alt="User submission" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ReportList;