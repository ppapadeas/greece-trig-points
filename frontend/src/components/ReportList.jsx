import React from 'react';
import './ReportList.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ReportList = ({ reports }) => {
  if (reports.length === 0) {
    return <p className="no-reports-message">No reports yet for this point.</p>;
  }

  return (
    <div className="report-list-container">
      <h4>Report History</h4>
      <ul className="report-list">
        {reports.map((report) => (
          <li key={report.id} className="report-item">
            <div className="report-header">
              <img src={report.profile_picture_url} alt={report.display_name} className="report-avatar" />
              <div className="report-user-info">
                <strong>{report.display_name}</strong>
                <span className="report-date">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <span className={`status-badge status-${report.status.toLowerCase()}`}>{report.status}</span>
            </div>
            {report.comment && <p className="report-comment">{report.comment}</p>}
            {report.image_url && (
              <div className="report-image-container">
                <img src={`${API_BASE_URL}${report.image_url}`} alt="User submission" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReportList;