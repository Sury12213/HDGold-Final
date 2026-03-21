import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  Landmark,
  Ticket,
  ShieldCheck,
  Droplets,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { PRICE_FEEDER_ADDRESS, PRICE_FEEDER_ABI } from '../constants';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/mint', label: 'Mint', icon: ArrowUpCircle },
  { path: '/burn', label: 'Burn', icon: ArrowDownCircle },
  { path: '/redeem', label: 'Redeem', icon: Gift },
  { path: '/staking', label: 'Staking', icon: Landmark },
  { path: '/voucher', label: 'Voucher', icon: Ticket },
  { path: '/verification', label: 'KYC', icon: ShieldCheck },
  { path: '/faucet', label: 'Faucet', icon: Droplets },
];

export const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chiPrice, setChiPrice] = useState(null);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Fetch gold price
  useEffect(() => {
    const fetchChiPrice = async () => {
      try {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(PRICE_FEEDER_ADDRESS, PRICE_FEEDER_ABI, provider);
        const value = await contract.getChiVnd();
        const price = Number(ethers.formatUnits(value, 18));
        setChiPrice(price.toFixed(0));
      } catch (err) {
        console.error('Error fetching chi price:', err);
      }
    };
    fetchChiPrice();
    const interval = setInterval(fetchChiPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="HDGold" className="logo-icon" />
            {!collapsed && <span className="logo-text">HDGold</span>}
          </div>
          <button className="collapse-btn desktop-only" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button className="close-btn mobile-only" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Gold Price */}
        {!collapsed && (
          <div className="gold-price-card">
            <span className="price-label">Giá vàng / chỉ</span>
            <span className="price-value">
              {chiPrice ? `${Number(chiPrice).toLocaleString()} ₫` : '-- ₫'}
            </span>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <Icon size={20} className="nav-icon" />
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="sidebar-footer">
            <div className="network-badge">
              <span className="network-dot" />
              BSC Testnet
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className={`main-area ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header */}
        <header className="top-header">
          <button className="menu-btn mobile-only" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="header-left">
            <div className="mobile-logo mobile-only">
              <img src="/logo.png" alt="HDGold" style={{ width: 28, height: 28 }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold-500)' }}>
                HDGold
              </span>
            </div>
          </div>
          <div className="header-right">
            {chiPrice && (
              <div className="header-price desktop-only">
                <span className="price-dot" />
                <span>{Number(chiPrice).toLocaleString()} ₫/chỉ</span>
              </div>
            )}
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <ConnectButton
              chainStatus="icon"
              accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
              showBalance={{ smallScreen: false, largeScreen: true }}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav mobile-only">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
