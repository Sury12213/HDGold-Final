import React from "react";
import { FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";
import "./Footer.css";

export const Footer = () => {
  return (
    <div className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <div className="div">
            <div className="text-wrapper">Company</div>

            <div className="links">
              <div className="text-wrapper-2">About Us</div>

              <div className="text-wrapper-2">Careers</div>

              <div className="text-wrapper-2">Contact</div>
            </div>
          </div>

          <div className="div">
            <div className="text-wrapper">Product</div>

            <div className="links">
              <div className="text-wrapper-2">Features</div>

              <div className="text-wrapper-2">Pricing</div>

              <div className="text-wrapper-2">Documentation</div>
            </div>
          </div>

          <div className="div">
            <div className="text-wrapper">Support</div>

            <div className="links">
              <div className="text-wrapper-2">Help Center</div>

              <div className="text-wrapper-2">Community</div>

              <div className="text-wrapper-2">Status</div>
            </div>
          </div>
        </div>

        <div className="bottom-section">
          <div className="divider" />

          <div className="copyright">
            <p className="text-wrapper-2">
              © 2024 Your Company. All rights reserved.
            </p>

            <div className="social-icons">
              <FaFacebook size={20} color="#9ca3af" />
              <FaTwitter size={20} color="#9ca3af" />
              <FaLinkedin size={20} color="#9ca3af" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
