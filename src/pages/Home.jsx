import { motion } from "framer-motion";
import Generator from "../components/Generator";
import Header from "../components/Header";
import Container from "../components/ui/Container";
import { Card, CardTitle, CardContent } from "../components/ui/Card";

export default function Home() {
  return (
    <div className="min-h-screen text-white" style={{
      background: "radial-gradient(1200px 800px at 20% -10%, rgba(45,212,191,0.25), transparent), radial-gradient(1000px 600px at 120% 10%, rgba(59,130,246,0.15), transparent)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <Header />
      <main className="py-2 sm:py-2 md:py-2">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="max-w-3xl mx-auto p-1 sm:p-2 md:p-2">
              <CardTitle className="text-base sm:text-lg md:text-xl text-black">Generate Context</CardTitle>
              <CardContent className="mt-3 sm:mt-4">
                <Generator />
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}

