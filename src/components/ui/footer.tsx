import ravyzLogo from "@/assets/ravyz-logo.png";

const Footer = () => {
    return (
        <footer className="border-t border-border/50 bg-muted/30 py-12 px-4">
            <div className="container mx-auto">
                <div className="grid md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                    <img 
                        src={ravyzLogo} 
                        alt="RAVYZ Logo" 
                        className="w-8 h-8 object-contain"
                    />
                    <span className="text-xl font-bold text-foreground">RAVYZ</span>
                    </div>
                    <p className="text-muted-foreground">
                    O futuro do recrutamento está aqui. Conectamos talentos e oportunidades com inteligência artificial.
                    </p>
                </div>
                
                <div>
                    <h4 className="font-semibold text-foreground mb-4">Para Candidatos</h4>
                    <ul className="space-y-2">
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Buscar Vagas</a></li>
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Análise de Currículo</a></li>
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Perfil Profissional</a></li>
                    </ul>
                </div>
    
                <div>
                    <h4 className="font-semibold text-foreground mb-4">Para Empresas</h4>
                    <ul className="space-y-2">
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Publicar Vagas</a></li>
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Encontrar Talentos</a></li>
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a></li>
                    </ul>
                </div>
    
                <div>
                    <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
                    <ul className="space-y-2">
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Central de Ajuda</a></li>
                    <li><a href="/contato" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a></li>
                    <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</a></li>
                    </ul>
                </div>
                </div>
    
                <div className="border-t border-border/50 mt-8 pt-8 text-center">
                <p className="text-muted-foreground">
                    © 2025 RAVYZ. Todos os direitos reservados.
                </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;