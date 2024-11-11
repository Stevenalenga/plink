import React from 'react';

interface ErrorMessageProps {
    message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div style={{ color: 'red', fontWeight: 'bold', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
            check your internet connection 
        <button onClick={() => window.location.reload()} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '3px' }}>
            Reload
        </button>
        </div>
    );
};

export default ErrorMessage;