import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const AllowedDomains = [
  'https://ravyz.com', 
  'https://wmwpjbagtohitynxoqqx.supabase.co', 
  'http://localhost'
];

const DirectEmailSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  type: z.enum(['signup', 'password_reset', 'email_change'], {
    errorMap: () => ({ message: 'Invalid email type' })
  }),
  redirectUrl: z.string().url('Invalid redirect URL').refine(
    (url) => AllowedDomains.some(domain => url.startsWith(domain)),
    'Redirect URL must be from an allowed domain'
  ),
});

// Supabase Auth Hook payload format
interface SupabaseAuthHookPayload {
  user: {
    id: string;
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

// Direct call format (for testing)
interface AuthEmailRequest {
  email: string;
  type: "signup" | "password_reset" | "email_change";
  redirectUrl: string;
  token?: string;
}

const getEmailTemplate = (type: string, redirectUrl: string): { subject: string; html: string } => {
  const templates = {
    signup: {
      subject: "Confirme seu cadastro na Ravyz",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Bem-vindo(a) à Ravyz!</h2>
          <p>Olá 👋</p>
          <p>Obrigado por se cadastrar! Confirme seu e-mail clicando no botão abaixo:</p>
          <a href="${redirectUrl}" 
             style="display:inline-block;padding:12px 24px;margin-top:16px;background-color:#FF8C00;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
             Confirmar acesso
          </a>
          <p style="margin-top:24px;font-size:12px;color:#999;">
            Caso não tenha solicitado este e-mail, ignore-o.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size:11px;color:#999;">
            © ${new Date().getFullYear()} Ravyz. Todos os direitos reservados.
          </p>
        </div>
      `,
    },
    password_reset: {
      subject: "Redefinição de senha - Ravyz",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Redefinir sua senha</h2>
          <p>Olá 👋</p>
          <p>Você solicitou a redefinição de senha da sua conta Ravyz. Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${redirectUrl}" 
             style="display:inline-block;padding:12px 24px;margin-top:16px;background-color:#FF8C00;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
             Redefinir senha
          </a>
          <p style="margin-top:24px;font-size:12px;color:#999;">
            Se você não solicitou esta redefinição, ignore este e-mail. Sua senha permanecerá inalterada.
          </p>
          <p style="font-size:12px;color:#999;">
            Este link expira em 1 hora por segurança.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size:11px;color:#999;">
            © ${new Date().getFullYear()} Ravyz. Todos os direitos reservados.
          </p>
        </div>
      `,
    },
    email_change: {
      subject: "Confirme a alteração de e-mail - Ravyz",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Confirme seu novo e-mail</h2>
          <p>Olá 👋</p>
          <p>Você solicitou a alteração do e-mail da sua conta Ravyz. Clique no botão abaixo para confirmar esta mudança:</p>
          <a href="${redirectUrl}" 
             style="display:inline-block;padding:12px 24px;margin-top:16px;background-color:#FF8C00;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
             Confirmar novo e-mail
          </a>
          <p style="margin-top:24px;font-size:12px;color:#999;">
            Se você não solicitou esta alteração, entre em contato com nosso suporte imediatamente.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size:11px;color:#999;">
            © ${new Date().getFullYear()} Ravyz. Todos os direitos reservados.
          </p>
        </div>
      `,
    },
  };

  return templates[type as keyof typeof templates] || templates.signup;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    let email: string;
    let type: string;
    let redirectUrl: string;

    // Check if this is a Supabase Auth Hook payload or a direct call
    if (payload.user && payload.email_data) {
      // Supabase Auth Hook format
      const hookPayload = payload as SupabaseAuthHookPayload;
      email = hookPayload.user.email;
      redirectUrl = hookPayload.email_data.redirect_to;
      
      // Map email_action_type to our type format
      const actionTypeMap: Record<string, string> = {
        'signup': 'signup',
        'magiclink': 'signup',
        'recovery': 'password_reset',
        'email_change': 'email_change',
        'invite': 'signup'
      };
      
      type = actionTypeMap[hookPayload.email_data.email_action_type] || 'signup';
      
      console.log(`[Auth Hook] Sending ${type} email to ${email}`);
      console.log(`[Auth Hook] Action type: ${hookPayload.email_data.email_action_type}`);
    } else {
      // Direct call format - validate input
      const directPayload = payload as AuthEmailRequest;
      
      const validationResult = DirectEmailSchema.safeParse(directPayload);
      if (!validationResult.success) {
        console.error('Input validation failed:', validationResult.error);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid request parameters',
            success: false
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      email = validationResult.data.email;
      type = validationResult.data.type;
      redirectUrl = validationResult.data.redirectUrl;
      
      console.log(`[Direct Call] Sending ${type} email to ${email}`);
    }

    if (!email || !type || !redirectUrl) {
      throw new Error("Missing required fields: email, type, or redirectUrl");
    }

    const { subject, html } = getEmailTemplate(type, redirectUrl);

    const emailResponse = await resend.emails.send({
      from: "Ravyz <noreply@ravyz.com>",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.id 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-auth-email function (detailed):", error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email. Please try again.',
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
