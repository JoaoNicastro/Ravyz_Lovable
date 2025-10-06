import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string) => void;
  userName?: string;
}

export function AvatarUpload({ currentAvatarUrl, onAvatarChange, userName }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate new dimensions (max 800x800)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Compress image
      const compressedBlob = await compressImage(file);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onAvatarChange(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
      setPreviewUrl(currentAvatarUrl || '');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentAvatarUrl) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Delete from storage
      const path = currentAvatarUrl.split('/').pop();
      if (path) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${path}`]);
      }

      // Update profile
      const { error } = await supabase
        .from('candidate_profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreviewUrl('');
      onAvatarChange('');
      toast.success('Foto removida');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Erro ao remover foto');
    } finally {
      setUploading(false);
    }
  };

  const initials = userName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="flex flex-col items-center gap-4">
      <Label>Foto de Perfil</Label>
      
      <div className="relative">
        <Avatar className="w-32 h-32 border-4 border-border">
          <AvatarImage src={previewUrl} alt={userName} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {previewUrl ? (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Alterar Foto
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Enviar Foto
            </>
          )}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="w-4 h-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG ou WEBP • Máximo 5MB
      </p>
    </div>
  );
}
