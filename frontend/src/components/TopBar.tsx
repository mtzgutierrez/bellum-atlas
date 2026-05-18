import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";
import styles from "./TopBar.module.css";

const navLinks = [
  { to: "/map", label: "Mapa" },
  { to: "/battles", label: "Batallas" },
  { to: "/wars", label: "Guerras" },
  { to: "/commanders", label: "Comandantes" },
  { to: "/timeline", label: "Cronología" },
];

interface TopBarDesktopProps {
  compact?: boolean;
}

export function TopBarDesktop({ compact = false }: TopBarDesktopProps) {
  const location = useLocation();
  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <Logo />
      </Link>
      <nav className={styles.nav}>
        {navLinks.map((L) => (
          <Link
            key={L.to}
            to={L.to}
            className={`ax-nav-link ${location.pathname.startsWith(L.to) ? "active" : ""}`}
          >
            {L.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function TopBarMobile() {
  return (
    <header className={styles.headerMobile}>
      <Link to="/" style={{ textDecoration: "none" }}>
        <Logo size={16} />
      </Link>
      <div className={styles.mobileIcons}>
        <Icon name="search" size={18} />
        <Icon name="menu" size={18} />
      </div>
    </header>
  );
}
