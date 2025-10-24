import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const Contato = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* This ensures the content expands and pushes footer to the bottom */}
      <main className="flex-1">
        <section id="features" className="py-20 px-4 bg-muted/30">
          <div className="flex flex-col items-center justify-center">
            <Card className="w-full max-w-md shadow-lg">
              <CardContent className="p-12 text-center space-y-6">
                <h3 className="text-2xl font-semibold text-foreground">
                  Informações de Contato
                </h3>
                <p className="text-muted-foreground">
                  Entre em contato conosco para saber mais sobre nossos serviços e soluções em IA avançada.
                </p>

                <div className="text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">contato@empresa.ai</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">+55 (11) 99999-9999</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">
                      Rua das Inovações, 123 — São Paulo, SP
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">
                      Atendimento: Seg–Sex, 9h às 18h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contato;
