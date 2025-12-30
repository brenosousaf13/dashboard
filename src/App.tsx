import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./layouts/DashboardLayout"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { ProductsPage } from "@/pages/ProductsPage"
import { CustomersPage } from "@/pages/CustomersPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { OrdersPage } from "@/pages/OrdersPage"
import { CampaignsPage } from "@/pages/CampaignsPage"
import { GoogleAnalyticsPage } from "@/pages/GoogleAnalyticsPage"
import { DataProvider } from "./context/DataContext"
import { AuthProvider } from "./context/AuthContext"
import { LoginPage } from "./pages/auth/LoginPage"
import { RegisterPage } from "./pages/auth/RegisterPage"
import { PrivateRoute } from "./components/PrivateRoute"



function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/analytics" replace />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/google-analytics" element={<GoogleAnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
