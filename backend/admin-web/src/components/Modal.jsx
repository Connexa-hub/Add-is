
import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type = 'info',
  showFooter = true,
  primaryAction,
  secondaryAction,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={32} color="white" />;
      case 'error':
        return <XCircle size={32} color="white" />;
      case 'warning':
        return <AlertTriangle size={32} color="white" />;
      default:
        return <Info size={32} color="white" />;
    }
  };

  const sizeClasses = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1000px' }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        style={sizeClasses[size]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {type !== 'default' && (
            <div className={`modal-icon ${type}`}>
              {getIcon()}
            </div>
          )}
          {children}
        </div>

        {showFooter && (
          <div className="modal-footer">
            {secondaryAction && (
              <button 
                className="btn btn-secondary" 
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button 
                className={`btn ${primaryAction.variant || 'btn-primary'}`}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
