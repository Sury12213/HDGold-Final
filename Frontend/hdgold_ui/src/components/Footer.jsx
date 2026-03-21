import React from 'react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Documentation</a>
            <a href="#">API</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Community</a>
            <a href="#">Status</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 HDGold. All rights reserved.</span>
          <span className="footer-chain">Built on BNB Smart Chain</span>
        </div>
      </div>
    </footer>
  );
};
