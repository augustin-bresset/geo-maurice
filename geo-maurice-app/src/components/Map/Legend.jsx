import React from 'react';

export const Legend = () => {
    return (
        <div style={{
            position: 'absolute',
            bottom: 30,
            right: 10,
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            fontSize: '12px',
            fontFamily: 'sans-serif',
            color: '#333'
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                Accessibilité
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'blue', fontWeight: 500 }}>Éloigné</span>
                <div style={{
                    width: '120px',
                    height: '12px',
                    background: 'linear-gradient(to right, blue, cyan, lime, yellow, red)',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                }} />
                <span style={{ color: 'red', fontWeight: 500 }}>Proche</span>
            </div>
            <div style={{ marginTop: '5px', fontSize: '10px', color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                (Estimation temporelle)
            </div>
        </div>
    );
};
