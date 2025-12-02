import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./layouts/DashboardLayout"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { ProductsPage } from "@/pages/ProductsPage"
import { CustomersPage } from "@/pages/CustomersPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { OrdersPage } from "@/pages/OrdersPage"
import { CampaignsPage } from "@/pages/CampaignsPage"
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
                <Route path="/ai-insights" element={<div className="p-8"><h1 className="text-2xl font-bold mb-4">Insights de IA</h1><p className="text-muted-foreground">Em breve...</p></div>} />
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
