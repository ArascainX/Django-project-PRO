import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  NavLink,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import PersonIndex from "./persons/PersonIndex";
import PersonDetail from "./persons/PersonDetail";
import PersonForm from "./persons/PersonForm";
import InvoiceIndex from "./invoices/InvoiceIndex"; 
import InvoiceDetail from "./invoices/InvoiceDetail";
import InvoiceForm from "./invoices/InvoiceForm";
import InvoiceStatistic from "./invoices/InvoiceStatistic";

import Subscribe from "./subscription/Subscribe";
import SubscriptionSuccess from "./subscription/SubscriptionSuccess";
import SubscriptionCancelled from "./subscription/SubscriptionCancelled"; 
import LoginForm from "./login/LoginForm";
import RegisterForm from "./login/RegisterForm";
import Dashboard from "./subscription/DashboardStatus";

export function App() {
  return (
    <Router>
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3">
          <div className="navbar-center">
            <ul className="navbar-nav">
              <li className="nav-item">
                <NavLink
                  to="/persons"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Osoby
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/invoices"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Faktury
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/statistics"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Statistiky
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/subscription"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Předplatné
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Přihlášení
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Registrace
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Profil
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
        
        <Routes>
          <Route index element={<Navigate to="/persons" />} />

          {/* Osoby */}
          <Route path="persons">
            <Route index element={<PersonIndex />} />
            <Route path="show/:id" element={<PersonDetail />} />
            <Route path="create" element={<PersonForm />} />
            <Route path="edit/:id" element={<PersonForm />} />
          </Route>

          {/* Faktury */}
          <Route path="invoices">
            <Route index element={<InvoiceIndex />} />
            <Route path="show/:id" element={<InvoiceDetail />} />
            <Route path="create" element={<InvoiceForm />} />
            <Route path="edit/:id" element={<InvoiceForm />} />
          </Route>

          {/* Statistiky */}
          <Route path="statistics" element={<InvoiceStatistic />} />

          {/* Přihlášení + registrace */}
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Předplatné */}
          <Route path="subscription">
            <Route index element={<Subscribe />} />
            <Route path="success" element={<SubscriptionSuccess />} />
            <Route path="cancelled" element={<SubscriptionCancelled />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
