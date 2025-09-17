import { motion } from "framer-motion";
import AdminPanel from "../components/AdminPanel";
import MetricsCard from "../components/MetricsCard";
import UsageMetricsCard from "../components/UsageMetricsCard";
import AdminSetupGuide from "../components/AdminSetupGuide";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Container from "../components/ui/Container";
import { Card } from "../components/ui/Card";

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();

  return (
    <div className="min-h-screen text-white" style={{
      background: "radial-gradient(1200px 800px at 20% -10%, rgba(45,212,191,0.25), transparent), radial-gradient(1000px 600px at 120% 10%, rgba(59,130,246,0.15), transparent)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <Header />

      <Container className="py-4 sm:py-6 md:py-8">
        <motion.div
          className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className=""
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card className="p-4 sm:p-5 md:p-6">
              <AdminPanel />
            </Card>
          </motion.div>
          <motion.div
            className=""
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="p-4 sm:p-5 md:p-6">
              <UsageMetricsCard />
            </Card>
          </motion.div>
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card className="p-4 sm:p-5 md:p-6">
              <MetricsCard />
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}