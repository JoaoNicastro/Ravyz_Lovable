import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Rocket, Zap } from 'lucide-react';

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ open, onClose }: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-2 border-primary/20">
        {/* Banner Hero com Gradiente */}
        <div className="relative bg-[image:var(--gradient-hero)] p-12 text-center overflow-hidden">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/30 animate-pulse" />
            <div className="absolute bottom-6 right-6 w-20 h-20 rounded-full bg-white/20 animate-pulse delay-150" />
            <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full bg-white/25 animate-pulse delay-300" />
          </div>

          {/* Ícone Principal */}
          <div className="relative mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-white rounded-full p-6 shadow-lg">
                <Rocket className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Badge de novidades */}
          <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">EM BREVE</span>
            <Zap className="h-4 w-4 text-white" />
          </div>

          {/* Título */}
          <DialogHeader className="space-y-0 relative">
            <DialogTitle className="text-4xl md:text-5xl font-bold text-white mb-4">
              Novidades a Caminho!
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-8 space-y-6 bg-gradient-to-b from-background to-primary/5">
          <DialogDescription className="text-center text-lg leading-relaxed text-foreground">
            Em breve, você poderá fazer <span className="font-semibold text-primary">match com vagas de emprego</span> e 
            descobrir muito mais oportunidades diretamente aqui na plataforma!
          </DialogDescription>

          {/* Grid de Features Preview */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Match Inteligente</p>
            </div>
            <div className="text-center space-y-2 p-4 rounded-lg bg-success/5 border border-success/10">
              <div className="w-12 h-12 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-medium">Vagas Personalizadas</p>
            </div>
            <div className="text-center space-y-2 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary/20 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-secondary-foreground" />
              </div>
              <p className="text-sm font-medium">Muito Mais</p>
            </div>
          </div>

          {/* Mensagem de fechamento */}
          <p className="text-center text-muted-foreground italic">
            Estamos preparando tudo para você. ✨
          </p>

          {/* Botão CTA */}
          <div className="pt-4">
            <Button
              onClick={onClose}
              className="w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
